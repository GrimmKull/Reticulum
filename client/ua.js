/*class Caller(object):
	def __init__(self, options):
		self.options, self._ua, self._closeQueue, self.stacks = options, [], Queue(), Stacks(self, options)
		self.stacks.allow_outbound = True
		self.stacks.start()
		if self.options.register:
			self._ua.append(Register(self, self.stacks.default))
		elif self.options.send:
			self._ua.append(Message(self, self.stacks.default))
		elif not self.options.listen:
			call = Call(self, self.stacks.default)
			self._ua.append(call)
			call.sendInvite()*/
var Phone = function(autorespond, autodecline, user, domain, port) {
	this.transport = new Transport(this, domain, port, 'ws');
	this.stack = new Stack(this, this.transport);
	this.media = new Media(true, true);
	this.ua = new UA(this, this.stack, this.media, user, domain);
	this.media.setVideoContainersIDs("localVideo", "remoteVideo");
	this.media.getMedia();

	this.state = "IDLE";

	this.inviteUA = null;

	//var u = this.ua;
	//var a = this.inviteUA;
	var self = this;

	// Media call handlers
	this.media.handleOffer = function(to, uri, subject) {
		self.ua.sendInvite(to, uri, subject);
	};
	//this.ua.sendInvite;
	this.media.handleAnswer = function() {
		//u.sendAnswer();
		if (!EXISTS(self.inviteUA)) return;

		self.inviteUA.sendResponse(self.inviteUA.createResponse(200, "OK"));
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
	this.user = user;
	this.domain = domain + ":" + port;
};

	/*def wait(self):
		self._closeQueue.get()*/
Phone.prototype.wait = function() {};
	/*def close(self):
		[ua.close() for ua in self._ua]
		self._ua[:] = []
		self.stacks.stop()*/
Phone.prototype.close = function() {};
/*def receivedRequest(self, ua, request, stack):
	if not self._proxyToApp('receivedRequest', ua, request):
		method = 'received' + request.method[:1].upper() + request.method[1:].lower()
		if hasattr(self.app, method) and callable(eval('self.app.' + method)): eval('self.app.' + method)(ua, request)
		elif request.method != 'ACK': ua.sendResponse(501, 'Method Not Implemented') */
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
//def receivedResponse(self, ua, response, stack): self._proxyToApp('receivedResponse', ua, response)
Phone.prototype.onResponse = function(ua, request, stack) {
	this.ua.onResponse(ua, request);
	//this.onMessage(ua, request);
};
	//# following callbacks are invoked by Stacks when corresponding new incoming request is received in a new UAS.
	/*def receivedMessage(self, ua, request):
		if not self.options.listen:
			ua.sendResponse(ua.createResponse(501, 'Not Implemented'))
		else:
			logger.info('received: %s', request.body)
			if options.auto_respond:
				ua.sendResponse(ua.createResponse(options.auto_respond, 'OK' if options.auto_respond >= 200 and options.auto_respond < 300 else 'Decline'))*/
Phone.prototype.onMessage = function(ua, request) {
	if (this.auto_respond) {
		ua.sendResponse(ua.createResponse(/*this.auto_respond*/200, "OK"));
	} else if (this.autodecline) {
		ua.sendResponse(ua.createResponse(/*this.auto_respond*/603, "Decline"));
	}
};
	/*def receivedInvite(self, ua, request):
		if not self.options.listen:
			ua.sendResponse(ua.createResponse(501, 'Not Implemented'))
		else:
			logger.info('received INVITE')
			if self.options.auto_respond >= 200 and self.options.auto_respond < 300:
				call = Call(self, ua.stack)
				call.receivedRequest(ua, request)
			elif self.options.auto_respond:
				ua.sendResponse(ua.createResponse(self.options.auto_respond, 'Decline'))*/
Phone.prototype.onInvite = function(ua, request) {
	console.log("There is an INVITE!!!", this.auto_respond, this.autorespond, this.autodecline)
	this.autorespond = false;
	this.autodecline = false;

	if (this.autodecline) {
		ua.sendResponse(ua.createResponse(603, "Decline"));
		return;
	}

	if (request.method === "INVITE") {
		console.log("I HAVE A CALL!!! old state?", this.state)
		if (this.state === "IDLE") {
			/*if (this._ua is None)
				self._ua, ua.app = ua, self*/
			this.state = "INVITED";

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
				this.state = "IDLE";

				ua.sendResponse(ua.createResponse(488, "Incompatible SDP"));
//				this.close();
//			} else if (this.options.auto_respond) {
//				this._gen = gevent.spawn_later(this.options.auto_respond_after, this._autoRespond);
			}

			if (this.autorespond) {
				ua.sendResponse(ua.createResponse(200, "OK"));
			} else {
				// TODO: Add contact header ???
				this.state = "PROCEEDING";
				console.log("[INVITE UA]", ua);
				ua.sendResponse(ua.transaction.createResponse(180, "Ringing"));

				this.inviteUA = ua;
			}
		} else {
			ua.sendResponse(ua.createResponse(486, 'Busy Here'));
		}
	} else if (request.method === "BYE")	{
		if (this._ua === ua) {
			this.stopAudio();
			if (this.state !== "IDLE") {
				// Call hangup by remote
				this.state = "IDLE";
				ua.sendResponse(ua.createResponse(200, "OK"));
			}
			this.close();
		} else {
			ua.sendResponse(ua.createResponse(481, "Dialog Not Found"));
		}
	} else if (request.method === "ACK") {
		if (this._ua == ua) {
			if (this.state === "ACCEPTED") {
				this.state = "ACTIVE";
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
					this.startAudio();
				}
			} else {
				//logger.warning("ignoring ACK in state %r"%(this.state,))
			}
		} else {
			//logger.warning("received ACK for invalid UA")
		}
	}
};

	/*def callClosed(self, ua):
		if ua in self._ua:
			self._ua.remove(ua)
		if not self.options.listen:
			self._closeQueue.put(None)*/
