//var SIP = {};

var EXISTS = function(obj) {
	if (obj === undefined) return false;

	if (obj === null) return false;

	return true;
};

var HAS = function(obj, prop) {
	if (obj === undefined) console.log("Object is undefined");
	if (obj === null) console.log("Object is null");

	if (!obj) return false;

	//console.log("Object of type " + typeof obj + " - " + obj.constructor.name);

	if (obj.hasOwnProperty(prop) === undefined) {
		console.log(obj.constructor.name, "property", prop, "undefined");
		return false;
	}

	if (obj.hasOwnProperty(prop) === null) {
		console.log(obj.constructor.name, "property", prop, "null");
		return false;
	}

	if (!(obj.prop instanceof Function)) {
		console.log(obj.constructor.name, "property", prop, "not function");
		return false;
	}

	return true;
};

function HashTable(obj)
{
	this.length = 0;
	this.items = {};
	for (var p in obj) {
		if (obj.hasOwnProperty(p)) {
			this.items[p] = obj[p];
			this.length++;
		}
	}

	this.setItem = function(key, value)
	{
		var previous;// = undefined;
		if (this.hasItem(key)) {
			previous = this.items[key];
		}
		else {
			this.length++;
		}
		this.items[key] = value;
		return previous;
	};

	this.getItem = function(key) {
		return this.hasItem(key) ? this.items[key] : null;
	};

	this.hasItem = function(key)
	{
		return this.items.hasOwnProperty(key);
	};

	this.removeItem = function(key)
	{
		if (this.hasItem(key)) {
			previous = this.items[key];
			this.length--;
			delete this.items[key];
			return previous;
		}
		else {
			return null;
		}
	};

	this.keys = function()
	{
		var keys = [];
		for (var k in this.items) {
			if (this.hasItem(k)) {
				keys.push(k);
			}
		}
		return keys;
	};

	this.values = function()
	{
		var values = [];
		for (var k in this.items) {
			if (this.hasItem(k)) {
				values.push(this.items[k]);
			}
		}
		return values;
	};

	this.each = function(fn) {
		for (var k in this.items) {
			if (this.hasItem(k)) {
				fn(k, this.items[k]);
			}
		}
	};

	this.clear = function()
	{
		this.items = {};
		this.length = 0;
	};
}

var Message = {};

Message.createRequest = function(method, uri, headers, content) {
    //console.log("CREATE:", method, "request");
    var message = new Reticulum.SIP.Message();
	message.isRequest = true;
    message.method = method;
	message.uri = uri;
	message.version = "SIP/2.0";

	// TODO: check if headers are being sent and go through them all one by one
	if (EXISTS(headers)) console.log("ADD HEADERS");
	// TODO: add content to message if EXISTS
    //Message._populateMessage(m, headers, content)
    if (EXISTS(message.cseq) && message.cseq.method !== method)
		message.addHeader("CSeq", Reticulum.Parser.Enum.SIP_HDR_CSEQ, message.cseq.number + ' ' + method);

    return message;
};

Message.createResponse = function (response, responsetext, headers, content, request) {
	//console.log("CREATE:", response, "response");
    // Create a new response Message with given attributes. The original request may be specified as the r parameter
    var message = new Reticulum.SIP.Message();
	message.isRequest = false;
    message.statusCode = response;
	message.reason = responsetext;
	message.version = 'SIP/2.0';

    if (EXISTS(request)) {
		//console.log("Created for req:", request.toString());
        message.to = request.to;
		message.addHeader("To", Reticulum.Parser.Enum.SIP_HDR_TO, request.to.value);
		message.addHeader("From", Reticulum.Parser.Enum.SIP_HDR_FROM, request.from.value);
		message.CSeq = request.CSeq;
		message.addHeader("CSeq", Reticulum.Parser.Enum.SIP_HDR_CSEQ, request.cseq.number + ' ' + request.cseq.method);
		message.addHeader("Call-ID", Reticulum.Parser.Enum.SIP_HDR_CALL_ID, request.callid);
		message.addHeader("Via", Reticulum.Parser.Enum.SIP_HDR_VIA, request.via.value);

		// TODO: make sure to implement support for Timestamp header in parser and addHeader
        if (response === 100) message.timestamp = request.timestamp;
	}

	// TODO: check if headers are being sent and go through them all one by one
	if (EXISTS(headers)) console.log("ADD HEADERS");
	// TODO: add content to message if EXISTS
    // Message._populateMessage(m, headers, content)

	//console.log(message.toString());
    return message;
};

var Stack = function(app, transport) {
	this.tag = Utils.uuid();//str(random.randint(0,2**31));
	this.app = app;
	this.transport = transport;
	this.closing = false;
	this.dialogs = new HashTable();
	this.transactions = new HashTable();
	//this.serverMethods = ['INVITE','BYE','MESSAGE','SUBSCRIBE','NOTIFY'];
};

Stack.prototype.delete = function() {
	this.closing = true;
	this.dialogs.clear();
	this.transactions.clear();
};

Stack.prototype.uri = function() {
	// Construct URI for transport
	var uri = this.transport.isSecure() ? "sips" : "sip";
	uri += ":" + this.transport.server + ":" + this.transport.port;

	return uri;

	//return Reticulum.SIP.formatURI(this.transport, this.transport.isSecure());
};

Stack.prototype.createCallID = function() {
	var host = this.transport.host;

	if (!EXISTS(host))
		host = "localhost";

	return Utils.uuid() + "@" + host;
};

Stack.prototype.createVia = function(secure) {
	if (!EXISTS(this.transport)) {
		console.log("No transport in stack");
		return null;
	}

	if (secure && !this.trasport.isSecure()) {
		console.log("No secure transport in stack");
		return null;
	}

	return Reticulum.Parser.parseVia("SIP/2.0/" + this.transport.protocol.toUpperCase() + " " + self.transport.server + ":" + self.transport.port + ";rport");
};

Stack.prototype.send = function(message, destination) {
	//console.log("[SEND]");
	// Send a data (Message) to given dest (URI or hostPort), or using the Via header of response message if dest is missing.
	if (!message.isRequest && !EXISTS(destination)) {
		if (HAS(message.via, 'sentby')) {
			destination = message.via.sentby;
		}
	}

	console.log("SENT!", message.isRequest ? message.method : message.statusCode, "to", destination, "-", message.to.auri);
console.log(message);
console.log(message.toString());
	this.app.send(message.toString(), destination);
};

