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
end
