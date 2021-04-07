/* Config */

module.exports = {
  // Port listener WebDav Server */
  portListener: 1900,

  // Logging level. Possible values: 'info', 'warn', 'error'
  levelLog: 'info',

  //User cache storage time (msec)
  timeIsCleanTrash: 36000000,

  //Cache Overflow Check Interval (msec)
  cleanTrashInterval: 900000,

  // Adress of community server OnlyOffice */
  domen: 'http://localhost:80/',

  isHttps: true,

  // Port of community server OnlyOffice */
  onlyOfficePort: ":8092/",

  // Api constant
  api: 'api/2.0/',

  // Api authentication method
  apiAuth: 'authentication.json',

  // Sub-method for files/folders operations
  apiFiles: 'files/',

  method: {

    // Get root directory in "My documents"
    pathMyDirectory: '@my',

    // Get root directory in "Common Folder"
    pathCommonDirectory: '@common',
    
    // Get root directory in "Root"
    pathRootDirectory: '@root',

    // Operations with folders
    folder: 'folder/',

    // Operations with files
    file: 'file/',

    // Create new file '*.txt'
    text: '/text',

    //
    html: '/html',

    // Open edit text file. 
    openedit: '/openedit',

    // Write stream in file
    insert: '/insert',

    update: '/update',

    saveediting: '/saveediting',

    // Property for method 'insert'
    no_createFile: '&createNewIfExist=false',

    // Method copy for files or folders
    copy: 'fileops/copy',

    // Method move for files or folders
    move: 'fileops/move',

    bulkdownload:'fileops/bulkdownload',
    
    getpresigneduri:'/getpresigneduri',

    upload: '/upload',
    
    createSession: '/create_session'
  }
}