Reticulum.SIP = {};

Reticulum.SIP.Header = function() {
	this.name = "";
	this.id = Reticulum.Parser.Enum.SIP_HDR_NONE;
	this.value = null;
};

Reticulum.SIP.Host = function() {
	this.name = "";
	this.port = "";

	this.isipv6 = false;
};

Reticulum.SIP.Host.prototype.toString = function () {
	var host = this.name;

	if (this.isipv6) host = "[" + host + "]";

	if (this.port !== "") host += ":" + this.port;

	return host;
};

Reticulum.SIP.URI = function() {
	this.raw = "";
	this.secure = false;
	this.scheme = "";
	this.user = "";
	this.password = "";
	this.hostPort = "";
	this._params_string = "";
	this.params = {};
	this.headers = "";

	this.host = null;
};

Reticulum.SIP.URI.prototype.toString = function () {
	var params = "";
	var headers = "";
	var creds = "";

	params = Reticulum.Parser.stringifyParams(this.params);

	//if (params !== "") params = ";" + params;

	if (this.headers !== "") headers = "?" + this.headers;

	if (this.user !== "") creds = this.user;
	if (this.password !== "") creds += ":" + this.password;
	if (creds !== "") creds += "@";

	return this.scheme + ":" + creds + this.host.toString() + params + headers;
};

Reticulum.SIP.Address = function() {
	this.value = "";
	this.dname = "";
	this.auri = "";
	this.params = {};
	this._params_string = "";

	this.uri = null;
};

Reticulum.SIP.Address.prototype.toString = function() {
	var params = "";
	params = Reticulum.Parser.stringifyParams(this.params);

	//if (params !== "") params = ";" + params;

    var dname = this.dname;
    if (this.dname.indexOf(" ") !== -1) dname = "\"" + this.dname + "\"";

	return dname + "<" + this.uri.toString() + ">" + params;
};

Reticulum.SIP.Contact = function() {
	this.expires = "";
	this.address = null;
};

Reticulum.SIP.Contact.prototype.toString = function() {
	return this.address.toString();
};

Reticulum.SIP.Via = function() {
	this.value = "";
	this.transport = "";
	this.sentby = "";
	this._params_string = "";
	this.params = {};
	this.branch = "";
	this.port = 0;

	this.host = null;
};

Reticulum.SIP.Via.prototype.toString = function() {
	var params = "";
	params = Reticulum.Parser.stringifyParams(this.params);

	// if (params !== "") params = ";" + params;

	return 'SIP/2.0/' + this.transport + ' ' + this.host.toString() + params;
};

Reticulum.SIP.CSeq = function() {
	this.method = "";
	this.number = 0;
};

Reticulum.SIP.CSeq.prototype.toString = function() {
	return this.number + " " + this.method;
};

Reticulum.SIP.ContentType = function() {
	this.type = "";
	this.subtype = "";
	this._params_string = "";
	this.params = {};
};

Reticulum.SIP.ContentType.prototype.toString = function() {
	var params = "";
	params = Reticulum.Parser.stringifyParams(this.params);

	// if (params !== "") params = ";" + params;

	return this.type + "/" + this.subtype + params;
};

Reticulum.SIP.Message = function() {
	this.headers = {};

	this.vias = []; // must not be null
	this.to = {};
	this.from = {};
	this.callid = null;
	this.cseq = null;
	this.maxForwards = 0;
	this.contentType = null;
	this.contentLength = null;
	this.expires = null;
	this.contacts = [];
	this.routes = [];
	this.record_routes = [];

	this.responses = [];

	this.pos = 0;

};

Reticulum.SIP.Message.prototype.is1xx = function() {
	if (!this.isRequest) return this.statusCode >= 100 && this.statusCode < 200;

	return false;
};

Reticulum.SIP.Message.prototype.is2xx = function() {
	if (!this.isRequest) return this.statusCode >= 200 && this.statusCode < 300;

	return false;
};

Reticulum.SIP.Message.prototype.isFinal = function() {
	if (!this.isRequest) return this.statusCode >= 200;

	return false;
};

Reticulum.SIP.Message.prototype.id = function() {
	return [this.callid, this.method, this.cseq.number].join("|");
};