Phone.prototype.onCallClosed = function(ua) {
	// body...
};
//def cancelled(self, ua, request, stack): logger.debug('cancelled'); self._proxyToApp('cancelled', ua, request)
Phone.prototype.onCancelled = function(ua, request, stack) {
	//TODO: cancelled
};
//def dialogCreated(self, dialog, ua, stack): self._proxyToApp('dialogCreated', ua, dialog)
Phone.prototype.dialogCreated = function(ua, request, stack) {
	//TODO: dialogCreated
};
//def createServer(self, request, uri, stack):  return rfc3261.UserAgent(stack, request) if request.method != 'CANCEL' else None
Phone.prototype.createServer = function(request, uri, stack) {
	if (request.method !== "CANCEL")
		return new UACore(stack, request);

	return null;
};

/*def send(self, data, addr, stack):
	logger.debug('sending %r=>%r on type %s\n%s', stack.sock.getsockname(), addr, stack.transport.type, data)
	if stack.sock:
		try:
			if stack.transport.type == Stacks.UDP: stack.sock.sendto(data, addr)
			elif addr in self._conn: self._conn[addr].sendall(data)
			elif self.allow_outbound:
				conn = self._conn[addr] = socket.socket(type=socket.SOCK_STREAM)
				try:
					logger.debug('first connecting to %r', addr)
					conn.connect(addr)
					conn.sendall(data)
					gevent.spawn(self._siptcpreceiver, stack, conn, addr)
				except:
					logger.exception('failed to connect to %r', addr)
			else: logger.warning('ignoring as cannot create outbound socket connection')
		except socket.error:
			logger.exception('socket error in sending')*/
Phone.prototype.send = function(data, address, stack) {
	this.transport.send(data, address);
};

Phone.prototype.register = function() {
	this.ua.register();
};

Phone.prototype.call = function(to, uri) {
	//this.ua.sendInvite(to, uri);
	this.media.makeOffer(to, uri);
};

