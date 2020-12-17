const logger = require('./logger.js');

var getHeader = function(contentType, token){
    const ContentType = contentType;
    const Accept = 'application/json';
    const Authorization = token ? token : null;
    return({
        ContentType,
        Accept,
        Authorization
    });
};

var exceptionResponse = function(error,content)
{
    try {
        const statusCode = error.response.status;
        if(error){
            logger.log('warn', error.response.data.error.message);
        }
        else if(!content){
            logger.log('warn', webdav.Error.Forbidden);
        }else if(statusCode == 403){
            logger.log('warn', error.response.data.error.message);
        } 
        else if(statusCode !== 201 && statusCode !== 200){
            logger.log('warn', error.response.data.error.message);
        }
    } catch (e) {
        logger.log('error', `Error JSONparse response from api ${e}`);
        logger.log('error', `${e}`);
    }
};
//#region old code
/*var exceptionResponse1 = function(err, body, callback){
    try{
        if(err){
            logger.log('warn', `${JSON.parse(body).error.message}`);
            callback(err);
        }
        if(!body){
            callback(webdav.Error.Forbidden, null);
        }
        const statusCode = JSON.parse(body).statusCode;
        if(statusCode == 403){
            logger.log('warn', `${JSON.parse(body).error.message}`);
            callback(webdav.Error.Forbidden, null);
        }
        if(statusCode !== 201 && statusCode !== 200){
            logger.log('warn', `${JSON.parse(body).error.message}`);
            callback(new Error(`${JSON.parse(body).error.message}`), null);
        }
        else callback();
    }
    catch(e){
        logger.log('error', `Error JSONparse response from api ${e}`);
        logger.log('error', `${e}`);
        callback(new Error('Error JSONparse response from api'), null);
    }
};*/
//#endregion
module.exports = {
    getHeader,
    exceptionResponse
};