const fs = require('fs');
const util = require('util');

//將 exec 非同步化 (可以使用 await)
const exec = util.promisify(require('child_process').exec);

//瀏覽器標頭，讓對方得知我們是人類，而非機器人 (爬蟲)
const headers = {
    'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36',
    'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
    'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
    'Cookie': 'COOKIE_ID=VXM1C50JFT100GG; visit=VXM1C50JFT100GG%7C20200220155658%7C%2F%7Chttps%253A%252F%252Fwww.google.com%252F%7Cend+; fflag=flag_store_manager%3A0%2Cend; _pxvid=a1527a43-53f9-11ea-9800-0242ac120005; __pxvid=aae9ccad-53f9-11ea-a51a-0242ac110003; _pxhd=7565938c9ae629fd763f82a3f6814cc1ac8edc787c3ec559556cc9f94f684b9a:a1527a43-53f9-11ea-9800-0242ac120005; search=start%7Cchateau%2Bmouton%2Brothschild%7C1%7Cany%7CTWD%7C%7C%7C%7C%7C%7C%7C%7C%7Ce%7Ci%7Cend; cookie_enabled=true; ID=0QXPCSW8F0300KS; IDPWD=I50107913; _csrf=XvJ5zvW03Zc-OyFypzBuD26BGiWrB3eG; _gid=GA1.2.550063982.1593937820; _ga_M0W3BEYMXL=GS1.1.1593937820.11.1.1593937833.0; _ga=GA1.2.1857518536.1582214223; _px3=863592a2d85a9cb57ca2258ea97499d7fa0b97d047b466e8aeac2d1219e73939:e8TpqpI9GYN47uPzxVX0BHefvvwMmVUT1PKPs0brZa3Ou0uGx/kf6GZpjdyFeAu14WzZ0EgkFGFFHe+krCJOgw==:1000:8ZX4NEW9gJ0ozW8CoDJ6trfoLSTJnGKyd2kJnfRXIXqqsnDMbwM8zftdCVU8euNXqumpSdL8Muda6nlPLmzLIGhXpZeBV7NZP9cMFQ0FO3BXFuKygNravg4WD1ofiC9Yi/eBq904ClSVnuZRqEfjXrjnmvWqcNVIiC4VujgEp4c=; _px2=eyJ1IjoiY2FlODU5NDAtYmU5OS0xMWVhLWE4YzQtOTk2YjIwNzk0MWQ2IiwidiI6ImExNTI3YTQzLTUzZjktMTFlYS05ODAwLTAyNDJhYzEyMDAwNSIsInQiOjE1OTM5MzgxMzQ0NjYsImgiOiI5Y2Y3YzFmOGZlMzcxMTBlNmYzOWZkMzA4ZDFjZTI1MjJkNTAzNGNlZGYzZmUzNmU0ZjllN2JmMjIwMmY2ODNkIn0=; _pxde=d778826cb9903a373af3e15e3cbef5342e710b2ebe57c846ccfc5aa226430066:eyJ0aW1lc3RhbXAiOjE1OTM5Mzc5MDA2NTMsImZfa2IiOjAsImlwY19pZCI6W119~'
};

//走訪網址
let url = 'https://store.line.me/stickershop/product/17555/zh-Hant';

(
    async function() {
        //透過 curl 指令走訪 url 指定網址
        let {stdout, stderr} = await exec(
            `curl ` + 
            `-X GET ${url} ` +
            `-L ` + 
            `-H "User-Agent: ${headers['User-Agent']}" ` + 
            `-H "Accept-Language: ${headers['Accept-Language']}" ` + 
            `-H "Accept: ${headers['Accept']}" ` + 
            `-H "Cookie: ${headers['Cookie']}" `);

        //取得 html
        let html = stdout;

        //找出網址中的編號，作為 json 與 資料夾的檔案名稱
        let regex = /https?:\/\/stickershop\.line-scdn\.net\/stickershop\/v1\/sticker\/[0-9]+\/android\/sticker\.png/g;
        let arrMatch = null;

        //放置貼圖的陣列
        let arrStickers = [];

        while( (arrMatch = regex.exec(html)) !== null){
            console.log(arrMatch[0]);
            arrStickers.push(arrMatch[0]);
        }

        //陣列中會有重複的值，所以去除重複
        arrStickers = Array.from( new Set(arrStickers) );

        //若沒資料夾，則直接建立
        //(註: existsSync、mkdirSync 與 exists、mkdir 的差異，在於有 sync 的函式，不需要 callback)
        if (! await fs.existsSync(`downloads`) ){ 
            await fs.mkdirSync(`downloads`, {recursive: true}); //遞迴建立資料夾
        }

        //新增檔案，同時寫入內容
        await fs.writeFileSync(`downloads/line_stickers.json`, JSON.stringify(arrStickers, null, 4));

    }
)();