Phone.prototype.answer = function() {
	this.media.makeAnswer();
}
/*class UA(object):
	def __init__(self, app, stack):
		self.app, self.options, self._stack = app, app.options, stack
		self._closeQ = self._ua = self._gen = None
		self.scheme = self._stack.transport.secure and 'sips' or 'sip'
		self.localParty =  rfc2396.Address('%s:%s@%s'%(self.scheme, self.options.user, self.options.domain))
		self.proxy = rfc2396.URI('%s:%s'%(self.scheme, self.options.proxy)) if self.options.proxy else None*/
/*class Register(UA):
	IDLE, REGISTERING, REGISTERED, UNREGISTERING = 'idle', 'registering', 'registered', 'unregistering' # state values
	def __init__(self, app, stack):
		UA.__init__(self, app, stack)
		self.state, self._interval = self.IDLE, self.options.register_interval
		self._createClient(self.localParty, self.localParty, self.proxy if self.proxy else self.localParty.uri)
		self._register()*/
/*class Message(UA):
	def __init__(self, app, stack):
		UA.__init__(self, app, stack)
		remoteParty = self.options.to
		remoteTarget = self.options.uri
		self._createClient(self.localParty, remoteParty, remoteTarget)
		if self.options.proxy:
			self.proxy = rfc2396.URI('%s:%s'%(self.scheme, self.options.proxy, '' if self.options.strict_route else ';lr'))
			self._ua.routeSet = [rfc3261.Header('<%s>'%(str(self.proxy),), 'Route')]
		self._ua.sendRequest(self._createRequest(self.options.send))*/
/*class Call(UA):
	def __init__(self, app, stack):
		UA.__init__(self, app, stack)
		self.media, self.audio, self.state = None, None, 'idle'
		audio, self._pcmu, self._pcma = rfc4566.SDP.media(media='audio'), rfc4566.attrs(pt=0, name='pcmu', rate=8000), rfc4566.attrs(pt=8, name='pcma', rate=8000)
		audio.fmt = [self._pcmu, self._pcma]
		self._audio, self._queue, self._resample1, self._resample2 = [audio], [], None, None*/
var UA = function(app, stack, media, user, domain) {
	this.app = app;
	this.stack = stack;
	//console.log("[UA]", this.stack, media);
	this.uacore = null;

	this.scheme = this.stack.transport.secure ? "sips" : "sip";
	this.user = user;
	this.domain = domain;

	this.local = Reticulum.Parser.parseAddress(this.scheme + ":" + user + "@" + domain);
	//this.remote = null;

	// Register
	this.state = "IDLE";
	this.regInterval = 3600; // TODO: find the correct value

	var server = this.proxy ? this.proxy : this.local.uri;
	this.createClient(this.local, this.local, server);

	// Message
	// TODO: implement this section for Message capabilities

	// Call
	this.media = media;

};

UA.prototype.onClose = function() {};
	/*def _register(self):
		self.state = self.REGISTERING
		self._ua.sendRequest(self._createRequest())*/
UA.prototype.register = function() {
	this.state = "REGISTERING";
	this.uacore.sendRequest(this.createRequest("REGISTER"));
};
	/*def _waitOnClose(self): # Wait on close event to be signaled by another task
		if self._closeQ is None: self._closeQ = Queue(); self._closeQ.get(); self._closeQ = None
		else: raise ValueError('some other task is already waiting on close')*/
UA.prototype.waitOnClose = function() {};
	/*def _signalClose(self): # Signal the close event on this object.
		if self._closeQ is not None: self._closeQ.put(None)*/
UA.prototype.closeSignal = function() {};
	/*def _createClient(self, localParty, remoteParty, remoteTarget):
		ua = self._ua = rfc3261.UserAgent(self._stack)
		ua.app, ua.localParty, ua.remoteParty, ua.remoteTarget = self, localParty.dup(), remoteParty.dup(), remoteTarget.dup()*/
UA.prototype.createClient = function(local, remote, remoteTarget) {
	this.app = this; // ???
	this.uacore = new UACore(this.stack, null);
	this.uacore.local = local;
	this.uacore.remote = remote;
	this.uacore.remoteTarget = remoteTarget;

	//console.log(this.uacore);
};
	/*def _scheduleRefresh(self, response, handler): # Schedule handler to be invoked before response.Expires or self._interval
		interval = int(response.Expires.value) if response.Expires else self._interval
		interval = max(interval-random.randint(5000, 15000)/1000.0, 5)
		if interval > 0:
			logger.debug('scheduling refresh after %r', interval)
			self._gen = gevent.spawn_later(interval, handler)*/
