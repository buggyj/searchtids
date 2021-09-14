const {app,BrowserWindow,dialog}=require('electron')
const url=require('url')
const path=require('path')
const { ipcMain } = require('electron')
const { parse } = require ('node-html-parser')
let fs = require('fs')


let win;

function createWindow(){
  win=new BrowserWindow({
    width:900,
    height:700,
        webPreferences: {
		preload: __dirname + "/preload.js"
  }
  })
  
  win.loadURL("http://127.0.0.1:8088" );
    //win.openDevTools()
}
/*
 * 
 * function createWindow(){
  win=new BrowserWindow({
    width:900,
    height:700,
    webPreferences: {
		preload: __dirname + "/preload.js",
   nodeIntegration: true
  }
  })
  win.loadURL(url.format({
    pathname:path.join(__dirname,'index.html'),
    protocol:'file:',
    slashes:true
  }))

  win.openDevTools()
}


  * */
  
  function htmlEncode(param){
	return(param.replace(/&/mg,"&amp;").replace(/</mg,"&lt;").replace(/>/mg,"&gt;").replace(/\"/mg,"&quot;"));
  }

	function findInTid(node,searchTid,filepath) {//based on tw5 boot
		var htmlDecode = function(s) { 
				return s.toString().replace(/&lt;/mg,"<").replace(/&nbsp;/mg,"\xA0").replace(/&gt;/mg,">").replace(/&quot;/mg,"\"").replace(/&amp;/mg,"&");
			};
		var childs=node.childNodes;
		var e = childs[0];
		var j = 0;
		while(e &&( !e.tagName ||(e.tagName&& e.tagName.toLowerCase() !== "pre"))) {
			e = childs[j++];
		}
		var attrFunc = node.getAttribute ?true:false;
		var title = node.getAttribute ? node.getAttribute("title") : null;
		var found = attrFunc && e && title;
		if (found) found = !(node.getAttribute("plugin-type") == "plugin");// do not search plugins 
		if (found && searchTid.title) found = (title.search(searchTid.title)!=-1);		
		if (found && searchTid.tag)   found = (node.getAttribute("tags") && node.getAttribute("tags").search(searchTid.tag)!=-1);
		if (found && searchTid.text)  found = (e.innerHTML && e.innerHTML.search(searchTid.text)!=-1);	
		if(found) {
			var attrs = node.attributes,tiddler;
				tiddler = {
					text: htmlDecode(e.innerHTML)
				};
				
			for(var i in attrs) {
				tiddler[i] = attrs[i];
			}
			tiddler.title=filepath + "::" + tiddler.title;
			return JSON.stringify(tiddler);
		} else {
			return "";
		}
	}

	function findMetaInHead(root,searchStr) {//based on tw5 boot
		var childs,e,j;
		var head = root.querySelector('head');
		childs=head?head.childNodes||[]:[];
		for(j = 0; j <childs.length; j++){
			e = childs[j];
			if (e && e.tagName && e.tagName.toLowerCase() === "meta") {
				var name = e.getAttribute ? e.getAttribute("name") : null;
				if (name == searchStr) return e.getAttribute("content");
			}
		}
		return null;
	}

const mainfn = function (msg) {
  const twstring = "tiddlywiki-version";
  var root,store,nodes,total=0,limit=10,strToFind = "vvvv";//htmlEncode("set=\"CountryFirst\"");;
  var filepaths = JSON.parse(msg.filepaths);
  var numProcesses = 0;
  let launchingTasks;
  let fpaths = Object.keys(filepaths);
  if (fpaths.length === 0) {
	  sendStopMsg();
	  return;
  }
  numProcesses = fpaths.length;
  for (let fpath in filepaths){
	   if ("false" === filepaths[fpath]) {
		   numProcesses--;
		   continue;
		}
       fs.readFile(fpath, 'utf-8', (err, data) => { 
         console.log("reading")
         if(err){ 
            console.log("An error ocurred reading the file :" + err.message);
            if (1===numProcesses) sendStopMsg();
            else numProcesses--;
            c;
         } 
         root = parse(data);
         console.log (findMetaInHead(root, twstring));
         if (!findMetaInHead(root, twstring)){
			 console.log (findMetaInHead(root, twstring));
			 if (1===numProcesses) sendStopMsg();
			 else numProcesses--;
			 return;
		 }
         store = root.querySelector('#storeArea');
         if (store) 	nodes = store.querySelectorAll('div');
		else nodes = [];
		for (let i = 0; i< nodes.length; i++){
		  let tid = findInTid(nodes[i],JSON.parse(msg.search),fpath);
		  //tid?console.log(tid):null;
		  if (tid) win.webContents.send('dataNew',tid);
	    }
	    if (1===numProcesses) sendStopMsg();
	    else numProcesses--;
	    console.log("numProcesses "+numProcesses);
      });
  }
}  
app.on('ready',createWindow);

function sendStopMsg(){
	console.log("stopping");
	win.webContents.send('data',"stop");
}

ipcMain.on("command", (events, args)=>{
	console.log("got msg " + JSON.stringify(args));
	mainfn(args);
})


