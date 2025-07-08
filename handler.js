require('dotenv').config();
const simple = require('./function/simple')
const puppeteer = require('puppeteer');
const util = require('util')
const { color } = require('./function/color')
const moment = require("moment-timezone")
const fs = require('fs')
const path = require('path');
const fetch = require("node-fetch")
const crypto = require('crypto')
const axios = require('axios')
const { fetchJson, getBuffer } = require('./function/myfunc')
const { toAudio, toPTT, toVideo, ffmpeg } = require('./function/converter')
const { TelegraPh, UploadFileUgu } = require('./function/Upload_Url');
const db_respon_list = JSON.parse(fs.readFileSync('./list.json'));

/* ~~~~~~~~~ Baileys ~~~~~~~~~ */
const { BufferJSON, 
	WA_DEFAULT_EPHEMERAL, 
	generateWAMessageFromContent, 
	generateWAMessageContent, 
	generateWAMessage, 
	prepareWAMessageMedia, 
	downloadContentFromMessage,
	areJidsSameUser, 
	getContentType,
	InteractiveMessage,
	proto
} = require('@whiskeysockets/baileys')

/* ~~~~~~~~~ PAYMENT GATEWAY ~~~~~~~~~ */
const { createOrder,
    checkOrderStatus,
    checkAccountInfo,
    withdrawBalance
  } = require('./function/payment_gateway_tokopay')
const { createMidtransTransaction, checkMidtransStatus, saveOrderMidtrans, updateOrderStatusMidtrans } = require('./function/payment_gateway_midtrans');
/* ~~~~~~~~~ DATA STOCK ~~~~~~~~~ */
const { addStock, 
    setStock,
    getProductList,
    delStock, 
    changeTitle,
    changePrice,
    changeStockSold,
    changeDescription,
    changeKeterangan,
    changeCode,
    addHistory,
  } = require('./function/store')
/* ~~~~~~~~~ ADD LIST GROUP ~~~~~~~~~ */
const { addResponList,
    delResponList,
    isAlreadyResponList,
    isAlreadyResponListGroup,
    sendResponList,
    updateResponList,
    getDataResponList
  } = require('./function/addlist');
  let db_stock_list = JSON.parse(fs.readFileSync('./db_stock.json'))
/* ~~~~~~~~~ SETTINGS ~~~~~~~~~ */
const { globalSettings, saveSettings } = require('./settings');
const merchant = globalSettings.merchant_id; // Replace with your merchant ID
const secret = globalSettings.secret_key; // Replace with your secret
try {
  const savedSettings = require('./global_settings.json');
  Object.assign(globalSettings, savedSettings);
} catch (error) {
  console.log("Failed to load settings:", error);
}

