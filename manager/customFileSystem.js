const webdav = require('webdav-server').v2;
const request = require('request');
const VirtualResources = require('../resource/customVirtualResource');


class customFileSystem extends webdav.FileSystem
{
    constructor(){
        super();
        this.props = new webdav.LocalPropertyManager();
        this.locks = new webdav.LocalLockManager();
        this.manageResource = new VirtualResources();
    }

    _lockManager(path, ctx, callback){
        callback(null, this.locks);
    }

    _propertyManager(path, ctx, callback){
        callback(null, this.props);
    }

    _fastExistCheck(ctx, path, callback){
        (async () => {
            const sPath = path.toString();
            try {
                //опережает сохранение на сервер
                var exist = await this.manageResource.fastExistCheck(sPath, ctx);
                callback(exist);
            } catch (error) {
                var a=1;
            }
        })();
    }

    _create(path, ctx, callback){
        (async () => {
            const sPath = path.toString();
            try {
                await this.manageResource.create(ctx, sPath);
                callback();
            } catch (error) {
                callback(new Error('text error'));
            }
        })();
    }

    _delete(path, ctx, callback){
        (async () => {
            const sPath = path.toString();
            try {
                await this.manageResource.delete(ctx, sPath);
                callback();
            } catch (error) {
                callback(error);
            }
        })();
    }

    _move(pathFrom, pathTo, ctx, callback){
        (async () => {
            if(pathFrom.paths[pathFrom.paths.length - 1] == pathTo.paths[pathTo.paths.length - 1]){
                delete pathTo.paths[pathTo.paths.length - 1];
            }
            const sPathFrom = pathFrom.toString();
            const sPathTo = pathTo.toString();
            var isMove = false;
            try {
                isMove = await this.manageResource.move(ctx, sPathFrom, sPathTo);
                callback(null, isMove);
            } catch (error) {
                callback(error, isMove);
            }
        })();
    }

    _copy(pathFrom, pathTo, ctx, callback){
        (async () => {
            if(pathFrom.paths[pathFrom.paths.length - 1] == pathTo.paths[pathTo.paths.length - 1]){
                delete pathTo.paths[pathTo.paths.length - 1];
            }
            const sPathFrom = pathFrom.toString();
            const sPathTo = pathTo.toString();
            try {
                const isCopy = await this.manageResource.copy(ctx, sPathFrom, sPathTo);
                callback (null, isCopy);
            } catch (error) {
                callback(error, isCopy);
            }
        })();
    }

    _size(path, ctx, callback){
        const sPath = path.toString();
        (async () => {
            const size = await this.manageResource.getSize(sPath, ctx);
            callback(null, size);
        })();
    }

    _openWriteStream(path, ctx, callback){
        const sPath = path.toString();
        (async () => {
            try {
                const streamWrite = await this.manageResource.writeFile(sPath, ctx);
                callback(null, streamWrite);
            } catch (error) {
                callback(error, null);
            }
        })();
    }

    _openReadStream(path, ctx, callback){
        const sPath = path.toString();
        (async () => {
            try {
                const streamRead = await this.manageResource.downloadFile(ctx, sPath);
                callback(null, streamRead);
            } catch (error) {
                callback(error, null);
            }
        })();
    }

    _type(path, ctx, callback) {
        const sPath = path.toString();
        (async () => {
            const type = await this.manageResource.getType(sPath, ctx);
            callback(null, type);
        })();
    }

    _lastModifiedDate(path, ctx, callback){
        const sPath = path.toString();

        (async () => {
            const date = await this.manageResource.getlastModifiedDate(sPath, ctx);
            callback(null, date);
        })();
    }

    _readDir(path, ctx, callback){
        (async () => {
            const sPath = path.toString();
            let elemOfDir = [];

            try {
                var customReadDirectory = await this.manageResource.readDir(ctx, sPath);
                customReadDirectory.folders.forEach(el => {
                    elemOfDir.push(el.title);
                });
                customReadDirectory.files.forEach(el => {
                    elemOfDir.push(el.title);
                });
                callback(null, elemOfDir);
            } catch (error) {
                callback(error);
            }
        })();
    }
}

module.exports = customFileSystem;