Reticulum.SIP.Message.prototype.addHeader = function(name, id, data) {
	var header = new Reticulum.SIP.Header();
	header.name = name;
	header.id = id;
	header.value = data;

	// switch (id) {
	//
	// // case Reticulum.Parser.Enum.SIP_HDR_VIA:
	// // case Reticulum.Parser.Enum.SIP_HDR_ROUTE:
	// // 	this.headers[id] = header;
	// // 	break;
	//
	// default:
	// 	if (Reticulum.Parser.isCommaSeparatedHeader(id) && !this.headers[id]) {
	// 		this.headers[id] = header;
	// 		this.headers[id].value = [header.value];//this.headers[id].value = this.headers[id].value + "," + header.value;
	//
	// 		if(id === Reticulum.Parser.Enum.SIP_HDR_CONTACT) {
	// 			this.contacts = [Reticulum.Parser.parseAddress(header.value)];
	//
	// 			if (!this.contacts)
	// 				break;
	//
	// 			//this.contact.tag = Reticulum.Parser.parseParam(this.contact.params, "tag");
	// 			this.contacts[0].value = header.value;
	// 		}
	// 	} else if (Reticulum.Parser.isCommaSeparatedHeader(id) && this.headers[id]) {
	// 		//this.headers[id].value = this.headers[id].value + "," + header.value;
	// 		this.headers[id].value.push(header.value);
	//
	// 		if(this.contacts && id === Reticulum.Parser.Enum.SIP_HDR_CONTACT) {
	// 			this.contacts.push(Reticulum.Parser.parseAddress(header.value));
	//
	// 			//this.contact.tag = Reticulum.Parser.parseParam(this.contact.params, "tag");
	// 			this.contacts[this.contacts.length-1].value = header.value;
	// 		}
	// 	} else {
	// 		this.headers[id] = header;
	// 	}
	//
	// 	break;
	// }



	/* parse common headers */
	switch (id) {

	case Reticulum.Parser.Enum.SIP_HDR_VIA:
		// if (this.via.sentby && this.via.sentby !== "")
		// 	break;

		var hv = header.value.split(",");

		for (var iv = 0; iv < hv.length; iv++) {
			var via = Reticulum.Parser.parseVia(hv[iv]);
			// via.value = hv[iv];

			if (this.vias instanceof Array) {
				this.vias.push(via);
			} else {
				this.vias = [via];
			}
		}
		break;

	case Reticulum.Parser.Enum.SIP_HDR_CONTACT:
		var hc = header.value.split(",");

		for (var ic = 0; ic < hc.length; ic++) {
			var contact = Reticulum.Parser.parseContact(hc[ic]);
			// var contact = Reticulum.Parser.parseAddress(hc[ic]);
			// contact.tag = Reticulum.Parser.parseParam(contact.params, "tag");
			// contact.value = hc[ic];

			if (this.contacts instanceof Array) {
				this.contacts.push(contact);
			} else {
				this.contacts = [contact];
			}
		}
		break;

	case Reticulum.Parser.Enum.SIP_HDR_RECORD_ROUTE:
		var hrr = header.value.split(",");

		for (var irr = 0; irr < hrr.length; irr++) {
			var recordroute = Reticulum.Parser.parseAddress(hrr[irr]);

			if (this.record_routes instanceof Array) {
				this.record_routes.push(recordroute);
			} else {
				this.record_routes = [recordroute];
			}
		}
		break;

	case Reticulum.Parser.Enum.SIP_HDR_ROUTE:
		var hr = header.value.split(",");

		for (var ir = 0; ir < hr.length; ir++) {
			var route = Reticulum.Parser.parseAddress(hr[ir]);

			if (this.routes instanceof Array) {
				this.routes.push(route);
			} else {
				this.routes = [route];
			}
		}
		break;

	case Reticulum.Parser.Enum.SIP_HDR_TO:
		this.to = Reticulum.Parser.parseAddress(header.value);

		// if (!this.to)
		// 	break;
		//
		// this.to.tag = Reticulum.Parser.parseParam(this.to.params, "tag");
		// this.to.value = header.value;
		break;

	case Reticulum.Parser.Enum.SIP_HDR_FROM:
		this.from = Reticulum.Parser.parseAddress(header.value);

		// if (!this.from)
		// 	break;
		//
		// this.from.tag = Reticulum.Parser.parseParam(this.from.params, "tag");
		// this.from.value = header.value;
		break;

	case Reticulum.Parser.Enum.SIP_HDR_CALL_ID:
		this.callid = header.value;
		break;

	case Reticulum.Parser.Enum.SIP_HDR_CSEQ:
		this.cseq = Reticulum.Parser.parseCSeq(header.value);

		if (!this.isRequest) this.method = this.cseq.method;
		break;

	case Reticulum.Parser.Enum.SIP_HDR_MAX_FORWARDS:
		this.maxForwards = header.value;
		break;

	case Reticulum.Parser.Enum.SIP_HDR_CONTENT_TYPE:
		this.contentType = Reticulum.Parser.parseContentType(header.value);
		break;

	case Reticulum.Parser.Enum.SIP_HDR_CONTENT_LENGTH:
		this.contentLength = header.value;
		break;

	case Reticulum.Parser.Enum.SIP_HDR_EXPIRES:
		this.expires = header.value;
		break;

	case Reticulum.Parser.Enum.SIP_HDR_WWW_AUTHENTICATE:
	case Reticulum.Parser.Enum.SIP_HDR_PROXY_AUTHENTICATE:
		this.challenge = Reticulum.Parser.parseAuthenticate(header.value);
		this.challenge.proxy = (id === Reticulum.Parser.Enum.SIP_HDR_PROXY_AUTHENTICATE);

		this.headers[id] = header;
		break;

	case Reticulum.Parser.Enum.SIP_HDR_AUTHORIZATION:
	case Reticulum.Parser.Enum.SIP_HDR_PROXY_AUTHORIZATION:
		this.auth = Reticulum.Parser.parseAuthorization(header.value);
		this.auth.proxy = (id === Reticulum.Parser.Enum.SIP_HDR_PROXY_AUTHORIZATION);

		this.headers[id] = header;
		break;

	default:
		if (Reticulum.Parser.isCommaSeparatedHeader(id)) {
			var h = header.value.split(",");

			for (var i = 0; i < h.length; i++) {
				if (this.headers[id] instanceof Array) {
					this.headers[id].push({
						value: h[i],
						name: header.name,
						id: header.id,
					});
				} else {
					this.headers[id] = [{
						value: h[i],
						name: header.name,
						id: header.id,
					}];
				}
			}
		} else {
			this.headers[id] = header;
		}
		break;
	}
};

