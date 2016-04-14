//var SIP = {};
var EXISTS = function(obj) {
	if (obj === undefined) return false;

	if (obj === null) return false;

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

Message.createRequest = function(method, uri) {
    //console.log("CREATE:", method, "request");
    var message = new Reticulum.SIP.Message();
	message.isRequest = true;
    message.method = method;
	message.uri = uri;
	message.version = "SIP/2.0";

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
		message.addHeader("To", Reticulum.Parser.Enum.SIP_HDR_TO, request.to.toString());
		message.addHeader("From", Reticulum.Parser.Enum.SIP_HDR_FROM, request.from.toString());
		message.addHeader("CSeq", Reticulum.Parser.Enum.SIP_HDR_CSEQ, request.cseq.toString());
		message.addHeader("Call-ID", Reticulum.Parser.Enum.SIP_HDR_CALL_ID, request.callid);

		message.copyVias(request.vias);

		// TODO: make sure to implement support for Timestamp header in parser and addHeader
        if (response === 100) message.timestamp = request.timestamp;
	}

	// TODO: check if headers are being sent and go through them all one by one
	if (EXISTS(headers)) console.log("ADD HEADERS");

	if (EXISTS(content)) message.body = content;

    return message;
};

var Stack = function(app, transport) {
	this.tag = Utils.uuid();//str(random.randint(0,2**31));
	this.app = app;
	this.transport = transport;
	this.closing = false;
	this.dialogs = new HashTable();
	this.transactions = new HashTable();
	this.requests = {}; //new HashTable();
	//this.serverMethods = ['INVITE','BYE','MESSAGE','SUBSCRIBE','NOTIFY'];

	this.fixedContact = null;
	this.fixedVia = null;

	this.stores = {
		transactions: new HashTable()
	};
};

Stack.prototype.delete = function() {
	this.closing = true;
	this.dialogs.clear();
	this.transactions.clear();
};

Stack.prototype.uri = function() {
	// Construct URI for transport
	var uri = this.transport.isSecure() ? "sips" : "sip";

	// NOTE: force SIP instead of SIPS for JsSIP support
	uri = "sip";

	uri += ":" + this.transport.server + ":" + this.transport.port;

	return uri;
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

	return Reticulum.Parser.parseVia("SIP/2.0/" + this.transport.protocol.toUpperCase() + " " + "r3t1cu1um.invalid" + ";rport");
};

Stack.prototype.send = function(message, destination) {
	//console.log("[SEND]");
	// Send a data (Message) to given dest (URI or hostPort), or using the Via header of response message if dest is missing.
	console.log("Sending", message.isRequest ? "request" : "response", "with", message.vias.length, "VIAs");

	if (!message.isRequest && !EXISTS(destination)) {
		if (EXISTS(message.vias) && EXISTS(message.vias[0].sentby)) {
			destination = message.vias[0].sentby;
		}
	}

	// Debug info
	message.direction = "out";
	message.transportDestination = destination;
	message.sentAt = Date.now();

	if (message.isRequest) {
		if (EXISTS(this.requests[message.id()])) {
			console.log("Warning request already archived");
		}
		// Archive request
		this.requests[message.id()] = message;
	} else {
		// Archive response
		if (EXISTS(this.requests[message.id()])) {
			this.requests[message.id()].responses.push(message);
		} else {
			console.log("Corresponding request for this response was not found");
		}
	}

	// console.log("SENT!", message.id());
	//console.log("SENT!", message.isRequest ? message.method : message.statusCode, "to", destination, "-", message.to.auri);
//console.log(message);
//console.log(message.toString());
	this.app.send(message.toString(), destination);
};

Stack.prototype.onData = function(data, source) {

	//try {
		var start = Date.now();
		var message = Reticulum.Parser.parse(data);
// console.log("GOT!", message.isRequest ? message.method : message.statusCode, "from", source.name, "-", message.from.auri);
// console.log("-------");
// console.log(data);
// console.log("-------");
		if (!EXISTS(message)) {
			console.log("Error. Received invalid message.");
			throw("Received invalid message");
		}

		message.direction = "in";
		message.transportSource = source;
		message.parseTime = Date.now() - start;
		message.receivedAt = start;

		if (message.isRequest) {
			if (EXISTS(this.requests[message.id()])) {
				console.log("Warning request already archived");
			}
			// Archive request
			this.requests[message.id()] = message;
		} else {
			// Archive response
			if (EXISTS(this.requests[message.id()])) {
				this.requests[message.id()].responses.push(message);
			} else {
				console.log("Corresponding request for this response was not found");
			}
		}
//console.log("GOT!", message.id());
		//var uri = Reticulum.SIP.formatURI(source, this.transport.isSecure());//this.transport.isSecure() ? "sips" : "sip";
		//uri += ":" + source.host + ":" + source.port;

		console.log("Got", message.isRequest ? "request" : "response", "with", message.vias.length, "VIAs");

		if (message.isRequest) {
			if (!EXISTS(message.vias) || message.vias.length === 0) {
				console.log("Error. No via header in request.");
				throw("No via header in request");
			}

//console.log(message.vias);
			if (message.vias[0].host.name !== source.name || message.vias[0].port !== source.port) {
				message.vias[0].received = source.name;
				message.vias[0].host.name = source.name;
			}

			if (EXISTS(message.vias[0].rport)) {
				messsage.vias[0].rport  = source.port;
				message.vias[0].uri.port = source.port;
			}

			// force rport for TCP
			if (this.transport.type === "tcp") {
				message.vias[0].rport = source.port;
				message.vias[0].port = source.port;
			}

			this.handleRequest(message);
		} else {
			this.handleResponse(message);
		}

	/*} catch(error) {
		console.log(error);
		this.send(Message.createResponse(400, error.message, null, null, message));
	}*/
};