UA.prototype.refreshLater = function(response, handler) {
	//;
};
	/*def _scheduleRetry(self, handler): # Schedule handler to be invoked after retry_interval.
		logger.debug('scheduling retry after %r', self.options.retry_interval)
		self._gen = gevent.spawn_later(self.options.retry_interval, handler)*/
UA.prototype.retryLater = function(handler) {
	//;
};

UA.prototype.sendLater = function(message, delay) {
	//;
};
	/*def _closeGen(self):
		if self._gen is not None: self._gen.kill(); self._gen = None*/

	/*def _closeUA(self):
		if self._ua is not None: self._ua.app = None; self._ua = None
		self.app = None # remove reference*/

	/*def dialogCreated(self, ua, dialog): # Invoked by SIP stack to inform that UserAgent is converted to Dialog.
		if self._ua is not None: self._ua.app = None
		self._ua, dialog.app = dialog, self*/
UA.prototype.dialogCreated = function(ua, dialog) {
	if (self.uacore !== null) this.uacore.app = null;
	this.uacore = dialog;
	dialog.app = this;
};
	/*def sendInvite(self):
		remoteParty = self.options.to
		remoteTarget = self.options.uri
		self._createClient(self.localParty, remoteParty, remoteTarget)
		if self.options.proxy:
			self.proxy = rfc2396.URI('%s:%s%s'%(self.scheme, self.options.proxy, '' if self.options.strict_route else ';lr'))
			self._ua.routeSet = [rfc3261.Header('<%s>'%(str(self.proxy),), 'Route')]

		m = self._ua.createRequest('INVITE')
		m.Contact = rfc3261.Header(str(self._stack.uri), 'Contact')
		m.Contact.value.uri.user = self.options.user
		if self.options.user_agent:
			m['User-Agent'] = rfc3261.Header(self.options.user_agent, 'User-Agent')
		if self.options.subject:
			m['Subject'] = rfc3261.Header(self.options.subject, 'Subject')

		if self.options.has_sdp:
			self.media = voip.MediaSession(app=self, streams=self._audio, listen_ip=self.options.int_ip, NetworkClass=rfc3550.gevent_Network) # create local media session
			m['Content-Type'] = rfc3261.Header('application/sdp', 'Content-Type')
			m.body = str(self.media.mysdp)

		self.state = 'inviting'
		self._ua.sendRequest(m)*/
UA.prototype.sendInvite = function(to, uri, subject) {
	console.log("UA", this);
	this.remote = Reticulum.Parser.parseAddress(to);
	//this.remoteTarget = uri;

	//if (!EXISTS(uri))
	this.remoteTarget = this.remote.uri;

	// Update client remote data
	this.uacore.remote = this.remote;
	this.uacore.remoteTarget = this.remoteTarget;

	this.state = "INVITING";
	var request = this.createRequest("INVITE", subject, this.media.getLocalSDP());

	this.uacore.sendRequest(request);
};

UA.prototype.sendAnswer = function() {
	if (!EXISTS(this.inviteUA)) return;

	this.inviteUA.sendResponse(this.inviteUA.createResponse(200, "OK"));
}

	/*def _createRequest(self, register=True):
		m = self._ua.createRequest('REGISTER')
		m.Contact = rfc3261.Header(str(self._stack.uri), 'Contact')
		m.Contact.value.uri.user = self.options.user
		m.Expires = rfc3261.Header(str(self.options.register_interval if register else 0), 'Expires')
		return m*/
	/*def _createRequest(self, text):
		m = self._ua.createRequest('MESSAGE')
		m.Contact = rfc3261.Header(str(self._stack.uri), 'Contact')
		m.Contact.value.uri.user = self.options.user
		if self.options.user_agent:
			m['User-Agent'] = rfc3261.Header(self.options.user_agent, 'User-Agent')
		if self.options.subject:
			m['Subject'] = rfc3261.Header(self.options.subject, 'Subject')
		m['Content-Type'] = rfc3261.Header('text/plain', 'Content-Type')
		m.body = self.options.send

		return m*/
