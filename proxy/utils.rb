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

    #Digest.challenge({realm: @realm}, Sip.makeResponse(request, 401, 'Authentication Required'))
    def self.challenge context, response
        context.proxy = (response.status == 407)

        context.nonce = context.cnonce || rbytes()
        context.nc = 0
        context.qop = context.qop || 'auth'
        context.algorithm = context.algorithm || 'md5'


        var hname = context.proxy ? 'proxy-authenticate' : 'www-authenticate';
        (response.headers[hname] || (response.headers[hname]=[])).push({
            scheme: 'Digest',
            realm: q(context.realm),
            qop: q(context.qop),
            algorithm: q(context.algoritm),
            nonce: q(context.nonce),
            opaque: q(context.opaque)
        })

        return rs
    end

    #digest.authenticateRequest(userinfo.session, rq, {user: user, password: userinfo.password})
    def self.authenticateRequest context, request, username, password
        #var response = findDigestRealm(rq.headers[context.proxy ? 'proxy-authorization': 'authorization'], context.realm);

        #if(!response) return false;

        cnonce = response.cnonce.unquote
        uri = response.uri.unquote
        qop = response.qop.unquote

        context.nc += 1

        if context.algoritm == "md5-sess"
            context.ha1 = makeMD5(makeMD5(username + ":" + context.realm + ":" + password) + ":" + context.nonce + ":" + cnonce)
        else # algoritm directive's value is "md5"
            context.ha1 = makeMD5(username + ":" + context.realm + ":" + password)
        end

        if context.qop == "auth-int"
            context.ha2 = makeMD5(request.method + ":" + request.uri + ":" + makeMD5(entityBody))
        else # qop directive's value is "auth"
            context.ha2 = makeMD5(request.method + ":" + request.uri)
        end

        if context.qop == "auth" or context.qop == "auth-int"
            digest = makeMD5(context.ha1 + ":" + context.nonce + ":" + context.nc + ":" + context.cnonce + ":" + qop + ":" + context.ha2)
        else
            digest = makeMD5(context.ha1 + ":" + context.nonce + ":" + context.ha2)
        end

        #digest = calculateDigest({ha1:context.ha1, method:rq.method, nonce:context.nonce, nc:numberTo8Hex(context.nc), cnonce:cnonce, qop:qop, uri:uri, entity:rq.content});

        if digest == response.response.unquote
            context.cnonce = cnonce
            context.uri = uri
            context.qop = qop

            return true
        end

        return false
    end
end
