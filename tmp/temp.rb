class Search
    attr_accessor :transaction
    attr_accessor :connection
    attr_accessor :addresses
    attr_accessor :request
    attr_accessor :callback

    attr_accessor :onresponse
    attr_accessor :lastStatusCode

    def initialize transaction, connect, addresses, request, callback
        if request.method != 'CANCEL'
            request.via = [] unless request.headers.via
            #request.via.unshift({params:{}});
            request.unshiftVia("SIP/2.0/WS " + @hostname)
        end

        next()
    end

    def next
        onresponse = searching

        if addresses.length > 0
            begin
                address = addresses.shift()
                client = transaction(connect(address, function(err) {
                    if err
                        console.log("err: ", err);
                    end
                    client.message(makeResponse(rq, 503))
                }), rq, function() { onresponse.apply(null, arguments); });
            rescue
                onresponse(address.local ? makeResponse(rq, 430) : makeResponse(rq, 503));
            end
        else
            onresponse = callback;
            onresponse(makeResponse(rq, lastStatusCode || 404));
        end
    end

    def searching rs
        @lastStatusCode = rs.status

        if rs.status === 503
            next()
            #return
        elsif rs.status > 100
            @onresponse = @callback
        end

        callback(rs)
    end


    def combined transaction, connect, addresses, request, callback
        if request.method != 'CANCEL'
            request.via = [] unless request.headers.via
            #request.via.unshift({params:{}});
            request.unshiftVia("SIP/2.0/WS " + @hostname)
        end

        onresponse = searching

        # TODO: try each address send 503 if fails
        while addresses.length > 0
            begin
                address = addresses.shift()
                # client = transaction(connect(address, function(err) {
                #     if err
                #         console.log("err: ", err);
                #     end
                #     client.message(makeResponse(rq, 503))
                # }), rq, function() { onresponse.apply(null, arguments); });
                # TODO: find client for transaction, send message send 503 if fails, do
            rescue
                onresponse(address.local ? makeResponse(rq, 430) : makeResponse(rq, 503));
            end
        # TODO: if all fail or there are no addresses send 404 Not Found
        end

        callback.call(makeResponse(request, lastStatusCode || 404))
        # NOTE: possible cleanup for original request needed
    end
end
