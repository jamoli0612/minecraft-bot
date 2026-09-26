const mineflayer = require('mineflayer');
const fs = require('fs');
const http = require('http');

// settings.json faylidan sozlamalarni o'qib olish
let settings;
try {
  const rawData = fs.readFileSync('settings.json');
  settings = JSON.parse(rawData);
} catch (err) {
  console.error('settings.json faylini o\'qishda xatolik:', err);
  process.exit(1);
}

function createBot() {
  console.log('Bot serverga ulanmoqda...');

  const bot = mineflayer.createBot({
    host: settings.server.ip,
    port: settings.server.port || 25565,
    username: settings['bot-account'].username,
    version: false // Server versiyasini avtomatik aniqlash
  });

  // Serverga kirganda avtomatik /register va /login qilish
  bot.on('spawn', () => {
    console.log(`Bot (${bot.username}) serverga muvaffaqiyatli kirdi!`);
    
    if (settings.utils && settings.utils['auto-auth'] && settings.utils['auto-auth'].enabled) {
      const password = settings.utils['auto-auth'].password;
      setTimeout(() => {
        bot.chat(`/register ${password} ${password}`);
        bot.chat(`/login ${password}`);
      }, 2000);
    }
  });

  // Chat orqali TP so'rovi yuborish (tpWhitelist dagi nicklar uchun)
  bot.on('chat', (username, message) => {
    if (username === bot.username) return;

    const whitelist = settings.chat ? settings.chat.tpWhitelist : [];
    
    if (whitelist.includes(username)) {
      if (message.toLowerCase() === 'tp' || message.toLowerCase() === 'tpa') {
        bot.chat(`/tp ${username}`);
        bot.chat(`/tpa ${username}`);
      }
    }
  });

  // Serverdan chiqib ketsa yoki Aternos o'chib yonsa avtomatik qayta ulanish
  bot.on('end', (reason) => {
    console.log(`Bot serverdan uzildi. Sababi: ${reason}. 10 sekunddan keyin qayta ulanadi...`);
    setTimeout(createBot, 10000);
  });

  bot.on('error', (err) => {
    console.error('Bot xatoligi:', err);
  });
}

// Railway o'chib qolmasligi uchun kichik Web-server
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.write('Bot 24/7 ishlamoqda!');
  res.end();
}).listen(PORT, () => {
  console.log(`Web-server ${PORT} portida ishga tushdi.`);
});

// Botni yurgizish
createBot();