Stack.prototype.onData = function(data, source) {
	//try {
		var message = Reticulum.Parser.parse(data);
console.log("GOT!", message.isRequest ? message.method : message.statusCode, "from", source.name, "-", message.from.auri);
		if (!EXISTS(message)) throw("Received invalid message");

		//var uri = Reticulum.SIP.formatURI(source, this.transport.isSecure());//this.transport.isSecure() ? "sips" : "sip";
		//uri += ":" + source.host + ":" + source.port;

		if (message.isRequest) {
			if (!EXISTS(message.via)) throw("No via header in request");
//console.log(message.via);
			if (message.via.host.name !== source.name || message.via.port !== source.port) {
				message.via.received = source.name;
				message.via.host.name = source.name;
			}

			if (EXISTS(message.via.rport)) {
				messsage.via.rport  = source.port;
				message.via.uri.port = source.port;
			}

			// force rport for TCP
			if (this.transport.type === "tcp") {
				message.via.rport = source.port;
				message.via.port = source.port;
			}

			this.handleRequest(message);
		} else {
			this.handleResponse(message);
		}

	/*} catch(error) {
		console.log(error);
		self.send(Message.createResponse(400, error.message, null, null, message));
	}*/
};

Stack.prototype.handleRequest = function(message, uri) {
	var transaction = null;
	var dialog = null;
	var layer = null; // processing layer depending on the message type (transaction, dialog, user agent core)
	var core = null;

	var branch = message.via.branch;

	if (message.method === "ACK") {
		transaction = this.findTransaction(branch);

		if (transaction === null || (transaction.lastResponse !== null && transaction.lastResponse.is2xx())) {
			transaction = this.findTransaction(Transaction.createId(branch, message.method));
		}
	} else {
		transaction = this.findTransaction(Transaction.createId(branch, message.method));
	}

	if (!EXISTS(transaction)) {
		if (message.method !== "CANCEL" && message.to.tag !== null) {
			dialog = this.findDialog(message);

			if (!EXISTS(dialog)) {
				if (message.method !== "ACK") {
					core = this.createServer(message, uri);//this.ua;//createUA(message);

					if (EXISTS(core)) {
						layer = core;
					} else {
						this.send(Message.createResponse(481, "Dialog does not exist", null, null, message));
						return;
					}
				} else {
					if (branch !== "0") {
						transaction = this.findTransaction(Transaction.createId(branch, "INVITE"));

						if (EXISTS(transaction) && transaction.state !== "TERMINATED") {
							transaction.onRequest(message);
							return;
						} else {
							core = this.createServer(message, uri);//this.ua;//createUA(message);

							if (EXISTS(core)) {
								layer = core;
							} else {
								return;
							}
						}
					}
				}
			} else {
				layer = dialog;
			}
		} else if (message.method !== "CANCEL") {
			// TODO: check if UA exists here or do we need to create one
			core = this.createServer(message, uri);//this.ua;//createUA(message);

			if (EXISTS(core)) {
				layer = core;
			} else if (message.method === "OPTIONS") {
				var msg = Message.createResponse(200, "OK", null, null, message);
				msg.addHeader("Allow", Reticulum.Parser.Enum.SIP_HDR_ALLOW, "INVITE, ACK, CANCEL, BYE, OPTIONS");

				this.send(msg);
				return;
			} else if (message.method !== "ACK") {
				this.send(Reticulum.SIP.formatResponse(405, "Method not allowed", null, null, message));
				return;
			}
		} else {
			transaction = this.findTransaction(Transaction.createId(branch, "INVITE"));

			if (!EXISTS(transaction)) {
				this.send(Message.createResponse(481, "Original transaction does not exist", null, null, message));
				return;
			} else {
				layer = transaction.layer;
			}
		}

		//console.log("LAYER",layer)
		if (EXISTS(layer)) {
			transaction = layer.createTransaction(message);

			if (message.method === "ACK" && transaction !== null && this.transactions.getItem(transaction.id) !== undefined) {
				// remove transaction
				this.transactions.removeItem(transaction.id);
			}
		} else if (message.method !== "ACK") {
			//console.log("404040404040404040404040404");
			return
			this.send(Message.createResponse(404, "Not found", null, null, message));
		}
	} else {
		if (transaction.isServer) {
			transaction.onRequest(message);
		} else {
			this.send(Message.createResponse(482, "Loop detected", null, null, message));
		}
	}
};

Stack.prototype.handleResponse = function(message) {
	//console.log("Stack on response");
	var branch = message.via.branch;
	var transaction = this.findTransaction(Transaction.createId(branch, message.method));
	var dialog = null;

	if (transaction === null) {
console.log("Transaction for resp not found", Transaction.createId(branch, message.method), message);
		if (message.method === "INVITE" && message.is2xx()) {
			dialog = this.findDialog(message);

			if (dialog === null) {
				console.log("Error, no dialog found for response", message.statusCode, "to", message.method);
			} else {
				dialog.onResponse(null, message);
			}
		} else {
			if (message.method === "INVITE" && message.isFinal()) {
				//console.log("CREATE ACK 1", message.to.auri)
				var msg = Message.createRequest("ACK", message.to.uri);

				// TODO: missing CSeq header
				//console.log(message.from.value, message.from)
				msg.addHeader("To", Reticulum.Parser.Enum.SIP_HDR_TO, message.to.value);
				msg.addHeader("From", Reticulum.Parser.Enum.SIP_HDR_FROM, message.from.value);
				msg.addHeader("Call-ID", Reticulum.Parser.Enum.SIP_HDR_CALL_ID, message.callid);
				msg.addHeader("CSeq", Reticulum.Parser.Enum.SIP_HDR_CSEQ, message.cseq.number + " ACK");
				msg.addHeader("Via", Reticulum.Parser.Enum.SIP_HDR_VIA, message.via.value);

				//console.log("ACK!!!",message, msg)

				this.send(msg);
			}
		}
	} else {
		transaction.onResponse(message);
	}
};

Stack.prototype.createServer = function(request, uri) {
	return this.app.createServer(request, uri, this);
};

Stack.prototype.sending = function(ua, message) {
	//console.log("sending " + this.app);
	if (HAS(this.app, 'sending')) return this.app.sending(ua, message, this);

	return null;
};

Stack.prototype.onRequest = function(ua, request) {
	//console.log(this.app);
	this.app.onRequest(ua, request, this);
};

Stack.prototype.onResponse = function(ua, response) {
	//console.log("simple stack on response", this.app);
	this.app.onResponse(ua, response, this);
};

Stack.prototype.cancelled = function(ua, request) {
	this.app.cancelled(ua, request, this);
};

Stack.prototype.dialogCreated = function(dialog, ua) {
	this.app.dialogCreated(dialog, ua, this);
};

Stack.prototype.authenticate = function(ua, header) {
	if (HAS(this.app, 'authenticate'))
		return this.app.authenticate(ua, header, self);

	return false;
};

// TODO: implement Timers
Stack.prototype.createTimer = function(obj) {
// 	return this.app.createTimer(obj, this);
	return new Timer(obj);
};