Stack.prototype.handleRequest = function(message, uri) {
	var transaction = null;
	var dialog = null;
	var layer = null; // processing layer depending on the message type (transaction, dialog, user agent core)
	var core = null;

	var branch = message.vias[0].params.branch;

	if (message.method === "ACK") {
		transaction = this.findTransaction(branch);

		if (transaction === null || (transaction.lastResponse !== null && transaction.lastResponse.is2xx())) {
			transaction = this.findTransaction(Transaction.createId(branch, message.method));
		}

		console.log("transaction for ACKed request", transaction);
	} else {
		transaction = this.findTransaction(Transaction.createId(branch, message.method));
	}

	if (!EXISTS(transaction)) {
		if (message.method !== "CANCEL" && EXISTS(message.to.params.tag)) {
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
							core = this.createServer(message, uri); //this.ua;//createUA(message);

							if (EXISTS(core)) {
								layer = core;
							} else {
								console.log("Error no UAS component created!");
								return;
							}
						}
					}
				}
			} else {
				layer = dialog;
			}
		} else if (message.method !== "CANCEL") {
			core = this.createServer(message, uri);//this.ua;//createUA(message);

			if (EXISTS(core)) {
				layer = core;
			} else if (message.method === "OPTIONS") {
				var msg = Message.createResponse(200, "OK", null, null, message);
				msg.addHeader("Allow", Reticulum.Parser.Enum.SIP_HDR_ALLOW, "INVITE, ACK, CANCEL, BYE, OPTIONS");

				this.send(msg);
				return;
			} else if (message.method !== "ACK") {
				this.send(Message.createResponse(405, "Method not allowed", null, null, message));
				return;
			}
		} else {
			transaction = this.findTransaction(Transaction.createId(branch, "INVITE"));

			if (!EXISTS(transaction)) {
				this.send(Message.createResponse(481, "Original transaction does not exist", null, null, message));
				return;
			} else {
				layer = transaction.app;
			}
		}

		//console.log("LAYER",layer)
		if (EXISTS(layer)) {
			transaction = layer.createTransaction(message);

			if (message.method === "ACK" && transaction !== null && this.transactions.getItem(transaction.id) !== undefined) {
				// remove transaction
				this.transactions.removeItem(transaction.id);
			}
console.log("Layer is:", layer, "request is:", message.method, this.transactions.getItem(transaction.id), transaction.id);
		} else if (message.method !== "ACK") {
			console.log("Error 404 not found!");
			//return
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
	var branch = message.vias[0].params.branch;
	var transaction = this.findTransaction(Transaction.createId(branch, message.method));
	var dialog = null;

	console.log("Stack handleRequest", message.method, transaction);

	if (transaction === null) {
console.log("Transaction for resp not found", Transaction.createId(branch, message.method), message);
		if (message.method === "INVITE" && message.is2xx()) {
			dialog = this.findDialog(message);

			if (dialog === null) {
				console.log("Error, no dialog found for response", message.statusCode, "to", message.method);
			} else {
				dialog.onResponse(null, message);
				this.app._ua.closeCore();
			}
		} else {
			if (message.method === "INVITE" && message.isFinal()) {
				//console.log("CREATE ACK 1", message.to.auri)
				var msg = Message.createRequest("ACK", message.to.uri);

				msg.addHeader("To", Reticulum.Parser.Enum.SIP_HDR_TO, message.to.value);
				msg.addHeader("From", Reticulum.Parser.Enum.SIP_HDR_FROM, message.from.value);
				msg.addHeader("Call-ID", Reticulum.Parser.Enum.SIP_HDR_CALL_ID, message.callid);
				msg.addHeader("CSeq", Reticulum.Parser.Enum.SIP_HDR_CSEQ, message.cseq.number + " ACK");

				msg.copyVias(message.vias);

				this.send(msg);

				// NOTE: close dialog on INVITE final response
				this.app._ua.closeCore();
				this.app._ua.setState("IDLE");
			}
		}
	} else {
		transaction.onResponse(message);

		if (message.method === "BYE" && message.is2xx()) {
			this.app._ua.closeCore();
		} else if (message.method === "BYE" && message.isFinal()) {
			this.app._ua.closeCore();
		}
	}
};

Stack.prototype.createServer = function(request, uri) {
	return this.app.createServer(request, uri, this);
};

Stack.prototype.sending = function(ua, message) {
	//console.log("sending " + this.app);
	if (EXISTS(this.app) && EXISTS(this.app.sending)) return this.app.sending(ua, message, this);

	return null;
};

Stack.prototype.onRequest = function(ua, request) {
	//console.log(this.app);
	this.app.onRequest(ua, request, this);
};

Stack.prototype.onResponse = function(ua, response) {
	console.log("simple stack on response", this.app);
	this.app.onResponse(ua, response, this);
};

Stack.prototype.cancelled = function(ua, request) {
	//this.app.cancelled(ua, request, this);
};

Stack.prototype.dialogCreated = function(dialog, ua) {
	this.app.dialogCreated(dialog, ua, this);
};

Stack.prototype.authenticate = function(ua, header) {
	if (EXISTS(this.app) && EXISTS(this.app.authenticate))
		return this.app.authenticate(ua, header, this);

	return false;
};

// TODO: implement Timers
Stack.prototype.createTimer = function(name, obj) {
// 	return this.app.createTimer(obj, this);
	return new Timer(name, obj);
};

Stack.prototype.findDialog = function(arg) {
	//console.log("find dlg argument", typeof arg);
	var dialog = this.dialogs.getItem(Dialog.extractId(arg));

	if (!dialog) return null;

	if (dialog.closed) return null;

	return dialog;
};

