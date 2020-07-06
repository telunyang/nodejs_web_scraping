let str = "A100222333";
let regex = /[A-Z][0-9]+/g;
let matches = null;

if( (matches = regex.exec(str)) !== null){
    console.log(matches);
}