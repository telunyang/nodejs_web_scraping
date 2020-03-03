const Nightmare = require('nightmare');
const nightmare = Nightmare({ show: true, width: 1280, height: 1024 });
const util = require('util');
const fs = require('fs');

//引入 jQuery 機制
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const { window } = new JSDOM();
const $ = require('jquery')(window);

//使工具擁有 promise 的特性
const writeFile = util.promisify(fs.writeFile);

const headers = {
    'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36',
    'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
    'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
};

//放置網頁元素(物件)
let arrLink = [];

//關鍵字
let strSinger = '張學友';

//初始化設定
async function step1(){
    try{
        if( !fs.existsSync(`downloads`) ){
            fs.mkdirSync(`downloads`);
        }
    } catch (err) {
        throw err;
    }
}

//搜尋關鍵字
async function step2(){
    console.log(`準備搜尋…`);

    await nightmare
    .goto('https://www.youtube.com', headers)
    .type('input[id="search"]', strSinger)
    .click('button#search-icon-legacy')
    .catch((err) => {
        console.error(err);
    });
}

//滾動頁面，將動態資料逐一顯示出來
async function step3(){
    console.log(`準備滾動頁面`);

    let currentHeight = 0; //window 裡面內容的當前總高度
    let offset = 0; //總偏移量

    //不斷地滾動，直到沒有辦法再往下滾
    while(offset <= currentHeight){ // 2000 <= 50000
        currentHeight = await nightmare.evaluate(()=>{
            return document.documentElement.scrollHeight; //回傳瀏覽器當前已滾動的高度
        });

        //每次滾動 500 單位的距離，offset 需要累加，才能對應到合適的距離
        offset += 500;
        await nightmare.scrollTo(offset, 0).wait(500);

        if(offset > 2000){
            break; //滾動一段高度後，強迫跳出迴圈；視情況使用
        }
    }
}

//分析、整理、收集重要資訊
async function step4(){
    console.log(`分析、整理、收集重要資訊...`);

    let html = await nightmare.evaluate(() => {
        return document.documentElement.innerHTML;
    });

    let pattern = null;
    let arrMatch = null;
    let obj = {};

    $(html)
    .find('div#contents.style-scope.ytd-item-section-renderer ytd-video-renderer.style-scope.ytd-item-section-renderer')
    .each((index, element) => {
        //找出縮圖連結 & 影片 ID
        let linkOfImage = $(element).find('img#img.style-scope.yt-img-shadow').attr('src');

        pattern = /https:\/\/i\.ytimg\.com\/vi\/([a-zA-Z0-9_]{11})\/hqdefault\.jpg/g;
        if( (arrMatch = pattern.exec(linkOfImage)) != null ){
            obj.img = arrMatch[0]; //縮圖連結
            obj.id = arrMatch[1]; //從連結擷取出來的 video id (watch?v=xxxxxxxxxxx)

            //影片名稱
            let titleOfVideo = $(element)
            .find('a#video-title.yt-simple-endpoint.style-scope.ytd-video-renderer')
            .text();
            titleOfVideo = titleOfVideo.trim();
            obj.title = titleOfVideo;

            //影片連結
            let linkOfVideo = $(element)
            .find('a#video-title.yt-simple-endpoint.style-scope.ytd-video-renderer')
            .attr('href');
            linkOfVideo = 'https://www.youtube.com' + linkOfVideo;
            obj.link = linkOfVideo;

            //歌手名稱
            obj.singer = strSinger;

            //收集、整理各個擷取到的影音連結元素資訊，到全域的陣列變數中
            arrLink.push(obj);

            //變數初始化
            obj = {};
        }
    });
}

//關閉 nightmare
async function step5(){
    await nightmare.end((err) => {
        if(err){ throw err; }
        console.log('關閉 nightmare...');
    });
}

async function asyncArray(functionList){
    for(let func of functionList){
        await func();
    }
}

try {
    asyncArray([step1, step2, step3, step4, step5]).then(async ()=>{
        console.dir(arrLink, {depth: null});

        //若是檔案不存在，則新增檔案，同時寫入內容
        if( !fs.existsSync(`downloads/youtube.json`) ){
            await writeFile(`downloads/youtube.json`, JSON.stringify(arrLink, null, 4));
        }

        console.log('Done');
    });
} catch (err){
    throw err;
}