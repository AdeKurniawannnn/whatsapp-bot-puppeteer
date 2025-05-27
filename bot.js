require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fetch = require('node-fetch');
const config = require('./config');

class WhatsAppBot {
    constructor() {
        this.initializeClient();
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 5000;

        // Simpan history chat untuk konteks
        this.chatHistory = new Map();
        
        // Daftar perintah yang tersedia
        this.commands = {
            '!ping': 'Pong! 🏓\nStatus: Online\nWaktu: {time}',
            '!halo': 'Halo juga! 👋\nAda yang bisa saya bantu?',
            '!menu': `*📋 DAFTAR PERINTAH BOT*\n
1. !ping - Cek status bot
2. !halo - Sapa bot
3. !menu - Tampilkan daftar perintah
4. !info - Info tentang bot
5. !waktu - Cek waktu sekarang
6. !help - Bantuan penggunaan bot
7. !ai [pertanyaan] - Tanya ke AI
8. !reset - Reset history chat dengan AI
9. !model [nama_model] - Ganti model AI (gpt35/gpt4/claude/mistral)`,
            '!info': `*ℹ️ INFO BOT*\n
• Nama: WhatsApp Bot + AI
• Dibuat dengan: whatsapp-web.js & OpenRouter
• Model AI: ${config.ai.model}
• Status: Active
• Prefix: !
• Waktu Aktif: {uptime}`,
            '!waktu': 'Waktu sekarang: {time}',
            '!help': `*❓ BANTUAN PENGGUNAAN BOT*\n
• Semua perintah menggunakan awalan "!"
• Untuk bertanya ke AI, gunakan !ai [pertanyaan]
• Untuk ganti model AI, gunakan !model [nama_model]
• Model yang tersedia: gpt35, gpt4, claude, mistral
• Bot akan mengingat konteks percakapan
• Gunakan !reset untuk memulai percakapan baru`
        };

        this.startTime = new Date();
        this.currentModel = config.ai.model;
    }

