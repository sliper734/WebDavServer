const webdav = require('webdav-server').v2;
const {
    getStructDirectory,
    getFileDownloadUrl,
    rewritingFile,
    createFile,
    createFolder,
    deleteFile,
    deleteFolder,
    copyFile,
    copyFolder,
    moveFile,
    moveFolder,
    renameFile,
    renameFolder
    //createFiletxt
    //createFilehtml
} = require('../server/requestAPI.js');
const {exceptionResponse} = require('../helper/helper.js');
const {method} = require('../server/config.js');
const streamWrite = require('../helper/Writable.js');
const SimpleStruct = require('./SimpleStruct.js');
const parse = require('../helper/PropertyParser.js');

class CustomVirtualResources
{
    constructor(){
        this.structСache = new SimpleStruct();
    }

    async getRootFolder(user){
        let structRoot = {
            files: [],
            folders: [],
            current: {}
        };
        try {
            var structDir= await getStructDirectory(method.pathRootDirectory,user.token);
            for(var i=0;i<structDir.length;i++)
            {
                structRoot.folders.push(structDir[i].current);
            }
            return structRoot;
        } catch (error) {
            return webdav.Errors.ResourceNotFound;
            //#region er
            /*if(structRoot.folders.length == 0){
                callback(webdav.Errors.ResourceNotFound, null);
            }
            else{
                callback(null, structRoot);
            }*/
            //#endregion
        }
        //#region old code
        /*getStructDirectory(method.pathRootDirectory, user.token, (err, structDir) => {
            if(err){
                if(structRoot.folders.length == 0){
                    callback(webdav.Errors.ResourceNotFound, null);
                }
                else{
                    callback(null, structRoot);
                }
            }
            else{
                for(var i=0;i<structDir.length;i++)
                {
                    structRoot.folders.push(structDir[i].current);
                }
                
                callback(null, structRoot);
            }
        });*/
        //#endregion
    }

    async fastExistCheck(path, ctx){
        if(path == '/'){
            return true;
        }
        
        const user = ctx.user;
        const {element, parentFolder} = parse.parsePath(path);
        let fileisExist = false;
        if(this.structСache.getStruct(parentFolder, user.username)){
            this.structСache.getStruct(parentFolder, user.username).files.forEach((el) => {
                if(element == el.title){
                    fileisExist = true;
                }
            });
            this.structСache.getStruct(parentFolder, user.username).folders.forEach((el) => {
                if(element == el.title){
                    fileisExist = true;
                }
            });
            return fileisExist;
        }

        
        try {
            var st = await this.readDir(parentFolder, {context: ctx});
            fileisExist = false;
            this.structСache.getStruct(parentFolder, user.username).files.forEach((el) => {
                if(element == el.title){
                    fileisExist = true;
                }
            });
            this.structСache.getStruct(parentFolder, user.username).folders.forEach((el) => {
                if(element == el.title){
                    fileisExist = true;
                }
            });
            return fileisExist;
        } catch (error) {
            return false;
        }
        /*this.readDir(parentFolder, {context: ctx}, (err, st) => {
            if(err){
                callback(false);
            }
            else{
                fileisExist = false;
                this.structСache.getStruct(parentFolder, user.username).files.forEach((el) => {
                    if(element == el.title){
                        fileisExist = true;
                        callback(true);
                    }
                });
                this.structСache.getStruct(parentFolder, user.username).folders.forEach((el) => {
                    if(element == el.title){
                        fileisExist = true;
                        callback(true);
                    }
                });
                if(!fileisExist){
                    callback(false);
                }
            }
        });*/
    }

    async create(path, ctx){

        const user = ctx.context.user;
        let {element, parentFolder} = await parse.parsePath(path);
        let parentId = this.structСache.getStruct(parentFolder, user.username).current.id;
            
        if(ctx.type.isDirectory){
            var createdObj1 = await createFolder(parentId, element, user.token);
            this.structСache.setFolderObject(parentFolder, user.username, createdObj1);
        }
        if(ctx.type.isFile){
            element = parse.isExst(element);
            switch(parse.parseFileExst(element)){
                case 'OFFICE_DOCX_PPTX_XLSX':
                    var createdObj = await createFile(parentId, element, user.token);
                    this.structСache.setFileObject(parentFolder, user.username, createdObj);
                    break;
            }
        }
    }

