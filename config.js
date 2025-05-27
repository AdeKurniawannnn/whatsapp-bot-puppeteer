// Konfigurasi WhatsApp Bot
module.exports = {
    // Konfigurasi Browser - Dioptimasi untuk macOS
    browser: {
        headless: false, // Set true untuk menjalankan tanpa membuka browser
        devtools: false, // Set true untuk membuka developer tools
        width: 1366,
        height: 768,
        // Args tambahan untuk macOS
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process', // Untuk macOS compatibility
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-blink-features=AutomationControlled',
            '--no-default-browser-check',
            '--ignore-ssl-errors=yes',
            '--ignore-certificate-errors'
        ]
    },

    // Konfigurasi Bot
    bot: {
        // Prefix untuk perintah bot (opsional)
        commandPrefix: '', // Kosongkan jika tidak ingin menggunakan prefix
        
        // Delay antara pemrosesan pesan (ms)
        messageProcessingDelay: 3000, // Increased untuk stability
        
        // Delay setelah mengirim pesan (ms)
        sendMessageDelay: 1500, // Increased untuk stability
        
        // Maksimum pesan yang diproses per menit (anti-spam)
        maxMessagesPerMinute: 20, // Reduced untuk safety
        
        // Timeout untuk browser operations
        pageTimeout: 60000,
        
        // Retry attempts
        maxRetries: 3
    },

    // Respon Bot - Dapat dikustomisasi sesuai kebutuhan
    responses: {
        'halo': 'Halo! 👋 Saya adalah bot WhatsApp. Ada yang bisa saya bantu?',
        'hai': 'Hai! 😊 Bagaimana kabar Anda hari ini?',
        'info': `ℹ️ **Informasi Bot**
Saya adalah bot WhatsApp yang dibuat dengan Puppeteer.
Saya bisa membalas pesan otomatis dan menjalankan berbagai perintah!

Ketik "help" untuk melihat perintah yang tersedia.`,
        'ping': 'pong! 🏓',
        'help': `📋 **Daftar Perintah:**

🔹 **halo** - Menyapa bot
🔹 **hai** - Sapaan alternatif
🔹 **info** - Informasi tentang bot
🔹 **ping** - Test koneksi bot
🔹 **help** - Menampilkan bantuan ini
🔹 **waktu** - Menampilkan waktu saat ini
🔹 **tanggal** - Menampilkan tanggal hari ini
🔹 **quote** - Quote inspiratif random
🔹 **broadcast [pesan]** - Kirim pesan ke semua kontak (admin only)

💡 *Tips: Bot akan membalas secara otomatis ketika Anda mengirim salah satu perintah di atas*`,
        'waktu': () => {
            const now = new Date();
            return `🕐 Waktu saat ini: ${now.toLocaleTimeString('id-ID')}`;
        },
        'tanggal': () => {
            const now = new Date();
            return `📅 Tanggal hari ini: ${now.toLocaleDateString('id-ID', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            })}`;
        },
        'quote': () => {
            const quotes = [
                "💫 'Hidup adalah 10% apa yang terjadi padamu dan 90% bagaimana kamu meresponnya.' - Charles R. Swindoll",
                "🌟 'Kesuksesan bukan kunci kebahagiaan. Kebahagiaan adalah kunci kesuksesan.' - Albert Schweitzer",
                "🚀 'Satu-satunya cara untuk melakukan pekerjaan yang hebat adalah dengan mencintai apa yang kamu lakukan.' - Steve Jobs",
                "🌱 'Jangan menunggu kesempatan. Ciptakanlah.' - George Bernard Shaw",
                "💪 'Kegagalan adalah kesempatan untuk memulai lagi dengan lebih cerdas.' - Henry Ford",
                "🎯 'Impian adalah tujuan dengan tenggat waktu.' - Napoleon Hill"
            ];
            return quotes[Math.floor(Math.random() * quotes.length)];
        },
        'default': 'Maaf, saya tidak mengerti pesan Anda. 🤔\nKetik "help" untuk melihat perintah yang tersedia.'
    },

    // Daftar nomor admin (format: '628xxxxxxxxxx@c.us')
    adminNumbers: [
        // Contoh: '6281234567890@c.us'
        // Tambahkan nomor admin di sini
    ],

    // Konfigurasi Session
    session: {
        folderPath: './session',
        fileName: 'session.json'
    },

    // Konfigurasi Logging
    logging: {
        enabled: true,
        logToFile: false,
        logFilePath: './logs/bot.log'
    },

    // Konfigurasi Keamanan
    security: {
        // Blacklist nomor yang tidak boleh berinteraksi dengan bot
        blacklistedNumbers: [
            // Contoh: '6281234567890@c.us'
        ],
        
        // Whitelist nomor yang boleh berinteraksi (kosongkan untuk mengizinkan semua)
        whitelistedNumbers: [
            // Jika diisi, hanya nomor dalam list ini yang bisa berinteraksi
        ],
        
        // Batasan rate limiting per user
        userRateLimit: {
            maxMessages: 10, // Maksimum pesan per interval
            intervalMinutes: 5 // Interval dalam menit
        }
    },

    // Konfigurasi Auto Reply
    autoReply: {
        enabled: true,
        onlyInPrivateChat: false, // Set true jika hanya ingin reply di chat private
        ignoreGroups: true, // Set true untuk mengabaikan pesan grup
        replyToStatus: false // Set true untuk reply ke status WhatsApp
    },

    // Pesan khusus
    specialMessages: {
        welcome: 'Selamat datang! Saya adalah bot WhatsApp. Ketik "help" untuk melihat perintah yang tersedia.',
        offline: 'Bot sedang offline. Silakan coba lagi nanti.',
        maintenance: 'Bot sedang dalam maintenance. Mohon tunggu sebentar.',
        rateLimitExceeded: 'Anda telah mengirim terlalu banyak pesan. Silakan tunggu beberapa saat.'
    },

    // AI Configuration (OpenRouter)
    ai: {
        apiKey: process.env.OPENROUTER_API_KEY || 'sk-or-xxx', // OpenRouter API key
        apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
        model: 'openai/gpt-3.5-turbo', // Bisa ganti dengan model lain
        models: {
            gpt35: 'openai/gpt-3.5-turbo',
            gpt4: 'openai/gpt-4',
            claude: 'anthropic/claude-2',
            mistral: 'mistralai/mistral-7b'
        },
        maxTokens: 250,
        temperature: 0.7,
        timeout: 60000,
        headers: {
            'HTTP-Referer': 'https://github.com/yourusername/wa-bot', // Ganti dengan URL project Anda
            'X-Title': 'WhatsApp Bot' // Nama aplikasi Anda
        }
    }
}; 