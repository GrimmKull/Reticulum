var Digest = function() {};

//Digest.prototype.createAuthorization = function (challenge, username, password, uri, method, entityBody, context) {
Digest.createAuthorization = function (response, request, context) {
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

    // @implements RFC2617 P5L20-P5L41
    if (response.challenge.type.toLowerCase() == "basic") {
       //return response.challenge.type + " " + Basic(username, password);
    // @implements RFC2617 P6L46-P7L5
    } else if (response.challenge.type.toLowerCase() == "digest") {
        // @implements RFC2617 P8L3-P8L25
        /*for y in filter(lambda x: x in ch, ['username', 'realm', 'nonce', 'opaque', 'algorithm']):
            cr[y] = ch[y]
        cr['uri']        = uri
        cr['httpMethod'] = method*/

        /*if 'qop' in ch:
            if context and 'cnonce' in context:
                cnonce, nc = context['cnonce'], context['nc'] + 1
            else:
                cnonce, nc = H(str(randint(0, 2**31))), 1
            if context:
                context['cnonce'], context['nc'] = cnonce, nc
            cr['qop'], cr['cnonce'], cr['nc'] = 'auth', cnonce, '%08x'% nc*/

		var uri = request.uri.raw;
		// console.log("[URI]", request.uri)
        // NOTE: create new cnonce and increment nc
        var cnonce = Utils.token(8, Utils.TOKEN_NUMERIC_16);
        var ncprefix = "";
// console.log("create Auth", context);
		// NOTE: add cnonce to context
		context.cnonce = cnonce;
		//context.nc = nc;
		context.nc++;

        for (var i=0; i<8-(context.nc + "").length; i++) {
            ncprefix += "0";
        }

        // @implements RFC2617 P11L11-P11L30
        //cr['response'] = digest(cr)
        var ha1 = Utils.md5(context.user + ":" + context.realm + ":" + context.password );
        var ha2 = Utils.md5(request.method + ":" + uri);

        var resp = Utils.md5(ha1 + ":" + response.challenge.nonce + ":" + ncprefix + context.nc + ":" + context.cnonce + ":" + response.challenge.qop + ":" + ha2);

        var value = response.challenge.type + " ";
        value += "username=\"" + context.user + "\", ";
        value += "realm=\"" + context.realm + "\", ";
        value += "nonce=\"" + response.challenge.nonce + "\", ";
        value += "uri=\"" + uri + "\", ";
        value += "qop=\"" + response.challenge.qop + "\", ";
        value += "nc=\"" + ncprefix + context.nc + "\", ";
        value += "cnonce=\"" + context.cnonce + "\", ";
        value += "response=\"" + resp + "\", ";
        value += "opaque=\"" + response.challenge.opaque + "\", ";

        return value;
    } else {
        console.log('Error. Invalid auth method ' + response.challenge.type);
    }

    return null;
};
