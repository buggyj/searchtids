console.log("enter preload");
const {ipcRenderer} = require("electron");
document.addEventListener('DOMContentLoaded', injectMessageBox, false);
const table0InConfig = 0;//indicates first table in config(default)



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
			 msg = {};
			msg.action = message.getAttribute("data-action");
			
			msg.filepaths = message.getAttribute("data-text");
			msg.search = message.getAttribute("data-aux");
			//msg.extra = message.getAttribute("data-extra");
			
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
/*			
			var msg = {};
			msg.search = {title:"xxtag",tag:"z",text:"test"};
			msg.filepaths=["C:\\Users\\jeffr\\Downloads\\tiddlywikilocations\\devtest.html",
                 "C:\\Users\\jeffr\\Downloads\\tiddlywikilocations\\minisforum.html"];
			ipcRenderer.send("savefile",msg);
*/