Stack.prototype.findDialog = function(arg) {
	//console.log("find dlg argument", typeof arg);
	var dialog = this.dialogs.getItem(Dialog.extractId(arg));

	return dialog;
};

Stack.prototype.findTransaction = function(id) {
	return this.transactions.getItem(id);
};

/*Stack.prototype.findOtherTransaction = function(request, original) {
	return null;
};*/

var Transaction = function(server) {
	this.branch = null;
	this.id = null;
	this.stack = null;
	this.app = null;
	this.request = null;
	this.transport = null;
	this.remote = null;
	this.tag = null;

	this.server = server;
	this.timers = new HashTable();
	this.timerconfs = new TimerConfs();
};

Transaction.prototype.close = function() {
	this.stopTimers();

	if (EXISTS(this.stack)) {
		if (EXISTS(this.stack.transactions.getItem(this.id))) {
			this.stack.transactions.removeItem(this.id);
		}
	}
};

Transaction.prototype.setState = function(value) {
	this.state = value;

	if (this.state === "TERMINATED") this.close();
};

Transaction.prototype.getState = function() {
	return this.state;
};

// NOTE: use server BOOL paramter to differentiate between server and client transaction branches
Transaction.createBranch = function(request/*, server*/) {
	/*var to = request.to.raw.toLowerCase();
	var from = request.from.raw.toLowerCase();
	var callid = request.callid;
	var cseq = request.cseq.raw;

	var data = to + '|' + from + '|' + callid + '|' + cseq + '|' + server;*/
	//return 'z9hG4bK' + urlsafe_b64encode(md5(data).digest()).replace('=','.');
	var branch = "z9hG4bK";
	branch += Utils.token(15-7, Utils.TOKEN_NUMERIC_16);

	return branch;
};

Transaction.createId = function(branch, method) {
	if (method !== "ACK" && method !== "CANCEL")
		return branch;
	else
		return branch + "|" + method;
};

Transaction.createServer = function(stack, app, request, transport, tag, start) {
	var transaction = null;

	if (request.method === "INVITE")
		transaction = new InviteServerTransaction();
	else
		transaction = new ServerTransaction();

	transaction.isServer = true;

	transaction.stack = stack;
	transaction.app = app;
	transaction.request = request;
	transaction.transport = transport;
	transaction.tag = tag;
	if (HAS(request.via, "sentby")) transaction.remote = request.via.sentby;
	if (EXISTS(request.via) /*&& HAS(request.via, "branch")*/)
		transaction.branch = request.via.branch;
	else
		transaction.branch = Transaction.createBranch(request);

	transaction.id = Transaction.createId(transaction.branch, request.method);
	stack.transactions.setItem(transaction.id, transaction);
	if (start === true)
		transaction.start();
	else
		transaction.state = "TRYING";

	return transaction;
};

Transaction.createClient = function(stack, app, request, transport, remote) {
	var transaction = null;

	if (request.method === "INVITE")
		transaction = new InviteClientTransaction();
	else
		transaction = new ClientTransaction();

	transaction.isServer = false;

	transaction.stack = stack;
	transaction.app = app;
	transaction.request = request;
	transaction.transport = transport;
	transaction.remote = remote;

	if (EXISTS(request.via) /*&& HAS(request.via, "branch")*/)
		transaction.branch = request.via.branch;
	else
		transaction.branch = Transaction.createBranch(request);

	transaction.id = Transaction.createId(transaction.branch, request.method);
	stack.transactions.setItem(transaction.id, transaction);
	transaction.start();

	return transaction;
};

Transaction.prototype.createAck = function () {
	var message = null;

	if (EXISTS(this.request) && !this.isServer) {
		//console.log("CREATE ACK 2", this.request.uri)
		message = Message.createRequest("ACK", this.request.uri/*, this.headers*/);

		// TODO: check if headers are correct and don't overwrite already present headers
		message.addHeader("Call-ID", Reticulum.Parser.Enum.SIP_HDR_CALL_ID, request.callid);
		message.addHeader("From", Reticulum.Parser.Enum.SIP_HDR_FROM, request.from.value);
		message.addHeader("To", Reticulum.Parser.Enum.SIP_HDR_TO, request.to.value);
		message.addHeader("CSeq", Reticulum.Parser.Enum.SIP_HDR_CSEQ, request.cseq.number + request.cseq.method);
	}

	//console.log("TRANSA ACK", message);

	return message;
};

Transaction.prototype.createCancel = function () {
	var message = null;

	if (EXISTS(this.request) && !this.isServer) {
		message = Message.createRequest('CANCEL', this.request.uri/*, this.headers*/);

		// TODO: check if headers are correct and don't overwrite already present headers
		message.addHeader("Call-ID", Reticulum.Parser.Enum.SIP_HDR_CALL_ID, request.callid);
		message.addHeader("From", Reticulum.Parser.Enum.SIP_HDR_FROM, request.from.value);
		message.addHeader("To", Reticulum.Parser.Enum.SIP_HDR_TO, request.to.value);
		message.addHeader("CSeq", Reticulum.Parser.Enum.SIP_HDR_CSEQ, request.cseq.number + request.cseq.method);
	}

	// TODO: completely copy all request route headers
	if (EXISTS(message) && this.request.route)
		message.route = this.request.route;

	//console.log("TRANSA CANCEL", message);

	return message;
};

Transaction.prototype.createResponse = function (response, responsetext) {
	var message = null;

	if (EXISTS(this.request) && this.isServer)
		message = Message.createResponse(response, responsetext, null, null, this.request);

	if (response !== 100 && !HAS(message.to, "tag"))
		message.to.tag = this.tag;

	//console.log("TRANSA RESP", this.isServer, response, this.request, message);

	return message;
};

Transaction.prototype.startTimer = function(name, timeout) {
	if (timeout <= 0) return;

	var timer = this.timers.getItem(name);
	if (!EXISTS(timer)) {
		// TODO: fix timer creation
		timer = this.stack.createTimer(this);
		this.timers.setItem(name, timer);
	}

	//timer.delay = timeout;
	timer.start(timeout);
};

Transaction.prototype.stopTimers = function() {
	//for (var i = 0; i < this.timers.length; i++) timers[i].stop();
	this.timers.each(function(timer) {timer.stop();});

	this.timers.clear();
};

Transaction.prototype.timedout = function(timer) {
	if (timer.isRunning()) timer.stop();

	var t = this.findTimer(timer);

	if (EXISTS(t)) {
		this.timeout(t, timer.delay);
		t.delete();
	}
};

