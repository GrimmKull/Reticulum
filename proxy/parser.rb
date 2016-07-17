require './proxy/utils.rb'

require 'base64'

module Reticulum
	module SIP
		class Header
			attr_accessor :name
			attr_accessor :id
			attr_accessor :value
		end

		class Message
			attr_accessor :headers

			attr_accessor :tag
			attr_accessor :method

			attr_accessor :remoteURI

			attr_accessor :version
			attr_accessor :uri
			attr_accessor :statusCode
			attr_accessor :reason

			attr_accessor :original
			attr_accessor :isRequest
			alias_method :request?, :isRequest

			attr_accessor :headers

			attr_accessor :via
			attr_accessor :contacts
			attr_accessor :routes
			attr_accessor :recordRoutes
			attr_accessor :to
			attr_accessor :from
			attr_accessor :callid
			attr_accessor :cseq
			attr_accessor :maxForwards
			attr_accessor :contentType
			attr_accessor :contentLength
			attr_accessor :expires

			attr_accessor :challenge
			attr_accessor :auth

			attr_accessor :pos
			attr_accessor :raw

			def initialize
				@headers = {}
				@via = []
				@contacts = []
				@routes = []
				@recordRoutes = []

				@version = "SIP/2.0"

				@statusCode = 0
				@contentLength = 0
				# @expires = 1800
			end

			def id
				mark = "0"
				mark = "1" if @isRequest
				return [mark, @callid, @method, @cseq.number].join("|")
			end

			def requestID
				return ["1", @callid, @method, @cseq.number].join("|")
			end

			def body
				return "" if @pos.nil?

				return @raw[@pos..-1]
			end

			def contextId
				via = @via.first

				via = @via[1] if @via.length >= 2 && @via.first.host.name == Proxy.proxyip

				#p [ "CONTEXT ID:", via.params["branch"], via.transport, via.host.name, via.host.port.to_s, @callid, @cseq.number ]
				#return [via.params.branch, via.protocol, via.host, via.port, msg.headers['call-id'], msg.headers.cseq.seq];
				return [via.params["branch"], via.transport, via.host.name, via.host.port.to_s, @callid, @cseq.number].join
			end

			def fixContact(address, port, proxyip, proxyport)
			   if @method == 'REGISTER'
				   return if @contacts.nil? || @contacts.empty?

			       if @contacts.first.address.uri.host.name.end_with? '.invalid'
			           contact = @contacts.shift

				        #    dname = contact.address.dname
				        #    scheme = contact.address.uri.scheme
				        #    user = contact.address.uri.user
				        #    server = proxyip
						#    server += ":" + proxyport unless proxyport.empty?
						   #
				        #    dname = dname.quote if dname.include? " "
						   #
						contact.address.params["transport"] = "tcp"
						contact.address.params["ws-src-ip"] = address
						contact.address.params["ws-src-port"] = port.to_s
						contact.address.params["ws-src-proto"] = "wss"

						contact.address.uri.host.name = proxyip
						contact.address.uri.host.port = proxyport

			           @contacts.unshift contact
			       end
			   end
			end

			def fixVia(address, port)
				if @method == 'REGISTER'
					return if @via.nil? || @via.empty?
					if @via.first.sentby.end_with? '.invalid'
						via = @via.shift

						via = Reticulum::Parser::ParseVia("SIP/2.0/TCP " + address + ":" + port.to_s + ";rport;branch=" + via.params["branch"] + ";ws-hacked=WSS")

						@via.unshift via
					end
				end
			end

			def to_s
				string = ""
				# begin
					if (request?)
						remote = @remoteURI;

						if (remote.nil?)
							remote = @uri.to_s
						end

						string += @method + " " + remote + " " + @version
					else
						#p [ "[RESP TO $]", @version , @statusCode.to_s , @reason]
						#p [ "Error stringify msg.", self ] if @statusCode.nil?

						@statusCode = 0 if @statusCode.nil?
						@reason = "Unknown reason" if @reason.nil?
						@version = "SIP/2.0" if @version.nil?

						string += @version + " " + @statusCode.to_s + " " + @reason
					end

					string += "\r\n"

					@via.each { |value|
						string += "Via: " + value.to_s + "\r\n"
					}

					string += "To: " + @to.to_s + "\r\n"
					string += "From: " + @from.to_s + "\r\n"
					string += "Call-ID: " + @callid + "\r\n"
					string += "CSeq: " + @cseq.to_s + "\r\n"

					@contacts.each { |value|
						string += "Contact: " + value.to_s + "\r\n"
					}

					@routes.each { |value|
						string += "Route: " + value.to_s + "\r\n"
					}

					@recordRoutes.each { |value|
						string += "Record-Route: " + value.to_s + "\r\n"
					}

					string += @challenge.to_s + "\r\n" unless @challenge.nil?
					string += @auth.to_s + "\r\n" unless @auth.nil?

					string += "Max-Forwards: " + @maxForwards.to_s + "\r\n"  unless @maxForwards.nil?
					string += "Content-Type: " + @contentType.to_s + "\r\n" unless @contentType.nil?
					string += "Content-Length: " + @contentLength.to_s + "\r\n" unless @contentLength.nil?
					string += "Expires: " + @expires.to_s + "\r\n" unless @expires.nil?

					@headers.each { |key, header|
						#p ["HEADERS", key, header]
						if header.kind_of? (Array)
							header.each { |h|
								# if h.name == "Via"
								# 	v = @via#h.value
								# 	v = v.first if v.kind_of? (Array)
								#
								# 	string += v.to_s + "\r\n"
								if h.kind_of? (Array)
									h.each { |item|
										string += item.to_s + "\r\n"
									}
								# elsif h.name == "Via"
								# 	v = @via#h.value
								# 	v = v.first if v.kind_of? (Array)
								#
								# 	string += v.to_s + "\r\n"
								else
									string += h.name + ": " + h.value + "\r\n"
								end
							}
						else
							string += header.name + ": " + header.value + "\r\n"
						end
					}

					string += "\r\n"

					string += body
				# rescue => e
		        #     p [ "Message to_s error.", e.message ]
				# 	# puts [ "======================================="]
				# 	# puts [ self ]
				# 	# puts [ "======================================="]
				# end

				return string
			end

			def pushVia(data)
				id = Parser::HEADER_ID["Via"]

				@headers[id] = [] unless headers[id].kind_of? (Array)
				#@via = [] unless via.kind_of? (Array)
				data.split(",").map { |x|
					h = SIP::Header.new
					h.name = "Via"
					h.id = id
					h.value = x

					#@headers[id].push(h)
					@via.push(Parser::ParseVia(x))
				}
			end

			def unshiftVia(data)
				id = Parser::HEADER_ID["Via"]

				@headers[id] = [] unless headers[id].kind_of? (Array)
				#@via = [] unless via.kind_of? (Array)
				data.split(",").map { |x|
					h = SIP::Header.new
					h.name = "Via"
					h.id = id
					h.value = x

					#@headers[id].unshift(h)
					@via.unshift(Parser::ParseVia(x))
				}
			end

			def shiftVia
				@via.shift
				#@headers[Parser::HEADER_ID["Via"]].shift
			end

			def unshiftRecordRoute(data)
				_addHeader("Record-Route", data)
			end

			def _addHeader(name, data)
				id = Parser::HEADER_ID[name]
				AddHeader(name, id, data)
			end

			def AddHeader(name, id, data)
				header = SIP::Header.new
				header.name = name
				header.id = id
				header.value = data

				# parse common headers
				case id
					when Parser::HEADERS.index('SIP_HDR_VIA')
						@via = [] if @via.nil?
						@via = [] unless @via.kind_of? (Array)

						# NOTE: encode commas and special characters in commented content
						data = data.split('"',-1).map.with_index { |x, i| (i%2 == 1) ? Base64.encode64(x) : x }.join('"')

						@via += data.split(",").map { |val|
							val = val.split('"',-1).map.with_index { |x, i| (i%2 == 1) ? Base64.decode64(x) : x }.join('"')

							Parser::ParseVia(val)
						}
					when Parser::HEADERS.index('SIP_HDR_CONTACT')
						@contacts = [] if @contacts.nil?
						@contacts = [] unless @contacts.kind_of? (Array)

						# NOTE: encode commas and special characters in commented content
						data = data.split('"',-1).map.with_index { |x, i| (i%2 == 1) ? Base64.encode64(x) : x }.join('"')

						@contacts += data.split(",").map { |val|
							val = val.split('"',-1).map.with_index { |x, i| (i%2 == 1) ? Base64.decode64(x) : x }.join('"')
							Parser::ParseContact(val)
						}
					when Parser::HEADERS.index('SIP_HDR_ROUTE')
						@routes = [] if @routes.nil?
						@routes = [] unless @routes.kind_of? (Array)

						@routes += data.split(",").map { |val|
							Parser::ParseAddress(val)
						}
					when  Parser::HEADERS.index('SIP_HDR_RECORD_ROUTE')
						@recordRoutes = [] if @recordRoutes.nil?
						@recordRoutes = [] unless @recordRoutes.kind_of? (Array)

						@recordRoutes += data.split(",").map { |val|
							Parser::ParseAddress(val)
						}
					when Parser::HEADERS.index('SIP_HDR_TO')
						@to = Parser::ParseAddress(header.value)

						if !@to.nil?
							#@to.tag = Parser::ParseParam(@to.params, "tag")
							#@to.tag = @to.params["tag"]
							@to.value = header.value
						end
					when Parser::HEADERS.index('SIP_HDR_FROM')
						@from = Parser::ParseAddress(header.value)

						if !@from.nil?
							#@from.tag = Parser::ParseParam(@from.params, "tag")
							#@from.tag = @from.params["tag"]
							@from.value = header.value
						end
					when Parser::HEADERS.index('SIP_HDR_CALL_ID')
						@callid = header.value
					when Parser::HEADERS.index('SIP_HDR_CSEQ')
						@cseq = Parser::ParseCSeq(header.value)

						@method = @cseq.method unless @isRequest
					when Parser::HEADERS.index('SIP_HDR_MAX_FORWARDS')
						@maxForwards = header.value
					when Parser::HEADERS.index('SIP_HDR_CONTENT_TYPE')
						@contentType = Parser::ParseContentType(header.value)
					when Parser::HEADERS.index('SIP_HDR_CONTENT_LENGTH')
						@contentLength = header.value
					when Parser::HEADERS.index('SIP_HDR_EXPIRES')
						@expires = header.value
					when Parser::HEADERS.index('SIP_HDR_WWW_AUTHENTICATE') || Parser::HEADERS.index('SIP_HDR_PROXY_AUTHENTICATE')
						@challenge = Parser::ParseAuthenticate(header.value)
						@challenge.proxy = (id == Parser::HEADERS.index('SIP_HDR_PROXY_AUTHENTICATE'))
					when Parser::HEADERS.index('SIP_HDR_AUTHORIZATION') || Parser::HEADERS.index('SIP_HDR_PROXY_AUTHORIZATION')
						@auth = Parser::ParseAuthorization(header.value)
						@auth.proxy = (id == Parser::HEADERS.index('SIP_HDR_PROXY_AUTHORIZATION'))
					else
						if Parser::IsCommaSeparatedHeader(id) #&& !@headers[id].nil?
							@headers[id] = [] unless @headers[id].kind_of? (Array)
							# NOTE: encode commas and special characters in commented content
							header.value = header.value.split('"',-1).map.with_index { |x, i| (i%2 == 1) ? Base64.encode64(x) : x }.join('"')
							@headers[id] += header.value.split(",").map { |val|
								val = val.split('"',-1).map.with_index { |x, i| (i%2 == 1) ? Base64.decode64(x) : x }.join('"')
								h = SIP::Header.new
								h.name = name
								h.id = id
								h.value = val

								h
							}
						else
							@headers[id] = header
						end
				end
			end
		end
	end

	module Parser
		HEADERS = [
			'SIP_HDR_ACCEPT',                        # 0,
			'SIP_HDR_ACCEPT_CONTACT',                # 1,
			'SIP_HDR_ACCEPT_ENCODING',               # 2,
			'SIP_HDR_ACCEPT_LANGUAGE',               # 3,
			'SIP_HDR_ACCEPT_RESOURCE_PRIORITY',      # 4,
			'SIP_HDR_ALERT_INFO',                    # 5,
			'SIP_HDR_ALLOW',                         # 6,
			'SIP_HDR_ALLOW_EVENTS',                  # 7,
			'SIP_HDR_ANSWER_MODE',                   # 8,
			'SIP_HDR_AUTHENTICATION_INFO',           # 9,
			'SIP_HDR_AUTHORIZATION',                 # 10,
			'SIP_HDR_CALL_ID',                       # 11,
			'SIP_HDR_CALL_INFO',                     # 12,
			'SIP_HDR_CONTACT',                       # 13,
			'SIP_HDR_CONTENT_DISPOSITION',           # 14,
			'SIP_HDR_CONTENT_ENCODING',              # 15,
			'SIP_HDR_CONTENT_LANGUAGE',              # 16,
			'SIP_HDR_CONTENT_LENGTH',                # 17,
			'SIP_HDR_CONTENT_TYPE',                  # 18,
			'SIP_HDR_CSEQ',                          # 19,
			'SIP_HDR_DATE',                          # 20,
			'SIP_HDR_ENCRYPTION',                    # 21,
			'SIP_HDR_ERROR_INFO',                    # 22,
			'SIP_HDR_EVENT',                         # 23,
			'SIP_HDR_EXPIRES',                       # 24,
			'SIP_HDR_FLOW_TIMER',                    # 25,
			'SIP_HDR_FROM',                          # 26,
			'SIP_HDR_HIDE',                          # 27,
			'SIP_HDR_HISTORY_INFO',                  # 28,
			'SIP_HDR_IDENTITY',                      # 29,
			'SIP_HDR_IDENTITY_INFO',                 # 30,
			'SIP_HDR_IN_REPLY_TO',                   # 31,
			'SIP_HDR_JOIN',                          # 32,
			'SIP_HDR_MAX_BREADTH',                   # 33,
			'SIP_HDR_MAX_FORWARDS',                  # 34,
			'SIP_HDR_MIME_VERSION',                  # 35,
			'SIP_HDR_MIN_EXPIRES',                   # 36,
			'SIP_HDR_MIN_SE',                        # 37,
			'SIP_HDR_ORGANIZATION',                  # 38,
			'SIP_HDR_P_ACCESS_NETWORK_INFO',         # 39,
			'SIP_HDR_P_ANSWER_STATE',                # 40,
			'SIP_HDR_P_ASSERTED_IDENTITY',           # 41,
			'SIP_HDR_P_ASSOCIATED_URI',              # 42,
			'SIP_HDR_P_CALLED_PARTY_ID',             # 43,
			'SIP_HDR_P_CHARGING_FUNCTION_ADDRESSES', # 44,
			'SIP_HDR_P_CHARGING_VECTOR',             # 45,
			'SIP_HDR_P_DCS_TRACE_PARTY_ID',          # 46,
			'SIP_HDR_P_DCS_OSPS',                    # 47,
			'SIP_HDR_P_DCS_BILLING_INFO',            # 48,
			'SIP_HDR_P_DCS_LAES',                    # 49,
			'SIP_HDR_P_DCS_REDIRECT',                # 50,
			'SIP_HDR_P_EARLY_MEDIA',                 # 51,
			'SIP_HDR_P_MEDIA_AUTHORIZATION',         # 52,
			'SIP_HDR_P_PREFERRED_IDENTITY',          # 53,
			'SIP_HDR_P_PROFILE_KEY',                 # 54,
			'SIP_HDR_P_REFUSED_URI_LIST',            # 55,
			'SIP_HDR_P_SERVED_USER',                 # 56,
			'SIP_HDR_P_USER_DATABASE',               # 57,
			'SIP_HDR_P_VISITED_NETWORK_ID',          # 58,
			'SIP_HDR_PATH',                          # 59,
			'SIP_HDR_PERMISSION_MISSING',            # 60,
			'SIP_HDR_PRIORITY',                      # 61,
			'SIP_HDR_PRIV_ANSWER_MODE',              # 62,
			'SIP_HDR_PRIVACY',                       # 63,
			'SIP_HDR_PROXY_AUTHENTICATE',            # 64,
			'SIP_HDR_PROXY_AUTHORIZATION',           # 65,
			'SIP_HDR_PROXY_REQUIRE',                 # 66,
			'SIP_HDR_RACK',                          # 67,
			'SIP_HDR_REASON',                        # 68,
			'SIP_HDR_RECORD_ROUTE',                  # 69,
			'SIP_HDR_REFER_SUB',                     # 70,
			'SIP_HDR_REFER_TO',                      # 71,
			'SIP_HDR_REFERRED_BY',                   # 72,
			'SIP_HDR_REJECT_CONTACT',                # 73,
			'SIP_HDR_REPLACES',                      # 74,
			'SIP_HDR_REPLY_TO',                      # 75,
			'SIP_HDR_REQUEST_DISPOSITION',           # 76,
			'SIP_HDR_REQUIRE',                       # 77,
			'SIP_HDR_RESOURCE_PRIORITY',             # 78,
			'SIP_HDR_RESPONSE_KEY',                  # 79,
			'SIP_HDR_RETRY_AFTER',                   # 80,
			'SIP_HDR_ROUTE',                         # 81,
			'SIP_HDR_RSEQ',                          # 82,
			'SIP_HDR_SECURITY_CLIENT',               # 83,
			'SIP_HDR_SECURITY_SERVER',               # 84,
			'SIP_HDR_SECURITY_VERIFY',               # 85,
			'SIP_HDR_SERVER',                        # 86,
			'SIP_HDR_SERVICE_ROUTE',                 # 87,
			'SIP_HDR_SESSION_EXPIRES',               # 88,
			'SIP_HDR_SIP_ETAG',                      # 89,
			'SIP_HDR_SIP_IF_MATCH',                  # 90,
			'SIP_HDR_SUBJECT',                       # 91,
			'SIP_HDR_SUBSCRIPTION_STATE',            # 92,
			'SIP_HDR_SUPPORTED',                     # 93,
			'SIP_HDR_TARGET_DIALOG',                 # 94,
			'SIP_HDR_TIMESTAMP',                     # 95,
			'SIP_HDR_TO',                            # 96,
			'SIP_HDR_TRIGGER_CONSENT',               # 97,
			'SIP_HDR_UNSUPPORTED',                   # 98,
			'SIP_HDR_USER_AGENT',                    # 99,
			'SIP_HDR_VIA',                           # 100,
			'SIP_HDR_WARNING',                       # 101,
			'SIP_HDR_WWW_AUTHENTICATE',              # 102,
		]

		SIP_HDR_NONE = -1

		COMMA_SEPARATED_HEADERS = [
			HEADERS.index('SIP_HDR_ACCEPT'),
			HEADERS.index('SIP_HDR_ACCEPT_CONTACT'),
			HEADERS.index('SIP_HDR_ACCEPT_ENCODING'),
			HEADERS.index('SIP_HDR_ACCEPT_LANGUAGE'),
			HEADERS.index('SIP_HDR_ACCEPT_RESOURCE_PRIORITY'),
			HEADERS.index('SIP_HDR_ALERT_INFO'),
			HEADERS.index('SIP_HDR_ALLOW'),
			HEADERS.index('SIP_HDR_ALLOW_EVENTS'),
			HEADERS.index('SIP_HDR_AUTHENTICATION_INFO'),
			HEADERS.index('SIP_HDR_CALL_INFO'),
			HEADERS.index('SIP_HDR_CONTACT'),
			HEADERS.index('SIP_HDR_CONTENT_ENCODING'),
			HEADERS.index('SIP_HDR_CONTENT_LANGUAGE'),
			HEADERS.index('SIP_HDR_ERROR_INFO'),
			HEADERS.index('SIP_HDR_HISTORY_INFO'),
			HEADERS.index('SIP_HDR_IN_REPLY_TO'),
			HEADERS.index('SIP_HDR_P_ASSERTED_IDENTITY'),
			HEADERS.index('SIP_HDR_P_ASSOCIATED_URI'),
			HEADERS.index('SIP_HDR_P_EARLY_MEDIA'),
			HEADERS.index('SIP_HDR_P_MEDIA_AUTHORIZATION'),
			HEADERS.index('SIP_HDR_P_PREFERRED_IDENTITY'),
			HEADERS.index('SIP_HDR_P_REFUSED_URI_LIST'),
			HEADERS.index('SIP_HDR_P_VISITED_NETWORK_ID'),
			HEADERS.index('SIP_HDR_PATH'),
			HEADERS.index('SIP_HDR_PERMISSION_MISSING'),
			HEADERS.index('SIP_HDR_PROXY_REQUIRE'),
			HEADERS.index('SIP_HDR_REASON'),
			HEADERS.index('SIP_HDR_RECORD_ROUTE'),
			HEADERS.index('SIP_HDR_REJECT_CONTACT'),
			HEADERS.index('SIP_HDR_REQUEST_DISPOSITION'),
			HEADERS.index('SIP_HDR_REQUIRE'),
			HEADERS.index('SIP_HDR_RESOURCE_PRIORITY'),
			HEADERS.index('SIP_HDR_ROUTE'),
			HEADERS.index('SIP_HDR_SECURITY_CLIENT'),
			HEADERS.index('SIP_HDR_SECURITY_SERVER'),
			HEADERS.index('SIP_HDR_SECURITY_VERIFY'),
			HEADERS.index('SIP_HDR_SERVICE_ROUTE'),
			HEADERS.index('SIP_HDR_SUPPORTED'),
			HEADERS.index('SIP_HDR_TRIGGER_CONSENT'),
			HEADERS.index('SIP_HDR_UNSUPPORTED'),
			HEADERS.index('SIP_HDR_VIA'),
			HEADERS.index('SIP_HDR_WARNING'),
		]

		HEADER_ID = {
			"Accept" => HEADERS.index('SIP_HDR_ACCEPT'),
			"Accept-Contact" => HEADERS.index('SIP_HDR_ACCEPT_CONTACT'),
			"Accept-Encoding" => HEADERS.index('SIP_HDR_ACCEPT_ENCODING'),
			"Accept-Language" => HEADERS.index('SIP_HDR_ACCEPT_LANGUAGE'),
			"Accept-Resource-Priority" => HEADERS.index('SIP_HDR_ACCEPT_RESOURCE_PRIORITY'),
			"Alert-Info" => HEADERS.index('SIP_HDR_ALERT_INFO'),
			"Allow" => HEADERS.index('SIP_HDR_ALLOW'),
			"Allow-Events" => HEADERS.index('SIP_HDR_ALLOW_EVENTS'),
			"Answer-Mode" => HEADERS.index('SIP_HDR_ANSWER_MODE'),
			"Authentication-Info" => HEADERS.index('SIP_HDR_AUTHENTICATION_INFO'),
			"Authorization" => HEADERS.index('SIP_HDR_AUTHORIZATION'),
			"Call-ID" => HEADERS.index('SIP_HDR_CALL_ID'),
			"Call-Info" => HEADERS.index('SIP_HDR_CALL_INFO'),
			"Contact" => HEADERS.index('SIP_HDR_CONTACT'),
			"Content-Disposition" => HEADERS.index('SIP_HDR_CONTENT_DISPOSITION'),
			"Content-Encoding" => HEADERS.index('SIP_HDR_CONTENT_ENCODING'),
			"Content-Language" => HEADERS.index('SIP_HDR_CONTENT_LANGUAGE'),
			"Content-Length" => HEADERS.index('SIP_HDR_CONTENT_LENGTH'),
			"Content-Type" => HEADERS.index('SIP_HDR_CONTENT_TYPE'),
			"CSeq" => HEADERS.index('SIP_HDR_CSEQ'),
			"Date" => HEADERS.index('SIP_HDR_DATE'),
			"Encryption" => HEADERS.index('SIP_HDR_ENCRYPTION'),
			"Error-Info" => HEADERS.index('SIP_HDR_ERROR_INFO'),
			"Event" => HEADERS.index('SIP_HDR_EVENT'),
			"Expires" => HEADERS.index('SIP_HDR_EXPIRES'),
			"Flow-Timer" => HEADERS.index('SIP_HDR_FLOW_TIMER'),
			"From" => HEADERS.index('SIP_HDR_FROM'),
			"Hide" => HEADERS.index('SIP_HDR_HIDE'),
			"History-Info" => HEADERS.index('SIP_HDR_HISTORY_INFO'),
			"Identity" => HEADERS.index('SIP_HDR_IDENTITY'),
			"Identity-Info" => HEADERS.index('SIP_HDR_IDENTITY_INFO'),
			"In-Reply-To" => HEADERS.index('SIP_HDR_IN_REPLY_TO'),
			"Join" => HEADERS.index('SIP_HDR_JOIN'),
			"Max-Breadth" => HEADERS.index('SIP_HDR_MAX_BREADTH'),
			"Max-Forwards" => HEADERS.index('SIP_HDR_MAX_FORWARDS'),
			"MIME-Version" => HEADERS.index('SIP_HDR_MIME_VERSION'),
			"Min-Expires" => HEADERS.index('SIP_HDR_MIN_EXPIRES'),
			"Min-SE" => HEADERS.index('SIP_HDR_MIN_SE'),
			"Organization" => HEADERS.index('SIP_HDR_ORGANIZATION'),
			"P-Access-Network-Info" => HEADERS.index('SIP_HDR_P_ACCESS_NETWORK_INFO'),
			"P-Answer-State" => HEADERS.index('SIP_HDR_P_ANSWER_STATE'),
			"P-Asserted-Identity" => HEADERS.index('SIP_HDR_P_ASSERTED_IDENTITY'),
			"P-Associated-URI" => HEADERS.index('SIP_HDR_P_ASSOCIATED_URI'),
			"P-Called-Party-ID" => HEADERS.index('SIP_HDR_P_CALLED_PARTY_ID'),
			"P-Charging-Function-Addresses" => HEADERS.index('SIP_HDR_P_CHARGING_FUNCTION_ADDRESSES'),
			"P-Charging-Vector" => HEADERS.index('SIP_HDR_P_CHARGING_VECTOR'),
			"P-DCS-Trace-Party-ID" => HEADERS.index('SIP_HDR_P_DCS_TRACE_PARTY_ID'),
			"P-DCS-OSPS" => HEADERS.index('SIP_HDR_P_DCS_OSPS'),
			"P-DCS-Billing-Info" => HEADERS.index('SIP_HDR_P_DCS_BILLING_INFO'),
			"P-DCS-LAES" => HEADERS.index('SIP_HDR_P_DCS_LAES'),
			"P-DCS-Redirect" => HEADERS.index('SIP_HDR_P_DCS_REDIRECT'),
			"P-Early-Media" => HEADERS.index('SIP_HDR_P_EARLY_MEDIA'),
			"P-Media-Authorization" => HEADERS.index('SIP_HDR_P_MEDIA_AUTHORIZATION'),
			"P-Preferred-Identity" => HEADERS.index('SIP_HDR_P_PREFERRED_IDENTITY'),
			"P-Profile-Key" => HEADERS.index('SIP_HDR_P_PROFILE_KEY'),
			"P-Refused-URI-List" => HEADERS.index('SIP_HDR_P_REFUSED_URI_LIST'),
			"P-Server-User" => HEADERS.index('SIP_HDR_P_SERVED_USER'),
			"P-User-Database" => HEADERS.index('SIP_HDR_P_USER_DATABASE'),
			"P-Visited-Network-ID" => HEADERS.index('SIP_HDR_P_VISITED_NETWORK_ID'),
			"Path" => HEADERS.index('SIP_HDR_PATH'),
			"Permission-Missing" => HEADERS.index('SIP_HDR_PERMISSION_MISSING'),
			"Priority" => HEADERS.index('SIP_HDR_PRIORITY'),
			"Priv-Answer-Mode" => HEADERS.index('SIP_HDR_PRIV_ANSWER_MODE'),
			"Privacy" => HEADERS.index('SIP_HDR_PRIVACY'),
			"Proxy-Authenticate" => HEADERS.index('SIP_HDR_PROXY_AUTHENTICATE'),
			"Proxy-Authorization" => HEADERS.index('SIP_HDR_PROXY_AUTHORIZATION'),
			"Proxy-Require" => HEADERS.index('SIP_HDR_PROXY_REQUIRE'),
			"Rack" => HEADERS.index('SIP_HDR_RACK'),
			"Reason" => HEADERS.index('SIP_HDR_REASON'),
			"Record-Route" => HEADERS.index('SIP_HDR_RECORD_ROUTE'),
			"Refer-Sub" => HEADERS.index('SIP_HDR_REFER_SUB'),
			"Refer-To" => HEADERS.index('SIP_HDR_REFER_TO'),
			"Refered-By" => HEADERS.index('SIP_HDR_REFERRED_BY'),
			"Reject-Contact" => HEADERS.index('SIP_HDR_REJECT_CONTACT'),
			"Replaces" => HEADERS.index('SIP_HDR_REPLACES'),
			"Reply-To" => HEADERS.index('SIP_HDR_REPLY_TO'),
			"Request-Disposition" => HEADERS.index('SIP_HDR_REQUEST_DISPOSITION'),
			"Require" => HEADERS.index('SIP_HDR_REQUIRE'),
			"Resource-Priority" => HEADERS.index('SIP_HDR_RESOURCE_PRIORITY'),
			"Response-Key" => HEADERS.index('SIP_HDR_RESPONSE_KEY'),
			"Retry-After" => HEADERS.index('SIP_HDR_RETRY_AFTER'),
			"Route" => HEADERS.index('SIP_HDR_ROUTE'),
			"RSeq" => HEADERS.index('SIP_HDR_RSEQ'),
			"Security-Client" => HEADERS.index('SIP_HDR_SECURITY_CLIENT'),
			"Security-Server" => HEADERS.index('SIP_HDR_SECURITY_SERVER'),
			"Security-Verify" => HEADERS.index('SIP_HDR_SECURITY_VERIFY'),
			"Server" => HEADERS.index('SIP_HDR_SERVER'),
			"Service-Route" => HEADERS.index('SIP_HDR_SERVICE_ROUTE'),
			"Session-Expires" => HEADERS.index('SIP_HDR_SESSION_EXPIRES'),
			"SIP-ETag" => HEADERS.index('SIP_HDR_SIP_ETAG'),
			"SIP-If-Match" => HEADERS.index('SIP_HDR_SIP_IF_MATCH'),
			"Subject" => HEADERS.index('SIP_HDR_SUBJECT'),
			"Subscription-State" => HEADERS.index('SIP_HDR_SUBSCRIPTION_STATE'),
			"Supported" => HEADERS.index('SIP_HDR_SUPPORTED'),
			"Target-Dialog" => HEADERS.index('SIP_HDR_TARGET_DIALOG'),
			"Timestamp" => HEADERS.index('SIP_HDR_TIMESTAMP'),
			"To" => HEADERS.index('SIP_HDR_TO'),
			"Trigger-Consent" => HEADERS.index('SIP_HDR_TRIGGER_CONSENT'),
			"Unsupported" => HEADERS.index('SIP_HDR_UNSUPPORTED'),
			"User-Agent" => HEADERS.index('SIP_HDR_USER_AGENT'),
			"Via" => HEADERS.index('SIP_HDR_VIA'),
			"Warning" => HEADERS.index('SIP_HDR_WARNING'),
			"WWW-Authenticate" => HEADERS.index('SIP_HDR_WWW_AUTHENTICATE'),
		}

		HEADER_NAME = [
			"Accept", # SIP_HDR_ACCEPT
			"Accept-Contact", # SIP_HDR_ACCEPT_CONTACT
			"Accept-Encoding", # SIP_HDR_ACCEPT_ENCODING
			"Accept-Language", # SIP_HDR_ACCEPT_LANGUAGE
			"Accept-Resource-Priority", # SIP_HDR_ACCEPT_RESOURCE_PRIORITY
			"Alert-Info", # SIP_HDR_ALERT_INFO
			"Allow", # SIP_HDR_ALLOW
			"Allow-Events", # SIP_HDR_ALLOW_EVENTS
			"Answer-Mode", # SIP_HDR_ANSWER_MODE
			"Authentication-Info", # SIP_HDR_AUTHENTICATION_INFO
			"Authorization", # SIP_HDR_AUTHORIZATION
			"Call-ID", # SIP_HDR_CALL_ID
			"Call-Info", # SIP_HDR_CALL_INFO
			"Contact", # SIP_HDR_CONTACT
			"Content-Disposition", # SIP_HDR_CONTENT_DISPOSITION
			"Content-Encoding", # SIP_HDR_CONTENT_ENCODING
			"Content-Language", # SIP_HDR_CONTENT_LANGUAGE
			"Content-Length", # SIP_HDR_CONTENT_LENGTH
			"Content-Type", # SIP_HDR_CONTENT_TYPE
			"CSeq", # SIP_HDR_CSEQ
			"Date", # SIP_HDR_DATE
			"Encryption", # SIP_HDR_ENCRYPTION
			"Error-Info", # SIP_HDR_ERROR_INFO
			"Event", # SIP_HDR_EVENT
			"Expires", # SIP_HDR_EXPIRES
			"Flow-Timer", # SIP_HDR_FLOW_TIMER
			"From", # SIP_HDR_FROM
			"Hide", # SIP_HDR_HIDE
			"History-Info", # SIP_HDR_HISTORY_INFO
			"Identity", # SIP_HDR_IDENTITY
			"Identity-Info", # SIP_HDR_IDENTITY_INFO
			"In-Reply-To", # SIP_HDR_IN_REPLY_TO
			"Join", # SIP_HDR_JOIN
			"Max-Breadth", # SIP_HDR_MAX_BREADTH
			"Max-Forwards", # SIP_HDR_MAX_FORWARDS
			"MIME-Version", # SIP_HDR_MIME_VERSION
			"Min-Expires", # SIP_HDR_MIN_EXPIRES
			"Min-SE", # SIP_HDR_MIN_SE
			"Organization", # SIP_HDR_ORGANIZATION
			"P-Access-Network-Info", # SIP_HDR_P_ACCESS_NETWORK_INFO
			"P-Answer-State", # SIP_HDR_P_ANSWER_STATE
			"P-Asserted-Identity", # SIP_HDR_P_ASSERTED_IDENTITY
			"P-Associated-URI", # SIP_HDR_P_ASSOCIATED_URI
			"P-Called-Party-ID", # SIP_HDR_P_CALLED_PARTY_ID
			"P-Charging-Function-Addresses", # SIP_HDR_P_CHARGING_FUNCTION_ADDRESSES
			"P-Charging-Vector", # SIP_HDR_P_CHARGING_VECTOR
			"P-DCS-Trace-Party-ID", # SIP_HDR_P_DCS_TRACE_PARTY_ID
			"P-DCS-OSPS", # SIP_HDR_P_DCS_OSPS
			"P-DCS-Billing-Info", # SIP_HDR_P_DCS_BILLING_INFO
			"P-DCS-LAES", # SIP_HDR_P_DCS_LAES
			"P-DCS-Redirect", # SIP_HDR_P_DCS_REDIRECT
			"P-Early-Media", # SIP_HDR_P_EARLY_MEDIA
			"P-Media-Authorization", # SIP_HDR_P_MEDIA_AUTHORIZATION
			"P-Preferred-Identity", # SIP_HDR_P_PREFERRED_IDENTITY
			"P-Profile-Key", # SIP_HDR_P_PROFILE_KEY
			"P-Refused-URI-List", # SIP_HDR_P_REFUSED_URI_LIST
			"P-Server-User", # SIP_HDR_P_SERVED_USER
			"P-User-Database", # SIP_HDR_P_USER_DATABASE
			"P-Visited-Network-ID", # SIP_HDR_P_VISITED_NETWORK_ID
			"Path", # SIP_HDR_PATH
			"Permission-Missing", # SIP_HDR_PERMISSION_MISSING
			"Priority", # SIP_HDR_PRIORITY
			"Priv-Answer-Mode", # SIP_HDR_PRIV_ANSWER_MODE
			"Privacy", # SIP_HDR_PRIVACY
			"Proxy-Authenticate", # SIP_HDR_PROXY_AUTHENTICATE
			"Proxy-Authorization", # SIP_HDR_PROXY_AUTHORIZATION
			"Proxy-Require", # SIP_HDR_PROXY_REQUIRE
			"Rack", # SIP_HDR_RACK
			"Reason", # SIP_HDR_REASON
			"Record-Route", # SIP_HDR_RECORD_ROUTE
			"Refer-Sub", # SIP_HDR_REFER_SUB
			"Refer-To", # SIP_HDR_REFER_TO
			"Refered-By", # SIP_HDR_REFERRED_BY
			"Reject-Contact", # SIP_HDR_REJECT_CONTACT
			"Replaces", # SIP_HDR_REPLACES
			"Reply-To", # SIP_HDR_REPLY_TO
			"Request-Disposition", # SIP_HDR_REQUEST_DISPOSITION
			"Require", # SIP_HDR_REQUIRE
			"Resource-Priority", # SIP_HDR_RESOURCE_PRIORITY
			"Response-Key", # SIP_HDR_RESPONSE_KEY
			"Retry-After", # SIP_HDR_RETRY_AFTER
			"Route", # SIP_HDR_ROUTE
			"RSeq", # SIP_HDR_RSEQ
			"Security-Client", # SIP_HDR_SECURITY_CLIENT
			"Security-Server", # SIP_HDR_SECURITY_SERVER
			"Security-Verify", # SIP_HDR_SECURITY_VERIFY
			"Server", # SIP_HDR_SERVER
			"Service-Route", # SIP_HDR_SERVICE_ROUTE
			"Session-Expires", # SIP_HDR_SESSION_EXPIRES
			"SIP-ETag", # SIP_HDR_SIP_ETAG
			"SIP-If-Match", # SIP_HDR_SIP_IF_MATCH
			"Subject", # SIP_HDR_SUBJECT
			"Subscription-State", # SIP_HDR_SUBSCRIPTION_STATE
			"Supported", # SIP_HDR_SUPPORTED
			"Target-Dialog", # SIP_HDR_TARGET_DIALOG
			"Timestamp", # SIP_HDR_TIMESTAMP
			"To", # SIP_HDR_TO
			"Trigger-Consent", # SIP_HDR_TRIGGER_CONSENT
			"Unsupported", # SIP_HDR_UNSUPPORTED
			"User-Agent", # SIP_HDR_USER_AGENT
			"Via", # SIP_HDR_VIA
			"Warning", # SIP_HDR_WARNING
			"WWW-Authenticate", # SIP_HDR_WWW_AUTHENTICATE
		]

		T1 = [
		"INVITE sip:bob:bobspassword@biloxi.com:10050;parameters?headers SIP/2.0",
		"Via: SIP/2.0/UDP pc33.atlanta.com;branch=z9hG4bKnashds8",
		"To: Bob <sip:bob@biloxi.com>",
		"From: Alice <sip:alice@atlanta.com>;tag=1928301774",
		"Call-ID: a84b4c76e66710",
		"CSeq: 314159 INVITE",
		"Max-Forwards: 70",
		"Contact: <sip:alice@pc33.atlanta.com>",
		"Content-Type: application/pkcs7-mime; smime-type=enveloped-data; name=smime.p7m",
		"Content-Disposition: attachment; filename=smime.p7m handling=required",
		"",
		"1234567890"
		].join("\r\n")

		T2 = [
		"REGISTER sip:registrar.biloxi.com SIP/2.0",
		"Via: SIP/2.0/UDP bobspc.biloxi.com:5060;branch=z9hG4bKnashds7",
		"Max-Forwards: 70",
		"To: Bob <sip:bob@biloxi.com>",
		"From: Bob <sip:bob@biloxi.com>;tag=456248",
		"Call-ID: 843817637684230@998sdasdh09",
		"CSeq: 1826 REGISTER",
		"Contact: <sip:bob@192.0.2.4>;expires=300",
		"Contact: <sip:bob@192.0.20.4>",
		"Contact: <sip:bob@192.0.3.5>;expires=1200,<sip:bob@192.0.3.6>",
		"Expires: 7200",
		"Content-Length: 0",
		"",
		"",
		].join("\r\n")

		T3 = [
		"SIP/2.0 200 OK",
		"Via: SIP/2.0/UDP bobspc.biloxi.com:5060;branch=z9hG4bKnashds7 ;received=192.0.2.4",
		"To: Bob <sip:bob@biloxi.com>;tag=2493k59kd",
		"From: Bob <sip:bob@biloxi.com>;tag=456248",
		"Call-ID: 843817637684230@998sdasdh09",
		"CSeq: 1826 REGISTER",
		"Contact: <sip:bob@192.0.2.4>",
		"Expires: 7200",
		"Content-Length: 0",
		"",
		"",
		].join("\r\n")

		T4 = [
		"SIP/2.0 200 OK",
		"Via: SIP/2.0/UDP pc33.atlanta.com;branch=z9hG4bKhjhs8ass877 ;received=192.0.2.4",
		"To: <sip:carol@chicago.com>;tag=93810874",
		"From: Alice <sip:alice@atlanta.com>;tag=1928301774",
		"Call-ID: a84b4c76e66710",
		"CSeq: 63104 OPTIONS",
		"Contact: <sip:carol@chicago.com>",
		"Contact: <mailto:carol@chicago.com>",
		"Allow: INVITE, ACK, CANCEL, OPTIONS, BYE",
		"Accept: application/sdp",
		"Accept-Encoding: gzip",
		"Accept-Language: en",
		"Supported: foo",
		"Content-Type: application/sdp",
		"Content-Length: 274",
		"",
		"",
		].join("\r\n")

		T5 = [
		"INVITE sip:bob@u2.biloxi.com SIP/2.0",
		"Record-Route: <sip:p2.biloxi.com;lr>",
		"Record-Route: <sip:p1.atlanta.com;lr>",
		"From: Alice <sip:alice@atlanta.com>;tag=1354385",
		"To: Bob <sip:bob@biloxi.com>",
		"Call-ID: xyz",
		"CSeq: 1 INVITE",
		"Contact: <sip:alice@u1.atlanta.com>",
		"",
		"",
		].join("\r\n")

		T6 = [
		"SIP/2.0 180 Ringing",
		"Record-Route: <sip:p2.biloxi.com;lr>",
		"Record-Route: <sip:p1.atlanta.com;lr>",
		"From: Alice <sip:alice@atlanta.com>;tag=1354385",
		"To: Bob <sip:bob@biloxi.com>",
		"Call-ID: xyz",
		"CSeq: 1 INVITE",
		"Contact: <sip:bob@u2.biloxy.com>",
		"",
		"",
		].join("\r\n")

		T7 = [
		"INVITE sip:bob@u2.biloxi.com SIP/2.0",
		"Via: SIP/2.0/UDP pc33.atlanta.com;branch=z9hG4bKhjhs8ass877 ;received=192.0.2.4",
		"Via: SIP/2.0/UDP bobspc.biloxi.com:5060;branch=z9hG4bKnashds7 ;received=192.0.2.4",
		"Record-Route: <sip:p2.biloxi.com;lr>",
		"Record-Route: <sip:p1.atlanta.com;lr>",
		"From: Alice <sip:alice@atlanta.com>;tag=1354385",
		"To: Bob <sip:bob@biloxi.com>",
		"Call-ID: xyz",
		"CSeq: 1 INVITE",
		"Contact: <sip:alice@u1.atlanta.com>",
		"",
		"",
		].join("\r\n")

		T8 = [
		"SIP/2.0 486 Busy Here",
		"Call-ID: 9ba49f9e75d055d071fb6566c9eaa6d3979f@localhost",
		"CSeq: 3 INVITE",
		"From: undefined <sip:sanjin@10.1.80.105>;tag=vnvrhjfih0",
		"To: undefined <sip:edo@10.1.80.105:7000>;tag=93vetd6a3r",
		"Via: SIP/2.0/WSS 10.1.80.105:7000;branch=z9hG4bKe23a1be8",
		"",
		"",
		].join("\r\n")

		T9 = [
		"SIP/2.0 486 Busy",
		"Call-ID: 9ba49f9e75d055d071fb6566c9eaa6d3979f@localhost",
		"CSeq: 3 INVITE",
		"From: undefined <sip:sanjin@10.1.80.105>;tag=vnvrhjfih0",
		"To: undefined <sip:edo@10.1.80.105:7000>;tag=93vetd6a3r",
		"Via: SIP/2.0/WSS 10.1.80.105:7000;branch=z9hG4bKe23a1be8",
		"",
		"",
		].join("\r\n")

		URI_FORMAT_TEST = "sip:user:password@host:port;uri-parameters?headers"

		def self.GetHeaderId(name)
			return SIP_HDR_NONE if name.length == 0

			id = HEADER_ID[name]

			return id if id

			# compact headers
			id = case name[0].downcase
				when 'a' then HEADERS.index 'SIP_HDR_ACCEPT_CONTACT'
				when 'b' then HEADERS.index 'SIP_HDR_REFERRED_BY'
				when 'c' then HEADERS.index 'SIP_HDR_CONTENT_TYPE'
				when 'd' then HEADERS.index 'SIP_HDR_REQUEST_DISPOSITION'
				when 'e' then HEADERS.index 'SIP_HDR_CONTENT_ENCODING'
				when 'f' then HEADERS.index 'SIP_HDR_FROM'
				when 'i' then HEADERS.index 'SIP_HDR_CALL_ID'
				when 'j' then HEADERS.index 'SIP_HDR_REJECT_CONTACT'
				when 'k' then HEADERS.index 'SIP_HDR_SUPPORTED'
				when 'l' then HEADERS.index 'SIP_HDR_CONTENT_LENGTH'
				when 'm' then HEADERS.index 'SIP_HDR_CONTACT'
				when 'n' then HEADERS.index 'SIP_HDR_IDENTITY_INFO'
				when 'o' then HEADERS.index 'SIP_HDR_EVENT'
				when 'r' then HEADERS.index 'SIP_HDR_REFER_TO'
				when 's' then HEADERS.index 'SIP_HDR_SUBJECT'
				when 't' then HEADERS.index 'SIP_HDR_TO'
				when 'u' then HEADERS.index 'SIP_HDR_ALLOW_EVENTS'
				when 'v' then HEADERS.index 'SIP_HDR_VIA'
				when 'x' then HEADERS.index 'SIP_HDR_SESSION_EXPIRES'
				when 'y' then HEADERS.index 'SIP_HDR_IDENTITY'
				else  SIP_HDR_NONE
			end

			return id
		end

		def self.IsCommaSeparatedHeader(id)
			return COMMA_SEPARATED_HEADERS.index(id) != nil
		end

		class Host
			attr_accessor :name
			attr_accessor :port
			attr_accessor :ipv6

			def to_s
				port = ""

				port = ":" + @port unless @port.nil? || @port.empty?

				return "[#{@name}]" + port if @ipv6

				return @name + port
			end
		end

		def self.ParseHost(data)
			host = Host.new

			# Try IPv6 first
			result = /\[([0-9a-f:]+)\][:]*([0-9]*)/.match(data)

			@ipv6 = true

			if result == nil
				# If it fails try IPv4
				result = /([^:]+)[:]*([0-9]*)/.match(data)

				return nil unless result

				@ipv6 = false
			end

			host.name = ""
			host.port = ""

			host.name = result[1] if result.length > 0
			host.port = result[2] if result.length > 1
