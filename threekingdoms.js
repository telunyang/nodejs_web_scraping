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

//放置資料的陣列
let arrLink = [];

let url = `https://zh.wikipedia.org/wiki/%E4%B8%89%E5%9B%BD%E6%BC%94%E4%B9%89%E8%A7%92%E8%89%B2%E5%88%97%E8%A1%A8`;

(
    async function () {
        let {stdout, stderr} = await exec(`curl -X GET ${url} -L -H "User-Agent: ${headers['User-Agent']}" -H "Accept-Language: ${headers['Accept-Language']}" -H "Accept: ${headers['Accept']}"`, {encoding: 'utf8', maxBuffer: 500 * 1024});

        //定義姓名、人物連結、字、籍貫、列傳、首回、末回、史構
        let wikiName = '', wikiLink = '', wikiAlias = '', 
            wikiBirthplace = '', wikiDescription = '', wikiBeginEpisode = '', 
            wikiEndEpisode = '', wikiIdentity = '';
        
        //物件變數，用來放置人物相關資訊
        let obj = {};

        //取得人物姓名的表格
        $(stdout).find('table.wikitable.sortable').each((index, element) => {
            //走訪取得每一個人物的表格資料
            $(element).find('tbody tr').each((idx, elm) => {
                //姓名
                wikiName = $(elm).find('td:eq(0)').text();

                //維基百科連結
                wikiLink = $(elm).find('td:eq(0)').find('a').attr('href');

                //字
                wikiAlias = $(elm).find('td:eq(1)').text();

                //籍貫
                wikiBirthplace = $(elm).find('td:eq(2)').text();

                //列傳
                wikiDescription = $(elm).find('td:eq(3)').text();

                //首回
                wikiBeginEpisode = $(elm).find('td:eq(4)').text();

                //末回
                wikiEndEpisode = $(elm).find('td:eq(5)').text();

                //史構
                wikiIdentity = $(elm).find('td:eq(6)').text();

                //若是姓名變數沒有文字，則跳到下一個元素去執行
                if( wikiName === '' ) return;

                //用物件整理人物資訊
                obj = {
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

                //物件初始化
                obj = {};
            });
        });

        console.log(arrLink);

        //儲存 json
        await fs.writeFileSync(`downloads/threekingdoms.json`, JSON.stringify(arrLink, null, 4));
    }
)();