const { Writable, Duplex } = require('stream');
const {createSession, chunkedUploader} = require('../server/requestAPI.js');
const FormData = require("form-data");

class streamWrite extends Duplex
{
    constructor(contents, ctx, file, folderId, user){
        super(null);
        this.contents = contents;
        this.ctx = ctx;
        this.file = file;
        this.folderId = folderId;
        this.location = undefined;
        this.user = user;
    }

    _read(){
        for(var i =0; i< this.contents.length;i++){
            this.push(this.contents[i]);
        }
        this.push(null);
    }

    _write(chunk, encoding, callback){
        this.contents.push(chunk);
        (async () => {
            try {
                if(!this.location){
                    const data={
                        "FileName": this.file.realTitle,
                        "FileSize": this.ctx.estimatedSize,
                        "RelativePath": ""
                    };
                    this.location = await createSession(this.ctx, this.folderId, data, this.user.token);
                }
                const chunkStream = new streamWrite([chunk]);
                const form_data = new FormData();
                form_data.append("file", chunk,{'Content-Disposition': 'form-data; name="file"; filename="blob"',
                'Content-Type': 'application/octet-stream'});
                await chunkedUploader(this.ctx, chunkStream, this.location, this.user.token, form_data._valueLength + form_data._overheadLength);
                callback(null);
            } catch (error) {
                callback(error, null);
            }
        })();
        callback(null);
    }
}

module.exports = streamWrite;