///     \m/>_<\m/      ///

var AuthInfo = function(username, password) {
	this.user = username;
	this.password = password;

	this.realm = "reticulum";
	this.nc = 0;
};

var enable = function(id) { document.getElementById(id).classList.remove("mdl-button--disabled");};
var disable = function(id) { document.getElementById(id).classList.add("mdl-button--disabled");};

var Phone = function(autorespond, autodecline, authinfo, realm, port, protocol) {
	// this.transport = new Transport(this, realm, port, 'ws');
	this.transport = new Transport(this, realm, port, protocol);
	this.stack = new Stack(this, this.transport);
	this.media = new Media(true, true);
	console.log("Phone UA constructor", authinfo);
	this._ua = new UA(this, this.stack, this.media, authinfo, realm);
	this.media.setVideoContainersIDs("localVideo", "remoteVideo");
	this.media.getMedia();

	this.refreshRegistration = null;
	this.regState = "UNREGISTERED";
	this._ua.setState("IDLE");

	//this.inviteUA = null;

	//var u = this._ua;
	//var a = this.inviteUA;
	var self = this;

	// Media call handlers
	this.media.handleOffer = function(to, uri, subject) {
		self._ua.sendInvite(to, uri, subject);
	};
	//this.ua.sendInvite;
	this.media.handleAnswer = function() {
		//u.sendAnswer();
		//if (!EXISTS(self.inviteUA)) return;
		//self.inviteUA.sendResponse(self.inviteUA.createResponse(200, "OK", self.media.getLocalSDP(), "application/sdp"));
		self._ua.uacore.sendResponse(self._ua.uacore.createResponse(200, "OK", self.media.getLocalSDP(), "application/sdp"));
	};

	// console.log(this.media.handleOffer);
	// console.log(this.media.handleAnswer);

	// NOTE: allow outbound not needed due to WebSocket connection
	//this.hasOutbound = true; // false; // ??? don't allow outbound from server
	this.autorespond = autorespond;
	this.autodecline = autodecline;


	// Stack
	//var stack = this.stack;
	//this.transport.onData = stack.onData;
	/*this.transport.onData = function(data, source) {
		stack.onData(data, source);
	};*/

	// UA
	this.authinfo = authinfo;
	this.user = authinfo.user;
	this.realm = realm;
	this.server = realm + ":" + port;
};

Phone.prototype.setStateFromTransaction = function (type, oldstate, state, method) {
	console.log(method, "request", type, "transaction state from:", oldstate, ", to:", state)

	if (type === "INV_SERVER" && oldstate === "PROCEEDING" && state === "COMPLETED") {
		this._ua.setState("ACTIVE");
	} else if (type === "INV_SERVER" && oldstate === "COMPLETED" && state === "CONFIRMED" && method === "INVITE") {
		this._ua.setState("IDLE");
	} else if (type === "INV_CLIENT" && oldstate === "COMPLETED" && state === "TERMINATED" && method === "INVITE") {
		this._ua.setState("IDLE");
	} else if (this.state === "TERMINATING" && type === "NON_CLIENT" && method === "BYE" && oldstate === "TRYING" && state === "COMPLETED") {
		this._ua.setState("IDLE");
	}
};

