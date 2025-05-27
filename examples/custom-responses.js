// Contoh respon custom untuk WhatsApp Bot
// Copy konfigurasi ini ke config.js untuk menggunakan respon yang lebih menarik

const customResponses = {
    // Respon sederhana
    'halo': 'Halo! 👋 Saya bot WhatsApp yang siap membantu Anda 24/7!',
    'hai': 'Hai! 😊 Ada yang bisa saya bantu hari ini?',
    
    // Respon dengan emoji dan formatting
    'info': `🤖 **Tentang Saya**
    
Saya adalah bot WhatsApp yang cerdas dan ramah!

✨ **Kemampuan Saya:**
• Membalas pesan secara otomatis
• Memberikan informasi waktu dan tanggal
• Berbagi quote inspiratif
• Membantu dengan berbagai perintah

🚀 **Dibuat dengan teknologi:**
• Node.js & Puppeteer
• WhatsApp Web API
• Love & Coffee ☕️`,

    // Respon dinamis dengan fungsi
    'waktu': () => {
        const now = new Date();
        const time = now.toLocaleTimeString('id-ID');
        const greeting = getTimeGreeting(now);
        return `🕐 ${greeting} Sekarang pukul ${time}`;
    },
    
    'tanggal': () => {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        const date = now.toLocaleDateString('id-ID', options);
        return `📅 Hari ini ${date}`;
    },
    
    'cuaca': () => {
        // Contoh respon cuaca (bisa diintegrasikan dengan API cuaca asli)
        const weather = ['Cerah ☀️', 'Berawan ☁️', 'Hujan 🌧️', 'Mendung 🌫️'];
        const temp = Math.floor(Math.random() * 10) + 25; // 25-35°C
        const selectedWeather = weather[Math.floor(Math.random() * weather.length)];
        
        return `🌤️ **Cuaca Hari Ini**
${selectedWeather}
🌡️ Suhu: ${temp}°C
💧 Kelembaban: ${Math.floor(Math.random() * 30) + 60}%

*) Data cuaca simulasi untuk demo`;
    },
    
    // Respon dengan variasi random
    'quote': () => {
        const quotes = [
            {
                text: "Hidup adalah 10% apa yang terjadi padamu dan 90% bagaimana kamu meresponnya",
                author: "Charles R. Swindoll"
            },
            {
                text: "Kesuksesan bukan kunci kebahagiaan. Kebahagiaan adalah kunci kesuksesan",
                author: "Albert Schweitzer"
            },
            {
                text: "Satu-satunya cara untuk melakukan pekerjaan yang hebat adalah dengan mencintai apa yang kamu lakukan",
                author: "Steve Jobs"
            },
            {
                text: "Jangan menunggu kesempatan. Ciptakanlah",
                author: "George Bernard Shaw"
            },
            {
                text: "Kegagalan adalah kesempatan untuk memulai lagi dengan lebih cerdas",
                author: "Henry Ford"
            }
        ];
        
        const selectedQuote = quotes[Math.floor(Math.random() * quotes.length)];
        return `💫 **Quote Hari Ini**

"${selectedQuote.text}"

— ${selectedQuote.author}`;
    },
    
    // Respon interaktif
    'help': `📚 **Panduan Penggunaan Bot**

🔹 **Perintah Dasar:**
• \`halo\` - Menyapa bot
• \`info\` - Informasi tentang bot
• \`waktu\` - Cek waktu saat ini
• \`tanggal\` - Cek tanggal hari ini
• \`quote\` - Quote inspiratif random
• \`cuaca\` - Info cuaca (demo)
• \`help\` - Panduan ini

🔹 **Perintah Fun:**
• \`joke\` - Lelucon random
• \`fact\` - Fakta menarik
• \`horoscope\` - Ramalan zodiak

🔹 **Perintah Utility:**
• \`calc [operasi]\` - Kalkulator sederhana
• \`remind [pesan]\` - Pengingat (coming soon)

💡 **Tips:** 
Bot akan merespons ketika mendeteksi keyword dalam pesan Anda`,

    // Respon dengan kondisi
    'joke': () => {
        const jokes = [
            "Kenapa programmer suka gelap? Karena mereka takut bug! 🐛😂",
            "Apa bedanya koding sama masak? Kalau masak salah tambah garam, kalau koding salah tambah bug! 👨‍💻🔥",
            "Kenapa WiFi lemot? Karena lagi diet bandwidth! 📶😄",
            "Programmer itu seperti Superman, tapi kriptonit-nya adalah requirement yang berubah-ubah! 🦸‍♂️💥"
        ];
        return jokes[Math.floor(Math.random() * jokes.length)];
    },
    
    'fact': () => {
        const facts = [
            "🌟 Tahukah kamu? Honey never spoils. Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3,000 years old and still perfectly edible!",
            "🐙 Fakta menarik: Octopus memiliki 3 jantung dan darah berwarna biru!",
            "🌍 Amazing fact: Jika kamu bisa melipat selembar kertas 42 kali, tebalnya akan mencapai bulan!",
            "🎵 Did you know? Musik dapat meningkatkan pertumbuhan tanaman hingga 25%!"
        ];
        return facts[Math.floor(Math.random() * facts.length)];
    },
    
    // Kalkulator sederhana
    'calc': (message) => {
        try {
            // Extract mathematical expression from message
            const expression = message.replace('calc', '').trim();
            if (!expression) {
                return '🧮 **Kalkulator**\n\nContoh penggunaan:\n• calc 2 + 2\n• calc 10 * 5\n• calc 100 / 4';
            }
            
            // Simple evaluation (hanya untuk demo - di produksi gunakan library math yang aman)
            const result = eval(expression.replace(/[^0-9+\-*/.() ]/g, ''));
            return `🧮 **Hasil Perhitungan**\n\n${expression} = ${result}`;
        } catch (error) {
            return '❌ Format perhitungan tidak valid. Contoh: calc 2 + 2';
        }
    },
    
    // Respon default yang lebih menarik
    'default': () => {
        const responses = [
            "🤔 Hmm, saya tidak mengerti pesan itu. Ketik 'help' untuk melihat perintah yang tersedia!",
            "🙈 Maaf, saya belum diajari cara merespons pesan itu. Coba ketik 'help' ya!",
            "🤖 Beep beep! Pesan tidak dikenali. Gunakan 'help' untuk melihat panduan!",
            "✨ Saya masih belajar! Ketik 'help' untuk melihat apa saja yang bisa saya lakukan."
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }
};

// Helper function untuk greeting berdasarkan waktu
function getTimeGreeting(date) {
    const hour = date.getHours();
    
    if (hour < 5) return 'Selamat malam! 🌙';
    if (hour < 12) return 'Selamat pagi! 🌅';
    if (hour < 15) return 'Selamat siang! ☀️';
    if (hour < 18) return 'Selamat sore! 🌇';
    return 'Selamat malam! 🌃';
}

module.exports = customResponses; 