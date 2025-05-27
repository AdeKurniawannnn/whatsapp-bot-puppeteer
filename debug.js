const puppeteer = require('puppeteer');

class WhatsAppDebugger {
    constructor() {
        this.browser = null;
        this.page = null;
        this.isDebugFunctionsInjected = false;
    }

    async init() {
        console.log('🐛 Memulai WhatsApp Debugger...');
        
        try {
            this.browser = await puppeteer.launch({
                headless: false,
                defaultViewport: null,
                args: ['--start-maximized']
            });

            this.page = await this.browser.newPage();
            
            // Enable better error logging
            this.page.on('console', msg => {
                const type = msg.type();
                if (['error', 'warning'].includes(type)) {
                    console.log(`Browser ${type}:`, msg.text());
                }
            });
            
            this.page.on('pageerror', err => console.error('Browser error:', err.message));

            console.log('⏳ Membuka WhatsApp Web...');
            
            await this.page.goto('https://web.whatsapp.com');
            
            console.log('✅ WhatsApp Web berhasil dibuka');
            
            // Wait for initial load
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Check page status
            const pageTitle = await this.page.title();
            console.log('📄 Judul halaman:', pageTitle);
            
            // Continuously check for QR code or chat list
            let maxAttempts = 24; // 2 minutes total
            let attempt = 0;
            
            while (attempt < maxAttempts) {
                try {
                    const hasQR = await this.page.evaluate(() => !!document.querySelector('canvas[aria-label="Scan me!"]'));
                    const hasChatList = await this.page.evaluate(() => !!document.querySelector('[data-testid="chat-list"]'));
                    
                    if (hasQR) {
                        console.log('📱 QR Code terdeteksi - Silakan scan dengan WhatsApp di HP');
                        break;
                    } else if (hasChatList) {
                        console.log('✅ Sudah login ke WhatsApp Web');
                        break;
                    }
                    
                    console.log('⏳ Menunggu WhatsApp Web siap...', attempt + 1);
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    attempt++;
                    
                } catch (error) {
                    console.log('⚠️ Error saat cek status:', error.message);
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    attempt++;
                }
            }
            
            if (attempt >= maxAttempts) {
                throw new Error('Timeout menunggu WhatsApp Web siap');
            }

            await this.injectDebugFunctions();
            await this.startMonitoring();
            
        } catch (error) {
            console.error('❌ Error saat inisialisasi:', error.message);
            await this.close();
            process.exit(1);
        }
    }

    async injectDebugFunctions() {
        console.log('🔧 Menyiapkan fungsi debug...');
        
        try {
            await this.page.evaluate(() => {
                window.debugMessages = () => {
                    const getElementInfo = (selector) => {
                        const elements = document.querySelectorAll(selector);
                        return {
                            count: elements.length,
                            samples: Array.from(elements).slice(0, 3).map(el => ({
                                text: el.textContent?.substring(0, 50) || 'no text',
                                classes: el.className
                            }))
                        };
                    };

                    const selectors = {
                        messages: '[data-testid="msg-container"]',
                        composeBox: '[data-testid="conversation-compose-box-input"]',
                        chatList: '[data-testid="chat-list"]',
                        qrCode: 'canvas[aria-label="Scan me!"]',
                        chats: '[data-testid="cell-frame-title"]'
                    };

                    const info = {};
                    
                    for (const [key, selector] of Object.entries(selectors)) {
                        info[key] = getElementInfo(selector);
                    }

                    return {
                        info,
                        url: window.location.href,
                        timestamp: new Date().toISOString()
                    };
                };
            });

            this.isDebugFunctionsInjected = true;
            console.log('✅ Fungsi debug berhasil disiapkan');
            
        } catch (error) {
            console.error('❌ Error saat menyiapkan fungsi debug:', error.message);
            this.isDebugFunctionsInjected = false;
        }
    }

    async startMonitoring() {
        console.log('\n🔍 Memulai monitoring...');
        
        let monitorInterval = setInterval(async () => {
            try {
                if (!this.page || this.page.isClosed()) {
                    console.log('⚠️ Browser window tertutup, menghentikan monitoring...');
                    clearInterval(monitorInterval);
                    process.exit(0);
                    return;
                }

                if (!this.isDebugFunctionsInjected) {
                    await this.injectDebugFunctions();
                }

                const status = await this.page.evaluate(() => {
                    try {
                        return window.debugMessages();
                    } catch (e) {
                        return { error: e.message };
                    }
                });

                if (status.error) {
                    console.log('⚠️ Error debug:', status.error);
                    this.isDebugFunctionsInjected = false;
                } else {
                    console.log('\n📊 Status WhatsApp:');
                    console.log(`Pesan terdeteksi: ${status.info.messages.count}`);
                    console.log(`Kotak chat tersedia: ${status.info.composeBox.count > 0}`);
                    console.log(`Daftar chat: ${status.info.chatList.count}`);
                    console.log(`QR Code: ${status.info.qrCode.count > 0}`);
                    
                    if (status.info.chats.count > 0) {
                        console.log('\nDaftar chat terakhir:');
                        status.info.chats.samples.forEach(chat => {
                            console.log(`- ${chat.text}`);
                        });
                    }
                }

            } catch (error) {
                if (error.message.includes('detached')) {
                    console.log('⚠️ Koneksi terputus, mencoba menghubungkan ulang...');
                    await this.injectDebugFunctions();
                } else {
                    console.log('⚠️ Error monitoring:', error.message);
                }
                this.isDebugFunctionsInjected = false;
            }
        }, 5000);

        console.log('📝 Instruksi:');
        console.log('1. Scan QR code jika muncul');
        console.log('2. Tunggu sampai WhatsApp Web terload sempurna');
        console.log('3. Buka chat yang ingin di-debug');
        console.log('4. Tekan Ctrl+C untuk keluar');
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            console.log('👋 Debugger ditutup');
        }
    }
}

// Start debugger
const whatsappDebugger = new WhatsAppDebugger();

process.on('SIGINT', async () => {
    console.log('\n🛑 Menghentikan debugger...');
    await whatsappDebugger.close();
    process.exit(0);
});

whatsappDebugger.init().catch(error => {
    console.error('❌ Error debugger:', error);
    process.exit(1);
}); 