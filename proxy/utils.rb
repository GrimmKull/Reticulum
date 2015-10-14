require "base64"
require "digest"
require "securerandom"

class String
    def unquote
        gsub(/\A['"]+|['"]+\Z/, "")
    end

    def quote
        %Q/"#{unquote}"/
    end
end

class Utils
    def self.genhex length
        return SecureRandom.hex(length)
    end

    def self.makeMD5 text
        md5 = Digest::MD5.new
        md5.update text

        return md5.to_s
    end

    def self.makeNonce
        now = Time.now.to_i.to_s

        nonce = Base64.encode64(now + " " + makeMD5(now + ":" + SecureRandom.hex(10)))

        return nonce
    end

    def self.challenge context, response
        proxy = (response.statusCode == 407)
		realm = "reticulum"
        nc = 0

		nonce = (context.nil? or context.nonce.nil?) ? Utils.genhex(8) : context.nonce
        qop = (context.nil? or context.qop.nil?) ? "auth" : context.qop
        algorithm = (context.nil? or context.algorithm.nil?) ? "md5" : context.algorithm
		opaque = (context.nil? or context.opaque.nil?) ? Utils.genhex(10) : context.opaque

        hname = proxy ? 'Proxy-Authenticate' : 'WWW-Authenticate';

        value = 'Digest ';
        value += "realm=\"" + realm + "\", "
        value += "qop=\"" + qop + "\", "
		value += "algorithm=\"" + algorithm + "\", "
		value += "nonce=\"" + nonce + "\", "
		value += "opaque=\"" + opaque + "\""


        response._addHeader(hname, value)

		unless context.nil?
			context.proxy = proxy
	        context.nonce = nonce
	        context.nc = nc
	        context.qop = qop
	        context.algorithm = algorithm
			context.opaque = opaque
			context.realm = realm
		end

		return response
    end

    def self.authenticateRequest user, request
		return false if request.auth.nil?

        context = user.session

        cnonce = request.auth.cnonce.unquote
        uri = request.auth.uri.unquote
        qop = request.auth.qop.unquote
		#rnc = request.auth.nc.unquote

        context.nc += 1

		snc = context.nc.to_s
		nc = "0"*(8-snc.length) + snc

        if context.algorithm == "md5-sess"
            context.ha1 = makeMD5(makeMD5(user.name + ":" + context.realm + ":" + user.password) + ":" + context.nonce + ":" + cnonce)
        else # algoritm directive's value is "md5"
            context.ha1 = makeMD5(user.name + ":" + context.realm + ":" + user.password)
        end

        if context.qop == "auth-int"
            context.ha2 = makeMD5(request.method + ":" + uri + ":" + makeMD5(request.body))
        else # qop directive's value is "auth"
            context.ha2 = makeMD5(request.method + ":" + uri)
        end

		if context.qop == "auth" or context.qop == "auth-int"
			digest = makeMD5(context.ha1 + ":" + context.nonce + ":" + nc + ":" + cnonce + ":" + context.qop + ":" + context.ha2)
		else
            digest = makeMD5(context.ha1 + ":" + context.nonce + ":" + context.ha2)
		end

        if digest == request.auth.response.unquote
            context.cnonce = cnonce
            context.uri = uri
            context.qop = qop

            return true
        end

        return false
    end
end
