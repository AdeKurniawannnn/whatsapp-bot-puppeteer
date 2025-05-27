const puppeteer = require('puppeteer');
const qrcode = require('qrcode-terminal');
const fs = require('fs-extra');
const path = require('path');
const config = require('./config');

class WhatsAppBot {
    constructor() {
        this.browser = null;
        this.page = null;
        this.isLoggedIn = false;
        this.sessionPath = config.session.folderPath;
        this.botResponses = config.responses;
        this.adminNumbers = config.adminNumbers;
        this.messageCount = 0;
        this.messageStartTime = Date.now();
        this.userMessageCounts = new Map(); // Rate limiting per user
        this.retryCount = 0;
        
        console.log('🤖 WhatsApp Bot dengan Puppeteer');
        console.log('🔧 Memuat konfigurasi...');
    }

    async init() {
        console.log('🚀 Memulai WhatsApp Bot...');
        
        try {
            // Launch browser dengan konfigurasi dari config.js
            console.log('🌐 Meluncurkan browser...');
            this.browser = await puppeteer.launch({
                headless: config.browser.headless,
                devtools: config.browser.devtools,
                defaultViewport: {
                    width: config.browser.width,
                    height: config.browser.height
                },
                args: config.browser.args,
                ignoreDefaultArgs: ['--disable-extensions'],
                timeout: config.bot.pageTimeout
            });

            console.log('📄 Membuka halaman baru...');
            this.page = await this.browser.newPage();
            
            // Set user agent yang lebih realistic
            await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');
            
            // Set timeout default
            this.page.setDefaultTimeout(config.bot.pageTimeout);
            this.page.setDefaultNavigationTimeout(config.bot.pageTimeout);
            
            // Load session jika ada
            await this.loadSession();
            
            // Buka WhatsApp Web dengan retry
            await this.navigateToWhatsApp();
            
            // Wait for page to load and check login status
            await this.checkLoginStatus();
            
            if (!this.isLoggedIn) {
                await this.handleQRCode();
            }
            
            // Setup message listener
            await this.setupMessageListener();
            
            console.log('✅ Bot WhatsApp siap digunakan!');
            console.log('🎯 Mendengarkan pesan masuk...');
            
        } catch (error) {
            console.error('❌ Error saat inisialisasi:', error.message);
            
            if (this.retryCount < config.bot.maxRetries) {
                this.retryCount++;
                console.log(`🔄 Mencoba lagi... (${this.retryCount}/${config.bot.maxRetries})`);
                
                // Cleanup sebelum retry
                if (this.browser) {
                    await this.browser.close().catch(() => {});
                }
                
                // Wait sebentar sebelum retry
                await new Promise(resolve => setTimeout(resolve, 5000));
                
                return this.init();
            }
            
            throw new Error(`Gagal menginisialisasi bot setelah ${config.bot.maxRetries} percobaan: ${error.message}`);
        }
    }

    async navigateToWhatsApp() {
        try {
            console.log('📱 Membuka WhatsApp Web...');
            await this.page.goto('https://web.whatsapp.com', { 
                waitUntil: 'networkidle2',
                timeout: config.bot.pageTimeout 
            });
        } catch (error) {
            console.log('⚠️ Timeout saat loading, mencoba lagi...');
            await this.page.goto('https://web.whatsapp.com', { 
                waitUntil: 'domcontentloaded',
                timeout: 30000 
            });
        }
    }

    async loadSession() {
        try {
            const sessionFile = path.join(this.sessionPath, config.session.fileName);
            if (await fs.pathExists(sessionFile)) {
                console.log('📂 Memuat session yang tersimpan...');
                const sessionData = await fs.readJson(sessionFile);
                
                await this.page.evaluateOnNewDocument(session => {
                    localStorage.clear();
                    sessionStorage.clear();
                    
                    if (session.localStorage) {
                        for (const [key, value] of Object.entries(session.localStorage)) {
                            localStorage.setItem(key, value);
                        }
                    }
                    
                    if (session.sessionStorage) {
                        for (const [key, value] of Object.entries(session.sessionStorage)) {
                            sessionStorage.setItem(key, value);
                        }
                    }
                }, sessionData);
            }
        } catch (error) {
            console.log('⚠️ Tidak ada session tersimpan atau error loading session');
        }
    }

