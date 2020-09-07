/** 
 * Selenium api for javascript
 * Ref: https://seleniumhq.github.io/selenium/docs/api/javascript/
 * */

//基本套件匯入
const fs = require('fs');

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
    args: [
        'user-agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.117 Safari/537.36"',
    ]
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
let arrSplitJournals = []; //將期刊每 n 個獨立組合成一個陣列，方便程式針對檢索集進行操作
let beginYear = 2011; //時間範圍: 始期年份
let endYear = 2020; //時間範圍: 終期年份
let arrRecords = []; //[ [1, 500], [501, 1000], ... ] 等下載頁數範圍
let download_path = `C:\\\Users\\Owner\\Documents\\repo\\nodejs_web_scraping\\downloads\\wos`;
let urlWoS = `http://apps.webofknowledge.com/WOS_GeneralSearch_input.do?product=WOS&search_mode=GeneralSearch`; //WoS頁面

//回傳隨機秒數，協助元素等待機制
async function sleepRandomSeconds(){
    try {
        let maxSecond = 3;
        let minSecond = 2;
        await driver.sleep( Math.floor( (Math.random() * maxSecond + minSecond) * 1000) );
    } catch (err) {
        throw err;
    }
}

//初始化設定
async function init() {
    try{
        //download 資料夾不存在，就馬上建立
        if (! await fs.existsSync(download_path) ){ 
            await fs.mkdirSync(download_path, {recursive: true}); //建立資料夾
        }

        //視窗放到最大
        // await driver.manage().window().maximize();
    } catch (err) {
        throw err;
    }
}

//設定期刊列表
async function setArrJournals(){
    try {
        /**
         * 自訂期刊列表
         * 註: 請勿超過 29 個期刊種類
         */
        arrSplitJournals = [
            "COMPUTERS & EDUCATION",
            "SOCIOLOGY"
        ];

        //按下 WoS 的「進階搜尋」
        await _goToAdvancedSearchPage() 
    } catch (err) {
        throw err;
    }
}

//點選「進階檢索」連結
async function _goToAdvancedSearchPage(){
    try{
        // let tabs = await driver.getAllWindowHandles();
        // await driver.switchTo().window(tabs[0]);

        //前往 Web of Science 頁面
        await driver.get(urlWoS);

        //等待「進階搜尋」的連結出現，再按下該連結
        await driver.wait(until.elementLocated({css: 'ul.searchtype-nav'}), 3000 );
        let li = await driver.findElements({css: 'ul.searchtype-nav li'});
        await li[3].findElement({css: 'a'}).click();
    } catch (err) {
        throw err;
    }
}

//整理搜尋用的字串
async function _setFilterCondition(strJournalName){
    try {
        //整理年份範圍字串
        let strPY = '';
        for(let year = beginYear; year <= endYear; year++){
            if( strPY === '') {
                strPY += `(PY=${year}`;
            } else {
                strPY += ` OR PY=${year}`;
            }
        }
        strPY += ')';

        console.log(`期刊完整名稱: ${strJournalName}`);

        //設定期刊出版名稱相關搜尋用字串，結合前面的年份範圍字串
        let strSO = `(SO=(${strJournalName}) and ${strPY})`;
        
        /**
         * 檢索語法
         * (SO=(COMPUTERS & EDUCATION) and (PY=2011 OR PY=2012 OR PY=2013 OR PY=2014 OR PY=2015 OR PY=2016 OR PY=2017 OR PY=2018 OR PY=2019 OR PY=2020))
         */

        await driver.wait(until.elementLocated({css: 'div.AdvSearchBox textarea'}), 10000 );
        await driver.findElement({css: 'div.AdvSearchBox textarea'}).clear();
        await driver.findElement({css: 'div.AdvSearchBox textarea'}).sendKeys(strSO);
        await sleepRandomSeconds();
    } catch (err) {
        throw err;
    }
}

//選擇文件類型
async function _setDocumentType(type) {
    try {
        await driver.executeScript(`(
            function () {
                let option = document.querySelector('select[name="value(input3)"] option[value="${type}"]');
                option.setAttribute('selected', true);
            }
        )();`);
    } catch (err) {
        throw err;
    }
}

