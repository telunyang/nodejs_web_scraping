const fs = require('fs');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

let str = `席慕蓉：一棵開花的樹
如何讓你遇見我，在我最美麗的時刻
為這，我已在佛前，求了五百年，求祂讓我們結一段塵緣
佛於是把我化作一棵樹，長在你必經的路旁
陽光下慎重地開滿了花，朵朵都是我前世的盼望
當你走近，請你細聽，那顫抖的葉是我等待的熱情
而當你終於無視地走過，在你身後落了一地的
朋友啊，那不是花瓣，是我凋零的心`;

let pattern = /.*\S/g;
let match = null;
let sn = 1;

const headers = {
    'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36',
};

//IIFE
(
    async function () {
        //若沒資料夾，則直接建立
        //(註: existsSync、mkdirSync 與 exists、mkdir 的差異，在於有 sync 的函式，不需要 callback)
        if (! await fs.existsSync(`downloads/mp3`) ){ 
            await fs.mkdirSync(`downloads/mp3`, {recursive: true}); //遞迴建立資料夾
        }

        while( (match = pattern.exec(str)) !== null ){
            console.log(`sn = ${sn}, q = ${match[0]}`);
            
            //下載檔案
            await exec(
                `curl -X GET "https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=zh-TW&q=${encodeURIComponent(match[0])}" ` + 
                ` -H "User-Agent: ${headers['User-Agent']}" ` + 
                ` -o "downloads/mp3/${sn}.mp3"`);
            
            //使用 ffmpeg 轉檔
            await exec(`ffmpeg -i "downloads/mp3/${sn}.mp3" -filter:a "atempo=1.5" "downloads/mp3/${sn}-${match[0]}_converted.mp3"`);

            //遞增檔案流水號
            sn++;
        }
    }
)();