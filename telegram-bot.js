const TelegramBot = require('node-telegram-bot-api');
// const ExcelJS = require('exceljs');
const mysql = require('mysql');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const token = process.env.TELEGRAM_TOKEN;
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

connection.connect(err => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  console.log('Connected to database');
  runTelegramBot();
});

function runTelegramBot() {
  const bot = new TelegramBot(token, { polling: true });

  bot.onText(/^password (.+)/i, (msg, match) => {
    const chatId = msg.chat.id;
    const requestedSSID = match[1].trim().toLowerCase();

    const query = `SELECT ssid, password FROM wifi WHERE ssid LIKE '%${requestedSSID}%'`;

    connection.query(query, (err, rows) => {
      if (err) {
        console.error('Error executing query:', err);
        bot.sendMessage(chatId, 'Oops! An error occurred while fetching data.');
        return;
      }

      if (rows.length > 0) {
        const result = rows[0]; // Assuming you want to retrieve only the first matching row
        const response = `Berikut password untuk SSID "${result.ssid}":\nSSID: ${result.ssid}\nPassword: ${result.password}`;
        bot.sendMessage(chatId, response);
      } else {
        const response = `Maaf, data untuk SSID "${requestedSSID}" tidak ditemukan.`;
        bot.sendMessage(chatId, response);
      }
    });
  });

  bot.onText(/^switch (.+)/i, (msg, match) => {
    const chatId = msg.chat.id;
    const requestedNAME = match[1].trim().toLowerCase();

    const query = `SELECT name, detail, ip, id, password FROM switch WHERE name LIKE '%${requestedNAME}%'`;

    connection.query(query, (err, rows) => {
      if (err) {
        console.error('Error executing query:', err);
        bot.sendMessage(chatId, 'Oops! An error occurred while fetching data.');
        return;
      }

      if (rows.length > 0) {
        const result = rows[0]; // Assuming you want to retrieve only the first matching row
        const response = `Berikut detail untuk Switch "${result.name}":\nNama : ${result.detail}\nId : ${result.id}\nPassword : ${result.password}`;
        bot.sendMessage(chatId, response);
      } else {
        const response = `Maaf, data untuk SSID "${requestedSSID}" tidak ditemukan.`;
        bot.sendMessage(chatId, response);
      }
    });
  });

  bot.onText(/dude/i, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Yes my King');
  });

  bot.onText(/nuhun/i, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Sawangsulna Pa/Bu');
  });
}
console.log('Server Running!');

// console.log(data);