//整理檢索集，然後再度檢索
async function _collectSerialNumber(){
    try {
        //整理檢索集的編號
        let strSearch = '';
        let strNum = '';
        let tr = await driver.findElements({css: 'table tbody tr[id^="set_"]'});
        for(let r of tr){
            let td = await r.findElement({css: 'td.historySetNum'});
            strNum = await td.getText(); //#號碼，例如 #1 ~ #3
            strNum = strNum.replace(/\s/g,'');
            if(strSearch === '') {
                strSearch = `(${strNum}`;
            } else {
                strSearch += ` OR ${strNum}`;
            }
        }
        strSearch += ')';
        
        //將整理完的編號字串，放到搜尋欄位查詢
        await driver.wait(until.elementLocated({css: 'div.AdvSearchBox textarea'}), 10000 );
        await driver.findElement({css: 'div.AdvSearchBox textarea'}).clear();
        await driver.findElement({css: 'div.AdvSearchBox textarea'}).sendKeys(strSearch);
    } catch (err) {
        throw err;
    }
}

//清除編號的歷史記錄
async function _clearSerialNumberHistory() {
    try {
        await _goToAdvancedSearchPage();

        await driver.wait(until.elementLocated({css: 'div.AdvSearchBox textarea'}), 10000 );
        await driver.findElement({css: 'div.AdvSearchBox textarea'}).clear();
        await driver.findElement({css: 'button#selectallTop'}).click(); //歷史記錄列表全選
        await driver.findElement({css: 'button#deleteTop'}).click(); //刪除歷史記錄
    } catch (err) {
        throw err;
    }
}

//前往檢索結果的連結，範例是 #6
async function _goToSearchResultPage() {
    try {
        //判斷查詢後歷史記錄編號，是否低於最高檢索數
        let objIndexNum = await driver.findElements({css: 'table tbody tr[id^="set_"] td div.historyResults'});

        //取得當前檢索結果的小計
        let div = await driver.findElement({css: 'table tbody tr[id^="set_' + objIndexNum.length + '"] td div.historyResults'});
        let numResult = await div.getText();
        numResult = parseInt( numResult.replace(/\s|,/g,'') );

        let set = Math.floor(numResult / 500); //檢索小計除以500，例如 2819 / 500 = 5.638
        let remainder = numResult % 500; //組數除完的餘數，用來加在最後一組

        //建立例如 [ [1,500], [501, 1000], [1001, 1500], [1501, 2000], [2001, 2500] , [2501, 2819] ]
        for(let i = 0; i <= set; i++) {
            if( i === set ) {
                arrRecords.push([ i * 500 + 1, (i * 500) + remainder ]);
            } else {
                arrRecords.push([ i * 500 + 1, (i + 1) * 500 ]);
            }
        }

        console.log(`numResult: ${numResult}`);

        await div.findElement({css: 'a'}).click(); //按下檢索小計的連結，例如 #6
    } catch (err) {
        throw err;
    }
}

