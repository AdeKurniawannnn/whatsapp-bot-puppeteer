# 🚀 Panduan Instalasi Cepat

## Langkah 1: Persiapan
Pastikan Anda sudah menginstall:
- ✅ **Node.js** (versi 14 atau lebih baru) - [Download di sini](https://nodejs.org)
- ✅ **Google Chrome** atau **Chromium** browser

## Langkah 2: Instalasi
```bash
# 1. Masuk ke folder project
cd "Wa bot"

# 2. Install dependencies
npm install

# 3. Test konfigurasi
npm test
```

## Langkah 3: Menjalankan Bot
```bash
# Menjalankan dengan tampilan lengkap
npm start

# Atau langsung tanpa intro
npm run bot

# Untuk mode headless (tanpa browser)
npm run headless
```

## Langkah 4: Login ke WhatsApp
1. **Browser akan terbuka** secara otomatis
2. **Scan QR Code** yang muncul dengan WhatsApp di ponsel Anda
3. **Tunggu** hingga login berhasil
4. **Bot siap digunakan!** 🎉

## Langkah 5: Test Bot
Kirim pesan ke WhatsApp Anda sendiri dengan perintah:
- `halo` - untuk menyapa bot
- `help` - untuk melihat semua perintah
- `ping` - untuk test koneksi

## 🔧 Kustomisasi

### Mengubah Respon Bot
Edit file `config.js` pada bagian `responses`:
```javascript
responses: {
    'halo': 'Respon custom Anda di sini!',
    // Tambahkan perintah baru
    'custom': 'Perintah custom baru'
}
```

### Mode Headless
Untuk menjalankan tanpa browser, edit `config.js`:
```javascript
browser: {
    headless: true  // Ubah ke true
}
```

## ❓ Troubleshooting

### Browser tidak muncul
```bash
# Install ulang puppeteer
npm uninstall puppeteer
npm install puppeteer
```

### Session error
```bash
# Hapus session lama
rm -rf session/
```

### Port sudah digunakan
```bash
# Kill process yang menggunakan port
pkill -f "chrome\|chromium"
```

## 📞 Bantuan
Jika ada masalah, cek:
1. **README.md** untuk dokumentasi lengkap
2. **examples/** folder untuk contoh kustomisasi
3. **config.js** untuk konfigurasi bot

---
**Selamat menggunakan WhatsApp Bot! 🤖✨** 