var TimerConfs = function(t1, t2, t4) {
	this.t1 = t1;
	this.t2 = t2;
	this.t4 = t4;

	// Load defaults
	if (!EXISTS(t1)) this.t1 = 500;
	if (!EXISTS(t2)) this.t2 = 4000;
	if (!EXISTS(t4)) this.t4 = 5000;

	this.A = this.t1;
	this.B = this.t1*64;
	this.D = Math.max(this.t1*64,32000);
	this.E = this.A;
	this.F = this.B;
	this.G = this.A;
	this.H = this.B;
	this.I = this.t4;
	this.J = this.B;
	this.K = this.I;
};

var Timer = function(obj) {
	this.ticker = null;
	this.callback = function () {
		// TODO: make sure that timedout is called and that the ticker is set to null
		obj.timedout();
		// NOTE: this might not be necessary since timer might be null on timeout by default
		this.ticker = null;
	};
};

Timer.prototype.start = function (timeout) {
	this.ticker = window.setTimeout(this.callback, timeout);
};

Timer.prototype.stop = function () {
	window.clearTimeout(this.ticker);
	this.ticker = null;
};

Timer.prototype.isRunning = function() {
	return ticker !== null;
};

var ClientTransaction = function() {
	Transaction.call(this, false);
};

ClientTransaction.prototype = Object.create(Transaction.prototype);

ClientTransaction.prototype.constructor = ClientTransaction;

ClientTransaction.prototype.start = function() {
	//console.log("[client trans start]", this);
	this.state = "TRYING";

	if (!this.transport.isReliable()) this.startTimer("E", this.timerconfs.E);

	this.startTimer("F", this.timerconfs.F);
	this.stack.send(this.request, this.remote, this.transport);
};

ClientTransaction.prototype.onResponse = function(response) {
	//console.log("ct on response");
	if (response.is1xx()) {
		if (this.state === "TRYING") {
			this.state = "PROCEEDING";
			this.app.onResponse(this, response);
		} else if (this.state === "PROCEEDING") {
			this.app.onResponse(this, response);
		}
	} else if (response.isFinal()) {
		if (this.state === "TRYING" || this.state === "PROCEEDING") {
			this.state = "COMPLETED";
			this.app.onResponse(this, response);
			if (!this.transport.isReliable()) {
				this.startTimer('K', this.timerconfs.K);
			} else {
				this.timeout('K', 0);
			}
		}
	}
};

ClientTransaction.prototype.timeout = function(name, timeout) {
	if (this.state === "TRYING" || this.state === "PROCEEDING") {
		if (name === "E") {
			if (this.state == "TRYING")
				timeout = Math.min(2*timeout, this.timerconfs.t2);
			else
				timeout = this.timerconfs.t2;

			this.startTimer("E", timeout);
			this.stack.send(this.request, this.remote, this.transport);
		} else if (name === "F") {
			this.state = "TERMINATED";
			this.app.timeout(this);
		}
	} else if (this.state === "COMPLETED") {
		if (name === "K") this.state = "TERMINATED";
	}
};

ClientTransaction.prototype.error = function(error) {
	if (this.state === "TRYING" || this.state === "PROCEEDING") {
		this.state = "TERMINATED";
		this.app.error(this, error);
	}
};

var ServerTransaction = function() {
	Transaction.call(this, true);
};

ServerTransaction.prototype = Object.create(Transaction.prototype);

ServerTransaction.prototype.constructor = ServerTransaction;

ServerTransaction.prototype.start = function() {
	this.state = "TRYING";
	this.app.onRequest(this, this.request);
};

ServerTransaction.prototype.onRequest = function(request) {
	if (this.request.method === request.method) {
		//console.log("RETRANSMISSION!!!")
		// handle retransmition
		if (this.state === "PROCEEDING" || this.state === "COMPLETED")
			this.stack.send(this.lastResponse, this.remote, this.transport);
	}
};

ServerTransaction.prototype.timeout = function(name, timeout) {
	if (this.state === "COMPLETED")
		if (name === "J") this.state = "TERMINATED";
};

ServerTransaction.prototype.error = function(name, timeout) {
	if (this.state === "COMPLETED") {
		this.state = "TERMINATED";
		this.app.error(error);
	}
};

ServerTransaction.prototype.sendResponse = function(response) {
	// save for retransmission
	this.lastResponse = response;
	if (response.is1xx()) {
		if (this.state === "TRYING" || this.state === "PROCEEDING") {
			this.state = "PROCEEDING";
			this.stack.send(response, this.remote, this.transport);
		}
	} else if (response.isFinal()) {
		if (this.state === "PROCEEDING" || this.state === "TRYING") {
			this.state = "COMPLETED";
			this.stack.send(response, this.remote, this.transport);
			if (!this.transport.isReliable())
				this.startTimer("J", this.timerconfs.J);
			else
				this.timeout("J", 0);
		}
	}
};

var InviteClientTransaction = function() {
	Transaction.call(this, false);
};

InviteClientTransaction.prototype = Object.create(Transaction.prototype);

InviteClientTransaction.prototype.constructor = InviteClientTransaction;

InviteClientTransaction.prototype.start = function() {
	this.state = "CALLING";
	// NOTE: No need for this the transport is reliable
	if (!this.transport.isReliable()) this.startTimer("A", this.timerconfs.A);
	this.startTimer("B", this.timerconfs.B);
	this.stack.send(this.request, this.remote, this.transport);
};

InviteClientTransaction.prototype.onResponse = function(response) {
	//console.log("ict on response");
	if (response.is1xx()) {
		if (this.state === "CALLING") {
			this.state = "PROCEEDING";
			this.app.onResponse(this, response);
		} else if (this.state === "PROCEEDING") {
			this.app.onResponse(this, response);
		}
	} else if (response.is2xx()) {
		if (this.state === "CALLING" || this.state === "PROCEEDING")
			this.state = "TERMINATED";
			this.app.onResponse(this, response);
	} else {
		if (this.state === "CALLING" || this.state === "PROCEEDING") {
			this.state = "COMPLETED";
			this.stack.send(this.createAck(response), this.remote, this.transport);
			this.app.onResponse(this, response);
			if (!this.transport.isReliable())
				this.startTimer("D", this.timerconfs.D);
			else
				this.timeout("D", 0);
		} else if (this.state == "COMPLETED") {
			this.stack.send(this.createAck(response), this.remote, this.transport);
		}
	}
};

InviteClientTransaction.prototype.timeout = function(name, timeout) {
	if (this.state === "CALLING") {
		if (name === "A") {
			this.startTimer("A", 2*timeout);
			this.stack.send(this.request, this.remote, this.transport);
		} else if (name === "B") {
			this.state = "TERMINATED";
			this.app.timeout(this);
		}
	} else if (this.state === "COMPLETED") {
		if (name === "D") {
			this.state = "TERMINATED";
		}
	}
};

