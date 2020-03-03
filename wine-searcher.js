const fs = require('fs');
const util = require('util');
const moment = require('moment');

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
            let {stdout, stderr} = await exec(`curl -X GET ${url} -L -H "User-Agent: ${headers['User-Agent']}" -H "Accept-Language: ${headers['Accept-Language']}" -H "Accept: ${headers['Accept']}"`);
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

            //儲存 json
            await fs.writeFileSync(`downloads/${strJsonFileName}.json`, JSON.stringify(arrLink, null, 4));

            //初始化
            arrLink = [];
        }

    }
)();