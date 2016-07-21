class Conf
	@@conf = {}

	def initialize
		unless File.exists? "./proxy/conf.yaml"
			puts "Missing configuration file."
			puts "Exiting Reticulum Proxy."
			exit()
		end

		@@conf = YAML.load(File.read("./proxy/conf.yaml"))
	end

	def self.DBhost
		return @@conf["db"]["host"]
	end

	def self.DBuser
		return @@conf["db"]["username"]
	end

	def self.DBpass
		return @@conf["db"]["password"]
	end
end

class Transaction
    SEC = 1 #1000

    @@s_trans = {}
    @@c_trans = {}

    attr_accessor :id

    attr_accessor :state
    attr_accessor :type
    attr_accessor :connection

    # server params
    attr_accessor :response

    # client params
    attr_accessor :request
    attr_accessor :withCancel
    attr_accessor :ack

    # timers
    attr_accessor :a
    attr_accessor :b
    attr_accessor :d
    attr_accessor :e
    attr_accessor :f
    attr_accessor :g
    attr_accessor :h
    attr_accessor :i
    attr_accessor :j
    attr_accessor :k
    attr_accessor :l
    attr_accessor :m
    attr_accessor :t

    def initialize id, type, message, connection
        @id = id
        @type = type
        @connection = connection

        if @type == "INV_SERVER" || @type == "NON_SERVER"
            @response = message
        else
            @request = message
        end

		$logger.logTransaction(@id, @state, @type)

        if @type == "INV_SERVER"
            changeState "proceeding"
        elsif @type == "NON_SERVER"
            changeState "trying"
        elsif @type == "INV_CLIENT"
            # TODO: delay state change till next tick ???
            changeState "calling"
        elsif @type == "NON_CLIENT"
            # TODO: delay state change till next tick ???
            changeState "trying"
        end
    end

    def self.transactions
        s = JSON.generate (@@s_trans)
        # c = JSON.generate (@@c_trans)

        #puts s

        return s
    end

    def self.generateBranch
        return 'z9hG4bK' + SecureRandom.hex(7)
    end

    def self.transactionId(message)
        via = message.via.first

        # if message.statusCode == 481
        #     id = "|"
        #     if message.method == 'ACK'
        #         id = "ACK ID", ['INVITE', message.callid, via.params["branch"]].join
        #     else
        #         id = "ID", [message.cseq.method, message.callid, via.params["branch"]].join
        #     end
        #
        #     puts id
        #     puts ""
        #
        #     @@c_trans.each { |key, trans|
        #         puts "c", key, trans
        #     }
        #
        #     @@s_trans.each { |key, trans|
        #         puts "s", key, trans
        #     }
        #
        #     puts "ct", @@c_trans[id]
        #     puts "st", @@s_trans[id]
        #
        #     raise '481'
        # end
        return ['INVITE', message.callid, via.params["branch"]].join if message.method == 'ACK'
