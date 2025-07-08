const fetch = require('node-fetch');
const crypto = require('crypto');
const merchant = ''; // Ganti dengan merchant yang diberikan oleh Tokopay
const secret = ''; // Ganti dengan secret yang diberikan oleh Tokopay
function generateRefId() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formattedDate = `${year}${month}${day}`;
    
    return 'TP' + formattedDate + Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
}

const ref_id = generateRefId();

async function createOrder(dataOrder) {
    const { merchant, metode, secret, ref_id, nominal } = dataOrder;
    
    const url = `https://api.tokopay.id/v1/order?merchant=${merchant}&secret=${secret}&ref_id=${ref_id}&nominal=${nominal}&metode=${metode}`;
    
    //console.log('Request URL:', url); // Log URL untuk debugging
    
    try {
        const response = await fetch(url, { method: 'GET' });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gagal dengan status ${response.status}: ${errorText}`);
        }

        const responseData = await response.json();
        responseData.expirationTime = Date.now() + 10 * 60 * 1000;
        
        //console.log('Order Status Response:', responseData); // Log response untuk debugging
        return responseData;

    } catch (error) {
        console.error('Gagal membuat order:', error.message);
        throw new Error('Gagal membuat order di Tokopay.');
    }
}

// Fungsi untuk cek status order
async function checkOrderStatus({ merchant, secret, ref_id, nominal, metode }) {
    try {
        // Buat URL sesuai dengan dokumentasi Tokopay
        const url = `https://api.tokopay.id/v1/order?merchant=${merchant}&secret=${secret}&ref_id=${ref_id}&nominal=${nominal}&metode=${metode}`;

        //console.log('Request URL:', url); // Log URL untuk debugging

        // Kirim request GET untuk cek status order
        const response = await fetch(url, {
            method: 'GET'
        });

        // Cek jika response berhasil
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Request gagal dengan status ${response.status}: ${errorText}`);
        }

        // Parse response dari server
        const responseData = await response.json();
        //console.log('Order Status Response:', responseData); // Log response untuk debugging
        return responseData;

    } catch (error) {
        console.error('Error mengecek status order:', error);
        throw new Error('Gagal mengecek status order.');
    }
}

async function checkAccountInfo({ merchant, secret }) {
    try {
        // Create MD5 signature
        const signature = crypto.createHash('md5')
            .update(`${merchant}:${secret}`)
            .digest('hex');

        // Prepare the URL with query parameters
        const url = `https://api.tokopay.id/v1/merchant/balance?merchant=${merchant}&signature=${signature}`;

        // Make the GET request
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const responseData = await response.json();
        //console.log('Response from API:', responseData); // Log for debugging
        return responseData;
    } catch (error) {
        console.error('Error checking account information:', error);
        throw new Error('Failed to retrieve account information.');
    }
}

async function withdrawBalance({ merchant_id, secret, nominal }) {
    try {
        // Calculate signature
        const signature = crypto.createHash('md5')
            .update(`${merchant}:${secret}:${nominal}`)
            .digest('hex');

        // Prepare request body
        const requestBody = {
        	nominal: nominal,
            merchant_id: merchant,            
            signature: signature
        };

        // Make API request
        const response = await fetch('https://api.tokopay.id/v1/tarik-saldo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        // Parse response
        const responseData = await response.json();

        return responseData;
    } catch (error) {
        console.error('Error withdrawing balance:', error);
        throw new Error('Failed to withdraw balance.');
    }
}

// Export the functions correctly
module.exports = { createOrder, checkOrderStatus, checkAccountInfo, withdrawBalance };