require 'json'

class Admin
    attr_accessor :admins

    def initialize
        @admins = []
    end

    def add ws
        # TODO: add Admin connection
        @admins.push ws

        # TODO: send current state (registered users and sip registration status, active calls, transactions, dialogs, contexts)
    end

    def remove ws
        # TODO: remove Admin connection
        @admins.delete ws
    end

    def send data
        # TODO: send data to all Admins
        @admins.each { |ws| ws.send(data) }
    end

    def logMessage message, bIn, remote
        #p ["GOT", message.request? ? message.method : message.statusCode, "from", remote.name]

        p [message.to_s]

        p [message.statusCode, message.reason, message.method]

method = message.method

method = message.statusCode.to_s + " " + message.reason unless message.request?

        send JSON.generate({
            :type => "message",
            :data => {
                :from => message.from.uri.user,
                :to => message.to.uri.user,
                :method => method,
                :msg => message.to_s,
                :direction => (bIn ? 'in' : 'out'),
                :remote => remote,
            },
        })
    end

    def logTransaction id, state, type
        #p ["GOT", message.request? ? message.method : message.statusCode, "from", remote.name]

        #p [message.to_s]

        #p [message.statusCode, message.reason, message.method]

        send JSON.generate({
            :type => "new_trans",
            :data => {
                :id => type + "|" + id,
                :state => state,
                :type => type,
            },
        })
    end

    def logTransactionChange id, state, oldstate, type
        #p ["GOT", message.request? ? message.method : message.statusCode, "from", remote.name]

        #p [message.to_s]

        #p [message.statusCode, message.reason, message.method]

        send JSON.generate({
            :type => "new_trans_state",
            :data => {
                :id => type + "|" + id,
                :state => state,
            },
        })
    end
end
