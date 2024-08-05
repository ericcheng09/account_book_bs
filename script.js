window.addEventListener('load', () => {
    window.indexedDB = window.indexedDB || window.mozIndexedDB || 	window.webkitIndexedDB || window.msIndexedDB;
    if (!window.indexedDB) {
        showMessage("您的瀏覽器不支援indexedDB");
    }

    var db = null;
    const dbName = "account_book";
    const storeName = "records";
    const version = 1;

    ( 
        function init() {
            var req = indexedDB.open(dbName, version);

            req.onsuccess = (e) => {
                db = e.target.result;
            }

            req.onerror = (e) => {
                console.log(e)
                showMessage("openDB error");
            }

            req.onupgradeneeded = (e) => {
                var thisDB = e.target.result;
                
                
                if (!thisDB.objectStoreNames.contains(storeName)) {
                    var objectStore = thisDB.createObjectStore(storeName, {keyPath: "id", autoIncrement: true});
                    objectStore.createIndex("addKind", "addKind", { unique: false });
                    objectStore.createIndex("date", "date", { unique: false });
                    objectStore.createIndex("memo", "memo", { unique: false });
                }

            }
            let ulMonth = document.getElementById('selectMonth');
            for (let i = 1; i <= 12; i++) {
                ulMonth.innerHTML += "<li><a class='dropdown-item' href='#' data-key="+i+">"+i+" 月</a></li>"
                
            }
        }
    )();

    function DB_tx(storeName, mode) {
        let tx = db.transaction(storeName, mode);
        tx.onerror = (e) => {
            console.error("tx", e);
        };
        return tx;
    }


    
})