#p [ "||", message, "||" ]
        return [message.cseq.method, message.callid, via.params["branch"]].join
    end

    def self.createSTrans request, connection
        id = Transaction.transactionId(request)

        type = "_SERVER"

        type = ((request.method == "INVITE") ? "INV" : "NON") + type

        trans = Transaction.new id, type, nil, connection

        @@s_trans[id] = trans

        return trans
    end

    def self.createCTrans request, connection, withCancel
        #request.via.first.params["branch"] = Transaction.generateBranch if request.method != 'CANCEL'

        id = Transaction.transactionId(request)

        type = "_CLIENT"

        type = ((request.method == "INVITE") ? "INV" : "NON") + type

        trans = Transaction.new id, type, request, connection

        trans.withCancel = withCancel

        @@c_trans[id] = trans

        if request.method == "INVITE"
            trans.ack = trans.createAck request
        end

        return trans
    end

    def self.getServer message
        t = @@s_trans[Transaction.transactionId(message)]
        #x = ""
        #@@s_trans.each { |k,v| x += v.id + ", "}
        #p ["#S TRANS", x, t.nil?, Transaction.transactionId(message)]

        # raise 'Server Transaction is terminated' if (!t.nil? && t.state == "terminated")

        return nil if !t.nil? && t.state == "terminated"

        return t
    end

    def self.getClient message
        t = @@c_trans[Transaction.transactionId(message)]
        #x = ""
        #@@c_trans.each { |k,v| x += v.id + ", "}
        #p ["#C TRANS", x, t.nil?, Transaction.transactionId(message)]

        # raise 'Client Transaction is terminated' if (!t.nil? && t.state == "terminated")

        return nil if !t.nil? && t.state == "terminated"

        return t
    end

    def self.clientTransactions
        return @@c_trans.keys
    end

    def destroy
        # TODO: destroy each transaction
    end

    def createAck request
        ack = Reticulum::SIP::Message.new
        ack.method = 'ACK'
        ack.uri = request.uri

        ack.isRequest = true

        request.via.each { |x| ack._addHeader("Via", x.to_s) }
        ack._addHeader("From", request.from.to_s)
        ack._addHeader("Call-ID", request.callid)
        ack._addHeader("CSeq", request.cseq.number.to_s + " " + ack.method)
        ack._addHeader("Max-Forwards", "70")

        return ack
    end

    def cleanup
        # TODO: transaction cleanup
        if @type == "INV_SERVER" || @type == "NON_SERVER"
            @@s_trans.delete(Transaction.transactionId(@request))
        else
            @@c_trans.delete(Transaction.transactionId(@request))
        end
        # TODO: disconnect WebSocket
        #connection.release();
    end

    def transport message
        p [ "Trans transport", @type, "with state:", @state, message.request? ? "/" : message.statusCode, message.method, @connection.remote.nil? ? "" : @connection.remote.name ]
        $logger.logMessage(message, false, @connection.remote, Storage.userconns[@connection.remote.name + "_" + @connection.remote.port.to_s])

        @connection.send(message)
    end

    def handle message
        Sip.handle(message, @withCancel)
    end

    # State machine actions
    def changeState state, msg=nil
        $logger.logTransactionChange(@id, state, @state, @type)
        a = "/"
        b = 0
        c = "/"
        a = @request.method if @request
        b = @response.statusCode if @response
        c = @response.method if @response
        p [@type, "[STATE] from:", @state, "to:", state, "msg:", a, b, "for", c]

		# handle leaving of old state
        leave

        @state = state
        # handle entering of new state
        enter msg
    end

    def enter msg
        if @state == "proceeding"
        elsif @state == "trying"
            if @type == "NON_CLIENT"
                transport(@request);
                if !Transport.reliable?
                    @e = EventMachine::PeriodicTimer.new(500/SEC) {
                        #setTimeout(function() { sm.signal('timerE', 500); }, 500);
                        puts "timer E"
                        puts "REQUEST IS NULL on timer E" if @request.nil?
                        transport(@request)
                    }
                end
                @f = EventMachine::PeriodicTimer.new(32000/SEC) {
                    #setTimeout(function() { sm.signal('timerF'); }, 32000);
                    puts "timer F"
                    handle(Sip.makeResponse(@request, 408, "Request Timeout"))
                    changeState "terminated"
                }
            end
        elsif @state == "calling"
            if @type == "INV_CLIENT"
                transport(@request)

                if !Transport.reliable?
                    n = 0
                    @a = EventMachine::PeriodicTimer.new(500/SEC) {
                        puts "timer A"
                        puts "REQUEST IS NULL on timer A" if @request.nil?
                        transport(@request)
                        @a.cancel if (n+=1) > 3
                    }
                end

                @b = EventMachine::Timer.new(32000/SEC) {
                    handle(Sip.makeResponse(@request, 408, "Request Timeout"))
                    changeState "terminated"
                }
            end
        elsif @state == "confirmed"
            if @type == "INV_SERVER"
                @i = EventMachine::Timer.new(5000/SEC) {
                    changeState "terminated"
                }
            end
        elsif @state == "completed"
            if @type == "INV_SERVER"
                n = 0
                @g = EventMachine::PeriodicTimer.new(500/SEC) {
                    puts "timer G"
                    puts "RESPONSE IS NULL on timer G" if @response.nil?
                    transport(@response)
                    @g.cancel if (n+=1) > 3
                }
                @h = EventMachine::Timer.new(32000/SEC) {
                    changeState "terminated"
                }
            elsif @type == "NON_SERVER"
                @j = EventMachine::Timer.new(32000/SEC) {
                    changeState "terminated"
                }
            elsif @type == "INV_CLIENT"
                puts "MSG is NIL for INV_CLIENT ACK" if msg.nil?

                @ack._addHeader("To", msg.to.to_s)

                # NOTE: be extra careful if this ack is not sent the call might not be cancelled/rejected
                # NOTE: prevent ACK for 481 responses
                if !(!msg.request? && msg.statusCode == 481)
                    transport(@ack)
                end

                @d = EventMachine::Timer.new(32000/SEC) {
                    changeState "terminated"
                }
            elsif @type == "NON_CLIENT"
                @k = EventMachine::Timer.new(5000/SEC) {
                    changeState "terminated"
                }
            end
        elsif @state == "accepted"
            if @type == "INV_SERVER"
                # NOTE: no need for reliable transport
                # @l = EventMachine::Timer.new(32000/SEC) {
                    changeState "terminated"
                # }
            elsif @type == "INV_CLIENT"
                # NOTE: no need for reliable transport
                # @m = EventMachine::Timer.new(32000/SEC) {
                    changeState "terminated"
                # }
            end
        elsif @state == "terminated"
            #if @type == "INV_SERVER"
            #end
            # TODO: check if needed at all
            #cleanup
        end
    end

    def leave
        if @state == "proceeding"
        elsif @state == "trying"
            if @type == "NON_CLIENT"
                @e.cancel unless @e.nil?
                @f.cancel unless @f.nil?
            end
        elsif @state == "calling"
            if @type == "INV_CLIENT"
                @a.cancel unless @a.nil?
                @b.cancel unless @b.nil?
            end
        elsif @state == "confirmed"
            if @type == "INV_SERVER"
                @i.cancel unless @i.nil?
            end
        elsif @state == "completed"
            if @type == "INV_SERVER"
                puts "Stop @g and @h timers", @g, @h
                @g.cancel unless @g.nil?
                @h.cancel unless @h.nil?
                puts "After stop @g and @h timers", @g, @h
            elsif @type == "NON_SERVER"
                @j.cancel unless @j.nil?
            elsif @type == "INV_CLIENT"
                @d.cancel unless @d.nil?
            elsif @type == "NON_CLIENT"
                @k.cancel unless @k.nil?
            end
        elsif @state == "accepted"
            if @type == "INV_SERVER"
                @l.cancel unless @l.nil?
            elsif @type == "INV_CLIENT"
                @m.cancel unless @m.nil?
            end
        elsif @state == "terminated"
        end
    end

    def message msg=nil, remote=nil
        p [ "Trans Message", @type, "with state:", @state, msg.request? ? "/" : msg.statusCode, msg.method, remote.nil? ? "" : remote.name ]
        if @state == "proceeding"
            if @type == "INV_SERVER"
                transport(@response) unless @response.nil?
            elsif @type == "INV_CLIENT"
                handle(msg);

                if msg.statusCode >= 300
                    changeState("completed", msg)
                elsif msg.statusCode >= 200
                    changeState "accepted"
                    # NOTE: set as completed skip accepted???
                    # changeState "completed"
                end
            elsif @type == "NON_CLIENT"
                if msg.statusCode >= 200
                    changeState "completed"
                end
                handle(msg)
            end
        elsif @state == "trying"
            if @type == "NON_SERVER"
                transport(@response) unless @response.nil?
            elsif @type == "NON_CLIENT"
                if msg.statusCode >= 200
                    changeState "completed"
                else
                    changeState "proceeding"
                end
                handle(msg)
            end
        elsif @state == "calling"
            if @type == "INV_CLIENT"
                handle(msg)

                if msg.statusCode < 200
                    changeState "proceeding"
                elsif msg.statusCode < 300
                    changeState "accepted"
                else
                    changeState("completed", msg)
                end
            end
        elsif @state == "confirmed"
        elsif @state == "completed"
            if @type == "INV_SERVER"
                if(msg.method == 'ACK')
                    changeState "confirmed"
                else
                    puts "RESPONSE IS NULL for INV_SERVER completed" if @response.nil?
                    transport(@response)
                end
            elsif @type == "NON_SERVER"
                transport(@response)
            elsif @type == "INV_CLIENT"
                # NOTE: prevent sending of ACK on 481 response
                if msg.statusCode != 481
                    transport(@ack) unless remote.nil?
                end
            end
        elsif @state == "accepted"
            if @type == "INV_CLIENT"
                if(msg.statusCode >= 200 && msg.statusCode <= 299)
                    handle(msg)
                end
            end
        elsif @state == "terminated"
        end
    end

    def send message
        p [ "Trans Send", @type, "with state:", @state, message.request? ? "/" : message.statusCode, message.method ]
        if @state == "proceeding"
            if @type == "INV_SERVER"
                @response = message

                if message.statusCode >= 300
                    changeState "completed"
                elsif message.statusCode >= 200
                    changeState "accepted"
                end

                transport(@response)
            end
        elsif @state == "trying"
            if @type == "NON_SERVER"
                @response = message
                transport(@response)
                if message.statusCode >= 200
                    changeState "completed"
                end
            end
        elsif @state == "calling"
        elsif @state == "confirmed"
        elsif @state == "completed"
        elsif @state == "accepted"
            if @type == "INV_SERVER"
                @response = message
                transport(@response)
            end
        elsif @state == "terminated"
        end
    end