    delete(path, ctx){

        const user = ctx.context.user;
        const {element, parentFolder} = parse.parsePath(path);

        this.structСache.getStruct(parentFolder, user.username).folders.forEach(async (el) => {
            if(element == el.title){
                try {
                    await deleteFolder(el.id, user.token);
                    this.structСache.dropFolderObject(parentFolder, user.username, el);
                    this.structСache.dropPath(path, user.username);
                } catch (error) {
                    return new Error(error);
                }
            }
        });
        this.structСache.getStruct(parentFolder, user.username).files.forEach(async (el) => {
            if(element == el.title){
                try {
                    await deleteFile(el.id, user.token);
                    this.structСache.dropFileObject(parentFolder, user.username, el);
                } catch (error) {
                    return new Error(error);
                }
            }
        });
    }

    async readDir(path, ctx/*, callback*/){

        const user = ctx.context.user;
        
        if(path == '/'){
            var rootFolder = await this.getRootFolder(user);
            try {
                this.structСache.setStruct(path,user.username,rootFolder);
                return this.structСache.getStruct(path,user.username);
                //callback(null,this.structСache.getStruct(path,user.username));
            } catch (error) {
                return new Error(webdav.Errors.ResourceNotFound);
                //callback(webdav.Errors.ResourceNotFound,null);
            }
            //#region old code
            /*this.getRootFolder(user, (err, structDir) => {
                if(err){
                    callback(webdav.Errors.ResourceNotFound, null);
                }
                else{
                    this.structСache.setStruct(path, user.username, structDir);
                    callback(null, this.structСache.getStruct(path, user.username));
                }
            });*/
            //#endregion
        }
        const {element, parentFolder} = parse.parsePath(path);

        try{
            if(!this.structСache.getStruct(parentFolder, user.username)){
                try {
                    await this.readDirRecursion(parentFolder, ctx);
                    if(!this.structСache.getStruct(parentFolder, user.username)){
                        this.readDir(path, ctx);
                        //////////////////////////////////////////
                    }
                    else{
                        this.structСache.getStruct(parentFolder, user.username).folders.forEach((el) => {
                            if(element == el.title){
                                let folderId = el.id;
                                try {
                                    var structDirectory = getStructDirectory(folderId,user.token);
                                    this.structСache.setStruct(path, user.username, structDirectory);
                                    return this.structСache.getStruct(path, user.username);
                                    //callback(null, this.structСache.getStruct(path, user.username));
                                } catch (error) {
                                    return new Error(webdav.Errors.ResourceNotFound);
                                    //callback(webdav.Errors.ResourceNotFound, null);
                                }
                            }
                        });
                    }
                } catch (error) {
                    return error;
                }
            }

            const folders = this.structСache.getStruct(parentFolder, user.username).folders;
            for (var i=0;i<folders.length;i++)
            {
                const el = folders[i];
                if(element == el.title){
                    let folderId = el.id;
                    if(this.structСache.structIsExpire(path, parentFolder, user.username)){
                        return this.structСache.getStruct(path, user.username);
                        //callback(null, this.structСache.getStruct(path, user.username));
                    }
                    else {
                        try {
                            var structDirectory = await getStructDirectory(folderId, user.token);
                            this.structСache.setStruct(path, user.username, structDirectory);
                            return this.structСache.getStruct(path, user.username);
                            //callback(null, this.structСache.getStruct(path, user.username));
                        } catch (error) {
                            return new Error(webdav.Errors.ResourceNotFound);
                            //callback(webdav.Errors.ResourceNotFound, null);
                        }
                    }
                }
            }
        }
        catch(error1){
            var rootFolder = await this.getRootFolder(user);
            try {
                this.structСache.setStruct('/', user.username, rootFolder);
                this.readDir(path, ctx);
                ///////////////////////
            } catch (error) {
                return new Error(error);
                //callback(error, null);
            }
            //#region old code
            /*this.getRootFolder(user, (err, st) => {
                if(err){
                    callback(err, null);
                }
                else{
                    this.structСache.setStruct('/', user.username, st);
                    this.readDir(path, ctx, callback);
                }
            });*/
            //#endregion
        }
    }

