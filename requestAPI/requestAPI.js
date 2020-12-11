var request = require('request');
var axios = require('axios');
const {getHeader, exceptionResponse, isCorrectName} = require('./helper.js');
const {
    domen,
    api,
    apiFiles,
    apiAuth,
    method
} = require('../config.js');

function instanceFunc(token=null, header='application/json',url=`${domen}${api}`, content)
{
    return axios.create({
        baseURL: url,
        timeout: 1000,
        headers: getHeader(header,token),
        data: content
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

//как заставить ловить спецсимволы?
var createDirectory = async function(parentId, title, token)
{
    try {
        const instance=await instanceFunc(token);
        if(await isCorrectName(title)){
            var response=await instance.post(`${apiFiles}${method.folder}${parentId}`,{
                "title": title
            });
            return response.data.response;
        }
        else{
            throw "incorrect folder name";
        }
    } catch (error) {
        exceptionResponse(error);
    }
//#region old code
    /*request.post(
        {
            method: 'POST',
            url: `${domen}${api}${apiFiles}${method.folder}${parentId}`,
            headers: getHeader('application/json', token),
            form: {
                "title": title
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
    );*/
    //#endregion
};

//почему-то не падает и не выдает ошибки когда пытаюсь удалить папки на подобие "корзина", "мои документы" и тд
var deleteDirectory = async function(folderId, token)
{
    try {
        const instance= await instanceFunc(token);
        var response=await instance.delete(`${apiFiles}${method.folder}${folderId}`,{
            "deleteAfter": true,
            "immediately": true
        }); 
    } catch (error) {
        exceptionResponse(error);
    }
    //#region old code
    /*request.delete(
        {
            method: 'DELETE',
            url: `${domen}${api}${apiFiles}${method.folder}${folderId}`,
            headers: getHeader('application/json', token),
            form: {
                "deleteAfter": true,
                "immediately": true
            }
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

//надо доработать. Не обрабатывает исключение, если попробовать создать файл в корневой дирректории "@root"
var createFile = async function(folderId, title, token)
{
    try {
        const instance = await instanceFunc(token);
        if(isCorrectName(title)){
            var response = await instance.post(`${apiFiles}${folderId}/${method.file}`,{
                "title": title
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
    /*request.post(
        {
            method: 'POST',
            url: `${domen}${api}${apiFiles}${folderId}/${method.file}`,
            headers: getHeader('application/json', token),
            form: {
                "title": title
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
    );*/
    //#endregion
};

//не понимаю зачем эта функция нужна если даже на сайте нельзя создать файлы с расширением .txt соответсвенно не работает
var createFiletxt = async function(folderId, title, token)
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
    /*request.post(
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
    );*/
    //#endregion
};

//не понимаю зачем эта функция нужна если даже на сайте нельзя создать файлы с расширением .html соответсвенно не работает
var createFilehtml = async function(folderId, title, token)
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
    /*request.post(
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
    );*/
    //#endregion
};

//работает хорошо без проблем, единственное не знаю как можно добиться ошибки при удалении файла
var deleteFile = async function(fileId, token)
{
    try {
        const instance = await instanceFunc(token);
        var response = await instance.delete(`${apiFiles}${method.file}${fileId}`,{
            "deleteAfter": true,
            "immediately": true
        });
    } catch (error) {
        exceptionResponse(error);
    }
    //#region old code
    /*request.delete(
        {
            method: 'DELETE',
            url: `${domen}${api}${apiFiles}${method.file}${fileId}`,
            headers: getHeader('application/json', token),
            form: {
                "deleteAfter": true,
                "immediately": true
            }
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

//что этот что старый не работают надо переосмысливать функцию. Мои ошибки не исключены
var  copyFileToFolder = async function(folderId, files, token)
{
    try {
        const instance=await instanceFunc(token);
        var response = await instance.put(`${apiFiles}${method.copy}`,{
            "destFolderId": folderId,
            "fileIds": files,
            "conflictResolveType": "Skip",
            "deleteAfter": true
        });
    } catch (error) {
        exceptionResponse(error);
    }
    //#region old code
    /*request.put(
        {
            method: 'PUT',
            url: `${domen}${api}${apiFiles}${method.copy}`,
            headers: getHeader('application/json', token),
            form: {
                "destFolderId": folderId,
                "fileIds": files,
                "conflictResolveType": "Skip",
                "deleteAfter": true
            }
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

//что этот что старый не работают надо переосмысливать функцию. Мои ошибки не исключены
var  copyDirToFolder = async function(folderId, folders, token)
{
    try {
        const instance = await instanceFunc(token);
        var response = await instance.put(`${apiFiles}${method.copy}`,{
            "destFolderId": folderId,
            "folderIds": folders,
            "conflictResolveType": "Skip",
            "deleteAfter": true
        });
    } catch (error) {
        exceptionResponse(error);
    }
    //#region old code
    /*request.put(
        {
            method: 'PUT',
            url: `${domen}${api}${apiFiles}${method.copy}`,
            headers: getHeader('application/json', token),
            form: {
                "destFolderId": folderId,
                "folderIds": folders,
                "conflictResolveType": "Skip",
                "deleteAfter": true
            }
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

//что этот что старый не работают надо переосмысливать функцию. Мои ошибки не исключены
var  moveDirToFolder = async function(folderId, folders, token)
{
    try {
        const instance = await instanceFunc(token);
        var response = await instance.put(`${apiFiles}${method.move}`,{
            "destFolderId": folderId,
            "folderIds": folders,
            "conflictResolveType": "Skip",
            "deleteAfter": true
        });
    } catch (error) {
        exceptionResponse(error);
    }
    //#region old code
    /*request.put(
        {
            method: 'PUT',
            url: `${domen}${api}${apiFiles}${method.move}`,
            headers: getHeader('application/json', token),
            form: {
                "destFolderId": folderId,
                "folderIds": folders,
                "conflictResolveType": "Skip",
                "deleteAfter": true
            }
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

//что этот что старый не работают надо переосмысливать функцию. Мои ошибки не исключены
var  moveFileToFolder = async function(folderId, files, token)
{
    try {
        const instance = await instanceFunc(token);
        var response = await instance.put(`${apiFiles}${method.move}`,{
            "destFolderId": folderId,
            "fileIds": files,
            "conflictResolveType": "Skip",
            "deleteAfter": true
        });
    } catch (error) {
        exceptionResponse(error);
    }
    //#region old code
    /*request.put(
        {
            method: 'PUT',
            url: `${domen}${api}${apiFiles}${method.move}`,
            headers: getHeader('application/json', token),
            form: {
                "destFolderId": folderId,
                "fileIds": files,
                "conflictResolveType": "Skip",
                "deleteAfter": true
            }
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

//работает хорошо, но проблема с отловом спецсимволов
var renameFolder = async function(folderId, newName, token)
{
    try {
        const instance = await instanceFunc(token);
        if(isCorrectName(newName)){
            var response = await instance.put(`${apiFiles}${method.folder}${folderId}`,{
                "title": newName
            });
        }
        else{
            throw "incorrect folder name";
        }
    } catch (error) {
        exceptionResponse(error);
    }
    //#region old code
    /*request.put(
        {
            method: 'PUT',
            url: `${domen}${api}${apiFiles}${method.folder}${folderId}`,
            headers: getHeader('application/json', token),
            form: {
                "title": newName
            }
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

//работает хорошо, но проблема с отловом спецсимволов
var renameFile = async function(fileId, newName, token)
{
    try {
        const instance = await instanceFunc(token);
        if(isCorrectName(newName)){
            var response = await instance.put(`${apiFiles}${method.file}${fileId}`,{
                "title": newName
            });
        }
        else{
            throw "incorrect file name";
        }
    } catch (error) {
        exceptionResponse(error);
    }
    //#region old code
    /*request.put(
        {
            method: 'PUT',
            url: `${domen}${api}${apiFiles}${method.file}${fileId}`,
            headers: getHeader('application/json', token),
            form: {
                "title": newName
            }
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

module.exports = {
    getStructDirectory,
    createDirectory,
    deleteDirectory,
    getFileDownloadUrl,
    createFile,
    deleteFile,
    rewritingFile,
    copyFileToFolder,
    copyDirToFolder,
    moveFileToFolder,
    moveDirToFolder,
    renameFolder,
    renameFile,
    createFiletxt,
    createFilehtml,
    requestAuth
};