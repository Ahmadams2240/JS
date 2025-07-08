require('dotenv').config();
console.log('✅ Starting.....');
console.clear();
const http = require('http');
const os = require('os');
const Cfonts = require('cfonts');
const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const chalk = require('chalk');
const PORT = 3000;
const app = express();
Cfonts.say('INFINITY', { font: 'tiny' });

app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const data = {
    status: 'true',
    message: 'Infinity is now running',
    author: 'AMS'
  };
  const result = { response: data };
  res.send(JSON.stringify(result, null, 2));
});

// Konfigurasi merchant_id, secret, dan IP whitelist
const MERCHANT_ID = ''; // Ganti dengan merchant_id yang diberikan oleh Tokopay
const SECRET = ''; // Ganti dengan secret yang diberikan oleh Tokopay
const WHITELISTED_IP = '178.128.104.179'; // IP Tokopay untuk whitelist

app.use(express.json());

// Fungsi untuk membuat hash MD5 dari input string
function generateMD5Hash(input) {
  return crypto.createHash('md5').update(input).digest('hex');
}

// Fungsi untuk mengirim data ke webhook dengan retry
async function sendDataWithRetry(url, data, maxRetries = 3, delay = 2 * 60 * 1000) {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      const response = await axios.post(url, data);
      console.log('Data berhasil dikirim:', response.data);
      return response.data;
    } catch (error) {
      attempt++;
      console.error(`Percobaan ${attempt} gagal:`, error.message);

      if (attempt === maxRetries) {
        console.error('Gagal mengirim data setelah 3 percobaan.');
        throw new Error('Gagal mengirim data setelah 3 percobaan.');
      }

      console.log(`Menunggu ${delay / 1000 / 60} menit sebelum mencoba lagi...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Endpoint webhook untuk menerima data dari Tokopay
app.post('/webhook', async (req, res) => {
  const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  // Verifikasi IP untuk memastikan bahwa permintaan berasal dari Tokopay
  if (!clientIp.includes(WHITELISTED_IP)) {
    console.error('IP tidak diizinkan:', clientIp);
    return res.status(403).json({ status: false, message: 'IP tidak diizinkan' });
  }

  const { data, ref_id, signature } = req.body;

  // Buat string untuk di-hash sebagai verifikasi signature
  const rawSignature = `${MERCHANT_ID}:${SECRET}:${ref_id}`;
  const calculatedSignature = generateMD5Hash(rawSignature);

  // Verifikasi signature
  if (calculatedSignature === signature) {
    console.log('Signature valid');
    console.log('Data transaksi:', data);
    
	// Contoh pemrosesan data (misalnya, simpan ke database atau perbarui status transaksi)
	    const transactionData = {
	        created_at: data.created_at,
	        customer_email: data.customer_email,
	        customer_name: data.customer_name,
	        customer_phone: data.customer_phone,
	        merchant_id: data.merchant_id,
	        payment_channel: data.payment_channel,
	        total_dibayar: data.total_dibayar,
	        total_diterima: data.total_diterima,
	        reference: data.reference,
	        ref_id: data.ref_id,
	        status: data.status
	    };
	
	    console.log('Processed transaction data:', transactionData);
	
    // Kirim respons sukses ke Tokopay sesuai dengan format yang diminta
    res.json({ status: true });

    // Opsional: Kirim data ke endpoint lain dengan retry
    const externalWebhookURL = 'https://tokopay.id'; // Ganti dengan URL webhook tujuan
    const payload = {
      status: true,
      message: 'Contoh data yang dikirim ke webhook lain',
      data
    };

    try {
      await sendDataWithRetry(externalWebhookURL, payload);
    } catch (error) {
      console.error('Gagal mengirim data ke webhook eksternal:', error.message);
    }

  } else {
    console.error('Signature tidak valid');
    res.status(400).json({ status: false, message: 'Invalid signature' });
  }
});

// ===== MIDTRANS WEBHOOK =====
const { updateOrderStatusMidtrans } = require('./function/payment_gateway_midtrans');
app.post('/midtrans-webhook', express.json(), async (req, res) => {
  // Midtrans mengirim signature di header 'x-callback-token' (atau 'x-signature-key' untuk Snap)
  const signatureKey = req.headers['x-signature-key'];
  const body = req.body;

  // Validasi signature (Snap)
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const crypto = require('crypto');
  const expectedSignature = crypto.createHash('sha512')
    .update(body.order_id + body.status_code + body.gross_amount + serverKey)
    .digest('hex');

  if (signatureKey !== expectedSignature) {
    console.error('Signature Midtrans tidak valid!');
    return res.status(400).json({ status: false, message: 'Invalid signature' });
  }

  // Log notifikasi
  console.log('Webhook Midtrans diterima:', body);

  // Contoh update status pembayaran (bisa update database, dsb)
  // Misal: update status order di db_stock.json atau database lain
  // Status pembayaran: settlement, pending, cancel, expire, deny, refund, partial_refund
  switch (body.transaction_status) {
    case 'settlement':
    case 'capture':
      // Pembayaran sukses, update status order
      updateOrderStatusMidtrans(body.order_id, 'settlement');
      console.log('Pembayaran Midtrans sukses untuk order:', body.order_id);
      break;
    case 'pending':
      updateOrderStatusMidtrans(body.order_id, 'pending');
      console.log('Pembayaran Midtrans pending:', body.order_id);
      break;
    case 'cancel':
    case 'expire':
    case 'deny':
      updateOrderStatusMidtrans(body.order_id, 'failed');
      console.log('Pembayaran Midtrans gagal/cancel/expire:', body.order_id);
      break;
    default:
      console.log('Status pembayaran Midtrans:', body.transaction_status, 'untuk order:', body.order_id);
  }

  res.status(200).json({ status: true });
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});

// Fungsi clustering dan server monitoring
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

let isRunning = false;

function start(file) {
  if (isRunning) return;
  isRunning = true;

  const args = [path.join(__dirname, file), ...process.argv.slice(2)];
  const p = spawn(process.argv[0], args, {
    stdio: ["inherit", "inherit", "inherit", "ipc"],
  });

  p.on("message", (data) => {
    console.log(`[ 🎀 INFINITY ]${data}`);
    switch (data) {
      case "reset":
        p.kill();
        isRunning = false;
        start.apply(this, arguments);
        break;
      case "uptime":
        p.send(process.uptime());
        break;
    }
  });

  p.on("exit", (code) => {
    isRunning = false;
    console.error(`❌ sistem bot mati dengan kode: ${code}`);

    if (code === 0) return;

    fs.watchFile(args[0], () => {
      fs.unwatchFile(args[0]);
      start("start.js");
    });
  });

  p.on("error", (err) => {
    console.error('\x1b[31m%s\x1b[0m', `Error: ${err}`);
    p.kill();
    isRunning = false;
    start("start.js");
  });

  const pluginsFolder = path.join(__dirname, "features");

  fs.readdir(pluginsFolder, (err, files) => {
    if (err) {
      console.error(`Error reading plugins folder: ${err}`);
      return;
    }

    console.log(chalk.white.bold(`####################################
      ${chalk.yellow.bold("BOT WA AUTO STORE")}         
        VER 2.0
    MADE BY ${chalk.yellow.bold("AMS")}

🟢 WhatsApp: ${chalk.blue.underline("wa.me/6281215360549")}
🔴 Telegram: ${chalk.blue.underline("https://t.me/YSSHstore")}

📂 Server Info:
- 👥 Platform: ${os.platform()}
- 🗂️ Architecture: ${os.arch()}
- 📂 CPU Model: ${os.cpus()[0].model}
- 💾 Total Memory: ${(os.totalmem() / 1024 / 1024).toFixed(2)} MB
- 🔃 Free Memory: ${(os.freemem() / 1024 / 1024).toFixed(2)} MB
#####################################`));
  });

  setInterval(() => {}, 1000);
}

start("start.js");

process.on('unhandledRejection', () => {
  console.error('\x1b[31m%s\x1b[0m', 'Unhandled promise rejection. Script will restart...');
  start('start.js');
});

process.on('exit', (code) => {
  console.error(`Exited with code: ${code}`);
  console.error('Script will restart...');
  start('start.js');
});