    async readDirRecursion(path, ctx/*, callback*/){

        const user = ctx.context.user;
        const {element, parentFolder} = parse.parsePath(path);

        if(!this.structСache.getStruct(parentFolder, user.username) && path != parentFolder){
            return await this.readDirRecursion(parentFolder, ctx/*, callback*/);
        }
            await this.readDir(parentFolder, ctx);
        
        //else{
        const folders = this.structСache.getStruct(parentFolder, user.username).folders;
        for(var i=0;i<folders.length;i++)
        {
            const el=folders[i];
            if(element == el.title){
                let folderId = el.id;
                try {
                    var structDirectory = await this.getStructDirectory(folderId,user.token);
                    this.structСache.setStruct(path, user.username, structDirectory);
                    //callback();
                } catch (error) {
                    return new Error(webdav.Errors.ResourceNotFound);
                    //callback(webdav.Errors.ResourceNotFound);
                }
            }
        }
    }

    downloadFile(path, ctx, callback){

        const user = ctx.context.user;
        const {element, parentFolder} = parse.parsePath(path);

        this.structСache.getStruct(parentFolder, user.username).files.forEach(async (el) => {
            if(element == el.title){
                try {
                    var streamFile = await getFileDownloadUrl(el.id,user.token);
                    //return streamFile;
                    callback(null,streamFile);
                } catch (error) {
                    //return new exceptions(error);
                    callback(error,null);
                }
            //#region old code
                /*getFileDownloadUrl(el.id, user.token, (err, streamFile) => {
                    if(err){
                        callback(err, null);
                    }
                    else{
                        callback(null, streamFile);
                    }
                });*/
               //#endregion 
            }
        });
    }

    async writeFile(path, ctx, callback){

        const user = ctx.context.user;
        const {element, parentFolder} = parse.parsePath(path);
        let folderId = this.structСache.getStruct(parentFolder, user.username).current.id;

        const content = [];
        const stream = new streamWrite(content);

        await stream.on('finish', () => {
            this.structСache.getStruct(parentFolder, user.username).files.forEach(async (el) => {
                if(element == el.title){
                    try {
                        await rewritingFile(folderId,el.title,content,user.token);
                        //не знаю что засовывать
                    } catch (error) {
                        callback(error, null);
                    }
                    //#region old code
                    /*rewritingFile(folderId, el.title, content, user.token, (err) => {
                        if(err){
                            callback(err, null);
                        }
                    });*/
                    //#endregion
                }
            });
        });
        callback(null, stream);
    }

    copy(pathFrom, pathTo, ctx/*, callback*/){

        const user = ctx.context.user;
        let {element, parentFolder} = parse.parsePath(pathFrom);
        pathTo = parse.parsePathTo(pathTo);

        if(!this.structСache.getStruct(pathTo, user.username)){
            try {
                this.readDir(pathTo, ctx);
                this.copy(pathFrom, pathTo, ctx/*, callback*/);
            } catch (error) {
                return new Error(err);
            }
            //this.readDir(pathTo, ctx, (err, st) => {
            //    if(err){
            //        return new exceptions(err);
            //        //callback(err, null);
            //    }
            //    else{
            //        this.copy(pathFrom, pathTo, ctx/*, callback*/);
            //    }
            //});
        }
        const folderId = this.structСache.getStruct(pathTo, user.username).current.id;
        this.structСache.getStruct(parentFolder, user.username).folders.forEach(async (el) => {
            if(element == el.title){
                try {
                    await copyFolder(folderId, el.id, user.token);
                    return true;
                } catch (error) {
                    return new Error(error);
                }
            }
        });
        this.structСache.getStruct(parentFolder, user.username).files.forEach(async (el) => {
            if(element == el.title){
                try {
                    await copyFile(folderId, el.id, user.token);
                    return true;
                } catch (error) {
                    return new Error(error);
                }
            }
        });
    }

