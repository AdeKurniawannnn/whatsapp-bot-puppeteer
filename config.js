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
        'halo': 'Hai! 👋 Ada yang bisa aku bantu?',
        'hai': 'Halo! 😊 Apa kabar?',
        'info': `ℹ️ *Info Bot*
Aku adalah bot WhatsApp yang siap membantumu!
Ketik "help" untuk lihat perintah yang tersedia ya.`,
        'ping': 'pong! 🏓',
        'help': `📋 *Perintah yang tersedia:*

🔹 halo - Sapa bot
🔹 hai - Sapa bot
🔹 info - Info tentang bot
🔹 ping - Tes koneksi
🔹 help - Tampilkan bantuan
🔹 waktu - Lihat waktu sekarang
🔹 tanggal - Lihat tanggal hari ini
🔹 quote - Quote random

💡 *Tips: Ketik salah satu perintah di atas untuk mulai*`,
        'waktu': () => {
            const now = new Date();
            // Pastikan menggunakan timezone Asia/Jakarta
            const jakartaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
            
            const hours = jakartaTime.getHours().toString().padStart(2, '0');
            const minutes = jakartaTime.getMinutes().toString().padStart(2, '0');
            
            return `🕐 Jam ${hours}:${minutes} WIB`;
        },
        'tanggal': () => {
            const now = new Date();
            // Pastikan menggunakan timezone Asia/Jakarta
            const jakartaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
            
            const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
            const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
            
            const day = days[jakartaTime.getDay()];
            const date = jakartaTime.getDate();
            const month = months[jakartaTime.getMonth()];
            const year = jakartaTime.getFullYear();
            
            return `📅 Sekarang hari ${day}, ${date} ${month} ${year}`;
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
        'default': 'Maaf, aku ga ngerti 🤔\nCoba ketik "help" untuk lihat perintah yang ada ya!'
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
        welcome: 'Hai! 👋 Aku bot WhatsApp. Ketik "help" untuk lihat perintah yang tersedia ya!',
        offline: 'Bot lagi offline nih. Coba lagi nanti ya!',
        maintenance: 'Bot lagi maintenance. Tunggu sebentar ya!',
        rateLimitExceeded: 'Kamu ngirim pesan terlalu banyak nih. Tunggu sebentar ya!'
    },

    // AI Configuration (OpenRouter)
    ai: {
        apiKey: process.env.OPENROUTER_API_KEY || 'sk-or-xxx',
        apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
        model: 'openai/gpt-3.5-turbo',
        models: {
            gpt35: 'openai/gpt-3.5-turbo',
            gpt4: 'openai/gpt-4',
            claude: 'anthropic/claude-2',
            mistral: 'mistralai/mistral-7b'
        },
        maxTokens: 500,
        temperature: 0.3,
        timeout: 30000,
        headers: {
            'HTTP-Referer': 'https://github.com/AdeKurniawannnn/whatsapp-bot-puppeteer',
            'X-Title': 'WhatsApp Bot'
        },
        systemPrompt: `Kamu adalah asisten WhatsApp yang sangat cerdas, selalu up-to-date, dan memiliki pengetahuan terkini. Panduan untuk responmu:

PENTING - INFORMASI WAKTU:
- Hari ini adalah tahun 2024 (bukan 2021 atau tahun lain)
- Selalu gunakan zona waktu WIB (UTC+7)
- Jika ditanya tanggal hari ini, hitung berdasarkan waktu sekarang
- Jangan pernah menyebutkan tahun 2021 atau tahun lama lainnya

1. GAYA BAHASA:
- Gunakan bahasa Indonesia yang santai dan natural
- Bicara seperti teman, bukan robot
- Gunakan "aku" untuk diri sendiri dan "kamu" untuk user
- Tambahkan emoji yang relevan untuk membuat chat lebih hidup

2. INFORMASI & AKURASI:
- Selalu berikan informasi terkini dan akurat
- Untuk tanggal dan waktu, gunakan zona WIB dan tahun 2024
- Jika ditanya tentang libur atau tanggal penting, cek kalender 2024-2025
- Jika ditanya tentang pejabat, berikan info terkini dengan status saat ini
- Untuk pertanyaan tentang perusahaan atau organisasi, berikan data faktual yang kamu ketahui
- Jika ditanya tentang PT Tequisa Indonesia, jelaskan sebagai perusahaan teknologi informasi

3. KEJUJURAN:
- Jika tidak yakin tentang detail spesifik, akui dengan jujur
- Jangan pernah mengada-ada informasi
- Tawarkan untuk mencari info lebih lanjut jika diperlukan
- Tapi tetap berikan informasi umum yang kamu ketahui

4. BANTUAN:
- Selalu siap membantu dengan ramah
- Jika ada pertanyaan yang tidak jelas, tanyakan detail lebih lanjut
- Berikan saran atau alternatif jika bisa membantu

5. KEAMANAN:
- Jangan berikan informasi sensitif atau pribadi
- Jangan share data konfidensial
- Tetap profesional namun ramah

CONTOH RESPONS YANG BENAR:
- Jika ditanya tanggal: "Hari ini tanggal [tanggal sekarang] [bulan] 2024"
- Jika ditanya PT Tequisa: "PT Tequisa Indonesia adalah perusahaan teknologi informasi yang bergerak di bidang..."
- Selalu gunakan tahun 2024 sebagai referensi waktu saat ini`
    }
}; 