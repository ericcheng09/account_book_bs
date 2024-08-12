window.addEventListener('load', () => {
    window.indexedDB = window.indexedDB || window.mozIndexedDB || 	window.webkitIndexedDB || window.msIndexedDB;
    if (!window.indexedDB) {
        showMessage("您的瀏覽器不支援indexedDB");
    }

    var db = null;
    const dbName = "account_book";
    const storeName = "records";
    const version = 1;

    let today = new Date();
	let dd = String(today.getDate()).padStart(2, '0');
	let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
	let yyyy = today.getFullYear();

	today = yyyy + "-" + mm + "-" + dd;
	document.getElementById("inputDate").value = today;


    ( 
        function init() {
            var req = indexedDB.open(dbName, version);

            req.onsuccess = (e) => {
                db = e.target.result;
                getAllList("", "");
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
            ulMonth.innerHTML += "<li><a class='dropdown-item' href='#' data-key=0>ALL</a></li>"
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

    // add data
    document.getElementById('saveBtn').addEventListener('click', (e) => {
        e.preventDefault();
        let tx = DB_tx(storeName, 'readwrite');   //交易權限是可讀寫
        tx.oncomplete = (e) => {     //交易完成時觸發
            getAllList("", "");   //重整列表資料
        };
        let store = tx.objectStore(storeName);

        //取得文字方塊輸入內容
        let addKind = document.getElementById("addKind").value.trim();
        let date = document.getElementById("inputDate").value.trim();
        let money = document.getElementById("inputMoney").value.trim();
        let memo = document.getElementById("inputMemo").value.trim();
        
        value = {			  
            addKind, 
            date,
            money,
            memo,
            timestamp:new Date()
        };
        r = store.add(value);	     //新增資料  

    })

    //月份搜尋
    document.getElementById("selectMonth").addEventListener('click', (e) => {
        e.preventDefault();
        let target = e.target;
		let month = target.dataset.key;	
        console.log(month)
        if (month == 0){
            getAllList('', '');
        } else{
		    getCursorValue( month.padStart(2, '0') );
        }
    })

    	 //取出每一筆資料進行比對-openCursor()
	 function getCursorValue(findvalue) {
        let tx = DB_tx(storeName, 'readonly');
        let store = tx.objectStore(storeName);
        
        const index = store.index("date");    //依date欄位搜尋	
        let request = index.openCursor();
        let cursorJson = [];
        request.onsuccess = (e) => {					
            let cursor = e.target.result;					
            if (cursor) {
                console.log(cursor.value)
                //比對cursor.value.date是否含有「-月份-」的資料,例如「-07-」
                if (cursor.value.date.indexOf("-"+findvalue+"-") !== -1) {                
                    cursorJson.push(cursor.value);
                }
                cursor.continue();          
            }
            //資料列表
            showDataList(cursorJson);
        };
    }

    document.getElementById('cards').addEventListener('click', (e) => {
		e.preventDefault();
		let target = e.target;	//點擊的目標物件				
		let keyNo = parseInt(target.dataset.key);
		//當目標物件是按鈕時才做處理
		if( target.tagName.toLowerCase() === 'a' ){
			if (confirm("確定要執行刪除?")){				
				let tx = DB_tx(storeName, 'readwrite');
				let store = tx.objectStore(storeName);
				let oneRecords = store.delete(keyNo);
				oneRecords.onsuccess = (e) => {	
					getAllList("", "");
				}
				oneRecords.onerror = (e) => {
					showMessage("刪除失敗!<br>" + e.target.error.message);
				}
			}
		}
	})

    function getAllList(find, findvalue) {		
    
        let tx = DB_tx(storeName, 'readonly');
        let store = tx.objectStore(storeName);
        let allRecords = null;

        //判斷是搜尋或是完整資料列表
        if (find != ""){			
            let index = store.index(find);    //依索引欄位搜尋
            allRecords = index.getAll(findvalue);   //取出搜尋到的全部資料
        }else{
            allRecords = store.getAll();    //取出全部資料		
        }
        allRecords.onsuccess = (e) => {
            let request = e.target.result;	
            showDataList(request);
        };
        allRecords.onerror = (e) => {
            console.error("allRecords", e);
        };
    }

    function showDataList(request){
        
        let ulist = document.getElementById("cards");  		
        ulist.innerHTML = "載入中...";
        let pay_total=0, income_total=0;

        //使用map和join方法合併字串
        let contents = request.map((obj) => {
           
        let addKind = null, money = 0, bgColor="", icon="";
        if (obj.addKind == "pay")
        {
            addKind = "支出";
            bgColor = "bg-danger";
            icon = "pay";
            money = (0 - Number(obj.money));
            pay_total += money;
        }else{
            addKind = "收入";
            bgColor = "bg-success";
            icon = "bank";
            money = Number(obj.money);
            income_total += money;
        }
        total = pay_total + income_total;
        document.getElementById("incomeSpan").innerHTML = income_total;
        document.getElementById("paySpan").innerHTML = Math.abs(pay_total);
        document.getElementById("totalSpan").innerHTML = (pay_total + income_total);
        console.log(obj.memo)
        console.log("<use xlink:href='#"+ icon + "></use></svg>")
        return "<div class='card m-3'>"+
                    "<div class='card-header d-flex justify-content-between bg-opacity-75 " + bgColor + "'>"+
                        "<h6 class='m-2'>"+obj.date+"</h6><h6 class='mt-2'>"+addKind+
                        "&nbsp;<a href='#' class='delbtn' data-key="+obj.id+">✘</a>"+
                        "</h6>"+
                    "</div>"+
                    "<div class='card-body d-flex'>"+
                        "<svg class='m-1' width='36' height='36'>"+
                           "<use xlink:href='#"+ icon +"'>"+
                        "</svg>"+
                        // "<use xlink:href='#"+ icon + "></use></svg>"+
                        "<p class='m-2'>"+obj.memo+"</p>"+
                        "<p class='ms-auto mt-2'>"+ money +"</p>"+
                    "</div>"+
                "</div>"

        }).join('');
        
        if (contents != ""){
            ulist.innerHTML = contents;			
        }else{
            ulist.innerHTML = "沒有交易";
            document.getElementById("incomeSpan").innerHTML = "0";
            document.getElementById("paySpan").innerHTML = "0";
            document.getElementById("totalSpan").innerHTML = "0";
        }
    }
    
})