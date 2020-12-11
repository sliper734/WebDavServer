const webdav = require('webdav-server').v2;
const {
    getStructDirectory,
    createDirectory,
    deleteDirectory,
    getFileDownloadUrl,
    createFile,
    createFiletxt,
    deleteFile,
    rewritingFile,
    copyDirToFolder,
    copyFileToFolder,
    moveDirToFolder,
    moveFileToFolder,
    renameFolder,
    renameFile,
    createFilehtml
} = require('../requestAPI/requestAPI.js');
const {exceptionResponse, isCorrectName} = require('../requestAPI/helper.js');
const {method} = require('../config.js');
const streamWrite = require('../Writable.js');
const SimpleStruct = require('./SimpleStruct.js');
const parse = require('./parseProperty.js');

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

    fastExistCheck(path, ctx, callback){
        if(path == '/'){
            callback(true);
        }
        else{
            const user = ctx.user;
            const {element, parentFolder} = parse.parsePath(path);
            let fileisExist = false;
            if(this.structСache.getStruct(parentFolder, user.username)){
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
            else{
                this.readDir(parentFolder, {context: ctx}, (err, st) => {
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
                });
            }
        }
    }

    async create(path, ctx, callback){

        const user = ctx.context.user;
        let {element, parentFolder} = parse.parsePath(path);
        let parentId = this.structСache.getStruct(parentFolder, user.username).current.id;
            
        if(ctx.type.isDirectory){
            try {
                var createdObj1= await createDirectory(parentId, element, user.token);
                if(await isCorrectName(element)){
                    this.structСache.setFolderObject(parentFolder, user.username, createdObj1);
                    callback();
                }
                else{
                    throw "incorrect folder name";
                }
            } catch (error) {
                callback(error);
            }
            //#region old code
            /*createDirectory(parentId, element, user.token, (err, createdObj) => {
                if(err){
                    callback(err);
                }
                else{
                    this.structСache.setFolderObject(parentFolder, user.username, createdObj);
                    callback();
                }
            });*/
            //#endregion
        }
        else if(ctx.type.isFile){
            element = parse.isExst(element);
            switch(parse.parseFileExst(element)){
                case 'OFFICE_DOCX_PPTX_XLSX':
                    try {
                        if(isCorrectName(element)){
                            var createdObj= await createFile(parentId,element,user.token);
                            this.structСache.setFileObject(parentFolder, user.username, createdObj);
                            callback();
                        }
                        else{
                            throw "incorrect file name";
                        }
                    } catch (error) {
                        callback(error);
                    }
                    //#region old code
                    /*createFile(parentId, element, user.token, (err, createdObj) => {
                        if(err){
                            callback(err);
                        }
                        else{
                            this.structСache.setFileObject(parentFolder, user.username, createdObj);
                            callback();
                        }
                    });*/
                    //#endregion
                    break;
                case 'html':
                    try {
                        if(isCorrectName(element)){
                            var createdObj= await createFilehtml(parentId, element, user.token);
                            this.structСache.setFileObject(parentFolder, user.username, createdObj);
                            callback();
                        }
                        else{
                            throw "incorrect file name";
                        }
                    } catch (error) {
                        callback(error);
                    }
                    //#region old code
                    /*createFilehtml(parentId, element, user.token, (err, createdObj) => {
                        if(err){
                            callback(err);
                        }
                        else{
                            this.structСache.setFileObject(parentFolder, user.username, createdObj);
                            callback();
                        }
                    });*/
                    //#endregion
                    break;
                default:
                    try {
                        if(isCorrectName(element)){
                            var createdObj = await createFiletxt(parentId,element,user.token);
                            this.structСache.setFileObject(parentFolder, user.username, createdObj);
                            callback();
                        }
                        else{
                            throw "incorrect file name";
                        }
                    } catch (error) {
                        callback(error);
                    }
                    //#region old code
                    /*createFiletxt(parentId, element, user.token, (err, createdObj) => {
                        if(err){
                            callback(err);
                        }
                        else{
                            this.structСache.setFileObject(parentFolder, user.username, createdObj);
                            callback();
                        }
                    });*/
                    //#endregion
                    break;
            }
        }
    }

    delete(path, ctx, callback){

        const user = ctx.context.user;
        const {element, parentFolder} = parse.parsePath(path);

        this.structСache.getStruct(parentFolder, user.username).folders.forEach(async (el) => {
            if(element == el.title){
                try {
                    await deleteDirectory(el.id,user.token);
                    this.structСache.dropFolderObject(parentFolder, user.username, el);
                    this.structСache.dropPath(path, user.username);
                    callback(null);
                } catch (error) {
                    callback(error);
                }
                //#region old code
                /*deleteDirectory(el.id, user.token, (err) => {
                    if(err){
                        callback(err);
                    }
                    else{
                        this.structСache.dropFolderObject(parentFolder, user.username, el);
                        this.structСache.dropPath(path, user.username);
                        callback(null);
                    }
                });*/
                //#endregion
            }
        });

        this.structСache.getStruct(parentFolder, user.username).files.forEach(async (el) => {
            if(element == el.title){
                try {
                    await deleteFile(el.id,user.token);
                    this.structСache.dropFileObject(parentFolder, user.username, el);
                    callback(null);
                } catch (error) {
                    callback(error);
                }
                //#region old code
                /*deleteFile(el.id, user.token, (err) => {
                    if(err){
                        callback(err);
                    }
                    else{
                        this.structСache.dropFileObject(parentFolder, user.username, el);
                        callback(null);
                    }
                });*/
                //#endregion
            }
        });
    }

    async readDir(path, ctx, callback){

        const user = ctx.context.user;
        
        if(path == '/'){
            var rootFolder=await this.getRootFolder(user);
            try {
                this.structСache.setStruct(path,user.username,rootFolder);
                callback(null,this.structСache.getStruct(path,user.username));
            } catch (error) {
                callback(webdav.Errors.ResourceNotFound,null);
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
        else{
            const {element, parentFolder} = parse.parsePath(path);

            try{
                if(!this.structСache.getStruct(parentFolder, user.username)){
                    this.readDirRecursion(parentFolder, ctx, (err) => {
                        if(err){
                            callback(webdav.Errors.ResourceNotFound, null);
                        }
                        else{
                            if(!this.structСache.getStruct(parentFolder, user.username)){
                                this.readDir(path, ctx, callback);
                            }
                            else{
                                this.structСache.getStruct(parentFolder, user.username).folders.forEach(async (el) => {
                                    if(element == el.title){
                                        let folderId = el.id;
                                        try {
                                            var structDirectory=await getStructDirectory(folderId,user.token);
                                            this.structСache.setStruct(path, user.username, structDirectory);
                                            callback(null, this.structСache.getStruct(path, user.username));
                                        } catch (error) {
                                            callback(webdav.Errors.ResourceNotFound, null);
                                        }
                                        //#region old code
                                        /*getStructDirectory(folderId, user.token, (err, structDir) => {
                                            if(err){
                                                callback(webdav.Errors.ResourceNotFound, null);
                                            }
                                            this.structСache.setStruct(path, user.username, structDir);
                                            callback(null, this.structСache.getStruct(path, user.username));
                                        });*/
                                        //#endregion
                                    }
                                });
                            }
                        }
                    });
                }
                else{
                    this.structСache.getStruct(parentFolder, user.username).folders.forEach(async (el) => {
                        if(element == el.title){
                            let folderId = el.id;
                            if(this.structСache.structIsExpire(path, parentFolder, user.username)){
                                callback(null, this.structСache.getStruct(path, user.username));
                            }
                            else {
                                try {
                                    var structDirectory = await getStructDirectory(folderId, user.token);
                                    this.structСache.setStruct(path, user.username, structDirectory);
                                    callback(null, this.structСache.getStruct(path, user.username));
                                } catch (error) {
                                    callback(webdav.Errors.ResourceNotFound, null);
                                }
                                //#region old code
                                /*getStructDirectory(folderId, user.token, (err, structDir) => {
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
                        }
                    });
                }
            }
            catch{
                var rotFolder=await this.getRootFolder(user);
                try {
                    this.structСache.setStruct('/', user.username, rootFolder);
                    this.readDir(path, ctx, callback);
                } catch (error) {
                    callback(error, null);
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
    }

    readDirRecursion(path, ctx, callback){

        const user = ctx.context.user;
        const {element, parentFolder} = parse.parsePath(path);

        if(!this.structСache.getStruct(parentFolder, user.username)){
            this.readDirRecursion(parentFolder, ctx, callback);
        }
        else{
            this.structСache.getStruct(parentFolder, user.username).folders.forEach(async (el) => {
                if(element == el.title){
                    let folderId = el.id;
                    try {
                        var structDirectory= await this.getStructDirectory(folderId,user.token);
                        this.structСache.setStruct(path, user.username, structDirectory);
                        callback();
                    } catch (error) {
                        callback(webdav.Errors.ResourceNotFound);
                    }
                    //#region old code
                    /*getStructDirectory(folderId, user.token, (err, structDir) => {
                        if(err){
                            callback(webdav.Errors.ResourceNotFound);
                        }
                        else{
                            this.structСache.setStruct(path, user.username, structDir);
                            callback();
                        }
                    });*/
                    //#endregion
                }
            });
        }
    }

    downloadFile(path, ctx, callback){

        const user = ctx.context.user;
        const {element, parentFolder} = parse.parsePath(path);

        this.structСache.getStruct(parentFolder, user.username).files.forEach(async (el) => {
            if(element == el.title){
                var streamFile= await getFileDownloadUrl(el.id,user.token);
                try {
                    callback(null,streamFile);
                } catch (error) {
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

    writeFile(path, ctx, callback){

        const user = ctx.context.user;
        const {element, parentFolder} = parse.parsePath(path);
        let folderId = this.structСache.getStruct(parentFolder, user.username).current.id;

        const content = [];
        const stream = new streamWrite(content);

        stream.on('finish', () => {
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

    copy(pathFrom, pathTo, ctx, callback){

        const user = ctx.context.user;
        let {element, parentFolder} = parse.parsePath(pathFrom);
        pathTo = parse.parsePathTo(pathTo);

        if(this.structСache.getStruct(pathTo, user.username)){
            const folderId = this.structСache.getStruct(pathTo, user.username).current.id;
            this.structСache.getStruct(parentFolder, user.username).folders.forEach(async (el) => {
                if(element == el.title){
                    try {
                        await copyDirToFolder(folderId,el.id,user.token);
                        callback(null, true);
                    } catch (error) {
                        callback(error, null);
                    }
                    //#region old code
                    /*copyDirToFolder(folderId, el.id, user.token, (err) => {
                        if(err){
                            callback(err, null);
                        }
                        else{
                            callback(null, true);
                        }
                    });*/
                    //#endregion
                }
            });
            this.structСache.getStruct(parentFolder, user.username).files.forEach(async (el) => {
                if(element == el.title){
                    try {
                        await copyFileToFolder(folderId,el.id,user.token);
                        callback(null, true);
                    } catch (error) {
                        callback(error, null);
                    }
                    //#region old code
                    /*copyFileToFolder(folderId, el.id, user.token, (err) => {
                        if(err){
                            callback(err, null);
                        }
                        else{
                            callback(null, true);
                        }
                    });*/
                    //#endregion
                }
            });
        }
        else{
            this.readDir(pathTo, ctx, (err, st) => {
                if(err){
                    callback(err, null);
                }
                else{
                    this.copy(pathFrom, pathTo, ctx, callback);
                }
            });
        }
    }

    rename(path, newName, ctx, callback){

        const user = ctx.context.user;
        let {element, parentFolder} = parse.parsePath(path);

        this.structСache.getStruct(parentFolder, user.username).folders.forEach(async (el) => {
            if(element == el.title){
                try {
                    if(isCorrectName(newName)){
                        await renameFolder(el.id,newName,user.token);
                        this.structСache.renameFolderObject(element, newName, parentFolder, user.username);
                        callback(null, true);
                    }
                    else{
                        throw "incorrect folder name";
                    }
                } catch (error) {
                    callback(error, null);
                }
                //#region old code
                /*renameFolder(el.id, newName, user.token, (err) => {
                    if(err){
                        callback(err, null);
                    }
                    else{
                        this.structСache.renameFolderObject(element, newName, parentFolder, user.username);
                        callback(null, true);
                    }
                });*/
                //#endregion
            }
        });
        this.structСache.getStruct(parentFolder, user.username).files.forEach(async (el) => {
            if(element == el.title){
                try {
                    if(isCorrectName(newName)){
                        await renameFile(el.id,newName,user.token);
                        this.structСache.renameFileObject(element, newName, parentFolder, user.username);
                        callback(null, true);
                    }
                    else{
                        throw "incorrect file name";
                    }
                } catch (error) {
                    callback(err, null);
                }
                //#region old code
                /*renameFile(el.id, newName, user.token, (err) => {
                    if(err){
                        callback(err, null);
                    }
                    else{
                        this.structСache.renameFileObject(element, newName, parentFolder, user.username);
                        callback(null, true);
                    }
                });*/
                //#endregion
            }
        });
    }

    move(pathFrom, pathTo, ctx, callback){
        
        pathTo = parse.parsePathTo(pathTo);
        let {element: elementFrom, parentFolder: parentFolderFrom} = parse.parsePath(pathFrom);
        let {element: elementTo, parentFolder: parentFolderTo} = parse.parsePath(pathTo);
        const user = ctx.context.user;

        var isRename = false;
        if(parentFolderFrom == parentFolderTo){
            var isRename = this.structСache.checkRename(elementFrom, elementTo, parentFolderFrom, parentFolderTo, user);
        }

        if(isRename){
           this.rename(pathFrom, elementTo, ctx, (err, rename) => {
               if(err){
                   callback(err, rename);
               }
               else{
                callback(null, rename);
               }
           });
        }
        else{
            if(this.structСache.getStruct(pathTo, user.username)){
                const folderId = this.structСache.getStruct(pathTo, user.username).current.id;
                this.structСache.getStruct(parentFolderFrom, user.username).folders.forEach(async (el) => {
                    if(elementFrom == el.title){
                        try {
                            await moveDirToFolder(folderId,el.id,user.token);
                            this.structСache.dropFolderObject(parentFolderFrom, user.username, el);
                            callback(null, true);
                        } catch (error) {
                            callback(error, null);
                        }
                        //#region old code
                        /*moveDirToFolder(folderId, el.id, user.token, (err) => {
                            if(err){
                                callback(err, null);
                            }
                            else{
                                this.structСache.dropFolderObject(parentFolderFrom, user.username, el);
                                callback(null, true);
                            }
                        });*/
                        //#endregion
                    }
                });
                this.structСache.getStruct(parentFolderFrom, user.username).files.forEach(async (el) => {
                    if(elementFrom == el.title){
                        try {
                            await moveFileToFolder(folderId,el.id,user.token);
                            this.structСache.dropFileObject(parentFolderFrom, user.username, el);
                            callback(null, true);
                        } catch (error) {
                            callback(error, null);
                        }
                        //#region old code
                        /*moveFileToFolder(folderId, el.id, user.token, (err) => {
                            if(err){
                                callback(err, null);
                            }
                            else{
                                this.structСache.dropFileObject(parentFolderFrom, user.username, el);
                                callback(null, true);
                            }
                        });*/
                        //#endregion
                    }
                });
            }
            else{
                this.readDir(pathTo, ctx, (err, st) => {
                    if(err){
                        callback(err, null);
                    }
                    else{
                        this.move(pathFrom, pathTo, ctx, callback);
                    }
                });
            }
        }
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
                callback(parse.parseSize(el.contentLength));
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