Phone.prototype._setState = function (state) {
	console.log("[P state] from:", this.state, ", to:", state)
	if (EXISTS(this._ua)) console.log("[UA state]", this._ua.state)

	var lbl = document.getElementById("phone-state");

	disable("reg");
	disable("connect");
	disable("call");
	disable("answer");
	disable("reject");
	disable("hangup");

	if (state === "IDLE") {
		lbl.innerText = "AVAILABLE";
		enable("call");
	} else if (state === "PROCEEDING") {
		lbl.innerText = "RINGING";
		enable("answer");
		enable("reject");
	} else if (state === "INVITING") {
		lbl.innerText = "CALLING";
		enable("reject");
	} else if (state === "ACTIVE") {
		lbl.innerText = "ON CALL";
		enable("hangup");
	} else if (state === "ACCEPTED") {
		lbl.innerText = "ON CALL";
		enable("hangup");
	} else if (state === "CONFIRMED") {
	} else if (state === "COMPLETED") {
	} else if (state === "TERMINATING") {
		if (this.state == "ACTIVE") {
			this._ua.setState("IDLE");
			return;
		}
	} else if (state === "TERMINATED") {
	} else {
		lbl.innerText = "UNAVAILABLE";
		enable("reg");
		enable("connect");
	}

	if (this.regState === "REGISTERED") {
		;
	} else if (this.regState === "REGISTERING") {
		;
	} else if (this.regState === "UNREGISTERING") {
		;
	} else if (this.regState === "UNREGISTERED") {
		enable("reg");
		enable("connect");
		disable("call");
		disable("answer");
		disable("reject");
		disable("hangup");

		lbl.innerText = "UNREGISTERED";
	}

	this.state = state;
};

//Phone.prototype.wait = function() {};

Phone.prototype.close = function() {
	// TODO: close ua
};

Phone.prototype.onRequest = function(ua, request, stack) {
	if (request.method === "MESSAGE") {
		this.onMessage(ua, request);
	//} else if (request.method === "INVITE") {
	} else if (request.method === "INVITE" || request.method === "BYE" || request.method === "ACK") {
		this.onInvite(ua, request);
	} else {
		ua.sendResponse(501, "Method Not Implemented");
	}
};

Phone.prototype.onResponse = function(ua, request, stack) {
	this._ua.onResponse(ua, request);
	//this.onMessage(ua, request);
};

Phone.prototype.onMessage = function(ua, request) {
	if (this.auto_respond) {
		ua.sendResponse(ua.createResponse(/*this.auto_respond*/200, "OK"));
	} else if (this.autodecline) {
		ua.sendResponse(ua.createResponse(/*this.auto_respond*/603, "Decline"));
	}
};

Phone.prototype.onInvite = function(ua, request) {
	console.log("There is an INVITE!!!", this.auto_respond, this.autorespond, this.autodecline);
	// this.autorespond = false;
	// this.autodecline = false;

	if (this.autodecline) {
		ua.sendResponse(ua.createResponse(603, "Decline"));
		return;
	}

	if (request.method === "INVITE") {
		//console.log("I HAVE A CALL!!! old state?", this.state);
		if (this.state === "IDLE") {
			if (!EXISTS(this._ua)) {
				//console.log("PHONE ON INVITE", this._ua, this.ua, ua)

				this._ua.app = this;

				this._ua.uacore = ua;
				this._ua.uacore.app = this;
			}
			this._ua.setState("INVITED");

			if (request.getBody() && EXISTS(request.contentType) && request.contentType.subtype === "sdp") {
				req = request;
				//this.media.remoteSDP = request.getBody()
				if (this.media) {
					this.media.setRemoteSDP(request.getBody());
				} else {
					console.log("Missing media while processing received INVITE");
				}
			} else {
				console.log("No SDP in received INVITE");
			}

//			this.media = voip.MediaSession(app=this, streams=this._audio, request=req, listen_ip=this.options.int_ip, NetworkClass=rfc3550.gevent_Network) # create local media session
			//this.media.getMedia();
			//if (this.media.localSDP === null) {
			if (this.media.getLocalSDP() === null) {
				this._ua.setState("IDLE");

				ua.sendResponse(ua.createResponse(488, "Incompatible SDP"));
//				this.close();
			}

			// TODO: Add contact header ???
			this._ua.setState("PROCEEDING");
			//console.log("[INVITE UA]", ua);
			ua.sendResponse(ua.transaction.createResponse(180, "Ringing"));

			this._ua.uacore = ua;

			if (this.autorespond) {
				this.media.makeAnswer();
			}
		} else {
			ua.sendResponse(ua.createResponse(486, 'Busy Here'));
		}
	} else if (request.method === "BYE") {
		// console.log("Phone invite got BYE", this._ua, this.ua, ua, this.state);
		// console.log("Desparate check BYE", this._ua.uacore === ua)
		if (this._ua.uacore === ua) {
			this.media.stopAudio();
			if (this.state !== "IDLE") {
				// Call hangup by remote
				this._ua.setState("IDLE");
				ua.sendResponse(ua.createResponse(200, "OK"));
			}
			console.log("Close Dialog in Phone");
			//this._ua.uacore.close();
			this._ua.closeCore();
			//this.close();
		} else {
			ua.sendResponse(ua.createResponse(481, "Dialog Not Found"));
		}
	} else if (request.method === "ACK") {
		console.log("Desparate check ACK", this._ua.uacore, ua)
		if (this._ua.uacore === ua) {
			if (this.state === "ACCEPTED") {
				this._ua.setState("ACTIVE");
				if (request.getBody() && EXISTS(request.contentType) && request.contentType.subtype === "sdp") {
					var sdp = request.getBody();//rfc4566.SDP(request.body);
					if (this.media) {
						this.media.setRemoteSDP(sdp);
					} else {
						console.log("Missing media while processing received ACK");
					}
				} else {
					console.log("no SDP in received ACK");
				}

				if (!this.options.audio_loopback && this.options.audio) {
					this.media.startAudio();
				}
			} else {
				console.log("Ignoring ACK for UA state:", this.state);
			}
		} else {
			console.log("Received ACK for invalid UA.");
		}
	}
};

