const fs = require('fs');
const util = require('util');
const moment = require('moment');

//將 exec 非同步化 promisify (可以使用 await，以及 .then, .catch)
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

//放置酒資料的陣列
let arrLink = [];

//走訪網址
// let url = `https://www.wine-searcher.com/find/screaming+eagle+cab+sauv+napa+valley+county+north+coast+california+usa/1992/taiwan#t3`;
let arrUrl = [
    'https://www.wine-searcher.com/find/screaming+eagle+cab+sauv+napa+valley+county+north+coast+california+usa/1992/taiwan#t3',
    'https://www.wine-searcher.com/find/latour+pauillac+medoc+bordeaux+france/2006/taiwan#t3'
];

(
    async function () {
        for(let url of arrUrl){
            let {stdout, stderr} = await exec(
                `curl ` + 
                `-X GET ${url} ` +
                `-L ` + 
                `-H "User-Agent: ${headers['User-Agent']}" ` + 
                `-H "Accept-Language: ${headers['Accept-Language']}" ` + 
                `-H "Accept: ${headers['Accept']}" ` + 
                `-H "Cookie: ${headers['Cookie']}" `);
            let strChartData = ''; //價格 json 文字資料
            let dataChartData = {}; //將 json 轉成物件型態
            let arrMain = []; //放置價格物件的陣列
            let strDateTime = ''; //放置日期時間
            let price = 0; //價格

            //找出酒的名稱
            let pattern = /https:\/\/www\.wine-searcher\.com\/find\/([a-z+]+)\/(1[0-9]{3}|20[0-9]{2})\/taiwan#t3/g;
            let arrMatch = null;
            let strJsonFileName = ''; //json 檔案名稱

            if( (arrMatch = pattern.exec(url)) !== null ){
                /**
                 * arrMatch 內容: 
                 * [ 'https://www.wine-searcher.com/find/screaming+eagle+cab+sauv+napa+valley+county+north+coast+california+usa/1992/taiwan#t3',
                 *   'screaming+eagle+cab+sauv+napa+valley+county+north+coast+california+usa',
                 *   '1992',
                 *   index: 0,
                 *   input: 'https://www.wine-searcher.com/find/screaming+eagle+cab+sauv+napa+valley+county+north+coast+california+usa/1992/taiwan#t3',
                 *   groups: undefined ]
                 */

                //先將 'screaming+eagle+cab+sauv+napa+valley+county+north+coast+california+usa' 字串帶到變數中
                strJsonFileName = arrMatch[1];

                //將上述字串當中的 + 號取代為 _
                strJsonFileName = strJsonFileName.replace(/\+/g, '_');

                //將後面的年份用 _ 與字串連結，例如 screaming_eagle_cab_sauv_napa_valley_county_north_coast_california_usa_1992
                strJsonFileName = strJsonFileName + '_' + arrMatch[2];
            }

            //取得圖表當中字串化後的物件內容
            strChartData = $(stdout).find('div#hst_price_div_detail_page.card-graph').attr('data-chart-data');

            //將 json 字串轉為物件，以便程式運用
            dataChartData = JSON.parse(strChartData);
            arrMain = dataChartData.chartData.main;

            for(let arr of arrMain){
                /**
                 * arr[0]: 時間戳記
                 * arr[1]: 價格 (預設是美金)
                 */

                //將時間戳記轉為日期時間。註: 毫秒 -> 秒，要除以 1000
                strDateTime = moment.unix(parseInt(arr[0]) / 1000).format("YYYY-MM-DD"); 

                //取得價格
                price = Math.round(arr[1]);

                //  console.log(`年月日: ${strDateTime}`);
                //  console.log(`價格(美金): ${price} 元，換算新台幣約為: ${price * 30} 元\n`);

                //整理資訊
                arrLink.push({
                    'dateTime': strDateTime,
                    'price_us': price,
                    'price_tw': (price * 30)
                });
            }

            console.log(arrLink);

            //儲存 json
            await fs.writeFileSync(`downloads/${strJsonFileName}.json`, JSON.stringify(arrLink, null, 4));

            //初始化
            arrLink = [];
        }

    }
)();