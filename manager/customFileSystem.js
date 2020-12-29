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
                var exist = await this.manageResource.fastExistCheck(sPath, ctx);
                callback(exist);
            } catch (error) {
                var a=1;
            }
          })();


        /*this.manageResource.fastExistCheck(sPath, ctx, (exist) => {
            callback(exist);
        });*/
    }

    async _create(path, ctx, callback){
        const sPath = path.toString();
//#region old code
        /*this.manageResource.create(sPath, ctx, (err) => {
            if(err){
                callback(err);
            }
            callback();
        });*/
        //#endregion
        try {
            await this.manageResource.create(sPath, ctx);
            callback();
        } catch (error) {
            callback(error);
        }
    }

    async _delete(path, ctx, callback){
        const sPath = path.toString();
        //#region old code
        /*this.manageResource.delete(sPath, ctx, (err) => {
            if(err){
                callback(err);
            }
            callback();
        });*/
        //#endregion
        try {
            await this.manageResource.delete(sPath, ctx);
            callback();
        } catch (error) {
            callback(error);
        }
    }

    _move(pathFrom, pathTo, ctx, callback){
        if(pathFrom.paths[pathFrom.paths.length - 1] == pathTo.paths[pathTo.paths.length - 1]){
            delete pathTo.paths[pathTo.paths.length - 1];
        }
        const sPathFrom = pathFrom.toString();
        const sPathTo = pathTo.toString();
        var isMove = false;
        try {
            isMove = this.manageResource.move(sPathFrom, sPathTo, ctx);
            callback(null, isMove);
        } catch (error) {
            callback(error, isMove);
        }
        /*this.manageResource.move(sPathFrom, sPathTo, ctx, (err, isMove) => {
            if(err){
                callback(err, isMove);
            }
            else{
                callback(null, isMove);
            }
        });*/
    }

    async _copy(pathFrom, pathTo, ctx, callback){
        if(pathFrom.paths[pathFrom.paths.length - 1] == pathTo.paths[pathTo.paths.length - 1]){
            delete pathTo.paths[pathTo.paths.length - 1];
        }
        const sPathFrom = pathFrom.toString();
        const sPathTo = pathTo.toString();

        try {
            const isCopy = await this.manageResource.copy(sPathFrom, sPathTo, ctx);
            callback (null, isCopy);
        } catch (error) {
            callback(error, isCopy);
        }
    }

    _size(path, ctx, callback){
        const sPath = path.toString();

        this.manageResource.getSize(sPath, ctx, (size) => {
            callback(null, size);
        });
    }

    _openWriteStream(path, ctx, callback){
        const sPath = path.toString();

        this.manageResource.writeFile(sPath, ctx, (err, streamWrite) => {
            if(err){
                callback(err, null);
            }
            else{
                callback(null, streamWrite);
            }
        });

    }

    _openReadStream(path, ctx, callback){
        const sPath = path.toString();

        this.manageResource.downloadFile(sPath, ctx, (err, streamRead) => {
            if(err){
                callback(err, null);
            }
            else{
                callback(null, streamRead);
            }
        });
        /*try {
            streamRead = await this.manageResource.downloadFile(sPath, ctx);
            callback(null, streamRead);
        } catch (error) {
            callback(error, null);
        }*/
    }

    _type(path, ctx, callback) {
        const sPath = path.toString();

        this.manageResource.getType(sPath, ctx, (type) => {
                callback(null, type);
        });
    }

    _lastModifiedDate(path, ctx, callback){
        const sPath = path.toString();

        this.manageResource.getlastModifiedDate(sPath, ctx, (date) => {
            callback(null, date);
        });
    }

    _readDir(path, ctx, callback){

    (async () => {
            const sPath = path.toString();
            let elemOfDir = [];

            try {
                var customReadDirectory = await this.manageResource.readDir(sPath, ctx);
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


        

        /*this.manageResource.readDir(sPath, ctx, (err, struct) => {
            if(err){
                callback(err);
            }
            else{
                struct.folders.forEach(el => {
                    elemOfDir.push(el.title);
                });
                struct.files.forEach(el => {
                    elemOfDir.push(el.title);
                });
                callback(null, elemOfDir);
            }
        });*/
    }
}

module.exports = customFileSystem;