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


function instanceFunc(ctx, token=null, header='application/json')
{
    var domain = null;
    if (isHttps){
        const hostStr = ctx.headers.host;
        var httProtocol = "http://";
        domain = httProtocol + hostStr.split(":")[0] + onlyOfficePort;
    }
    
    return axios.create({
        baseURL: `${domain}${api}`,
        timeout: 30000,
        headers: getHeader(header,token)
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

var addRealTitle = function(response, folderId){
    if (folderId != '@root'){
        for(let i = 0; i<response.data.response.files.length; i++){
            response.data.response.files[i]['realTitle'] = response.data.response.files[i].title;
        }
        for(let i = 0; i<response.data.response.folders.length; i++){
            response.data.response.folders[i]['realTitle'] = response.data.response.folders[i].title;
        }
        return response;
    } else{
        return response;
    }
};

var checkDuplicateNames = function(response){
    for(let i = 0; i<response.data.response.files.length; i++){
        if (response.data.response.files.filter(item => item.title == response.data.response.files[i].title).length >1){
            return false;
        }
        //for(let j = 0; j<response.data.response.files.length;j++){
        //    if((i!=j)&&(response.data.response.files[i].title==response.data.response.files[j].title)){
        //        return false;
        //    }
        //}
    }
    for(let i = 0; i<response.data.response.folders.length; i++){
        if (response.data.response.folders.filter(item => item.title == response.data.response.folders[i].title).length >1){
            return false;
        }
        //for(let j = 0; j<response.data.response.folders.length;j++){
        //    if((i!=j)&&(response.data.response.folders[i].title==response.data.response.folders[j].title)){
        //        return false;
        //    }
        //}
    }
    return true;
};

var localRename = function(response, folderId){
//#region 
    /*if (folderId != '@root'){
        let i=0;
        for(i; i<response.data.response.files.length; i++){
            let c=1;
            let j =0;
            //for(let j = 0; j<files.length;j++){
                
                while (response.data.response.files.filter(file => file.title == response.data.response.files[i].title).length != 1){
                    console.log("был "+response.data.response.files[i].title+"i"+i);
                    console.log("был "+response.data.response.files[j].title+"j"+j);
                    if((i!=j)&&(response.data.response.files[i].title == response.data.response.files[j].title)){
                        const title = response.data.response.files[j].title.split(".");
                        response.data.response.files[j].title=title[0]+`(${c}).`+title[1];
                        c++;
                    }
                    console.log("стал "+response.data.response.files[i].title+"i"+i);
                    console.log("стал "+response.data.response.files[j].title+"j"+j);
                    if(j == (response.data.response.files.length-1)){
                        j=0;
                    }
                    if(j != (response.data.response.files.length-1)){
                        j++;
                    }
                    
                }
                
            //}
        }
        for(let i = 0; i<response.data.response.folders.length; i++){
            let c=1;
            for(let j = 0; j<response.data.response.folders.length;j++){
                if((i!=j)&&(response.data.response.folders[i].title == response.data.response.folders[j].title)){
                    response.data.response.folders[j].title += `(${c})`;
                    c++;
                }
            }
        }
    }*/
    //#endregion
//#region 
    if (folderId != '@root'){
        if(!checkDuplicateNames(response)){
            for(let i = 0; i<response.data.response.files.length; i++){
                let c=1;
                for(let j = 0; j<response.data.response.files.length;j++){
                    if((i!=j)&&(response.data.response.files[i].title==response.data.response.files[j].title)){
                        //n[0].split(')')[0].split('(')[1]
                        const title = response.data.response.files[j].title.split(".");
                        if (response.data.response.files[j].realTitle == response.data.response.files[j].title){
                            response.data.response.files[j].title=title[0]+`(${c}).`+title[1];
                            c++;
                        } else {
                            let reversTitle = response.data.response.files[j].title.split("").reverse().join("");
                            let num = reversTitle.split(")",2)[1].split("(")[0].split("").reverse().join("");
                            response.data.response.files[j].realTitle = title[0]+`(${Number(num)+1}).`+title[1];
                            response.data.response.files[j].realTitle = title[0]+`(${num+1}).`+title[1];
                        }
                    }
                }
            }
            for(let i = 0; i<response.data.response.folders.length; i++){
                let c=1;
                for(let j = 0; j<response.data.response.folders.length;j++){
                    if((i!=j)&&(response.data.response.folders[i].title==response.data.response.folders[j].title)){
                        response.data.response.folders[j].title += `(${c})`;
                        c++;
                    }
                }
            }
            return localRename(response, folderId);
        } else{
            return response;
        }
    } else{
        return response;
    }
    //#endregion
};

var getStructDirectory = async function(ctx, folderId, token)
{

    try {
        const instance = instanceFunc(ctx.context, token);
        var response = await instance.get(`${apiFiles}${folderId}`);
        //response.data.response[0].files[0]['fakeName']='fakename';
        //delete response.data.response[0].files[0].fakeName;
        //var str ="Hello world(1)(15).docx";
        //var qweqwe = str.split("").reverse().join("");
        //var asd = qweqwe.split(")",2)[1].split("(")[0].split("").reverse().join("");
        response = addRealTitle(response, folderId);
        response = localRename(response, folderId);
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
        var response = await instance.delete(`${apiFiles}${method.folder}${folderId}`,{
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

var getFileDownloadUrl = async function(ctx, fileId, token)
{
    try {
        const instance = instanceFunc(ctx.context, token);
        var response = await instance.get(`${apiFiles}${method.file}${fileId}${method.openedit}`)
            .then(async function (response){
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
    getFileDownloadUrl,
    rewritingFile,
    createFiletxt,
    createFilehtml,
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