end

class Sip
    attr_accessor :hostname
	@@hostname = "proxy.reticulum.local"

    def initialize
    end

	def self.hostname
		return @@hostname
	end

    def self.handle response, withCancel=false
        if withCancel
            # puts "cancel handler"
            Sip.cancelHandler(response)
        else
            # puts "default handler"
            Sip.default(response)
        end
    end

    def self.default response
        # NOTE: remove VIA for this proxy from response
		response.shiftVia
        # puts "[CALLABLE 2]", response.to_s
        Sip.send(response)
    end

    def self.cancelHandler response#, remote=nil
        message = response
        message = response.original unless response.original.nil?

        #Storage.contexts.each { |key, val| p [key, val] }

        context = Storage.contexts[message.contextId]

        # TODO: why slice??? should it remove the first item from the route array CHECK and RECHECK
        routes = message.routes.slice(1..-1) unless message.routes.nil? || message.routes.length==0

        if response.statusCode < 200
            via = response.via.first
            context.cancellers[via.params["branch"]] = {:message => message, :via => via, :routes => routes}

            if(context.cancelled)
                cancel = Sip.makeCancel(message, via, routes)
                Sip.send(cancel)
            end
        else
            context.cancellers.delete(response.via.first.params["branch"])
        end

        Sip.default(response)
    end

    def self.send message, withCancel=false
        hop = nil

        #p ["[SIP SEND]", message.request?, message.method]
        #puts ">>>"
        #puts message
        #puts "<<<"

        unless message.request?
            # send reponse
            t = Transaction.getServer(message);
            #p ["GET SERVER", t.nil?]
            t.send(message) if !t.nil?
        else
            #hop = message.uri
            # TODO: fix overwriting of message uri and check remoteURI Class
            hop = Reticulum::Parser::ParseAddress(message.remoteURI)

            #hop = hop.address if hop.is_a? Reticulum::Parser::Contact

            # TODO: Fix routing
            if !message.routes.nil? && message.routes.length > 0
            	route = message.routes.first #.uri
            	if route.uri.host.to_s == Proxy.proxyip + ":" + Proxy.proxyport
            		message.routes.shift
            	elsif hop.params["lr"].nil?
					hop = route
            		message.routes.shift
                    message._addHeader("Route", message.uri.to_s)
                    message.uri = hop.uri
            	end
            end

            # TODO: resolve addresses for hop
            addresses = []
            # (function(callback) {
            #     if(hop.host == Sip.hostname)
            #         var flow = decodeFlowToken(hop.user);
            #         callback(flow ? [flow] : []);
            #     else
            #         resolve(hop, callback);
            #     end
            # })
            # TODO: remove this line, for now use hop as address
            addresses.push hop

            if(message.method == 'ACK')
                message.via = [] unless message.via.kind_of? (Array)

                message.unshiftRecordRoute("<sip:" + Proxy.proxyip + ":" + Proxy.proxyport + ";lr>")
                message.unshiftVia("SIP/2.0/WSS " + Proxy.proxyip + ":" + Proxy.proxyport + ";branch=" + Transaction.generateBranch())

                if(addresses.length == 0)
                    #p [ "ERROR", "no addresses" ]
                    return;
                end

                address = addresses.shift()

                # remote = Storage.users[address.uri.user].remote
                user = Storage.findUser(address.uri.user)

                if user.nil?
                    Sip.handle(Sip.makeResponse(message, 404, "Not Found"), withCancel)
                    return
                end

                remote = user.remote

				unless remote.nil?
                    Transport.send(message, remote)
				else
					# TODO: in case that a WS client was not found make a WS client that can connect to another Proxy
                    Sip.handle(Sip.makeResponse(message, 404, "Not Found"), withCancel)
				end
            else
                if message.method != 'CANCEL'
                    message.via = [] unless message.via.kind_of? (Array)

                    message.unshiftRecordRoute("<sip:" + Proxy.proxyip + ":" + Proxy.proxyport + ";lr>")
                    message.unshiftVia("SIP/2.0/WSS " + Proxy.proxyip + ":" + Proxy.proxyport + ";branch=" + Transaction.generateBranch())
                end

                # if no valid addresses send 404
                if addresses.length == 0
                    Sip.handle(Sip.makeResponse(message, 404, "Not Found"), withCancel)
                    return
                end

                while addresses.length > 0
                    begin
                        # get first address from array
                        address = addresses.shift()

                        user = nil

						if address.uri.user.nil? || address.uri.user.empty?
							Sip.handle(Sip.makeResponse(message, 404, "Not Found"), withCancel)
							return
						end

                        # if !Storage.bindings[address.uri.user].nil? && !Storage.bindings[address.uri.user].empty?
                        #
                        #     # username = Storage.bindings[address.uri.user].values.first.username
                        #     #
                        #     # if username.nil? || username.empty?
                        #     #     user = Storage.users[address.uri.user]
                        #     # else
                        #     #     user = Storage.users[username]
                        #     # end
                        #
                        #     user = Storage.findUser(address.uri.user)
                        #
    					# 	if user.nil?
    					# 		Sip.handle(Sip.makeResponse(message, 404, "Not Found"), withCancel)
    					# 		return
    					# 	end
                        # else
                        #     Sip.handle(Sip.makeResponse(message, 404, "Not Found"), withCancel)
                        #     return
                        # end

                        user = Storage.findUser(address.uri.user)

                        if user.nil?
    						Sip.handle(Sip.makeResponse(message, 404, "Not Found"), withCancel)
    						return
                        end

                        #p [address, address.uri.user]
                        # puts "ADDRESS", address.uri.to_s, Storage.users
                        # TODO: get connection for message
                        remote = user.remote

                        # TODO: send the correct error if remote is not registered
                        if remote.nil?
                            Sip.handle(Sip.makeResponse(message, 410, "Gone"), withCancel)
                            return
                        end

                        connection = Transport.get remote

                        # create a new client transaction
                        t = Transaction.createCTrans(message, connection, withCancel)
                        # if any remote transport error send 503 response
                        #t.message(Sip.makeResponse(message, 503, "Service Unavailable"))

                    rescue
                        # NOTE: address is local if user is registered on this proxy
                        # puts "Rescue to error 430 or 503"
                    	local = true
                    	Sip.handle(local ? Sip.makeResponse(message, 430, "Flow Failed") : Sip.makeResponse(message, 503, "Service Unavailable"));
                    end
                end

            end
        end
    end

    def self.makeResponse request, status, reason
        response = Reticulum::SIP::Message.new

        response.isRequest = false
        response.original = request

        response.statusCode = status
        response.reason = reason
        response.version = request.version

        # Copy Vias and Contacts
        request.via.each { |x| response._addHeader("Via", x.to_s) }

        unless request.contacts.nil?
            request.contacts.each { |x| response._addHeader("Contact", x.to_s) }
        end

        response._addHeader("To", request.to.to_s)
        response._addHeader("From", request.from.to_s)
        response._addHeader("Call-ID", request.callid)
