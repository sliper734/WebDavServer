const { Writable, Duplex } = require('stream');

class streamWrite extends Duplex
{
    constructor(contents){
        super(null);
        this.contents = contents;
    }

    _read(){
        for(var i =0; i< this.contents.length;i++){
            this.push(this.contents[i]);
        }
        this.push(null);
    }

    _write(chunk, encoding, callback){
        this.contents.push(chunk);
        callback(null);
    }
}

module.exports = streamWrite;