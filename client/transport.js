var Transport = function(app, server, port, protocol) {
	this.app = app;
	if (!protocol) protocol = "wss";
	this.ws = null;
	this.protocol = protocol;
	this.server = server;
	this.port = port;
};

Transport.prototype.isSecure = function() {
	return (this.protocol === "wss");
};

Transport.prototype.isReliable = function() {
	return true;
};

Transport.prototype.connect = function() {
	//try {
		var server = this.server;
		if (this.port !== "") server += ":" + this.port;

		this.ws = new WebSocket(this.protocol + "://" + server + "/ws", "sip");
		console.log("[CONNECT]");
		//console.log("Socket state:", this.ws.readyState);

		this.ws.onopen = function() {
			console.log("[OPENED]");
		};

		this.ws.onclose = function() {
			console.log("[CLOSED]");
		};

		var stack = this.app.stack;

		this.ws.onmessage = function(msg) {
			stack.onData(msg.data, Reticulum.Parser.parseAddress(msg.origin).uri.host);
		};

		this.ws.onerror = function(error) {
			console.log("/\\/\\/\\/\\/\\/\\/\\/\\/\\");
			console.log(error);
			console.log("\\/\\/\\/\\/\\/\\/\\/\\/\\/");
		};

	//} catch(exception) {
		//addMessage("Error: " + exception);
	//}
};

Transport.prototype.listen = function(callback) {
	this.ws.onmessage = callback;
};

Transport.prototype.send = function(data) {
	try {
		this.ws.send(data);
	} catch(exception) {
	}
};

Transport.prototype.disconnect = function() {
	console.log("[DISCONNECT]");
	this.ws.close();
};