#puts [ "[CSEQ]", request.cseq ]
        response._addHeader("CSeq", request.cseq.to_s)

        return response
    end

    def self.makeCancel basemsg, via, routes
        request = basemsg
        request = basemsg.original unless basemsg.isRequest

        Storage.messages

        if !basemsg.isRequest && basemsg.original.nil?
            request = Storage.getRequestForResponse(basemsg)
        end

        message = Reticulum::SIP::Message.new
        message.isRequest = true
        message.method = "CANCEL"
        message.remoteURI = request.remoteURI
        message.uri = Reticulum::Parser::ParseAddress(message.remoteURI)

        #puts "make cancel", message.remoteURI, request.remoteURI, message.uri

        # Copy Via
        unless via.nil?
            request.via.each { |x| message._addHeader("Via", x.to_s) }
        end

        message._addHeader("To", request.to.to_s)
        message._addHeader("From", request.from.to_s)
        message._addHeader("Call-ID", request.callid)
        unless routes.nil?
            routes.each { |x| message._addHeader("Route", x.to_s) }
        end
        message._addHeader("CSeq", request.cseq.number.to_s + " " + message.method)

        #Sip.send(message)
        return message
    end
end

# Represents session for registered users
class Session
    attr_accessor :realm, :algorithm, :nonce, :nc, :cnonce, :qop, :uri, :ha1, :ha2, :proxy, :opaque

    def initialize
        @algorithm = "md5"
        @nc = 0
        @realm = "reticulum"
    end
