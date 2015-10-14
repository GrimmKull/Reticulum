//var Reticulum = {};

var Transport = function(app, server, port, protocol) {
	this.app = app;
	if (!protocol) protocol = "wss";
	this.ws = null;
	this.protocol = protocol;
	this.server = server; //"ws://localhost:3001";
	this.port = port;

	//this.onData = null;
	//this.onData = function(msg, source) {console.log("Original");};
};

Transport.prototype.isSecure = function() {
	return (this.protocol === "wss");
};

Transport.prototype.isReliable = function() {
	return true;
};

/*Transport.prototype.onData = function(msg, source) {
	console.log("Original");
};*/

Transport.prototype.connect = function() {
	//try {
		this.ws = new WebSocket(this.protocol + "://" + this.server + ":" + this.port, "sip");
		console.log("[CONNECT]");
		//console.log("Socket state:", this.ws.readyState);

		this.ws.onopen = function() {
			//addMessage("Socket status: "+socket.readyState+" (open)");
			console.log("[OPENED]");
		};

		this.ws.onclose = function() {
			//addMessage("Socket status: "+socket.readyState+" (closed)");
			console.log("[CLOSED]");
		};

		var stack = this.app.stack;

		this.ws.onmessage = function(msg) {
			//console.log("ON MSG",  msg);
			//console.log("[AAAAA]", transport)
			//console.log("[BBBBB]", msg)

			stack.onData(msg.data, Reticulum.Parser.parseAddress(msg.origin).uri.host);
		};

		this.ws.onerror = function(event) {
			console.log("/\\/\\/\\/\\/\\/\\/\\/\\/\\");
			console.log(error);
			console.log("\\/\\/\\/\\/\\/\\/\\/\\/\\/");
		};

		/*this.ws.onmessage = function(msg) {
			//addMessage("Received: "+msg.data);
		}*/
	//} catch(exception) {
		//addMessage("Error: " + exception);
	//}
};

Transport.prototype.listen = function(callback) {
	this.ws.onmessage = callback;
};

Transport.prototype.send = function(data) {
	//console.log("transport", data);
	try {
		this.ws.send(data);
		//addMessage("Sent: "+text)
	} catch(exception) {
		//addMessage("Failed to send.");
	}
};

Transport.prototype.disconnect = function() {
	console.log("[DISCONNECT]");
	this.ws.close();
};