    async saveSession() {
        try {
            const session = await this.page.evaluate(() => {
                return {
                    localStorage: { ...localStorage },
                    sessionStorage: { ...sessionStorage }
                };
            });
            
            await fs.ensureDir(this.sessionPath);
            const sessionFile = path.join(this.sessionPath, config.session.fileName);
            await fs.writeJson(sessionFile, session);
            console.log('💾 Session tersimpan');
        } catch (error) {
            console.error('❌ Error saving session:', error);
        }
    }

    async checkLoginStatus() {
        console.log('⏳ Memeriksa status login...');
        
        try {
            // Wait untuk halaman dimuat dengan multiple selector options
            await this.page.waitForSelector([
                '[data-testid="qrcode"]',
                '[data-testid="chat-list"]', 
                '[data-testid="side"]',
                '[data-testid="chats"]',
                '#app .app-wrapper-web',
                '[role="main"]'
            ].join(', '), { 
                timeout: 30000 
            });
            
            // Check multiple indicators untuk menentukan apakah sudah login
            const loginStatus = await this.page.evaluate(() => {
                // Check for QR code (belum login)
                const qrCode = document.querySelector('[data-testid="qrcode"]');
                
                // Check for main chat interface (sudah login)
                const chatList = document.querySelector('[data-testid="chat-list"]');
                const sidePanel = document.querySelector('[data-testid="side"]');
                const chatsPanel = document.querySelector('[data-testid="chats"]');
                const appWrapper = document.querySelector('#app .app-wrapper-web');
                const mainRole = document.querySelector('[role="main"]');
                
                // Additional checks
                const searchInput = document.querySelector('[data-testid="chat-list-search"]');
                const menuButton = document.querySelector('[data-testid="menu"]');
                
                const isLoggedIn = !qrCode && (
                    chatList || sidePanel || chatsPanel || 
                    appWrapper || mainRole || searchInput || menuButton
                );
                
                return {
                    hasQR: !!qrCode,
                    hasChatList: !!chatList,
                    hasSidePanel: !!sidePanel,
                    hasChatsPanel: !!chatsPanel,
                    hasAppWrapper: !!appWrapper,
                    hasMainRole: !!mainRole,
                    hasSearchInput: !!searchInput,
                    hasMenuButton: !!menuButton,
                    isLoggedIn: isLoggedIn
                };
            });
            
            console.log('🔍 Status deteksi:', {
                'QR Code': loginStatus.hasQR ? '✅' : '❌',
                'Chat List': loginStatus.hasChatList ? '✅' : '❌', 
                'Side Panel': loginStatus.hasSidePanel ? '✅' : '❌',
                'Logged In': loginStatus.isLoggedIn ? '✅' : '❌'
            });
            
            if (loginStatus.isLoggedIn) {
                this.isLoggedIn = true;
                console.log('✅ Sudah login ke WhatsApp Web');
                await this.saveSession();
                return;
            }
            
            if (loginStatus.hasQR) {
                console.log('📷 QR Code terdeteksi, perlu scan');
                return;
            }
            
            // Jika tidak ada indikator yang jelas, tunggu sebentar lagi
            console.log('⏳ Status tidak jelas, menunggu lagi...');
            await this.page.waitForTimeout(5000);
            
            // Check lagi setelah tunggu
            return this.checkLoginStatus();
            
        } catch (error) {
            console.log('⚠️ Timeout menunggu halaman, mencoba deteksi paksa...');
            
            // Fallback: cek apakah ada QR code
            try {
                await this.page.waitForSelector('[data-testid="qrcode"]', { timeout: 5000 });
                console.log('📷 QR Code ditemukan');
                return;
            } catch {
                // Tidak ada QR code, asumsikan sudah login
                console.log('✅ Tidak ada QR code, asumsikan sudah login');
                this.isLoggedIn = true;
                await this.saveSession();
                return;
            }
        }
    }