InviteClientTransaction.prototype.error = function(error) {
	if (this.state === "CALLING" || this.state === "COMPLETED") {
		this.state = "TERMINATED";
		this.app.error(this, error);
	}
};

InviteClientTransaction.prototype.createACK = function(response) {
	var message = null;

	if (!EXISTS(this.request)) console.log("There is no request in this Transaction");

	var to = this.request.to;
	if (EXISTS(response)) to = response.to;

//console.log("CREATE ACK 3", this.request.uri)
	message = Message.createRequest("ACK", this.request.uri);

	message.addHeader("Call-ID", Reticulum.Parser.Enum.SIP_HDR_CALL_ID, this.request.callid);
	message.addHeader("From", Reticulum.Parser.Enum.SIP_HDR_FROM, this.request.from.value);
	message.addHeader("To", Reticulum.Parser.Enum.SIP_HDR_TO, to.value);
	message.addHeader("CSeq", Reticulum.Parser.Enum.SIP_HDR_CSEQ, this.request + " ACK");
	message.addHeader("Via", Reticulum.Parser.Enum.SIP_HDR_VIA, this.via.value);

	// TODO: copy the request route completely
	if (this.request.route) message.route = this.request.route;

	//console.log("INVC ACK", message);

	return message;
};

var InviteServerTransaction = function() {
	Transaction.call(this, false);
};

InviteServerTransaction.prototype = Object.create(Transaction.prototype);

InviteServerTransaction.prototype.constructor = InviteServerTransaction;

InviteServerTransaction.prototype.start = function() {
	this.retrans = 0;
	this.state = "PROCEEDING";
	// NOTE: not needed on webphone side
	//this.sendResponse(this.createResponse(100, "Trying"));
	this.app.onRequest(this, this.request);
};

InviteServerTransaction.prototype.onRequest = function(request) {
	//console.log("ist on response");
	// retransmitted
	if (this.request.method === request.method) {
		if (this.state === "PROCEEDING" || this.state === "COMPLETED") {
			this.retrans = this.retrans + 1;
			console.log("Retransmittion #" + this.retrans +" INVITE response due to retransmission from remote endpoint");
			this.stack.send(this.lastResponse, this.remote, this.transport);
		}
	} else if (request.method === "ACK") {
		if (this.state === "COMPLETED") {
			this.state = "CONFIRMED";
			if (!this.transport.isReliable()) {
				this.startTimer("I", this.timerconfs.I);
			} else {
				this.timeout("I", 0);
			}
		}
	}
};

InviteServerTransaction.prototype.timeout = function(name, timeout) {
	if (this.state === "COMPLETED") {
		if (name === "G") {
			this.startTimer("G", Math.min(2*timeout, this.timerconfs.t2));
			this.retrans = this.retrans + 1;
			//console.log("Retransmittion #" + this.retrans + " INVITE response");
			this.stack.send(this.lastResponse, this.remote, this.transport);
		} else if (name === "H") {
			this.state = "TERMINATED";
			this.app.timeout(this);
		}
	} else if (this.state === "CONFIRMED") {
		if (name === "I") {
			this.state = "TERMINATED";
		}
	}
};

InviteServerTransaction.prototype.error = function(error) {
	if (this.state === 'PROCEEDING' || this.state === 'TRYING' || this.state === 'CONFIRMED') {
		this.state = 'TERMINATED';
		this.app.error(this, error);
	}
};

InviteServerTransaction.prototype.sendResponse = function(response) {
	this.retrans = 0;
	this.lastResponse = response;
	if (response.is1xx()) {
		if (this.state === 'PROCEEDING' || this.state === 'TRYING') {
			this.stack.send(response, this.remote, this.transport);
		}
	} else {
		if (this.state === 'PROCEEDING' || this.state === 'TRYING') {
			this.state = 'COMPLETED';
			if (!this.transport.isReliable()) {
				this.startTimer('G', this.timerconfs.G);
			}
			this.startTimer('H', this.timerconfs.H);
			this.stack.send(response, this.remote, this.transport);
		}
	}
};

var UACore = function(stack, request, server) {
	this.stack = stack;
	this.request = request;
	this.server = false;
	this.transaction = null;
	this.cancelRequest = null;
	this.local = null;
	this.remote = null;
	this.subject = null;
	this.secure = false;
	this.maxForwards = 70;
	this.routeSet = [];
	this.localTarget = null;
	this.remoteTarget = null;
	this.remoteCandidates = null;
	this.localSeq = 0;
	this.remoteSeq = 0;
	this.contact = Reticulum.Parser.parseAddress(stack.uri());

	if (EXISTS(request)) {
		this.callid = request.callid;
		this.remote = request.from;
		this.local = request.to;
		this.subject = request.subject;
		this.secure = request.uri.scheme === "sips";
	} else {
		this.callid = stack.createCallID();
	}

	this.remoteTag = null;
	this.localTag = Utils.token(10, Utils.TOKEN_NUMERIC_32);

	if (EXISTS(this.local) && EXISTS(this.local.uri.user))
		this.contact.uri.user = this.local.uri.user;

	// TODO: check if AutoACK is needed
	this.autoack = false;//true;
	this.auth = {};

	if (EXISTS(server))
		this.server = server;

	//console.log("UACORE construct", this);
};

UACore.prototype.createTransaction = function(request) {
	return Transaction.createServer(this.stack, this, request, this.stack.transport, this.stack.tag, true);
};

