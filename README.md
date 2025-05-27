# WhatsApp Bot dengan Puppeteer

Bot WhatsApp otomatis yang dibuat menggunakan Puppeteer untuk mengotomatisasi WhatsApp Web. Bot ini dapat membalas pesan secara otomatis, menjalankan perintah, dan menyimpan session login.

## ✨ Fitur

- 🤖 **Auto Reply**: Membalas pesan secara otomatis berdasarkan keyword
- 📱 **QR Code Login**: Login menggunakan QR code seperti WhatsApp Web biasa
- 💾 **Session Management**: Menyimpan session login agar tidak perlu scan QR berulang
- 🎯 **Command System**: Sistem perintah yang dapat dikustomisasi
- 👑 **Admin Controls**: Kontrol khusus untuk admin (broadcast, dll)
- 🔄 **Real-time Monitoring**: Mendengarkan pesan masuk secara real-time

## 🚀 Instalasi

### Prasyarat
- Node.js (versi 14 atau lebih baru)
- npm atau yarn
- Google Chrome atau Chromium browser

### Langkah Instalasi

1. **Clone atau download project ini**
   ```bash
   # Jika sudah ada folder project, langsung ke step 2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Jalankan bot**
   ```bash
   npm start
   ```

   Atau untuk development dengan auto-restart:
   ```bash
   npm run dev
   ```

## 📖 Cara Penggunaan

### Menjalankan Bot

1. **Jalankan perintah start**
   ```bash
   npm start
   ```

2. **Browser akan terbuka otomatis** dan menampilkan WhatsApp Web

3. **Scan QR Code** yang muncul di terminal atau di browser dengan WhatsApp di ponsel Anda

4. **Bot siap digunakan!** Setelah login berhasil, bot akan mulai mendengarkan pesan masuk

### Perintah Bot

Bot akan merespons perintah-perintah berikut:

- `halo` - Bot akan menyapa kembali
- `hai` - Sapaan alternatif  
- `info` - Informasi tentang bot
- `ping` - Test koneksi (bot akan membalas "pong!")
- `help` - Menampilkan daftar perintah yang tersedia
- `broadcast [pesan]` - Kirim pesan ke semua kontak (khusus admin)

### Contoh Penggunaan

**User mengirim:** `halo`
**Bot membalas:** `Halo! Saya adalah bot WhatsApp. Ada yang bisa saya bantu?`

**User mengirim:** `ping`  
**Bot membalas:** `pong! 🏓`

## ⚙️ Konfigurasi

### Mengubah Respon Bot

Edit file `index.js` pada bagian `botResponses`:

```javascript
this.botResponses = {
    'halo': 'Halo! Saya adalah bot WhatsApp. Ada yang bisa saya bantu?',
    'hai': 'Hai! Bagaimana kabar Anda hari ini?',
    // Tambahkan respon custom Anda di sini
    'custom': 'Ini adalah respon custom',
    'default': 'Maaf, saya tidak mengerti pesan Anda.'
};
```

### Menambah Admin

Untuk mengaktifkan fitur admin (seperti broadcast), tambahkan nomor WhatsApp admin:

```javascript
this.adminNumbers = [
    '6281234567890@c.us', // Ganti dengan nomor admin
    // Tambahkan nomor admin lainnya
];
```

### Mode Headless

Untuk menjalankan bot tanpa membuka browser (headless mode), ubah konfigurasi di `index.js`:

```javascript
this.browser = await puppeteer.launch({
    headless: true, // Ubah ke true
    // ... konfigurasi lainnya
});
```

## 📁 Struktur Folder

```
whatsapp-bot-puppeteer/
├── index.js          # File utama bot
├── package.json      # Dependencies dan scripts
├── README.md         # Dokumentasi ini
└── session/          # Folder session (dibuat otomatis)
    └── session.json  # File session login
```

## 🛠️ Troubleshooting

### Bot tidak bisa login
- Pastikan WhatsApp Web bisa diakses di browser biasa
- Hapus folder `session/` dan coba login ulang
- Pastikan koneksi internet stabil

### Pesan tidak terdeteksi
- WhatsApp Web sering mengubah struktur DOM
- Coba restart bot jika ada masalah
- Pastikan chat yang ingin dibalas sedang aktif/terbuka

### Browser tidak terbuka
- Pastikan Google Chrome terinstall
- Coba install Chromium: `sudo apt-get install chromium-browser` (Linux)
- Atau install Google Chrome secara manual

### Error permission di Linux/Mac
```bash
sudo chmod +x node_modules/.bin/*
```

## ⚠️ Catatan Penting

1. **Gunakan dengan bijak**: Bot ini untuk keperluan automasi personal, bukan spam
2. **Patuhi ToS WhatsApp**: Pastikan penggunaan tidak melanggar ketentuan WhatsApp
3. **Session sensitive**: Jangan share file session dengan orang lain
4. **Rate limiting**: WhatsApp memiliki batasan pengiriman pesan, jangan kirim terlalu cepat

## 🔧 Pengembangan Lanjutan

### Menambah Fitur Baru

1. **Database Integration**: Tambahkan database untuk menyimpan data user
2. **AI Integration**: Integrasikan dengan ChatGPT atau AI lainnya
3. **Media Support**: Tambahkan dukungan untuk gambar, audio, video
4. **Scheduler**: Tambahkan fitur jadwal kirim pesan
5. **Analytics**: Tambahkan tracking statistik penggunaan

### Contoh Penambahan Fitur Database

```javascript
// Tambahkan di constructor
const sqlite3 = require('sqlite3');
this.db = new sqlite3.Database('bot.db');

// Buat tabel
this.db.run(`CREATE TABLE IF NOT EXISTS users (
    phone TEXT PRIMARY KEY,
    name TEXT,
    last_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);
```

## 🤝 Kontribusi

Kontribusi sangat diterima! Silakan:

1. Fork repository ini
2. Buat branch fitur baru (`git checkout -b fitur-baru`)
3. Commit perubahan (`git commit -am 'Tambah fitur baru'`)
4. Push ke branch (`git push origin fitur-baru`)
5. Buat Pull Request

## 📞 Support

Jika ada pertanyaan atau masalah:

1. Buka issue di repository ini
2. Atau hubungi developer

## 📄 Lisensi

MIT License - bebas digunakan untuk keperluan personal dan komersial.

---

**Happy Coding! 🚀**

*Bot WhatsApp ini dibuat dengan ❤️ menggunakan Puppeteer* 