Phone.prototype.onCancelled = function(ua, request, stack) {
	//TODO: cancelled
	//this._ua.cancel();
};

//Phone.prototype.dialogCreated = function(dialog, ua, stack) {
Phone.prototype.dialogCreated = function(dialog, ua, request, stack) {
	//TODO: dialogCreated
	// console.log("Phone dialogCreated", this.ua, ua, dialog, request);
	this._ua.dialogCreated(dialog, ua);
};

Phone.prototype.createServer = function(request, uri, stack) {
	if (request.method !== "CANCEL") {
		//console.log("create Server before UACore constr call", this.authinfo);
		return new UACore(stack, request, this.authinfo);
	}

	return null;
};

Phone.prototype.send = function(data, address, stack) {
	this.transport.send(data, address);
};

Phone.prototype.register = function() {
	this._ua.register();
};

Phone.prototype.call = function(to, uri) {
	//this.ua.sendInvite(to, uri);
	this.media.makeOffer(to, uri);
};

Phone.prototype.answer = function() {
	this.media.makeAnswer();
};

Phone.prototype.reject = function() {
	this._ua.closeCall();
};

var UA = function(app, stack, media, authinfo, domain) {
	this.app = app;
	this.state = app.state;
	this.stack = stack;
	//console.log("[UA]", this.stack, media);
	this.uacore = null;

	this.scheme = this.stack.transport.secure ? "sips" : "sip";
	this.user = authinfo.user;
	this.domain = domain;

	this.local = Reticulum.Parser.parseAddress(this.scheme + ":" + this.user + "@" + domain);
	//this.remote = null;

	// Register
	//this.setState("IDLE");
	this.regInterval = 3600; // TODO: find the correct value

	// NOTE: create initial UA Client form and prepare for registration
	this.createClient(this.local, this.local, domain, authinfo);

	// Call
	this.media = media;

	this.authinfo = authinfo;
};

UA.prototype.setState = function(state) {
	console.log("[UA state] from:", this.state, "to", state, "Phone state:", this.app.state );
	this.state = state;
	this.app._setState(state);
};

UA.prototype.setRegState = function(state) {
	this.app.regState = state;
};

UA.prototype.onClose = function() {};

