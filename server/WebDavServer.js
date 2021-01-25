const webdav = require('webdav-server').v2;
const FileSystem = require('../manager/customFileSystem');
const customUserManager = require('../user/customUserManager');
const customHTTPBasicAuthentication = require('../user/authentication/customHTTPBasicAuthentication');
const fs = require('fs');
const {
    portListener,
    cleanTrashInterval} = require('./config.js');
const logger = require('../helper/logger.js');

const userManager = new customUserManager();
const user = userManager.addUser('medvedev.sergey@onlyoffice.com', 'sliper98', true);

const privilegeManager = new webdav.SimplePathPrivilegeManager();
privilegeManager.setRights(user, '/Мои документы/Новая папка', [ 'canWrite' ]);

const server = new webdav.WebDAVServer({
    port: portListener,
    requireAuthentification: true,
    httpAuthentication: new customHTTPBasicAuthentication(userManager),
    rootFileSystem: new FileSystem(),
    https: {
        pfx: fs.readFileSync('C:\\test.pfx'),
        passphrase: 'YourPassword'
    },
    //privilegeManager:privilegeManager
});

setInterval(function(){userManager.storeUser.cleanTrashUsers(function(users){
    server.fileSystems['/'].manageResource.structСache.cleanTrash(users);
})}, cleanTrashInterval);

server.afterRequest((arg, next) => {
    logger.log('info', `>> ${arg.user.username} ${arg.request.method} ${arg.fullUri()} > ${arg.response.statusCode} ${arg.response.statusMessage}`);
    next();
});

server.start((s) => console.log('Ready on port', s.address().port));