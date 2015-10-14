#!/usr/bin/ruby
#require "./data.rb"
module SIP
	class Event
	    # An incoming message with action properties to support accept, reject, proxy, redirect, etc.
		def initialize(msg, kwargs)
	        #MessageEvent.__init__(self, type, msg, **kwargs)
	        #self.action = self;
			@location = []
		end
	end

	class Server
		attr_accessor :ua

		def initialize
			@realm = "reticulum.local"
		end

		def accept(contacts=nil)
			# TODO: Fix issue with createResponse
	        response = @ua.createResponse(200, 'OK');
			if contacts != nil
				response.headers.contact += contacts

				if self['Expires']
	            	response.Expires = self['Expires']
				else
					Header('3600', 'Expires')
				end
			end
	        @ua.sendResponse(response)
		end

		def reject(code, reason=nil)
	        @ua.sendResponse(code, reason)
		end

		def challenge(realm)
			# TODO: Fix issue with createResponse
	        response = @ua.createResponse(401, 'Unauthorized')
	        #response.insert(Header(createAuthenticate(realm=realm, domain=str(self.uri), stale='FALSE'), 'WWW-Authenticate'), append=True)
	        @ua.sendResponse(response)
		end

		def proxy(recordRoute=false)
			location = @location

			for c in location
	            proxied = @ua.createRequest(self.method, c, recordRoute)
	            @ua.sendRequest(proxied)
			end

			if !location || location.empty?
				if @ua.request.method != 'ACK'
	                @ua.sendResponse(480, 'Temporarily Unavailable')
				end
			end
		end

		def redirect
			location = @location
			# TODO: Fix issue with createResponse
	        response = @ua.createResponse(302, 'Moved Temporarily')
			for c in location
				#response.insert(c, true) #append=True)
				response.headers.location += c
			end

	        @ua.sendResponse(response)
		end

		def default # invoked when nothing else (action) was invoked in the application
	        #logger.debug('IncomingEvent default handler called')
	        @ua.sendResponse(501, 'Not Implemented')
		end

		def route(event)
		    # The main routing method for the server agent.
		    # sanity check section
		    return reject(483, 'Too many hops') if (event.maxForwards.to_i <= 0);
		    return reject(513, 'Message overflow') if event.raw.length > 8192;
		    # this is used by sipsak to monitor the health of server
		    #if event['From'].value.uri.user == 'sipsak' and event.method == 'OPTIONS' and not event.uri.user: return accept()
		    # route header processing
			if event.headers['Route']
		        event.location = event.first('Route').value.uri
		        return proxy(recordRoute=(event.method=='INVITE'))
			end
		    # failover and load sharing section
			#if event.agent.index > 0 and event.uri.user != nil # if we are first stage proxy, proxy to second stage if needed
		        #index = hash(event.uri.user) % len(event.agent.primary)
				#if len(event.agent.primary) > 1 and (index+1) != event.agent.index # in the two-stage server farm, not for us
		            #event.location, dest = event.uri.dup(), event.agent.primary[index]
		            #event.location.host, event.location.port = dest
		            #return proxy(recordRoute=False)
				#end
			#end
		    # registration section
			if event.method == 'REGISTER' or event.method == 'PUBLISH'
		        return reject(403, 'Unknown Domain') if event.agent.domain != nil and event['From'].value.uri.hostPort != event.agent.domain;
		        return reject(401, 'Unauthorized Third-party Registration') if event.To.value.uri != event.From.value.uri;

				if event.agent.subscriber !=  nil # authenticate if subscriber table is present
		            auth = event.agent.subscriber.authenticate(event, @realm)
					if auth == 404
						return reject(404, 'Not Found')
					elsif auth == 401 or auth == 0
						return challenge()#realm='localhost')
					elsif auth != 200
						return reject(500, 'Internal Server Error in authentication')
					end
				end

				if !event.agent.location.save(event, event.to.value.uri.to_s.downcase)#(msg=event, uri=str(event.To.value.uri).lower())
					return reject(500, 'Internal Server Error in Location Service')
				end
		        return accept()#contacts=event.agent.location.locate(str(event.To.value.uri).lower()))
			end
		    # whether the original request had Route header to this server?
			# TODO: implement check for Loose Routing (ls)
			#begin
			#	had_lr = event.had_lr
			#rescue AttributeError
				had_lr = false
			#end
		    # if _debug: print 'had_lr=', had_lr, 'domain=', event.agent.domain, 'isLocal=', event.ua.isLocal(event.uri)

		    # open relay section
			if !had_lr and event.method == 'INVITE'
				if event.agent.domain != nil and event['From'].value.uri.hostPort != event.agent.domain and event.uri.hostPort != event.agent.domain
		            return reject(403, 'Please register to use our service')
				end
		    else
				if event.agent.domain != nil and event.uri.hostPort != event.agent.domain or event.agent.domain == nil and !event.ua.isLocal(event.uri)
		            #logger.debug('proxying non-invite non-local request')
		            event.location = event.uri
		            return proxy()
				end
			end
		    event.location = event.agent.location.locate(event.uri.to_s.downcase) #map(lambda x: x.value.uri, event.agent.location.locate(str(event.uri).lower()))
		    #logger.debug('locate returned %r', event.location)
		    return proxy(recordRoute=(event.method=='INVITE'))
		end
	end

	class Registrar # Subscriber
		# handle parsed Register message
		def handle(message)
			# TODO: look for msg.uri in database to see if it maches an AOR
			#contacts = data.GetContacts (message.to.auri)

			message.contacts.each do |contact|
				binding = Reticulum::Binding.new message.to.auri, contact.address.auri, contact.expires ? contact.expires : message.expires

				binding.Add
			end

			# if AOR found for message.uri

			#contacts.each do |to|
			#	forward message to
			#end
		end
	end

	class Subscriber
	    # A simple subscriber. Store subscribers with this, and use them to authenticate incoming SIP request.
		def initialize
	        #dict.__init__(self)
		end

		def store (uri, realm, password)
	        # Store a new user and his realm and password in this table.
	        #self[uri] = [realm, password]
		end

		def authenticate(request, realm='localhost')
	        # Returns 200 on success, 401 on failure, 0 if missing or invalid nonce, and 404 if no password/user information available.
	        #auths = filter(lambda x: x['realm']==realm, request.all('Authorization', 'Proxy-Authorization')) # search all our authenticate headers

	        #if not auths: return 0 # missing authenticate header
	        # TODO: check for valid nonce. for now just assume all nonce to be valid.
	        #uri = request.From.value.uri
	        #if uri not in self: return 404
	        #return 200
		end
	end

	class Agent #(Dispatcher)
	    # This represents a listening endpoint that interfaces with the SIP stack and exposes various API methods on the endpoint.
		def initialize(type, address, port, stack) #(listen=(('udp', '0.0.0.0', 5060), ('tcp', '0.0.0.0', 5060)), Stack stack)
	        # Construct a new Agent. The sipaddr argument indicates the listening address for incoming SIP messages or connections, and
	        # transports tuple contains list of supported transports such as 'udp' and 'tcp'. The caller may change the SIP stack from the
	        # default one defined in rfc3261.py module.
	        #Dispatcher.__init__(self)
	        #logger.info('starting agent on ' + ', '.join(['%s:%d with transport %s'%(x[1], x[2], x[0]) for x in listen]))
	        #self.conn, self.stack = dict(), dict()  # tables: (host, port)=>TCP sock, (transport type=>stack)
	        #for transport, host, port in listen
	        #    sock = socket.socket(type=socket.SOCK_DGRAM if transport == 'udp' else socket.SOCK_STREAM)
	        #    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
	        #    sock.bind((host, port))
	        #    sock.listen(5) if transport != 'udp';
	        #    t = TransportInfo(sock)
	        #    t.type = transport
	        #    self.stack[transport] = s = stack(self, t)
	        #    s.sock = sock
			#end
	        #self._gens = []
		end

	    #def __del__(self):
	    #    # Delete the object and internal member references.
	    #    try:
	    #        for s in self.stack.values(): s.sock.close()
	    #        del self.stack, self._gens
	    #    except: pass
	    #    Dispatcher.__del__(self)
		#end

	    #def start(self):
	        # Start the listening tasks in this agent. It returns self for cascaded method calls.
	    #    for s in self.stack.values(): gen = self._sipreceiver(s); self._gens.append(gen); multitask.add(gen)
	    #    return self
		#end

	    #def stop(self):
	        # Stop the listening tasks in this agent. It returns self for cascaded method calls.
	    #    for gen in self._gens: gen.close();
	    #    self._gens[:] = []
	    #    return self
		#end

		# def _sipreceiver(stack, maxsize=16386)
	    #     # Handle the messages or connections on the given SIP stack's socket, and pass it to the stack so that stack can invoke
	    #     # appropriate callback on this object such as receivedRequest.
	    #     sock = stack.sock
		# 	while True
		# 		if sock.type == socket.SOCK_DGRAM
	    #             data, remote = yield multitask.recvfrom(sock, maxsize)
	    #             #logger.debug('%r=>%r on type=%r\n%s', remote, sock.getsockname(), stack.transport.type, data)
		# 			if data
		# 				begin
		# 					stack.received(data, remote)
		# 				rescue
	    #                 	#logger.exception('received')
		# 				end
		# 			end
	    #         elsif sock.type == socket.SOCK_STREAM
	    #             conn, remote = yield multitask.accept(sock)
		# 			if conn
	    #                 #logger.debug('%r=>%r connection type %r', remote, conn.getsockname(), stack.transport.type)
		# 				if ['ws', 'wss'].include? stack.transport.type
	    #                     multitask.add(self._wsreceiver(stack, conn, remote, maxsize))
	    #                 else
	    #                     multitask.add(self._tcpreceiver(stack, conn, remote, maxsize))
		# 				end
		# 			end
		# 		else
		# 			#raise ValueError, 'invalid socket type'
		# 		end
		# 	end
		# end

	    # following callbacks are invoked by the SIP stack
	    #def send(data, remote, stack)
	        # Send a given data to remote for the SIP stack.
	    #    def _send(self, data, remote, stack) # a generator function that does the sending
	    #        logger.debug('%r=>%r on type=%r\n%s', stack.sock.getsockname(), remote, stack.transport.type, data)
	    #        try:
	    #            if stack.sock.type == socket.SOCK_STREAM: # for TCP send only if a connection exists to the remote.
	    #                if stack.transport.type in ('ws', 'wss'):
	    #                    if len(data) < 126:
	    #                        init = struct.pack('>BB', 0x81, len(data))
	    #                    elif len(data) < 65536:
	    #                        init = struct.pack('>BBH', 0x81, 126, len(data))
	    #                    else:
	    #                        raise ValueError, 'cannot send long message'
	    #                    data = init + data
	    #                if remote in self.conn:
	    #                    yield multitask.send(self.conn[remote], data) # and send using that connected TCP socket.
	    #                else:
	    #                    logger.warning('ignoring message to %r as no existing connection', remote)
	    #            else: # for UDP send using the stack's UDP socket.
	    #                yield multitask.sendto(stack.sock, data, remote)
	    #        except StopIteration: pass
	    #        except:
	    #            logger.exception('sending')
	    #    multitask.add(_send(self, data, remote, stack))
		#end

		def createServer(request, uri, stack)
	        # Create a Proxy UAS for all requests except CANCEL.
	        return Proxy(stack, request) if request.method != 'CANCEL'

			return nil
		end

		def sending(ua, message, stack)
			if message.method
	            #logger.debug('sending request on stack %r', message.method)
	            #self.dispatch(OutgoingEvent(type='outgoing', msg=message, ua=ua, stack=stack, agent=self))
			end
		end

		def receivedRequest(ua, request, stack)
	        #logger.debug('received request from stack %r', request.method)
	        #self.dispatch(IncomingEvent(type='incoming', msg=request, ua=ua, stack=stack, agent=self))
		end

	    # def receivedResponse(ua, response, stack): pass
	    # def cancelled(ua, request, stack): pass
	    # def dialogCreated(dialog, ua, stack): pass
		def authenticate(ua, header, stack)
			 return True
		end

		def createTimer(app, stack)
			return Timer(app)
		end
	end
end