UA.prototype.register = function() {
	this.setState("REGISTERING");
	this.uacore.sendRequest(this.createRequest("REGISTER"));
};

UA.prototype.createClient = function(local, remote, remoteTarget, authinfo) {
	// TODO: Check if setting this variable is OK!!!
	// this.app = this; // ???
	this.uacore = new UACore(this.stack, null, authinfo);

	// NOTE: set for FROM and TO
	this.uacore.local = local;
	this.uacore.remote = remote;

	// NOTE: set for Request-URI
	this.uacore.remoteTarget = remoteTarget;
};

UA.prototype.refreshLater = function(delay, handler) {
	var interval = 3600;
	if (EXISTS(delay)) interval = delay;

	var self = this;

	window.setTimeout(function() {
		handler.call(self);
	}, interval*1000);
};

UA.prototype.retryLater = function(handler) {
	var interval = 3600 * 2;

	var self = this;

	window.setTimeout(function() {
		handler.call(self);
	}, interval*1000);
};

UA.prototype.sendLater = function(message, delay) {
	//;
};

// NOTE: promote UA to Dialog
UA.prototype.dialogCreated = function(dialog, ua) {
	console.log("Promoting to dialog", this.uacore, this.uacore.app);

	this._oldcore = this.uacore;

	//if (EXISTS(this.uacore)) this.uacore.app = null;
	this.uacore = dialog;
	this.uacore.app = this;
};

UA.prototype.sendInvite = function(to, uri, subject) {
	this.remote = Reticulum.Parser.parseAddress(to);
	this.remoteTarget = this.remote.uri;

	// Update client remote data
	this.uacore.remote = this.remote;
	this.uacore.remoteTarget = this.remoteTarget;

	this.uacore.localTag = Utils.token(10, Utils.TOKEN_NUMERIC_32);
	this.uacore.callid = this.stack.createCallID();

	this.setState("INVITING");
	var request = this.createRequest("INVITE", subject, this.media.getLocalSDP());

	// NOTE: make sure every INVITE ha unique callid and from tag
	// request.from.params.tag = Utils.token(10, Utils.TOKEN_NUMERIC_32);
	//request.addHeader("Call-ID", Reticulum.Parser.Enum.SIP_HDR_CALL_ID, this.stack.createCallID());

console.log("UACORE on invite send", this.uacore);
	this.uacore.sendRequest(request);
};

UA.prototype.sendAnswer = function() {
	//if (!EXISTS(this.inviteUA)) return;
	//this.inviteUA.sendResponse(this.inviteUA.createResponse(200, "OK", this.media.getLocalSDP(), "application/sdp"));
	this.ua.sendResponse(this.ua.createResponse(200, "OK", this.media.getLocalSDP(), "application/sdp"));
};

