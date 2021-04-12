const webdav = require('webdav-server').v2;
const {
    getStructDirectory,
    createSession,
    getPresignedUri,
    getFileDownloadUrl,
    rewritingFile,
    createFile,
    chunkedUploader,
    createFolder,
    deleteFile,
    deleteFolder,
    copyFile,
    copyFolder,
    moveFile,
    moveFolder,
    renameFile,
    renameFolder,
    createFiletxt,
    createFilehtml
} = require('../server/requestAPI.js');
const FormData = require("form-data");
const {method} = require('../server/config.js');
const streamWrite = require('../helper/Writable.js');
const SimpleStruct = require('./SimpleStruct.js');
const parse = require('../helper/PropertyParser.js');

class CustomVirtualResources
{
    constructor(){
        this.structСache = new SimpleStruct();
    }

    async getRootFolder(ctx, user){
        let structRoot = {
            files: [],
            folders: [],
            current: {}
        };
        try {
            const structDir= await getStructDirectory(ctx, method.pathRootDirectory,user.token);
            for(var i=0;i<structDir.length;i++)
            {
                structRoot.folders.push(structDir[i].current);
            }
            return structRoot;
        } catch (error) {
            return webdav.Errors.ResourceNotFound;
        }
    }

    findFolder(struct, element){ 
        try {
            return struct.folders.find(folder => folder.title == element);
        } catch (error) {
            return false;   
        }
    }

    findFile(struct, element){
        try {
            return struct.files.find(file => file.title == element);
        } catch (error) {
            return false;
        }
    }

    fastExistCheck(path, ctx){
        if(path == '/'){
            return true;
        }
        const user = ctx.user;
        const {element, parentFolder} = parse.parsePath(path);
        let struct = this.structСache.getStruct(parentFolder, user.uid);
        if(struct){
            if (this.findFile(struct, element) || this.findFolder(struct, element)){
                return true;
            }
            return false;
        }
    }

    async create(ctx, path){

        console.log("CREATE "+path);
        const user = ctx.context.user;
        let {element, parentFolder} = await parse.parsePath(path);
        var parentId = this.structСache.getStruct(parentFolder, user.uid).current.id;
        
            
        if(ctx.type.isDirectory){
            var createdObj1 = await createFolder(ctx, parentId, element, user.token);
            this.structСache.setFolderObject(parentFolder, user.uid, createdObj1);
            this.readDir(ctx, path);
        }
        if(ctx.type.isFile){
            element = parse.isExst(element);
            switch(parse.parseFileExst(element)){
                case 'OFFICE_DOCX_PPTX_XLSX':
                    var createdObj = await createFile(ctx, parentId, element, user.token, false);
                    this.structСache.setFileObject(parentFolder, user.uid, createdObj);
                    break;
                case 'txt':
                    var createdObj = await createFiletxt(ctx, parentId, element, user.token);
                    this.structСache.setFileObject(parentFolder, user.uid, createdObj);
                    break;
                case 'html':
                    var createdObj = await createFilehtml(ctx, parentId, element, user.token);
                    this.structСache.setFileObject(parentFolder, user.uid, createdObj);
                    break;
                default:
                    var createdObj = await createFile(ctx, parentId, element, user.token, true);
                    this.structСache.setFileObject(parentFolder, user.uid, createdObj);
                    break;
            }
        }
    }

    async delete(ctx, path){
        console.log("DELETE "+path);
        const user = ctx.context.user;
        const {element, parentFolder} = parse.parsePath(path);
        const struct = this.structСache.getStruct(parentFolder, user.uid);
        try {
            const folder = this.findFolder(struct, element);
            if (folder){
                await deleteFolder(ctx, folder.id, user.token);
                this.structСache.dropFolderObject(parentFolder, user.uid, folder);
                this.structСache.dropPath(path, user.uid);
            }
            const file = this.findFile(struct, element);
            if (file){
                await deleteFile(ctx, file.id, user.token);
                this.structСache.dropFileObject(parentFolder, user.uid, file);
                this.structСache.dropPath(path, user.uid);
            }
        } catch (error) {
            return new Error(error);
        }
    }