# p ["HOST:", host]
			return host
		end

		class URI
			attr_accessor :scheme
			attr_accessor :user
			attr_accessor :password
			attr_accessor :host
			attr_accessor :params
			attr_accessor :params_string
			attr_accessor :headers
			attr_accessor :port

			def to_s
				params = ""
				params = ";" + (@params.to_a.map { |x|  x[1]=="" ? x[0] : "#{x[0]}=#{x[1]}"}).join(";") unless @params.empty?

				headers = ""

				headers += "?" + @headers unless @headers.empty?

				creds = ""
				creds += @user unless @user.empty?
				creds += ":" + @password unless @password.empty?
				creds += "@" unless creds.empty?

				return @scheme + ":" + creds + @host.to_s + params + headers
			end
		end

		def self.ParseURI(data)
			uri = URI.new

			result = /([^:]+):([^@:]*)[:]*([^@]*)@([^;? ]+)([^?]*)(\S*)/.match(data)

			hostPort = ""

			if !result.nil? && result.length > 4

				uri.scheme = result[1]
				uri.user = result[2]
				uri.password = result[3]
				hostPort = result[4]
				uri.params_string = result[5]
				uri.headers = result[6]
			else
				result = /([^:]+):([^;? ]+)([^?]*)(\S*)/.match(data)

				return nil unless result

				uri.scheme = result[1]
				uri.user = ""
				uri.password = ""
				hostPort = result[2]
				uri.params_string = result[3]
				uri.headers = result[4]
			end

			uri.params = ParseParams(uri.params_string)

			uri.host = ParseHost(hostPort)

			return nil unless uri.host

			if !uri.host.port.nil? && !uri.host.port.empty?
				uri.port = uri.host.port.to_i
			end