Stack.prototype.findTransaction = function(id) {
	var trans = this.transactions.getItem(id);

	if (!EXISTS(trans)) return null;

	if (trans.state === "TERMINATED") {
		console.log("Found Terminated transaction");
		return null;
	}

	return trans;
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

	this.history = [];

	this.isServer = server;
	this.timers = new HashTable();
	this.timerconfs = new TimerConfs();

	this.type = server ? "UNK_SERVER" : "UNK_CLIENT";
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
	var method = "UNKNOWN";

	if (EXISTS(this.request)) method = this.request.method;

	console.log("[T state] from:", this.state, "to:", value, "id:", this.id);

	this.history.push({
		from: this.state,
		to: value,
		at: Date.now()
	});

	this.stack.app.setStateFromTransaction(this.type, this.state, value, method);

	this.state = value;

	//this.stack.app.setState(value);

	if (this.state === "TERMINATED") {
		// this.close();
	}
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
	if (EXISTS(request.vias) && EXISTS(request.vias[0].sentby)) transaction.remote = request.vias[0].sentby;
	if (EXISTS(request.vias) && EXISTS(request.vias[0].params.branch))
		transaction.branch = request.vias[0].params.branch;
	else
		transaction.branch = Transaction.createBranch(request);

	transaction.id = Transaction.createId(transaction.branch, request.method);
	stack.transactions.setItem(transaction.id, transaction);

	stack.stores.transactions.setItem(transaction.branch + "|" + request.method, transaction);

	if (start === true)
		transaction.start();
	else
		transaction.setState("TRYING");

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

	if (EXISTS(request.vias) && EXISTS(request.vias[0].params.branch))
		transaction.branch = request.vias[0].params.branch;
	else
		transaction.branch = Transaction.createBranch(request);

	transaction.id = Transaction.createId(transaction.branch, request.method);
	stack.transactions.setItem(transaction.id, transaction);

	stack.stores.transactions.setItem(transaction.branch + "|" + request.method, transaction);

	transaction.start();

	return transaction;
};

Transaction.prototype.createAck = function () {
	var message = null;

	if (EXISTS(this.request) && !this.isServer) {
		//console.log("CREATE ACK 2", this.request.uri)
		message = Message.createRequest("ACK", this.request.uri);

		// TODO: check if headers are correct and don't overwrite already present headers
		message.addHeader("Call-ID", Reticulum.Parser.Enum.SIP_HDR_CALL_ID, this.request.callid);
		message.addHeader("From", Reticulum.Parser.Enum.SIP_HDR_FROM, this.request.from.toString());
		message.addHeader("To", Reticulum.Parser.Enum.SIP_HDR_TO, this.request.to.toString());
		message.addHeader("CSeq", Reticulum.Parser.Enum.SIP_HDR_CSEQ, this.request.cseq.number + " " + "ACK");

		message.copyVias(this.request.vias);
	}

	//console.log("TRANSA ACK", message);

	return message;
};

Transaction.prototype.createCancel = function () {
	var message = null;

	if (EXISTS(this.request) && !this.isServer) {
		message = Message.createRequest('CANCEL', this.request.uri);

		// TODO: check if headers are correct and don't overwrite already present headers
		message.addHeader("Call-ID", Reticulum.Parser.Enum.SIP_HDR_CALL_ID, this.request.callid);
		message.addHeader("From", Reticulum.Parser.Enum.SIP_HDR_FROM, this.request.from.toString());
		message.addHeader("To", Reticulum.Parser.Enum.SIP_HDR_TO, this.request.to.toString());
		message.addHeader("CSeq", Reticulum.Parser.Enum.SIP_HDR_CSEQ, this.request.cseq.number + " " + "CANCEL");

		message.copyVias(this.request.vias);
	}

	if (EXISTS(this.request.routes)) message.routes = this.request.routes;

	//console.log("TRANSA CANCEL", message);

	return message;
};

Transaction.prototype.createResponse = function (response, responsetext) {
	var message = null;

	if (EXISTS(this.request) && this.isServer)
		message = Message.createResponse(response, responsetext, null, null, this.request);

	if (response !== 100 && !EXISTS(message.to.params.tag))
		message.to.params.tag = this.tag;

	//console.log("TRANSA RESP", this.isServer, response, this.request, message);

	return message;
};

Transaction.prototype.startTimer = function(name, timeout) {
	if (timeout <= 0) return;

	var timer = this.timers.getItem(name);

	if (!EXISTS(timer)) {
		// TODO: fix timer creation
		timer = this.stack.createTimer(name, this);
		this.timers.setItem(name, timer);
	}

	//timer.delay = timeout;
	timer.start(timeout);
};

Transaction.prototype.stopTimers = function() {
	this.timers.each(function(id, timer) { timer.stop(); });

	this.timers.clear();
};