UACore.prototype.createRequest = function(method, content, contentType) {
	//console.log("UACore.prototype.createRequest", method);
	this.server = false;
	if (!EXISTS(this.remote)) throw "No remote party for UAC";
	if (!EXISTS(this.local)) this.local = "\"Anonymous\" <sip:anonymous@anonymous.invalid>";

	var uri = EXISTS(this.remoteTarget) ? this.remoteTarget : this.remote.uri;
	//console.log("AAAAAAAAAAAAAAAAAAA",uri, this.remoteTarget , this.remote.uri);

	if (method === "REGISTER") uri.user = null; // no uri.user in REGISTER
	if (!this.secure && uri.secure) this.secure = true;
	if (method != "ACK" && method != "CANCEL") this.localSeq = this.localSeq + 1;

	var request = new Reticulum.SIP.Message();

	request.isRequest = true;
	request.method = method;
	request.version = "SIP/2.0";

	request.uri = uri;

	request.addHeader("To", Reticulum.Parser.Enum.SIP_HDR_TO, this.remote.auri);

	request.to.uri.secure = this.secure;
	request.addHeader("From", Reticulum.Parser.Enum.SIP_HDR_FROM, this.local.auri);
	request.from.uri.secure = this.secure;
	request.from.tag = this.localTag;
	request.addHeader("CSeq", Reticulum.Parser.Enum.SIP_HDR_CSEQ, this.localSeq + ' ' + method);
	//request.CallId = Header(self.callId, 'Call-ID')
	request.addHeader("Call-ID", Reticulum.Parser.Enum.SIP_HDR_CALL_ID, this.callid);
	//request.MaxForwards = Header(str(self.maxForwards), 'Max-Forwards')
	//request.Via = self.stack.createVia(self.secure)
	//request.Via.branch = Transaction.createBranch([To.value, From.value, CallId.value, CSeq.number], False)
	var branch = Transaction.createBranch();
	request.addHeader("Via", Reticulum.Parser.Enum.SIP_HDR_VIA,"SIP/2.0/" + this.stack.transport.protocol.toUpperCase() + " " + this.stack.transport.server + ":" + this.stack.transport.port + ";branch=" + branch + ";rport");
	//console.log("[createRequest]", request, "SIP/2.0/" + this.stack.transport.protocol.toUpperCase() + " " + this.stack.transport.server + ":" + this.stack.transport.port + ";rport");


	// Transport adds other parameters such as maddr, ttl

	if (!this.localTarget) {
		this.localTarget = this.stack.uri();
		this.localTarget.user = this.local.uri.user;
	}
	// put Contact is every request. app may remove or override it.
	//TODO: add initial Contact header
	//request.Contact = Header(str(this.localTarget), 'Contact');
	//request.Contact.value.uri.secure = this.secure;

	// headers = [To, From, CSeq, CallId, MaxForwards, Via, Contact]

	// 	if self.routeSet:
	// 		for route in map(lambda x: Header(str(x), 'Route'), self.routeSet):
	// 			route.value.uri.secure = self.secure
	// 			#print 'adding route header', route
	// 			headers.append(route)
	// 	# app adds other headers such as Supported, Require and Proxy-Require
	if (contentType) headers.append(Header(contentType, 'Content-Type'));
	// 	self.request = Message.createRequest(method, str(uri), headers, content)
	// 	return self.request
	return request;
};

UACore.prototype.createRegister = function(aor) {
	if (aor) this.remote = Reticulum.Parser.parseAddress(aor);
	if (!this.local) this.local = Reticulum.Parser.parseAddress(this.remote);
	//console.log(aor, this.remote, this.local);
	return this.createRequest("REGISTER");
};

UACore.prototype.sendRequest = function(request) {
	//console.log(request);
	// Send a UAC request Message
	if (!EXISTS(this.request) && request.method === "REGISTER") {
		//console.log(this.transaction);
		if (EXISTS(this.transaction) && (this.transaction.state !== "COMPLETED" && this.transaction.state !== "TERMINATED")) {
			throw("Cannot re-REGISTER since pending registration");
		}
	}
	this.request = request; // store for future
//console.log(request);
	if (!EXISTS(request.route)) this.remoteTarget = request.uri;
	var target = this.remoteTarget;

	// TODO: implement routes support
	/*if (request.route) {
		var routes = request.getRoutes();
		if (len(routes) > 0) {
			target = routes[0].value.uri;
			if (!EXISTS(target) || target.params["lr"]) { // strict route
				routes.pop(); // ignore first route
				if (routes.length > 0) {
					// Add my route
					routes.append(Header(str(request.uri), 'Route'));
				}
				request.route = routes;
				request.uri = target;
			}
		}
	}*/

	// TODO: remove any Route header in REGISTER request

	this.stack.sending(this, request);

	var destination = target;
	destination.port = 5060;

	if (EXISTS(target.port)) destination.port = target.port;

	if (target.secure)  destination.port = 5061;
	/*if not isIPv4(dest.host):
		try: dest.host = gethostbyname(dest.host)
		except: pass
	if isIPv4(dest.host):
		self.remoteCandidates = [dest]*/

	//TODO: implement support for remote candidates
	// continue processing as if we received multiple candidates
	/*if (!EXISTS(this.remoteCandidates) || this.remoteCandidates.length === 0) {
		//self.error(None, 'cannot resolve DNS target')
		return;
	}
	target = this.remoteCandidates.pop(0);*/
	if (this.request.method != "ACK") {
	 	//start a client transaction to send the request
		this.transaction = Transaction.createClient(this.stack, this, this.request, this.stack.transport, target.hostPort);
	} else {// directly send ACK on transport layer
		this.stack.send(this.request, target.hostPort);
	}
};

UACore.canCreateDialog = function(request, response) {
	return response.is2xx() && (request.method === "INVITE" || request.method === "SUBSCRIBE");
};

UACore.prototype.onResponse = function(transaction, response) {
	//console.log("UACore on response");
	// Received a new response from the transaction.
	if (EXISTS(transaction) && transaction !== this.transaction) {
		console.log("Invalid transaction received", transaction, this.transaction);
		return;
	}

	// TODO: after enabling support for parsing multiple Via headers make sure to add this check
	//if (response.via.length > 1) console.log("More than one Via header in response");

	if (response.is1xx()) {
		if (this.cancelRequest) {
			// TODO: check where cancel needs to be stored
			var cancel = Transaction.createClient(this.stack, this, this.cancelRequest, transaction.transport, transaction.remote);
			this.cancelRequest = null;
		} else {
			this.stack.onResponse(this, response);
		}
	} else if (response.statusCode === 401 || response.statusCode === 407) { // authentication challenge
		if (!this.authenticate(response, this.transaction)) { // couldn't authenticate
			this.stack.onResponse(this, response);
		}
	} else {
		if (UACore.canCreateDialog(this.request, response)) {
			var dialog = Dialog.createClient(this.stack, this.request, response, transaction);
			this.stack.dialogCreated(dialog, this);
			this.stack.onResponse(dialog, response);

			if (this.autoack && this.request.method === "INVITE") {
				dialog.sendRequest(dialog.createRequest("ACK"));
			}
		} else {
			this.stack.onResponse(this, response);
		}
	}
};

	//# @implements RFC3261 P46L4-P49L28
	/*def receivedRequest(self, transaction, request):
*/
UACore.prototype.onRequest = function(transaction, request) {
	if (EXISTS(transaction) && EXISTS(this.transaction) && transaction !== this.transaction && request.method !== "CANCEL") {
		console.log("Invalid transaction for received request");
	}

	// upgrade this to a UAS
	this.server = true;

	//console.log("on request uri scheme:", request.uri.scheme);
	if (["sip", "sips", "urn"].indexOf(request.uri.scheme) === -1) {
		transaction.sendResponse(transaction.createResponse(416, "Unsupported URI scheme"));
		return;
	}

	// NOTE: might not be needed with good UA implementation
	// out of dialog request
	if (!HAS(request.to, "tag")) {
		// TODO: implement findOtherTransaction
		// request merging
		/*if (this.stack.findOtherTransaction(request, transaction)) {
			transaction.sendResponse(transaction.createResponse(482, "Loop detected - found another transaction"));
			return;
		}*/
	}

	// NOTE: not needed, no extensions support
	// if (request.require) {
	// 	if (request.method !== "CANCEL" && request.method !== "ACK") {
	// 		response = transaction.createResponse(420, "Bad extension");
	// 		response.unsupported = Header(str(request.Require.value), "Unsupported");
	// 		transaction.sendResponse(response);
	// 		return;
	// 	}
	// }

	// store the transaction
	if (EXISTS(transaction)) this.transaction = transaction;

	if (request.method === "CANCEL") {
		var original = this.stack.findTransaction(Transaction.createId(transaction.branch, "INVITE"));
		if (!EXISTS(original)) {
			transaction.sendResponse(transaction.createResponse(481, "Original transaction not found"));
			return;
		}

		if (original.state == "PROCEEDING" || original.state == "TRYING") {
			original.sendResponse(original.createResponse(487, "Request terminated"));
		}

		transaction.sendResponse(transaction.createResponse(200, "OK")); // CANCEL response

		this.stack.cancelled(this, request); // invoke cancelled on original UA instead of receivedRequest
		return;
	}

	this.stack.onRequest(this, request);
};

