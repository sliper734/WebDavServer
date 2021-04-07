const request = require('request');
const axios = require('axios');
const {getHeader, getHeaderPeople, exceptionResponse} = require('../helper/helper.js');
const {
    onlyOfficePort,
    api,
    apiFiles,
    apiAuth,
    method,
    isHttps
} = require('./config.js');
const renamingDuplicateElements = require('../helper/renamingDuplicateElements.js');


function instanceFunc(ctx, token=null, header='application/json', service ='asc.files')
{
    var domain = null;
    if (isHttps){
        const hostStr = ctx.headers.host;
        var httProtocol = "http://";
        domain = httProtocol + hostStr.split(":")[0] + onlyOfficePort;
    }
    switch(service){
        case 'asc.files':
            return axios.create({
                baseURL: `${domain}${api}`,
                timeout: 30000,
                headers: getHeader(header,token)
            });
        case 'asc.people':
            return axios.create({
                baseURL: `${domain}${api}`,
                timeout: 30000,
                headers: getHeaderPeople(token)
            });
    }
    
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

var requestUser = async function(ctx, token)
{
    try {
        //http://localhost:8092/api/2.0/people/@self
        const instance = instanceFunc(ctx, token, undefined, 'asc.people');
        var response = await instance.get("people/@self.json");
        return response.data.response.id;
    } catch (error) {
        exceptionResponse(error);
    }
};

var getStructDirectory = async function(ctx, folderId, token)
{

    try {
        const instance = instanceFunc(ctx.context, token);
        var response = await instance.get(`${apiFiles}${folderId}`);
        response = renamingDuplicateElements.addRealTitle(response, folderId);
        response = renamingDuplicateElements.localRename(response, folderId);
        return response.data.response;
    } catch (error) {
        exceptionResponse(error);
    }
};

var createFile = async function(ctx, folderId, title, token, enableExternalExt)
{
    try {
        const instance = instanceFunc(ctx.context, token);
        var response = await instance.post(`${apiFiles}${folderId}/${method.file}`,{
            "title": title,
            "EnableExternalExt": enableExternalExt
        }); 
        response.data.response['realTitle'] = response.data.response.title;
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
        await instance.delete(`${apiFiles}${method.file}${fileId}`,{
            data:{
                "DeleteAfter":true,
                "Immediately":false
            }
        });
    } catch (error) {
        exceptionResponse(error);
    }
};

var deleteFolder = async function(ctx, folderId, token)
{
    try {
        const instance = instanceFunc(ctx.context, token);
        await instance.delete(`${apiFiles}${method.folder}${folderId}`,{
            data:{
                "DeleteAfter":true,
                "Immediately":false
            }
        }); 
    } catch (error) {
        exceptionResponse(error);
    }
};

var copyFile = async function(ctx, folderId, files, token)
{
    try {
        const instance = instanceFunc(ctx.context, token);
        await instance.put(`${apiFiles}${method.copy}`,{
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
        await instance.put(`${apiFiles}${method.copy}`,{
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
        await instance.put(`${apiFiles}${method.move}`,{
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
        await instance.put(`${apiFiles}${method.move}`,{
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
        await instance.put(`${apiFiles}${method.file}${fileId}`,{
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
        await instance.put(`${apiFiles}${method.folder}${folderId}`,{
            "title": newName
        });
    } catch (error) {
        exceptionResponse(error);
    }
};

var rewritingFile = async function(ctx, fileId, data, token)
{
    try {
        const Authorization = token ? token : null;
        const instance = instanceFunc(ctx.context, token);
        await instance.put(`${apiFiles}${method.file}${fileId}${method.saveediting}`,data,
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

var createSession = async function(ctx, folderId, formData, token){
    try {
        const instance = instanceFunc(ctx.context, token)
        const response = await instance.post(`${apiFiles}${folderId}${method.upload}${method.createSession}`,formData);
        return response.data.response.data.location;
    } catch (error) {
        exceptionResponse(error);
    }
}

var chunkedUploader = async function(ctx, data, url, token)
{
    try {
        const Authorization = token ? token : null;
        var response = await axios.post(url, data, {
            headers: {
                Accept: 'application/json, text/plain, */*',
                Authorization,
                "Content-Type": `multipart/form-data; boundary=${data._boundary}`
            }
        });
        const a = 1;
    } catch (error) {
        exceptionResponse(error);
    }
}

var getPresignedUri = async function(ctx, fileId, token)
{
    try {
        const instance = instanceFunc(ctx.context, token);
        var response = await instance.get(`${apiFiles}${method.file}${fileId}${method.getpresigneduri}`)
        return response.data.response;
    } catch (error) {
        exceptionResponse(error);
    }
};

var getFileDownloadUrl = async function(token, uri)
{
    try {
        var streamFile = await request.get(
        {
            url:uri,
            headers: getHeader('application/octet-stream', token)
        });
        streamFile.end();
        return streamFile;
    } catch (error) {
        exceptionResponse(error);
    }
};

var createFiletxt = async function(ctx, folderId, title, token)
{
    try {
        const instance = await instanceFunc(ctx.context, token);
        var response = await instance.post(`${apiFiles}${folderId}${method.text}`,{
            "title": title,
            "content": ' '
        });
        return response.data.response;
    } catch (error) {
        exceptionResponse(error);
    }
};

var createFilehtml = async function(ctx, folderId, title, token)
{
    try {
        const instance = await instanceFunc(ctx.context, token);
        var response = await instance.post(`${apiFiles}${folderId}${method.html}`,{
            "title": title,
            "content": ' '
        });
        return response.data.response;
    } catch (error) {
        exceptionResponse(error);
    }
};

module.exports = {
    getStructDirectory,
    getPresignedUri,
    getFileDownloadUrl,
    createSession,
    rewritingFile,
    createFiletxt,
    createFilehtml,
    chunkedUploader,
    requestAuth,
    requestUser,
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