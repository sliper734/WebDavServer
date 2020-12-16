var request = require('request');
var axios = require('axios');
const {getHeader, exceptionResponse, isCorrectName} = require('../helper/helper.js');
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
        const instance=await instanceFunc();
        var response=await instance.post(`${apiAuth}`,{
            "userName": username,
            "password": password
        });
        return response.data.response.token;
    } catch (error) {
        exceptionResponse(error);
    }
    //#region old code
    /*request.post(
        {
            method: 'POST',
            url: `${domen}${api}${apiAuth}`,
            headers: getHeader('application/json'),
            form: {
                "userName": username,
                "password": password
            }
        }, (err, response, body) => {
            exceptionResponse(err, body, (err) => {
                if(err){
                    callback(err);
                }
                else{
                    callback(null, JSON.parse(body).response.token);
                }
            });
        }
    );*/
    //#endregion
};

//не знаю как добиться ошибок от этой функции
var getStructDirectory = async function(folderId, token)
{
    try {
        const instance=await instanceFunc(token);
        var response=await instance.get(`${apiFiles}${folderId}`);
        return response.data.response;
    } catch (error) {
        exceptionResponse(error);
    }
    //#region old code
    /*request.get(
        {
            url: `${domen}${api}${apiFiles}${folderId}`,
            headers: getHeader('application/json', token),
        }, (err, response, body) => {
            exceptionResponse(err, body, (err) => {
                if(err){
                    callback(err);
                }
                else{
                    callback(null, JSON.parse(body).response);
                }
            });
        }
    );*/
    //#endregion
};

var createFileOrFolder = async function(folderId, parentId, title, token)
{
    try {
        let changeUrl;
        if (folderId != undefined && parentId === undefined){
            changeUrl= `${apiFiles}${folderId}/${method.file}`;
        } else if (parentId != undefined && folderId === undefined){
            changeUrl= `${apiFiles}${method.folder}${parentId}`;
        } else{
            throw "Something went wrong...";
        }
        const instance=await instanceFunc(token);
        if(await isCorrectName(title)){
            var response=await instance.post(changeUrl,{
                "title": title
            }); 
            return response.data.response;
        }
        else{
            throw "incorrect name";
        }
    } catch (error) {
        exceptionResponse(error);
    }
};

var deleteFileOrFolder = async function(fileId, folderId, token)
{
    try {
        let changeUrl;
        if (fileId != undefined && folderId === undefined){
            changeUrl= `${apiFiles}${method.file}${fileId}`;
        } else if (folderId != undefined && fileId === undefined){
            changeUrl= `${apiFiles}${method.folder}${folderId}`;
        } else{
            throw "Something went wrong...";
        }
        const instance= await instanceFunc(token);
        var response=await instance.delete(changeUrl,{
            "deleteAfter": true,
            "immediately": true
        }); 
    } catch (error) {
        exceptionResponse(error);
    }
};

//РАЗОБРАТЬСЯ!
var getFileDownloadUrl = async function(fileId, token)
{
    const instance= await instanceFunc(token);
    var response = await instance.get(`${apiFiles}${method.file}${fileId}${method.openedit}`);
    let streamFile=await request.get(
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
    //#region old code
    request.post(
        {
            method: 'POST',
            url: `${domen}${api}${apiFiles}${folderId}${method.text}`,
            headers: getHeader('application/json', token),
            form: {
                "title": title,
                "content": ' '
            }
        }, (err, response, body) => {
            exceptionResponse(err, body, (err) => {
                if(err){
                    callback(err);
                }
                else{
                    callback(null, JSON.parse(body).response);
                }
            });
        }
    );
    //#endregion
};*/

//не понимаю зачем эта функция нужна если даже на сайте нельзя создать файлы с расширением .html соответсвенно не работает
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
    //#region old code
    request.post(
        {
            method: 'POST',
            url: `${domen}${api}${apiFiles}${folderId}${method.html}`,
            headers: getHeader('application/json', token),
            form: {
                "title": title,
                "content": ' '
            }
        }, (err, response, body) => {
            exceptionResponse(err, body, (err) => {
                if(err){
                    callback(err);
                }
                else{
                    callback(null, JSON.parse(body).response);
                }
            });
        }
    );
    //#endregion
};*/

//спросить как тестить. Что эта функция что старая не рабочие, либо я не знаю как проверить этот метод
var rewritingFile = async function(folderId, title, content, token)
{
    try {
        const encode_title = await encodeURIComponent(`${title}`);
        const instance = await instanceFunc(token,undefined,undefined,content);
        var response = await instance.post(`${apiFiles}${folderId}${method.insert}${encode_title}${method.no_createFile}`);
    } catch (error) {
        exceptionResponse(error);
    }
    //instance.data=content;
    //#region old code
    /*request.post(
        {
            method: 'POST',
            url: `${domen}${api}${apiFiles}${folderId}${method.insert}${encode_title}${method.no_createFile}`,
            headers: getHeader('application/json', token),
            body: content
        }, (err, response, body) => {
            exceptionResponse(err, body, (err) => {
                if(err){
                    callback(err);
                }
                else{
                    callback();
                }
            });
        }
    );*/
    //#endregion
};

var copyFileOrFolder = async function(folderId, files, folders, token)
{
    try {
        const instance=await instanceFunc(token);
        var response = await instance.put(`${apiFiles}${method.copy}`,{
            "destFolderId": folderId,
            "folderIds": [folders],
            "fileIds": [files],
            "conflictResolveType": "Skip",
            "deleteAfter": true
        });
    } catch (error) {
        exceptionResponse(error);
    }
};

var moveFileOrFolder = async function(folderId, files, folders, token)
{
    try {
        const instance = await instanceFunc(token);
        var response = await instance.put(`${apiFiles}${method.move}`,{
            "destFolderId": folderId,
            "folderIds": [folders],
            "fileIds":[files],
            "resolveType": "Skip",
            "holdResult": true
        });
    } catch (error) {
        exceptionResponse(error);
    }
};

var renameFileOrFolder = async function(fileId, folderId, newName, token)
{
    try {
        let changeMethod = null;
        let changeId = null;
        const instance = await instanceFunc(token);
        if(fileId != undefined && folderId === undefined){
            changeMethod = method.file;
            changeId = fileId;
        } else if (folderId != undefined && fileId === undefined){
            changeMethod = method.folder;
            changeId = folderId;
        } else{
            throw "Где-то неправильное условие";
        }
        if(await isCorrectName(newName)){
            var response = await instance.put(`${apiFiles}${changeMethod}${changeId}`,{
                "title": newName
            });
        }
        else{
            throw "incorrect folder name";
        }
    } catch (error) {
        exceptionResponse(error);
    }
};

module.exports = {
    getStructDirectory,
    getFileDownloadUrl,
    rewritingFile,
    //createFiletxt,
    //createFilehtml,
    requestAuth,
    moveFileOrFolder,
    copyFileOrFolder,
    renameFileOrFolder,
    createFileOrFolder,
    deleteFileOrFolder
};