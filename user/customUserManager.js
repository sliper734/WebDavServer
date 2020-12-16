const webdav = require('webdav-server').v2;
const {requestAuth} = require('../server/requestAPI.js');
const customUserLayout = require('./customUserLayout.js');

class customUserManager extends webdav.SimpleUserManager
{
    constructor(){
        super();
        this.storeUser = new customUserLayout();
    }

    async getUserByNamePassword(username, password, callback){

        if(this.storeUser.getUser(username) && this.storeUser.checkExpireUser(username)){
            callback(null, this.storeUser.getUser(username));
        }
        else{
            try {
                var token = await requestAuth(username,password);
                //не знаю как исправить этот костыль
                if(token===undefined){
                    throw webdav.Errors.UserNotFound;
                }
                else{
                    this.storeUser.setUser(username,password,token);
                    callback(null,this.storeUser.getUser(username));
                }
            } catch (error) {
                callback(webdav.Errors.UserNotFound);
            }
            //#region old code
            /*requestAuth(username, password, (err, token) => {
                if(err){
                    callback(webdav.Errors.UserNotFound)
                }
                else{
                    this.storeUser.setUser(username, password, token);
                    callback(null, this.storeUser.getUser(username))
                } 
            });*/
            //#endregion
        }
    }
}

module.exports = customUserManager;