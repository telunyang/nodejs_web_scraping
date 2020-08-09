const Nightmare = require('nightmare');
const nightmare = Nightmare({ show: true, width: 1024, height: 960 });
const fs = require('fs');

//引入 jQuery 機制
const { JSDOM } = require('jsdom');
const { window } = new JSDOM("");
const $ = require('jquery')(window);

//設定 request headers
const headers = {
    'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36',
    'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
    'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
};

//放置網頁元素(物件)
const arrLink = [];

//關鍵字
let strSinger = '張學友';

//初始化設定
async function init(){
    if( !fs.existsSync(`downloads/youtube`) ){
        fs.mkdirSync(`downloads/youtube`);
    }
}

//搜尋關鍵字
async function search(){
    console.log(`準備搜尋…`);

    await nightmare
    .goto('https://www.youtube.com', headers)
    .type('input[id="search"]', strSinger)
    .click('button#search-icon-legacy')
    .wait(2000);
}

//操作篩選器
async function filter(){
    console.log(`操作篩選器`);

    await nightmare
    .click('a.yt-simple-endpoint.style-scope.ytd-toggle-button-renderer') //按下篩選器連結來開啟選項
    .wait(6000)
    .click('ytd-search-filter-group-renderer:nth-of-type(5) ytd-search-filter-renderer:nth-of-type(3) a#endpoint') //按下「觀看次數」
    .wait(2000)
    .click('a.yt-simple-endpoint.style-scope.ytd-toggle-button-renderer') //按下篩選器連結來開啟選項
    .wait(6000)
    .click('ytd-search-filter-group-renderer:nth-of-type(3) ytd-search-filter-renderer:nth-of-type(1) a#endpoint') //按下「短片 (不到 4 分鐘)」
    .wait(2000)
    .click('a.yt-simple-endpoint.style-scope.ytd-toggle-button-renderer') //按下篩選器連結來開啟選項
    .wait(6000);
}

//滾動頁面，將動態資料逐一顯示出來
async function scroll(){
    console.log(`準備滾動頁面`);

    /**
     * innertHeightOfWindow: 視窗內 document 區域的內部高度
     * totalOffset: 目前滾動的距離
     */
    let innerHeightOfWindow = 0, totalOffset = 0;

    //不斷地滾動，直到沒有辦法再往下滾
    while(totalOffset <= innerHeightOfWindow){ // 2000 <= 50000
        //取得視窗內 document 區域的內部高度
        innerHeightOfWindow = await nightmare.evaluate(() => {
            return document.documentElement.scrollHeight;
        });
        //增加滾動距離的數值
        totalOffset += 500;

        //滾動到 totalOffset 指定的距離
        await nightmare.scrollTo(totalOffset, 0).wait(500);

        console.log(`totalOffset = ${totalOffset}, innerHeightOfWindow = ${innerHeightOfWindow}`);

        //接近底部時，按下一頁
        if( (innerHeightOfWindow - totalOffset) < 2000 && await nightmare.exists('button.b-btn.b-btn--link.js-more-page')){
            await _checkPagination();
        }

        //測試用，滾動的距離超過 500，則 scroll() 執行完畢，往下一個 function 繼續執行
        if( totalOffset > 500 ){
            break;
        }
    }
}

//分析、整理、收集重要資訊
async function parse(){
    console.log(`分析、整理、收集重要資訊...`);

    let html = await nightmare
    .wait('div#contents.style-scope.ytd-item-section-renderer ytd-video-renderer.style-scope.ytd-item-section-renderer')
    .evaluate(() => {
        return document.documentElement.innerHTML;
    });

    let regex = null;
    let arrMatch = null;
    let obj = {};

    $(html)
    .find('div#contents.style-scope.ytd-item-section-renderer ytd-video-renderer.style-scope.ytd-item-section-renderer')
    .each((index, element) => {
        //找出縮圖連結 & 影片 ID
        let linkOfImage = $(element).find('img#img.style-scope.yt-img-shadow').attr('src');

        regex = /https:\/\/i\.ytimg\.com\/vi\/([a-zA-Z0-9_]{11})\/hqdefault\.jpg/g;
        if( (arrMatch = regex.exec(linkOfImage)) != null ){
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

//接續先前整理的陣列，再繼續往下取得進階資訊
async function visit(){
    for(let i = 0; i < arrLink.length; i++){
        //前往影片播放頁面，並取得頁面 html 字串
        let html = await nightmare
        .goto(arrLink[i].link)
        .wait('div#count.style-scope.ytd-video-primary-info-renderer span.view-count.style-scope.yt-view-count-renderer')
        .evaluate(() => {
            return document.documentElement.innerHTML;
        });

        //取得觀看次數的字串(未整理) eg. 觀看次數：545,056次
        let strPageView = $(html)
        .find('div#count.style-scope.ytd-video-primary-info-renderer span.view-count.style-scope.yt-view-count-renderer')
        .text();

        //取得觀看次數
        let regex = /[0-9,]+/g;
        let match = regex.exec(strPageView);
        strPageView = match[0];
        strPageView = strPageView.replace(/,/g, ''); //剩下 '545056'

        //取得按讚次數
        let strLikeCount = $(html)
        .find('div#top-level-buttons ytd-toggle-button-renderer.style-scope.ytd-menu-renderer.force-icon-button.style-text:nth-of-type(1) yt-formatted-string#text')
        .attr('aria-label');
        regex = /[0-9,]+/g;
        match = regex.exec(strLikeCount);
        if( match !== null){
            strLikeCount = match[0];
            strLikeCount = strLikeCount.replace(/,/g, '');
        } else {
            strLikeCount = 0;
        }
        
        //取得不喜歡次數
        let strUnlikeCount = $(html)
        .find('div#top-level-buttons ytd-toggle-button-renderer.style-scope.ytd-menu-renderer.force-icon-button.style-text:nth-of-type(2) yt-formatted-string#text')
        .attr('aria-label');
        regex = /[0-9,]+/g;
        match = regex.exec(strUnlikeCount);
        if( match !== null){
            strUnlikeCount = match[0];
            strUnlikeCount = strUnlikeCount.replace(/,/g, '');
        } else {
            strUnlikeCount = 0;
        }
        
        //建立新屬性
        arrLink[i].pageView = parseInt(strPageView);
        arrLink[i].likeCount = parseInt(strLikeCount);
        arrLink[i].unlikeCount = parseInt(strUnlikeCount);
    }
}

//關閉 nightmare
async function close(){
    await nightmare.end((err) => {
        if(err){ throw err; }
        console.log('關閉 nightmare...');
    });
}

//透過迴圈特性，將陣列中的各個 function 透過 await 逐一執行
async function asyncArray(functionList){
    for(let func of functionList){
        await func();
    }
}

(
    async function (){
        await asyncArray([
            init, 
            search, 
            filter, 
            scroll, 
            parse, 
            visit, 
            close
        ]).then(async ()=>{
            console.dir(arrLink, {depth: null});
    
            //新增檔案，同時寫入內容
            await fs.writeFileSync(`downloads/youtube.json`, JSON.stringify(arrLink, null, 4));
    
            console.log('Done');
        });
    }
)();