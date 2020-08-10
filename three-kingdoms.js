const fs = require('fs');
const util = require('util');

//將 exec 非同步化 (可以使用 await，以及 .then, .catch)
const exec = util.promisify(require('child_process').exec);

//引入 jQuery 機制
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const { window } = new JSDOM();
const $ = require('jquery')(window);

//瀏覽器標頭，讓對方得知我們是人類，而非機器人 (爬蟲)
const headers = {
    'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36',
    'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
    'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
    'Cookie': 'COOKIE_ID=VXM1C50JFT100GG; visit=VXM1C50JFT100GG%7C20200220155658%7C%2F%7Chttps%253A%252F%252Fwww.google.com%252F%7Cend+; fflag=flag_store_manager%3A0%2Cend; _pxvid=a1527a43-53f9-11ea-9800-0242ac120005; __pxvid=aae9ccad-53f9-11ea-a51a-0242ac110003; _pxhd=7565938c9ae629fd763f82a3f6814cc1ac8edc787c3ec559556cc9f94f684b9a:a1527a43-53f9-11ea-9800-0242ac120005; search=start%7Cchateau%2Bmouton%2Brothschild%7C1%7Cany%7CTWD%7C%7C%7C%7C%7C%7C%7C%7C%7Ce%7Ci%7Cend; cookie_enabled=true; ID=0QXPCSW8F0300KS; IDPWD=I50107913; _csrf=XvJ5zvW03Zc-OyFypzBuD26BGiWrB3eG; _gid=GA1.2.550063982.1593937820; _ga_M0W3BEYMXL=GS1.1.1593937820.11.1.1593937833.0; _ga=GA1.2.1857518536.1582214223; _px3=863592a2d85a9cb57ca2258ea97499d7fa0b97d047b466e8aeac2d1219e73939:e8TpqpI9GYN47uPzxVX0BHefvvwMmVUT1PKPs0brZa3Ou0uGx/kf6GZpjdyFeAu14WzZ0EgkFGFFHe+krCJOgw==:1000:8ZX4NEW9gJ0ozW8CoDJ6trfoLSTJnGKyd2kJnfRXIXqqsnDMbwM8zftdCVU8euNXqumpSdL8Muda6nlPLmzLIGhXpZeBV7NZP9cMFQ0FO3BXFuKygNravg4WD1ofiC9Yi/eBq904ClSVnuZRqEfjXrjnmvWqcNVIiC4VujgEp4c=; _px2=eyJ1IjoiY2FlODU5NDAtYmU5OS0xMWVhLWE4YzQtOTk2YjIwNzk0MWQ2IiwidiI6ImExNTI3YTQzLTUzZjktMTFlYS05ODAwLTAyNDJhYzEyMDAwNSIsInQiOjE1OTM5MzgxMzQ0NjYsImgiOiI5Y2Y3YzFmOGZlMzcxMTBlNmYzOWZkMzA4ZDFjZTI1MjJkNTAzNGNlZGYzZmUzNmU0ZjllN2JmMjIwMmY2ODNkIn0=; _pxde=d778826cb9903a373af3e15e3cbef5342e710b2ebe57c846ccfc5aa226430066:eyJ0aW1lc3RhbXAiOjE1OTM5Mzc5MDA2NTMsImZfa2IiOjAsImlwY19pZCI6W119~'
};

//放置資料的陣列
let arrLink = [];

let url = `https://zh.wikipedia.org/wiki/%E4%B8%89%E5%9B%BD%E6%BC%94%E4%B9%89%E8%A7%92%E8%89%B2%E5%88%97%E8%A1%A8`;

(
    async function () {
        let {stdout, stderr} = await exec(
            `curl ` + 
            `-X GET ${url} ` +
            `-L ` + 
            `-H "User-Agent: ${headers['User-Agent']}" ` + 
            `-H "Accept-Language: ${headers['Accept-Language']}" ` + 
            `-H "Accept: ${headers['Accept']}" ` + 
            `-H "Cookie: ${headers['Cookie']}" `, 
            {maxBuffer: 1024 * 1024, encoding: "utf8"});

        //定義姓名、人物連結、字、籍貫、列傳、首回、末回、史構
        let wikiName = '', wikiLink = '', wikiAlias = '', 
            wikiBirthplace = '', wikiDescription = '', wikiBeginEpisode = '', 
            wikiEndEpisode = '', wikiIdentity = '';

        /**
         * $(html).find('css_selector').each(function(索引值, DOM元素){ ... })
         * 索引值: 從 0 開始，集合中的第一個元素 index 為 0，第二個為 1，依此類推
         * DOM元素: 單純的 html 元素，要透過 $(DOM元素) 轉成 jQuery 物件
         */

        //取得人物姓名的表格
        $(stdout).find('table.wikitable.sortable').each((index, element) => {
            //走訪取得每一個人物的表格資料
            $(element).find('tbody tr').each((idx, elm) => {
                //姓名
                wikiName = $(elm).find('td:nth-of-type(1)').text();

                //維基百科連結
                wikiLink = $(elm).find('td:nth-of-type(1)').find('a').attr('href');

                //字
                wikiAlias = $(elm).find('td:nth-of-type(2)').text();

                //籍貫
                wikiBirthplace = $(elm).find('td:nth-of-type(3)').text();

                //列傳
                wikiDescription = $(elm).find('td:nth-of-type(4)').text();

                //首回
                wikiBeginEpisode = $(elm).find('td:nth-of-type(5)').text();

                //末回
                wikiEndEpisode = $(elm).find('td:nth-of-type(6)').text();

                //史構
                wikiIdentity = $(elm).find('td:nth-of-type(7)').text();

                //若是姓名變數沒有文字，則跳到下一個元素去執行
                if( wikiName === '' ) return;

                //物件變數，用來放置人物相關資訊
                let obj = {
                    name: wikiName,
                    link: 'https://zh.wikipedia.org' + wikiLink,
                    alias: wikiAlias,
                    birthplace: wikiBirthplace,
                    beginEpisode: wikiBeginEpisode,
                    endEpisode: wikiEndEpisode,
                    identity: wikiIdentity
                };

                //過濾不必要的字元
                for(let key in obj){
                    let str = String(obj[key]);
                    obj[key] = str.replace(/\n/g, '');
                }

                //加入陣列變數
                arrLink.push(obj);
            });
        });

        console.log(arrLink);

        //儲存 json
        await fs.writeFileSync(`downloads/threekingdoms.json`, JSON.stringify(arrLink, null, 4));
    }
)();