Reticulum.SIP.Message.prototype.copyVias = function (vias) {
	for (var i = 0; i < vias.length; i++) {
		this.addHeader("Via", Reticulum.Parser.Enum.SIP_HDR_VIA, vias[i].value);
		// var via = Reticulum.Parser.parseVia(vias[i].value);
		// via.value = vias[i].value;
		//
		// if (this.vias instanceof Array) {
		// 	this.vias.push(via);
		// } else {
		// 	this.vias = [via];
		// }
	}
};

Reticulum.SIP.Message.prototype.getBody = function() {
	if (this.body) return this.body;

	if (this.raw) return this.raw.substr(this.pos);

	return "";
};

Reticulum.SIP.Message.prototype.toString = function() {
	var string = "";

	if (this.isRequest) {
		var remote = this.remoteURI;

		// console.log("REMOTE URI", this.uri);

		if (!EXISTS(remote)) remote = this.uri.toString();

		if (!EXISTS(this.uri.scheme)) remote = "sips:" + remote;

		string += this.method + " " + remote + " " + this.version + "\r\n";
	} else {
		string += this.version + " " + this.statusCode + " " + this.reason + "\r\n";
	}

	var header = null;
	var keys = Object.keys(this.headers);

	//string += "Via: SIP/2.0/" + this.via.transport + " " + this.via.sentby + ";branch=" + this.via.branch;

	// Add special headers
	var via = {};

	for (i = 0; i < this.vias.length; i++) {
		via = this.vias[i];
// console.log(via.params, Reticulum.Parser.stringifyParams(via.params));
		// string += "Via: SIP/2.0/" + via.transport + " " + via.sentby + ";branch=" + via.branch + "\r\n";
		string += "Via: " + via.toString() + "\r\n";

	}

	string += "To: " + this.to.toString() + "\r\n";
	string += "From: " + this.from.toString() + "\r\n";
	string += "Call-ID: " + this.callid + "\r\n";
	string += "CSeq: " + this.cseq.toString() + "\r\n";



	var dname = "";
	var contact = {};
	for (i = 0; i < this.contacts.length; i++) {
		contact = this.contacts[i];
		// dname = contact.dname;
		// if (EXISTS(dname) && dname.indexOf(" ") !== -1) dname = "\"" + dname + "\"";
		//
		// string += "Contact: " + dname + " <" + contact.auri + ">";
		// if (EXISTS(contact.tag)) string += ";tag=" + contact.tag;
		// string += "\r\n";

		string += "Contact: " + contact.toString() + "\r\n";
	}

	var route = {};

	for (i = 0; i < this.routes.length; i++) {
		route = this.routes[i];
		string += "Route: " + route.toString() + "\r\n";
	}

	var record_route = {};

	for (i = 0; i < this.record_routes.length; i++) {
		record_route = this.record_routes[i];
		string += "Record-Route: " + record_route.toString() + "\r\n";
	}

console.log("TO_S", this.contentType, this.contentLength, this.content);

	if (EXISTS(this.maxForwards)) string += "Max-Forwards: " + this.maxForwards + "\r\n";
	if (EXISTS(this.contentType)) string += "Content-Type: " + this.contentType.toString() + "\r\n";
	if (EXISTS(this.contentLength)) string += "Content-Length: " + this.contentLength + "\r\n";
	if (EXISTS(this.expires)) string += "Expires: " + this.expires + "\r\n";

	var i = 0;
	for (i = 0; i < keys.length; i++) {
		header = this.headers[keys[i]];

		// if (header.name === "To") {
		// 	dname = this.to.dname;
		// 	if (EXISTS(dname) && dname.indexOf(" ") !== -1) dname = "\"" + dname + "\"";
		//
		// 	string += "To: " + dname + " <" + this.to.auri + ">";
		// 	if (EXISTS(this.to.tag)) string += ";tag=" + this.to.tag;
		// } else if (header.name === "From") {
		// 	dname = this.from.dname;
		// 	if (EXISTS(dname) && dname.indexOf(" ") !== -1) dname = "\"" + dname + "\"";
		//
		// 	string += "From: " + dname + " <" + this.from.auri + ">";
		// 	if (EXISTS(this.from.tag)) string += ";tag=" + this.from.tag;
		// } else if (header.name === "Via" || header.name == "Contact") {
		// 	// Skip regular vias and contacts
		// } else {
			string += header.name + ": " + header.value;
		// }

		string += "\r\n";
	}

	string += "\r\n";

	string += this.getBody();

	return string;
};



var sip = Reticulum.SIP;
