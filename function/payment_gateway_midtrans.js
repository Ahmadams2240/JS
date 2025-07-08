require('dotenv').config();
const midtransClient = require('midtrans-client');
const fs = require('fs');
const path = require('path');
const ORDERS_FILE = path.join(__dirname, '../orders_midtrans.json');

const snap = new midtransClient.Snap({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY
});

async function createMidtransTransaction(orderId, amount, customer) {
    let parameter = {
        transaction_details: {
            order_id: orderId,
            gross_amount: amount
        },
        customer_details: {
            first_name: customer.name,
            email: customer.email,
            phone: customer.phone
        }
    };
    return await snap.createTransaction(parameter);
}

async function checkMidtransStatus(orderId) {
    return await snap.transaction.status(orderId);
}

function saveOrderMidtrans(order) {
    let orders = [];
    if (fs.existsSync(ORDERS_FILE)) {
        orders = JSON.parse(fs.readFileSync(ORDERS_FILE));
    }
    orders.push(order);
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

function updateOrderStatusMidtrans(order_id, status) {
    if (!fs.existsSync(ORDERS_FILE)) return;
    let orders = JSON.parse(fs.readFileSync(ORDERS_FILE));
    let updated = false;
    orders = orders.map(order => {
        if (order.order_id === order_id) {
            order.status = status;
            updated = true;
        }
        return order;
    });
    if (updated) fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

module.exports = {
    createMidtransTransaction,
    checkMidtransStatus,
    saveOrderMidtrans,
    updateOrderStatusMidtrans
}; 