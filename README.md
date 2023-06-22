# sanditel-bot
Sebuah kode javascript yang diintegrasikan dengan Bot pada Telegram, bertujuan untuk membantu menghandle keluhan user perihal permasalahan Jaringan Internet dan komputer.
Menggunakan NLPjs sebagai message handler.
Untuk menjalankannya anda membutuhkan :
1. Node JS
2. MariaDB

## Cara Install Sanditel-bot
1. Pull repository ini `git clone https://github.com/ades012/sanditel-bot.git`
2. Buat sebuah Bot Telegram `https://t.me/botfather` \ 
   Kemudian Copy token yang diberikan oleh BotFather
   
4. Buat sebuah grup Telegram \
   Kemudian copy id telegram dengan cara mengakses telegram via web `https://web.telegram.org/` \
   Kemudian buka laman chat Bot yang sudah dibuat dan copy id telegram dari url yang muncul. \
   \
   misal : `https://web.telegram.org/a/#12345678` \
   id telegram nya adalah `12345678`
   
5. Buat Sebuah database menggunakan mariaDB \
    `https://mariadb.com/kb/en/getting-installing-and-upgrading-mariadb/ ` \
   Buatlah sebuah database dengan tabel wifi dan switch \
   Isi tabel wifi : \
     - ssid, password
   Isi tabel Switch : \
     - name, detail, ip, id, password
7. buat sebuah file .env dan isi file dengan env yang dibutuhkan \
   `DB_HOST=<host database>` \
   `DB_PORT=<port database>` \
   `DB_USER=<user database>` \
   `DB_PASSWORD=<password database>` \
   `DB_NAME=<nama database>` \
   `TELEGRAM_TOKEN=<'token telegram'>` \
   `TELEGRAM_GROUP=<'id grup telegram'>`
8. Untuk Operasi CRUD untuk WiFi dan Switch silahkan operasikan sesuka hati, anda bisa menyesuaikan konfigurasi pada database maupun pada kode javascriptnya sesuai yang anda butuhkan.

9. jalankan `node telegram-bot.js`
10. Silahkan lakukan pengujian dengan melakukan konversasi dengan BOT
11. Anda Juga bisa menambahkan pattern dan response baru pada dataset.


## Project ini bersifat eksperimental dan masih dalam tahap pengembangan ##
