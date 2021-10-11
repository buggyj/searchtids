const {app,BrowserWindow,dialog,shell}=require('electron')
const url=require('url')
const path=require('path')
const { ipcMain } = require('electron')
const { parse } = require ('node-html-parser')
let fs = require('fs')
const querystring = require('querystring')
const userDataPath = app.getPath('userData')
let win, win2;

function createWindow(){
  win=new BrowserWindow({
		show: false,
        webPreferences: {
		preload: __dirname + "/preload.js"
  }
  })
  win.maximize();
  win.show();

if(process.env.NODE_ENV === 'dev') {
     win.loadURL("http://127.0.0.1:8088" );
} else {
	 win.loadFile(__dirname + "/searchfortids.html");
}
  

    //win.openDevTools()
  win.webContents.on("new-window", function(event, url) {
  event.preventDefault();
  shell.openExternal(url);
});
}

// Parse a string array from a bracketted list. For example "OneTiddler [[Another Tiddler]] LastOne (--source = tw)"
var parseStringArray = function(value) {
	if(typeof value === "string") {
		var memberRegExp = /(?:^|[^\S\xA0])(?:\[\[(.*?)\]\])(?=[^\S\xA0]|$)|([\S\xA0]+)/mg,
			results = [],
			match;
		do {
			match = memberRegExp.exec(value);
			if(match) {
				var item = match[1] || match[2];
				if(item !== undefined && results.indexOf(item) === -1) {
					results.push(item);
				}
			}
		} while(match);
		return results;
	} else {
		return [];
	}
};
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
		function unshiftArr (Arr,x) {Arr.unshift(x);return Arr}
		var attrFunc = node.getAttribute ?true:false;
		var title = node.getAttribute ? node.getAttribute("title") : null;
		var found = attrFunc && e && title;
		var searchText = new RegExp(searchTid.text,(searchTid.case === 'any')?'i':'');
		
		var allTagSearch = parseStringArray(searchTid.tag).join('|');
		var searchTag = new RegExp(allTagSearch,(searchTid.case === 'any')?'i':'');
		
		var searchTitle = new RegExp(searchTid.title,(searchTid.case === 'any')?'i':'');
		var findTag  = (acc, next) => acc || next.match(searchTag);
		if (found) found = !(node.getAttribute("plugin-type") == "plugin");// do not search plugins 
		if (found && searchTid.title) found = (title.match(searchTitle));
	
		if (found && searchTid.tag)   found = node.getAttribute("tags") && unshiftArr(parseStringArray(node.getAttribute("tags")),false).reduce(findTag);
		if (found && searchTid.text)  found = (e.innerHTML && e.innerHTML.match(searchText));	
		if(found) {
			var attrs = node.attributes,tiddler;
				tiddler = {
					text: searchTid.text?htmlDecode(e.innerHTML):""
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


	function newFindInTid(tid,searchTid,filepath) {
		
		function unshiftArr (Arr,x) {Arr.unshift(x);return Arr}

		var found = true, tidnew = {};
		var searchText = new RegExp(searchTid.text,(searchTid.case === 'any')?'i':'');
		
		var allTagSearch = parseStringArray(searchTid.tag).join('|');
		var searchTag = new RegExp(allTagSearch,(searchTid.case === 'any')?'i':'');
		
		var searchTitle = new RegExp(searchTid.title,(searchTid.case === 'any')?'i':'');
		var findTag  = (acc, next) => acc || next.match(searchTag);
		if (found) found = !(tid["plugin-type"] === "plugin");// do not search plugins 
		if (found && searchTid.title) found = (tid.title.match(searchTitle));
	
		if (found && searchTid.tag)   found =  unshiftArr(parseStringArray(tid.tags),false).reduce(findTag);
		if (found && searchTid.text)  found = (tid.text && tid.text.match(searchText));	
		if(found) {
			tidnew.title=filepath + "::" + tid.title;
			if (searchTid.text) tidnew.text = tid.text;
			if (searchTid.tag) tidnew.tags = tid.tags;
			return JSON.stringify(tidnew);
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
function isTiddlyWikiClassic(doc) {
		// Test whether the document is a TiddlyWiki (we don't have access to JS objects in it)
		var versionArea = doc.querySelector("#versionArea");
		return	doc.querySelector("#storeArea") &&
			(versionArea && /TiddlyWiki/.test(versionArea.text));
}

const getLeavesPaths = function(JsonFilepaths){//synchronous 
	var filepaths,fpath,leaves=[];
	var leavesCallBack = function(xPath){
		if (path.extname(xPath) === '.html'){ 
			leaves.push(xPath);
		} 
	}
	try {
		filepaths = JSON.parse(JsonFilepaths);
	} catch(e){
		return (leaves); 
	}
	for (let fpath in filepaths){
		if ("disabled" === filepaths[fpath]) {
		   continue;
		}
		try {
			fs.statSync(fpath).isDirectory() ? walkDir(fpath, leavesCallBack) : leavesCallBack(fpath);	  
		}catch(e){
			console.log(e);
		}	
	}
	return (leaves); 
}

const mainfn = function (fpaths, search, onStopCallback) {
  const twstring = "tiddlywiki-version";
  var root,store,nodes,total=0,limit=10,strToFind = "vvvv";//htmlEncode("set=\"CountryFirst\"");;
  var numProcesses = 0;  

  if (fpaths.length === 0) {
	  onStopCallback();
	  return;
  }
  numProcesses = fpaths.length;
  for (let fpath=0; fpath < fpaths.length; fpath++){
       fs.readFile(fpaths[fpath], 'utf-8', (err, data) => { 
         console.log("reading")
         if(err){ 
            console.log("An error ocurred reading the file :" + err.message);
            if (1===numProcesses) onStopCallback();
            else numProcesses--;
         } 
         root = parse(data);
 
         if (!findMetaInHead(root, twstring))
			 if (!isTiddlyWikiClassic(root)){
			 if (1===numProcesses) onStopCallback();
			 else numProcesses--;
			 return;
		 }
		 if (findMetaInHead(root, twstring)==="5.2.0"){
			 store = root.querySelector('.tiddlywiki-tiddler-store').innerHTML;
			 if (store) nodes = JSON.parse(store);
			 console.log(nodes.length)
			 for (let i = 0; i< nodes.length; i++){
				let tid = newFindInTid(nodes[i],search,fpaths[fpath]);
				if (tid) win.webContents.send('dataNew',tid);
			}
		}
         store = root.querySelector('#storeArea');
         if (store) 	nodes = store.querySelectorAll('div');
		else nodes = [];
		console.log(nodes.length)
		for (let i = 0; i< nodes.length; i++){
		  let tid = findInTid(nodes[i],search,fpaths[fpath]);
		  //tid?console.log(tid):null;
		  if (tid) win.webContents.send('dataNew',tid);
	    }
	    if (1===numProcesses) onStopCallback();
	    else numProcesses--;
      });
  }
}  

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach( f => {
    let xPath = path.join(dir, f);
    try{
		fs.statSync(xPath).isDirectory()? walkDir(xPath, callback) : callback(xPath);
	}catch(e){
		console.log(e);
	}
  });
};


app.on('ready',createWindow);

function sendStopMsg(){
	console.log("stopping");
	win.webContents.send('data',"stop");
}
// they are set of search locations - dir and file, these are in two seperate lists.
ipcMain.on("command", (events, args)=>{
	
	console.log("got action: " + args.action);
	if (args.action === 'start') {
		let search;
		try {
			search=JSON.parse(args.search);
			mainfn(getLeavesPaths(args.filepaths), search, sendStopMsg);
		} catch(e){
			 sendStopMsg();
		}	
	}
	else if (args.action === 'readUserFile') {
		var data;
		try {
			data = fs.readFileSync(path.join(userDataPath,args.filePath),'utf-8');
		}catch (e){
			console.log(e);
			data = "{}"
		}
		events.sender.send("UserConfig",data);
	}
	else {
		let win, myurl, pathparts = args.filepaths.split('/#');console.log (pathparts[0]);
		if (2 < pathparts.length) myurl = args.filepaths;//bash style path
		else myurl = url.pathToFileURL(pathparts[0])+'/'+pathparts[1];
		console.log ('got '+myurl);
		win=new BrowserWindow({
			width:900,
			height:700,
			webPreferences: {
				preload: __dirname + "/preloadsaver.js"
			}
				
		})
		win.loadFile(pathparts[0],{hash: querystring.escape(pathparts[1])});
		win.webContents.on("new-window", function(event, url) {
		  event.preventDefault();
		});		
		win.webContents.on('will-prevent-unload', (event) => {
		  const choice = dialog.showMessageBoxSync(win, {
			type: 'question',
			buttons: ['Leave', 'Stay'],
			title: 'Do you want to leave this tiddlywiki?',
			message: 'Changes you made may not be saved.',
			defaultId: 0,
			cancelId: 1
		  })
		  const leave = (choice === 0)
		  if (leave) {
			event.preventDefault()
		  }
		})		

	}
})

var debugcount = 0;

ipcMain.on("savefile", (events, args)=>{
	debugcount++;
	fs.writeFile(path.join(userDataPath,args.filePath),args.txt,"utf-8",(error)=> {
		if (error){
			console.log ("sav error with count = "+debugcount);
			events.sender.send("savereturn",{status:"failed",local:true,path:args.filePath});
			}
		else {
			console.log ("sav save with count = "+debugcount);
			events.sender.send("savereturn",{status:"saved",local:true,path:args.filePath});
		}
	});
})