end

class UserInfo
    attr_accessor :name, :email, :password, :session, :remote, :uri

    def initialize name, pass
        @name = name
        @password = pass
        @session = Session.new

        @remote = nil
        @uri = nil
    end

	def to_json(options = {})
		return JSON.generate({
            :name => @name,
            :mail => @email,
            :pass => @password,
        })
	end
end

class Context
    attr_accessor :cancellers
    attr_accessor :cancelled
end

class ContactBinding
    attr_accessor :username
	attr_accessor :contact
	attr_accessor :expires
	attr_accessor :sequence
	# NOTE: enable for outbound extension support
	# attr_accessor :ob

	def initialize username, contact, expires, cseq
        @username = username
		@contact = contact
        expires = expires.to_i
		expires = 3600 if expires == 0
		expires = contact.address.uri.params["expires"].to_i unless contact.address.uri.params["expires"].nil?
		@expires = Time.now.utc.to_i + expires*1000
		@sequence = cseq.number
	end
end

class Storage
    @@contexts = {}
    @@users = {}
    @@userconns = {}
    @@bindings = {}
    @@messages = {}

	# @@access
	# @@insertstmt

    def initialize
        begin
    		# NOTE: a few default users
    		@@users["sanjin"] = UserInfo.new "sanjin", "spass"
    		@@users["edo"] = UserInfo.new "edo", "epass"
    		@@users["bob"] = UserInfo.new "bob", "bpass"
    		@@users["ana"] = UserInfo.new "ana", "apass"

    		@@access = Mysql2::Client.new(:host => Conf.DBhost, :username => Conf.DBuser, :password => Conf.DBpass)
    		@@insertstmt = @@access.prepare("INSERT INTO reticulum.user (name, email, password) VALUES (?,?,?)")
    		results = @@access.query("SELECT * FROM reticulum.user")

    		results.each do |row|
    			@@users[row["name"]] = UserInfo.new row["name"], row["password"]
    			@@users[row["name"]].email = row["email"]
    		end

            # 1000.times { |x|
            #     Storage.register("ana_" + x.to_s, "ana_" + x.to_s + "@reticulum.local", "apass")
            #     Storage.register("bob_" + x.to_s, "bob_" + x.to_s + "@reticulum.local", "bpass")
            # }
        rescue
            puts "Failed to access Proxy DB."
            puts "Exiting Reticulum Proxy."
            exit()
        end
    end

    def self.contexts
        @@contexts
    end

    def self.users
        @@users
    end

    def self.userconns
        @@userconns
    end

	def self.users_array
		return @@users.values
	end

    def self.bindings
        @@bindings
    end

    def self.messages
        @@messages
    end

    def self.getRequestForResponse response
        return @@messages[response.requestID()]
    end

	def self.register(name, email, pass)
		@@insertstmt.execute(name, email, pass)
		@@users[name] = UserInfo.new name, pass
		@@users[name].email = email
	end

    def self.findUser(username)
        puts ""
        p ["FIND user:", username]

        if !@@bindings[username].nil? && !@@bindings[username].empty?
            p ["FOUND binding for:", username]
            username = @@bindings[username].values.first.username
            p ["Original NON-Contact username:", username]

            # return nil if username.nil? || username.empty?
        end

        p ["USER corresponding", username, "is:", @@users[username]]
        puts ""

        return @@users[username]
    end

    def self.removeBindings remote
        username = @@userconns[remote.name + "_" + remote.port.to_s]
        @@bindings.delete(username)
    end

	def self.deploy
		puts "Setting up Reticulum DB"

		begin
			createUser = [
				"CREATE TABLE reticulum.user (",
				"    id INT AUTO_INCREMENT,",
				"    name VARCHAR(100) NOT NULL,",
				"    email VARCHAR(100) NOT NULL,",
				"    password VARCHAR(250) NOT NULL,",
				"    PRIMARY KEY(id)",
				");"
			].join("\r\n")

			@@access.query("CREATE DATABASE reticulum;")
			@@access.query(createUser)

			puts "Created User table for Reticulum database."
		rescue
			puts "Failed to setup Proxy DB."
		end

		puts "Exiting Reticulum Proxy."
		exit()
	end
