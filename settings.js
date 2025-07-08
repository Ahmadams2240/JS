/* ~~~~~~~~~ INFO PENTING ~~~~~~~~~ */
/* 
Ubah Merchant ID & Secret KEY Tokopay Anda Di 3 File:
- settings.js, 
- index.js + whitelist ip masukin juga di web tokopay sama ip vpsmu (ip samain kaya di file index.js), 
- function/payment_gateway_tokopay.js */

const fs = require('fs');

let globalSettings = {
  merchant_id: '', // Isi Merchant ID Tokopay
  secret_key: '', // Isi Secret Key Tokopay
  owner: [''], // Isi Nomer Owner Yang Valid (ex: 62xxx)
  isPairing: true,
  mess: {
      rowner: `*• Owner Mode:* This feature is only for owners`,
      owner: `*• Owner Mode:* This feature is only for owners`,
      mods: `*• Moderator Mode:* This feature is for moderators only`,
      group: `*• Group Mode:* This feature is only for groups`,
      banned: `*• Banned Mode:* This feature is only for Banned user`,
      private: `*• Private Chat Mode:* This feature is only for private chat`,
      admin: `*• Admin Mode:* This feature is only for admin`,
      botAdmin: `*• Bot Admin Mode:* Bot must be an admin to use this feature`,
      restrict: `*• Restricted Mode:* This feature has disabled`,
      notRegistered: `Silahkan ketik \`daftar\` Untuk Melanjutkan`
  }
};

function saveSettings() {
  fs.writeFileSync('./global_settings.json', JSON.stringify(globalSettings, null, 4));
};

if (!fs.existsSync('./global_settings.json')) {
  saveSettings();
} else {
  try {
      const savedSettings = require('./global_settings.json');
      Object.assign(globalSettings, savedSettings);
  } catch (error) {
      console.log("Failed to load settings:", error);
  }
}

module.exports = {
  globalSettings,
  saveSettings
};