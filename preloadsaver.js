
/*
 * parts of this file is from https://github.com/Jermolene/TiddlyWiki5
 * which is licensed under the BSD format copyright Jermolene Ruston
 */
 console.log("enter preload");
document.addEventListener('DOMContentLoaded', injectMessageBox, false);


const {ipcRenderer} = require("electron");

var backup = true;
var tw5 = true;
/*
 * we may want to download a dummy file and use the download api to see 
 * if it lands in the correct dir,
 * the backgound would set a value we read here and if set save a test file.
 */
 	
function currentlocation() {
		// Get the pathname of this document
		var pathname = window.location.toString().split("#")[0];
		// Replace file://localhost/ with file:///
		if(pathname.indexOf("file://localhost/") === 0) {
			pathname = "file://" +pathname.substr(16);
		}
		// Windows path file:///x:/blah/blah --> x:\blah\blah
		if(/^file\:\/\/\/[A-Z]\:\//i.test(pathname)) {
			// Remove the leading slash and convert slashes to backslashes
			pathname = decodeURI(pathname.substr(8)).replace(/\//g,"\\");
		// Firefox Windows network path file://///server/share/blah/blah --> //server/share/blah/blah
		} else if(pathname.indexOf("file://///") === 0) {
			pathname = "\\\\" + decodeURI(pathname.substr(10)).replace(/\//g,"\\");
		// Mac/Unix local path file:///path/path --> /path/path
		} else if(pathname.indexOf("file:///") === 0) {
			pathname = decodeURI(pathname.substr(7));
		// Mac/Unix local path file:/path/path --> /path/path
		} else if(pathname.indexOf("file:/") === 0) {
			pathname = decodeURI(pathname.substr(5));
		// Otherwise Windows networth path file://server/share/path/path --> \\server\share\path\path
		} else {
			pathname = "\\\\" + decodeURI(pathname.substr(7)).replace(new RegExp("/","g"),"\\");
		}
		
		return pathname;
	}
 
function isTiddlyWikiClassic(doc) {
		// Test whether the document is a TiddlyWiki (we don't have access to JS objects in it)
		var versionArea = doc.getElementById("versionArea");
		return (doc.location.protocol === "file:") &&
			doc.getElementById("storeArea") &&
			(versionArea && /TiddlyWiki/.test(versionArea.text));
}

var debouncing =[];

function injectMessageBox(doc) {
	var s, savetiddlers = "savetiddlers";
	doc = document;
	console.log ("savetiddlers: injectMessageBox");

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
			path = currentlocation();
		// Remove the message element from the message box
		message.parentNode.removeChild(message);
		// Save the file

		if (debouncing[path]) return;
		debouncing[path] = true;
		saveFile(path,content,backup,tw5,function(response) {
			// Send a confirmation message
			debouncing[path] = false;
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
		});
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