UACore.prototype.sendResponse = function(response, responseText, content, contentType, createDialog) {
	if (!EXISTS(this.request)) console.log("Invalid request in sending a response");

	if (typeof response === "number") response = this.createResponse(response, responsetext, content, contentType);

	if (createDialog && UACore.canCreateDialog(this.request, response)) {
		// TODO: ensure the record route is copyed correctly
		//if (EXISTS(this.request.record_route)) response.record_route = this.request.record_route;

		// TODO: implement contact header for response
		// if (!EXISTS(response.contact)) {
		// 	var contact = this.contact;
		// 	if (!contact.uri.host.name) contact.uri.user = this.request.To.value.uri.user;
		// 	contact.uri.secure = this.secure;
		// 	response.Contact = Header(str(contact), 'Contact')
		// }
		var dialog = Dialog.createServer(this.stack, this.request, response, this.transaction);
		this.stack.dialogCreated(dialog, this);
		this.stack.sending(dialog, response);
	} else {
		this.stack.sending(this, response);
	}

	if (!EXISTS(this.transaction)) {
		this.stack.send(response, response.via.sentby);
	} else {
		this.transaction.sendResponse(response);
	}
};

UACore.prototype.createResponse = function(responseCode, responseText, content, contentType) {
	var response = null;

	if (!EXISTS(this.request)) console.log("Invalid request in creating a response");
	response = Message.createResponse(responseCode, responseText, null, content, this.request);

	if (EXISTS(contentType)) headers.append(Header(contentType, 'Content-Type'));
	if (response.statusCode !== 100 && !HAS(response.to, "tag")) response.to.tag = this.localTag;
	return response;
};

UACore.prototype.sendCancel = function() {
	if (!EXISTS(self.transaction)) console.log('No transaction for sending CANCEL');

	this.cancelRequest = this.transaction.createCancel();
	if (this.transaction.state !== 'TRYING' && this.transaction.state !== 'CALLING') {
		if (this.transaction.state === 'PROCEEDING') {
			transaction = Transaction.createClient(this.stack, this, this.cancelRequest, this.transaction.transport, this.transaction.remote);
		}
		this.cancelRequest = null;
	}
};

UACore.prototype.timeout = function(transaction) {
	if (EXISTS(transaction) && transaction !== this.transaction) {
		console.log("Invalid transaction in UACore timeout");
		return;
	}

	this.transaction = null;

	// if UAC
	if (!this.server) {
		// TODO: make sure there is at least one remote candidate
		if (this.remoteCandidates && len(this.remoteCandidates)>0) {
			this.retryNextCandidate();
		} else {
			this.receivedResponse(null, Message.createResponse(408, "Request timeout", null, null, this.request));
		}
	}
};

UACore.prototype.error = function(transaction, error) {
	if (EXISTS(transaction) && transaction !== this.transaction) return;

	this.transaction = null;

	// if UAC
	if (!this.server) {
		if (this.remoteCandidates && len(this.remoteCandidates)>0) {
			this.retryNextCandidate();
		} else {
			this.receivedResponse(null, Message.createResponse(503, 'Service unavailable - ' + error, null, null, this.request));
		}
	}
};

UACore.prototype.authenticate = function(response, transaction) {
	/*def authenticate(self, response, transaction):
		'''Whether we can supply the credentials locally to authenticate or not?
		If we can, then re-send the request in new transaction and return true, else return false'''
		a = response.first('WWW-Authenticate') or response.first('Proxy-Authenticate') or None
		if not a:
			return False
		request = Message(str(transaction.request)) # construct a new message

		resend, present = False, False
		for b in request.all('Authorization', 'Proxy-Authorization'):
			if a.realm == b.realm and (a.name == 'WWW-Authenticate' and b.name == 'Authorization' or a.name == 'Proxy-Authenticate' and b.name == 'Proxy-Authorization'):
				present = True
				break

		if not present and 'realm' in a: # prompt for password
			result = self.stack.authenticate(self, a)
			if not result or 'password' not in a and 'hashValue' not in a:
				return False
			# TODO: hashValue is not used
			value = createAuthorization(a.value, a.username, a.password, str(request.uri), self.request.method, self.request.body, self.auth)
			if value:
				request.insert(Header(value, (a.name == 'WWW-Authenticate') and 'Authorization' or 'Proxy-Authorization'), True)
				resend = True

		if resend:
			self.localSeq = self.localSeq + 1
			request.CSeq = Header(str(self.localSeq) + ' ' + request.method, 'CSeq')
			request.first('Via').branch = Transaction.createBranch(request, False)
			self.request = request
			self.transaction = Transaction.createClient(self.stack, self, self.request, self.transaction.transport, self.transaction.remote)
			return True
		else:
			return False;*/
};

var Dialog = function(stack, request, server, transaction) {
	// Call the parent constructor
	// Create a dialog for the request in server (True) or client (False) mode for given transaction
	UACore.call(this, stack, request, server);

	// pending server and client transactions
	this.servers = [];
	this.clients = [];
	this._id = null;

	if (EXISTS(transaction)) transaction.app = this; // this is a higher layer of transaction
};

Dialog.prototype = Object.create(UACore.prototype);

Dialog.prototype.constructor = Dialog;

