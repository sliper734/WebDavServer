var request = require('request');
var axios = require('axios');
const {getHeader, exceptionResponse} = require('../helper/helper.js');
const {
    onlyOfficePort,
    api,
    apiFiles,
    apiAuth,
    method,
    isHttps
} = require('./config.js');


function instanceFunc(ctx, token=null, header='application/json', content)
{
    var domain = null;
    if (isHttps){
        const hostStr = ctx.headers.host;
        var httProtocol = "http://";
        domain = httProtocol + hostStr.split(":")[0] + onlyOfficePort;
    }
    
    return axios.create({
        baseURL: `${domain}${api}`,
        timeout: 1000,
        headers: getHeader(header,token),
        data:content
    });
}

var requestAuth = async function(ctx, username, password)
{

    try {
        const instance = instanceFunc(ctx);
        var response = await instance.post(`${apiAuth}`,{
            "userName": username,
            "password": password
        });
        return response.data.response.token;
    } catch (error) {
        exceptionResponse(error);
    }
};

var getStructDirectory = async function(ctx, folderId, token)
{
    try {
        const instance = instanceFunc(ctx.context, token);
        var response = await instance.get(`${apiFiles}${folderId}`);
        return response.data.response;
    } catch (error) {
        exceptionResponse(error);
    }
};

var createFile = async function(ctx, folderId, title, token)
{
    try {
        const instance = instanceFunc(ctx.context, token);
        var response = await instance.post(`${apiFiles}${folderId}/${method.file}`,{
            "title": title
        }); 
        return response.data.response;
    } catch (error) {
        exceptionResponse(error);
    }
};

var createFolder = async function(ctx, parentId, title, token)
{
    try {
        const instance = instanceFunc(ctx.context, token);
        var response = await instance.post(`${apiFiles}${method.folder}${parentId}`,{
            "title": title
        }); 
        return response.data.response;
    } catch (error) {
        exceptionResponse(error);
    }
};

var deleteFile = async function(ctx, fileId, token)
{
    try {
        const instance = instanceFunc(ctx.context, token);
        var response = await instance.delete(`${apiFiles}${method.file}${fileId}`,{
            "deleteAfter": true,
            "immediately": true
        }); 
    } catch (error) {
        exceptionResponse(error);
    }
};

var deleteFolder = async function(ctx, folderId, token)
{
    try {
        const instance = instanceFunc(ctx.context, token);
        var response = await instance.delete(`${apiFiles}${method.folder}${folderId}`,{
            "deleteAfter": true,
            "immediately": true
        }); 
    } catch (error) {
        exceptionResponse(error);
    }
};

var copyFile = async function(ctx, folderId, files, token)
{
    try {
        const instance = instanceFunc(ctx.context, token);
        var response = await instance.put(`${apiFiles}${method.copy}`,{
            "destFolderId": folderId,
            "folderIds": [],
            "fileIds": [files],
            "conflictResolveType": "Skip",
            "deleteAfter": true
        });
    } catch (error) {
        exceptionResponse(error);
    }
};

var copyFolder = async function(ctx, folderId, folders, token)
{
    try {
        const instance = instanceFunc(ctx.context, token);
        var response = await instance.put(`${apiFiles}${method.copy}`,{
            "destFolderId": folderId,
            "folderIds": [folders],
            "fileIds": [],
            "conflictResolveType": "Skip",
            "deleteAfter": true
        });
    } catch (error) {
        exceptionResponse(error);
    }
};

var moveFile = async function(ctx, folderId, files, token)
{
    try {
        const instance = instanceFunc(ctx.context, token);
        var response = await instance.put(`${apiFiles}${method.move}`,{
            "destFolderId": folderId,
            "folderIds": [],
            "fileIds":[files],
            "resolveType": "Skip",
            "holdResult": true
        });
    } catch (error) {
        exceptionResponse(error);
    }
};

var moveFolder = async function(ctx, folderId, folders, token)
{
    try {
        const instance = instanceFunc(ctx.context, token);
        var response = await instance.put(`${apiFiles}${method.move}`,{
            "destFolderId": folderId,
            "folderIds": [folders],
            "fileIds":[],
            "resolveType": "Skip",
            "holdResult": true
        });
    } catch (error) {
        exceptionResponse(error);
    }
};