Transaction.prototype.timedout = function(name) {
	// if (timer.isRunning()) timer.stop();

	var timer = this.timers.getItem(name);
	console.log("%cTimer: " + name, "background: #222; color: red;");
	console.log("%cTransaction Timedout " + name, "background: #222; color: #bada55; padding: 5px;");

	if (EXISTS(timer)) {
		if (timer.isRunning()) timer.stop();
console.log("Timer timedout", name, timer.delay);
		this.timeout(name, timer.delay);
		//timer.delete();
		this.timers.removeItem(name);
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

var Timer = function(name, obj) {
	this.name = name;
	this.ticker = null;

	var self = this;

	this.callback = function () {
		// TODO: make sure that timedout is called and that the ticker is set to null
		obj.timedout(self.name);
		// NOTE: this might not be necessary since timer might be null on timeout by default
		self.ticker = null;
	};
};

Timer.prototype.start = function (timeout) {
	this.delay = timeout;
	this.ticker = window.setTimeout(this.callback, timeout);
};

Timer.prototype.stop = function () {
	window.clearTimeout(this.ticker);
	this.ticker = null;
};

Timer.prototype.isRunning = function() {
	return this.ticker !== null;
};

var ClientTransaction = function() {
	Transaction.call(this, false);
};

ClientTransaction.prototype = Object.create(Transaction.prototype);

ClientTransaction.prototype.constructor = ClientTransaction;

ClientTransaction.prototype.start = function() {
	//console.log("[client trans start]", this);
	this.setState("TRYING");
	this.type = "NON_CLIENT";

	if (!this.transport.isReliable()) this.startTimer("E", this.timerconfs.E);

	this.startTimer("F", this.timerconfs.F);
	this.stack.send(this.request, this.remote, this.transport);
};

ClientTransaction.prototype.onResponse = function(response) {
	console.log("ct on response", this.app);
	if (response.is1xx()) {
		if (this.state === "TRYING") {
			this.setState("PROCEEDING");
			this.app.onResponse(this, response);
		} else if (this.state === "PROCEEDING") {
			this.app.onResponse(this, response);
		}
	} else if (response.isFinal()) {
		if (this.state === "TRYING" || this.state === "PROCEEDING") {
			this.setState("COMPLETED");
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
	console.log("ClientTransaction timeout");
	if (this.state === "TRYING" || this.state === "PROCEEDING") {
		if (name === "E") {
			if (this.state == "TRYING")
				timeout = Math.min(2*timeout, this.timerconfs.t2);
			else
				timeout = this.timerconfs.t2;

			this.startTimer("E", timeout);
			this.stack.send(this.request, this.remote, this.transport);
		} else if (name === "F") {
			this.setState("TERMINATED");
			this.app.timeout(this);
		}
	} else if (this.state === "COMPLETED") {
		if (name === "K") this.setState("TERMINATED");
	}
};

ClientTransaction.prototype.error = function(error) {
	if (this.state === "TRYING" || this.state === "PROCEEDING") {
		this.setState("TERMINATED");
		this.app.error(this, error);
	}
};

var ServerTransaction = function() {
	Transaction.call(this, true);
};

ServerTransaction.prototype = Object.create(Transaction.prototype);

ServerTransaction.prototype.constructor = ServerTransaction;

ServerTransaction.prototype.start = function() {
	this.setState("TRYING");
	this.type = "NON_SERVER";

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
	console.log("ServerTransaction timeout");
	if (this.state === "COMPLETED")
		if (name === "J") this.setState("TERMINATED");
};

ServerTransaction.prototype.error = function(name, timeout) {
	if (this.state === "COMPLETED") {
		this.setState("TERMINATED");
		this.app.error(error);
	}
};

ServerTransaction.prototype.sendResponse = function(response) {
	// save for retransmission
	this.lastResponse = response;
	if (response.is1xx()) {
		if (this.state === "TRYING" || this.state === "PROCEEDING") {
			this.setState("PROCEEDING");
			this.stack.send(response, this.remote, this.transport);
		}
	} else if (response.isFinal()) {
		if (this.state === "PROCEEDING" || this.state === "TRYING") {
			this.setState("COMPLETED");
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
	this.setState("CALLING");
	this.type = "INV_CLIENT";
	// NOTE: No need for this the transport is reliable
	if (!this.transport.isReliable()) this.startTimer("A", this.timerconfs.A);
	this.startTimer("B", this.timerconfs.B);
	this.stack.send(this.request, this.remote, this.transport);
};

InviteClientTransaction.prototype.onResponse = function(response) {
	//console.log("ict on response");
	if (response.is1xx()) {
		if (this.state === "CALLING") {
			this.setState("PROCEEDING");
			this.app.onResponse(this, response);
		} else if (this.state === "PROCEEDING") {
			this.app.onResponse(this, response);
		}
	} else if (response.is2xx()) {
		if (this.state === "CALLING" || this.state === "PROCEEDING") {
			this.setState("TERMINATED");
			// this.setState("ACCEPTED");
			this.app.onResponse(this, response);
			this.stack.app._ua.setState("ACCEPTED");
		}
	} else {
		if (this.state === "CALLING" || this.state === "PROCEEDING") {
			this.setState("COMPLETED");
			this.stack.send(this.createAck(response), this.remote, this.transport);
			this.app.onResponse(this, response);
			if (!this.transport.isReliable())
				this.startTimer("D", this.timerconfs.D);
			else
				this.timeout("D", 0);
		} else if (this.state === "COMPLETED") {
			this.stack.send(this.createAck(response), this.remote, this.transport);
		}
	}
};

InviteClientTransaction.prototype.timeout = function(name, timeout) {
	console.log("InviteClientTransaction timeout");
	if (this.state === "CALLING") {
		if (name === "A") {
			this.startTimer("A", 2*timeout);
			this.stack.send(this.request, this.remote, this.transport);
		} else if (name === "B") {
			this.setState("TERMINATED");
			this.app.timeout(this);
		}
	} else if (this.state === "COMPLETED") {
		if (name === "D") {
			this.setState("TERMINATED");
		}
	}
};

InviteClientTransaction.prototype.error = function(error) {
	if (this.state === "CALLING" || this.state === "COMPLETED") {
		this.setState("TERMINATED");
		this.app.error(this, error);
	}
};

InviteClientTransaction.prototype.createAck = function(response) {
	var message = null;

	if (!EXISTS(this.request)) console.log("There is no request in this Transaction");

	var to = this.request.to;
	if (EXISTS(response)) to = response.to;

	var from = this.request.from;
	if (EXISTS(response)) from = response.from;

//console.log("CREATE ACK 3", this.request.uri)
	message = Message.createRequest("ACK", this.request.uri);

	message.addHeader("Call-ID", Reticulum.Parser.Enum.SIP_HDR_CALL_ID, this.request.callid);
	message.addHeader("From", Reticulum.Parser.Enum.SIP_HDR_FROM, from.toString());
	message.addHeader("To", Reticulum.Parser.Enum.SIP_HDR_TO, to.toString());
	message.addHeader("CSeq", Reticulum.Parser.Enum.SIP_HDR_CSEQ, this.request.cseq.number + " ACK");

	message.copyVias(this.request.vias);

	if (EXISTS(this.request.routes)) message.routes = this.request.routes;

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
	this.setState("PROCEEDING");
	this.type = "INV_SERVER";
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
			this.setState("CONFIRMED");
			if (!this.transport.isReliable()) {
				this.startTimer("I", this.timerconfs.I);
			} else {
				this.timeout("I", 0);
			}
		}
	}
};

InviteServerTransaction.prototype.timeout = function(name, timeout) {
	console.log("InviteServerTransaction timeout");
	if (this.state === "COMPLETED") {
		if (name === "G") {
			this.startTimer("G", Math.min(2*timeout, this.timerconfs.t2));
			this.retrans = this.retrans + 1;
			//console.log("Retransmittion #" + this.retrans + " INVITE response");
			this.stack.send(this.lastResponse, this.remote, this.transport);
		} else if (name === "H") {
			this.setState("TERMINATED");
			this.app.timeout(this);
		}
	} else if (this.state === "CONFIRMED") {
		if (name === "I") {
			this.setState("TERMINATED");
		}
	}
};

InviteServerTransaction.prototype.error = function(error) {
	if (this.state === 'PROCEEDING' || this.state === 'TRYING' || this.state === 'CONFIRMED') {
		this.setState('TERMINATED');
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
			this.setState('COMPLETED');
			if (!this.transport.isReliable()) {
				this.startTimer('G', this.timerconfs.G);
			}
			this.startTimer('H', this.timerconfs.H);
			this.stack.send(response, this.remote, this.transport);
		}
	}
};

var UACore = function(stack, request, server, authinfo) {
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

	if (EXISTS(request)) {
		this.callid = request.callid;
		this.remote = request.from;
		this.local = request.to;
		this.subject = request.subject;
		this.secure = request.uri.scheme === "sips";

		var tempContact = "\"Anonymous\" <sip:" + this.local.uri.user + "@r3t1cu1um.invalid;transport=wss>;expires=1800";

		this.contact = Reticulum.Parser.parseAddress(tempContact);//stack.uri());
	} else {
		this.callid = stack.createCallID();
	}

	this.remoteTag = null;
	this.localTag = Utils.token(10, Utils.TOKEN_NUMERIC_32);

	if (EXISTS(this.local) && EXISTS(this.local.uri.user))
		this.contact.uri.user = this.local.uri.user;


	// TODO: check if AutoACK is needed
	this.autoack = false;//true;
	this.authinfo = authinfo;

	if (EXISTS(server))
		this.server = server;

	//console.log("UACORE construct", this);
};

UACore.prototype.createTransaction = function(request) {
	return Transaction.createServer(this.stack, this, request, this.stack.transport, this.stack.tag, true);
};

UACore.prototype.createRequest = function(method, content, contentType) {
	console.log("UACore createRequest", method);
	this.server = false;
	if (!EXISTS(this.remote)) throw "No remote party for UAC";
	if (!EXISTS(this.local)) this.local = "\"Anonymous\" <sip:anonymous@anonymous.invalid>";

	var uri = EXISTS(this.remoteTarget) ? this.remoteTarget : this.remote.uri;
	if (!this.secure && uri.secure) this.secure = true;
	//console.log("AAAAAAAAAAAAAAAAAAA",uri, this.remoteTarget , this.remote.uri);

	//if (method === "REGISTER") uri.user = null; // no uri.user in REGISTER

	if (method !== "ACK" && method !== "CANCEL") this.localSeq = this.localSeq + 1;

	var request = new Reticulum.SIP.Message();

	request.isRequest = true;
	request.method = method;
	request.version = "SIP/2.0";

	request.uri = uri;

	//if (method === "REGISTER") request.remoteURI = this.server;

	request.addHeader("To", Reticulum.Parser.Enum.SIP_HDR_TO, this.remote.auri);
	request.to.uri.secure = this.secure;

	request.addHeader("From", Reticulum.Parser.Enum.SIP_HDR_FROM, this.local.auri);
	request.from.uri.secure = this.secure;
	request.from.params.tag = this.localTag;
	request.addHeader("CSeq", Reticulum.Parser.Enum.SIP_HDR_CSEQ, this.localSeq + ' ' + method);
	request.addHeader("Call-ID", Reticulum.Parser.Enum.SIP_HDR_CALL_ID, this.callid);
	//request.addHeader("Max-Forwards", Reticulum.Parser.Enum.SIP_HDR_MAX_FORWARDS, this.maxForwards);

	var branch = Transaction.createBranch();

	var name = this.local.uri.user;
	name = "\"" + name[0].toUpperCase() + name.substr(1) + " RTC\"";

	var tempVia = "SIP/2.0/" + this.stack.transport.protocol.toUpperCase() + " " + "r3t1cu1um.invalid" + ";branch=" + branch + ";rport";
	var tempContact = name + " <sip:" + this.local.uri.user + "@r3t1cu1um.invalid;transport=wss>;expires=1800";

	// TODO: reenable if needed for client side support
	// if (this.stack.fixedVia)
	// 	tempVia = this.stack.fixedVia.toString();
	// if (this.stack.fixedContact)
	// 	tempContact = this.stack.fixedContact.toString();

	if (!this.localTarget) {
		this.localTarget = this.stack.uri();
		this.localTarget.user = this.local.uri.user;
	}

	request.addHeader("Via", Reticulum.Parser.Enum.SIP_HDR_VIA, tempVia);
	request.addHeader("Contact", Reticulum.Parser.Enum.SIP_HDR_CONTACT, tempContact);

	// Add new branch to fixedVia
	if (method !== "ACK" && method !== "CANCEL") request.vias[0].params.branch = branch;

	console.log("UACore routeSet", this.routeSet);

	if (EXISTS(this.routeSet) && this.routeSet.length > 0) {
		for (var i = this.routeSet.length - 1; i >= 0; i--) {
			request.addHeader("Route", Reticulum.Parser.Enum.SIP_HDR_ROUTE, this.routeSet[i].toString());
		}
	}

	if (contentType) request.addHeader("Content-Type", Reticulum.Parser.Enum.SIP_HDR_CONTENT_TYPE, contentType);

	// request.contentLength = 0;
	// if (content) request.contentLength = content.length();

	// var l = -1;

	// if (content) l = content.length();

	// console.log("CORE createRequest", l, content);

	// request.addHeader("Content-Length", Reticulum.Parser.Enum.SIP_HDR_CONTENT_LENGTH, content.length());

	return request;
};

UACore.prototype.createAck = function(response) {
	var ack = null;

	var request = this.stack.requests[response.id()];

	var to = request.to;
	if (EXISTS(response)) to = response.to;

	var from = request.from;
	if (EXISTS(response)) from = response.from;

	ack = Message.createRequest("ACK", request.uri);

	ack.addHeader("Call-ID", Reticulum.Parser.Enum.SIP_HDR_CALL_ID, request.callid);
	ack.addHeader("From", Reticulum.Parser.Enum.SIP_HDR_FROM, from.toString());
	ack.addHeader("To", Reticulum.Parser.Enum.SIP_HDR_TO, to.toString());
	ack.addHeader("CSeq", Reticulum.Parser.Enum.SIP_HDR_CSEQ, request.cseq.number + " ACK");

	ack.copyVias(request.vias);

	if (EXISTS(request.routes)) ack.routes = request.routes;

	return ack;
};

UACore.prototype.createRegister = function(aor) {
	console.log("UACore createRegister");
	if (aor) this.remote = Reticulum.Parser.parseAddress(aor);
	//if (!this.local) this.local = Reticulum.Parser.parseAddress(this.remote);
	if (!this.loca) this.local = Reticulum.Parser.parseAddress(aor);

	this.remoteTarget = this.remote.uri.host;

	//console.log(aor, this.remote, this.local, this.remoteTarget);

	return this.createRequest("REGISTER");
};

UACore.prototype.sendRequest = function(request) {
	console.log("UACore sendRequest", request.method);
	// Send a UAC request Message
	if (!EXISTS(this.request) && request.method === "REGISTER") {
		//console.log(this.transaction);
		if (EXISTS(this.transaction) && (this.transaction.state !== "COMPLETED" && this.transaction.state !== "TERMINATED")) {
			throw("Cannot re-REGISTER since pending registration");
		}
	}

	this.request = request; // store for future

	// TODO:	implement routes support, append all stored Record-Route
	//			headers as Route headers only in reverse
console.log("UACore route set", this.routeSet);
	if (EXISTS(this.routeSet) && this.routeSet.length > 0) {
		request.routes = [];
		for (var i = this.routeSet.length - 1; i >= 0; i--) {
			request.addHeader("Route", Reticulum.Parser.Enum.SIP_HDR_ROUTE, this.routeSet[i].toString());
		}
	}


	if (EXISTS(request.routes) && request.routes.length > 0)
		this.remoteTarget = request.routes[0].uri;
	else
		this.remoteTarget = request.uri;

console.log("SEND req FROM UACORE", EXISTS(this.request), request.uri, request.remoteURI);

	var target = this.remoteTarget;

	// NOTE: remove any Route header in REGISTER request
	if (!EXISTS(this.request) && request.method === "REGISTER") {
		request.routes = [];
	}

	this.stack.sending(this, request);

	// TODO:	implement remote candidates for our realm
	//			resolve dns of realm to get ip and port for
	//			proxy or use the configuration, don't hard
	//			code the ip and port for proxy

	// continue processing as if we received multiple candidates
	/*if (!EXISTS(this.remoteCandidates) || this.remoteCandidates.length === 0) {
		//this.error(None, 'cannot resolve DNS target')
		return;
	}
	target = this.remoteCandidates.pop(0);*/
	if (this.request.method !== "ACK") {
	 	//start a client transaction to send the request
		console.log("UACore sendRequest TARGET", target);
		this.transaction = Transaction.createClient(this.stack, this, this.request, this.stack.transport, target.hostPort);
	} else {// directly send ACK on transport layer
		//this.stack.send(this.request, target.hostPort);
		this.stack.send(this.request, target, this.transport);
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

	if (response.vias.length > 1) console.log("Error. More than one Via header in response");

	if (response.is1xx()) {
		this.repeated40x = false;
		if (this.cancelRequest) {
			// TODO: check where cancel needs to be stored
			var cancel = Transaction.createClient(this.stack, this, this.cancelRequest, transaction.transport, transaction.remote);
			this.cancelRequest = null;
		} else {
			this.stack.onResponse(this, response);
		}
	} else if (response.statusCode === 401 || response.statusCode === 407) { // authentication challenge
		// NOTE: if 401 or 407 reponse already received once bad username or password
		if (this.repeated40x) {
			console.log("Error bad username or password.");
			this.stack.onResponse(this, response);
		} else if (!this.authenticate(response, this.transaction)) {
			// NOTE: couldn't authenticate, continue processing
			this.stack.onResponse(this, response);
		} else {
			this.repeated40x = true;
		}
	} else {
		this.repeated40x = false;
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

UACore.prototype.onRequest = function(transaction, request) {
	if (EXISTS(transaction) && EXISTS(this.transaction) && transaction !== this.transaction && request.method !== "CANCEL") {
		console.log("Invalid transaction for received request");
	}

	// upgrade this to a UAS
	this.server = true;


	console.log("UACore onRequest routeSet before:", this.routeSet);
	if (EXISTS(request.record_routes)) this.routeSet = request.record_routes;
console.log("UACore onRequest routeSet after:", this.routeSet);
	//console.log("on request uri scheme:", request.uri.scheme);
	if (["sip", "sips", "urn"].indexOf(request.uri.scheme) === -1) {
		transaction.sendResponse(transaction.createResponse(416, "Unsupported URI scheme"));
		return;
	}

	// NOTE: might not be needed with good UA implementation
	// out of dialog request
	if (!EXISTS(request.to.params.tag)) {
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

		transaction.sendResponse(transaction.createResponse(200, "OK")); // CANCEL response

		if (original.state === "PROCEEDING" || original.state === "TRYING") {
			original.sendResponse(original.createResponse(487, "Request terminated"));
		}

		this.stack.cancelled(this, request); // invoke cancelled on original UA instead of receivedRequest
		return;
	}

	this.stack.onRequest(this, request);
};

UACore.prototype.sendResponse = function(response, responseText, content, contentType, createDialog) {
	if (!EXISTS(this.request)) console.log("Invalid request in sending a response");

	if (typeof response === "number") response = this.createResponse(response, responsetext, content, contentType);

	if ((createDialog !== false) && UACore.canCreateDialog(this.request, response)) {
		// NOTE: ensure the record route is copyed correctly
		if (EXISTS(this.request.record_route)) response.record_route = this.request.record_route;

		// TODO: implement contact header for response
		if (!EXISTS(response.contact)) {
			var contact = this.contact;

			console.log(this.contact);

			if (!EXISTS(contact.uri.user)) contact.uri.user = this.request.to.uri.user;


			if (Utils.unquote(contact.dname) === "Anonymous") {
				var name = this.request.to.uri.user;
				name = name[0].toUpperCase() + name.substr(1);

				contact.dname = "\"" + name + " RTC\"";
			}

			// "\"Anonymous\"<sips:" + this.local.uri.user + "@r3t1cu1um.invalid;transport=wss>;expires=1800";

			response.addHeader("Contact", Reticulum.Parser.Enum.SIP_HDR_CONTACT, contact.toString());
		}

		var dialog = Dialog.createServer(this.stack, this.request, response, this.transaction);

		this.stack.dialogCreated(dialog, this);
		this.stack.sending(dialog, response);
	} else {
		this.stack.sending(this, response);
	}

	if (!EXISTS(this.transaction)) {
		this.stack.send(response, response.vias[0].sentby);
	} else {
		this.transaction.sendResponse(response);
	}
};

UACore.prototype.createResponse = function(responseCode, responseText, content, contentType) {
	var response = null;

	if (!EXISTS(this.request)) console.log("Invalid request in creating a response");
	response = Message.createResponse(responseCode, responseText, null, content, this.request);

	if (contentType) response.addHeader("Content-Type", Reticulum.Parser.Enum.SIP_HDR_CONTENT_TYPE, contentType);
	if (content) response.addHeader("Content-Length", Reticulum.Parser.Enum.SIP_HDR_CONTENT_LENGTH, content.length);


	if (response.statusCode !== 100 && !EXISTS(response.to.params.tag)) response.to.params.tag = this.localTag;
	return response;
};

UACore.prototype.sendCancel = function() {
	if (!EXISTS(this.transaction)) console.log('No transaction for sending CANCEL');

	this.cancelRequest = this.transaction.createCancel();
	if (this.transaction.state !== 'TRYING' && this.transaction.state !== 'CALLING') {
		if (this.transaction.state === 'PROCEEDING') {
			transaction = Transaction.createClient(this.stack, this, this.cancelRequest, this.transaction.transport, this.transaction.remote);
		}
		this.cancelRequest = null;
	}
};

UACore.prototype.timeout = function(transaction) {
	console.log("UACore Timeout handler");
	// if (EXISTS(transaction) && transaction !== this.transaction) {
	// 	console.log("Invalid transaction in UACore timeout");
	// 	return;
	// }
	//
	// this.transaction = null;
	//
	// // if UAC
	// if (!this.server) {
	// 	// TODO: make sure there is at least one remote candidate
	// 	if (this.remoteCandidates && len(this.remoteCandidates)>0) {
	// 		this.retryNextCandidate();
	// 	} else {
	// 		this.onResponse(null, Message.createResponse(408, "Request timeout", null, null, this.request));
	// 	}
	// }
};

UACore.prototype.error = function(transaction, error) {
	console.log("UACore Error handler");
	// if (EXISTS(transaction) && transaction !== this.transaction) return;
	//
	// this.transaction = null;
	//
	// // if UAC
	// if (!this.server) {
	// 	if (this.remoteCandidates && len(this.remoteCandidates)>0) {
	// 		this.retryNextCandidate();
	// 	} else {
	// 		this.onResponse(null, Message.createResponse(503, 'Service unavailable - ' + error, null, null, this.request));
	// 	}
	// }
};

UACore.prototype.authenticate = function(response, transaction) {
	if (!EXISTS(response.challenge)) return false;

	if (!EXISTS(transaction.request)) return false;

	var request = transaction.request;
	var value = Digest.createAuthorization(response, request, this.stack.app.authinfo);

	if (value !== null) {
		var name = response.challenge.proxy ? 'Proxy-Authorization' : 'Authorization';
		var id = response.challenge.proxy ? Reticulum.Parser.Enum.SIP_HDR_PROXY_AUTHORIZATION : Reticulum.Parser.Enum.SIP_HDR_AUTHORIZATION;
		var remote = transaction.remote;

		this.localSeq++;
		request.addHeader(name, id, value);
		request.addHeader("CSeq", Reticulum.Parser.Enum.SIP_HDR_CSEQ, this.localSeq + ' ' + request.method);
		request.vias[0].params.branch = Transaction.createBranch(request);
		this.request = request;
		this.transaction = Transaction.createClient(this.stack, this, request, this.stack.transport, remote);

		return true;
	} else {
		console.log("Error creating Authorization");
		return false;
	}
};

var Dialog = function(stack, request, server, transaction) {
	// Call the parent constructor
	// Create a dialog for the request in server (True) or client (False) mode for given transaction
	UACore.call(this, stack, request, server);

	// pending server and client transactions
	this.servers = [];
	this.clients = [];
	this._id = null;
	this.closed = false;

	if (EXISTS(transaction)) transaction.app = this; // this is a higher layer of transaction
};

Dialog.prototype = Object.create(UACore.prototype);

Dialog.prototype.constructor = Dialog;

Dialog.createServer = function(stack, request, response, transaction) {
	console.log("Create server dialog");
	//Create a dialog from UAS while sending response to request in the transaction
	var dialog = new Dialog(stack, request, true);
	dialog.request = request;
	dialog.routeSet = [];

	if (EXISTS(request.record_routes)) dialog.routeSet = request.record_routes;

	// NOTE: force secure
	dialog.secure = true; //request.uri.secure;
	dialog.localSeq = 0;
	dialog.remoteSeq = request.cseq.number;
	dialog.callid = request.callid;
	dialog.localTag = response.to.params.tag || "";
	dialog.remoteTag = request.from.params.tag || "";
	dialog.localParty = request.to;
	dialog.remoteParty = request.from;

	if (EXISTS(request.contacts) && request.contacts.length > 0) dialog.remoteTarget = request.contacts[0].address.uri;

	stack.dialogs.setItem(dialog.id(), dialog);
	return dialog;
};

Dialog.createClient = function(stack, request, response, transaction) {
	console.log("Create client dialog");
	// Create a dialog from UAC on receiving response to request in the transaction.
	var dialog = new Dialog(stack, request, false);
	dialog.request = request;
	dialog.routeSet = [];

	if (EXISTS(response.record_routes)) dialog.routeSet = response.record_routes;

	// NOTE: force secure
	dialog.secure = true; //request.uri.secure;
	dialog.localSeq = request.cseq.number;
	dialog.remoteSeq = 0;
	dialog.callId = request.callid;
	dialog.localTag = request.from.params.tag || '';
	dialog.remoteTag = response.to.params.tag || '';
	dialog.localParty = request.from;
	dialog.remoteParty =request.to;

	if (EXISTS(response.contacts) && response.contacts.length > 0) dialog.remoteTarget = response.contacts[0].address.uri;

	stack.dialogs.setItem(dialog.id(), dialog);
	return dialog;
};

Dialog.extractId = function(message) {
	// Extract dialog identifier string from a Message m.
	if (message.isRequest)
		return message.callid + '|' + message.to.params.tag + '|' + message.from.params.tag;
	else
		return message.callid + '|' + message.from.params.tag + '|' + message.to.params.tag;
};

Dialog.prototype.close = function () {
	if (this.closed) return;

	var d = this.stack.dialogs.getItem(this.id());

	if (EXISTS(d) && d.closed) return;

	console.log("CLOSE dialog", d);
	if (EXISTS(d)) d.closed = true;
	this.closed = true;
	//if (EXISTS(this.stack)) this.stack.dialogs.removeItem(this.id());
};

Dialog.prototype.id = function () {
	if (!EXISTS(this._id)) this._id = this.callid + '|' + this.localTag + '|' + this.remoteTag;
	return this._id;
};

Dialog.prototype.createRequest = function (method, content, contentType) {
	console.log("Dialog createRequest", this.routeSet);
	var request = UACore.prototype.createRequest.call(this, method, content, contentType);

	if (EXISTS(this.remoteTag)) request.to.params.tag = this.remoteTag;

	// NOTE: needed for strict route support ???
	if (this.routeSet.length > 0 && !EXISTS(this.routeSet[0].uri.params.lr)) {
	 	request.uri = this.routeSet[0].uri;
	}

	// Add Contact to In-Dialog request
	var name = this.localParty.uri.user;
	name = "\"" + name[0].toUpperCase() + name.substr(1) + " RTC\"";

	var tempContact = name + " <sip:" + this.localParty.uri.user + "@r3t1cu1um.invalid;transport=wss>;expires=1800";

	request.addHeader("Contact", Reticulum.Parser.Enum.SIP_HDR_CONTACT, tempContact);

	return request;
};

Dialog.prototype.createResponse = function (responsecode, responsetext, content, contentType) {
	if (this.servers.length === 0) console.log("No server transaction to create response");

	var request = this.servers[0].request;
	var response = Message.createResponse(responsecode, responsetext, null, content, request);
	if (contentType) response.addHeader("Content-Type", Reticulum.Parser.Enum.SIP_HDR_CONTENT_TYPE, contentType);

console.log("NEW DIALOG RESP", "localtag:", this.localtag, "current tag:", response.to.params.tag);

	if (response.statusCode !== 100 && !EXISTS(response.to.params.tag)) {
		response.to.params.tag = this.localTag;
	}

	return response;
};

Dialog.prototype.sendResponse = function (response, responsetext, content, contentType, createDialog) {
	if (createDialog === undefined) createDialog = true;

	if (this.servers.length === 0) console.log("No server transaction to send response");

	this.transaction = this.servers[0];
	this.request = this.servers[0].request;

	UACore.prototype.sendResponse.call(this, response, responsetext, content, contentType, false);

	var code = response;
	if (typeof response !== "number") code = response.statusCode;

	if (code >= 200) this.servers.shift();
};

Dialog.prototype.sendCancel = function () {
	if (this.clients.length === 0) {
		console.log("No client transaction to send cancel");
		return;
	}

	this.transaction = this.clients[0];
	this.request = this.clients[0].request;
	UACore.prototype.sendCancel.call(this);
};

Dialog.prototype.onRequest = function (transaction, request) {
	// Incoming request in the dialog.
	if (this.remoteSeq !== 0 && request.cseq.number < this.remoteSeq) {
		console.log("Dialog.onRequest() CSeq is old", request.cseq.number, this.remoteSeq);
		this.sendResponse(500, "Internal server error - invalid CSeq");
		return;
	}

	this.remoteSeq = request.cseq.number;

	if (request.method === 'INVITE' && request.contacts) {
		this.remoteTarget = request.contacts[0].address.uri;
	}

	if (request.method === 'ACK' || request.method === 'CANCEL') {
		//console.log("ACK or CANCEL in dialog")
		var pos = this.servers.indexOf(transaction);

		if (pos > -1) {
			this.servers.splice(pos, 1);
		}

		if (request.method === 'ACK') {
			this.stack.onRequest(this, request);
		} else {
			this.stack.cancelled(this, transaction.request);
		}
		return;
	}

	this.servers.push(transaction); // make it pending
	this.stack.onRequest(this, request);
};

Dialog.prototype.onResponse = function(transaction, response) {
	console.log("dlg on response");

	// Incoming response in a dialog.
	if (response.is2xx() && EXISTS(response.contacts) && EXISTS(transaction) && transaction.request.method === 'INVITE') {
		this.remoteTarget = request.contacts[0].address.uri;
	}

	if (!response.is1xx()) {// final response
	//if (response.isFinal()) {
		var pos = this.clients.indexOf(transaction);

		if (pos > -1) {
			this.clients.splice(pos, 1);
		}
	}

	if (response.statusCode === 408 || response.statusCode === 481) {// remote doesn't recognize the dialog
		this.close();
	}

	if (response.statusCode === 401 || response.statusCode === 407) {
		if (!this.authenticate(response, transaction)) {
			this.stack.onResponse(this, response);
		}
	} else if (transaction) {
		this.clients.push(transaction); // make it pending

		this.stack.onResponse(this, response);
	}

//console.log("In dialog send ACK");
	if (this.autoack && response.is2xx && (transaction && transaction.request.method == 'INVITE' || response.CSeq.method == 'INVITE')) {
		this.sendRequest(this.createRequest('ACK'));
	}

	if (response.is2xx() && response.method === 'BYE') {
		console.log("Got 200 OK response on BYE, close dialog");
		this.close();
	} else if (response.isFinal() && response.method === 'BYE') {
		console.log("Got FINAL response to BYE in dialog, close dialog");
		this.close();
	}
};
