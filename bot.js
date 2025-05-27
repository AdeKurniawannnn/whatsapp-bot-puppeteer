require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fetch = require('node-fetch');
const config = require('./config');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Gunakan stealth plugin untuk menghindari deteksi
puppeteer.use(StealthPlugin());

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
            '!menu': `*📋 DAFTAR PERINTAH BOT*\n
1. !ping - Cek status bot
2. !menu - Tampilkan daftar perintah
3. !info - Info tentang bot
4. !ai [pertanyaan] - Tanya ke AI
5. !reset - Reset history chat dengan AI
6. !model [nama_model] - Ganti model AI (gpt35/gpt4/claude/mistral)`,
            '!info': `*ℹ️ INFO BOT*\n
• Nama: WhatsApp Bot + AI
• Dibuat dengan: whatsapp-web.js & OpenRouter
• Model AI: ${config.ai.model}
• Status: Active
• Prefix: !
• Waktu Aktif: {uptime}`
        };

        this.startTime = new Date();
        this.currentModel = config.ai.model;
    }

    initializeClient() {
        this.client = new Client({
            authStrategy: new LocalAuth({
                dataPath: './session'
            }),
            puppeteer: {
                headless: true,
                executablePath: puppeteer.executablePath(),
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--disable-gpu',
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-background-timer-throttling',
                    '--disable-backgrounding-occluded-windows',
                    '--disable-renderer-backgrounding',
                    '--disable-extensions',
                    '--disable-plugins',
                    '--disable-images',
                    '--disable-default-apps',
                    '--no-default-browser-check',
                    '--disable-software-rasterizer',
                    '--disable-background-networking',
                    '--disable-sync',
                    '--disable-translate',
                    '--hide-scrollbars',
                    '--metrics-recording-only',
                    '--mute-audio',
                    '--safebrowsing-disable-auto-update',
                    '--ignore-certificate-errors',
                    '--ignore-ssl-errors',
                    '--ignore-certificate-errors-spki-list',
                    '--ignore-certificate-errors-ssl-errors',
                    '--disable-blink-features=AutomationControlled',
                    '--disable-ipc-flooding-protection',
                    '--disable-xss-auditor',
                    '--disable-bundled-ppapi-flash',
                    '--disable-plugins-discovery',
                    '--disable-preconnect',
                    '--disable-hang-monitor'
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

            // Batasi history ke 5 pesan terakhir untuk menghemat token
            if (history.length > 5) {
                history.splice(0, history.length - 5);
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
                        model: this.currentModel || config.ai.model,
                        messages: [
                            { 
                                role: "system", 
                                content: config.ai.systemPrompt
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
                    return `❌ *AI Timeout*\n\nMaaf, respons dari AI terlalu lama. Coba lagi dengan pertanyaan yang lebih singkat ya!`;
                } else if (apiError.message.includes('quota') || apiError.message.includes('credits')) {
                    return `❌ *Kuota AI Habis*\n\nMaaf, kuota API OpenRouter sudah habis. Coba lagi nanti ya!`;
                } else if (apiError.message.includes('unauthorized') || apiError.message.includes('invalid')) {
                    return `❌ *Error API Key*\n\nMaaf, ada masalah dengan API key. Coba lagi nanti ya!`;
                }
                
                return `❌ *AI Error*\n\nMaaf, ada masalah: ${apiError.message}\nCoba lagi nanti ya!`;
            }

        } catch (error) {
            console.error('❌ Error sistem:', error.message);
            return `❌ *Error Sistem*\n\nMaaf, ada masalah sistem: ${error.message}\nCoba lagi nanti ya!`;
        }
    }

    async reconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('❌ Gagal reconnect setelah', this.maxReconnectAttempts, 'percobaan');
            console.log('🔄 Mencoba restart dari awal...');
            this.reconnectAttempts = 0; // Reset counter
            setTimeout(() => this.start(), 10000); // Restart setelah 10 detik
            return;
        }

        this.reconnectAttempts++;
        console.log(`🔄 Mencoba reconnect... (Percobaan ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

        try {
            // Destroy client lama jika masih ada
            if (this.client) {
                await this.client.destroy();
            }

            // Tunggu sebentar sebelum buat client baru
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Buat client baru
            this.initializeClient();
            await this.start();
        } catch (error) {
            console.error('❌ Error saat reconnect:', error.message);
            // Coba lagi setelah delay yang lebih lama
            setTimeout(() => this.reconnect(), this.reconnectDelay * 2);
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
            console.log('\n' + '='.repeat(60));
            console.log('🔄 QR CODE WHATSAPP BOT');
            console.log('='.repeat(60));
            console.log('📱 Scan QR code ini dengan WhatsApp di HP Anda:');
            console.log('='.repeat(60));
            qrcode.generate(qr, { small: true });
            console.log('='.repeat(60));
            console.log('📋 Cara scan:');
            console.log('1. Buka WhatsApp di HP');
            console.log('2. Tap menu (3 titik) > Linked Devices');
            console.log('3. Tap "Link a Device"');
            console.log('4. Scan QR code di atas');
            console.log('='.repeat(60));
        });

        // Ready event
        this.client.on('ready', async () => {
            console.log('\n' + '🎉'.repeat(20));
            console.log('✅ BOT WHATSAPP SIAP DIGUNAKAN!');
            console.log('🎉'.repeat(20));
            this.isConnected = true;
            this.reconnectAttempts = 0;
            await this.startMonitoring();
            
            console.log('📱 Bot siap menerima pesan!');
            console.log('💡 Kirim pesan ke bot untuk test');
        });

        // Authentication Failed event
        this.client.on('auth_failure', async (msg) => {
            console.error('\n❌ Autentikasi gagal:', msg);
            console.log('🔄 Akan mencoba reconnect dalam 3 detik...');
            this.isConnected = false;
            setTimeout(() => this.reconnect(), 3000);
        });

        // Disconnected event
        this.client.on('disconnected', async (reason) => {
            console.log('\n❌ Bot terputus:', reason);
            console.log('🔄 Akan mencoba reconnect dalam 3 detik...');
            this.isConnected = false;
            setTimeout(() => this.reconnect(), 3000);
        });

        // Connection events
        this.client.on('change_state', async (state) => {
            console.log('🔄 Status koneksi berubah:', state);
            if (state === 'CONFLICT' || state === 'UNLAUNCHED') {
                setTimeout(() => this.reconnect(), 5000);
            }
        });

        // Error handling yang lebih baik
        this.client.on('change_battery', (batteryInfo) => {
            if (batteryInfo.battery <= 15 && !batteryInfo.plugged) {
                console.warn('⚠️ Peringatan: Baterai HP rendah:', batteryInfo.battery + '%');
            }
        });

        // Global error handlers
        process.on('uncaughtException', async (err) => {
            console.error('❌ Error tidak tertangani:', err.message);
            if (!this.isConnected) {
                setTimeout(() => this.reconnect(), 5000);
            }
        });

        process.on('unhandledRejection', async (err) => {
            console.error('❌ Promise rejection tidak tertangani:', err.message);
            if (!this.isConnected) {
                setTimeout(() => this.reconnect(), 5000);
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
                
                // Handle pesan dengan fungsi baru
                const response = await this.handleMessage(msg);
                if (response) {
                    // Kirim indikator mengetik
                    const chat = await msg.getChat();
                    chat.sendStateTyping();
                    
                    // Kirim respons
                    await msg.reply(response);
                    console.log('✅ Respons terkirim:', response.substring(0, 50) + '...');
                    
                    // Stop indikator mengetik
                    chat.clearState();
                }
                
            } catch (error) {
                console.error('❌ Error saat memproses pesan:', error.message);
                try {
                    await msg.reply('❌ Maaf, terjadi error. Silakan coba lagi.');
                } catch (replyError) {
                    console.error('❌ Error saat mengirim reply error:', replyError.message);
                }
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

    async start() {
        console.log('🤖 Menginisialisasi Bot WhatsApp...');
        try {
            await this.client.initialize();
        } catch (error) {
            console.error('❌ Error saat inisialisasi:', error.message);
            setTimeout(() => this.reconnect(), 5000);
        }
    }

    async handleMessage(msg) {
        try {
            const text = msg.body.toLowerCase();
            
            // Handle perintah dasar
            if (text.startsWith('!')) {
                const command = text.split(' ')[0];
                if (this.commands[command]) {
                    return this.formatMessage(this.commands[command]);
                }
            }

            // Gunakan AI untuk semua respons lainnya
            return await this.generateAIResponse(msg.body, msg.from);
            
        } catch (error) {
            console.error('Error handling message:', error);
            return 'Maaf, terjadi kesalahan. Silakan coba lagi.';
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