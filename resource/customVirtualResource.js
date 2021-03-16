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
        let struct = this.structСache.getStruct(parentFolder, user.username);
        if(struct){
            if (this.findFile(struct, element) || this.findFolder(struct, element)){
                return true;
            }
            return false;
        }
    }

    async create(ctx, path){

        const user = ctx.context.user;
        let {element, parentFolder} = await parse.parsePath(path);
        var parentId = this.structСache.getStruct(parentFolder, user.username).current.id;
        
            
        if(ctx.type.isDirectory){
            var createdObj1 = await createFolder(ctx, parentId, element, user.token);
            this.structСache.setFolderObject(parentFolder, user.username, createdObj1);
            this.readDir(ctx, path);
        }
        if(ctx.type.isFile){
            element = parse.isExst(element);
            switch(parse.parseFileExst(element)){
                case 'OFFICE_DOCX_PPTX_XLSX':
                    var createdObj = await createFile(ctx, parentId, element, user.token);
                    this.structСache.setFileObject(parentFolder, user.username, createdObj);
                    break;
                case 'txt':
                    var createdObj = await createFiletxt(ctx, parentId, element, user.token);
                    this.structСache.setFileObject(parentFolder, user.username, createdObj);
                    break;
                case 'html':
                    var createdObj = await createFilehtml(ctx, parentId, element, user.token);
                    this.structСache.setFileObject(parentFolder, user.username, createdObj);
                    break;
            }
        }
    }

    async delete(ctx, path){
        const user = ctx.context.user;
        const {element, parentFolder} = parse.parsePath(path);
        const struct = this.structСache.getStruct(parentFolder, user.username);
        try {
            const folder = this.findFolder(struct, element);
            if (folder){
                await deleteFolder(ctx, folder.id, user.token);
                this.structСache.dropFileObject(parentFolder, user.username, folder);
                this.structСache.dropPath(path, user.username);
            }
            const file = this.findFile(struct, element);
            if (file){
                await deleteFile(ctx, file.id, user.token);
                this.structСache.dropFileObject(parentFolder, user.username, file);
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
                this.structСache.setStruct(path,user.username,rootFolder);
                return this.structСache.getStruct(path,user.username);
            } catch (error) {
                return new Error(webdav.Errors.ResourceNotFound);
            }
        }
        const {element, parentFolder} = parse.parsePath(path);

        try{
            if(!this.structСache.getStruct(parentFolder, user.username)){
                try {
                    await this.readDirRecursion(ctx, parentFolder);
                    if(!this.structСache.getStruct(parentFolder, user.username)){
                        await this.readDir(ctx, path);
                    }
                    else{
                        const folder = this.findFolder(this.structСache.getStruct(parentFolder,username), element);
                        if (folder){
                            try {
                                const structDirectory = getStructDirectory(ctx, folder.id, user.token);
                                this.structСache.setStruct(path, user.username, structDirectory);
                                return this.structСache.getStruct(path, user.username);
                            } catch (error) {
                                return new Error(webdav.Errors.ResourceNotFound);
                            }
                        }
                    }
                } catch (error) {
                    return error;
                }
            }

            const folder = this.findFolder(this.structСache.getStruct(parentFolder, user.username), element);
            if (folder){
                if (this.structСache.structIsExpire(path, parentFolder, user.username)){
                    return this.structСache.getStruct(path, user.username);
                }
                try {
                    var structDirectory = await getStructDirectory(ctx, folder.id, user.token);
                    this.structСache.setStruct(path, user.username, structDirectory);
                    return this.structСache.getStruct(path, user.username);
                } catch (error) {
                    return new Error(webdav.Errors.ResourceNotFound);
                }
            }
        }
        catch(error1){
            var rootFolder = await this.getRootFolder(ctx, user);
            try {
                this.structСache.setStruct('/', user.username, rootFolder);
                await this.readDir(ctx, path);
            } catch (error) {
                return new Error(error);
            }
        }
    }

    async readDirRecursion(ctx, path){

        const user = ctx.context.user;
        const {element, parentFolder} = parse.parsePath(path);

        if(!this.structСache.getStruct(parentFolder, user.username) && path != parentFolder){
            return await this.readDirRecursion(ctx, parentFolder);
        }
        await this.readDir(ctx, parentFolder);
        const folder = this.structСache.getStruct(parentFolder, user.username);
        if (folder){
            try {
                var structDirectory = await this.getStructDirectory(ctx, folder.id, user.token);
                this.structСache.setStruct(path, user.username, structDirectory);
            } catch (error) {
                return new Error(webdav.Errors.ResourceNotFound);
            }
        }
    }

    async downloadFile(ctx, path){

        const user = ctx.context.user;
        const {element, parentFolder} = parse.parsePath(path);
        const file = this.findFile(this.structСache.getStruct(parentFolder, user.username),element);
        if (file){
            try {
                var streamFile = await getFileDownloadUrl(ctx, file.id, user.token);
                return streamFile;
            } catch (error) {
                return new Error(error);
            }
        }
    }

    writeFile(path, ctx){
        const MinDocx = 6998;
        const MinPptx = 33511;
        const MinXlsx = 6437;
        const fileSize = this.getSize(path, ctx);
        const user = ctx.context.user;
        const {element, parentFolder} = parse.parsePath(path);
        const content = [];
        const stream = new streamWrite(content);
        if(ctx.mode !== "mustCreate"){
            stream.on('finish', (async() => {
                const struct = this.structСache.getStruct(parentFolder, user.username);
                if(!stream.contents.length) return;
                const file = this.findFile(struct, element);
                if (file){
                    try {
                        const form_data = new FormData();
                        form_data.append("FileExtension", file.fileExst);
                        form_data.append("DownloadUri", "");
                        form_data.append("Stream", stream, {filename: file.realTitle, contentType:"text/plain"});
                        form_data.append("Doc", "");
                        form_data.append("Forcesave", 'false');
                        await rewritingFile(ctx, file.id, form_data, user.token);
                    } catch (error) {
                        return new Error(error);
                    }
                }
            }));
        }
        return stream;
    }

    async copy(ctx, pathFrom, pathTo){
        const user = ctx.context.user;
        let {element, parentFolder} = parse.parsePath(pathFrom);
        pathTo = parse.parsePathTo(pathTo);
        const structTo = this.structСache.getStruct(pathTo, user.username);
        if(!structTo){
            try {
                this.readDir(ctx, pathTo);
                this.copy(ctx, pathFrom, pathTo);
            } catch (error) {
                return new Error(error);
            }
        }
        const folderId = structTo.current.id;
        const structFrom = this.structСache.getStruct(parentFolder, user.username);
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
        const struct = this.structСache.getStruct(parentFolder, user.username);
        const folder = this.findFolder(struct, element);
        if (folder){
            try {
                await renameFolder(ctx, folder.id, newName, user.token);
                this.structСache.renameFolderObject(element, newName, parentFolder, user.username);
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
                this.structСache.renameFileObject(element, newName, parentFolder, user.username);
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
        if(!this.structСache.getStruct(pathTo, user.username)){
            try {
                await this.readDir(ctx, pathTo);
                this.move(ctx, pathFrom, pathTo);
            } catch (error) {
                return new Error(error);
            }
        }
        const folderId = this.structСache.getStruct(pathTo, user.username).current.id;
        const structFrom = this.structСache.getStruct(parentFolderFrom, user.username);
        const folder = this.findFolder(structFrom, elementFrom);
        if (folder){
            try {
                moveFolder(ctx, folderId, folder.id, user.token);
                this.structСache.dropFolderObject(parentFolderFrom, user.username, folder);
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
                this.structСache.dropFileObject(parentFolderFrom, user.username, file);
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
        const struct = this.structСache.getStruct(parentFolder, user.username);
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
        const struct = this.structСache.getStruct(parentFolder, user.username);
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
        const struct = this.structСache.getStruct(parentFolder, user.username);
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