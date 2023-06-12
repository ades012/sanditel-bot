const TelegramBot = require('node-telegram-bot-api');
const mysql = require('mysql');
const dotenv = require('dotenv');
const path = require('path');
// const { Telnet } = require('telnet-client');
// const { exec } = require('child_process');
const { spawn } = require('child_process');

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
        const result = rows[0];
        const response = `Berikut password untuk SSID "${result.ssid}":\nSSID: ${result.ssid}\nPassword: ${result.password}`;
        bot.sendMessage(chatId, response);
      } else {
        const response = `Maaf, data untuk SSID "${requestedSSID}" tidak ditemukan dalam database.`;
        bot.sendMessage(chatId, response);
      }
    });
  });

  bot.onText(/^tambah ssid (.+) password (.+)/i, (msg, match) => {
    const chatId = msg.chat.id;
    const requestedSSID = match[1].trim().toLowerCase();
    const requestedPassword = match[2].trim();

    const insertQuery = `INSERT INTO wifi (ssid, password) VALUES (?, ?)`;
    const values = [requestedSSID, requestedPassword];

    connection.query(insertQuery, values, (err, result) => {
      if (err) {
        console.error('Error executing insert query:', err);
        bot.sendMessage(chatId, 'Oops! An error occurred while inserting data.');
        return;
      }

      if (result.affectedRows > 0) {
        const response = `Data untuk SSID "${requestedSSID}" telah ditambahkan ke database.`;
        bot.sendMessage(chatId, response);
      } else {
        bot.sendMessage(chatId, 'Oops! Failed to insert data to the database.');
      }
    });
  });

  bot.onText(/^hapus ssid (.+)/i, (msg, match) => {
    const chatId = msg.chat.id;
    const requestedSSID = match[1].trim().toLowerCase();

    const selectQuery = `SELECT ssid, password FROM wifi WHERE ssid = ?`;
    const value = requestedSSID;

    connection.query(selectQuery, value, (err, rows) => {
      if (err) {
        console.error('Error executing select query:', err);
        bot.sendMessage(chatId, 'Oops! An error occurred while fetching data.');
        return;
      }

      if (rows.length > 0) {
        const ssid = rows[0].ssid;
        const password = rows[0].password;

        const confirmationMessage = `Apakah Anda yakin ingin menghapus data untuk SSID "${ssid}" dengan password "${password}"? (ya/tidak)`;

        bot.sendMessage(chatId, confirmationMessage).then(() => {
          bot.once('message', (confirmation) => {
            const confirmationText = confirmation.text.trim().toLowerCase();

            if (confirmationText === 'ya') {
              const deleteQuery = `DELETE FROM wifi WHERE ssid = ?`;

              connection.query(deleteQuery, value, (deleteErr, result) => {
                if (deleteErr) {
                  console.error('Error executing delete query:', deleteErr);
                  bot.sendMessage(chatId, 'Oops! An error occurred while deleting data.');
                  return;
                }

                if (result.affectedRows > 0) {
                  const response = `Data untuk SSID "${ssid}" telah dihapus dari database.`;
                  bot.sendMessage(chatId, response);
                } else {
                  const response = `Maaf, terjadi kesalahan saat menghapus data untuk SSID "${ssid}".`;
                  bot.sendMessage(chatId, response);
                }
              });
            } else if (confirmationText === 'tidak') {
              bot.sendMessage(chatId, 'Penghapusan data dibatalkan.');
            } else {
              bot.sendMessage(chatId, 'Mohon berikan jawaban "ya" atau "tidak".');
            }
          });
        });
      } else {
        const response = `Maaf, data untuk SSID "${requestedSSID}" tidak ditemukan dalam database.`;
        bot.sendMessage(chatId, response);
      }
    });
  });

  bot.onText(/list ssid/i, (msg) => {
    const chatId = msg.chat.id;
  
    const query = 'SELECT ssid, password FROM wifi';
  
    connection.query(query, (err, rows) => {
      if (err) {
        console.error('Error executing query:', err);
        bot.sendMessage(chatId, 'Oops! Terjadi kesalahan saat mengambil data.');
        return;
      }
  
      if (rows.length > 0) {
        let response = 'Berikut SSID yang terdaftar:\n\n';
  
        rows.forEach((row) => {
          response += `${row.ssid}\n`;
        });
  
        bot.sendMessage(chatId, response);
      } else {
        bot.sendMessage(chatId, 'Maaf, tidak ada data SSID yang terdaftar.');
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
        const result = rows[0];
        const response = `Berikut detail untuk Switch "${result.name}":\nNama : ${result.detail}\nIP Address : ${result.ip}\nId : ${result.id}\nPassword : ${result.password}`;
        bot.sendMessage(chatId, response);
      } else {
        const response = `Maaf, data untuk Switch "${requestedNAME}" tidak ditemukan. Silahkan kirim pesan "list Switch" tanpa tanda petik untuk melihat list nama switch yang terdaftar.`;
        bot.sendMessage(chatId, response);
      }
    });
  });

  bot.onText(/list switch/i, (msg) => {
    const chatId = msg.chat.id;
  
    const query = 'SELECT name, detail, ip, id, password FROM switch';
  
    connection.query(query, (err, rows) => {
      if (err) {
        console.error('Error executing query:', err);
        bot.sendMessage(chatId, 'Oops! Terjadi kesalahan saat mengambil data.');
        return;
      }
  
      if (rows.length > 0) {
        let response = 'Berikut daftar switch yang terdaftar:\n\n';
  
        rows.forEach((row) => {
          response += `${row.name}\n`;
        });
  
        bot.sendMessage(chatId, response);
      } else {
        bot.sendMessage(chatId, 'Maaf, tidak ada data switch yang terdaftar.');
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

  bot.onText(/help/i, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Berikut perintah untuk Bot Sanditel : \n \n \
password <SSID> - Menampilkan SSID dan Password \n \n \
switch <nama switch> - Menampilkan Detail Switch \n \n \
list ssid - Menampilkan semua SSID yang terdaftar \n \n \
list switch - Menampilkan semua Switch yang terdaftar \n \n \
tambah ssid <nama SSID> password <password> - Menambahkan ssid dan password baru ke database \n \n \
hapus ssid <nama SSID> - Menghapus ssid pada database');
  });
}

console.log('Server Running!');