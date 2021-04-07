const webdav = require('webdav-server').v2;
const {requestAuth, requestUser} = require('../server/requestAPI.js');
const customUserLayout = require('./customUserLayout.js');

class customUserManager extends webdav.SimpleUserManager
{
    constructor(){
        super();
        this.storeUser = new customUserLayout();
    }
    
    addUser(name, token, uid) {
        this.storeUser.setUser(name, token, uid);
        const user = this.storeUser.getUser(name);
        this.users[name] = user;
        return user;
    }

    async getUserByNamePassword(ctx, username, password, callback){
        try {
            if (!this.storeUser.getUser(username)){
                var token = await requestAuth(ctx, username, password);
                var uid = await requestUser(ctx, token);
                const user = this.addUser(username, token, uid);
                ctx.server.privilegeManager.setRights(user, '/', [ 'canRead' ]);
            }
            if(this.storeUser.getUser(username) && !this.storeUser.checkExpireUser(username)){
                var token = await requestAuth(ctx, username, password);
                this.storeUser.setUser(username, token, this.storeUser.getUser(username).uid);
            }
            callback(null, this.storeUser.getUser(username));
        } catch (error) {
            callback(webdav.Errors.UserNotFound);
        }
    }
}

module.exports = customUserManager;