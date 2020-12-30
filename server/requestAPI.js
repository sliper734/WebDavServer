var request = require('request');
var axios = require('axios');
const {getHeader, exceptionResponse} = require('../helper/helper.js');
const {
    domen,
    api,
    apiFiles,
    apiAuth,
    method
} = require('./config.js');

function instanceFunc(token=null, header='application/json',url=`${domen}${api}`,content)
{
    return axios.create({
        baseURL: url,
        timeout: 1000,
        headers: getHeader(header,token),
        data:content
    });
}

var requestAuth = async function(username, password)
{
    try {
        const instance = instanceFunc();
        var response = await instance.post(`${apiAuth}`,{
            "userName": username,
            "password": password
        });
        return response.data.response.token;
    } catch (error) {
        exceptionResponse(error);
    }
};

var getStructDirectory = async function(folderId, token)
{
    try {
        const instance = instanceFunc(token);
        var response = await instance.get(`${apiFiles}${folderId}`);
        return response.data.response;
    } catch (error) {
        exceptionResponse(error);
    }
};

var createFile = async function(folderId, title, token)
{
    try {
        const instance = instanceFunc(token);
        var response = await instance.post(`${apiFiles}${folderId}/${method.file}`,{
            "title": title
        }); 
        return response.data.response;
    } catch (error) {
        exceptionResponse(error);
    }
};

var createFolder = async function(parentId, title, token)
{
    try {
        const instance = instanceFunc(token);
        var response = await instance.post(`${apiFiles}${method.folder}${parentId}`,{
            "title": title
        }); 
        return response.data.response;
    } catch (error) {
        exceptionResponse(error);
    }
};

var deleteFile = async function(fileId, token)
{
    try {
        const instance = instanceFunc(token);
        var response = await instance.delete(`${apiFiles}${method.file}${fileId}`,{
            "deleteAfter": true,
            "immediately": true
        }); 
    } catch (error) {
        exceptionResponse(error);
    }
};

var deleteFolder = async function(folderId, token)
{
    try {
        const instance = instanceFunc(token);
        var response = await instance.delete(`${apiFiles}${method.folder}${folderId}`,{
            "deleteAfter": true,
            "immediately": true
        }); 
    } catch (error) {
        exceptionResponse(error);
    }
};

var copyFile = async function(folderId, files, token)
{
    try {
        const instance = instanceFunc(token);
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

var copyFolder = async function(folderId, folders, token)
{
    try {
        const instance = instanceFunc(token);
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

var moveFile = async function(folderId, files, token)
{
    try {
        const instance = instanceFunc(token);
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

var moveFolder = async function(folderId, folders, token)
{
    try {
        const instance = instanceFunc(token);
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

var renameFile = async function(fileId, newName, token)
{
    try {
        const instance = instanceFunc(token);
        var response = await instance.put(`${apiFiles}${method.file}${fileId}`,{
            "title": newName
        });
    } catch (error) {
        exceptionResponse(error);
    }
};

var renameFolder = async function(folderId, newName, token)
{
    try {
        const instance = instanceFunc(token);
        var response = await instance.put(`${apiFiles}${method.folder}${folderId}`,{
            "title": newName
        });
    } catch (error) {
        exceptionResponse(error);
    }
};

var rewritingFile = async function(folderId, title, content, token)
{
    try {
        const encode_title = encodeURIComponent(`${title}`);
        const instance = instanceFunc(token,undefined,undefined,content);
        var response = await instance.post(`${apiFiles}${folderId}${method.insert}${encode_title}${method.no_createFile}`);
    } catch (error) {
        exceptionResponse(error);
    }
    //#region old code
    /*const encode_title = encodeURIComponent(`${title}`);
    request.post(
        {
            method: 'POST',
            url: `${domen}${api}${apiFiles}${folderId}${method.insert}${encode_title}${method.no_createFile}`,
            headers: getHeader('application/json', token),
            body: content
        }
    )*/
    //#endregion
};

//РАЗОБРАТЬСЯ!
var getFileDownloadUrl = async function(fileId, token)
{
    try {
        const instance = instanceFunc(token);
        var response = await instance.get(`${apiFiles}${method.file}${fileId}${method.openedit}`);
        var streamFile = await request.get(
            {
                url:response.data.response.document.url,
                headers: getHeader('application/octet-stream', token)
            }
        );
        streamFile.end();
        //#region пока не понял как изменить этот момент(let streamFile...) пытался менятьна это
        //const instanceStreamFile= await instanceFunc(token,'application/octet-stream','');
        //var streamFile= await instanceStreamFile.get(response.data.response.document.url);
        //#endregion
        return streamFile;
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
/*var createFiletxt = async function(folderId, title, token)
{
    try {
        const instance = await instanceFunc(token);
        if(isCorrectName(title)){
            var response = await instance.post(`${apiFiles}${folderId}${method.text}`,{
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
    //createFiletxt,
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