var renameFile = async function(ctx, fileId, newName, token)
{
    try {
        const instance = instanceFunc(ctx.context, token);
        var response = await instance.put(`${apiFiles}${method.file}${fileId}`,{
            "title": newName
        });
    } catch (error) {
        exceptionResponse(error);
    }
};

var renameFolder = async function(ctx, folderId, newName, token)
{
    try {
        const instance = instanceFunc(ctx.context, token);
        var response = await instance.put(`${apiFiles}${method.folder}${folderId}`,{
            "title": newName
        });
    } catch (error) {
        exceptionResponse(error);
    }
};

var rewritingFile = async function(ctx, folderId, title, data, token)
{
    try {
        const Authorization = token ? token : null;
        const encode_title =  encodeURIComponent(`${title}`);
        const instance = instanceFunc(ctx.context, token);
        var response = await instance.post(`${apiFiles}${folderId}${method.insert}`,data,
        {
            headers: {
                Authorization,
                "Content-Type": `multipart/form-data; boundary=${data._boundary}`
            }
        });
    } catch (error) {
        exceptionResponse(error);
    }
};

//РАЗОБРАТЬСЯ!
var getFileDownloadUrl = async function(ctx, fileId, token)
{
    try {
        const instance = instanceFunc(ctx.context, token);
        var response = await instance.get(`${apiFiles}${method.file}${fileId}${method.openedit}`)
            .then(async function (response){
                //const instanceSF = instanceFunc(ctx.context, token, 'application/octet-stream');
                //var streamFile = await instance.get(response.data.response.document.url);
                var streamFile = await request.get(
                {
                    url:response.data.response.document.url,
                    headers: getHeader('application/octet-stream', token)
                });
                streamFile.end();
                return streamFile;
            });
        return response;
    } catch (error) {
        exceptionResponse(error);
    }

    //#region old code
    /*request.get(
        {
            url: `${domen}${api}${apiFiles}${method.file}${fileId}${method.openedit}`,
            headers: getHeader('application/json', token),
        }, (err, response, body) => {
            exceptionResponse(err, body, (err) => {
                if(err){
                    callback(err);
                }
                else{
                    let streamFile = request.get(
                        {
                            url: JSON.parse(body).response.document.url,
                            headers: getHeader('application/octet-stream', token),
                        }
                    );
                    streamFile.end();
                    callback(null, streamFile);
                }
            });
        }
    );*/
    //#endregion
};

//не понимаю зачем эта функция нужна если даже на сайте нельзя создать файлы с расширением .txt соответсвенно не работает
//#region createFiletxt
var createFiletxt = async function(ctx, folderId, title, token)
{
    //try {
    //    var rpost = request.post(
    //        {
    //            method: 'POST',
    //            url: `http://localhost:8092/${api}${apiFiles}${folderId}${method.text}`,
    //            headers: getHeader('application/json', token),
    //            form: {
    //                "title": title,
    //                "content": ' '
    //            }
    //        }
    //    );
    //    var wqerqwerqwer=1;
    //} catch (error) {
    //    var asdfasdf=1;
    //}

    let data=JSON.stringify({
        title: title,
        data: ' '
    });
    try {
        const instance = await instanceFunc(ctx.context, token);
        var response = await instance.post(`${apiFiles}${folderId}${method.text}`,data);
        return response.data.response;
    } catch (error) {
        exceptionResponse(error);
    }
};
//#endregion

//не понимаю зачем эта функция нужна если даже на сайте нельзя создать файлы с расширением .html соответсвенно не работает
//#region createFilehtml
/*var createFilehtml = async function(folderId, title, token)
{
    try {
        const instance = await instanceFunc(token);
        if(isCorrectName(title)){
            var response = await instance.post(`${apiFiles}${folderId}${method.html}`,{
                "title": title,
                "data": ' '
            });
            return response.data.response;
        }
        else{
            throw "incorrect file name";
        }
    } catch (error) {
        exceptionResponse(error);
    }
};*/
//#endregion

module.exports = {
    getStructDirectory,
    getFileDownloadUrl,
    rewritingFile,
    createFiletxt,
    //createFilehtml,
    requestAuth,
    createFile,
    createFolder,
    deleteFile,
    deleteFolder,
    copyFile,
    copyFolder,
    moveFile,
    moveFolder,
    renameFile,
    renameFolder
};