//下載期刊資訊
async function _downloadJournalPlaneTextFile(){
    try {
        //用來確認是否按過 Export 鈕（之後會變成其它按鈕元素，所以會用 More 來按）
        let firstExportFlag = false;

        //按下匯出鈕，跳出選單(網頁上有重複的元素，例如表格頭尾都有匯出鈕，這裡選擇一個來按)
        await driver.wait(until.elementLocated({css: 'button#exportTypeName'}), 10000 );
        let buttonsExport = await driver.findElements({css: 'button#exportTypeName'});
        await buttonsExport[0].click();

        //走訪選單連結文字，找到合適字串，就點按該連結，並跳出迴圈
        let multiple_li = await driver.findElements({css: 'ul#saveToMenu li.subnav-item'});
        for(let li of multiple_li){
            if( ['Other File Formats', '其他檔案格式'].indexOf( await li.findElement({css: 'a'}).getText() ) !== -1 ) {
                await li.findElement({css: 'a'}).click();
                break;
            }
        }

        //迭代 [ [1,500], [501, 1000], ... ]，把值各別填在 Records from [1] to [500]
        for(let i = 0; i < arrRecords.length; i++) {
            //確認是否執行第一次匯出，已匯出，之後都按 More 按鈕
            if(firstExportFlag === true) {
                //按下 More 鈕，跳出選單(網頁上有重複的元素，例如表格頭尾都有匯出鈕，這裡選擇一個來按)
                let buttonsExportMore = await driver.findElements({css: 'button#exportMoreOptions'});
                await buttonsExportMore[0].click();

                //走訪選單連結文字，找到合適字串，就點按該連結，並跳出迴圈
                let multiple_li = await driver.findElements({css: 'ul#saveToMenu li.subnav-item'});
                for(let li of multiple_li){
                    if( ['Other File Formats', '其他檔案格式'].indexOf( await li.findElement({css: 'a'}).getText() ) !== -1 ) {
                        await li.findElement({css: 'a'}).click();
                        break;
                    }
                }
            }

            //選擇匯出檔案的資料筆數(Records)，一次不能超過 500 筆
            await driver.findElement({css: 'input#numberOfRecordsRange[type="radio"]'}).click();
            await driver.findElement({css: 'input#markFrom[type="text"]'}).clear(); //清除 Records from 的第一個文字欄位
            await driver.findElement({css: 'input#markFrom[type="text"]'}).sendKeys(arrRecords[i][0]); //eg. 1
            await driver.findElement({css: 'input#markTo[type="text"]'}).clear(); //清除 Records from 的第二個文字欄位
            await driver.findElement({css: 'input#markTo[type="text"]'}).sendKeys(arrRecords[i][1]); //eg. 500

            //選擇「記錄內容」
            let selectContent = await driver.findElement({css: 'select#bib_fields'});
            let optionsContent = await selectContent.findElements({css: 'option'});
            await optionsContent[3].click();

            //選擇「檔案格式」
            let selectFormat = await driver.findElement({css: 'select#saveOptions'});
            let optionsFormat = await selectFormat.findElements({css: 'option'});
            await optionsFormat[3].click();

            //設定下載路徑，同時確認資料夾是否存在
            if ( !await fs.existsSync(`${download_path}\\${arrRecords[i][0]}_${arrRecords[i][1]}`) ) {
                //建立資料夾，以當前填寫的資料筆數（例如 1, 500）來作為資料夾名稱
                await fs.mkdirSync(`${download_path}\\${arrRecords[i][0]}_${arrRecords[i][1]}`); 
            }

            //設定下載路徑
            await driver.setDownloadPath(`${download_path}\\${arrRecords[i][0]}_${arrRecords[i][1]}`);

            console.log(`${download_path}\\${arrRecords[i][0]}_${arrRecords[i][1]}`);

            //按下匯出鈕，此時等待下載，直到開始下載，才會往程式下一行執行
            await driver.findElement({css: 'button#exportButton'}).click();

            //休閒一段時間 (依情況複製多次)
            await sleepRandomSeconds();
            await sleepRandomSeconds();

            firstExportFlag = true; //第一次匯出已完成，之後不按 Export 鈕按，改為 More 按鈕（按下後，可以選擇 Other File Formats）
        }
    } catch (err) {
        throw err;
    }    
}

//搜尋期刊資訊
async function main() {
    try {
        //迭代自訂期刊
        for(let i = 0; i < arrSplitJournals.length; i++){
            await _setFilterCondition(arrSplitJournals[i]); //整理搜尋用的字串
            await _setDocumentType('Article'); //選擇文件類型（目前設定 Article）
            await driver.findElement({css: 'button#search-button'}).click(); //按下搜尋
            
            //若是走訪最後一個元素(例如第2元素)，就把目前 2 個檢索集編號整理起來，丟到搜尋欄位檢索出第 3 個結果
            if( (i+1) === arrSplitJournals.length ){
                //查詢 5 個期刊，並取得查詢期刊總數，再進入期刊總數的連結
                await _collectSerialNumber(); //整理檢索集，然後再度檢索
                await driver.findElement({css: 'button#search-button'}).click(); //按下搜尋
                await _goToSearchResultPage(); //前往檢索結果的連結，範例是 #3
                await _downloadJournalPlaneTextFile(); //迭代下載資料
                await _clearSerialNumberHistory(); //刪除搜尋的歷史記錄
            }
        }
        
    } catch (err) {
        throw err;
    }
}

//關閉 chrome
async function close(){
    await driver.quit();
}

//照順序執行各個函式
async function asyncArray(functionsList) {
    for(let func of functionsList){
        await func();
    }
}

//主程式區域
try {
    asyncArray([
        init, //初始化
        setArrJournals, //設定期刊列表
        main, //搜尋期刊資訊
        close
    ]).then(async () => {
        console.log('Done');     
    });
} catch (err) {
    console.log('try-catch: ');
    console.dir(err, {depth: null});
}