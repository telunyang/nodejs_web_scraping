const util = require('util');
const fs = require('fs');
const exec = util.promisify( require('child_process').exec );
const readFile = util.promisify(fs.readFile);

(
    async function () {
        let strJson = await readFile('downloads/youtube.json', { encoding: 'utf-8' });
        let arrJson = JSON.parse(strJson);
        // console.dir(arrJson, {depth: null});

        for(let i = 0; i < arrJson.length; i++){
            await exec(`youtube-dl.exe -f mp4 -i ${arrJson[i].link} -o "downloads/%(id)s.%(ext)s"`);
            if(i === 2){
                break;
            }
        }
    }
)();