    async readDir(ctx, path){

        const user = ctx.context.user;
        
        if(path == '/'){
            var rootFolder = await this.getRootFolder(ctx, user);
            try {
                this.structСache.setStruct(path,user.uid,rootFolder);
                return this.structСache.getStruct(path,user.uid);
            } catch (error) {
                return new Error(webdav.Errors.ResourceNotFound);
            }
        }
        const {element, parentFolder} = parse.parsePath(path);

        try{
            if(!this.structСache.getStruct(parentFolder, user.uid)){
                try {
                    await this.readDirRecursion(ctx, parentFolder);
                    if(!this.structСache.getStruct(parentFolder, user.uid)){
                        await this.readDir(ctx, path);
                    }
                    else{
                        const folder = this.findFolder(this.structСache.getStruct(parentFolder,user.uid), element);
                        if (folder){
                            try {
                                const structDirectory = getStructDirectory(ctx, folder.id, user.token);
                                this.structСache.setStruct(path, user.uid, structDirectory);
                                return this.structСache.getStruct(path, user.uid);
                            } catch (error) {
                                return new Error(webdav.Errors.ResourceNotFound);
                            }
                        }
                    }
                } catch (error) {
                    return error;
                }
            }

            const folder = this.findFolder(this.structСache.getStruct(parentFolder, user.uid), element);
            if (folder){
                if (this.structСache.structIsExpire(path, parentFolder, user.uid)){
                    return this.structСache.getStruct(path, user.uid);
                }
                try {
                    var structDirectory = await getStructDirectory(ctx, folder.id, user.token);
                    this.structСache.setStruct(path, user.uid, structDirectory);
                    return this.structСache.getStruct(path, user.uid);
                } catch (error) {
                    return new Error(webdav.Errors.ResourceNotFound);
                }
            }
        }
        catch(error1){
            var rootFolder = await this.getRootFolder(ctx, user);
            try {
                this.structСache.setStruct('/', user.uid, rootFolder);
                await this.readDir(ctx, path);
            } catch (error) {
                return new Error(error);
            }
        }
    }

    async readDirRecursion(ctx, path){

        const user = ctx.context.user;
        const {element, parentFolder} = parse.parsePath(path);

        if(!this.structСache.getStruct(parentFolder, user.uid) && path != parentFolder){
            return await this.readDirRecursion(ctx, parentFolder);
        }
        await this.readDir(ctx, parentFolder);
        const folder = this.structСache.getStruct(parentFolder, user.uid);
        if (folder){
            try {
                var structDirectory = await getStructDirectory(ctx, folder.current.id, user.token);
                this.structСache.setStruct(path, user.uid, structDirectory);
            } catch (error) {
                return new Error(webdav.Errors.ResourceNotFound);
            }
        }
    }

    async downloadFile(ctx, path){
        console.log("DOWNLOADFILE "+path);
        const user = ctx.context.user;
        const {element, parentFolder} = parse.parsePath(path);
        const file = this.findFile(this.structСache.getStruct(parentFolder, user.uid),element);
        if (file){
            try {
                var uri = getPresignedUri(ctx, file.id, user.token);
                var streamFile = await getFileDownloadUrl(user.token, await uri);
                return streamFile;
            } catch (error) {
                return new Error(error);
            }
        }
    }