    rename(path, newName, ctx){

        const user = ctx.context.user;
        let {element, parentFolder} = parse.parsePath(path);

        this.structСache.getStruct(parentFolder, user.username).folders.forEach(async (el) => {
            if(element == el.title){
                try {
                    await renameFolder(el.id, newName, user.token);
                    this.structСache.renameFolderObject(element, newName, parentFolder, user.username);
                    return true;
                } catch (error) {
                    return new Error(error);
                }
            }
        });
        this.structСache.getStruct(parentFolder, user.username).files.forEach(async (el) => {
            if(element == el.title){
                try {
                    await renameFile(el.id, newName, user.token);
                    this.structСache.renameFileObject(element, newName, parentFolder, user.username);
                    return true;
                } catch (error) {
                    return new Error(error);
                }
            }
        });
    }

    move(pathFrom, pathTo, ctx){
        
        pathTo = parse.parsePathTo(pathTo);
        let {element: elementFrom, parentFolder: parentFolderFrom} = parse.parsePath(pathFrom);
        let {element: elementTo, parentFolder: parentFolderTo} = parse.parsePath(pathTo);
        const user = ctx.context.user;

        var isRename = false;
        if(parentFolderFrom == parentFolderTo){
            var isRename = this.structСache.checkRename(elementFrom, elementTo, parentFolderFrom, parentFolderTo, user);
        }

        if(isRename){
            try {
                const rename = this.rename(pathFrom, elementTo, ctx);
                return rename;
            } catch (error) {
                return new Error(error);
            }
        }
        if(!this.structСache.getStruct(pathTo, user.username)){
            try {
                this.readDir(pathTo, ctx);
                this.move(pathFrom, pathTo, ctx);
            } catch (error) {
                return new Error(error);
            }
            /*this.readDir(pathTo, ctx, (err, st) => {
                if(err){
                    return new exceptions(err);
                }
                else{
                    this.move(pathFrom, pathTo, ctx);
                }
            });*/
        }
        const folderId = this.structСache.getStruct(pathTo, user.username).current.id;
        this.structСache.getStruct(parentFolderFrom, user.username).folders.forEach((el) => {
            if(elementFrom == el.title){
                try {
                    moveFolder(folderId, el.id, user.token);
                    this.structСache.dropFolderObject(parentFolderFrom, user.username, el);
                    return true;
                } catch (error) {
                    return new Error(error);
                }
            }
        });
        this.structСache.getStruct(parentFolderFrom, user.username).files.forEach((el) => {
            if(elementFrom == el.title){
                try {
                    moveFile(folderId, el.id, user.token);
                    this.structСache.dropFileObject(parentFolderFrom, user.username, el);
                    return true;
                } catch (error) {
                    return new Error(error);
                }
            }
        });
    }

    getType(path, ctx, callback){

        const user = ctx.context.user;

        if(path == '/'){
            callback(webdav.ResourceType.Directory);
        }
        else{
            const {element, parentFolder} = parse.parsePath(path);
            
            this.structСache.getStruct(parentFolder, user.username).files.forEach((el) => {
                if(element == el.title){
                    callback(webdav.ResourceType.File);
                }
            });
            this.structСache.getStruct(parentFolder, user.username).folders.forEach((el) => {
                if(element == el.title){
                    callback(webdav.ResourceType.Directory);
                }
            });
        }
    }

    getSize(path, ctx, callback){

        const {element, parentFolder} = parse.parsePath(path);
        const user = ctx.context.user;

        this.structСache.getStruct(parentFolder, user.username).files.forEach((el) => {
            if(element == el.title){
                callback(el.pureContentLength);
            }
        });
        this.structСache.getStruct(parentFolder, user.username).folders.forEach((el) => {
            if(element == el.title){
                callback();
            }
        });
    }

    getlastModifiedDate(path, ctx, callback){

        if(path != '/'){
            const {element, parentFolder} = parse.parsePath(path);
            const user = ctx.context.user;

            this.structСache.getStruct(parentFolder, user.username).files.forEach((el) => {
            if(element == el.title){
                callback(parse.parseDate(el.updated));
            }
            });
            this.structСache.getStruct(parentFolder, user.username).folders.forEach((el) => {
            if(element == el.title){
                callback(parse.parseDate(el.updated));
            }
            });
        }
        else{
            callback(new Date(0, 0, 0, 0, 0, 0));
        }
    }
}

module.exports = CustomVirtualResources;