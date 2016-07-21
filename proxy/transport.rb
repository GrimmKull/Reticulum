class Client
    def initialize uri
        return Transport.clients[uri] if Transport.clients.keys.include? uri

        # TODO: create a new client

        # TODO: add new client to Transport Layer
    end

    def send message
        # TODO: check if connection established if not queue the message to send
    end

    def connected
        # TODO: start sending queued messages
    end

    def closed
        # TODO: remove client from Transport Layer
    end
end

class Connection
    attr_accessor :ws, :remote, :expires

    def initialize ws, remote
        @ws = ws
        @remote = remote
    end

    def send data
        @ws.send data.to_s
    end

	def expired?
		return @expires <= Time.now.utc.to_i
	end
end

class Transport
	attr_accessor :proxy
    # hold client connections to this proxy
    @@connections = {}
    # hold connections to other proxies
    @@clients = {}
    LOCAL = "proxy.reticulum.local"
    PORT = "7000"

    # def initialize
    #     @connections = {}
    #     @clients = {}
    # end

	def initialize proxy
		@proxy = proxy
		@@static  = Rack::File.new(File.dirname(__FILE__) + "/../client")
		# options = {:extensions => [PermessageDeflate], :ping => 5}
		@@options = {:ping => 5}
	end

    def self.connections
        @@connections
    end

    def self.clients
        @@clients
    end

    def self.add ws, remote
        conid = Transport.makeConnectionID(remote.name, remote.port)

        Transport.connections[conid] = ws
    end

    def self.remove ws
        Transport.connections.delete_if { |_,v| v == ws }
    end

    def self.makeConnectionID remote, remote_port
        #remote = {address: ws._socket.remoteAddress, port: ws._socket.remotePort}
        #local = {address: ws._socket.address().address, port: ws._socket.address().port}
        [remote, remote_port, LOCAL, PORT].join()
    end

    def self.get remote
        @@connections[[remote.name, remote.port, LOCAL, PORT].join()]
    end

    def open target, onError
        if target.local?
            return get(target)
        else
            # TODO: make a client connection to another proxy
            #return makeClient('ws://'+target.host+':'+target.port)(onError)
            # return Client.new(target)
        end
    end

    def self.reliable?
        return true
    end

    def self.send message, remote
        #p [ "TRANSPORT SEND to", remote.name, remote.port, message.request, message.request? ? message.method : ""]
        #puts message.to_s
        #p ["SENT", message.request? ? message.method : message.statusCode, "to", remote.name]

        #p "<<<"
        ws = Transport.get remote
        $logger.logMessage(message, false, ws.remote, Storage.userconns[ws.remote.name + "_" + ws.remote.port.to_s])
        ws.send message

        #p ["SENT?", ws.nil?, ws.ws.nil? , message.request? ? message.method : message.statusCode, "to", ws.remote.name]
    end

	def handle env
		if Faye::WebSocket.websocket?(env)
		  ws = Faye::WebSocket.new(env, ["sip", "admin"], @@options)
		  local = env["HTTP_HOST"].split(":")
		  paddr = local[0]
		  pport = local[1]

		  pport = "443" if pport.nil?
		  Proxy.setProxyHost(paddr, pport)

		  ws.onopen = lambda do |event|
			  if ws.protocol == "sip"
				  peer = Socket.unpack_sockaddr_in(env["em.connection"].get_peername)
				  remote = Reticulum::Parser::Host.new
				  remote.name = peer[1]
				  remote.port = peer[0]

				  remote.name = env["HTTP_X_REAL_IP"] unless env["HTTP_X_REAL_IP"].nil?

				  conn = Connection.new(ws, remote)

				  Transport.add(conn, remote)
			  elsif ws.protocol == "admin"
				  $logger.add ws
			  end
		  end

		  ws.onmessage = lambda do |event|
			  if ws.protocol == "sip"
				  peer = Socket.unpack_sockaddr_in(env["em.connection"].get_peername)
				  remote = Reticulum::Parser::Host.new
				  remote.name = peer[1]
				  remote.port = peer[0]

				  remote.name = env["HTTP_X_REAL_IP"] unless env["HTTP_X_REAL_IP"].nil?

				  p ["MSG from:", remote.name]

				  message = Reticulum::Parser::Parse event.data

				  $logger.logMessage(message, true, remote, Storage.userconns[remote.name + "_" + remote.port.to_s])

				  @proxy.handle(message, remote)
			  elsif ws.protocol == "admin"
				  res = JSON.parse event.data

				  if res["action"] == "transactions"
					  ws.send Transaction.transactions
				  elsif res["action"] == "register"
					  u = res["content"]

					  Storage.register(u["name"], u["mail"], u["pass"])
				  elsif res["action"] == "users"
					  us = Storage.users_array
					  ws.send JSON.generate({
						  :type => "users",
						  :data => {
							  :users => us
						  }
					  })
				  end
			  end
		  end

		  ws.onclose = lambda do |event|
			  if ws.protocol == "sip"
				  p [:close, event.code, event.reason]

				  peer = Socket.unpack_sockaddr_in(env["em.connection"].get_peername)
				  remote = Reticulum::Parser::Host.new
				  remote.name = peer[1]
				  remote.port = peer[0]

				  remote.name = env["HTTP_X_REAL_IP"] unless env["HTTP_X_REAL_IP"].nil?
	  puts ""
	  p ["User disconnect:", remote.name]
	  puts ""
				  Transport.remove ws
				  Storage.removeBindings remote

				  ws = nil
			  elsif ws.protocol == "admin"
				  $logger.remove ws
			  end
		  end

		  ws.rack_response

		else
		  @@static.call(env)
		end
	end
end
