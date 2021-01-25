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

    async getRootFolder(ctx, user){
        let structRoot = {
            files: [],
            folders: [],
            current: {}
        };
        try {
            var structDir= await getStructDirectory(ctx, method.pathRootDirectory,user.token);
            for(var i=0;i<structDir.length;i++)
            {
                structRoot.folders.push(structDir[i].current);
            }
            return structRoot;
        } catch (error) {
            return webdav.Errors.ResourceNotFound;
        }
    }

    async fastExistCheck(path, ctx){
        if(path == '/'){
            return true;
        }
        const user = ctx.user;
        const {element, parentFolder} = parse.parsePath(path);
        let fileisExist = false;
        if(this.structСache.getStruct(parentFolder, user.username)){
            const folders = this.structСache.getStruct(parentFolder, user.username).folders;
            for(var i=0;i<folders.length;i++)
            {
                const el=folders[i];
                if(element == el.title){
                    fileisExist = true;
                }
            }
            const files = this.structСache.getStruct(parentFolder, user.username).files;
            for(var i=0;i<files.length;i++)
            {
                const el=files[i];
                if(element == el.title){
                    fileisExist = true;
                }
            }
            return fileisExist;
        }
        try {
            var st = await this.readDir({context: ctx}, parentFolder);
            fileisExist = false;
            const folders = this.structСache.getStruct(parentFolder, user.username).folders;
            for(var i=0;i<folders.length;i++)
            {
                const el=folders[i];
                if(element == el.title){
                    fileisExist = true;
                }
            }
            const files = this.structСache.getStruct(parentFolder, user.username).files;
            for(var i=0;i<files.length;i++)
            {
                const el=files[i];
                if(element == el.title){
                    fileisExist = true;
                }
            }
            return fileisExist;
        } catch (error) {
            return false;
        }
    }

    async create(ctx, path){

        const user = ctx.context.user;
        let {element, parentFolder} = await parse.parsePath(path);
        let parentId = this.structСache.getStruct(parentFolder, user.username).current.id;
            
        if(ctx.type.isDirectory){
            var createdObj1 = await createFolder(ctx, parentId, element, user.token);
            this.structСache.setFolderObject(parentFolder, user.username, createdObj1);
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

        const folders = this.structСache.getStruct(parentFolder, user.username).folders;
        for(var i=0;i<folders.length;i++)
        {
            const el=folders[i];
            if(element == el.title){
                try {
                    await deleteFolder(ctx, el.id, user.token);
                    this.structСache.dropFolderObject(parentFolder, user.username, el);
                    this.structСache.dropPath(path, user.username);
                } catch (error) {
                    return new Error(error);
                }
            }
        }
        const files = this.structСache.getStruct(parentFolder, user.username).files;
        for(var i=0;i<files.length;i++)
        {
            const el=files[i];
            if(element == el.title){
                try {
                    await deleteFile(ctx, el.id, user.token);
                    this.structСache.dropFileObject(parentFolder, user.username, el);
                } catch (error) {
                    return new Error(error);
                }
            }
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
                        const folders = this.structСache.getStruct(parentFolder, user.username).folders;
                        for(var i = 0;i<folders.length;i++)
                        {
                            const el = folders[i];
                            if(element == el.title){
                                let folderId = el.id;
                                try {
                                    var structDirectory = getStructDirectory(ctx, folderId,user.token);
                                    this.structСache.setStruct(path, user.username, structDirectory);
                                    return this.structСache.getStruct(path, user.username);
                                } catch (error) {
                                    return new Error(webdav.Errors.ResourceNotFound);
                                }
                            }
                        }
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
                    }
                        try {
                            var structDirectory = await getStructDirectory(ctx, folderId, user.token);
                            this.structСache.setStruct(path, user.username, structDirectory);
                            return this.structСache.getStruct(path, user.username);
                        } catch (error) {
                            return new Error(webdav.Errors.ResourceNotFound);
                        }
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
        const folders = this.structСache.getStruct(parentFolder, user.username).folders;
        for(var i=0;i<folders.length;i++)
        {
            const el=folders[i];
            if(element == el.title){
                let folderId = el.id;
                try {
                    var structDirectory = await this.getStructDirectory(ctx, folderId,user.token);
                    this.structСache.setStruct(path, user.username, structDirectory);
                } catch (error) {
                    return new Error(webdav.Errors.ResourceNotFound);
                }
            }
        }
    }

    async downloadFile(ctx, path){

        const user = ctx.context.user;
        const {element, parentFolder} = parse.parsePath(path);

        const files = this.structСache.getStruct(parentFolder, user.username).files;
        for(var i=0;i<files.length;i++)
        {
            const el=files[i];
            if(element == el.title){
                try {
                    var streamFile = await getFileDownloadUrl(ctx, el.id, user.token);
                    return streamFile;
                } catch (error) {
                    return new Error(error);
                }
            }
        }
    }

    async writeFile(path, ctx){

        const user = ctx.context.user;
        const {element, parentFolder} = parse.parsePath(path);
        let folderId = this.structСache.getStruct(parentFolder, user.username).current.id;

        const content = [];
        const stream = new streamWrite(content);

        await stream.on('finish', (async() => {
            const files = this.structСache.getStruct(parentFolder, user.username).files;
            for(var i=0;i<files.length;i++)
            {
                const el=files[i];
                if(element == el.title){
                    try {
                        const form_data = new FormData();
                        form_data.append("file", stream, {filename: el.title, contentType:"text/plain"});
                        form_data.append("title", el.title);
                        form_data.append("CreateNewIfExist", 'false');
                        form_data.append("KeepConvertStatus", 'false');
                        await rewritingFile(ctx, folderId, el.title, form_data, user.token);
                    } catch (error) {
                        return new Error(error);
                    }
                }
            }
        });
        return stream;
    }

    async copy(ctx, pathFrom, pathTo){

        const user = ctx.context.user;
        let {element, parentFolder} = parse.parsePath(pathFrom);
        pathTo = parse.parsePathTo(pathTo);

        if(!this.structСache.getStruct(pathTo, user.username)){
            try {
                this.readDir(ctx, pathTo);
                this.copy(ctx, pathFrom, pathTo);
            } catch (error) {
                return new Error(err);
            }
        }
        const folderId = this.structСache.getStruct(pathTo, user.username).current.id;
        const folders = this.structСache.getStruct(parentFolder, user.username).folders;
        for(var i=0;i<folders.length;i++)
        {
            const el=folders[i];
            if(element == el.title){
                try {
                    await copyFolder(ctx, folderId, el.id, user.token);
                    return true;
                } catch (error) {
                    return new Error(error);
                }
            }
        }
        const files = this.structСache.getStruct(parentFolder, user.username).files;
        for(var i=0;i<files.length;i++)
        {
            const el=files[i];
            if(element == el.title){
                try {
                    await copyFile(ctx, folderId, el.id, user.token);
                    return true;
                } catch (error) {
                    return new Error(error);
                }
            }
        }
    }

    async rename(ctx, path, newName){

        const user = ctx.context.user;
        let {element, parentFolder} = parse.parsePath(path);

        const folders = this.structСache.getStruct(parentFolder, user.username).folders;
        for(var i=0;i<folders.length;i++)
        {
            const el=folders[i];
            if(element == el.title){
                try {
                    await renameFolder(ctx, el.id, newName, user.token);
                    this.structСache.renameFolderObject(element, newName, parentFolder, user.username);
                    return true;
                } catch (error) {
                    return new Error(error);
                }
            }
        }
        const files = this.structСache.getStruct(parentFolder, user.username).files;
        for(var i=0;i<files.length;i++)
        {
            const el=files[i];
            if(element == el.title){
                try {
                    await renameFile(ctx, el.id, newName, user.token);
                    this.structСache.renameFileObject(element, newName, parentFolder, user.username);
                    return true;
                } catch (error) {
                    return new Error(error);
                }
            }
        }
    }

    async move(ctx, pathFrom, pathTo){
        
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
                const rename = this.rename(ctx, pathFrom, elementTo);
                return rename;
            } catch (error) {
                return new Error(error);
            }
        }
        if(!this.structСache.getStruct(pathTo, user.username)){
            try {
                const prpr = await this.readDir(ctx, pathTo);
                this.move(ctx, pathFrom, pathTo);
            } catch (error) {
                return new Error(error);
            }
        }
        const folderId = this.structСache.getStruct(pathTo, user.username).current.id;
        
        const folders = this.structСache.getStruct(parentFolderFrom, user.username).folders;
        for(var i=0;i<folders.length;i++)
        {
            const el=folders[i];
            if(elementFrom == el.title){
                try {
                    moveFolder(ctx, folderId, el.id, user.token);
                    this.structСache.dropFolderObject(parentFolderFrom, user.username, el);
                    return true;
                } catch (error) {
                    return new Error(error);
                }
            }
        }

        const files = this.structСache.getStruct(parentFolderFrom, user.username).files;
        for(var i=0;i<files.length;i++)
        {
            const el=files[i];
            if(elementFrom == el.title){
                try {
                    moveFile(ctx,folderId, el.id, user.token);
                    this.structСache.dropFileObject(parentFolderFrom, user.username, el);
                    return true;
                } catch (error) {
                    return new Error(error);
                }
            }
        }
    }

    getType(path, ctx){

        const user = ctx.context.user;

        if(path == '/'){
            return webdav.ResourceType.Directory;
        }
        const {element, parentFolder} = parse.parsePath(path);
        
        const folders = this.structСache.getStruct(parentFolder, user.username).folders;
        for(var i=0;i<folders.length;i++)
        {
            const el=folders[i];
            if(element == el.title){
                return webdav.ResourceType.Directory;
            }
        }

        const files = this.structСache.getStruct(parentFolder, user.username).files;
        for(var i=0;i<files.length;i++)
        {
            const el=files[i];
            if(element == el.title){
                return webdav.ResourceType.File;
            }
        }
    }

    getSize(path, ctx){

        const {element, parentFolder} = parse.parsePath(path);
        const user = ctx.context.user;

        const folders = this.structСache.getStruct(parentFolder, user.username).folders;
        for(var i=0;i<folders.length;i++)
        {
            const el=folders[i];
            if(element == el.title){
                return null;
            }
        }

        const files = this.structСache.getStruct(parentFolder, user.username).files;
        for(var i=0;i<files.length;i++)
        {
            const el=files[i];
            if(element == el.title){
                return el.pureContentLength;
            }
        }
    }

    getlastModifiedDate(path, ctx){

        if(path == '/')
        {
            return new Date(0, 0, 0, 0, 0, 0);
        }
        const {element, parentFolder} = parse.parsePath(path);
        const user = ctx.context.user;

        const folders = this.structСache.getStruct(parentFolder, user.username).folders;
        for(var i=0;i<folders.length;i++)
        {
            const el=folders[i];
            if(element == el.title){
                return parse.parseDate(el.updated);
            }
        }

        const files = this.structСache.getStruct(parentFolder, user.username).files;
        for(var i=0;i<files.length;i++)
        {
            const el=files[i];
            if(element == el.title){
                return parse.parseDate(el.updated);
            }
        }
    }
}

module.exports = CustomVirtualResources;