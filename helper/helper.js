const logger = require('./logger.js');
const webdav = require('webdav-server').v2;

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
            throw error;
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
        throw e;
    }
    
};

module.exports = {
    getHeader,
    exceptionResponse
};