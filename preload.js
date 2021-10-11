console.log("enter preload");
const {ipcRenderer} = require("electron");
document.addEventListener('DOMContentLoaded', injectMessageBox, false);
const table0InConfig = 0;//indicates first table in config(default)
const UserConfig="uservalues.json";// As tw does not pass the file name we add it here

/*
 * parts of this file is from https://github.com/Jermolene/TiddlyWiki5
 * which is licensed under the BSD format copyright Jermolene Ruston
 */
 console.log("enter preload");
document.addEventListener('DOMContentLoaded', injectMessageBoxsaver, false);



var backup = true;
var tw5 = true;
/*
 * we may want to download a dummy file and use the download api to see 
 * if it lands in the correct dir,
 * the backgound would set a value we read here and if set save a test file.
 */
 	

function isTiddlyWikiClassic(doc) {
		// Test whether the document is a TiddlyWiki (we don't have access to JS objects in it)
		var versionArea = doc.getElementById("versionArea");
		return (doc.location.protocol === "file:") &&
			doc.getElementById("storeArea") &&
			(versionArea && /TiddlyWiki/.test(versionArea.text));
}

var debouncing =[];

var saveCallBack = function(response) {
	if (debouncing[response.path]) {
		debouncing[response.path](response);
		debouncing[response.path] = null;
	}
}

function injectMessageBoxsaver(doc) {
	var s, savetiddlers = "savetiddlers";
	doc = document;
	console.log ("savetiddlers: injectMessageBoxsaver");

		// Inject the message box
		var messageBox = doc.getElementById("tiddlyfox-message-box");
		if(messageBox) { 
		} else {
			messageBox = doc.createElement("div");
			messageBox.id = "tiddlyfox-message-box";
			messageBox.style.display = "none";
			doc.body.appendChild(messageBox);
		}
		// Attach the event handler to the message box
		messageBox.addEventListener("tiddlyfox-save-file",function(event) {
		// Get the details from the message
		var message = event.target,
			path, 
			content = message.getAttribute("data-tiddlyfox-content");
		console.log ("save: save callback");		
		path = UserConfig;
		// Remove the message element from the message box
		message.parentNode.removeChild(message);
		// Save the file

		if (debouncing[path]) return;
		debouncing[path] = function(response) {
			// Send a confirmation message
			var event1;
			console.log ("save: response is "+response.status);
			if (response.status === "failed") {
				console.log ("save: SAVEFAILURE");
			} else {
				console.log ("save: savefile");
				event1 =doc.createEvent("Events");
				event1.initEvent("tiddlyfox-have-saved-file",true,false);
				event1.savedFilePath = path;
				message.dispatchEvent(event1);
			}
		};
		saveFile(path,content,backup,tw5,saveCallBack);
		return false;
	},false);
	}

	 function saveFile(filePath,content,backup,tw5,callback) {

		// Save the file
		try {
			var msg = {};
			msg.filePath = filePath;
			msg.txt = content;
			msg.backup = backup;
			msg.type = "start";
			msg.tw5 = tw5;
			console.log("from cs: we are inside downloads at "+msg.filePath);
			ipcRenderer.send("savefile",msg);
            ipcRenderer.on("savereturn", (events, args)=>{
				callback(args);});
			return true;
		} catch(ex) {
			alert(ex);
			return false;
		}
	}




