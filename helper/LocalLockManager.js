class CLocalLockManager extends webdav.LocalLockManager
{
    setLock (lock, callback) {
        callback(null);
    }
}

module.exports = CLocalLockManager;