const isNumber = x => typeof x === 'number' && !isNaN(x)
const delay = ms => isNumber(ms) && new Promise(resolve => setTimeout(resolve, ms))
const sleep = async (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
    async handler(chatUpdate) {
        if (global.db.data == null) await loadDatabase()
        this.msgqueque = this.msgqueque || []
    
        if (!chatUpdate) return
        this.pushMessage(chatUpdate.messages).catch(console.error)
   
        let m = chatUpdate.messages[chatUpdate.messages.length - 1]
        global.settings = global.db.data.settings
        global.fkontak = global.fkontak
        if (!m) return
     
        try {
            m = simple.smsg(this, m) || m
            if (!m) return
            try {
                let user = global.db.data.users[m.sender]
                if (typeof user !== 'object') global.db.data.users[m.sender] = {}
                if (user) {
                    if (!isNumber(user.money)) user.money = 0
                    if (!('registered' in user)) user.registered = false
                    if (!user.registered) {
                        if (!('name' in user)) user.name = m.name
                        if (!('id' in user)) user.id = -1
                        if (!isNumber(user.regTime)) user.regTime = -1
                    }
                    if (!('banned' in user)) user.banned = false
                    if(!('moderator' in user)) user.moderator = false
                    if (!user.acc) user.acc = false
                    if (!user.acc) user.end = false
                    if (!('session' in user)) user.session = ''
                    if (!('buynow' in user)) user.buynow = ''
                    if (!('depo' in user)) user.depo = ''
                    if (!('firstuse' in user)) user.firstuse = false
                } else global.db.data.users[m.sender] = {
                    money: 0,
                    registered: false,
                    name: m.name,
                    id: -1,
                    regTime: -1,
                    banned: false,
                    moderator: false,
                    acc: 0,
                    end: 0,
                    session: '',
                    buynow: '',
                    depo: '',
                    firstuse: true,
                }
                let chat = global.db.data.chats[m.chat]
                if (typeof chat !== 'object') global.db.data.chats[m.chat] = {}
                if (chat) {
                    if (!('isBanned' in chat)) chat.isBanned = false
                    if (!('welcome' in chat)) chat.welcome = true
                    if (!('autoread' in chat)) chat.autoread = true
                    if (!('detect' in chat)) chat.detect = false
                    if (!('sWelcome' in chat)) chat.sWelcome = 'Selamat datang @user!'
                    if (!('sBye' in chat)) chat.sBye = ''
                    if (!('sPromote' in chat)) chat.sPromote = '@user telah di promote'
                    if (!('sDemote' in chat)) chat.sDemote = '@user telah di demote'
                    if (!('delete' in chat)) chat.delete = true
                    if (!('antiVirtex' in chat)) chat.antiVirtex = false
                    if (!('antiLink' in chat)) chat.antiLink = false
                    if (!('badword' in chat)) chat.badword = false
                    if (!('antiSpam' in chat)) chat.antiSpam = false
                    if (!('freply' in chat)) chat.freply = false
                    if (!('antiSticker' in chat)) chat.antiSticker = false
                    if (!('anticall' in chat)) chat.antiCall = true
                    if (!('stiker' in chat)) chat.stiker = false
                    if (!('viewonce' in chat)) chat.viewonce = false
                    if (!('useDocument' in chat)) chat.useDocument = false
                    if (!('antiToxic' in chat)) chat.antiToxic = false
                    if (!isNumber(chat.expired)) chat.expired = 0
                } else global.db.data.chats[m.chat] = {
                    isBanned: false,
                    welcome: true,
                    autoread: true,
                    detect: false,
                    sWelcome: '',
                    sBye: '',
                    sPromote: '*promoted new admin:* @user',
                    sDemote: '*demoted from admin:* @user',
                    delete: true,
                    antiLink: true,
                    stiker: false,
                    antiSticker: true,
                    antiCall: true,
                    antiSpam: true,
                    freply: false,
                    viewonce: false,
                    useDocument: true,
                    antiToxic: true,
                    expired: 0,
                }
                let settings = global.db.data.settings[this.user.jid]
            if (typeof settings !== 'object') global.db.data.settings[this.user.jid] = {}
            if (settings) {
                if (!('self' in settings)) settings.self = true 
                if (!('autoread' in settings)) settings.autoread = true
                if (!('restrict' in settings)) settings.restrict = true
                if (!('autorestart' in settings)) settings.autorestart = true
                if (!('restartDB' in settings)) settings.restartDB = 0
                if (!isNumber(settings.status)) settings.status = 0 // ini buat data set Status, tambah disini
                if (!('anticall' in settings)) settings.anticall = true
                if (!('clear' in settings)) settings.clear = true
                if (!isNumber(settings.clearTime)) settings.clearTime = 0
                if (!('freply' in settings)) settings.freply = true
            } else global.db.data.settings[this.user.jid] = {
                self: true,
                autoread: true,
                restrict: true,
                autorestart: true,
                restartDB: 0,
                status: 0, // disini juga,
                anticall: true, // anticall on apa off?
                clear: true,
                clearTime: 0,
                freply: true
            }
        } catch (e) {
            console.error(e)
        }
            if (typeof m.text !== 'string') m.text = ''

            const isROwner = [conn.decodeJid(global.conn.user.id), ...globalSettings.owner]
                .map(v => (typeof v === 'string' ? v.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null))
                .filter(Boolean)
                .includes(m.sender);
            const isOwner = isROwner || m.fromMe
            const isMods = global.db.data.users[m.sender].moderator
            const isBans = global.db.data.users[m.sender].banned
            if (isROwner) {
                db.data.users[m.sender].moderator = true
                }
            if (!isROwner && isBans) return //m.reply("orang goblok di banned Owner 😂😂😂") 
            
            if (opts['autoread']) await this.readMessages([m.key])
            if (opts['nyimak']) return
            if (!m.fromMe && !global.db.data.users[m.sender].moderator && opts['self']) return 
  
            if (opts['pconly'] && m.chat.endsWith('g.us')) return
            if (opts['gconly'] && !m.fromMe && !m.chat.endsWith('g.us')) return
            if (opts['swonly'] && m.chat !== 'status@broadcast') return
            if (opts['queque'] && m.text && !isMods) {
                let queque = this.msgqueque, time = 1000 * 5
                
                const previousID = queque[queque.length - 1]
                queque.push(m.id || m.key.id)
                setInterval(async function () {
                    if (queque.indexOf(previousID) === -1) clearInterval(this)
                    else await delay(time)
                }, time)
            }

            let usedPrefix
            let _user = global.db.data && global.db.data.users && global.db.data.users[m.sender]

            const groupMetadata = (m.isGroup ? (conn.chats[m.chat] || {}).metadata : {}) || {}
            const participants = (m.isGroup ? groupMetadata.participants : []) || []
            const user = global.db.data.users[m.sender];
            const botNumber = await conn.decodeJid(conn.user.id);
            const isCreator = [botNumber, ...globalSettings.owner]
                .map(v => (typeof v === 'string' ? v.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null))
                .filter(Boolean)
                .includes(m.sender);
            const isRegistered = user.registered
            const groupName = m.isGroup ? groupMetadata.subject : "";
            const groupAdmins = m.isGroup ? await conn.getGroupAdmins(participants) : ''
            const isGroup = m.isGroup
            const isBotAdmins = m.isGroup ? groupAdmins.includes(botNumber) : false
            const isAdmins = m.isGroup ? groupAdmins.includes(m.sender) : false
            const bot = (m.isGroup ? participants.find(u => conn.decodeJid(u.id) == this.user.jid) : {}) || {} // Your Data
            const isRAdmin = user && user.admin == 'superadmin' || false
            const isAdmin = isRAdmin || user && user.admin == 'admin' || false // Is User Admin?
            const isBotAdmin = bot && bot.admin || false // Are you Admin?
			
            // Custom Case By Zrawh
            const currentDate = new Date().toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                timeZone: 'Asia/Jakarta'
            });
            
            const hariini = moment.tz('Asia/Jakarta').format('dddd, DD MMMM YYYY')	
            const currentTime = new Date().toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Asia/Jakarta'
            });
            var body = (m.mtype === 'interactiveResponseMessage') 
			? JSON.parse(m.message.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson).id 
			: (m.mtype === 'conversation') 
			? m.message.conversation 
			: (m.mtype === 'imageMessage') 
			? m.message.imageMessage.caption 
			: (m.mtype === 'videoMessage') 
			? m.message.videoMessage.caption 
			: (m.mtype === 'extendedTextMessage') 
			? m.message.extendedTextMessage.text 
			: (m.mtype === 'buttonsResponseMessage') 
			? m.message.buttonsResponseMessage.selectedButtonId 
			: (m.mtype === 'listResponseMessage') 
			? m.message.listResponseMessage.singleSelectReply.selectedRowId 
			: (m.mtype === 'templateButtonReplyMessage') 
			? m.message.templateButtonReplyMessage.selectedId 
			: (m.mtype === 'documentMessage') 
			? m.message.documentMessage.caption 
			: (m.mtype === 'messageContextInfo') 
			? (m.message.buttonsResponseMessage?.selectedButtonId || m.message.listResponseMessage?.singleSelectReply.selectedRowId || m.text) : '';
            const args = body.trim().split(/ +/).slice(1)
            const pric = '.';
            
            async function downloadAndSaveMediaMessage (type_file, path_file) {
			if (type_file === 'image') {
			var stream = await downloadContentFromMessage(m.message.imageMessage || m.message.extendedTextMessage?.contextInfo.quotedMessage.imageMessage, 'image')
			let buffer = Buffer.from([])
			for await(const chunk of stream) {
			buffer = Buffer.concat([buffer, chunk]) }
			fs.writeFileSync(path_file, buffer)
			return path_file } 
			else if (type_file === 'video') {
			var stream = await downloadContentFromMessage(m.message.videoMessage || m.message.extendedTextMessage?.contextInfo.quotedMessage.videoMessage, 'video')
			let buffer = Buffer.from([])
			for await(const chunk of stream) {
			buffer = Buffer.concat([buffer, chunk])}
			fs.writeFileSync(path_file, buffer)
			return path_file
			} else if (type_file === 'sticker') {
			var stream = await downloadContentFromMessage(m.message.stickerMessage || m.message.extendedTextMessage?.contextInfo.quotedMessage.stickerMessage, 'sticker')
			let buffer = Buffer.from([])
			for await(const chunk of stream) {
			buffer = Buffer.concat([buffer, chunk])}
			fs.writeFileSync(path_file, buffer)
			return path_file
			} else if (type_file === 'audio') {
			var stream = await downloadContentFromMessage(m.message.audioMessage || m.message.extendedTextMessage?.contextInfo.quotedMessage.audioMessage, 'audio')
			let buffer = Buffer.from([])
			for await(const chunk of stream) {
			buffer = Buffer.concat([buffer, chunk])}
			fs.writeFileSync(path_file, buffer)
			return path_file}
			}
            // Response Addlist
            const jam = moment.tz('Asia/jakarta').format('HH:mm:ss')
            const tanggal = moment().tz("Asia/Jakarta").format("ll")
            const sender = m.isGroup ? (m.key.participant ? m.key.participant : m.participant) : m.key.remoteJid
            const q = args.join(" ");
            const content = JSON.stringify(m.message)
            const isImage = (m.mtype == 'imageMessage')
            const isQuotedMsg = (m.mtype == 'extendedTextMessage')
            const isQuotedImage = isQuotedMsg ? content.includes('imageMessage') ? true : false : false
            const isVideo = (m.mtype == 'videoMessage')
            const isQuotedVideo = isQuotedMsg ? content.includes('videoMessage') ? true : false : false
			const isSticker = (m.mtype == 'stickerMessage')
			const isQuotedSticker = isQuotedMsg ? content.includes('stickerMessage') ? true : false : false 
			const isQuotedAudio = isQuotedMsg ? content.includes('audioMessage') ? true : false : false
        	if (m.isGroup && isAlreadyResponList(m.chat, body, db_respon_list)) {
			var get_data_respon = getDataResponList(m.chat, body, db_respon_list)
			if (get_data_respon.isImage === false) {
			conn.sendMessage(m.chat, { text: sendResponList(m.chat, body, db_respon_list) }, {
			quoted: m
			})
            } else {
			conn.sendMessage(m.chat, { image: await getBuffer(get_data_respon.image_url), caption: get_data_respon.response }, {quoted: m})
			}
			}
			
            const prefixes = ['.', '!', '/', '#']; // List of valid prefixes

            function getLevenshteinDistance(a, b) {
                const matrix = [];
            
                // Increment along the first column of each row
                for (let i = 0; i <= b.length; i++) {
                    matrix[i] = [i];
                }
            
                // Increment each column in the first row
                for (let j = 0; j <= a.length; j++) {
                    matrix[0][j] = j;
                }
            
                // Fill in the rest of the matrix
                for (let i = 1; i <= b.length; i++) {
                    for (let j = 1; j <= a.length; j++) {
                        if (b.charAt(i - 1) === a.charAt(j - 1)) {
                            matrix[i][j] = matrix[i - 1][j - 1];
                        } else {
                            matrix[i][j] = Math.min(
                                matrix[i - 1][j - 1] + 1, // substitution
                                Math.min(matrix[i][j - 1] + 1, // insertion
                                    matrix[i - 1][j] + 1)); // deletion
                        }
                    }
                }
            
                return matrix[b.length][a.length];
            }
            
            // Find which prefix was used
            let prefixbos = '';
            for (let prefix of prefixes) {
                if (body.startsWith(prefix)) {
                    prefixbos = prefix;
                    break;
                }
            }

            if (prefixbos) {
                let noPrefix = body.replace(prefixbos, '').trim();
                let [command, ...args_su] = noPrefix.split(/\s+/);
                args_su = args_su || [];
                let _args_su = noPrefix.split(/\s+/).slice(1);
                let text = _args_su.join(' ');
                command = (command || '').toLowerCase();
            
                // Buttons Function
				async function sendbutton(chat, teks, jm) {
				    let msg = generateWAMessageFromContent(chat, {
				        viewOnceMessage: {
				            message: {
				                "messageContextInfo": {
				                "deviceListMetadata": {},
				                "deviceListMetadataVersion": 2
				                },
				                interactiveMessage: proto.Message.InteractiveMessage.create({
				                    contextInfo: {
				                        mentionedJid: [m.sender],
				                        forwardingScore: 9999999, 
				                        isForwarded: true
				                    },
				                    body: proto.Message.InteractiveMessage.Body.create({
				                        text: teks
				                    }),
				                    footer: proto.Message.InteractiveMessage.Footer.create({
				                        text: ''  // Removed wm reference
				                    }),
				                    header: proto.Message.InteractiveMessage.Header.create({
				                        title: '',
				                        subtitle: '',
				                        hasMediaAttachment: false
				                    }),
				                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
				                        buttons: [{ text: `Jgn diedit` }]
				                    })
				                })
				            }
				        }
				    }, { quoted: jm });
				    await conn.relayMessage(msg.key.remoteJid, msg.message, { messageId: msg.key.id });
				}
				
				async function listbut2(chat, teks, listnye, jm) {
					let msg = generateWAMessageFromContent(chat, {
						viewOnceMessage: {
							message: {
								"messageContextInfo": {
								"deviceListMetadata": {},
								"deviceListMetadataVersion": 2
								},
								interactiveMessage: proto.Message.InteractiveMessage.create({
									contextInfo: {
										mentionedJid: [m.sender],
										forwardingScore: 999999,
										isForwarded: true
									},
									body: proto.Message.InteractiveMessage.Body.create({
										text: teks
									}),
									footer: proto.Message.InteractiveMessage.Footer.create({
										text: ""
									}),
									gifPlayback: true,
									nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
										buttons: [
									{
									"name": "single_select",
									"buttonParamsJson": JSON.stringify(listnye)
				                	}
				             	],
					          })
				       	})
				     	}
				   	}
					}, { quoted: jm });
					
					await conn.relayMessage(m.key.remoteJid, msg.message, {
					messageId: msg.key.id
					});
				}
				
                // Handle the command
                switch (command) {
				/*case 'menu':
				case 'help': {
		const teks = `*╭────〔 INFORMATION 〕─*
*┊・ Date:* ${tanggal}
*┊・ Time:* ${jam} WIB
*╰┈┈┈┈┈┈┈┈*`;

    const sections = [
        {
            title: `〔 ALL MENU 〕`,
            rows: [
                { title: "ALL MENU (coming soon)", description: "Menampilkan semua menu", id: `${prefixbos}allmenu` },
            ]
        },
        {
            title: `〔 PUBLIC MENU 〕`,
            rows: [
                { title: "STOK", description: "Cek stok", id: `${prefixbos}stok` },
                { title: "CEK ALL STOK", description: "Cek semua stok", id: `${prefixbos}cekallstok` },
                { title: "BUY", description: "Membeli produk", id: `${prefixbos}buy` },
                { title: "MSG", description: "Kirim pesan ke Owner", id: `${prefixbos}msg` },
                { title: "CLAIM GARANSI", description: "Klaim garansi", id: `${prefixbos}claimgaransi` },
                { title: "STIKER", description: "Buat stiker", id: `${prefixbos}stiker` },
            ]
        },
        {
            title: `〔 OWNER MENU 〕`,
            rows: [                
                { title: "ADD STOK", description: "Tambah stok baru", id: `${prefixbos}addstok` },
                { title: "AMBIL STOK", description: "Ambil stok yang ada", id: `${prefixbos}ambilstok` },
                { title: "SET STOK SOLD", description: "Tandai stok terjual", id: `${prefixbos}setstoksold` },
                { title: "SET STOK", description: "Atur stok", id: `${prefixbos}setstok` },
                { title: "LIST STOK", description: "Tampilkan daftar stok", id: `${prefixbos}liststok` },
                { title: "DELETE STOK", description: "Hapus stok", id: `${prefixbos}delstok` },
                { title: "SET DESKRIPSI", description: "Ubah deskripsi produk", id: `${prefixbos}setdesk` },
                { title: "SET KETERANGAN", description: "Ubah keterangan produk", id: `${prefixbos}setket` },
                { title: "SET HARGA", description: "Ubah harga produk", id: `${prefixbos}setharga` },
                { title: "SET JUDUL", description: "Ubah judul produk", id: `${prefixbos}setjudul` },
                { title: "SET KODE", description: "Ubah Kode produk", id: `${prefixbos}setkode` },
                { title: "CEK INFO AKUN", description: "Cek info akun Tokopay", id: `${prefixbos}cekinfoakun` },
                { title: "TARIK SALDO", description: "Tarik saldo tokopay", id: `${prefixbos}tariksaldo` },
                { title: "SET MERCHANT & SECRET TOKOPAY", description: "Atur merchant ID & secret KEY", id: `${prefixbos}settokopay` },
                { title: "SEND", description: "Kirim pesan", id: `${prefixbos}send` },
                { title: "HIDETAG", description: "Hidetag user", id: `${prefixbos}hidetag` },
                { title: "BROADCAST USER", description: "Broadcast ke user", id: `${prefixbos}broadcast-user` },
            ]
        },
        {
            title: `〔 GROUP MENU 〕`,
            rows: [
                { title: "GROUP OPEN", description: "Buka grup", id: `${prefixbos}group open` },
                { title: "GROUP CLOSE", description: "Tutup grup", id: `${prefixbos}group close` },
                { title: "KICK", description: "Kick pengguna", id: `${prefixbos}kick` },
                { title: "PROSES", description: "Proses pesan", id: `${prefixbos}proses` },
                { title: "DONE", description: "Pesan selesai", id: `${prefixbos}done` },
                { title: "ADD LIST", description: "Tambahkan ke list", id: `${prefixbos}addlist` },
                { title: "DELETE LIST", description: "Hapus dari list", id: `${prefixbos}dellist` },
                { title: "HAPUS LIST", description: "Hapus seluruh list", id: `${prefixbos}hapuslist` },
                { title: "LIHAT LIST", description: "Lihat semua daftar list", id: `${prefixbos}list` },
            ]
        }
    ];

    const bet = {
        title: "MENU",
        sections: sections
    };

    listbut2(m.chat, teks, bet, m);
}
						break;*/
				      case 'menu':
			      	case 'help': {
let menunya = `*╭────〔 DATA 〕─*
*┊・ Date:* ${tanggal}
*┊・ Time:* ${jam} WIB
*╰┈┈┈┈┈┈┈┈*
*╭────〔 PUBLIC MENU 〕─*
*┊・* ${prefixbos}stok
*┊・* ${prefixbos}cekallstok
*┊・* ${prefixbos}buy
*┊・* ${prefixbos}menu
*┊・* ${prefixbos}msg
*┊・* ${prefixbos}riwayat
*┊・* ${prefixbos}claimgaransi
*┊・* ${prefixbos}stiker / s
*╰┈┈┈┈┈┈┈┈*
*╭────〔 OWNER MENU 〕─*
*┊・* ${prefixbos}addstok
*┊・* ${prefixbos}ambilstok
*┊・* ${prefixbos}setstoksold
*┊・* ${prefixbos}setstok
*┊・* ${prefixbos}liststok
*┊・* ${prefixbos}delstok
*┊・* ${prefixbos}setdesk
*┊・* ${prefixbos}setket
*┊・* ${prefixbos}setharga
*┊・* ${prefixbos}setjudul
*┊・* ${prefixbos}setkode
*┊・* ${prefixbos}settokopay
*┊・* ${prefixbos}tariksaldo
*┊・* ${prefixbos}cekinfoakun
*┊・* ${prefixbos}send
*┊・* ${prefixbos}hidetag/h
*┊・* ${prefixbos}broadcast-user/bcuser
*╰┈┈┈┈┈┈┈┈*
*╭────〔 GROUP MENU 〕─*
*┊・* ${prefixbos}group open
*┊・* ${prefixbos}group close
*┊・* ${prefixbos}kick
*┊・* ${prefixbos}proses
*┊・* ${prefixbos}done
*┊*
*┊・* ${prefixbos}addlist (support image)
*┊・* ${prefixbos}dellist
*┊・* ${prefixbos}hapuslist
*┊・* ${prefixbos}list
*╰┈┈┈┈┈┈┈┈*`;

    await m.reply(menunya);
}
						break;			    
			        case 'broadcast-user':
				    case 'bcuser':
					    if (!isCreator) return m.reply(globalSettings.mess.owner);
					    if (m.isGroup) return m.reply(globalSettings.mess.private);
					    const textInput = m.text.split(' ').slice(1);
					    if (textInput.length < 1) return m.reply(`Ex: ${prefixbos+command} Hello World!`);
					    const messageBody = textInput.join(' ');
					
					    // Baca isi file database.json
					    const data = fs.readFileSync('./database.json');
					    const users = JSON.parse(data).users;
					
					    // Kirim broadcast ke user yang sudah terdaftar
					    for (let user in users) {
					        if (users[user].registered === true) {
					            // Kirim broadcast ke user
					            console.log(`Mengirim broadcast ke ${users[user].name}: ${messageBody}`);
					            // Lakukan proses pengiriman pesan broadcast ke user
					            conn.sendMessage(user, {
					                'text': messageBody,
					                'quoted': m
					            });
					        }
					    }
					    m.reply('Pesan broadcast berhasil terkirim ke semua user yang sudah terdaftar.');
					    break;
                	case 'p': 
                    case 'proses': {
                    	if (!isCreator) return m.reply(globalSettings.mess.owner);
						let tek = (`「 *TRANSAKSI PENDING* 」\n\`\`\`\n📆 TANGGAL : ${tanggal}\n⌚ JAM     : ${jam}\n✨ STATUS  : Pending\`\`\`\n\n*--------------------------*\n\n*Pesanan ini akan diproses manual oleh admin,* *Tunggu admin memprosesnya??*\n*Atau Chat : wa.me//${globalSettings.owner}*`)
						conn.sendMessage(m.chat,
						{text: tek})						
						}
						break;
					case 'd':
                    case 'done': {
                    	if (!isCreator) return m.reply(globalSettings.mess.owner);
						let tek = (`「 *TRANSAKSI BERHASIL* 」\n\n\`\`\`📆 TANGGAL : ${tanggal}\n⌚ JAM     : ${jam}\n✨ STATUS  : Berhasil\`\`\`\n\nTerimakasih Telah Order`)
						conn.sendMessage(m.chat,
						{text: tek})
						}
						break;
                	case 's': case 'stiker': {
						if (isImage || isQuotedImage) {
						let media = await downloadAndSaveMediaMessage('image', `./gambar/${tanggal}.jpg`)
						m.reply(`_Wait Proses_...`)
						conn.sendImageAsSticker(m.chat, media, m, { packname: `YogzVPN`, author: `KYT Bot`})
						} else if (isVideo || isQuotedVideo) {
						let media = await downloadAndSaveMediaMessage('video', `./gambar/${tanggal}.mp4`)
						m.reply(`_Wait Proses_...`)
						conn.sendVideoAsSticker(m.chat, media, m, { packname: `YogzVPN`, author: `KYT Bot`})
						} else {
						m.reply(`Kirim/reply gambar/vidio dengan caption *${prefixbos}stiker / ${prefixbos}s*`)
						}
						}
						break
                	case 'group':
					    if (!m.isGroup) return m.reply(globalSettings.mess.group);
					    if (!isAdmins) return m.reply(globalSettings.mess.admin);
						if (!isBotAdmins) return m.reply(globalSettings.mess.botAdmin);						
                        if (!q) return m.reply(`Kirim perintah ${prefixbos} _options_\nOptions : close & open\nContoh : ${prefixbos}close`)
						if (args[0] == "close") {
						conn.groupSettingUpdate(m.chat, 'announcement')
						m.reply(`Sukses mengizinkan hanya admin yang dapat mengirim pesan ke grup ini`)
						} else if (args[0] == "open") {
						conn.groupSettingUpdate(m.chat, 'not_announcement')
						m.reply(`Sukses mengizinkan semua peserta dapat mengirim pesan ke grup ini`)
						} else {
						m.reply(`Kirim perintah ${prefixbos}group _options_\nOptions : close & open\nContoh : ${prefixbos}close`)
						}
						break
                	case 'addlist':
						if (!isCreator) return m.reply(globalSettings.mess.owner);
					    if (!m.isGroup) return m.reply(globalSettings.mess.group);
					    if (!isAdmins) return m.reply(globalSettings.mess.admin);
						var args1 = q.split("@")[0]
						var args2 = q.split("@")[1]
						if (!q.includes("@")) return m.reply(`Gunakan dengan cara ${prefixbos}addlist *key@response*\n\n_Contoh_\n\n${prefixbos}addlist tes@apa\n\nAtau kalian bisa Reply/Kasih Image dengan caption: ${prefixbos}addlist tes@apa`)
						if (isImage || isQuotedImage) {
						if (isAlreadyResponList(m.chat, args1, db_respon_list)) return m.reply(`List respon dengan key : *${args1}* sudah ada di group ini.`)
						let media = await downloadAndSaveMediaMessage('image', `./gambar/${sender.split('@')[0]}.jpg`)
						let url = await TelegraPh(media)
						addResponList(m.chat, args1, args2, true, url, db_respon_list)
						m.reply(`Berhasil menambah List menu : *${args1}*`)
						if (fs.existsSync(media)) return fs.unlinkSync(media)
						} else {
							if (isAlreadyResponList(m.chat, args1, db_respon_list)) return m.reply(`List respon dengan key : *${args1}* sudah ada di group ini.`)
							addResponList(m.chat, args1, args2, false, '-', db_respon_list)
						m.reply(`Berhasil menambah List menu : *${args1}*`)
						}
						break
				    case 'dellist':{
						if (!isCreator) return m.reply(globalSettings.mess.owner);		
					    if (!m.isGroup) return m.reply(globalSettings.mess.group);
					    if (!isAdmins) return m.reply(globalSettings.mess.admin);
						if (db_respon_list.length === 0) return m.reply(`Belum ada list message di database`)
						var arr_rows = [];
						for (let x of db_respon_list) {
						if (x.id === m.chat) {
						arr_rows.push({
						title: x.key,
						rowId: `${prefixbos}hapuslist ${x.key}`
						})
						}
						}
						let tekny = `Silahkan Hapus list dengan Mengetik ${prefixbos}hapuslist Nama list\n\nContoh: ${prefixbos}hapuslist Tes\n\n`;
						  for (let i of arr_rows) {
						    tekny += `List : ${i.title}\n\n`;
						  }
						var listMsg = {
						    text: tekny,
						  };
						conn.sendMessage(m.chat, listMsg)
						}
						break
					case 'hapuslist':
					    if (!m.isGroup) return m.reply(globalSettings.mess.group);
						delResponList(m.chat, q, db_respon_list)
						m.reply(`Sukses delete list message dengan key *${q}*`)
						break
					case 'list':
						  if (!m.isGroup) return m.reply(globalSettings.mess.group)
						  if (db_respon_list.length === 0) {
						    return m.reply(`Belum ada list message di database`);
						  }
						  if (!isAlreadyResponListGroup(m.chat, db_respon_list)) {
						    return m.reply(`Belum ada list message yang terdaftar di group ini`);
						  }
						  var arr_rows = [];
						  for (let x of db_respon_list) {
						    if (x.id === m.chat) {
						      arr_rows.push({
						        title: x.key,
						        rowId: x.key
						      });
						    }
						  }
						  let tekny = `Berikut list item yang tersedia di group ini!\n\nSilahkan ketik nama produk yang diinginkan!\n\n`;
						  for (let i of arr_rows) {
						    tekny += `${i.title}\n`;
						  }
						  var listMsg = {
						    text: tekny,
						  };
						  conn.sendMessage(m.chat, listMsg);
						 break
                	case 'kick':
					    if (!isCreator) return m.reply(globalSettings.mess.owner);				    						
					    if (!m.isGroup) return m.reply(globalSettings.mess.group);						    
					    if (!isBotAdmins) return m.reply(globalSettings.mess.botAdmin);
					    if (!isAdmins) return m.reply(globalSettings.mess.admin);
					    if (!text) return m.reply(`Contoh: ${prefixbos}kick @user / @62xxx`);  
					    
					    let from = m.key.remoteJid;
					    let usersKick = m.mentionedJid[0] 
					        ? m.mentionedJid[0] 
					        : m.quoted 
					            ? m.quoted.sender 
					            : text.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
					    
					    if (!usersKick) {
					        return m.reply("Tidak ada pengguna yang disebutkan atau dikutip untuk dihapus!");
					    }												    
					    
					    try {
					        await conn.groupParticipantsUpdate(from, [usersKick], 'remove');
					        conn.reply(from, `Berhasil mengeluarkan pengguna`, m.id);
					    } catch (error) {
					        conn.reply(from, `Gagal mengeluarkan pengguna: ${error.message}`, m.id);
					    }
					    break
                    case 'hidetag': case 'h' :
                        if (!isAdmins) return m.reply(globalSettings.mess.admin);
                        if (!args.join(' ') || args.join(' ').trim() === "") {
                            return m.reply(`Ex: ${prefixbos+command} Hello there`);
                        }
                        conn.sendMessage(m.chat, { text: args.join(' '), mentions: participants.map(a => a.id) });
                        break
                    case 'send':
                        if (!isCreator) return m.reply(globalSettings.mess.owner);
                        if (m.isGroup) return m.reply(globalSettings.mess.private);
                    
                        const texto = m.text.split(' ').slice(1);
                        if (texto.length < 2) return m.reply(`Ex: ${prefixbos}send 62xxx Hello World!`);
                    
                        const nomortarget = texto[0];
                        const messagenya = texto.slice(1).join(' ');
                    
                        if (!/^\d+$/.test(nomortarget)) return m.reply("Harap berikan nomor yang valid!");
                    
                        try {
                            await conn.sendMessage(`${nomortarget}@s.whatsapp.net`, { text: `${messagenya}\n\nNote: untuk membalas chat admin bisa menggunakan command \`${prefixbos}msg pesanmu\`` });
                            m.reply(`Pesan berhasil terkirim ke wa.me/${nomortarget}.`);
                        } catch (error) {
                            console.error('Error sending message:', error);
                            m.reply('Gagal mengirim pesan.');
                        }
                        break
                    case 'msg':
                        if (m.isGroup) return m.reply(globalSettings.mess.private);
                        const textodo = m.text.split(' ').slice(1);
                        if (textodo.length < 1) return m.reply(`Ex: ${prefixbos}msg Hello World!`);
                        const pesannya = textodo.join(' ');
                        try {
                            globalSettings.owner.forEach(function(number) {
                                conn.sendMessage(number + '@s.whatsapp.net', {
                                    'text': `*Pesan dari ${user.name}*\n*WA:* wa.me/${m.sender.split("@")[0]}\n\nPesan: ${pesannya}`,
                                    'quoted': m.chat
                                });
                            });
                            m.reply('Pesan berhasil terkirim ke admin.');
                        } catch (error) {
                            console.error('Error sending message:', error);
                            m.reply('Gagal mengirim pesan.');
                        }
                        break
                    case 'claimgaransi':
                        //if (!isRegistered) return m.reply(globalSettings.mess.notRegistered);
                        if (m.isGroup) return m.reply(globalSettings.mess.private);
                        if (user.session === 'claimgaransi') {
                            conn.sendMessage(m.chat, { text: `Harap selesaikan claim garansi sebelumnya terlebih dahulu.`});
                        } else {
                            conn.sendMessage(m.chat, { text: `_Harap mengisi data dengan benar._ \n\n_Wiped: ketika login, muncul notif signup._\n_Incorrect password: ketika login, muncul notif kata sandi salah_.`});
                            await new Promise(resolve => setTimeout(resolve, 1500));
                            user.session = 'claimgaransi';
                            conn.sendMessage(m.chat, { text: `FORMAT CLAIM GARANSI\n\n*Produk:*\n*Email:*\n*Password:*\n*Tanggal beli:*\n*Sisa durasi:*\n*Incorrect password/wiped:* `});
                        }
                        break
                    case 'liststok':
                    case 'liststock':
                        if (!isCreator) return m.reply(globalSettings.mess.owner);
                        if (m.isGroup) return m.reply(globalSettings.mess.private);
                        const productCodenya = args[0];
                        if (!productCodenya) return m.reply(`Ex: ${prefixbos+command} <code>`);
    
                        // Find the stock item by code
                        const stockItem = db_stock_list.find(stock => stock.code === productCodenya.toLowerCase());
    
                        if (!stockItem) {
                            return m.reply("Tidak ada produk yang ditemukan dengan kode itu.");
                        }
    
                        let responseMessage = `*╭────〔 LIST STOK ACCOUNT 〕─*\n` +
                                              `*┊・ Item* : ${stockItem.name}\n` +
                                              `*┊・ Kode*: ${stockItem.code}\n` +
                                              `*┊・ Total Stok*: ${stockItem.accounts.length}\n`;
                        stockItem.accounts.forEach((account, index) => {
                            responseMessage += `*┊・ Stok ${index + 1}*: ${account.email}:${account.password}\n`;
                        });
                        responseMessage += '*╰┈┈┈┈┈┈┈┈*';
                        m.reply(responseMessage);
                        break
                    case 'addstok':
                    case 'addstock':
					    if (!isCreator) return m.reply(globalSettings.mess.owner);
					    // if (m.isGroup) return m.reply(globalSettings.mess.private);
					    
					    const stockInput = args.join(' ');
					    const stockRegex = /^([A-Za-z0-9]+)\|([^|]+)\|(\d+)\|([^|]+)\|([^|]+)\n([^|]+\|[^|]+(?:\n[^|]+\|[^|]+)*)$/;
					    
					    if (!stockRegex.test(stockInput)) {
					        return m.reply(`Harap berikan kode produk, judul, harga, deskripsi, dan keterangan dalam format yang benar.\n\nContoh:\n${prefixbos+command} Kode|Judul Produk|Harga Produk|Deskripsi|Keterangan Produk\nemailstock1@gmail.com|passwordstock1\nemailstock2@gmail.com|passwordstock2`);
					    }
					    
					    const newStock = addStock(stockInput, db_stock_list);
					    const newStockIndex = db_stock_list.findIndex(stock => stock.code === newStock.code);
					    const addedStock = db_stock_list[newStockIndex];
					    let message = `*╭────〔 SUKSES MENAMBAHKAN STOK 🎉 〕─*\n` +
					                  `*┊・ Harga*: Rp${addedStock.price.toLocaleString('id-ID')}\n` +
					                  `*┊・ Item* : ${addedStock.name}\n` +
					                  `*┊・ Kode*: ${addedStock.code}\n` +
					                  `*┊・ Total Stok*: ${addedStock.accounts.length}\n` +
					                  `*┊・ Desk*: ${addedStock.description}\n`;
					    
					    // Add keterangan if available
					    if (addedStock.keterangan) {
					        message += `*┊・ Keterangan*: ${addedStock.keterangan}\n`;
					    }
					    
					    message += '*╰┈┈┈┈┈┈┈┈*';
					    m.reply(message);
					    break;
                    case 'delstok':
                    case 'delstock':
                        if (!isCreator) return m.reply(globalSettings.mess.owner);
                        if (m.isGroup) return m.reply(globalSettings.mess.private);
    
                        if (args.length !== 1) {
                            return m.reply('Harap berikan kode produk/stok yang akan dihapus.');
                        }
                        
                        const productCode = args[0];
                        const deletedStock = delStock(productCode, db_stock_list);
                        if (!deletedStock) {
                            return m.reply('Stok tidak ditemukan dengan kode produk yang diberikan.');
                        }
                        m.reply(`Stok dengan kode produk *${productCode}* berhasil dihapus.`);
                        break
                    case 'setstoksold':
					    if (!isCreator) return m.reply(globalSettings.mess.owner);
					
					    if (args.length < 2) {
					        return m.reply(`Ex: ${prefixbos}setstocksold <code> <stockSold>`);
					    }
					    
					    const codeSold = args[0];
					    const newStockSold = parseInt(args[1]);
					    
					    const stockSoldChanged = changeStockSold(codeSold, newStockSold, db_stock_list);
					
					    if (isNaN(newStockSold) || newStockSold < 0) {
					        throw 'Harap berikan angka positif atau nol sebagai jumlah stok yang sudah terjual.';
					    }
					    if (stockSoldChanged) {
					        m.reply(`Jumlah stok terjual dengan kode '${codeSold}' berhasil diubah menjadi '${newStockSold}'.`);
					    } else {
					        m.reply(`Gagal mengubah jumlah stok terjual. Kode stock '${codeSold}' tidak ditemukan.`);
					    }
					    break;
                    case 'setstok':
                    case 'setstock':
                        if (!isCreator) return m.reply(globalSettings.mess.owner);
                        //if (m.isGroup) return m.reply(globalSettings.mess.private);
                        const setStockInput = args.join(' ');
                        const stockUpdateRegex = /^([A-Za-z0-9]+)\s((?:[^|\n]+\|[^|\n]+\n?)*)$/;
                        
                        if (!stockUpdateRegex.test(setStockInput)) {
                            return m.reply(`Harap berikan kode produk dan akun stok dengan kata sandi dalam format yang benar.\n\nContoh:\n${prefixbos}setstok ABC123 email1@gmail.com|password1\nemail2@gmail.com|password2`);
                        }
                        
                        let [, productcode, accountsInput] = setStockInput.match(stockUpdateRegex);
                        const accounts = accountsInput.trim().split('\n').map(account => account.trim());
                        
                        const result = setStock(productcode, accounts, db_stock_list);
                        if (typeof result === 'string') {
                            m.reply(result);  // Reply with the error message
                        } else {
                            let messageSetStock = `*╭────〔 SUKSES MENGUBAH STOK 🎉 〕─*\n` +
                                                  `*┊・ Item* : ${result.name}\n` +
                                                  `*┊・ Kode*: ${result.code}\n` +
                                                  `*┊・ Total Stok*: ${result.accounts.length}\n`;
                            messageSetStock += '*╰┈┈┈┈┈┈┈┈*';
                            m.reply(messageSetStock);  
                        }
                        break
                    case 'setjudul':
                        if (!isCreator) return m.reply(globalSettings.mess.owner);
    
                        if (args.length < 2) {
                            return m.reply(`Ex: ${prefixbos}setjudul <code> <judul>`);
                        }
                        
                        const setjudulCode = args[0];
                        const newTitle = args.slice(1).join(' ');
                        if (newTitle.includes('\n')) {
                            return m.reply('Judul stock tidak boleh mengandung baris baru (line break).');
                        }
                        const titleChanged = changeTitle(setjudulCode, newTitle, db_stock_list);
                    
                        if (titleChanged) {
                            m.reply(`Judul stock dengan kode '${setjudulCode}' berhasil diubah menjadi '${newTitle}'.`);
                        } else {
                            m.reply(`Gagal mengubah judul stock. Kode stock '${setjudulCode}' tidak ditemukan.`);
                        }
                        break
                    case 'setharga':
                        if (!isCreator) return m.reply(globalSettings.mess.owner);
    
                        if (args.length < 2) {
                            return m.reply(`Ex: ${prefixbos}setharga <code> <harga>`);
                        }
                        
                        const code = args[0];
                        const newPrice = parseInt(args[1]);
                        
                        const priceChanged = changePrice(code, newPrice, db_stock_list);
    
                        if (isNaN(newPrice) || newPrice <= 0) {
                            throw 'Harap berikan angka positif yang valid sebagai jumlahnya.'
                        }
                        if (priceChanged) {
                            m.reply(`Harga stock dengan kode '${code}' berhasil diubah menjadi '${newPrice}'.`);
                        } else {
                            m.reply(`Gagal mengubah harga stock. Kode stock '${code}' tidak ditemukan.`);
                        }
                        break
                    case 'setdesk':
                        if (!isCreator) return m.reply(globalSettings.mess.owner);
    
                        if (args.length < 2) {
                            return m.reply(`Ex: ${prefixbos}setdesk <kode_produk> <desk>`);
                        }
                        
                        const setDescCode = args[0];
                        const newDesc = args.slice(1).join(' ');
                        const DescChanged = changeDescription(setDescCode, newDesc, db_stock_list);
                    
                        if (DescChanged) {
                            m.reply(`Deskripsi stock dengan kode '${setDescCode}' berhasil diubah menjadi '${newDesc}'.`);
                        } else {
                            m.reply(`Gagal mengubah Deskripsi stock. Kode stock '${setDescCode}' tidak ditemukan.`);
                        }
                        break
                    case 'setket':
					    if (!isCreator) return m.reply(globalSettings.mess.owner);
					
					    if (args.length < 2) {
					        return m.reply(`Ex: ${prefixbos}setket <kode_produk> <keterangan>`);
					    }
					    
					    const setKetCode = args[0];
					    const newKet = args.slice(1).join(' ');
					    const KetChanged = changeKeterangan(setKetCode, newKet, db_stock_list);
					    
					    if (KetChanged) {
					        m.reply(`Keterangan stock dengan kode '${setKetCode}' berhasil diubah menjadi '${newKet}'.`);
					    } else {
					        m.reply(`Gagal mengubah Keterangan stock. Kode stock '${setKetCode}' tidak ditemukan.`);
					    }
					    break;
					case 'setkode':
				        if (!isCreator) {
				            return m.reply(globalSettings.mess.owner);
				        }
				
				        if (args.length < 2) {
				            return m.reply(`Ex: ${prefixbos}setkode <code> <new_code>`);
				        }
				
				        const codeOld = args[0];
				        const newCode = args[1];
				        
				        const codeChanged = changeCode(codeOld, newCode, db_stock_list);
				    
				        if (codeChanged) {
				            m.reply(`Kode stock '${codeOld}' berhasil diubah menjadi '${newCode}'.`);
				        } else {
				            m.reply(`Gagal mengubah kode stock. Kode '${codeOld}' tidak ditemukan.`);
				        }
				        break;
                    case 'cekallstok':
					    const availableStocks = db_stock_list.filter(stock => stock.accounts.length > 0);
					
					    if (availableStocks.length === 0) {
					        return m.reply('Tidak ada stok yang tersedia saat ini.');
					    }
					
					    let message1 = '*╭────〔 DAFTAR STOK YANG TERSEDIA 〕─*\n\n';
					    availableStocks.forEach(stock => {
					        message1 += `*┌───────────────────*\n`;
					        message1 += `*│ Kode     :* ${stock.code}\n`;
					        message1 += `*│ Item     :* ${stock.name}\n`;
					        message1 += `*│ Harga    :* Rp${stock.price.toLocaleString('id-ID')}\n`;
					        message1 += `*│ Stok     :* ${stock.accounts.length}\n`;
					        message1 += `*└───────────────────*\n\n`;
					    });
					
					    m.reply(message1);
						break;
                    case 'ambilstok':
					    if (!isCreator) return m.reply(globalSettings.mess.owner);
					
					    // Function to update stock list
					    function updateStockList(stockList, updatedStock) {
					        return stockList.map(stock => {
					            if (stock.code === updatedStock.code) {
					                return { ...stock, ...updatedStock };
					            }
					            return stock;
					        });
					    }
					
					    // Function to update stock list in db_stock.json file
					    function updateStockListInFile(updatedStockList) {
					        const data = JSON.stringify(updatedStockList, null, 2);
					        fs.writeFileSync('./db_stock.json', data);
					    }
					
					    const [ambilCode, ambilAmountStr] = args;
					    const ambilAmount = parseInt(ambilAmountStr);
					
					    if (!ambilCode || isNaN(ambilAmount) || ambilAmount <= 0) {
					        return m.reply(`Ex: ${prefixbos}ambil <kode> <jumlah>`);
					    }
					
					    const ambilStock = db_stock_list.find(stock => stock.code === ambilCode);
					    if (!ambilStock) {
					        return m.reply(`Gagal mengambil produk. Produk dengan kode '${ambilCode}' tidak ditemukan.`);
					    }
					
					    if (ambilStock.accounts.length < ambilAmount) {
					        return m.reply(`Maaf, stok dengan kode ${ambilCode} hanya tersedia ${ambilStock.accounts.length} stok.`);
					    }
					
					    try {
					        const ambilAccounts = ambilStock.accounts.splice(0, ambilAmount);
					        let accountsDetails = '';
					
					        ambilAccounts.forEach((account) => {
					            accountsDetails += `${account.email} ${account.password}\n`;
					        });
					
					        let fileName = `file.txt`;
					        let folderPath = './dataTxt';
					        let filePath = path.join(folderPath, fileName);
					
					        fs.writeFileSync(filePath, accountsDetails);
					
					        // Update stock list with the remaining accounts data
					        db_stock_list = updateStockList(db_stock_list, ambilStock);
					
					        // Write the updated stock list back to db_stock.json file
					        updateStockListInFile(db_stock_list);
					
					        const successMessages = `\`\`\`✅ Sukses! Stok produk dengan kode ${ambilCode} sebanyak ${ambilAmount} berhasil diambil.\nSilakan cek pesan pribadi dari bot untuk mengunduh file: ${fileName}\`\`\``;
					
					        // Kirim pesan sukses ke grup jika dalam grup
					        if (m.isGroup) {
					            try {
					                await conn.sendMessage(m.chat, {
					                    text: successMessages
					                }, {
					                    quoted: m
					                });
					            } catch (error) {
					                console.error('Error sending successMessage:', error);
					                m.reply('Gagal mengirim successMessage. Terjadi kesalahan.');
					            }
					        }
					
					        // Send file to user in a private message
					        await conn.sendMessage(m.sender, {
					            document: { url: filePath },
					            mimetype: 'text/plain',
					            fileName: fileName,
					            caption: `\`\`\`Produk dengan kode ${ambilCode} sebanyak ${ambilAmount} telah diambil.\nFile dapat diunduh di: ${fileName}\`\`\``
					        }, {
					            quoted: m
					        });
					
					    } catch (error) {
					        console.error('Error processing product:', error);
					        m.reply('Gagal melakukan pengambilan produk. Terjadi kesalahan.');
					    }
					    break;
                    case 'order':
					case 'buynow':
					case 'buy':
					case 'beli': {
					    const [beliCode, beliAmountStr] = args;
					    const beliAmount = parseInt(beliAmountStr);
					    if (!beliCode || isNaN(beliAmount) || beliAmount <= 0) {
					        return m.reply(`Contoh penggunaan: ${prefixbos+command} <kode> <jumlah>`);
					    }
					    const beliStock = db_stock_list.find(stock => stock.code === beliCode);
					    if (!beliStock) {
					        return m.reply(`Gagal membeli. Produk dengan kode '${beliCode}' tidak ditemukan.`);
					    }
					    const totalharga = beliStock.price * beliAmount;
					    if (beliStock.accounts.length < beliAmount) {
					        return m.reply(`Maaf, stok dengan kode ${beliCode} hanya tersedia ${beliStock.accounts.length} stok.`);
					    }
					    // Pilihan metode pembayaran
					    const paymentMsg = `Pilih metode pembayaran:
1. Tokopay (QRIS)
2. Midtrans (QRIS, e-wallet, VA, dsb)

Balas pesan ini dengan angka 1 atau 2.`;
					    await m.reply(paymentMsg);
					    // Tunggu balasan user
					    const filter = (response) => response.key.remoteJid === m.key.remoteJid && response.key.fromMe === false && response.sender === m.sender;
					    let paymentMethod = null;
					    for (let i = 0; i < 30; i++) { // timeout 30 detik
					        await sleep(1000);
					        const lastMsg = (this.chats[m.chat] && this.chats[m.chat].messages) ? Object.values(this.chats[m.chat].messages).pop() : null;
					        if (lastMsg && lastMsg.text && filter(lastMsg)) {
					            if (lastMsg.text.trim() === '1') paymentMethod = 'tokopay';
					            if (lastMsg.text.trim() === '2') paymentMethod = 'midtrans';
					            break;
					        }
					    }
					    if (!paymentMethod) return m.reply('Waktu habis. Silakan ulangi pembelian.');
					    if (paymentMethod === 'tokopay') {
					        // ... existing Tokopay logic ...
					        // (copy dari logic sebelumnya)
					    } else if (paymentMethod === 'midtrans') {
					        // MIDTRANS LOGIC
					        const ref_id = 'MIDTRANS' + Date.now() + Math.floor(Math.random() * 10000);
					        const customer = {
					            name: user.name || 'Customer',
					            email: `${m.sender.split('@')[0]}@wa.me`,
					            phone: m.sender.split('@')[0]
					        };
					        try {
					            const transaction = await createMidtransTransaction(ref_id, totalharga, customer);
					            const snapUrl = transaction.redirect_url;
					            // Simpan order ke file
					            saveOrderMidtrans({
					                order_id: ref_id,
					                wa: m.sender,
					                produk: beliStock.name,
					                kode: beliCode,
					                jumlah: beliAmount,
					                status: 'pending',
					                time: Date.now()
					            });
					            await m.reply(`Silakan selesaikan pembayaran melalui link berikut (berlaku 1 jam):\n${snapUrl}\n\nSetelah membayar, Anda tidak perlu konfirmasi manual. Produk akan dikirim otomatis jika pembayaran sukses.`);
					        } catch (err) {
					            console.error('Midtrans error:', err);
					            m.reply('Gagal membuat transaksi Midtrans. Coba lagi nanti.');
					        }
					    }
                    
                    }
                    break;
					case 'stok':
                    case 'stock':
                    case 'listproduk':
                    case 'listproduct':
                        //if (!isRegistered) return m.reply(globalSettings.mess.notRegistered);
                        const listProdukMessage = `*╭────〔 PRODUCT LIST📦 〕─*\n*┊・* Cara Membeli Produk Ketik Perintah Berikut\n*┊・* ${prefixbos}buy *<kode> <jumlah>*\n*┊・* Contoh: *${prefixbos}buy do3pp 1*\n*┊・* Pastikan Code & Jumlah Akun di *Ketik* dengan *benar*\n┊・ Contact Admin: wa.me/${globalSettings.owner}\n*╰┈┈┈┈┈┈┈┈*\n\n${getProductList(db_stock_list)}`;
                        if (db_stock_list.length === 0) {
                            m.reply("Maaf, stok produk belum tersedia❌. Silakan cek kembali nanti.");
                        } else {
                            m.reply(listProdukMessage);
                        }
                        break                   
                    case 'cekinfoakun':
                        if (!isCreator) return m.reply(globalSettings.mess.owner);                        
					
					    // Call the function to get account info
					    checkAccountInfo({ merchant, secret })
					    .then(responseData => {					
					        // Ensure the response structure matches expected format
					        if (responseData.status === 1 && responseData.rc === 200) {
					            const accountData = responseData.data;
					            let accountInfo = `*╭────〔 INFORMASI AKUN MERCHANT TOKOPAY 〕────*\n`;
					            accountInfo += `*┊ Nama Toko         :* ${accountData.nama_toko || 'Tidak Tersedia'}\n`;
					            accountInfo += `*┊ Saldo Tersedia    :* Rp${(accountData.saldo_tersedia || 0).toLocaleString('id-ID')}\n`;
					            accountInfo += `*┊ Saldo Tertahan    :* Rp${(accountData.saldo_tertahan || 0).toLocaleString('id-ID')}\n`;
					            accountInfo += `*└────────────────────────*`;
					            m.reply(accountInfo);
					        } else {
					            m.reply('Gagal mendapatkan informasi akun. Silakan coba lagi nanti.');
					        }
					    })
					    .catch(error => {
					        console.error('Error fetching account info:', error);
					        m.reply('Gagal mendapatkan informasi akun. Silakan coba lagi nanti.');
					    });
					    break;
                    case 'settokopay':
					    if (!isCreator) return m.reply(globalSettings.mess.owner);
					
					    if (args.length < 2) {
					        return m.reply(`Ex: ${prefixbos}settokopay <merchant_id> <secret_key>`);
					    }
					
					    const merchantID = args[0];
					    const secretKEY = args[1];
					
					    try {
					        // Pastikan checkAccountInfo adalah fungsi async
					        const ress = await checkAccountInfo({ merchant: merchantID, secret: secretKEY });					
					        if (ress.status === 1 && ress.rc === 200) { // Sesuaikan dengan respons API di gambar
					            const userData = ress.data;
					            const profileInfo = `*╭────〔 SUKSES | INFORMASI AKUN MERCHANT TOKOPAY 〕────*\n` +
					                                `*┊ Nama Toko*: ${userData.nama_toko}\n` +
					                                `*┊ Saldo Tersedia*: ${userData.saldo_tersedia}\n` +
					                                `*┊ Saldo Tertahan*: ${userData.saldo_tertahan}\n` +
					                                `*╰──────────────────────────────╯*`;					            
					            // Simpan data ke globalSettings
					            globalSettings.merchant_id = merchantID;
					            globalSettings.secret_key = secretKEY;
					            saveSettings(); // Simpan pengaturan ke file
					            m.reply(profileInfo);
					        } else {
					            m.reply(`Gagal mengubah merchant ID & secret KEY: ${ress.message || 'Terjadi kesalahan.'}`);
					        }
					    } catch (error) {
					        console.error(error);
					        m.reply('Terjadi kesalahan saat mengambil informasi.');
					    }
					    break;
                    case 'riwayat':
                        //if (!isRegistered) return m.reply(globalSettings.mess.notRegistered);
                        if (!user || !user.history || user.history.length === 0) {
                            return m.reply('Tidak ada riwayat transaksi.');
                        }
                    
                        let historyMessage = '*╭─────〔 RIWAYAT TRANSAKSI 〕──*\n*┊*\n*╰─〔 Riwayat transaksi ditampilkan Max 10 〕─*\n\n';
                        
                        // Sort transactions by combined date and time
                        user.history.sort((a, b) => {
                            let dateA = new Date(a.date + ' ' + a.time);
                            let dateB = new Date(b.date + ' ' + b.time);
                            return dateB - dateA; // Sort in descending order
                        });
                    
                        // Take only the latest 10 transactions
                        let latestTransactions = user.history.slice(0, 10);
                    
                        latestTransactions.forEach((transaction) => {
                            let formattedDescription = transaction.description ? transaction.description.replace(/\n/g, '\n*┊・* ') : '';
                            historyMessage += `*╭────〔 ${transaction.date} | ${transaction.time} 〕─*\n`;
                            if (transaction.type === 'buy') {
                                historyMessage += `*┊・ ID TRX* : ${transaction.transactionID}\n`;
                                historyMessage += `*┊・ Service* : ${transaction.service}\n`;
                                historyMessage += `*┊・ Kode Produk* : ${transaction.productCode}\n`;
                                historyMessage += `*┊・ Deskripsi* : ${formattedDescription}\n`;
                                historyMessage += `*┊・ Status* : ${transaction.status}\n`;
                                historyMessage += `*┊・ Harga* : Rp${transaction.price.toLocaleString('id-ID')}\n`;
                                historyMessage += `*┊・ Jumlah Dibeli* : ${transaction.amountBought}\n`;
                                historyMessage += `*┊・ Total Dibayar* : Rp${transaction.totalPrice.toLocaleString('id-ID')}\n`;
                                historyMessage += `*┊・ Saldo Awal* : Rp${transaction.initialBalance.toLocaleString('id-ID')}\n`;
                            }
                            else if (transaction.type === 'depo') {
                                historyMessage += `*┊・ ID* : ${transaction.id}\n`;
                                historyMessage += `*┊・ ID Akun* : ${transaction.akunid}\n`;
                                historyMessage += `*┊・ WhatsApp* : ${transaction.nowa}\n`;
                                historyMessage += `*┊・ Service* : ${transaction.service}\n`;
                                historyMessage += `*┊・ Deskripsi* : ${transaction.desk}\n`;
                                historyMessage += `*┊・ Status* : ${transaction.status}\n`;
                                historyMessage += `*┊・ Saldo Masuk* : Rp${transaction.saldomasuk.toLocaleString('id-ID')}\n`;
                                historyMessage += `*┊・ Total Saldo* : Rp${transaction.totalsaldo.toLocaleString('id-ID')}\n`;
                                historyMessage += `*┊・ Saldo Awal* : Rp${transaction.saldoawal.toLocaleString('id-ID')}\n`;
                            }
                            historyMessage += `*┊・ Tanggal Transaksi* : ${transaction.date}\n`;
                            historyMessage += `*┊・ Jam Transaksi* : ${transaction.time}\n`;
                            historyMessage += `*╰┈┈┈┈┈┈┈┈*\n`;
                        });
                        
                        m.reply(historyMessage);
                        break
                }
            } else {
                if (!user.registered) {
                    let id = Math.random().toString(36).substr(2, 8).toUpperCase(); // Generate 8-character alphanumeric ID
                    let name = conn.getName(m.sender);
                    let wa = m.sender.split("@")[0];
                    let saldo = 0;
            
                    user.name = name;
                    user.id = id;
                    user.money = saldo;
                    user.regTime = +new Date();
                    user.registered = true;
                }
            }

            if (body.trim().startsWith("FORMAT CLAIM GARANSI")) {
                if (m.isGroup) return;
                if (user.session === 'claimgaransi') {  
                    const formatclaim = args.join(' ');
                    conn.sendMessage(m.chat, { text: `📢  REPORT SENT ::\n\nstatus :: report berhasil dikirim.\n\nsilakan tunggu 2x24 jam, fixing akan\ndikirim melalui bot ini jadi make\nsure sebelum resend form, cek\ndulu bot ini. terimakasih.`});
                    globalSettings.owner.forEach(function(number) {
                        conn.sendMessage(number + '@s.whatsapp.net', {
                            'text': `*Request Claim Garansi*\n*WA:* wa.me/${m.sender.split("@")[0]}\n\n${formatclaim}`
                        });
                    });
                    user.session = '';
                }
            }
            for (let name in global.features) {
                let plugin = global.features[name]
                if (!plugin) continue
                if (plugin.disabled) continue
                if (typeof plugin.all === 'function') {
                    try {
                        await plugin.all.call(this, m, chatUpdate)
                    } catch (e) {
                        // if (typeof e === 'string') continue
                        console.error(e)
                    }
                }
                const str2Regex = str => str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
                let _prefix = plugin.customPrefix ? plugin.customPrefix : conn.prefix ? conn.prefix : global.prefix
                let match = (_prefix instanceof RegExp ? // RegExp Mode?
                    [[_prefix.exec(m.text), _prefix]] :
                    Array.isArray(_prefix) ? // Array?
                        _prefix.map(p => {
                            let re = p instanceof RegExp ? // RegExp in Array?
                                p :
                                new RegExp(str2Regex(p))
                            return [re.exec(m.text), re]
                        }) :
                        typeof _prefix === 'string' ? // String?
                            [[new RegExp(str2Regex(_prefix)).exec(m.text), new RegExp(str2Regex(_prefix))]] :
                            [[[], new RegExp]]
                ).find(p => p[1])
                if (typeof plugin.before === 'function') if (await plugin.before.call(this, m, {
                    match,
                    conn: this,
                    participants,
                    groupMetadata,
                    user,
                    bot,
                    isROwner,
                    isOwner,
                    isRAdmin,
                    isAdmin,
                    isBotAdmin,
                    isBans,
                    chatUpdate,
                })) continue
                if (typeof plugin !== 'function') continue
                if ((usedPrefix = (match[0] || '')[0])) {
                    let noPrefix = m.text.replace(usedPrefix, '')
                    let [command, ...args] = noPrefix.trim().split` `.filter(v => v)
                    args = args || []
                    let _args = noPrefix.trim().split` `.slice(1)
                    let text = _args.join` `
                    command = (command || '').toLowerCase()
                    let fail = plugin.fail || global.dfail // When failed
                    let isAccept = plugin.command instanceof RegExp ? // RegExp Mode?
                        plugin.command.test(command) :
                        Array.isArray(plugin.command) ? // Array?
                            plugin.command.some(cmd => cmd instanceof RegExp ? // RegExp in Array?
                                cmd.test(command) :
                                cmd === command
                            ) :
                            typeof plugin.command === 'string' ? // String?
                                plugin.command === command :
                                false

                    if (!isAccept) continue
                    m.plugin = name
                    if (m.chat in global.db.data.chats || m.sender in global.db.data.users) {
                        let chat = global.db.data.chats[m.chat]
                        let user = global.db.data.users[m.sender]
                        if (name != 'unbanchat.js' && chat && chat.isBanned && !isOwner) return // Except this
                    }
                    if (plugin.rowner && plugin.owner && !(isROwner || isOwner)) { // Creator
                        fail('owner', m, this)
                        continue
                    }
                    if (plugin.rowner && !isROwner) { // Real Owner
                        fail('rowner', m, this)
                        continue
                    }
                    if (plugin.restrict) { // Real Owner
                        fail('restrict', m, this)
                        continue
                    }
                    if (plugin.owner && !isOwner) { // Number Owner
                        fail('owner', m, this)
                        continue
                    }
                    if (plugin.mods && !isMods) { // Moderator
                        fail('mods', m, this)
                        continue
                    }
                    if (plugin.banned && !isBans) { // Banned
                        fail('banned', m, this)
                        continue
                    }
                    if (plugin.group && !m.isGroup) { // Group Only
                        fail('group', m, this)
                        continue
                    } else if (plugin.botAdmin && !isBotAdmin) { // You Admin
                        fail('botAdmin', m, this)
                        continue
                    } else if (plugin.admin && !isAdmin) { // User Admin
                        fail('admin', m, this)
                        continue
                    }
                    if (plugin.private && m.isGroup) { // Private Chat Only
                        fail('private', m, this)
                        continue
                    }
                    if (plugin.register == true && _user.registered == false) { // Butuh daftar?
                        fail('unreg', m, this)
                        continue
                    }
                    m.isCommand = true
                    let extra = {
                        match,
                        usedPrefix,
                        noPrefix,
                        _args,
                        args,
                        command,
                        text,
                        conn: this,
                        participants,
                        groupMetadata,
                        user,
                        bot,
                        isROwner,
                        isOwner,
                        isRAdmin,
                        isAdmin,
                        isBotAdmin,
                        isBans,
                        chatUpdate,
                    }
                    try {
                        await plugin.call(this, m, extra)
                    } catch (e) {
                        // Error occured
                        m.error = e
                        console.error(e)
                        if (e) {
                            let text = util.format(e)

                            if (e.name) for (let [jid] of globalSettings.owner.filter(([numbe]) =>   number)) {
                                let data = (await conn.onWhatsApp(jid))[0] || {}
                                if (data.exists) m.reply(`━━━━━ *「 ꜱʏꜱᴇᴍ ᴇʀʀᴏʀ 」*━━━━━━━
•> *ᴘʟᴜɢɪɴ:*  ${m.plugin}
•> *ꜱᴇɴᴅᴇʀ:* @${m.sender.split("@")[0]} *(wa.me/${m.sender.split("@")[0]})*
•> *ᴄʜᴀᴛ:* ${m.chat} 
•> *ᴄᴏᴍᴍᴀɴᴅ:* ${usedPrefix + command}

*[!] ᴇʀʀᴏʀ ʟᴏɢ:*

${text}

━━━━━ *「 ꜱʏꜱᴇᴍ ᴇʀʀᴏʀ 」*━━━━━━━`.trim(), data.jid)
                            }
                            m.reply(text)
                        }
                    } finally {
                        // m.reply(util.format(_user))
                        if (typeof plugin.after === 'function') {
                            try {
                                await plugin.after.call(this, m, extra)
                            } catch (e) {
                                console.error(e)
                            }
                        }
                    }
                    break
                }
            }
        } catch (e) {
            console.error(e)
        } finally {
            if (opts['queque'] && m.text) {
                const quequeIndex = this.msgqueque.indexOf(m.id || m.key.id)
                if (quequeIndex !== -1) this.msgqueque.splice(quequeIndex, 1)
            }
            let user, stats = global.db.data.stats
            if (m) {

                let stat
                if (m.plugin) {
                    let now = + new Date
                    if (m.plugin in stats) {
                        stat = stats[m.plugin]
                        if (!isNumber(stat.total)) stat.total = 1
                        if (!isNumber(stat.success)) stat.success = m.error != null ? 0 : 1
                        if (!isNumber(stat.last)) stat.last = now
                        if (!isNumber(stat.lastSuccess)) stat.lastSuccess = m.error != null ? 0 : now
                    } else stat = stats[m.plugin] = {
                        total: 1,
                        success: m.error != null ? 0 : 1,
                        last: now,
                        lastSuccess: m.error != null ? 0 : now
                    }
                    stat.total += 1
                    stat.last = now
                    if (m.error == null) {
                        stat.success += 1
                        stat.lastSuccess = now
                    }
                }
            }
            if (opts['autoread']) await this.chatRead(m.chat, m.isGroup ? m.sender : undefined, m.id || m.key.id).catch(() => { })
        }
    },
  async  delete(m) {
    let chat = global.db.data.chats[m.chat]
    if (chat.delete) return this.reply(m.chat, `
Terdeteksi @${m.sender.split`@`[0]} telah menghapus pesan
ketik *.disable delete* untuk mematikan pesan ini
`.trim(), m)
    this.copyNForward(m.quoted, m.chat)
    .catch(e => {
    console.log(e, m)
    })
  },
 /*async l onCall(json) {
    if (!db.data.settings[this.user.jid].anticall) return
    let jid = json[2][0][1]['from']
    let isOffer = json[2][0][2][0][0] == 'offer'
    let users = global.db.data.users
    let user = users[jid] || {}
    if (user.whitelist) return
    if (jid && isOffer) {
      const tag = this.generateMessageTag()
      const nodePayload = ['action', 'call', ['call', {
        'from': this.user.jid,
        'to': `${jid.split`@`[0]}@s.whatsapp.net`,
        'id': tag
      }, [['reject', {
        'call-id': json[2][0][2][0][1]['call-id'],
        'call-creator': `${jid.split`@`[0]}@s.whatsapp.net`,
        'count': '0'
      }, null]]]]
      this.sendJSON(nodePayload, tag)
      m.reply(`Kamu dibanned karena menelepon bot, owner : @${owner[0]}`)
    }
  }*/ 
  async  GroupUpdate({ jid, desc, descId, descTime, descOwner, announce, m }) {
    if (!db.data.chats[jid].desc) return
    if (!desc) return
    let caption = `
    @${descOwner.split`@`[0]} telah mengubah deskripsi grup.
    ${desc}
        `.trim()
    this.sendMessage(jid, caption, { quoted: m })
  }
},