var handler = null;
function injectMessageBox() {
	// Inject the message box
	var doc = document;
	var messageBox = doc.getElementById("tiddlyclip-message-box");
	if(!messageBox) {
		messageBox = doc.createElement("div");
		messageBox.id = "tiddlyclip-message-box";
		messageBox.style.display = "none";
		doc.body.appendChild(messageBox);
		//just for debug
		messageBox["data-install"] = "1";
		install = 1;
		console.log ("install:" + install);
		// Attach the event handler to the message box
		
	}
	else {
		//just of debug
		if (messageBox["data-install"]) {
			install = parseInt (messageBox["data-install"])+1;
			messageBox["data-install"] = install;
			console.log ("install:" + install);
		} else {
			install = "1";
			messageBox["data-install"] = install;
			console.log ("install:" + install);
		}
		
	}
	messageBox.addEventListener("tc-send-event",handler = function(event) {
		// message from html app
		var message = event.target,
		msg = {action:message.getAttribute("data-action")};
		if (msg.action==="readUserFile"){
			msg.filePath = UserConfig;
		}	 
		else  {
			
			
			msg.filepaths = message.getAttribute("data-text");
			msg.search = message.getAttribute("data-aux");
			//msg.extra = message.getAttribute("data-extra");
		}	
		message.parentNode.removeChild(message);
		ipcRenderer.send("command",msg);
		return false;		
	},false);
	
};	

ipcRenderer.on("data", (events, args)=>{
				console.log(args)
				
	var pagedata = {data:{}};
	pagedata.data.section = "default";
	pagedata.data.category="updateStatus";
	pagedata.data.say=args;
	
	var messageBox = document.getElementById("tiddlyclip-message-box");
	if(messageBox) {
		// Create the message element and put it in the message box
		var message = document.createElement("div");
		message.setAttribute("data-tiddlyclip-category",pagedata.data.category);
		message.setAttribute("data-tiddlyclip-pageData",JSON.stringify(pagedata));
		message.setAttribute("data-tiddlyclip-currentsection",table0InConfig);
		messageBox.appendChild(message);
		//console.log("tid appended ",pagedata.data.pageData);
		// Create and dispatch the custom event to the extension
		var event = document.createEvent("Events");
		event.initEvent("tiddlyclip-save-file",true,false);
		message.dispatchEvent(event);
		console.log("paste event sent");
	}
	return true; // Action was invoked
				
				
				
});

ipcRenderer.on("dataNew", (events, args)=>{
				console.log(args)
				
	var pagedata = {data:{},remoteTidArr:[]};
	pagedata.data.section = "default";
	pagedata.data.category="adding";
	pagedata.remoteTidArr[0]=args;
	
	var messageBox = document.getElementById("tiddlyclip-message-box");
	if(messageBox) {
		// Create the message element and put it in the message box
		var message = document.createElement("div");
		message.setAttribute("data-tiddlyclip-category",pagedata.data.category);
		message.setAttribute("data-tiddlyclip-pageData",JSON.stringify(pagedata));
		message.setAttribute("data-tiddlyclip-currentsection",table0InConfig);
		messageBox.appendChild(message);
		//console.log("tid appended ",pagedata.data.pageData);
		// Create and dispatch the custom event to the extension
		var event = document.createEvent("Events");
		event.initEvent("tiddlyclip-save-file",true,false);
		message.dispatchEvent(event);
		console.log("dataNew event sent");
	}
	return true; // Action was invoked
});


ipcRenderer.on("UserConfig", (events, args)=>{
				console.log("on UserConfig")
				
	var pagedata = {data:{},remoteTidArr:[]};
	pagedata.data.section = "default";
	pagedata.data.category="userConfig";
	try {
		tids = JSON.parse(args);
	} 
	catch (e) {
		tids = [];
	}
	for (let i = 0 ; i < tids.length ; i++) 	pagedata.remoteTidArr[i] = JSON.stringify(tids[i]);
	var messageBox = document.getElementById("tiddlyclip-message-box");
	if(messageBox) {
		// Create the message element and put it in the message box
		var message = document.createElement("div");
		message.setAttribute("data-tiddlyclip-category",pagedata.data.category);
		message.setAttribute("data-tiddlyclip-pageData",JSON.stringify(pagedata));
		message.setAttribute("data-tiddlyclip-currentsection",table0InConfig);
		messageBox.appendChild(message);
		//console.log("tid appended ",pagedata.data.pageData);
		// Create and dispatch the custom event to the extension
		var event = document.createEvent("Events");
		event.initEvent("tiddlyclip-save-file",true,false);
		message.dispatchEvent(event);
		console.log("dataNew event sent");
	}
	return true; // Action was invoked
});
