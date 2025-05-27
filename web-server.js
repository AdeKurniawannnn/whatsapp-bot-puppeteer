const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const QRCode = require('qrcode');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static('public'));

// Store QR code data
let currentQR = null;
let botStatus = 'Initializing...';
let botReady = false;

// Routes
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WhatsApp Bot - QR Code Scanner</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            color: white;
        }
        
        .container {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
            border: 1px solid rgba(255, 255, 255, 0.18);
            max-width: 500px;
            width: 90%;
        }
        
        h1 {
            margin-bottom: 20px;
            font-size: 2.5em;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .status {
            margin-bottom: 30px;
            padding: 15px;
            border-radius: 10px;
            font-weight: bold;
            font-size: 1.1em;
        }
        
        .status.initializing {
            background: rgba(255, 193, 7, 0.3);
            border: 2px solid #ffc107;
        }
        
        .status.ready {
            background: rgba(40, 167, 69, 0.3);
            border: 2px solid #28a745;
        }
        
        .status.error {
            background: rgba(220, 53, 69, 0.3);
            border: 2px solid #dc3545;
        }
        
        .qr-container {
            background: white;
            padding: 20px;
            border-radius: 15px;
            margin: 20px 0;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
        
        #qrcode {
            max-width: 100%;
            height: auto;
        }
        
        .instructions {
            background: rgba(255, 255, 255, 0.1);
            padding: 20px;
            border-radius: 10px;
            margin-top: 20px;
            text-align: left;
        }
        
        .instructions h3 {
            margin-bottom: 15px;
            color: #ffc107;
        }
        
        .instructions ol {
            padding-left: 20px;
        }
        
        .instructions li {
            margin-bottom: 8px;
            line-height: 1.5;
        }
        
        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255,255,255,.3);
            border-radius: 50%;
            border-top-color: #fff;
            animation: spin 1s ease-in-out infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        .footer {
            margin-top: 30px;
            font-size: 0.9em;
            opacity: 0.8;
        }
    </style>
    <script src="/socket.io/socket.io.js"></script>
</head>
<body>
    <div class="container">
        <h1>🤖 WhatsApp Bot</h1>
        
        <div id="status" class="status initializing">
            <span class="loading"></span> Menginisialisasi bot...
        </div>
        
        <div id="qr-container" class="qr-container" style="display: none;">
            <img id="qrcode" alt="QR Code" />
        </div>
        
        <div class="instructions">
            <h3>📱 Cara Scan QR Code:</h3>
            <ol>
                <li>Buka WhatsApp di HP Anda</li>
                <li>Tap menu (3 titik) → <strong>Linked Devices</strong></li>
                <li>Tap <strong>"Link a Device"</strong></li>
                <li>Scan QR code yang muncul di atas</li>
                <li>Tunggu hingga bot terhubung</li>
            </ol>
        </div>
        
        <div class="footer">
            <p>🔒 Koneksi aman dengan enkripsi end-to-end</p>
            <p>💡 Bot akan siap menerima pesan setelah terhubung</p>
        </div>
    </div>

    <script>
        const socket = io();
        
        socket.on('qr', (qr) => {
            document.getElementById('qrcode').src = qr;
            document.getElementById('qr-container').style.display = 'block';
            document.getElementById('status').innerHTML = '📱 Scan QR Code dengan WhatsApp';
            document.getElementById('status').className = 'status initializing';
        });
        
        socket.on('ready', () => {
            document.getElementById('status').innerHTML = '✅ Bot WhatsApp Siap Digunakan!';
            document.getElementById('status').className = 'status ready';
            document.getElementById('qr-container').style.display = 'none';
        });
        
        socket.on('authenticated', () => {
            document.getElementById('status').innerHTML = '🔐 Autentikasi berhasil...';
            document.getElementById('status').className = 'status ready';
        });
        
        socket.on('auth_failure', () => {
            document.getElementById('status').innerHTML = '❌ Autentikasi gagal. Refresh halaman untuk coba lagi.';
            document.getElementById('status').className = 'status error';
        });
        
        socket.on('disconnected', () => {
            document.getElementById('status').innerHTML = '⚠️ Bot terputus. Mencoba reconnect...';
            document.getElementById('status').className = 'status error';
        });
        
        // Auto refresh jika ada error
        socket.on('error', () => {
            setTimeout(() => {
                location.reload();
            }, 5000);
        });
    </script>
</body>
</html>
    `);
});

// Socket.io connection
io.on('connection', (socket) => {
    console.log('🌐 Client terhubung ke web interface');
    
    // Send current status to new client
    if (currentQR) {
        socket.emit('qr', currentQR);
    }
    
    if (botReady) {
        socket.emit('ready');
    }
});

// Functions to emit events
function emitQR(qr) {
    QRCode.toDataURL(qr, { width: 300, margin: 2 }, (err, url) => {
        if (err) {
            console.error('❌ Error generating QR code:', err);
            return;
        }
        currentQR = url;
        io.emit('qr', url);
        console.log('📱 QR Code dikirim ke web interface');
    });
}

function emitReady() {
    botReady = true;
    currentQR = null;
    io.emit('ready');
    console.log('✅ Status ready dikirim ke web interface');
}

function emitAuthenticated() {
    io.emit('authenticated');
    console.log('🔐 Status authenticated dikirim ke web interface');
}

function emitAuthFailure() {
    io.emit('auth_failure');
    console.log('❌ Status auth failure dikirim ke web interface');
}

function emitDisconnected() {
    botReady = false;
    io.emit('disconnected');
    console.log('⚠️ Status disconnected dikirim ke web interface');
}

function emitError() {
    io.emit('error');
    console.log('💥 Error dikirim ke web interface');
}

// Start server
server.listen(PORT, () => {
    console.log(`🌐 Web server berjalan di http://localhost:${PORT}`);
    console.log('📱 Buka browser dan akses URL di atas untuk melihat QR code');
});

// Export functions for use in bot
module.exports = {
    emitQR,
    emitReady,
    emitAuthenticated,
    emitAuthFailure,
    emitDisconnected,
    emitError
}; 