UA.prototype.createRequest = function(method, subject, body) {
	var request = null;
	var interval = 3600;
	if (method === "REGISTER") {
		request = this.uacore.createRequest(method);

		request.addHeader("Contact", Reticulum.Parser.Enum.SIP_HDR_CONTACT, this.stack.uri());
		//console.log(request);
		//console.log(request.contacts);
		request.contacts[0].uri.host.name = this.user;
		request.addHeader("Expires", Reticulum.Parser.Enum.SIP_HDR_EXPIRES, interval);
	} else if (method === "MESSAGE") {
		request = this.uacore.createRequest(method);
		request.addHeader("Contact", Reticulum.Parser.Enum.SIP_HDR_CONTACT, this.stack.uri());
		request.contacts[0].uri.host.name = this.user;
		// TODO: fix User-Agent header code to detect Phone app version and browser
		request.addHeader("User-Agent", Reticulum.Parser.Enum.SIP_HDR_USER_AGENT, "Reticulum client 0.0.1 Chrome");
		request.addHeader("Subject", Reticulum.Parser.Enum.SIP_HDR_SUBJECT, subject);
		request.addHeader("Content-Type", Reticulum.Parser.Enum.SIP_HDR_CONTENT_TYPE, "text/plain");
		request.body = body;
	} else if (method === "INVITE") {
		request = this.uacore.createRequest(method);
		request.addHeader("Contact", Reticulum.Parser.Enum.SIP_HDR_CONTACT, this.stack.uri());
		request.contacts[0].uri.host.name = this.user;
		// TODO: fix User-Agent header code to detect Phone app version and browser
		request.addHeader("User-Agent", Reticulum.Parser.Enum.SIP_HDR_USER_AGENT, "Reticulum client 0.0.1 Chrome");
		request.addHeader("Subject", Reticulum.Parser.Enum.SIP_HDR_SUBJECT, subject);
		request.addHeader("Content-Type", Reticulum.Parser.Enum.SIP_HDR_CONTENT_TYPE, "application/sdp");
		request.body = body;
	}

	//console.log(request);

	return request;
};
	/*def receivedResponse(self, ua, response):
		if self.state == self.REGISTERING:
			if response.is2xx:
				logger.info('registered with SIP server as %r', self.localParty)
				self.state = self.REGISTERED
				self._scheduleRefresh(response, self._register)
			elif response.isfinal:
				logger.warning('failed to register with response %r'%(response.response,))
				self.state = self.IDLE
				self._scheduleRetry(self._register)
		elif self.state == self.UNREGISTERING:
			if response.isfinal:
				self.state = self.IDLE
				self._signalClose()*/
	/*def receivedResponse(self, ua, response):
		logger.info('received response in state %r: %d %s'%(self.state, response.response, response.responsetext))
		if self.state == 'inviting':
			if response.is2xx:
				self.state = 'active'
				logger.debug('changed state to %r', self.state)
				if response.body and response['Content-Type'] and response['Content-Type'].value.lower() == 'application/sdp':
					sdp = rfc4566.SDP(response.body)
					if self.media:
						if not self.options.audio_loopback and self.options.audio:
							self.startAudio()
						self.media.setRemote(sdp)
					else:
						logger.warning('invalid media received in 200 OK')
			elif response.response == 183:
				logger.debug('received early media')
				if response.body and response['Content-Type'] and response['Content-Type'].value.lower() == 'application/sdp':
					sdp = rfc4566.SDP(response.body)
					if self.media:
						if not self.options.audio_loopback and self.options.audio:
							self.startAudio()
						self.media.setRemote(sdp)
					else:
						logger.warning('invalid media received in 200 OK')
			elif response.isfinal:
				self.state = 'idle'
				self.close()
				self._signalClose()
		elif self.state == 'terminating':
			if response.isfinal:
				self._signalClose()*/
