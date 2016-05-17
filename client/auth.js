var Digest = function() {};

Digest.createAuthorization = function (response, request, context) {
    if (response.challenge.type.toLowerCase() == "basic") {
        // TODO: notify user of a less secure Authorization type
    } else if (response.challenge.type.toLowerCase() == "digest") {
		var uri = request.uri.toString();//request.uri.raw;
		// console.log("[URI]", request.uri)

        // NOTE: create new cnonce and increment nc
        var cnonce = Utils.token(8, Utils.TOKEN_NUMERIC_16);
        var ncprefix = "";

		// NOTE: add cnonce to context
		context.cnonce = cnonce;
		//context.nc = nc;
		context.nc++;

        for (var i=0; i<8-(context.nc + "").length; i++) {
            ncprefix += "0";
        }

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
