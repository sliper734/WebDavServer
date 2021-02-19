const webdav = require('webdav-server').v2;
const request = require('request');
const VirtualResources = require('../resource/customVirtualResource');
const promise_1 = require('webdav-server/lib/helper/v2/promise');
const StandardMethods_1 = require('webdav-server/lib/manager/v2/fileSystem/StandardMethods');
const Errors_1 = require("webdav-server/lib/Errors");
const Path_1 = require("webdav-server/lib/manager/v2/Path");

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
        const sPath = path.toString();
        try {
            var exist = this.manageResource.fastExistCheck(sPath, ctx);
            if(exist){
                callback(exist);
                return;
            }

           (async() =>{
            try {
                await this.readDir({context: ctx}, parentFolder);
                struct = this.structСache.getStruct(parentFolder, user.username);
                if (this.findFile(struct, element) || this.findFolder(struct, element)){
                    callback(true);
                }
            } catch (error) {
                callback(false);
            }
           })(); 
        } catch (error) {
            var a=1;
        }
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

    issuePrivilegeCheck(fs, ctx, path, privilege, badCallback, goodCallback) {
        fs.checkPrivilege(ctx, path, privilege, function (e, can) {
            if (e)
                badCallback(e);
            else if (!can)
                badCallback(Errors_1.Errors.NotEnoughPrivilege);
            else
                goodCallback();
        });
    }

    move(ctx, _pathFrom, _pathTo, _overwrite, _callback) {
        var _this = this;
        var callbackFinal = _callback ? _callback : _overwrite;
        var overwrite = promise_1.ensureValue(_callback ? _overwrite : undefined, false);
        var pathFrom = new Path_1.Path(_pathFrom);
        var pathTo = new Path_1.Path(_pathTo);
        var path = pathTo;
        if (pathFrom.paths.length == pathTo.paths.length){
            let counter = 0;
            for(let i=0; i<pathFrom.paths.length; i++){
                if (pathFrom.paths[i]==pathTo.paths[i]){
                    counter++;
                }
            }
            if(counter == pathFrom.paths.length-1){
                path = pathFrom;
            }
        }
        var callback = function (e, overrided) {
            if (!e)
                _this.emit('move', ctx, pathFrom, { pathFrom: pathFrom, pathTo: pathTo, overwrite: overwrite, overrided: overrided });
            callbackFinal(e, overrided);
        };
        this.emit('before-move', ctx, pathFrom, { pathFrom: pathFrom, pathTo: pathTo, overwrite: overwrite });
        this.issuePrivilegeCheck(this, ctx, pathFrom, 'canRead', callback, function () {
            _this.issuePrivilegeCheck(_this, ctx, path, 'canWrite', callback, function () {
                _this.isLocked(ctx, pathFrom, function (e, isLocked) {
                    if (e || isLocked)
                        return callback(e ? e : Errors_1.Errors.Locked);
                    _this.isLocked(ctx, pathTo, function (e, isLocked) {
                        if (e || isLocked)
                            return callback(e ? e : Errors_1.Errors.Locked);
                        var go = function () {
                            if (_this._move) {
                                _this._move(pathFrom, pathTo, {
                                    context: ctx,
                                    overwrite: overwrite
                                }, callback);
                                return;
                            }
                            StandardMethods_1.StandardMethods.standardMove(ctx, pathFrom, _this, pathTo, _this, overwrite, callback);
                        };
                        _this.fastExistCheckEx(ctx, pathFrom, callback, function () {
                            if (!overwrite)
                                _this.fastExistCheckExReverse(ctx, pathTo, callback, go);
                            else
                                go();
                        });
                    });
                });
            });
        });
    };

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
        const size = this.manageResource.getSize(sPath, ctx);
        callback(null, size);
    }

    _openWriteStream(path, ctx, callback){
        const sPath = path.toString();
        try {
            const streamWrite = this.manageResource.writeFile(sPath, ctx);
            callback(null, streamWrite);
        } catch (error) {
            callback(error, null);
        }
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
        const type = this.manageResource.getType(sPath, ctx);
        callback(null, type);
    }

    _lastModifiedDate(path, ctx, callback){
        const sPath = path.toString();
        const date = this.manageResource.getlastModifiedDate(sPath, ctx);
        callback(null, date);
    }

    addPrivilege(sPath, title, access, user, ctx)
    {
        if(sPath == '/'){
            ctx.context.server.privilegeManager.setRights(user, sPath + '/' + title, ['all']);
            return;
        }
        if(sPath != "/"){
            if (access == 0){
                ctx.context.server.privilegeManager.setRights(user, sPath + '/' + title, ['all']);
                return;
            }
            if(access == 1){
                ctx.context.server.privilegeManager.setRights(user, sPath + '/' + title, ['all']);
                return;
            }
            if (access == 2){
                ctx.context.server.privilegeManager.setRights(user, sPath + '/' + title, ['canRead']);
                return;
            }
        }

    }

    _readDir(path, ctx, callback){
        (async () => {
            const sPath = path.toString();
            let elemOfDir = [];

            try {
                var customReadDirectory = await this.manageResource.readDir(ctx, sPath);
                customReadDirectory.folders.forEach(el => {
                    this.addPrivilege(sPath, el.title, el.access, ctx.context.user, ctx);
                    elemOfDir.push(el.title);
                });
                customReadDirectory.files.forEach(el => {
                    this.addPrivilege(sPath, el.title, el.access, ctx.context.user, ctx);
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