UA.prototype.onResponse = function(ua, response) {
	//console.log("App UA onresp:", response);
	if (response.method === "REGISTER") {
		//console.log("REG state before:", this.state);
		if (this.state === "REGISTERING") {
			if (response.is2xx()) {
				this.state = "REGISTERED";
				this.refreshLater(response, this.register);
			} else if (response.isFinal()) {
				this.state = "IDLE";
				this.retryLater(this.register);
			}
		} else if (this.state === "UNREGISTERING") {
			if (response.isFinal()) {
				this.state = "IDLE";

				if (this.state === "REGISTERING" || this.state === "REGISTERED") {
					this.state = "UNREGISTERING";
					this.register(false);
				}

				this.state = "IDLE";
				//this.signalClose();
			}
		}
		//console.log("REG state:", this.state);
	} else if (response.method === "INVITE") {
		var sdp = null;
		console.log("STATE on INVITE resp:", this.state, response.is2xx(), response)
		if (this.state == 'INVITING') {
			if (response.is2xx()) {
				this.state = 'ACTIVE';
				//logger.debug('changed state to %r', this.state);
				if (response.getBody() && EXISTS(response.contentType) && response.contentType.subtype === "sdp") {
					if (this.media) {
						this.media.setRemoteSDP(response.getBody());
					} else {
						console.log("Missing media while processing 200 OK");
					}
				} else {
					console.log("No SDP in received 200 OK");
				}
			} else if (response.statusCode === 183) {
				//logger.debug('received early media');
				if (response.getBody() && EXISTS(response.contentType) && response.contentType.subtype === "sdp") {
					sdp = response.getBody();//rfc4566.SDP(response.body);
					if (this.media) {
						/*if (this.media.audio) {
							//this.startAudio();
						}*/
						this.media.setRemoteSDP(sdp);
					} else {
						//logger.warning('invalid media received in 200 OK')
					}
				}
			} else if (response.isFinal()) {
				//console.log("CLOSE!!!")
				this.state = 'IDLE';
				this.close();
				//this._signalClose();
			}
		} else if (this.state == 'TERMINATING') {
			if (response.isFinal()) {
				//this._signalClose();
			}
		}
	}
};

	/*def receivedRequest(self, ua, request):
		if request.method == 'INVITE':
			if self.state == 'idle':
				if self._ua is None:
					self._ua, ua.app = ua, self
				logger.info('received incoming call from %s', request.first('From').value)
				self.state = 'invited'

				req = request if request.body and request['Content-Type'] and request['Content-Type'].value.lower() == 'application/sdp' else None
				self.media = voip.MediaSession(app=self, streams=self._audio, request=req, listen_ip=self.options.int_ip, NetworkClass=rfc3550.gevent_Network) # create local media session
				if self.media.mysdp is None:
					self.state = 'idle'
					logger.info('rejected incoming call with incompatible SDP')
					ua.sendResponse(ua.createResponse(488, 'Incompatible SDP'))
					self.close()
				elif self.options.auto_respond:
					self._gen = gevent.spawn_later(self.options.auto_respond_after, self._autoRespond)
			else:
				logger.info('rejecting incoming call as already busy')
				ua.sendResponse(ua.createResponse(486, 'Busy Here'))
		elif request.method == 'BYE':
			if self._ua == ua:
				self.stopAudio()
				if self.state != 'idle':
					logger.info('call closed by remote party')
					self.state = 'idle'
					ua.sendResponse(ua.createResponse(200, 'OK'))
				self.close()
			else:
				ua.sendResponse(ua.createResponse(481, 'Dialog Not Found'))
		elif request.method == 'ACK':
			if self._ua == ua:
				if self.state == 'accepted':
					self.state = 'active'
					if request.body and request['Content-Type'] and request['Content-Type'].value.lower() == 'application/sdp':
						sdp = rfc4566.SDP(request.body)
						if self.media:
							self.media.setRemote(sdp)
						else:
							logger.warning('invalid media in processing received ACK')
					else:
						logger.debug('no SDP in received ACK')
					if not self.options.audio_loopback and self.options.audio:
						self.startAudio()
				else:
					logger.warning('ignoring ACK in state %r'%(self.state,))
			else:
				logger.warning('received ACK for invalid UA')*/
