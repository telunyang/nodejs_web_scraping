/** 
 * Selenium api for javascript
 * Ref: https://seleniumhq.github.io/selenium/docs/api/javascript/
 * 
 * Selenium Dev
 * Ref: https://selenium.dev/documentation/en/
 * 
 * Chrome Webdriver
 * https://chromedriver.chromium.org/downloads
 * 
 * */
const fs = require('fs');

//引入 jQuery 機制
const { JSDOM } = require("jsdom");
const { window } = new JSDOM("");
const $ = require('jquery')(window);

//引入 selenium 功能
const webdriver = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

//等待元素出現與否所使用的物件
const until = webdriver.until;

/**
 * Capabilities 物件能夠客製化 ChromeDriver 連線的設定選項，例如設定 user-agent、啟動程式時是否隱藏瀏覽器等
 * 請參考 https://chromedriver.chromium.org/capabilities
 */
const chromeCapabilities = webdriver.Capabilities.chrome();
chromeCapabilities.set('browserName', 'chrome');
chromeCapabilities.set('chromeOptions', {
    args: ['user-agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.117 Safari/537.36"']
});

/**
 * 設定 chrome options
 * 請參考 https://peter.sh/experiments/chromium-command-line-switches/
 */
const options = new chrome.Options();
// options.addArguments(['--headless']); //將 chrome 瀏覽器隱藏起來

//建立 web driver
const Builder = webdriver.Builder;
const driver = new Builder()
.forBrowser('chrome')
.setChromeOptions(options)
.withCapabilities(chromeCapabilities)
.build();

//自訂變數
const urlOrigin = "https://www.bookwormzz.com";
const url = urlOrigin + '/zh/';
let arrLink = [];

//初始化設定
async function init() {
    //output 資料夾不存在，就馬上建立
    if ( ! await fs.existsSync(`downloads/jinyong`) ){ 
        await fs.mkdirSync(`downloads/jinyong`); //建立資料夾
    }

    //視窗放到最大
    // await driver.manage().window().maximize();        
}

//進入初始頁面
async function visit(){
    await driver.get(url);
}

//滾動網頁
async function scroll(){
    /**
     * innertHeightOfWindow: 視窗內 document 區域的內部高度
     * totalOffset: 目前滾動的距離
     */
    let innerHeightOfWindow = 0;
    let totalOffset = 0;

    while(totalOffset <= innerHeightOfWindow) {
        //取得視窗內 document 區域的內部高度
        innerHeightOfWindow = await driver.executeScript(`return window.innerHeight;`);

        //增加滾動距離的數值
        totalOffset += 500;

        //滾動到 totalOffset 指定的距離
        await driver.executeScript(`
            (
                function (){
                    window.scrollTo({ 
                        top: ${totalOffset}, 
                        behavior: "smooth" 
                    });
                }
            )();
        `);
        
        console.log(`totalOffset: ${totalOffset}, innerHeightOfWindow: ${innerHeightOfWindow}`);

        //強制等待
        await driver.sleep(500);
    }
}

//整合所有小說主要名稱
async function getNovelTitles(){
    //等待元素讀取完畢
    await driver.wait(until.elementLocated({css: 'div.epub ul[data-role="listview"] li a'}), 3000);

    //取得當前 html 字串
    let html = await driver.getPageSource(); 
    
    //整合 href 的連結 (網頁以「小說書名」為連結名稱)，並加上真實的目錄連結
    $(html).find('a[data-ajax="false"]').each(function(index, element) {
        /**
         * 下方的 href，在網頁上預設文字是編碼(encode)後的文字，
         * 例如 %E9%87%91%E5%BA%B8%E3%80%8A%E5%80%9A%E5%A4%A9%E5%B1%A0%E9%BE%8D%E8%A8%98%E4%BA%8C%E3%80%8B
         * 透過 decodeURIComponent(...) 來解碼，
         * 可以取得正常的中文，例如上方例子解碼後，原文字為「金庸《倚天屠龍記二》」
         */
        let strTmp = $(element).attr('href');
        strTmp = strTmp.replace(/\.\.\//g, '');
        strTmp = decodeURIComponent(strTmp);

        //暫存資料用的物件
        let obj = {
            url: `${urlOrigin}/${strTmp}#book_toc`,
            title: $(element).text(),
            links: []
        }; 
        
        console.log(`getNovelTitles(): ${obj.url}`);

        arrLink.push(obj);
    });
}

//取得所有文章的連結
async function getNovelLinks(){
    //走訪所有文章
    for(let obj of arrLink){
        //走訪實際連結頁面
        await driver.get(obj.url);

        //等待小說連結完整顯示在網頁上
        await driver
        .wait(until.elementLocated({css: 'div[data-role="content"] > div > ul'}), 3000)
        .catch(function(err){
            return true;
        });

        //取得小說連結
        let html = await driver.getPageSource(); //取得所有 a link 的 html 字串
        
        //整合 href 的連結，並加上真實的目錄連結
        $(html).find('a.ui-link').each((index, element) => {
            let strTmp = $(element).attr('href');
            
            //暫存資料用的物件
            let objLink = {
                url: `${urlOrigin}${strTmp}`,
                title: $(element).text(),
                content:  null
            }; 

            console.log(`getNovelLinks(): ${urlOrigin}${strTmp}`);
            
            //目前走訪到的文章物件，在裡面的 links 屬性
            obj.links.push(objLink);
        });

        //讓瀏覽器強制等待
        await driver.sleep(500);
    }
}

//讀取每一篇小說的內文
async function getNovelContent(){
    for(let obj of arrLink){
        for(let objLink of obj.links){
            //走訪實際連結頁面
            await driver.get(objLink.url);

            console.log(`getNovelContent(): ${objLink.url}`);

            //等待小說連結完整顯示在網頁上
            await driver
            .wait(until.elementLocated({css: 'div#html[data-role="content"] > div:nth-of-type(1)'}), 3000)
            .catch(function(err){
                return true;
            });

            //取得當前 html 字串
            let html = await driver.getPageSource();
            
            //取得小說內文 (含空白、斷行那些)
            let strContent = $(html).find('div#html[data-role="content"] > div:nth-of-type(1)').text();

            //將小說內文的空格、斷行全部去掉，讓文字變成「一整行文字」的概念
            objLink.content = strContent.replace(/\s|\r\n|\n/g, '');
        
            //讓瀏覽器強制等待
            await driver.sleep(500);
        }
    }
}

//關閉 chrome
async function close(){
    await driver.quit();
}

//將爬取資料儲存成 json 檔案
async function saveJson(){
    //新增檔案，同時寫入內容
    await fs.writeFileSync('downloads/jinyong.json', JSON.stringify(arrLink, null, 4));
}

//透過迴圈特性，將陣列中的各個 function 透過 await 逐一執行
async function asyncArray(functionsList) {
    for(let func of functionsList){
        await func();
    }
}

//主程式區域 IIFE
(
    async function(){
        await asyncArray([
            init,
            visit,
            getNovelTitles,
            getNovelLinks,
            getNovelContent,
            close,
            saveJson
        ]).then(async function() {
            console.log('Done');     
        });
    }
)();