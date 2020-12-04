const webdav = require('webdav-server').v2;
const {requestAuth} = require('../requestAPI/requestAPI.js');
const customUserLayout = require('./customUserLayout.js');

class customUserManager extends webdav.SimpleUserManager
{
    constructor(){
        super();
        this.storeUser = new customUserLayout();
    }

    getUserByNamePassword(username, password, callback){

        if(this.storeUser.getUser(username) && this.storeUser.checkExpireUser(username)){
            callback(null, this.storeUser.getUser(username));
        }
        else{
            (async () =>{
                try {
                    var token=await requestAuth(username,password);
                    this.storeUser.setUser(username,password,token);
                    callback(null,this.storeUser.getUser(username));
                } catch (error) {
                    callback(webdav.Errors.UserNotFound);
                }
            })();
        }
    }
}

module.exports = customUserManager;