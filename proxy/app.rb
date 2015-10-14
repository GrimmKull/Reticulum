require 'faye/websocket'
#require 'permessage_deflate'
require 'rack'

require './proxy/admin.rb'
require './proxy/parser.rb'
require './proxy/utils.rb'

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

class Transport
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
        p ["SENT", message.request? ? message.method : message.statusCode, "to", remote.name]
        #p "<<<"
        ws = Transport.get remote
        ws.send message
    end
end

class Transaction
    SEC = 1#1000

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

    def self.generateBranch
        return 'z9hG4bK' + SecureRandom.hex(7)
    end

    def self.transactionId(message)
        puts message.to_s
        # puts [ "VIA", message.via.each { |x| puts x.to_s } ]
        #message.via.each { |v| puts v.nil?}
        via = message.via.first
        #via = via.first if message.first.kind_of? (Array)

        return ['INVITE', message.callid, via.branch].join if message.method == 'ACK'

        #puts "[VIA TransId]", message.to_s
        return [message.cseq.method, message.callid, via.branch].join
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
        #request.via.first.branch = Transaction.generateBranch if request.method != 'CANCEL'

        id = Transaction.transactionId(request)

        type = "_CLIENT"

        type = ((request.method == "INVITE") ? "INV" : "NON") + type

        trans = Transaction.new id, type, request, connection

        trans.withCancel = withCancel

        @@c_trans[id] = trans

        return trans
    end

    def self.getServer message
        t = @@s_trans[Transaction.transactionId(message)]
        x = ""
        @@s_trans.each { |k,v| x += v.id + ", "}
        p ["#S TRANS", x, t.nil?, Transaction.transactionId(message)]
        return t
    end

    def self.getClient message
        t = @@c_trans[Transaction.transactionId(message)]
        x = ""
        @@c_trans.each { |k,v| x += v.id + ", "}
        p ["#C TRANS", x, t.nil?, Transaction.transactionId(message)]
        return t
    end

    def destroy
        # TODO: destroy each transaction
    end

    def createAck request
        ack = Reticulum::Parser::Message.new
        ack.method = 'ACK'
        ack.uri = request.uri

        ack._addHeader("Via", request.headers[Reticulum::Parser::HEADERS.index('SIP_HDR_VIA')].value)
        ack._addHeader("From", request.headers[Reticulum::Parser::HEADERS.index('SIP_HDR_FROM')].value)
        ack._addHeader("Call-ID", request.headers[Reticulum::Parser::HEADERS.index('SIP_HDR_CALL_ID')].value)
        ack._addHeader("CSeq", ack.method + " " + request.cseq.number.to_s)
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
        #puts "Transporting from Transaction", Transport.connections.key(@connection)
        # p ["TRANSA TRANSPORT"]
        # p ["REQ", @request.to_s]
        # p ["RESP", @response.to_s]
        # p ["MSG", @message.to_s]
        #Transport.send message
        #puts @connection.nil? #message.to_s
        p ["SENT TRANSA", message.request? ? message.method : message.statusCode, "to", message.to.auri]
        # p message.via.to_s
        @connection.send(message.to_s)
    end

    def handle message
        #  p ["TRANSA USER CALL", @withCancel, message.to_s]
         Sip.handle(message, @withCancel)
    end

    # State machine actions
    def changeState state
        a = "/"
        b = 0
        a = @request.method if @request
        b = @response.statusCode if @response
        p [@type, @id, "[STATE] from:", @state, "to:", state, "msg:", a, b]
        # handle leaving of old state
        leave

        @state = state
        #Array.prototype.shift.apply(arguments);

        # handle entering of new state
        enter
        #state.enter.apply(this, arguments);
    end

    def enter
        if @state == "proceeding"
        elsif @state == "trying"
            if @type == "NON_CLIENT"
                transport(@request);
                if(!Transport.reliable)
                    @e = EventMachine::PeriodicTimer.new(500/SEC) {
                        #setTimeout(function() { sm.signal('timerE', 500); }, 500);
                        puts "timer E"
                        transport(@request)
                    }
                end
                # TODO: Check if this periodic timer creates a loop
                @f = EventMachine::PeriodicTimer.new(32000/SEC) {
                    #setTimeout(function() { sm.signal('timerF'); }, 32000);
                    puts "timer F"
                    handle(Sip.makeResponse(@request, 408, "Request Timeout"))
                    changeStatus "terminated"
                }
            end
        elsif @state == "calling"
            if @type == "INV_CLIENT"
                transport(@request)

                if !Transport.reliable?
                    n = 0
                    @a = EventMachine::PeriodicTimer.new(500/SEC) {
                        puts "timer A"
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
                @ack = createAck @request
                @ack._addHeader("To", @request.headers[Reticulum::Parser::HEADERS.index('SIP_HDR_TO')].value)
                # puts ["!!!!!!!!!!!!!!!!!!!!"]
                transport(@ack)
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
                @l = EventMachine::Timer.new(32000/SEC) {
                    changeState "terminated"
                }
            elsif @type == "INV_CLIENT"
                @m = EventMachine::Timer.new(32000/SEC) {
                    changeState "terminated"
                }
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
                @g.cancel unless @g.nil?
                @h.cancel unless @h.nil?
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
        #p ["[TRANSA SEND]", msg.request?, msg.method, remote.nil? ? "" : remote]
        if @state == "proceeding"
            if @type == "INV_SERVER"
                transport(@response) unless @response.nil?
            elsif @type == "INV_CLIENT"
                handle(msg);

                if msg.statusCode >= 300
                    changeState "completed"#, msg
                elsif msg.statusCode >= 200
                    changeState "accepted"
                end
            elsif @type == "NON_CLIENT"
                if msg.statusCode >= 200
                    changeStatus "completed"
                end
                handle(msg)
            end
        elsif @state == "trying"
            if @type == "NON_SERVER"
                transport(@response) unless @response.nil?
            elsif @type == "NON_CLIENT"
                if msg.statusCode >= 200
                    changeStatus "completed"
                else
                    changeStatus "proceeding"
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
                    changeState "completed"#, msg
                end
            end
        elsif @state == "confirmed"
        elsif @state == "completed"
            if @type == "INV_SERVER"
                if(msg.method === 'ACK')
                    changeState "confirmed"
                else
                    transport(@response)
                end
            elsif @type == "NON_SERVER"
                transport(@response)
            elsif @type == "INV_CLIENT"
                transport(@ack) unless remote.nil?
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
        #p ["[TRANSA SEND]", message.request?, message.method, @state, @type]
        if @state == "proceeding"
            if @type == "INV_SERVER"
                @response = message
# puts "INV TRANSA SEND", message.statusCode
                if message.statusCode >= 300
                    changeState "completed" #sm.enter(completed)
                elsif message.statusCode >= 200
                    changeState "accepted" #sm.enter(accepted)
                end

                transport(@response)
            end
        elsif @state == "trying"
            if @type == "NON_SERVER"
                @response = message
                transport(message)
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
    #attr_accessor :hostname
    #attr_accessor :transaction

    def initialize
        # No need for Transaction layer initialization since all needed properties are Class variables
        #@transaction = Transaction.new#makeTransactionLayer(options, transport.open.bind(transport));
        #@hostname = "proxy.reticulum.local" # options.publicAddress || options.address || options.hostname || os.hostname();
    end

    def self.handle response, withCancel
        if withCancel
            Sip.cancelHandler(response)
        else
            Sip.default(response)
        end
    end

    def self.default response
        # TODO: fix the via shift issues
        #response.shiftVia
        # puts "[CALLABLE 2]", response.to_s
        # TODO: Check if Proxy or Sip send!!!
        Sip.send(response)
    end

    def self.cancelHandler response#, remote=nil
        # TODO: renable cancelHandler and remove following line once the contexts are sorted out
        Sip.default(response); return
        #puts "[CALLABLE 1]"
        message = response
        message = response.original unless response.original.nil?

        #puts "KEYS", Storage.contexts.keys.to_s

        #puts "VIA", response.via.to_s

        #puts response.via.length, response.contextId.to_s
        #puts response.via.length, contextId(response).to_s
        #puts response.original.nil?
        # puts mesage.nil? ? "NO MSG" : message.contextId
        # puts mesage.nil? ? "NO MSG" : contextId(message)

        # puts "[STATUS]", response.statusCode, response
        context = Storage.contexts[message.contextId]
        #b = Storage.contexts.keys.include? contextId(message)
        p [ "CTXs", Proxy.contexts.keys, message.contextId, response.statusCode ]
        #route = message.headers.route && message.headers.route.slice
        # TODO: why slice??? should it remove the first item from the route array CHECK and RECHECK
        route = message.route.slice(1..-1) unless message.route.nil?
        if response.statusCode < 200
            via = response.via.first
            context.cancellers[via.branch] = {:message => message, :via => via, :route => route}

            if(context.cancelled)
                cancel = Sip.makeCancel(message, via, route)
                Sip.send(cancel)
            end
        else
            context.cancellers.delete(response.via.first.branch)
        end

        Sip.default(response)
    end

    # TODO: in case that a WS client was not found make a WS client that can connect to another Proxy
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
            t.send(message) if !t.nil? #&& t.methods.include? ('send')
        else
            #hop = message.uri
            # TODO: fix overwriting of message uri
            hop = Reticulum::Parser::ParseAddress(message.remoteURI)

            #hop = hop.address if hop.is_a? Reticulum::Parser::Contact


            # TODO: Fix routing
            # if typeof message.headers.route === 'string'
            #     message.headers.route = parsers.route({s: message.headers.route, i:0});
            # end

            # if message.headers.route && message.headers.route.length > 0
            #     hop = message.headers.route.first.uri
            #     if hop.host == hostname
            #         message.headers.route.shift
            #     elsif hop.params.lr.nil?
            #         message.headers.route.shift
            #         message.headers.route.push(message.uri)
            #         message.uri = hop
            #     end
            # end

            # TODO: resolve addresses for hop
            addresses = []
            # (function(callback) {
            #     if(hop.host == hostname)
            #         var flow = decodeFlowToken(hop.user);
            #         callback(flow ? [flow] : []);
            #     else
            #         resolve(hop, callback);
            #     end
            # })
            # TODO: rempve this line, for now use hop as address
            addresses.push hop
            #(function(addresses) {
            if(message.method == 'ACK')
                if(!message.via.kind_of?(Array))
                    message.via = [];
                end

                # TODO: add this proxy Via header
                #if(message.via.length == 0)
                #    message.unshiftVia("SIP/2.0/WS " + @hostname + ";branch=" + Transaction.generateBranch())
                #end

                if(addresses.length == 0)
                    #p [ "ERROR", "no addresses" ]
                    #errorLog(new Error("ACK: couldn't resolve " + stringifyUri(m.uri)));
                    return;
                end

                #    var connection = transport.open(addresses[0], errorLog);
                #    try {
                #      connection.send(m);
                #    }
                #    catch(e) {
                #      errorLog(e);
                #    }
                #    finally {
                #      connection.release();
                #    }
                Transport.send(message, addresses[0])
            else

                #p ["CTRANS create", t.nil?]
                #p ["CALLBACK", callback]
                # TODO: implement sequentialSearch
                #sequentialSearch(transaction.createClientTransaction.bind(transaction), transport.open.bind(transport), addresses, message, callback || function() {});
                if message.method != 'CANCEL'
                    message.via = [] unless message.via.kind_of? (Array)
                    #puts "hostname", @hostname

                    @hostname = "proxy.reticulum.local" if @hostname.nil?
                    # TODO: check the Via branch after this line
                    #message.unshiftVia("SIP/2.0/WS " + @hostname + ";branch=" + Transaction.generateBranch())
                end

                # if not valid addresses send 404
                if addresses.length == 0
                    # puts "NO Addresses 404 !!!!!!!!!!!!!!!!!!!!!!!!!!!"
                    Sip.handle(Sip.makeResponse(message, 404, "Not Found"), withCancel)
                end

                while addresses.length > 0
                    # TODO: reenable error handling
                    #begin
                        # get first address from array
                        address = addresses.shift()
                        #p [address, address.uri.user]
                        # puts "ADDRESS", address.uri.to_s, Storage.users
                        # TODO: get connection for message
                        remote = Storage.users[address.uri.user].remote
                        # TODO: send the correct error if remote is not registered
                        if remote.nil?
                            Sip.handle(Sip.makeResponse(message, 410, "Gone"), withCancel)
                            return
                        end
                        #puts "REMOTE",address.uri.user, remote.nil?, Storage.users
                        connection = Transport.get remote
                        #puts "CONNECTION", connection
                        # create a new client transaction
                        t = Transaction.createCTrans(message, connection, withCancel)
                        # if any remote transport error send 503 response
                        #t.message(Sip.makeResponse(message, 503, "Service Unavailable"))

                    # rescue
                    #     # NOTE: address is local if user is registered on this proxy
                    #     puts "Rescue to error 430 or 503"
                    #     local = true
                    #    handle(local ? Sip.makeResponse(message, 430, "Flow Failed") : Sip.makeResponse(message, 503, "Service Unavailable"));
                    # end
                end

            end
            #});
        end
    end

    def self.makeResponse request, status, reason
        response = Reticulum::SIP::Message.new
# puts "-----------------------"
# puts request.to_s
# puts "-----------------------"
        response.isRequest = false
        response.original = request

        response.statusCode = status
        response.reason = reason
        response.version = request.version
puts "[STATUS]",status
        # Copy Via
        #request.headers[Reticulum::Parser::HEADERS.index('SIP_HDR_VIA')].each { |x| puts "||", x.to_s, "||"; response._addHeader("Via", x.value) }
        request.via.each { |x| puts "||", x.to_s, "||"; response._addHeader("Via", x.to_s); puts "||", response.via.first.to_s, "||" }
        #response._addHeader("Via", request.headers[Reticulum::Parser::HEADERS.index('SIP_HDR_VIA')].value)

        response._addHeader("To", request.headers[Reticulum::Parser::HEADERS.index('SIP_HDR_TO')].value)
        response._addHeader("From", request.headers[Reticulum::Parser::HEADERS.index('SIP_HDR_FROM')].value)
        response._addHeader("Call-ID", request.headers[Reticulum::Parser::HEADERS.index('SIP_HDR_CALL_ID')].value)
        response._addHeader("CSeq", request.headers[Reticulum::Parser::HEADERS.index('SIP_HDR_CSEQ')].value)

        return response
    end

    def self.makeCancel request, via, route
        #message = Message.new
        message = Reticulum::SIP::Message.new
        message.method = 'CANCEL'
        message.uri = request.uri.dup

        # Copy Via
        #request.headers[Reticulum::Parser::HEADERS.index('SIP_HDR_VIA')].each { |x| response._addHeader("Via", x.value) }
        request.via.each { |x| puts "||", x.to_s, "||"; response._addHeader("Via", x.to_s) }

        message._addHeader("To", request.headers[Reticulum::Parser::HEADERS.index('SIP_HDR_TO')].value)
        message._addHeader("From", request.headers[Reticulum::Parser::HEADERS.index('SIP_HDR_FROM')].value)
        message._addHeader("Call-ID", request.headers[Reticulum::Parser::HEADERS.index('SIP_HDR_CALL_ID')].value)
        message._addHeader("Route", route)
        message._addHeader("CSeq", request.headers[Reticulum::Parser::HEADERS.index('SIP_HDR_CSEQ')].value)

        #Sip.send(message)
    end
end

# Represents session for registered users
class Session
    attr_accessor :algoritm, :nonce, :nc, :cnonce, :qop, :uri, :ha1, :ha2

    def initialize
        @algorithm = "md5"
        @nc = 0
    end
end

class UserInfo
    attr_accessor :name, :password, :session, :remote, :uri

    def initialize name, pass
        @name = name
        @password = pass
        @session = Session.new

        @remote = nil
        @uri = nil
    end
end

class Context
    attr_accessor :cancellers
    attr_accessor :cancelled
end

class Storage
    @@contexts = {}
    @@users = {}
    @@contacts = {}

    def initialize
        # TODO: remove this temporary storage for user contacts
        #@contacts = {}
        # TODO: replace this temporary storage for user storage
        #@users = {}
        @@users["sanjin"] = UserInfo.new "sanjin", "spass"
        @@users["edo"] = UserInfo.new "edo", "epass"
        @@users["bob"] = UserInfo.new "bob", "bpass"
        @@users["ana"] = UserInfo.new "ana", "apass"
    end

    def self.contexts
        @@contexts
    end

    def self.users
        @@users
    end

    def self.contacts
        @@contacts
    end
end

class Proxy
    attr_accessor :ws
    attr_accessor :sip
    attr_accessor :domain

    def initialize
        @domain = "reticulum.local"
        @realm = "reticulum.local"
        #@sip = Sip.new
    end

    def route request, remote
        #ctx = nil
        id = contextId(request)
        request.contextId = id

        if request.method == 'CANCEL'
            ctx = Storage.contexts[id]

            unless ctx.nil?
                Sip.send(Sip.makeResponse(request, 200, "OK"))

                ctx.cancelled = true

                # May not be necessare, we can go trough the map and if one esists call it using a block
                if !ctx.cancellers.empty?
                    # TODO: execute each canceller
                    #Object.keys(ctx.cancellers).forEach(function(c) { ctx.cancellers[c](); });
                    ctx.cancellers.each { |c|
                        cancel = Sip.makeCancel(c[:message], c[:via], c[:route])
                        Sip.send(cancel)
                    }
                end

            else
                Sip.send(Sip.makeResponse(request, 481, "Call/Transaction Does Not Exist"))
            end
        else
            #onRequest(rq, route, remote)
            # TODO: implement cancellers
            ctx = Context.new
            ctx.cancellers = {}
            Storage.contexts[id] = ctx
#puts "CTX added empty", Storage.contexts, self
            # TODO: reenable exception handling
            #begin
                user = request.to.uri.user

                if request.method == 'REGISTER'

                    # TODO: implement auth
                    userinfo = Storage.users[user]
                    Storage.users[user].remote = remote unless userinfo.nil?
                    Storage.users[user].uri = request.to.uri unless userinfo.nil?

                    #puts "Users", Storage.users
                    # puts "User info", Storage.users[user].remote.nil?
=begin
                    if userinfo.nil?
                        Sip.send(Utils.challenge({realm: @realm}, Sip.makeResponse(request, 401, "Authentication Required")));
                    else
                        userinfo.session.realm = @realm if userinfo.session.realm == ""
                        if !Utils.authenticateRequest(userinfo.session, rq, user, userinfo.password)
                            Sip.send(Utils.challenge({realm: @realm}, Sip.makeResponse(request, 401, "Authentication Required")));
                        else
=end
                            # TODO: Replace following lines with registration store save
                            contacts = request.contacts#request.headers[Reticulum::Parser::HEADERS.index('SIP_HDR_CONTACT')].value
                            contacts = [contacts] unless contacts.kind_of?(Array)
                            Storage.contacts[user] = contacts

                            response = Sip.makeResponse(request, 200, "OK")
                            # TODO: implement real tag generation function
                            response.to.tag = Utils.genhex(7)

                            # NOTE:  _proxy.send_ not sip.send
                            send(response)
                        #end
                    #end

                else # TODO: check if one of allowed methods
                    #puts @contacts, user
                    # TODO: add support for contacts
                    #if !Storage.contacts[user].nil? && Storage.contacts[user].kind_of?(Array) && Storage.contacts[user].length > 0
                    if !Storage.users[user].nil?
                        # TODO: Replace following line with registration store load
                        request.uri = Storage.users[user].uri
                        #request.uri = Storage.contacts[user].first#.uri

                        send(Sip.makeResponse(request, 100, "Trying"))

                        send(request)
                    else
                        # puts Storage.contacts, user
                        send(Sip.makeResponse(request, 404, "Not Found"))
                    end
                #else
                    # TODO: prevent processing of methods that are not allowed
                    #send(Sip.makeResponse(rq, 405, "Method Not Allowed"));
                end
            #rescue
            #    puts "[EXCEPTION 1]"
            #    Storage.contexts.delete(id)
            #end
        end
    end

    def handle message, remote
        # TODO: enable error handling
        #begin
            # puts [ "MSG", message.to_s ]
            # puts [ message.via.length ]
            t = message.request? ? Transaction.getServer(message) : Transaction.getClient(message)

            if t.nil?
                if message.method != 'ACK'
                    t = Transaction.createSTrans(message, Transport.get(remote))

                    # TODO: reenable error handling
                    #begin
                        # NOTE: disable INVITE to oneself
                        if message.method == "INVITE" && (message.to.auri == message.from.auri)

                            t.send(Sip.makeResponse(message, 500, "Internal Server Error"));
                            return
                        end

                        route(message, remote)
=begin
                    rescue
                        puts "Rescue to error 500"
                        t.send(Sip.makeResponse(message, 500, "Internal Server Error"))
                    end
=end
                elsif message.method == 'ACK'
                    route(message, remote)
                end
            else
                t.message(message, remote)
            end
        #rescue => e
            #puts e.message
        #end
    end

    def contextId message
        via = message.via.first
        return [via.branch, via.transport, via.host.name, via.port, message.callid, message.cseq.number]
    end

    def send message
        puts "[SEND with context]", message.statusCode
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


static  = Rack::File.new(File.dirname(__FILE__) + "/../client")
# options = {:extensions => [PermessageDeflate], :ping => 5}
options = {:ping => 5}

Storage.new
proxy = Proxy.new
Transport.new

logger = Admin.new

App = lambda do |env|
  if Faye::WebSocket.websocket?(env)
    ws = Faye::WebSocket.new(env, ["sip", "admin"], options)
    #p [:open, ws.url, ws.version, ws.protocol]
    #p [ env, env.methods, env.instance_variables ]

    #proxy.ws = ws

    ws.onopen = lambda do |event|
        if ws.protocol == "sip"
            remote = Reticulum::Parser::Host.new
            remote.name = env["em.connection"].remote_address
            remote.port = env["em.connection"].remote_port

            Transport.add(ws, remote)
        elsif ws.protocol == "admin"
            logger.add ws
            puts "[ADMIN CONNECTION]", logger.admins.length
        end
    end

    # ws.on('message', function(data) {
    #     msg = parseMessage(data);
    #     if(msg)
    #         callback(msg, {protocol: 'WS', address: remote.address, port: remote.port, local: local});
    #     end
    # });
    ws.onmessage = lambda do |event|
        if ws.protocol == "sip"
            remote = Reticulum::Parser::Host.new
            remote.name = env["em.connection"].remote_address
            remote.port = env["em.connection"].remote_port

            #p remote.name, remote.port

            #ws.send(event.data)
            #puts event.target
            #puts event
            message = Reticulum::Parser::Parse event.data

            #p message.to_s
            p ["GOT", message.request? ? message.method : message.statusCode, "from", remote.name]

            proxy.handle(message, remote)
        end
    end

    #ws.on('close', function() { delete flows[flowid] })
    ws.onclose = lambda do |event|
        if ws.protocol == "sip"
            p [:close, event.code, event.reason]
            ws = nil

            Transport.remove ws
        elsif ws.protocol == "admin"
            logger.remove ws
            puts "[ADMIN disCONNECT]", logger.admins.length
        end
    end

    ws.rack_response

  else
    static.call(env)
  end
end

def App.log(message)
end