end

class Proxy
    attr_accessor :ws
    attr_accessor :sip
    attr_accessor :domain

	# attr_accessor :proxyip
	# attr_accessor :proxyport
    @@proxyip = ""
    @@proxyport = ""

    def initialize
        @domain = "reticulum.local"
        @realm = "reticulum.local"
        #@sip = Sip.new
    end

    def self.setProxyHost ip, port
        @@proxyip = ip
        @@proxyport = port
    end

    def self.proxyip
        @@proxyip
    end

    def self.proxyport
        @@proxyport
    end

    def route request, remote
        # NOTE: Contact and Via fix only needed once we support regular proxies that don't support WS/WSS
        # if request.method == 'REGISTER'
        #     request.fixContact(remote.name, remote.port, @@proxyip, @@proxyport)
        #     request.fixVia(remote.name, remote.port)
        # end

        id = request.contextId

        if request.method == 'CANCEL'
            ctx = Storage.contexts[id]

            unless ctx.nil?
                Sip.send(Sip.makeResponse(request, 200, "OK"))

                ctx.cancelled = true

                # May not be necessare, we can go trough the map and if one exists call it using a block
                if !ctx.cancellers.empty?
                    # TODO: execute each canceller
                    ctx.cancellers.each { |key, val|
                        #puts "[canceler]", key, val
                        cancel = Sip.makeCancel(val[:message], val[:via], val[:routes])
                        Sip.send(cancel)
                    }
                end

            else
                Sip.send(Sip.makeResponse(request, 481, "Call/Transaction Does Not Exist"))
            end
        else
            # TODO: implement cancellers
            ctx = Context.new
            ctx.cancellers = {}
            Storage.contexts[id] = ctx

            # TODO: fix potential issues with from user and contact user values being different
            #       which causes responses not to be routed correctly
            begin
                user = request.to.uri.user

				if !['ACK', 'BYE', 'CANCEL', 'INVITE', 'MESSAGE', 'OPTIONS', 'REGISTER'].include? (request.method)
                    send(Sip.makeResponse(request, 405, "Method Not Allowed"));
				elsif request.method == 'REGISTER'
                    userinfo = Storage.users[user]
                    Storage.users[user].remote = remote unless userinfo.nil?
                    Storage.users[user].uri = request.to.uri unless userinfo.nil?

                    if userinfo.nil?
                        Sip.send(Utils.challenge(nil, Sip.makeResponse(request, 401, "Authentication Required")));
                    else
                        userinfo.session.realm = @realm if userinfo.session.realm == ""
                        if !Utils.authenticateRequest(userinfo, request)
                            Sip.send(Utils.challenge(userinfo.session, Sip.makeResponse(request, 401, "Authentication Required")));
                        else
                            contacts = request.contacts
                            contacts = [contacts] unless contacts.kind_of?(Array)

							if contacts.include? "*" && contacts.length > 1
								response = Sip.makeResponse(request, 400, "Invalid Request")
								send(response)
							elsif contacts.include? "*" || request.expires == 0
								Storage.bindings.delete(user)
                                Storage.userconns.delete(remote.name + "_" + remote.port.to_s)
							else
                                # NOTE: Make binding for each user in Contacts and map all received contacts for that user
                                usernames = [user]

                                contacts.each { |contact|
                                    usernames.push(contact.address.uri.user) if !contact.address.uri.user.nil? || !contact.address.uri.user.empty?
                                }

                                usernames.each { |username|
                                    # username = user

    								bindings = Storage.bindings[username]
    								bindings = {} if bindings.nil?

    								contacts.each { |contact|
    									if bindings[request.callid].nil? || bindings[request.callid].sequence < request.cseq.number
    										expires = 0
    										expires = request.expires unless request.expires.nil?

    										bind = ContactBinding.new(user, contact, expires, request.cseq)

    										bindings[request.callid] = bind
    									elsif !bindings[request.callid].nil? && contact.address.params["expires"] == 0
    										bindings.delete(request.callid)
    									end
    								}

    								Storage.bindings[username] = bindings unless bindings.empty?
                                }

                                Storage.userconns[remote.name + "_" + remote.port.to_s] = user

	                            response = Sip.makeResponse(request, 200, "OK")
	                            response.to.params["tag"] = Utils.genhex(7)

	                            send(response)
							end
                        end
                    end

                else
					if !Storage.bindings[user].nil? && !Storage.bindings[user].empty?
                    # if !Storage.users[user].nil?

                        # request.uri = Storage.users[user].uri
						#p [ "URI contact", Storage.bindings[user].values.first ]
                        request.uri = Storage.bindings[user].values.first.contact.address.uri

                        # NOTE: Strip  params from URI
                        request.uri.params = {}

						if request.method == 'INVITE'
                            send(Sip.makeResponse(request, 100, "Trying"))
						end

                        send(request)
					else
                        p ["USER", user, "NOT FOUND"]
                        send(Sip.makeResponse(request, 404, "Not Found"))
					end
				end
            rescue
                # puts "[EXCEPTION 1]"
                Storage.contexts.delete(id)
				send(Sip.makeResponse(request, 500, "Internal Server Error"))
            end
        end
    end

    def handle message, remote
        # NOTE: Store message
        Storage.messages[message.id()] = message

        # TODO: enable error handling
        # begin
            # puts [ "MSG", message.to_s ]
            # puts [ message.via.length ]
            t = message.request? ? Transaction.getServer(message) : Transaction.getClient(message)
            #puts ["Handle", message.method, "has transaction?", t.nil?, t.nil? ? "null" : t.state]
            if t.nil?
                if message.method != 'ACK'
                    t = Transaction.createSTrans(message, Transport.get(remote))

                    # TODO: reenable error handling
                    begin
                        # NOTE: disable INVITE to oneself
                        if message.method == "INVITE" && (message.to.auri == message.from.auri)

                            t.send(Sip.makeResponse(message, 500, "Internal Server Error"));
                            return
                        end

                        route(message, remote)

                    rescue
                        puts "Rescue to error 500"
                        t.send(Sip.makeResponse(message, 500, "Internal Server Error"))
                    end

                elsif message.method == 'ACK'
                    p [ "No Transaction found", "handling ACK" ]
                    route(message, remote)
                end
            else
                if message.method == 'ACK'
                    p [ "handling in transaction ACK" ]
                #     p [ t.response.to_s ] unless t.response.nil?
                #     p [ t.request.to_s ] unless t.request.nil?
                end

                t.message(message, remote)
            end
        # rescue => e
            #puts e.message
        # end
    end

    def send message
        # puts "[SEND with context]", message.statusCode
        ctx = Storage.contexts[message.contextId]
# puts "has ctx" unless ctx.nil?
        if ctx.nil?
            # puts "CTX"
            #@sip.send.apply(sip, arguments)
            #callable = Proxy.new.method(:default)
            Sip.send(message, false)

            return
        end

        return forward(ctx, message)#, callback)
    end

    # Agregated functionality for both req and res
    def forward context, message
        if message.request?
            #callable = Proxy.new.method(:cancelHandler)
            Sip.send(message, true)
        else
            if message.statusCode >= 200
                #puts "CTXs 2", Storage.contexts
                Storage.contexts.delete(message.contextId)
            end

            Sip.send(message)
        end
    end

    def stop
        Sip.stop
    end
end