    writeFile(path, ctx){
        console.log("WRITEFILESTART "+ctx.mode+" "+path);
        const MinDocx = 6998;
        const MinPptx = 33511;
        const MinXlsx = 6437;
        const fileSize = this.getSize(path, ctx);
        const user = ctx.context.user;
        const {element, parentFolder} = parse.parsePath(path);
        const content = [];
        const struct = this.structСache.getStruct(parentFolder, user.uid);
        const file = this.findFile(struct, element);
        
        const stream = new streamWrite(content, ctx, file, struct.current.id, user);
        //if(ctx.mode !== "mustCreate"){
            console.log("WRITEFILENEXT "+path);
            // readable.on('data'...)
        //    stream.on('finish', (async() => {
        //        const struct = this.structСache.getStruct(parentFolder, user.uid);
        //        if(!stream.contents.length) return;
        //        const file = this.findFile(struct, element);
        //        if (file){
        //            try {
        //                if (stream.contents.length <= 127){
        //                    const form_data = new FormData();
        //                    form_data.append("FileExtension", file.fileExst);
        //                    form_data.append("DownloadUri", "");
        //                    form_data.append("Stream", stream, {filename: file.realTitle, contentType:"text/plain"});
        //                    form_data.append("Doc", "");
        //                    form_data.append("Forcesave", 'false');
        //                    await rewritingFile(ctx, file.id, form_data, user.token);
        //                }
        //                if (stream.contents.length > 127){
        //                    let contLength=0;
        //                    for(var i=0;stream.contents.length > i;i++)
        //                    {
        //                        contLength = stream.contents[i].length + contLength;
        //                    }
        //                    const data={
        //                        "FileName": file.realTitle,
        //                        "FileSize": contLength,
        //                        "RelativePath": ""
        //                    }
        //                    const location = await createSession(ctx, struct.current.id, data, user.token);
        //                    //let j = 0;
        //                    //let bufLength=0;
        //                    //for(let i=0;stream.contents.length > i; i++)
        //                    //{
        //                    //    bufLength += stream.contents[i].length;
        //                    //}
        //                    let count =0;
        //                    var chunk = [];
        //                    for(let i=0;stream.contents.length > i; i++)
        //                    {
        //                        let j =0;
        //                        while(stream.contents[i][j]!=undefined){
        //                            chunk.push(stream.contents[i][j]);
        //                            j += 1;
        //                            count += 1;
        //                            if((count % 1047552 ==0 && count / 1047552 >= 1) || (stream.contents[i].length < 8192 && stream.contents[i][j] == undefined)){
        //                                let bufferChunk = Buffer.from(chunk);
        //                                const chunkStream = new streamWrite([bufferChunk]);
        //                                //chunkStream._write(bufferChunk, 'utf-8', function (){});
        //                                //chunkStream.end();
//
        //                                
        //                                /*const readable = new Readable();
        //                                readable.push(bufferChunk);
        //                                readable.push(null);*/
        //                                const contentLength = chunkStream.contents[0].length;
        //                                const form_data = new FormData();
        //                                form_data.append("file", chunkStream,{'Content-Disposition': 'form-data; name="file"; filename="blob"',
        //                                'Content-Type': 'application/octet-stream'});
        //                                await chunkedUploader(ctx, form_data, location, user.token, contentLength);
        //                                chunk.length=0;
        //                            }
        //                        }
        //                    }
        //                    //for(let i=0;bufLength > i; i++)
        //                    //{
        //                    //    if (((i % 1047552 == 0 && i / 1047552 >= 1) || (bufLength - i) == 1) && i != 0){//max1048377
        //                    //        //var chunk = stream.read(1047552);
        //                    //        console.log(stream.contents[i]);
        //                    //        var chunk = stream.contents.slice(j,i);
        //                    //        var chunkStream = new Readable();
        //                    //        chunkStream.push(chunk);
        //                    //        const form_data = new FormData();
        //                    //        form_data.append("file", chunkStream,{'Content-Disposition': 'form-data; name="file"; filename="blob"',
        //                    //        'Content-Type': 'application/octet-stream'});
        //                    //        await chunkedUploader(ctx, form_data, location, user.token);
        //                    //        console.dir(i+"  "+j);
        //                    //        j=i;
        //                    //    }
        //                    //}
        //                        
        //                    //for(let i=0; stream.contents.length > i; i++)//127
        //                    //{
        //                    //    const form_data = new FormData();
        //                    //    form_data.append("file", stream.contents[i], {filename: file.realTitle, contentType:"text/plain"})
        //                    //    await chunkedUploader(ctx, form_data, location);
        //                    //    /*chunk.push(stream.contents[i]);
        //                    //    if ((i % 126 == 0 || (stream.contents.length - i) == 1) && i != 0){
        //                    //        const form_data = new FormData();
        //                    //        form_data.append("file", chunk, {filename: file.realTitle, contentType:"text/plain"})
        //                    //        await chunkedUploader(ctx, new Blob(chunk), location);
        //                    //        console.log("длинна:"+stream.contents.length+" i="+i);
        //                    //        chunk.splice(0,chunk.length);
        //                    //    }*/
        //                    //}
        //                }
        //                //await rewritingFile(ctx, file.id, form_data, user.token);
        //            } catch (error) {
        //                return new Error(error);
        //            }
        //        }
        //    }));
        //}
        return stream;
    }

    async copy(ctx, pathFrom, pathTo){
        const user = ctx.context.user;
        let {element, parentFolder} = parse.parsePath(pathFrom);
        pathTo = parse.parsePathTo(pathTo);
        const structTo = this.structСache.getStruct(pathTo, user.uid);
        if(!structTo){
            try {
                this.readDir(ctx, pathTo);
                this.copy(ctx, pathFrom, pathTo);
            } catch (error) {
                return new Error(error);
            }
        }
        const folderId = structTo.current.id;
        const structFrom = this.structСache.getStruct(parentFolder, user.uid);
        const folder = this.findFolder(structFrom, element);
        if (folder){
            try {
                await copyFolder(ctx, folderId, folder.id, user.token);
                return true;
            } catch (error) {
                return new Error(error);
            }
        }
        const file = this.findFile(structFrom, element);
        if (file){
            try {
                await copyFile(ctx, folderId, file.id, user.token);
                return true;
            } catch (error) {
                return new Error(error);
            }
        }
    }

