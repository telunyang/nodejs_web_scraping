const fs = require('fs');


//IIFE
(
    //將小說寫入檔案(儲存成 txt 檔)
    async function(){
        let strJson = await fs.readFileSync(`downloads/jinyong.json`);
        let arrLink = JSON.parse(strJson);
        let count = 1;

        //迭代存取每個存有金庸小說資訊的物件
        for(let obj of arrLink){
            //迭代存取物件中的所有超連結（links）
            for(let objLink of obj.links){
                //如果內文是空的，則跳下一個
                if( objLink.content === "" ) continue;

                /**
                 * count.toString().padStart(4,'0')
                 * 上一行範例，是指將數值 count 轉成字串後，
                 * 再透過 .padStart() 來向左方填補 0，格式化為 4 位數的數字
                 * 例如 0001, 0012, 0456, 1002 等等
                 */
                let strFileName = `${obj.title}_${objLink.title}`; //將檔案名稱串接起來
                strFileName = strFileName.replace(/\/|,|\(|\)|\.txt|—|\s|:|\./g, ''); //去除不需要的文字
                strFileName = `${count.toString().padStart(4,'0')}_jinyong_${strFileName}.txt`; //加上副檔名

                //印出檔案，檢視結果
                console.log(strFileName); 
                count++;

                //若檔案不存在，則新增檔案，同時寫入內容
                if(! await fs.existsSync(`downloads/jinyong/${strFileName}`)){
                    await fs.writeFileSync(`downloads/jinyong/${strFileName}`, objLink.content);
                }
            }
        }
    }
)();