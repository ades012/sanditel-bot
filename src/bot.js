const TelegramBot = require('node-telegram-bot-api');
const { processMessage } = require('./nlp');
const { connectDatabase } = require('./db');
const { connection } = require('./db');
const negativeResponses = require('../dataset/negativeResponse');
const positiveResponses = require('../dataset/positiveResponse');
const { dataset } = require('./nlp');
const path = require('path');
// const id_tele = ['1111111','22222222','333333333'];
function runTelegramBot() {
  const token = process.env.TELEGRAM_TOKEN;
  const bot = new TelegramBot(token, { polling: true });

  connectDatabase();

  bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const message = msg.text;

    processMessage(message, (intent) => {
        console.log(`Intent: ${intent}`);
        let requestedSSID = '';
        switch (intent) {
          case 'thanks_intent':
          case 'greeting':
          case 'greeting_islam':
          case 'help':
          case 'memanggil':
            const response = dataset.intents.find((item) => item.tag === intent)?.responses[0];
            bot.sendMessage(chatId, response);
          break;
          case 'get_password':
          const passwordKeyword = 'password ';
          const passwordIndex = message.toLowerCase().indexOf(passwordKeyword);
          
          if (passwordIndex !== -1) {
            const requestedSSID = message.substring(passwordIndex + passwordKeyword.length).trim();
            const query = `SELECT ssid, password FROM wifi WHERE ssid LIKE "${requestedSSID}"`;

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
          } else {
            bot.sendMessage(chatId, 'Format pesan tidak valid. Mohon sertakan "password <SSID>".');
          }
          break;
          case 'get_switch':
          const switchKeyword = 'switch ';
          const switchIndex = message.toLowerCase().indexOf(switchKeyword);

          if (switchIndex !== -1) {
            const requestedNAME = message.substring(switchIndex + switchKeyword.length).trim().toLowerCase();
            const switchQuery = `SELECT name, detail, ip, id, password FROM switch WHERE name LIKE '%${requestedNAME}%'`;

            connection.query(switchQuery, (err, rows) => {
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
          } else {
            bot.sendMessage(chatId, 'Format pesan tidak valid. Mohon sertakan "switch <nama switch>".');
          }
          break;
          case 'list_ssid':
          const listQuery = 'SELECT ssid, password FROM wifi';  
          connection.query(listQuery, (err, rows) => {
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
          break;
          case 'list_switch':
            const listSwitchQuery = 'SELECT name, detail, ip, id, password FROM switch';
    
            connection.query(listSwitchQuery, (err, rows) => {
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
          break;
          case 'add_ssid':
            const ssidRegex = /^tambah ssid (.+) password (.+)/i;
            const match = message.match(ssidRegex);
          
            if (match) {
              const requestedSSID = match[1].trim();
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
            } else {
              bot.sendMessage(chatId, 'Oops! Invalid format for adding SSID. Please use the format: "tambah ssid [SSID] password [password]".');
            }
          break;
          case 'delete_ssid':
            requestedSSID = message.split('ssid ')[1].trim().toLowerCase();
  
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
          break;
          case 'internet_issue':
            const intentData = dataset.intents.find((item) => item.tag === intent);
            const internetResponse = intentData?.responses[0];
            const additionalResponseYes = intentData?.responses[1];
            const additionalResponseNo = intentData?.responses[2];
            const lanWifiMessage = intentData?.lanWifiMessage;
            bot.sendMessage(chatId, internetResponse)
              .then(() => {
                const imagePath = path.join(__dirname, '..', 'pict', 'internet_issue_1.jpg');
                return bot.sendPhoto(chatId, imagePath, { contentType: 'image/jpeg' });
              })
              .then(() => {
                console.log('Gambar berhasil dikirim');
      
                const positivePattern = new RegExp(`\\b(${positiveResponses.join('|')})\\b`, 'i');
                const negativePattern = new RegExp(`\\b(${negativeResponses.join('|')})\\b`, 'i');
                let userName;
                let departmentName;
                const positiveListener = (msg) => {
                  const userResponse = msg.text.toLowerCase();
                  const containsPositiveResponse = positiveResponses.some(response => userResponse.includes(response));
                  const containsNegativeResponse = negativeResponses.some(response => userResponse.includes(response));
                   if (containsPositiveResponse) {
                    const chatId = msg.chat.id;
                    bot.sendMessage(chatId, additionalResponseYes)
                      .then(() => {
                        const imagePath2 = path.join(__dirname, '..', 'pict', 'internet_issue_2.jpg');
                        return bot.sendPhoto(chatId, imagePath2, { contentType: 'image/jpeg' });
                      })
                      .then(() => {
                        console.log('Gambar 2 berhasil dikirim');
                        bot.removeTextListener(positivePattern, positiveListener);
                        
                        const ipAddressMessage = intentData?.ipAddressMessage;
                        bot.sendMessage(chatId, ipAddressMessage)
                        .then(() => {
                          bot.removeTextListener(negativePattern);
  
                          bot.onText(negativePattern, (msg) => {
                            const userResponse = msg.text.toLowerCase();
                            if (negativeResponses.includes(userResponse)) {
                              const lanWifiResponse = intentData?.lanWifiMessage;
                              bot.sendMessage(chatId, lanWifiResponse)
                                .then(() => {
  
                                })
                                .catch((error) => {
                                  console.error('Terjadi kesalahan:', error);
                                });
                              }
                            })
                          });
                        bot.onText(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/, (ipMsg, match) => {
                          const userIpAddress = match[1];
                          if (userIpAddress.startsWith('169')) {
                            const askNameDepartmentMessage = intentData?.nameDepartmentMessage;
                            const reportMessageGroup = intentData?.reportMessageGroup;
                            bot.sendMessage(chatId, askNameDepartmentMessage)
                              .then(() => {
                                bot.onText(/^(?:nama saya\s)?(\w+)\s?(?:dari\s)?(?:bagian\s)?(\w+)/i, (msg, match) => {
                                  const userName = match[1];
                                  const departmentName = match[2];
                                  const groupName = id_group;
                                  const userFullName = `${userName} (${departmentName})`;
                                  const issueMessage = `Issue: ${userIpAddress.startsWith('169') ? 'Tidak mendapatkan DHCP' : '...'}\n`;
                                  const groupMessage = `Internet Issue\nNama: ${userFullName}\nBagian: ${departmentName}\n${issueMessage}`;
            
                                  bot.sendMessage(groupName, groupMessage)
                                    .then(() => {
                                      console.log('Pesan berhasil dikirim ke grup Telegram');
            
                                  const responseMessage = `Baik ${userName}. ` + intentData?.reportIssueMessage;
                                  bot.sendMessage(chatId, responseMessage)
                                  .then(() => {
                                    bot.clearTextListeners();
                                    bot.onText(/^(?:.*)$/, (msg) => {
                                      // Lakukan inisialisasi atau tindakan awal yang diperlukan
                                      // ...
                                      // Kirim pesan selamat datang atau tindakan awal lainnya
                                      // ...
                                    });
                                  })
                                  .catch((error) => {
                                    console.error('Terjadi kesalahan:', error);
                                  });
                                });
                              });
                            })
                          } else {
                          }
                        });
                      })
                      .catch((error) => {
                        console.error('Terjadi kesalahan:', error);
                      });
                  }
                };
              
                bot.onText(positivePattern, positiveListener);
                bot.onText(negativePattern, (msg) => {
                  const userResponse = msg.text.toLowerCase();
                  if (negativeResponses.includes(userResponse)) {
                    bot.sendMessage(chatId, additionalResponseNo)
                    .then(() => {
                      
                    });
                  }
                });
              })
              .catch((error) => {
                console.error('Terjadi kesalahan:', error);
              });
            break;
          }
        });
      });
  }

module.exports = { runTelegramBot };