# p ["URI:", uri]
			return uri
		end

		class Address
			attr_accessor :auri
			attr_accessor :params
			attr_accessor :params_string
			attr_accessor :dname
			attr_accessor :uri
			#attr_accessor :tag
			attr_accessor :value

			def to_s
				params = ""
				params = ";" + (@params.to_a.map { |x|  x[1]=="" ? x[0] : "#{x[0]}=#{x[1]}"}).join(";") unless @params.empty?

                dname = @dname
                dname = @dname.quote if @dname.include? " "

                return dname + "<" + @uri.to_s + ">" + params

			end
		end

		def self.ParseAddress(data)
			address = Address.new

			#result = /([^ \t\r\n<]*)[ \t\r\n]*<([^>]+)>(\S*)/.match(data)
			result = /[ \t\r\n]*([^\t\r\n<]*)[ \t\r\n]*<([^>]+)>(\S*)/.match(data)

			if result.nil?
				result = /([^;]+)(\S*)/.match(data)

				return nil unless result

				address.dname = ""
				address.auri = result[1]
				address.params_string = result[2]
			else
				address.dname = result[1].strip.unquote.strip
				address.auri = result[2]
				address.params_string = result[3]
			end

			address.params = ParseParams(address.params_string)

			address.uri = ParseURI(address.auri)

			return nil unless address.uri