UA.prototype.onRequest = function(ua, request) {
	var sdp = null;
	if (request.method === "INVITE") {
		if (this.state === "IDLE") {
			if (this.uacore === null) {
				this.uacore = ua;
				ua.app = this;
			}
			//logger.info("received incoming call from %s", request.first("From").value)
			this.state = "INVITED";

			var req = null;
			if (request.body && request["Content-Type"] && request["Content-Type"].value.lower() === "application/sdp") {
				req = request;
			}

			//this.media = voip.MediaSession(app=this, streams=this._audio, request=req, listen_ip=this.options.int_ip, NetworkClass=rfc3550.gevent_Network); // create local media session

			if (this.media.localSDP === null) {
				this.state = "IDLE";
				//logger.info("rejected incoming call with incompatible SDP");
				ua.sendResponse(ua.createResponse(488, "Incompatible SDP"));
				this.close();
			} else if (this.autorespond) {
				//this._gen = gevent.spawn_later(this.options.auto_respond_after, this._autoRespond);
				this.sendLater(this.delay, this.autoRespond);
			}
		} else {
			//logger.info("rejecting incoming call as already busy");
			ua.sendResponse(ua.createResponse(486, "Busy Here"));
		}
	} else if (request.method == "BYE") {
		if (this.uacore === ua) {
			this.stopAudio();
			if (this.state !== "IDLE") {
				//logger.info("call closed by remote party");
				this.state = "IDLE";
				ua.sendResponse(ua.createResponse(200, "OK"));
			}
			this.close();
		} else {
			ua.sendResponse(ua.createResponse(481, "Dialog Not Found"));
		}
	} else if (request.method == "ACK") {
		if (this.uacore == ua) {
			if (this.state == "ACCEPTED") {
				this.state = "ACTIVE";
				if (request.body && request["Content-Type"] && request["Content-Type"].value.lower() === "application/sdp") {
					sdp = request.body; //rfc4566.SDP(request.body);
					if (this.media) {
						this.media.setRemote(sdp);
					} else {
						//logger.warning("invalid media in processing received ACK");
					}
				} else {
					//logger.debug("no SDP in received ACK");
				}
				if (/*!this.options.audio_loopback && */this.media.audio) {
					//this.startAudio();
				}
			} else {
				//logger.warning("ignoring ACK in state %r"%(this.state));
			}
		} else {
			//logger.warning("received ACK for invalid UA");
		}
	}
};

	/*def _closeCall(self):
        if self.state == 'active' or self.state == 'inviting' or self.state == 'accepted':
            if self.state == 'inviting':
                self.state = 'terminating'
                self._ua.sendCancel()
            else:
                self.state = 'terminating'
                self._ua.sendRequest(self._ua.createRequest('BYE'))
            self.stopAudio()
            self._waitOnClose()
        elif self.state == 'invited':
            self._ua.sendRequest(self._ua.createResponse(480, 'Temporarily Unavailable'))*/

    /*def _autoRespond(self):
        self._gen = None
        if self.options.auto_respond >= 200 and self.options.auto_respond < 300:
            logger.info('accepting incoming call')
            self.state = 'accepted'
            m = self._ua.createResponse(200, 'OK')
            m['Content-Type'] = rfc3261.Header('application/sdp', 'Content-Type')
            m.body = str(self.media.mysdp)
            if self.options.auto_terminate_after:
                self._gen = gevent.spawn_later(self.options.auto_terminate_after, self._autoTerminate)
        else:
            logger.info('rejecting incoming call with code %r', self.options.auto_respond)
            self.state = 'idle'
            m = self._ua.createResponse(self.options.auto_respond, 'Decline')
        self._ua.sendResponse(m)
        if self.options.auto_respond >= 300:
            self.close()*/

    /*def _autoTerminate(self):
        self._gen = None
        if self._ua != None:
            m = self._ua.createRequest('BYE')
            self._ua.sendRequest(m)
            gevent.spawn_later(0.5, self.close)*/

    /*def cancelled(self, ua, request):
        if self._ua == ua:
            self.close()*/