Dialog.createServer = function(stack, request, response, transaction) {
	console.log("Create server dialog")
		//Create a dialog from UAS while sending response to request in the transaction
		var dialog = new Dialog(stack, request, true);
		dialog.request = request;
		dialog.routeSet = null;
		if (EXISTS(request['Record-Route']))
			dialog.routeSet = request.all('Record-Route');

		//while (dialog.routeSet && isMulticast(d.routeSet[0].value.uri.host)) { //# remove any multicast address from top of the list.
			//if _debug: print 'deleting top multicast routeSet', d.routeSet[0]
			//del d.routeSet[0]
			//if len(d.routeSet) == 0: d.routeSet = None
		//}

		dialog.secure = request.uri.secure;
		dialog.localSeq = 0;
		dialog.remoteSeq = request.cseq.number;
		dialog.callid = request.callid.value;
		dialog.localTag = response.to.tag || "";
		dialog.remoteTag = request.from.tag || "";
		dialog.localParty = Address(str(request.To.value));
		dialog.remoteParty = Address(str(request.From.value));

		if (EXISTS(request.contact))
			dialog.remoteTarget = URI(str(request.first('Contact').value.uri));

		//TODO: retransmission timer for 2xx in UAC

		stack.dialogs.setItem(dialog.id(), dialog);
		return dialog;
};

Dialog.createClient = function(stack, request, response, transaction) {
	console.log("Create client dialog")
		// Create a dialog from UAC on receiving response to request in the transaction.
		var dialog = new Dialog(stack, request, false);
		dialog.request = request;
		if (response['Record-Route'])
			dialog.routeSet = response.recordRoute;//[x for x in reversed(response.all('Record-Route'))];
		else
			dialog.routeSet = null;
		//#print 'UAC routeSet=', d.routeSet;
		dialog.secure = request.uri.secure;
		dialog.localSeq = request.CSeq.number;
		dialog.remoteSeq = 0;
		dialog.callId = request['Call-ID'].value;
		dialog.localTag = request.from.tag || '';
		dialog.remoteTag = response.to.tag || '';
		dialog.localParty = Address(str(request.From.value));
		dialog.remoteParty = Address(str(request.To.value));
		if (response.Contact) dialog.remoteTag.remoteTarget = URI(str(response.first("Contact").value.uri));
		stack.dialogs.setItem(dialog.id(), dialog);
		return dialog.remoteTag;
};

Dialog.extractId = function(message) {
		// Extract dialog identifier string from a Message m.
		if (message.isRequest)
			return message.callid.value + '|' + message.to.tag + '|' + message.from.tag;
		else
			return message.callid.value + '|' + message.from.tag + '|' + message.to.tag;
		//return m['Call-ID'].value + '|' + (m.To['tag'] else m.From['tag']) + '|' + (m.From['tag'] if m.method else m.To['tag']);
};

Dialog.prototype.close = function () {
	if (EXISTS(this.stack)) this.stack.dialogs.removeItem(this.id());
};

Dialog.prototype.id = function () {
	if (!EXISTS(this._id)) this._id = this.callId + '|' + this.localTag + '|' + this.remoteTag;
	return this._id;
};

Dialog.prototype.createRequest = function (method, content, contentType) {
	var request = UserAgent.createRequest(this, method, content, contentType);
	if (EXISTS(this.remoteTag)) request.to.tag = this.remoteTag;
	// NOTE: needed for strict route support
	// if (this.routeSet && this.routeSet.length>0 && !HAS(this.routeSet[0].value.uri.param, 'lr')) {
	// 	request.uri = this.routeSet[0].value.uri.dup();
	// 	if (HAS(request.uri.param, 'lr')) {
	// 		request.uri.param.lr = null;
	// 	}
	// }

	return request;
};

Dialog.prototype.createResponse = function (responsecode, responsetext, content, contentType) {
	if (this.servers.length === 0) console.log("No server transaction to create response");

	var request = this.servers[0].request;
	var response = Message.createResponse(responsecode, responsetext, null, content, request);
	if (EXISTS(contentType)) headers.append(Header(contentType, 'Content-Type'));

	if (response.statusCode !== 100 && !HAS(response.To,'tag')) {
		response.to.tag = this.localTag;
	}

	return response;
};

Dialog.prototype.sendResponse = function (response, responsetext, content, contentType, createDialog) {
	if (createDialog === undefined) createDialog = true;

	if (this.servers.length === 0) console.log("No server transaction to send response");

	this.transaction = this.servers[0];
	this.request = this.servers[0].request;
	UserAgent.sendResponse(this, response, responsetext, content, contentType, false);

	var code = response;
	if (typeof response !== "number") code = response.statusCode;

	if (code >= 200) this.servers.pop(0);
};

Dialog.prototype.sendCancel = function () {
	if (this.clients.length === 0) {
		console.log("No client transaction to send cancel");
		return;
	}
	this.transaction = this.clients[0];
	this.request = this.clients[0].request;
	UserAgent.sendCancel(this);
};

Dialog.prototype.onRequest = function (transaction, request) {
		// Incoming request in the dialog.
		if (this.remoteSeq !== 0 && request.cseq.number < this.remoteSeq) {
			console.log("Dialog.onRequest() CSeq is old", request.cseq.number, this.remoteSeq);
			this.sendResponse(500, "Internal server error - invalid CSeq");
			return;
		}

		this.remoteSeq = request.cseq.number;

		if (request.method === 'INVITE' && request.Contact) {
			this.remoteTarget = request.first('Contact').value.uri.dup();
		}

		if (request.method === 'ACK' || request.method === 'CANCEL') {
			//console.log("ACK or CANCEL in dialog")
			// TODO: remove from pending
			//this.servers = filter(lambda x: x != transaction, this.servers)
			if (request.method == 'ACK') {
				this.stack.onRequest(this, request);
			} else {
				this.stack.cancelled(this, transaction.request);
			}
			return;
		}

		this.servers.append(transaction); // make it pending
		this.stack.onRequest(this, request);
};

Dialog.prototype.onResponse = function(transaction, response) {
	//console.log("dlg on response");

	// Incoming response in a dialog.
	if (response.is2xx() && response.Contact && transaction && transaction.request.method === 'INVITE') {
		this.remoteTarget = response.first('Contact').value.uri.dup();
	}

	if (!response.is1xx()) {// final response
		// TODO: remove from pending
		//this.clients = filter(lambda x: x != transaction, this.clients);
	}

	if (response.statusCode === 408 || response.statusCode == 481) {// remote doesn't recognize the dialog
		this.close();
	}

	if (response.statusCode == 401 || response.statusCode == 407) {
		if (!this.authenticate(response, transaction)) {
			this.stack.receivedResponse(this, response);
		}
	} else if (transaction) {
		this.stack.receivedResponse(this, response);
	}

	if (this.autoack && response.is2xx && (transaction && transaction.request.method == 'INVITE' || response.CSeq.method == 'INVITE')) {
		this.sendRequest(this.createRequest('ACK'));
	}
};
