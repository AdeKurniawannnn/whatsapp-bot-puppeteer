#!/usr/bin/env node

console.log('🚀 Memulai WhatsApp Bot dengan Web Interface...\n');

// Start web server first
console.log('🌐 Menjalankan web server...');
require('./web-server');

// Wait a bit then start bot
setTimeout(() => {
    console.log('🤖 Menjalankan WhatsApp bot...');
    require('./bot');
}, 2000);

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Menghentikan bot dan web server...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Menghentikan bot dan web server...');
    process.exit(0);
}); 