    async handleQRCode() {
        try {
            console.log('📷 Menunggu QR Code...');
            
            // Wait for QR code dengan timeout yang lebih panjang
            await this.page.waitForSelector('[data-testid="qrcode"] img', { timeout: 45000 });
            
            const qrCodeSrc = await this.page.$eval('[data-testid="qrcode"] img', img => img.src);
            
            console.log('\n🔗 Scan QR Code berikut dengan WhatsApp Anda:');
            console.log('👆 QR Code akan muncul di browser dan di terminal\n');
            
            // Generate QR di terminal jika menggunakan base64
            if (qrCodeSrc.includes('data:image')) {
                try {
                    const base64Data = qrCodeSrc.replace(/^data:image\/[a-z]+;base64,/, '');
                    qrcode.generate(base64Data, { small: true });
                } catch (qrError) {
                    console.log('⚠️ QR code di terminal tidak dapat ditampilkan, gunakan QR di browser');
                }
            }
            
            // Wait for successful login dengan deteksi yang lebih baik
            console.log('⏳ Menunggu login (timeout 3 menit)...');
            await this.page.waitForFunction(() => {
                // Multiple selectors untuk deteksi login
                const qrGone = !document.querySelector('[data-testid="qrcode"]');
                const hasChat = document.querySelector('[data-testid="chat-list"]') || 
                              document.querySelector('[data-testid="side"]') ||
                              document.querySelector('[data-testid="chats"]') ||
                              document.querySelector('#app .app-wrapper-web') ||
                              document.querySelector('[role="main"]') ||
                              document.querySelector('[data-testid="chat-list-search"]');
                              
                return qrGone && hasChat;
            }, { timeout: 180000 }); // 3 menit timeout
            
            this.isLoggedIn = true;
            console.log('✅ Berhasil login ke WhatsApp Web!');
            
            await this.saveSession();
            
        } catch (error) {
            console.error('❌ Error handling QR code:', error.message);
            if (error.message.includes('timeout')) {
                console.log('⏰ Timeout menunggu login. Silakan restart bot dan coba lagi.');
            }
            throw error;
        }
    }

    async setupMessageListener() {
        console.log('👂 Menyiapkan listener untuk pesan masuk...');
        
        // Inject message listener
        await this.page.evaluate(() => {
            window.botMessageListener = () => {
                const processedMessages = new Set();
                
                const checkForNewMessages = () => {
                    try {
                        // Cari semua pesan yang masuk
                        const messageElements = document.querySelectorAll('[data-testid="msg-container"]');
                        
                        messageElements.forEach((element, index) => {
                            const messageId = element.getAttribute('data-id') || `msg-${index}`;
                            
                            if (!processedMessages.has(messageId)) {
                                // Check jika ini pesan masuk (bukan yang dikirim)
                                const isOutgoing = element.querySelector('[data-testid="msg-meta"] [data-testid="msg-dblcheck"], [data-testid="msg-meta"] [data-testid="msg-check"]');
                                
                                if (!isOutgoing) {
                                    // Cari text message
                                    const textElement = element.querySelector('span.selectable-text[data-testid="conversation-compose-box-input"], span.selectable-text');
                                    
                                    if (textElement && textElement.textContent) {
                                        const messageText = textElement.textContent.trim();
                                        
                                        if (messageText) {
                                            element.setAttribute('data-bot-processed', 'pending');
                                            processedMessages.add(messageId);
                                            
                                            console.log('New message detected:', messageText);
                                            
                                            // Trigger custom event
                                            window.dispatchEvent(new CustomEvent('newWhatsAppMessage', {
                                                detail: { 
                                                    text: messageText,
                                                    element: element 
                                                }
                                            }));
                                        }
                                    }
                                }
                            }
                        });
                    } catch (e) {
                        console.error('Error in checkForNewMessages:', e);
                    }
                };
                
                // Check setiap 2 detik
                setInterval(checkForNewMessages, 2000);
                
                // Juga listen ke perubahan DOM
                const observer = new MutationObserver(() => {
                    setTimeout(checkForNewMessages, 1000);
                });
                
                observer.observe(document.body, { 
                    childList: true, 
                    subtree: true 
                });
            };
            
            // Start listener
            window.botMessageListener();
        });

        // Listen to custom events
        await this.page.evaluateOnNewDocument(() => {
            window.addEventListener('newWhatsAppMessage', (event) => {
                window.lastNewMessage = event.detail;
            });
        });

        // Poll untuk pesan baru
        setInterval(async () => {
            await this.processNewMessages();
        }, config.bot.messageProcessingDelay);
    }

