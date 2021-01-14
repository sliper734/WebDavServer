const webdav = require('webdav-server').v2;
const customUserManager = require('../customUserManager');

class customHTTPBasicAuthentication extends webdav.HTTPBasicAuthentication
{

    getUser (ctx, callback) {
        var _this = this;
        var onError = function (error) {
            _this.userManager.getDefaultUser(function (defaultUser) {
                callback(error, defaultUser);
            });
        };
        var authHeader = ctx.headers.find('Authorization');
        if (!authHeader) {
            onError(webdav.Errors.MissingAuthorisationHeader);
            return;
        }
        if (!/^Basic \s*[a-zA-Z0-9]+=*\s*$/.test(authHeader)) {
            onError(webdav.Errors.WrongHeaderFormat);
            return;
        }
        var value = Buffer.from(/^Basic \s*([a-zA-Z0-9]+=*)\s*$/.exec(authHeader)[1], 'base64').toString().split(':', 2);
        var username = value[0];
        var password = value[1];
        this.userManager.getUserByNamePassword(ctx, username, password, function (e, user) {
            if (e)
                onError(webdav.Errors.BadAuthentication);
            else
                callback(null, user);
        });
    }
}

module.exports = customHTTPBasicAuthentication;