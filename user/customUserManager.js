const webdav = require('webdav-server').v2;
const {requestAuth} = require('../server/requestAPI.js');
const customUserLayout = require('./customUserLayout.js');

class customUserManager extends webdav.SimpleUserManager
{
    constructor(){
        super();
        this.storeUser = new customUserLayout();
    }
    
    addUser(name, password, isAdmin) {
        this.storeUser.setUser(name, new customUserLayout('', isAdmin, false, name, password, null, new Date));
        const user = this.storeUser.getUser(name);
        this.users[name] = user;
        return user;
    }

    async getUserByNamePassword(ctx, username, password, callback){

        if(this.storeUser.getUser(username) && this.storeUser.checkExpireUser(username)){
            var token = await requestAuth(ctx, username, password);
            const user = this.storeUser.getUser(username);
            user['token'] = token;
            callback(null, this.storeUser.getUser(username));
        }
        else{
            try {
                var token = await requestAuth(ctx, username, password);
                if(token===undefined){
                    throw webdav.Errors.UserNotFound;
                }
                else{
                    const user = this.addUser(username, password, false);
                    ctx.server.privilegeManager.setRights(user, '/', [ 'canRead' ]);
                    callback(null,this.storeUser.getUser(username));
                }
            } catch (error) {
                callback(webdav.Errors.UserNotFound);
            }
        }
    }
}

module.exports = customUserManager;