global.dfail = (type, m, conn) => {
    let fkontak = {
    "key": {
      "participants": "0@s.whatsapp.net",
      "remoteJid": "status@broadcast",
      "fromMe": false,
      "id": "Halo"
    },
    "message": {
      "contactMessage": {
        "vcard": `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\nFN:y\nitem1.TEL;waid=${m.sender.split('@')[0]}:${m.sender.split('@')[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
      }
    },
    "participant": "0@s.whatsapp.net"
  };
}
    

let chalk = require('chalk')
let file = require.resolve(__filename)
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(chalk.redBright("Update 'handler.js'"))
    delete require.cache[file]
    if (global.reloadHandler) console.log(global.reloadHandler())
})

// Interval pengecekan order Midtrans settlement
setInterval(async () => {
    const fs = require('fs');
    const path = require('path');
    const ORDERS_FILE = path.join(__dirname, 'orders_midtrans.json');
    if (!fs.existsSync(ORDERS_FILE)) return;
    let orders = JSON.parse(fs.readFileSync(ORDERS_FILE));
    for (let order of orders) {
        if (order.status === 'settlement') {
            // Kirim produk ke user WhatsApp
            const beliStock = db_stock_list.find(stock => stock.code === order.kode);
            if (beliStock && beliStock.accounts.length >= order.jumlah) {
                const beliAccounts = beliStock.accounts.splice(0, order.jumlah);
                let accountsDetails = '';
                beliAccounts.forEach((account) => {
                    accountsDetails += `${account.email} ${account.password}\n`;
                });
                let fileName = `file.txt`;
                let folderPath = './dataTxt';
                let filePath = path.join(folderPath, fileName);
                fs.writeFileSync(filePath, accountsDetails);
                await global.conn.sendMessage(order.wa, {
                    document: { url: filePath },
                    mimetype: 'text/plain',
                    fileName: fileName,
                    caption: `Pembelian berhasil! Terima kasih.\n\nProduk: ${order.produk}\nJumlah: ${order.jumlah}\nKode: ${order.kode}`
                });
                // Update stok
                fs.writeFileSync('./db_stock.json', JSON.stringify(db_stock_list, null, 3));
                // Update status order jadi done
                order.status = 'done';
            }
        }
    }
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
}, 10000); // cek tiap 10 detik