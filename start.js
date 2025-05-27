#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Banner ASCII Art
const banner = `
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║  🤖 WhatsApp Bot dengan Puppeteer                           ║
║                                                              ║
║  Bot otomatis untuk WhatsApp Web menggunakan Puppeteer      ║
║  Dibuat dengan ❤️ untuk memudahkan automasi WhatsApp       ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

📋 Fitur Utama:
  ✅ Auto Reply berdasarkan keyword
  ✅ QR Code login seperti WhatsApp Web
  ✅ Session management (tidak perlu scan ulang)
  ✅ Command system yang dapat dikustomisasi
  ✅ Rate limiting untuk mencegah spam
  ✅ Konfigurasi yang mudah diubah

🚀 Cara Penggunaan:
  1. Bot akan membuka browser otomatis
  2. Scan QR Code dengan WhatsApp di ponsel Anda
  3. Bot siap menerima dan membalas pesan!

⚙️ Konfigurasi:
  📝 Edit file 'config.js' untuk mengubah respon bot
  🔧 Ubah mode headless, delay, dan pengaturan lainnya

⚠️  Catatan Penting:
  • Gunakan bot dengan bijak dan bertanggung jawab
  • Patuhi Terms of Service WhatsApp
  • Jangan gunakan untuk spam atau aktivitas yang merugikan

═══════════════════════════════════════════════════════════════
`;

console.log(banner);

// Check konfigurasi
const configPath = path.join(__dirname, 'config.js');
if (!fs.existsSync(configPath)) {
    console.error('❌ File config.js tidak ditemukan!');
    console.log('💡 Pastikan file config.js ada di folder yang sama dengan bot');
    process.exit(1);
}

// Load dan validate config
try {
    const config = require('./config');
    
    console.log('🔍 Memeriksa konfigurasi...');
    
    // Tampilkan konfigurasi saat ini
    console.log(`📱 Mode Browser: ${config.browser.headless ? 'Headless (tanpa tampilan)' : 'Dengan tampilan'}`);
    console.log(`⏱️  Delay pemrosesan pesan: ${config.bot.messageProcessingDelay}ms`);
    console.log(`📊 Maksimum pesan per menit: ${config.bot.maxMessagesPerMinute}`);
    console.log(`👑 Jumlah admin terkonfigurasi: ${config.adminNumbers.length}`);
    console.log(`🔄 Auto reply aktif: ${config.autoReply.enabled ? 'Ya' : 'Tidak'}`);
    
    if (config.autoReply.ignoreGroups) {
        console.log('📝 Mode: Reply hanya di chat private (grup diabaikan)');
    }
    
    console.log('\n✅ Konfigurasi valid!');
    
} catch (error) {
    console.error('❌ Error dalam konfigurasi:', error.message);
    console.log('💡 Periksa syntax dalam file config.js');
    process.exit(1);
}

// Tampilkan perintah yang tersedia
console.log('\n📋 Perintah Bot yang Tersedia:');
const config = require('./config');
let commandCount = 0;
for (const [command, response] of Object.entries(config.responses)) {
    if (command !== 'default') {
        commandCount++;
        const preview = typeof response === 'function' ? '[Dynamic Response]' : 
                       response.length > 50 ? response.substring(0, 50) + '...' : response;
        console.log(`  🔹 ${command} → ${preview}`);
    }
}
console.log(`\n📊 Total: ${commandCount} perintah tersedia`);

// Countdown sebelum start
console.log('\n🚀 Memulai bot dalam...');
let countdown = 3;
const countdownInterval = setInterval(() => {
    console.log(`   ${countdown}...`);
    countdown--;
    
    if (countdown < 0) {
        clearInterval(countdownInterval);
        console.log('   🎯 GO!\n');
        
        // Start bot
        require('./index.js');
    }
}, 1000);

// Handle CTRL+C during countdown
process.on('SIGINT', () => {
    console.log('\n\n🛑 Dibatalkan oleh user');
    clearInterval(countdownInterval);
    process.exit(0);
}); 