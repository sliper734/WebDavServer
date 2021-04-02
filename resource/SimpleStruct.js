const {timeIsCleanTrash} = require('../server/config.js');

class SimpleStruct
{
    constructor(){
        this.struct = {};
    }

    setStruct(path, uid, structDir){
        if(!this.struct){
            this.struct = {};
        }
        if(!this.struct[uid]){
            this.struct[uid] = {};
        }
        this.struct[uid][path] = {};
        this.struct[uid][path] = structDir;
        this.struct[uid].lastUpdate = new Date;
    }

    getStruct(path, uid){
        try{
            if(!this.struct[uid][path]){
                return false;
            }
            else return this.struct[uid][path];
        }
        catch{
            return false;
        }
    }

    isCleanTrash(uid){
        try{
            const liveTime = timeIsCleanTrash;
            const isClean =  ((new Date - this.struct[uid].lastUpdate) > liveTime) ? true : false;
            return isClean;
        }
        catch{
            return false;
        }
    }

    cleanTrash(users){
        users.forEach(user => {
            if(this.isCleanTrash(user)){
                delete this.struct[user];
            }
        });
    }

    setFileObject(path, uid, newFile){
        this.struct[uid][path].files.push(newFile);
        this.struct[uid].lastUpdate = new Date;
    }

    setFolderObject(path, uid, newFile){
        this.struct[uid][path].folders.push(newFile);
        this.struct[uid].lastUpdate = new Date;
    }

    dropFileObject(Folder, uid, file){
        this.struct[uid][Folder].files.forEach(el => {
            if(el.id == file.id){
                const id = this.struct[uid][Folder].files.indexOf(el);
                delete this.struct[uid][Folder].files[id];
                this.struct[uid].lastUpdate = new Date;
            }
        });
    }

    dropFolderObject(Folder, uid, folder){
        this.struct[uid][Folder].folders.forEach(el => {
            if(el.id == folder.id){
                const id = this.struct[uid][Folder].folders.indexOf(el);
                delete this.struct[uid][Folder].folders[id];
                this.struct[uid].lastUpdate = new Date;
            }
        });
    }

    dropPath(path, uid){
        delete this.struct[uid][path];
        this.struct[uid].lastUpdate = new Date;
    }

    checkRename(elementFrom, elementTo, parentFolderFrom, parentFolderTo, user){

        if (parentFolderFrom != parentFolderTo) return false;
        let elementFromIsExist = false;
        let elementToIsExist = false;
        let structFrom = this.struct[user.uid][parentFolderFrom];
        let structTo = this.struct[user.uid][parentFolderTo];
        structFrom.files.forEach((el) => {
            if(elementFrom == el.title){
                elementFromIsExist = true;
            }
        });
        if(!elementFromIsExist ){
            structFrom.folders.forEach((el) => {
                if(elementFrom == el.title){
                    elementFromIsExist = true;
                }
            });
        }
        if(!elementFromIsExist) return false;

        structTo.files.forEach((el) => {
            if(elementTo == el.title){
                elementToIsExist = true;
            }
        });
        if (!elementToIsExist){
            structTo.folders.forEach((el) => {
                if(elementTo == el.title){
                    elementToIsExist = true;
                }
            });
        }
        if (!elementToIsExist) return true;
        return true;
    }

    renameFolderObject(element, newName, parentFolder, uid){
        this.struct[uid][parentFolder].folders.forEach(el => {
            if(el.title == element){
                const id = this.struct[uid][parentFolder].folders.indexOf(el);
                this.struct[uid][parentFolder].folders[id].title = newName;
                this.struct[uid].lastUpdate = new Date;
            }
        });
    }

    renameFileObject(element, newName, parentFolder, uid){
        this.struct[uid][parentFolder].files.forEach(el => {
            if(el.title == element){
                const id = this.struct[uid][parentFolder].files.indexOf(el);
                this.struct[uid][parentFolder].files[id].title = newName;
                this.struct[uid].lastUpdate = new Date;
            }
        });
    }

    structIsExpire(path, parentFolder, uid){
        if(!this.struct[uid][path]){
            return false;
        }
        else{
            const difference = 1000;
            const notExpire = (new Date - this.struct[uid].lastUpdate) < difference;
            return notExpire;
        }
    }
}

module.exports = SimpleStruct;