UA.prototype.createRequest = function(method, subject, body) {
	console.log("UA create REQUEST");
	var request = null;
	var interval = 3600;
	if (method === "REGISTER") {
		console.log("UA create Register");
		//request = this.uacore.createRequest(method);
		request = this.uacore.createRegister(this.scheme + ":" + this.user + "@" + this.domain);

		// request.addHeader("Contact", Reticulum.Parser.Enum.SIP_HDR_CONTACT, this.stack.uri());
		//console.log(request);
		//console.log(request.contacts);
		// request.contacts[0].uri.host.name = this.user;
		request.addHeader("Expires", Reticulum.Parser.Enum.SIP_HDR_EXPIRES, interval);
	} else if (method === "MESSAGE") {
		request = this.uacore.createRequest(method);
		// request.addHeader("Contact", Reticulum.Parser.Enum.SIP_HDR_CONTACT, this.stack.uri());
		// request.contacts[0].uri.host.name = this.user;
		// TODO: fix User-Agent header code to detect Phone app version and browser
		request.addHeader("User-Agent", Reticulum.Parser.Enum.SIP_HDR_USER_AGENT, "Reticulum client 0.0.1 Chrome");
		request.addHeader("Subject", Reticulum.Parser.Enum.SIP_HDR_SUBJECT, subject);
		request.addHeader("Content-Type", Reticulum.Parser.Enum.SIP_HDR_CONTENT_TYPE, "text/plain");
		request.body = body;
	} else if (method === "INVITE") {
		request = this.uacore.createRequest(method);
		// request.addHeader("Contact", Reticulum.Parser.Enum.SIP_HDR_CONTACT, this.stack.uri());
		// request.contacts[0].uri.host.name = this.user;
		// TODO: fix User-Agent header code to detect Phone app version and browser
		request.addHeader("User-Agent", Reticulum.Parser.Enum.SIP_HDR_USER_AGENT, "Reticulum client 0.0.1 Chrome");
		request.addHeader("Subject", Reticulum.Parser.Enum.SIP_HDR_SUBJECT, subject);
		request.addHeader("Content-Type", Reticulum.Parser.Enum.SIP_HDR_CONTENT_TYPE, "application/sdp");
		request.body = body;
	} else if (method === "BYE") {
		request = this.uacore.createRequest(method);
		// request.addHeader("Contact", Reticulum.Parser.Enum.SIP_HDR_CONTACT, this.stack.uri());
		// request.contacts[0].uri.host.name = this.user;
		// TODO: fix User-Agent header code to detect Phone app version and browser
		request.addHeader("User-Agent", Reticulum.Parser.Enum.SIP_HDR_USER_AGENT, "Reticulum client 0.0.1 Chrome");
	}

	console.log("TRIED to create request", method);

	return request;
};

UA.prototype.onResponse = function(ua, response) {
	console.log("App UA onresp:", response);
	if (response.method === "REGISTER") {
		//console.log("REG state before:", this.state);
		if (this.state === "REGISTERING") {
			if (response.is2xx()) {
				// TODO: create separate phone registered state for now set IDLE state
				// this.setState("REGISTERED");
				this.stack.fixedContact = response.contacts[0];
				this.stack.fixedVia = response.vias[0];

				this.setRegState("REGISTERED");
				this.setState("IDLE");
				this.refreshLater(response.expires, this.register);
			} else if (response.isFinal()) {
				this.setRegState("UNREGISTERED");
				this.setState("IDLE");
				//this.retryLater(this.register);
			}
		} else if (this.state === "UNREGISTERING") {
			if (response.isFinal()) {
				this.setState("IDLE");

				if (this.state === "REGISTERING" || this.state === "REGISTERED") {
					this.setRegState("UNREGISTERED");
					this.setState("UNREGISTERING");
					this.register(false);
				}

				this.setState("IDLE");
				//this.signalClose();
			}
		}
	} else if (response.method === "INVITE") {
		var sdp = null;

		if (this.state === 'INVITING') {
			if (response.is2xx()) {
				this.setState('ACTIVE');

				if (response.getBody()) {// && EXISTS(response.contentType) && response.contentType.subtype === "sdp") {
					if (this.media) {
						this.media.setRemoteSDP(response.getBody());

						ua.sendRequest(this.uacore.createAck(response));
					} else {
						console.log("Error. Missing media while processing 200 OK");
					}
				} else {
					console.log("Error. No SDP in received 200 OK");
				}
			} else if (response.statusCode === 183) {
				if (response.getBody() && EXISTS(response.contentType) && response.contentType.subtype === "sdp") {
					sdp = response.getBody();
					if (this.media) {
						this.media.setRemoteSDP(sdp);
						/*if (this.media.audio) {
							//this.startAudio();
						}*/
					} else {
						console.log("Error. Invalid media received in 200 OK")
					}
				}
			} else if (response.isFinal()) {
				console.log("CLOSE on final response on Invite")
				this.closeCore();
				this.setState('IDLE');
				//this._signalClose();
			}
		} else if (this.state === 'TERMINATING') {
			if (response.isFinal()) {
				//this._signalClose();
			}
		}
	}
};