# p ["ADDRESS:", address]
			return address
		end

		class Contact
			attr_accessor :address

			# needed for Register expiry
			attr_accessor :expires
			# attr_accessor :params
			# attr_accessor :params_string

			def to_s
				return @address.to_s
			end
		end

		def self.ParseContact(data)
			contact = Contact.new

			contact.address = ParseAddress(data)

			contact.expires = contact.address.params["expires"]
			return contact
		end

		class CallSequence
			attr_accessor :method
			attr_accessor :number

			def to_s
				return @number.to_s + " " + @method
			end
		end

		def self.ParseCSeq(data)
			callSequence = CallSequence.new

			result = /([0-9]+)[ \t\r\n]+([^ \t\r\n]+)/.match(data)

			return nil unless result

			number = result[1]
			callSequence.method = result[2]

			return nil if (number.nil? || number.empty?)

			callSequence.number = number.to_i
			return callSequence
		end

		class ContentType
			attr_accessor :type
			attr_accessor :subtype
			attr_accessor :params
			attr_accessor :params_string

			def to_s
				params = ""
				params = ";" + (@params.to_a.map { |x|  x[1]=="" ? x[0] : "#{x[0]}=#{x[1]}"}).join(";") unless @params.empty?
				return @type + "/" + @subtype + params
			end
		end

		def self.ParseContentType(data)
			contentType = ContentType.new

			result = /([ \t\r\n]*)([^ \t\r\n;\/]+)[ \t\r\n]*\/[ \t\r\n]*([^ \t\r\n;]+)(\S*)/.match(data)

			return nil unless result

			contentType.type = result[2]
			contentType.subtype = result[3]
			contentType.params_string = result[4]

			contentType.params = ParseParams(contentType.params_string)

			return contentType
		end

		class Via
			attr_accessor :transport
			attr_accessor :sentby
			attr_accessor :params
			attr_accessor :params_string
			attr_accessor :value
			attr_accessor :host
			attr_accessor :branch
			attr_accessor :port

			def to_s
				params = ""
				params = ";" + (@params.to_a.map { |x|  x[1]=="" ? x[0] : "#{x[0]}=#{x[1]}"}).join(";") unless @params.empty?
				return 'SIP/2.0/' + @transport + ' ' + @host.to_s + params
			end
		end

		def self.ParseVia(data)
			via = Via.new

			result = /SIP[ \t\r\n]*\/[ \t\r\n]*2.0[ \t\r\n]*\/([ \t\r\n]*[A-Z]+)[ \t\r\n]*([^; \t\r\n]+)[ \t\r\n]*(\S*)/.match(data)
			return nil unless result

			via.transport = result[1]
			via.sentby = result[2]
			via.params_string = result[3]
			via.value = data

			via.host = ParseHost(via.sentby)

			return nil unless via.host

			if !via.host.port.nil? && !via.host.port.empty?
				via.port = via.host.port.to_i
			end

			via.params = ParseParams(via.params_string)
			#via.branch = ParseParam(via.params, "branch")
			via.branch = via.params["branch"]

			return nil unless via.branch

			return via
		end

		def self.ParseParams(data)
			data = data.strip
			temp = data.split(";").map {|x|
				y = x.split("=")
				y.push("") if y.length < 2
				y
			}

			temp.shift if data[0] == ";"

			params = temp.to_h

			return params
		end

		def self.ParseParam(data, name)
			result = /;[ \t\r\n]*#{name}[ \t\r\n]*=[ \t\r\n]*([^ \t\r\n;]+)/.match(data)

			return nil unless result

			return result[1]
		end

		class Challenge
			attr_accessor :type, :realm, :domain, :nonce, :opaque, :stale, :algorithm, :qop, :qop_options, :auth_param, :proxy

			def to_s
				string = @proxy ? 'Proxy-Authenticate' : 'WWW-Authenticate';
				string += ": "
				string += 'Digest '
				string += "realm=\"" + @realm + "\", "
				string += "qop=\"" + @qop + "\", "
				string += "algorithm=\"" + @algorithm + "\", "
				string += "nonce=\"" + @nonce + "\", "
				string += "opaque=\"" + @opaque + "\""

				return string
			end
		end

		def self.ParseAuthenticate(data)
			challenge = Challenge.new
			# Proxy-Authenticate: Digest realm="atlanta.example.com", qop="auth",
			# nonce="f84f1cec41e6cbe5aea9c8e88d359",
			# opaque="", stale=FALSE, algorithm=MD5
			pos = data.index(" ")
			challenge.type = data[0...pos]

			data[pos+1..-1].split(",").each {|x|
				els = x.strip.split("=")
				#puts  test[0], "->", test[1]
				val = els[1].unquote

				case els[0]
					when "realm"
						challenge.realm = val
					when "domain"
						challenge.domain = val
					when "nonce"
						challenge.nonce = val
					when "opaque"
						challenge.opaque = val
					when "stale"
						challenge.stale = val
					when "algorithm"
						challenge.algorithm = val
					when "qop"
						challenge.qop = val
					when "qop-options"
						challenge.qop_options = val
					when "auth-param"
						challenge.auth_param = val
				end
			}

			return challenge
		end

		class Auth
			attr_accessor :type, :realm, :nonce, :response, :username, :uri, :nc, :cnonce, :qop, :proxy, :opaque

			def to_s
				string = @proxy ? "Proxy-Authorization" : "Authorization"
				string += ": " + @type + " ";
		        string += "username=\"" + @username + "\", "
		        string += "realm=\"" + @realm + "\", "
		        string += "nonce=\"" + @nonce + "\", "
		        string += "uri=\"" + @uri + "\", "
		        string += "qop=\"" + @qop + "\", "
		        string += "nc=\"" + @nc + "\", "
		        string += "cnonce=\"" + @cnonce + "\", "
		        string += "response=\"" + @response + "\", "
		        string += "opaque=\"" + @opaque + "\", "
			end
		end

		def self.ParseAuthorization(data)
			auth = Auth.new
			# Authorization: Digest username="bob", realm="atlanta.example.com"
			# nonce="ea9c8e88df84f1cec4341ae6cbe5a359", opaque="",
			# uri="sips:ss2.biloxi.example.com",
			# response="dfe56131d1958046689d83306477ecc"

			pos = data.index(" ")
			auth.type = data[0...pos]

			data[pos+1..-1].split(",").each {|x|
				els = x.strip.split("=")

				val = els[1].unquote

				case els[0]
					when "realm"
						auth.realm = val
					when "nonce"
						auth.nonce = val
					when "response"
						auth.response = val
					when "username"
						auth.username = val
					when "uri"
						auth.uri = val
					when "nc"
						auth.nc = val
					when "cnonce"
						auth.cnonce = val
					when "qop"
						auth.qop = val
					when "opaque"
						auth.opaque = val
				end
			}

			return auth
		end

		def self.Parse(data)
			message = Reticulum::SIP::Message.new

			buffer = data

			result = /([^ \t\r\n]+) ([^ \t\r\n]+) ([^\r\n]*)[\r]*[\n]/.match(data)

			return nil unless result

			message.tag = Utils.genhex(10)
			message.raw = data
			message.isRequest = false

			return nil if result.length < 4

			message.isRequest = true if result[3] == "SIP/2.0"

			if message.request?
				message.method = result[1]
				message.remoteURI = result[2]
				message.version = result[3]

				message.uri = ParseURI(result[2])
				#message.uri = ParseAddress(result[2])

				return nil if message.uri.nil?
			else
				message.version = result[1]
				message.statusCode = result[2].to_i
				message.reason = result[3]

				return nil if message.statusCode.nil?
			end

			p = 0 #result[0].length; # position
			l = buffer.length # length

			l -= result[0].length
			p = result[0].length

			namepos = -1
			v = cv = -1
			namelen = ws = lf = 0
			comsep = false
			quote = false

			id = SIP_HDR_NONE

			#for (; l > 0; p++, l--)
			while l > 0
				if buffer[p] == " " || buffer[p] == "\t"
					lf = 0 # folding
					ws += 1
				elsif buffer[p] == "\r"
					ws += 1
				else
					if buffer[p] == "\n"
						ws += 1

						lf += 1

						p += 1
						l -= 1

						if lf == 1
							next
						end
					end

					#puts "[PARSE] lf: #{lf}, p: #{p}, buffer[p]: #{buffer[p]}, comsep: #{comsep}, quote: #{quote}, name: #{buffer[namepos, namelen]}, #{cv}, #{v}"
					if lf > 0 || (buffer[p] == "," && comsep && !quote)
						if namelen == 0
							#puts "return null, namelen: #{namelen}"
							return nil
						end

						#puts "#{namepos}, #{namelen}"
						#puts "add header: #{buffer[namepos, namelen]}, #{id}, #{buffer[cv != -1 ? cv : p, cv != -1 ? p - cv - ws : 0]}"
						message.AddHeader(buffer[namepos, namelen], id, buffer[cv != -1 ? cv : p, cv != -1 ? p - cv - ws : 0])

						if lf == 0 #!lf # comma separated
							cv = -1

							p += 1
							l -= 1
							next
						end

						if cv != v
							#puts "add header: #{buffer[namepos, namelen]}, #{id}"
							message.AddHeader(buffer[namepos, namelen], id, buffer[v != -1 ? v : p, v != -1 ? p - v - ws : 0])
						end

						if lf > 1 # eoh
							#puts "lf > 1: #{lf}"
							message.pos = p

							return message
						end

						comsep = false
						namepos = -1
						cv = v = -1
						#puts "lf = 0"
						lf = 0
					end

					if namepos == -1
						namepos = p
						namelen = 0
						ws = 0
					end

					if namelen == 0
						if buffer[p] != ":"
							ws = 0

							p += 1
							l -= 1
							next
						end

						namepos = 0 if namepos == -1

						namelen = [(p - namepos - ws), 0].max

						if namelen == 0
							return nil
						end

						id = GetHeaderId(buffer[namepos, namelen])
						comsep = IsCommaSeparatedHeader(id)

						p += 1
						l -= 1
						next
					end

					if cv == -1
						quote = false
						cv = p
					end

					if v == -1
						v = p
					end

					if buffer[p] == "\""
						quote = !quote
					end

					ws = 0
				end

				p += 1
				l -= 1
			end

			#puts "reached end"
			#puts "#{buffer[p,l]}, #{p}, #{l}"
			message.pos = p
			return message
		end
	end
end