    async rename(ctx, path, newName){

        const user = ctx.context.user;
        const {element, parentFolder} = parse.parsePath(path);
        const struct = this.structСache.getStruct(parentFolder, user.uid);
        const folder = this.findFolder(struct, element);
        if (folder){
            try {
                await renameFolder(ctx, folder.id, newName, user.token);
                this.structСache.renameFolderObject(element, newName, parentFolder, user.uid);
                folder.realTitle = newName;
                return true;
            } catch (error) {
                return new Error(error);
            }
        }
        const file = this.findFile(struct, element);
        if (file){
            try {
                await renameFile(ctx, file.id, newName, user.token);
                this.structСache.renameFileObject(element, newName, parentFolder, user.uid);
                file.realTitle = newName;
                return true;
            } catch (error) {
                return new Error(error);
            }
        }
    }

    async move(ctx, pathFrom, pathTo){
        
        pathTo = parse.parsePathTo(pathTo);
        const {element: elementFrom, parentFolder: parentFolderFrom} = parse.parsePath(pathFrom);
        const {element: elementTo, parentFolder: parentFolderTo} = parse.parsePath(pathTo);
        const user = ctx.context.user;
        var isRename = false;
        if(parentFolderFrom == parentFolderTo){
            var isRename = this.structСache.checkRename(elementFrom, elementTo, parentFolderFrom, parentFolderTo, user);
        }
        if(isRename){
            try {
                const rename = this.rename(ctx, pathFrom, elementTo);
                return rename;
            } catch (error) {
                return new Error(error);
            }
        }
        if(!this.structСache.getStruct(parentFolderTo, user.uid)){
            try {
                await this.readDir(ctx, parentFolderTo);
                this.move(ctx, pathFrom, pathTo);
            } catch (error) {
                return new Error(error);
            }
        }
        const folderId = this.structСache.getStruct(parentFolderTo, user.uid).current.id;
        const structFrom = this.structСache.getStruct(parentFolderFrom, user.uid);
        const folder = this.findFolder(structFrom, elementFrom);
        if (folder){
            try {
                moveFolder(ctx, folderId, folder.id, user.token);
                this.structСache.dropFolderObject(parentFolderFrom, user.uid, folder);
                this.readDir(ctx, pathTo);
                return true;
            } catch (error) {
                return new Error(error);
            }
        }
        const file = this.findFile(structFrom, elementFrom);
        if (file){
            try {
                moveFile(ctx,folderId, file.id, user.token);
                this.structСache.dropFileObject(parentFolderFrom, user.uid, file);
                return true;
            } catch (error) {
                return new Error(error);
            }
        }
    }

    getType(path, ctx){

        const user = ctx.context.user;
        const {element, parentFolder} = parse.parsePath(path);

        if(parentFolder == '/'){
            return webdav.ResourceType.Directory;
        }
        const struct = this.structСache.getStruct(parentFolder, user.uid);
        const folder = this.findFolder(struct, element);
        if(folder){
            return webdav.ResourceType.Directory;
        }
        const file = this.findFile(struct, element);
        if (file){
            return webdav.ResourceType.File;
        }
    }

    getSize(path, ctx){

        const {element, parentFolder} = parse.parsePath(path);
        const user = ctx.context.user;
        const struct = this.structСache.getStruct(parentFolder, user.uid);
        const folder = this.findFolder(struct, element);
        if (folder){
            return null;
        }
        const file = this.findFile(struct, element);
        if (file){
            return file.pureContentLength;
        }
    }

    getlastModifiedDate(path, ctx){

        if(path == '/')
        {
            return new Date(0, 0, 0, 0, 0, 0);
        }
        const {element, parentFolder} = parse.parsePath(path);
        const user = ctx.context.user;
        const struct = this.structСache.getStruct(parentFolder, user.uid);
        const folder = this.findFolder(struct, element);
        if (folder){
            return parse.parseDate(folder.updated);
        }
        const file = this.findFile(struct, element);
        if (file){
            return parse.parseDate(file.updated);
        }
    }
}

module.exports = CustomVirtualResources;