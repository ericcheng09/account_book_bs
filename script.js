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

			return "<div class='card m-3'>"+
				   "<div class='card-header d-flex justify-content-between bg-opacity-75 " + bgColor + "'>"+
					"<h6 class='m-2'>"+obj.date+"</h6><h6>"+addKind+
					"&nbsp;<a href='#' class='delbtn' data-key="+obj.id+">✘</a>"+
					"</h6>"+
					"</div>"+
					"<div class='card-body d-flex'>"+
							"<svg class='m-1' width='36' height='36'>"+
                            "<use xlink:href='#"+ icon + "></use></svg>"+
							"<p class='card-text m-2'>"+obj.memo+"</p>"+
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