    async processNewMessages() {
        try {
            const newMessage = await this.page.evaluate(() => {
                if (window.lastNewMessage) {
                    const message = window.lastNewMessage;
                    window.lastNewMessage = null;
                    return message;
                }
                return null;
            });

            if (newMessage && newMessage.text) {
                await this.handleMessage(newMessage.text.toLowerCase().trim());
            }
            
        } catch (error) {
            // Silent error untuk menghindari spam log
        }
    }

    async handleMessage(messageText) {
        try {
            // Rate limiting check
            if (!this.checkRateLimit()) {
                console.log('⚠️ Rate limit exceeded, skipping message');
                return;
            }

            this.log(`📨 Pesan masuk: "${messageText}"`);
            
            let response = this.botResponses.default;
            
            // Check untuk perintah spesifik
            for (const [command, reply] of Object.entries(this.botResponses)) {
                if (command !== 'default' && messageText.includes(command)) {
                    // Jika response adalah function, jalankan function
                    if (typeof reply === 'function') {
                        response = reply();
                    } else {
                        response = reply;
                    }
                    break;
                }
            }
            
            // Handle broadcast command (admin only)
            if (messageText.startsWith('broadcast ')) {
                const isAdmin = await this.checkIfAdmin();
                if (isAdmin) {
                    const broadcastMessage = messageText.replace('broadcast ', '');
                    await this.broadcastMessage(broadcastMessage);
                    return;
                } else {
                    response = 'Maaf, hanya admin yang bisa menggunakan perintah broadcast.';
                }
            }
            
            await this.sendMessage(response);
            this.log(`🤖 Bot membalas: "${response}"`);
            
        } catch (error) {
            console.error('❌ Error handling message:', error);
        }
    }

    async sendMessage(text) {
        try {
            // Cari dan klik compose box dengan timeout
            await this.page.waitForSelector('[data-testid="conversation-compose-box-input"]', { 
                timeout: 15000 
            });
            
            // Focus pada compose box
            await this.page.click('[data-testid="conversation-compose-box-input"]');
            
            // Clear existing text dan type new message
            await this.page.keyboard.down('Control');
            await this.page.keyboard.press('KeyA');
            await this.page.keyboard.up('Control');
            
            await this.page.type('[data-testid="conversation-compose-box-input"]', text);
            
            // Send message
            await this.page.keyboard.press('Enter');
            
            // Wait sebentar
            await this.page.waitForTimeout(config.bot.sendMessageDelay);
            
        } catch (error) {
            console.error('❌ Error sending message:', error);
        }
    }

    checkRateLimit() {
        const now = Date.now();
        
        // Reset counter setiap menit
        if (now - this.messageStartTime > 60000) {
            this.messageCount = 0;
            this.messageStartTime = now;
        }
        
        this.messageCount++;
        
        return this.messageCount <= config.bot.maxMessagesPerMinute;
    }

    async checkIfAdmin() {
        try {
            // Implementasi sederhana - bisa dikembangkan untuk cek nomor dari chat aktif
            return this.adminNumbers.length === 0; // Jika tidak ada admin yang dikonfigurasi, semua dianggap admin
        } catch (error) {
            return false;
        }
    }

    async broadcastMessage(message) {
        try {
            console.log(`📢 Broadcasting message: "${message}"`);
            console.log('⚠️ Broadcast feature dalam pengembangan...');
            
            // Implementasi broadcast bisa ditambahkan di sini
            // Perlu navigasi ke semua chat dan kirim pesan
            
        } catch (error) {
            console.error('❌ Error broadcasting message:', error);
        }
    }

    log(message) {
        if (config.logging.enabled) {
            const timestamp = new Date().toLocaleString('id-ID');
            const logMessage = `[${timestamp}] ${message}`;
            console.log(logMessage);
            
            if (config.logging.logToFile) {
                // Implementasi logging ke file bisa ditambahkan di sini
            }
        }
    }

    async close() {
        try {
            if (this.browser) {
                await this.browser.close();
                console.log('👋 Bot WhatsApp ditutup');
            }
        } catch (error) {
            console.error('❌ Error closing bot:', error);
        }
    }
}

// Inisialisasi dan jalankan bot
const bot = new WhatsAppBot();

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Menerima sinyal shutdown...');
    await bot.close();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Menerima sinyal terminate...');
    await bot.close();
    process.exit(0);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start the bot
console.log('🎯 Starting WhatsApp Bot...');
bot.init().catch(error => {
    console.error('❌ Fatal error starting bot:', error);
    process.exit(1);
}); 