UA.prototype.closeCore = function() {
	console.log("Downgrading core", this.uacore);
	console.log("Old core", this._oldcore);

	if (!EXISTS(this.uacore.close)) return;

	// Close core upgraded to dialog
	this.uacore.close();
	this.uacore = null;

	// Recreate UACore to be able to make calls
	//this.createClient(this.local, this.local, this.domain, this.authinfo);
	this.uacore = this._oldcore;
};

UA.prototype.onRequest = function(ua, request) {
	var sdp = null;
	if (request.method === "INVITE") {
		if (this.state === "IDLE") {
			//if (this.uacore === null) {
				this.uacore = ua;
				this.uacore.app = this;
			//}

			this.setState("INVITED");

			if (this.media.localSDP === null) {
				this.setState("IDLE");
				ua.sendResponse(ua.createResponse(488, "Incompatible SDP"));
				//this.close();
			} else if (this.autorespond) {
				console.log("AUTORESPOND to Call from", request.from.dname, request.from.uri.user);
				//this.sendLater(this.delay, this.autoRespond);
				// TODO: SEND 200 OK with delay. Make sure that it's not sent twice
			}
		} else {
			ua.sendResponse(ua.createResponse(486, "Busy Here"));
		}
	} else if (request.method === "BYE") {
		if (this.uacore === ua) {
			this.media.stopAudio();
			console.log("Close Dialog from UA");
			//this.uacore.close();
			this.closeCore();
			if (this.state !== "IDLE") {
				console.log("call closed by remote party");
				this.setState("IDLE");
				ua.sendResponse(ua.createResponse(200, "OK"));
			}
			//this.close();
		} else {
			console.log("dialog not found error", this.uacore, ua, this.state);
			ua.sendResponse(ua.createResponse(481, "Dialog Not Found"));
		}
	} else if (request.method === "ACK") {
		if (this.uacore === ua) {
			if (this.state === "ACCEPTED") {
				this.setState("ACTIVE");
				if (request.getBody() && request["Content-Type"] && request["Content-Type"].value.lower() === "application/sdp") {
					sdp = request.getBody();
					if (this.media) {
						this.media.setRemote(sdp);
					} else {
						console.log("invalid media in processing received ACK");
					}
				} else {
					console.log("no SDP in received ACK");
				}
				if (this.media.audio) {
					//this.startAudio();
				}
			} else {
				console.log("ignoring ACK in state", this.state);
			}
		} else {
			console.log("received ACK for invalid UA");
		}
	}
};

UA.prototype.closeCall = function() {
	console.log("[CLOSE]", this, this.state, this.uacore)
	if (this.state === "ACTIVE" || this.state === "INVITING" || this.state === "ACCEPTED") {
		if (this.state === "INVITING") {
			this.setState("TERMINATING");
console.log("SEND CANCEL");
			this.uacore.sendCancel();
		} else {
			this.setState("TERMINATING");
console.log("SEND BYE");
			this.uacore.sendRequest(this.createRequest("BYE"));
			//this._ua.sendRequest(this._ua.createRequest("BYE"));
		}

		this.media.stopAudio();
	} else if (this.state === "INVITED") {

		// TODO: check if needed for autoclose
		//this.uacore.sendRequest(this.createResponse(480, "Temporarily Unavailable"));

		//var app = this.app;

		//if (!EXISTS(app.inviteUA)) return;
console.log("Reject Call", "SEND 480 Response");
		//app.inviteUA.sendRequest(app.inviteUA.createResponse(480, "Temporarily Unavailable"));
		this.uacore.sendResponse(this.uacore.createResponse(480, "Temporarily Unavailable"));
	} else if (this.state === "PROCEEDING") {
		console.log("Reject Call", "SEND 603 Response");
		this.uacore.sendResponse(this.uacore.createResponse(603, "Decline"));
	}
};
