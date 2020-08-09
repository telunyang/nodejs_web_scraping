const util = require('util');
const fs = require('fs');
const exec = util.promisify( require('child_process').exec );

(
    async function () {
        let strJson = await fs.readFileSync('downloads/youtube.json', { encoding: 'utf-8' });
        let arrJson = JSON.parse(strJson);

        //若沒資料夾，則直接建立
        //(註: existsSync、mkdirSync 與 exists、mkdir 的差異，在於有 sync 的函式，不需要 callback)
        if (! await fs.existsSync(`downloads/youtube`) ){ 
            await fs.mkdirSync(`downloads/youtube`, {recursive: true}); //遞迴建立資料夾
        }

        for(let i = 0; i < arrJson.length; i++){
            console.log(`下載中 ==> 連結${arrJson[i].link}, 名稱: ${arrJson[i].title}`);
            await exec(`youtube-dl.exe -f mp4 -i ${arrJson[i].link} -o "downloads/youtube/%(id)s.%(ext)s"`);
        }
    }
)();