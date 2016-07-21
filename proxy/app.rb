require 'faye/websocket'
#require 'permessage_deflate'
require 'rack'
require 'json'
require 'yaml'

require 'mysql2'

require './proxy/admin.rb'
require './proxy/parser.rb'
require './proxy/utils.rb'
require './proxy/transport.rb'
require './proxy/sipstack.rb'


Conf.new

Storage.new

Storage.deploy if ARGV[0] == "--deploy"

proxy = Proxy.new

transport = Transport.new proxy

$logger = Admin.new

App = lambda do |env|
	transport.handle env
end

def App.log(message)
end