    initializeClient() {
        this.client = new Client({
            authStrategy: new LocalAuth(),
            puppeteer: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--disable-gpu'
                ]
            },
            restartOnAuthFail: true,
            takeoverOnConflict: true,
            takeoverTimeoutMs: 10000
        });

        this.setupEventHandlers();
    }

    async generateAIResponse(message, chatId) {
        try {
            const apiKey = process.env.OPENROUTER_API_KEY || config.ai.apiKey;
            
            if (!apiKey || apiKey === 'sk-or-xxx') {
                return `❌ *AI Tidak Tersedia*\n\nMaaf, OpenRouter belum dikonfigurasi dengan benar.\nPastikan API key sudah diset di file .env\n\nSilakan gunakan perintah bot biasa:\n!menu - untuk melihat daftar perintah\n!help - untuk bantuan`;
            }

            // Ambil history chat untuk konteks
            if (!this.chatHistory.has(chatId)) {
                this.chatHistory.set(chatId, []);
            }
            const history = this.chatHistory.get(chatId);

            // Tambahkan pesan baru ke history
            history.push({ role: 'user', content: message });

            // Batasi history ke 10 pesan terakhir untuk menghemat token
            if (history.length > 10) {
                history.splice(0, history.length - 10);
            }

            try {
                const response = await fetch(config.ai.apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`,
                        ...config.ai.headers
                    },
                    body: JSON.stringify({
                        model: this.currentModel,
                        messages: [
                            { 
                                role: "system", 
                                content: "Kamu adalah asisten AI yang membantu di WhatsApp. Berikan jawaban yang singkat, jelas, dan dalam Bahasa Indonesia. Gunakan emoji yang sesuai untuk membuat chat lebih menarik." 
                            },
                            ...history
                        ],
                        max_tokens: config.ai.maxTokens,
                        temperature: config.ai.temperature
                    }),
                    timeout: config.ai.timeout
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || 'Error from OpenRouter API');
                }

                const data = await response.json();
                const aiResponse = data.choices[0].message.content;
                
                // Simpan respons AI ke history
                history.push({ role: 'assistant', content: aiResponse });
                
                return aiResponse;

            } catch (apiError) {
                console.error('❌ Error API OpenRouter:', apiError.message);
                
                if (apiError.message.includes('timeout')) {
                    return `❌ *AI Timeout*\n\nMaaf, respons dari AI terlalu lama. Silakan coba lagi dengan pertanyaan yang lebih singkat atau gunakan perintah bot biasa (!menu)`;
                } else if (apiError.message.includes('quota') || apiError.message.includes('credits')) {
                    return `❌ *Kuota AI Habis*\n\nMaaf, kuota API OpenRouter sudah habis.\n\nSilakan gunakan perintah bot biasa:\n!menu - untuk melihat daftar perintah\n!help - untuk bantuan`;
                } else if (apiError.message.includes('unauthorized') || apiError.message.includes('invalid')) {
                    return `❌ *Error API Key*\n\nMaaf, terjadi masalah dengan API key OpenRouter.\n\nSilakan gunakan perintah bot biasa:\n!menu - untuk melihat daftar perintah\n!help - untuk bantuan`;
                }
                
                return `❌ *AI Error*\n\nMaaf, terjadi error saat berkomunikasi dengan AI: ${apiError.message}\n\nSilakan coba lagi nanti atau gunakan perintah bot biasa (!menu)`;
            }

        } catch (error) {
            console.error('❌ Error saat generate respons AI:', error.message);
            return `❌ *System Error*\n\nMaaf, terjadi error sistem: ${error.message}\n\nSilakan coba lagi nanti atau gunakan perintah bot biasa (!menu)`;
        }
    }

    async reconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('❌ Gagal reconnect setelah', this.maxReconnectAttempts, 'percobaan');
            process.exit(1);
            return;
        }

        this.reconnectAttempts++;
        console.log(`🔄 Mencoba reconnect... (Percobaan ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

        try {
            // Destroy client lama jika masih ada
            if (this.client) {
                await this.client.destroy();
            }

            // Buat client baru
            this.initializeClient();
            await this.start();
        } catch (error) {
            console.error('❌ Error saat reconnect:', error.message);
            // Coba lagi setelah delay
            setTimeout(() => this.reconnect(), this.reconnectDelay);
        }
    }

    getUptime() {
        const now = new Date();
        const diff = now - this.startTime;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours} jam ${minutes} menit`;
    }

    formatMessage(template) {
        return template
            .replace('{time}', new Date().toLocaleString('id-ID'))
            .replace('{uptime}', this.getUptime());
    }

    setupEventHandlers() {
        // QR Code event
        this.client.on('qr', (qr) => {
            console.log('🔄 QR Code baru diterima. Silakan scan dengan WhatsApp di HP:');
            qrcode.generate(qr, { small: true });
        });

        // Ready event
        this.client.on('ready', async () => {
            console.log('✅ Bot WhatsApp siap digunakan!');
            this.isConnected = true;
            this.reconnectAttempts = 0; // Reset counter ketika berhasil connect
            await this.startMonitoring();
            
            // Kirim pesan test ke diri sendiri
            await this.testSelfMessage();
        });

        // Authentication Failed event
        this.client.on('auth_failure', async (msg) => {
            console.error('❌ Autentikasi gagal:', msg);
            this.isConnected = false;
            await this.reconnect();
        });

        // Disconnected event
        this.client.on('disconnected', async (reason) => {
            console.log('❌ Bot terputus:', reason);
            this.isConnected = false;
            await this.reconnect();
        });

        // Connection events
        this.client.on('change_state', async (state) => {
            console.log('🔄 Status koneksi berubah:', state);
            if (state === 'CONFLICT' || state === 'UNLAUNCHED') {
                await this.reconnect();
            }
        });

        // Error handling
        this.client.on('change_battery', (batteryInfo) => {
            if (batteryInfo.battery <= 15 && !batteryInfo.plugged) {
                console.warn('⚠️ Peringatan: Baterai HP rendah:', batteryInfo.battery + '%');
            }
        });

        process.on('uncaughtException', async (err) => {
            console.error('❌ Error tidak tertangani:', err);
            if (!this.isConnected) {
                await this.reconnect();
            }
        });

        process.on('unhandledRejection', async (err) => {
            console.error('❌ Promise rejection tidak tertangani:', err);
            if (!this.isConnected) {
                await this.reconnect();
            }
        });

        // Message event
        this.client.on('message', async (msg) => {
            try {
                // Get chat info
                const chat = await msg.getChat();
                
                // Skip jika pesan dari grup
                if (chat.isGroup) {
                    console.log('\n📩 Pesan grup diabaikan:');
                    console.log('- Grup:', chat.name);
                    console.log('- Dari:', msg.author || msg.from);
                    console.log('- Isi:', msg.body);
                    return;
                }

                console.log('\n📩 Pesan pribadi diterima:');
                console.log('- Dari:', msg.from);
                console.log('- Isi:', msg.body);
                
                // Get contact info
                const contact = await msg.getContact();
                console.log('- Nama kontak:', contact.pushname || 'Tidak diketahui');
                
                // Handle AI command
                if (msg.body.toLowerCase().startsWith('!ai ')) {
                    const question = msg.body.slice(4); // Hapus "!ai "
                    console.log('🤖 Memproses pertanyaan AI:', question);
                    
                    // Kirim indikator mengetik
                    const chat = await msg.getChat();
                    chat.sendStateTyping();
                    
                    const response = await this.generateAIResponse(question, msg.from);
                    await msg.reply(response);
                    
                    // Stop indikator mengetik
                    chat.clearState();
                    
                    return;
                }

                // Handle reset command
                if (msg.body.toLowerCase() === '!reset') {
                    this.chatHistory.delete(msg.from);
                    await msg.reply('🔄 History chat dengan AI telah direset!');
                    return;
                }
                
                // Handle model change command
                if (msg.body.toLowerCase().startsWith('!model ')) {
                    const modelName = msg.body.slice(7).toLowerCase();
                    if (config.ai.models[modelName]) {
                        this.currentModel = config.ai.models[modelName];
                        await msg.reply(`✅ Model AI diubah ke: ${this.currentModel}`);
                        return;
                    } else {
                        await msg.reply(`❌ Model tidak valid. Model yang tersedia:\n${Object.keys(config.ai.models).join(', ')}`);
                        return;
                    }
                }
                
                // Auto reply untuk pesan yang dimulai dengan "!"
                if (msg.body.startsWith('!')) {
                    const command = msg.body.toLowerCase().split(' ')[0];
                    if (this.commands[command]) {
                        const reply = this.formatMessage(this.commands[command]);
                        await msg.reply(reply);
                        console.log('✅ Membalas pesan dengan command:', command);
                    }
                }
                
                // Auto reply untuk kata kunci umum
                const commonReplies = {
                    'p': 'Iya, ada yang bisa saya bantu? 😊\nKetik !menu untuk melihat daftar perintah.',
                    'test': 'Bot aktif! 🤖\nKetik !menu untuk melihat daftar perintah.',
                    'tes': 'Bot aktif! 🤖\nKetik !menu untuk melihat daftar perintah.',
                    'bot': 'Iya, saya bot WhatsApp 🤖\nKetik !menu untuk melihat daftar perintah.',
                    'thanks': 'Sama-sama! 😊',
                    'makasih': 'Sama-sama! 😊',
                    'thx': 'Sama-sama! 😊',
                    'halo': 'Halo juga! 👋\nAda yang bisa saya bantu?',
                    'hai': 'Hai juga! 👋\nAda yang bisa saya bantu?',
                    'haiii': 'Hai juga! 👋\nAda yang bisa saya bantu?',
                    'haiiiii': 'Hai juga! 👋\nAda yang bisa saya bantu?',
                    'haiiiiiii': 'Hai juga! 👋\nAda yang bisa saya bantu?',
                    'haiiiiiiiii': 'Hai juga! 👋\nAda yang bisa saya bantu?',
                    'haiiiiiiiiiii': 'Hai juga! 👋\nAda yang bisa saya bantu?',
                    'sayang': 'Aku sayang kamu! 😊',
                    'sayangku': 'Aku sayang kamu! 😊',
                    'sayangkuuu': 'Aku sayang kamu! 😊',
                    'sayangkuuuu': 'Aku sayang kamu! 😊',
                    'sayangkuuuuu': 'Aku sayang kamu! 😊',
                    'sayangkuuuuuu': 'Aku sayang kamu! 😊',
                    'sayangkuuuuuuu': 'Aku sayang kamu! 😊',
                };

                const msgLower = msg.body.toLowerCase();
                if (commonReplies[msgLower]) {
                    await msg.reply(commonReplies[msgLower]);
                    console.log('✅ Membalas pesan umum:', msgLower);
                }
                
                // Log message type
                if (msg.hasMedia) {
                    const media = await msg.downloadMedia();
                    console.log('- Tipe media:', media.mimetype);
                }
                
            } catch (error) {
                console.error('❌ Error saat memproses pesan:', error.message);
                await msg.reply('❌ Maaf, terjadi error. Silakan coba lagi.');
            }
        });
    }

    async startMonitoring() {
        console.log('\n🔍 Memulai monitoring chat...');
        
        try {
            // Get all chats
            const chats = await this.client.getChats();
            console.log(`📊 Total chat: ${chats.length}`);
            
            // Log some recent chats
            console.log('\nDaftar chat terakhir:');
            chats.slice(0, 5).forEach(chat => {
                console.log(`- ${chat.name || chat.id.user}`);
            });
            
        } catch (error) {
            console.error('❌ Error saat monitoring:', error.message);
        }
    }

    async testSelfMessage() {
        try {
            // Dapatkan info nomor sendiri
            const myNumber = this.client.info.wid.user;
            console.log('\n📱 Nomor WhatsApp bot:', myNumber);

            // Format nomor untuk chat
            const chatId = myNumber + '@c.us';

            // Kirim pesan test
            console.log('📤 Mengirim pesan test ke diri sendiri...');
            await this.client.sendMessage(chatId, '🤖 *Bot Test*\n\nBot berhasil dijalankan dan bisa mengirim pesan!\n\nWaktu: ' + new Date().toLocaleString());
            console.log('✅ Pesan test terkirim!');

            // Tambahan: kirim pesan dengan format
            setTimeout(async () => {
                await this.client.sendMessage(chatId, 
                    '📋 *Daftar Perintah Bot:*\n\n' +
                    '1. Ketik *test* atau *ping* untuk mengecek bot\n' +
                    '2. Bot akan membalas dengan status dan waktu respons\n\n' +
                    '_Bot dibuat dengan whatsapp-web.js_'
                );
            }, 1000);

        } catch (error) {
            console.error('❌ Error saat mengirim pesan test:', error.message);
        }
    }

    async start() {
        console.log('🤖 Menginisialisasi Bot WhatsApp...');
        try {
            await this.client.initialize();
        } catch (error) {
            console.error('❌ Error saat inisialisasi:', error.message);
            await this.reconnect();
        }
    }
}

// Start bot
const bot = new WhatsAppBot();

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Menghentikan bot...');
    try {
        await bot.client.destroy();
        console.log('✅ Bot berhasil dihentikan');
    } catch (error) {
        console.error('❌ Error saat menghentikan bot:', error.message);
    }
    process.exit(0);
});

bot.start().catch(async error => {
    console.error('❌ Error bot:', error);
    await bot.reconnect();
}); 