var Digest = function() {};



Digest.prototype.createAuthorization = function (challenge, username, password, uri=None, method=None, entityBody=None, context=None) {
    /*Build the Authorization header for this challenge. The challenge represents the
    WWW-Authenticate header's value and the function returns the Authorization
    header's value. The context (dict) is used to save cnonce and nonceCount
    if available. The uri represents the request URI str, and method the request
    method. The result contains the properties in alphabetical order of property name.

    >>> context = {'cnonce':'0a4f113b', 'nc': 0}
    >>> print createAuthorization('Digest realm="testrealm@host.com", qop="auth", nonce="dcd98b7102dd2f0e8b11d0f600bfb0c093", opaque="5ccc069c403ebaf9f0171e9517f40e41"', 'Mufasa', 'Circle Of Life', '/dir/index.html', 'GET', None, context)
    Digest cnonce="0a4f113b",nc=00000001,nonce="dcd98b7102dd2f0e8b11d0f600bfb0c093",opaque="5ccc069c403ebaf9f0171e9517f40e41",qop=auth,realm="testrealm@host.com",response="6629fae49393a05397450978507c4ef1",uri="/dir/index.html",username="Mufasa"
    >>> print createAuthorization('Basic realm="WallyWorld"', 'Aladdin', 'open sesame')
    Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==
    */
    //authMethod, sep, rest = challenge.strip().partition(' ')
    //ch, cr = dict(), dict() # challenge and credentials
    /*cr['password']   = password
    cr['username']   = username*/



    var type = "basic"; //"digest"

    // @implements RFC2617 P5L20-P5L41
    if (type.toLowerCase() == "basic") {
        return type + " " + Basic(username, password);
    // @implements RFC2617 P6L46-P7L5
    } else if (type.toLowerCase() == "digest") {
        for n,v in map(lambda x: x.strip().split('='), rest.split(',') if rest else []):
            ch[n.lower().strip()] = _unquote(v.strip())
        // TODO: doesn't work if embedded ',' in value, e.g., qop="auth,auth-int"
        // @implements RFC2617 P8L3-P8L25
        for y in filter(lambda x: x in ch, ['username', 'realm', 'nonce', 'opaque', 'algorithm']):
            cr[y] = ch[y]
        cr['uri']        = uri
        cr['httpMethod'] = method
        if 'qop' in ch:
            if context and 'cnonce' in context:
                cnonce, nc = context['cnonce'], context['nc'] + 1
            else:
                cnonce, nc = H(str(randint(0, 2**31))), 1
            if context:
                context['cnonce'], context['nc'] = cnonce, nc
            cr['qop'], cr['cnonce'], cr['nc'] = 'auth', cnonce, '%08x'% nc

        # @implements RFC2617 P11L11-P11L30
        cr['response'] = digest(cr)
        items = sorted(filter(lambda x: x not in ['name', 'authMethod', 'value', 'httpMethod', 'entityBody', 'password'], cr))
        return authMethod + ' ' + ','.join(map(lambda y: '%s=%s'%(y, (cr[y] if y == 'qop' or y == 'nc' else _quote(cr[y]))), items))
    } else {
        //raise ValueError, 'Invalid auth method -- ' + authMethod
    }
};
