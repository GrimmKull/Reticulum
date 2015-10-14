Reticulum.SIP = {};

Reticulum.SIP.Header = function(){
	this.name = "";
	this.id = Reticulum.Parser.Enum.SIP_HDR_NONE;
	this.value = null;
};

Reticulum.SIP.formatHost = function(host) {
	var data = host.name;

	if (host.port !== null && host.port !== "")
		data += ":" + host.port;
	return data;
};

Reticulum.SIP.formatURI = function(host, isSecure) {
	var data = "sip";
	if (isSecure)
		data += "s";

	data += ":" + Reticulum.SIP.formatHost(host);
	return data;
};

Reticulum.SIP.formatAddress = function(value) {
	var address = Reticulum.Parser.parseAddress(/*address.auri*/value);

	return address;
};

Reticulum.SIP.formatVia = function(value) {
	//def createVia(self, secure=False):
    //    if not self.transport: raise ValueError, 'No transport in stack'
        //if secure and not self.transport.secure: raise ValueError, 'Cannot find a secure transport'
	var via = Reticulum.Parser.parseVia(value);
};

Reticulum.SIP.formatDigest = function(realm, method, uri, cnonce) {
	//static int mkdigest(uint8_t *digest, const struct realm *realm, const char *met, const char *uri, uint64_t cnonce)
//{
	//uint8_t ha1[MD5_SIZE], ha2[MD5_SIZE];
	//int err;

	//err = md5_printf(ha1, "%s:%s:%s", realm->user, realm->realm, realm->pass);
	var ha1 = Utils.md5(realm.user + ":" + realm.realm + ":" + realm.pass);
	/*if (err)
		return err;*/

	//err = md5_printf(ha2, "%s:%s", met, uri);
	var ha2 = Utils.md5(method + ":" + uri);
	/*if (err)
		return err;

	if (realm->qop)
		return md5_printf(digest, "%w:%s:%08x:%016llx:auth:%w", ha1, sizeof(ha1), realm->nonce, realm->nc, cnonce, ha2, sizeof(ha2));
	else
		return md5_printf(digest, "%w:%s:%w", ha1, sizeof(ha1), realm->nonce, ha2, sizeof(ha2));*/

	if (realm.qop)
		return Utils.md5(ha1 + ":" + realm.nonce + ":" + realm.nc + ":" + cnonce + ":auth:" + ha2);
	else
		return Utils.md5(ha1 + ":" + realm.nonce + ":" + ha2);
};

Reticulum.SIP.formatAuth = function(auth, method, uri) {
//int sip_auth_encode(struct mbuf *mb, struct sip_auth *auth, const char *met, const char *uri)
//{
	/*struct le *le;
	int err = 0;

	if (!mb || !auth || !met || !uri)
		return EINVAL;*/

	//for (le = auth->realml.head; le; le = le->next) {

		//const uint64_t cnonce = rand_u64();
		var cnonce = Utils.token(32, TOKEN_NUMERIC_10);
		//struct realm *realm = le->data;
		var realm = auth.realm;
		//uint8_t digest[MD5_SIZE];

		//err = mkdigest(digest, realm, met, uri, cnonce);
		var digest = this.formatDigest(realm, method, uri, cnonce);
		/*if (err)
			break;*/

		if (digest === null)
			return "";

		/*switch (realm->hdr) {

		case SIP_HDR_WWW_AUTHENTICATE:
			err = mbuf_write_str(mb, "Authorization: ");
			break;

		case SIP_HDR_PROXY_AUTHENTICATE:
			err = mbuf_write_str(mb, "Proxy-Authorization: ");
			break;

		default:
			continue;
		}*/

		var raw = "";
		if (realm.isProxyAuth)
			raw += "Proxy-";

		raw += "Authorization: ";

		//err |= mbuf_printf(mb, "Digest username=\"%s\"", realm->user);
		//err |= mbuf_printf(mb, ", realm=\"%s\"", realm->realm);
		//err |= mbuf_printf(mb, ", nonce=\"%s\"", realm->nonce);
		//err |= mbuf_printf(mb, ", uri=\"%s\"", uri);
		//err |= mbuf_printf(mb, ", response=\"%w\"", digest, sizeof(digest));

		raw += "Digest username=\"" + realm.user + "\"";
		raw += ", realm=\"" + realm.realm + "\"";
		raw += ", nonce=\"" + realm.nonce + "\"";
		raw += ", uri=\"" + uri + "\"";
		raw += ", response=\"" + digest + "\"";

		/*if (realm->opaque)
			err |= mbuf_printf(mb, ", opaque=\"%s\"", realm->opaque);*/

		if (realm.opaque)
			raw += ", opaque=\"" + realm.opaque + "\"";

		/*if (realm->qop) {
			err |= mbuf_printf(mb, ", cnonce=\"%016llx\"", cnonce);
			err |= mbuf_write_str(mb, ", qop=auth");
			err |= mbuf_printf(mb, ", nc=%08x", realm->nc);
		}*/
		/*if (realm.qop)
		{
			raw += ", cnonce=\"" + cnonce + "\"";
			raw += ", qop=auth";
			raw += ", nc=\"" + realm.cnonce + "\"";
		}
		realm.nc++;
		*/

		//++realm->nc;

		//err |= mbuf_write_str(mb, "\r\n");
		/*if (err)
			break;*/
		raw += "\r\n";
	//}

//	return err;
//}
	return raw;
};

Reticulum.SIP.Message = function() {
	this.headers = {};

	this.via = {}; // must not be null
	this.to = {};
	this.from = {};
	this.callid = null;
	this.cseq = null;
	this.maxForwards = 0;
	this.contentType = null;
	this.contentLength = null;
	this.expires = null;
	this.contacts = [];

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

Reticulum.SIP.Message.prototype.addHeader = function(name, id, data) {
	var header = new Reticulum.SIP.Header();
	header.name = name;
	header.id = id;
	header.value = data;

	switch (id) {

	case Reticulum.Parser.Enum.SIP_HDR_VIA:
	case Reticulum.Parser.Enum.SIP_HDR_ROUTE:
		//hash_append(msg->hdrht, id, &hdr->he, mem_ref(hdr));
		//list_append(&msg->hdrl, &hdr->le, mem_ref(hdr));

		this.headers[id] = header;
		break;

	default:
		/*if (atomic)
			hash_append(msg->hdrht, id, &hdr->he, mem_ref(hdr));
		if (line)
			list_append(&msg->hdrl, &hdr->le, mem_ref(hdr));*/
		//console.log(Reticulum.Parser.isCommaSeparatedHeader(id) , this.headers[id])
		if (Reticulum.Parser.isCommaSeparatedHeader(id) && !this.headers[id]) {
			this.headers[id] = header;
			this.headers[id].value = [header.value];//this.headers[id].value = this.headers[id].value + "," + header.value;
			//console.log("[contact]",Reticulum.Parser.parseAddress(header.value), id, Reticulum.Parser.Enum.SIP_HDR_CONTACT, header.value);
			if(id === Reticulum.Parser.Enum.SIP_HDR_CONTACT) {
				this.contacts = [Reticulum.Parser.parseAddress(header.value)];

				if (!this.contacts)
					break;

				//this.contact.tag = Reticulum.Parser.parseParam(this.contact.params, "tag");
				this.contacts[0].value = header.value;
			}
		} else if (Reticulum.Parser.isCommaSeparatedHeader(id) && this.headers[id]) {
			//this.headers[id].value = this.headers[id].value + "," + header.value;
			this.headers[id].value.push(header.value);

			if(this.contacts && id === Reticulum.Parser.Enum.SIP_HDR_CONTACT) {
				this.contacts.push(Reticulum.Parser.parseAddress(header.value));

				//this.contact.tag = Reticulum.Parser.parseParam(this.contact.params, "tag");
				this.contacts[this.contacts.length-1].value = header.value;
			}
		} else {
			this.headers[id] = header;
		}

		break;
	}

	/* parse common headers */
	switch (id) {

	case Reticulum.Parser.Enum.SIP_HDR_VIA:
		//if (!atomic || pl_isset(&msg->via.sentby))
		if (this.via.sentby && this.via.sentby !== "")
			break;

		//err = sip_via_decode(&msg->via, &hdr->val);
		this.via = Reticulum.Parser.parseVia(header.value);
		break;

	case Reticulum.Parser.Enum.SIP_HDR_TO:
		/*err = sip_addr_decode((struct sip_addr *)&msg->to, &hdr->val);
		if (err)
			break;*/
		this.to = Reticulum.Parser.parseAddress(header.value);

		if (!this.to)
			break;

		/*(void)msg_param_decode(&msg->to.params, "tag", &msg->to.tag);
		msg->to.val = hdr->val;*/
		this.to.tag = Reticulum.Parser.parseParam(this.to.params, "tag");
		this.to.value = header.value;
		break;

	case Reticulum.Parser.Enum.SIP_HDR_FROM:
		/*err = sip_addr_decode((struct sip_addr *)&msg->from, &hdr->val);
		if (err)
			break;*/
		this.from = Reticulum.Parser.parseAddress(header.value);

		if (!this.from)
			break;

		/*(void)msg_param_decode(&msg->from.params, "tag", &msg->from.tag);
		msg->from.val = hdr->val;*/
		this.from.tag = Reticulum.Parser.parseParam(this.from.params, "tag");
		this.from.value = header.value;
		break;

	case Reticulum.Parser.Enum.SIP_HDR_CALL_ID:
		//msg->callid = hdr->val;
		this.callid = header.value;
		break;

	case Reticulum.Parser.Enum.SIP_HDR_CSEQ:
		//err = sip_cseq_decode(&msg->cseq, &hdr->val);
		this.cseq = Reticulum.Parser.parseCSeq(header.value);

		if (!this.isRequest) this.method = this.cseq.method;
		break;

	case Reticulum.Parser.Enum.SIP_HDR_MAX_FORWARDS:
		//msg->maxfwd = hdr->val;
		this.maxForwards = header.value;
		break;

	case Reticulum.Parser.Enum.SIP_HDR_CONTENT_TYPE:
		//err = msg_ctype_decode(&msg->ctyp, &hdr->val);
		this.contentType = Reticulum.Parser.parseContentType(header.value);
		break;

	case Reticulum.Parser.Enum.SIP_HDR_CONTENT_LENGTH:
		//msg->clen = hdr->val;
		this.contentLength = header.value;
		break;

	case Reticulum.Parser.Enum.SIP_HDR_EXPIRES:
		//msg->expires = hdr->val;
		this.expires = header.value;
		break;
	case Reticulum.Parser.Enum.SIP_HDR_WWW_AUTHENTICATE:
	case Reticulum.Parser.Enum.SIP_HDR_PROXY_AUTHENTICATE:
		this.challenge = Reticulum.Parser.parseAuthenticate(header.value);
		this.challenge.proxy = (id === Reticulum.Parser.Enum.SIP_HDR_PROXY_AUTHENTICATE);
		break;
	case Reticulum.Parser.Enum.SIP_HDR_AUTHORIZATION:
	case Reticulum.Parser.Enum.SIP_HDR_PROXY_AUTHORIZATION:
		this.auth = Reticulum.Parser.parseAuthorization(header.value);
		this.auth.proxy = (id === Reticulum.Parser.Enum.SIP_HDR_PROXY_AUTHORIZATION);
		break;

	default:
		break;
	}
};

Reticulum.SIP.Message.prototype.getBody = function() {
	if (this.body) return this.body;

	if (this.raw) return this.raw.substr(this.pos);

	return "";
};

Reticulum.SIP.Message.prototype.toString = function() {
	var string = "";

	//console.log(this);

	if (this.isRequest) {
		var remote = this.remoteURI;

		//console.log("TOSTR", remote, EXISTS(remote) , this.uri)

		if (!EXISTS(remote)) remote = this.uri.raw;
		string += this.method + " " + remote + " " + this.version + "\r\n";
	} else {
		string += this.version + " " + this.statusCode + " " + this.reason + "\r\n";
	}

	var header = null;
	var keys = Object.keys(this.headers);
	for (var i = 0; i < keys.length; i++) {
		header = this.headers[keys[i]];

		if (header.name === "To") {
			string += "To: " + this.to.dname + " <" + this.to.auri + ">";
			if (EXISTS(this.to.tag)) string += ";tag=" + this.to.tag;
		} else if (header.name === "From") {
			string += "From: " + this.from.dname + " <" + this.from.auri + ">";
			if (EXISTS(this.from.tag)) string += ";tag=" + this.from.tag;
		} else if (header.name === "Via") {
			string += "Via: SIP/2.0/" + this.via.transport + " " + this.via.sentby + ";branch=" + this.via.branch;
		} else {
			string += header.name + ": " + header.value;
		}

		string += "\r\n";
	}

	string += "\r\n";

	string += this.getBody();

	return string;
};

//int sip_dialog_accept(struct sip_dialog **dlgp, const struct sip_msg *msg)
Reticulum.SIP.Message.prototype.acceptDialog = function() {
//{
	/*const struct sip_hdr *contact;
	struct sip_dialog *dlg;
	struct route_enc renc;
	struct sip_addr addr;
	struct pl pl;
	int err;

	if (!dlgp || !msg || !msg->req)
		return EINVAL;*/

	//contact = sip_msg_hdr(msg, SIP_HDR_CONTACT);


	var contact = this.headers[Reticulum.Parser.Enum.SIP_HDR_CONTACT];

	/*if (!contact || !msg->callid.p)
		return EBADMSG;*/

	/*if (sip_addr_decode(&addr, &contact->val))
		return EBADMSG;*/

	var address = Reticulum.Parser.parseAddress(contact.value);

	/*dlg = mem_zalloc(sizeof(*dlg), destructor);
	if (!dlg)
		return ENOMEM;*/

	/*dlg->lseq = rand_u16();
	dlg->rseq = msg->cseq.num;*/

	/*err = pl_strdup(&dlg->uri, &addr.auri);
	if (err)
		goto out;*/

	/*err = pl_strdup(&dlg->callid, &msg->callid);
	if (err)
		goto out;*/

	/*err = x64_strdup(&dlg->ltag, msg->tag);
	if (err)
		goto out;*/

	/*err = pl_strdup(&dlg->rtag, &msg->from.tag);
	if (err)
		goto out;*/

//Reticulum.SIP.Dialog = function(uri, toURI, fromURI, fromName, routev)
	var dialog = new Reticulum.SIP.Dialog(address.auri, this.to.auri, this.from.auri, this.from.dname, []);

	dialog.remoteSequence = this.cseq.number;
	dialog.callid = this.callid;
	//dialog.localTag = this.tag;
	dialog.remoteTag = this.from.tag;

	/*dlg->mb = mbuf_alloc(512);
	if (!dlg->mb) {
		err = ENOMEM;
		goto out;
	}*/
	//dialog.raw  = "";

	/*renc.mb  = dlg->mb;
	renc.end = 0;*/

	/*err |= sip_msg_hdr_apply(msg, true, SIP_HDR_RECORD_ROUTE, record_route_handler, &renc) ? ENOMEM : 0;
	err |= mbuf_printf(dlg->mb, "To: %r\r\n", &msg->from.val);
	err |= mbuf_printf(dlg->mb, "From: %r;tag=%016llx\r\n", &msg->to.val, msg->tag);
	if (err)
		goto out;*/

	// TODO: check Record Route setting for dialog
	var recordRoute = this.headers[Reticulum.Parser.Enum.SIP_HDR_RECORD_ROUTE];

	var raw = "Record-Route: " + recordRoute.value + "\r\n";

	dialog.raw = raw + dialog.raw;

	//dlg->mb->pos = 0;

	/*if (renc.end) {
		pl.p = (const char *)mbuf_buf(dlg->mb) + ROUTE_OFFSET;
		pl.l = renc.end - ROUTE_OFFSET;
		err = sip_addr_decode(&addr, &pl);
		dlg->route = addr.uri;
	}
	else {
		pl_set_str(&pl, dlg->uri);
		err = uri_decode(&dlg->route, &pl);
	}*/

	if (recordRoute)
	{
		dialog.route = Reticulum.Parser.parseAddress(recordRoute.value).uri;
	}
	else
	{
		dialog.route = this.uri;
	}

 /*out:
	if (err)
		mem_deref(dlg);
	else
		*dlgp = dlg;

	return err;*/

	return dialog;
};

Reticulum.SIP.Message.prototype.createDialog = function() {
//int sip_dialog_create(struct sip_dialog *dlg, const struct sip_msg *msg)
//{
	/*char *uri = NULL, *rtag = NULL;
	const struct sip_hdr *contact;
	struct route_enc renc;
	struct sip_addr addr;
	struct pl pl;
	int err;

	if (!dlg || dlg->rtag || !dlg->cpos || !msg)
		return EINVAL;*/

	/*contact = sip_msg_hdr(msg, SIP_HDR_CONTACT);

	if (!contact)
		return EBADMSG;*/
	var contact = this.headers[Reticulum.Parser.Enum.SIP_HDR_CONTACT];

	/*if (sip_addr_decode(&addr, &contact->val))
		return EBADMSG;*/

	var address = Reticulum.Parser.parseAddress(contact.value);

	var dialog = new Reticulum.SIP.Dialog(address.auri, this.to.auri, this.from.auri, this.from.dname, []);

	/*renc.mb = mbuf_alloc(512);
	if (!renc.mb)
		return ENOMEM;*/

	/*err = pl_strdup(&uri, &addr.auri);
	if (err)
		goto out;*/

	var uri = address.auri;

	/*err = pl_strdup(&rtag, msg->req ? &msg->from.tag : &msg->to.tag);
	if (err)
		goto out;*/

	var remoteTag = this.to.tag;

	if (!this.isRequest)
		remoteTag = this.from.tag;


	//renc.end = 0;

	/*err |= sip_msg_hdr_apply(msg, msg->req, SIP_HDR_RECORD_ROUTE, record_route_handler, &renc) ? ENOMEM : 0;
	err |= mbuf_printf(renc.mb, "To: %r\r\n", msg->req ? &msg->from.val : &msg->to.val);*/

	// TODO: check Record Route setting for dialog
	var recordRoute = this.headers[Reticulum.Parser.Enum.SIP_HDR_RECORD_ROUTE];

	var strRecordRoute = "";

	if (!this.isRequest)
		strRecordRoute = recordRoute.value.split(",").reverse().join(",");
	else
		strRecordRoute = recordRoute.value;

	var raw = "Record-Route: " + strRecordRoute + "\r\n";

	dialog.raw = raw;

	dialog.raw += "To: ";

	if (this.isRequest)
		dialog.raw += this.from.value;
	else
		dialog.raw += this.to.value;

	/*dlg->mb->pos = dlg->cpos;
	err |= mbuf_write_mem(renc.mb, mbuf_buf(dlg->mb), mbuf_get_left(dlg->mb));
	dlg->mb->pos = 0;

	if (err)
		goto out;*/

	//renc.mb->pos = 0;

	/*if (renc.end) {
		pl.p = (const char *)mbuf_buf(renc.mb) + ROUTE_OFFSET;
		pl.l = renc.end - ROUTE_OFFSET;
		err = sip_addr_decode(&addr, &pl);
		if (err)
			goto out;

		dlg->route = addr.uri;
	}
	else {
		struct uri tmp;

		pl_set_str(&pl, uri);
		err = uri_decode(&tmp, &pl);
		if (err)
			goto out;

		dlg->route = tmp;
	}*/

	if (recordRoute)
	{
		dialog.route = Reticulum.Parser.parseAddress(strRecordRoute).uri;
	}
	else
	{
		dialog.route = Reticulum.Parser.parseURI(uri);
	}

	/*mem_deref(dlg->mb);
	mem_deref(dlg->uri);*/

	/*dlg->mb   = mem_ref(renc.mb);
	dlg->rtag = mem_ref(rtag);
	dlg->uri  = mem_ref(uri);
	dlg->rseq = msg->req ? msg->cseq.num : 0;
	dlg->cpos = 0;*/

	dialog.remoteTag = remoteTag;
	dialog.uri = uri;
	dialog.remoteSequence = this.cseq.number;

	if (!this.isRequest)
		dialog.remoteSequence = 0;

 /*out:
	mem_deref(renc.mb);
	mem_deref(rtag);
	mem_deref(uri);

	return err;
}*/
	return dialog;
};

//int sip_request(struct sip_request **reqp, struct sip *sip, bool stateful, const char *met, int metl, const char *uri, int uril, const struct uri *route, struct mbuf *mb, sip_send_h *sendh, sip_resp_h *resph, void *arg);
Reticulum.SIP.Request = function(method, isStateful, requestURI, route, raw) {
	// Force parameters
	/*if (!method || !requestURI || !route || !raw)
		return null;*/

	/*struct sip_request *req;
	struct sa dst;
	struct pl pl;
	int err;

	if (!sip || !met || !uri || !route || !mb)
		return EINVAL;*/

	// force parameters


	/*if (pl_strcasecmp(&route->scheme, "sip"))
		return ENOSYS;*/
	if (route.scheme !== "sip")
		return null;

	/*req = mem_zalloc(sizeof(*req), destructor);
	if (!req)
		return ENOMEM;*/

	//list_append(&sip->reql, &req->le, req);
	// TODO: Add to request list???

	/*err = str_ldup(&req->met, met, metl);
	if (err)
		goto out;*/
	this.method = method;

	/*err = str_ldup(&req->uri, uri, uril);
	if (err)
		goto out;*/
	this.uri = requestURI;

	/*if (msg_param_decode(&route->params, "maddr", &pl))
		pl = route->host;*/
	this.host = Reticulum.Parser.parseParam(route.params, "maddr");

	if (this.host === null)
		this.host = route.host;

	/*err = pl_strdup(&req->host, &pl);
	if (err)
		goto out;*/

	//req->stateful = stateful;
	this.isStatefule = isStateful;
	//req->mb    = mem_ref(mb);
	this.raw = raw;
	/*req->sip   = sip;
	req->sendh = sendh;
	req->resph = resph;
	req->arg   = arg;*/

	/*if (!msg_param_decode(&route->params, "transport", &pl)) {

		if (!pl_strcasecmp(&pl, "udp"))
			req->tp = SIP_TRANSP_UDP;
		else if (!pl_strcasecmp(&pl, "tcp"))
			req->tp = SIP_TRANSP_TCP;
		else if (!pl_strcasecmp(&pl, "tls"))
			req->tp = SIP_TRANSP_TLS;
		else {
			err = EPROTONOSUPPORT;
			goto out;
		}

		if (!sip_transp_supported(sip, req->tp, AF_UNSPEC)) {
			err = EPROTONOSUPPORT;
			goto out;
		}

		req->tp_selected = true;
	}
	else {
		req->tp = SIP_TRANSP_NONE;
		if (!transp_next(sip, &req->tp)) {
			err = EPROTONOSUPPORT;
			goto out;
		}

		req->tp_selected = false;
	}*/

	this.transport = Reticulum.Parser.parseParam(route.params, "transport");
	if (this.transport !== "ws" || this.transport !== "wss")
		return null;

	this.port = route.port;

	/*if (!sa_set_str(&dst, req->host, sip_transp_port(req->tp, route->port))) {
		err = request(req, req->tp, &dst);
		if (!req->stateful) {
			mem_deref(req);
			return err;
		}
	}
	else if (route->port) {

		req->port = sip_transp_port(req->tp, route->port);
		err = addr_lookup(req, req->host);
	}
	else if (req->tp_selected) {

		err = srv_lookup(req, req->host);
	}
	else {
	        err = dnsc_query(&req->dnsq, sip->dnsc, req->host,
				 DNS_TYPE_NAPTR, DNS_CLASS_IN, true,
				 naptr_handler, req);
	}*/

 /*out:
	if (err)
		mem_deref(req);
	else if (reqp) {
		req->reqp = reqp;
		*reqp = req;
	}

	return err;*/

	//console.log(this);
};
//int sip_requestf(struct sip_request **reqp, struct sip *sip, bool stateful, const char *met, const char *uri, const struct uri *route, struct sip_auth *auth, sip_send_h *sendh, sip_resp_h *resph, void *arg, const char *fmt, ...);
Reticulum.SIP.request = function(method, isStateful, requestURI, route, needsAuth, raw, data)
{
	// Force parameters
	/*if (!method || !requestURI || !data)
		return null;*/
	/*struct uri lroute;
	struct mbuf *mb;
	va_list ap;
	int err;

	if (!sip || !met || !uri || !fmt)
		return EINVAL;*/

	if (route === null)
	{
		route = Reticulum.Parser.parseURI(requestURI);

		if (route === null)
			return null;
	}

	/*if (!route) {
		struct pl uripl;

		pl_set_str(&uripl, uri);

		err = uri_decode(&lroute, &uripl);
		if (err)
			return err;

		route = &lroute;
	}*/

	/*mb = mbuf_alloc(2048);
	if (!mb)
		return ENOMEM;*/

	//err = mbuf_write_str(mb, "Max-Forwards: 70\r\n");
	raw += "Max-Forwards: 70\r\n";

	/*if (auth)
		err |= sip_auth_encode(mb, auth, met, uri);*/
	if (needsAuth)
		raw += formatAuth(method, requestURI);

	/*if (err)
		goto out;*/

	/*va_start(ap, fmt);
	err = mbuf_vprintf(mb, fmt, ap);
	va_end(ap);*/

	raw += data;

	/*if (err)
		goto out;*/

	//mb->pos = 0;

	/*err = sip_request(reqp, sip, stateful, met, -1, uri, -1, route, mb, sendh, resph, arg);
	if (err)
		goto out;

 out:
	mem_deref(mb);

	return err;*/
	var request = new Reticulum.SIP.Request(method, isStateful, requestURI, route, raw);
	request.formatRequest();
	//console.log(request);

	return request;
};

Reticulum.SIP.reply2xx = function() {
	//int sipsess_reply_2xx(struct sipsess *sess, const struct sip_msg *msg, uint16_t scode, const char *reason, struct mbuf *desc, const char *fmt, va_list *ap)
//{
	/*struct sipsess_reply *reply;
	struct sip_contact contact;
	int err = ENOMEM;

	reply = mem_zalloc(sizeof(*reply), destructor);
	if (!reply)
		goto out;

	list_append(&sess->replyl, &reply->le, reply);
	reply->seq  = msg->cseq.num;
	reply->msg  = mem_ref((void *)msg);
	reply->sess = sess;

	sip_contact_set(&contact, sess->cuser, &msg->dst, msg->tp);

	err = sip_treplyf(&sess->st, &reply->mb, sess->sip,
			  msg, true, scode, reason,
			  "%H"
			  "%v"
			  "%s%s%s"
			  "Content-Length: %zu\r\n"
			  "\r\n"
			  "%b",
			  sip_contact_print, &contact,
			  fmt, ap,
			  desc ? "Content-Type: " : "",
			  desc ? sess->ctype : "",
			  desc ? "\r\n" : "",
			  desc ? mbuf_get_left(desc) : (size_t)0,
			  desc ? mbuf_buf(desc) : NULL,
			  desc ? mbuf_get_left(desc) : (size_t)0);

	if (err)
		goto out;

	tmr_start(&reply->tmr, 64 * SIP_T1, tmr_handler, reply);
	tmr_start(&reply->tmrg, SIP_T1, retransmit_handler, reply);

	if (!mbuf_get_left(msg->mb) && desc) {
		reply->awaiting_answer = true;
		sess->awaiting_answer = true;
	}

 out:
	if (err) {
		sess->st = mem_deref(sess->st);
		mem_deref(reply);
	}

	return err;*/
};

Reticulum.SIP.replyACK = function() {
//int sipsess_reply_ack(struct sipsess *sess, const struct sip_msg *msg, bool *awaiting_answer)
//{
	/*struct sipsess_reply *reply;

	reply = list_ledata(list_apply(&sess->replyl, false, cmp_handler, (void *)msg));
	if (!reply)
		return ENOENT;

	*awaiting_answer = reply->awaiting_answer;

	mem_deref(reply);

	return 0;*/
};

//static int request(struct sip_request *req, enum sip_transp tp, const struct sa *dst)
Reticulum.SIP.Request.prototype.formatRequest = function() {
	/*struct mbuf *mb = NULL;
	char *branch = NULL;
	int err = ENOMEM;
	struct sa laddr;*/

	//req->provrecv = false;
	//this.provrecv = false; //????

	/*branch = mem_alloc(24, NULL);
	mb = mbuf_alloc(1024);

	if (!branch || !mb)
		goto out;*/

	//(void)re_snprintf(branch, 24, "z9hG4bK%016llx", rand_u64());
	branch = "z9hG4bK";
	branch += Utils.token(15-7, Utils.TOKEN_NUMERIC_16);


	/*err = sip_transp_laddr(req->sip, &laddr, tp, dst);
	if (err)
		goto out;*/

	//err  = mbuf_printf(mb, "%s %s SIP/2.0\r\n", req->met, req->uri);
	raw = this.method + " " + this.uri + " SIP/2.0\r\n";
	//err |= mbuf_printf(mb, "Via: SIP/2.0/%s %J;branch=%s;rport\r\n", sip_transp_name(tp), &laddr, branch);
	raw += "Via: SIP/2.0/" + this.transport + " " + Reticulum.SIP.formatHost(this.host) + ";branch=" + branch + ";rport\r\n";
	//err |= req->sendh ? req->sendh(tp, &laddr, dst, mb, req->arg) : 0;
	//err |= mbuf_write_mem(mb, mbuf_buf(req->mb), mbuf_get_left(req->mb));
	raw += this.raw;

	this.raw = raw;

	/*if (err)
		goto out;

	mb->pos = 0;*/

	/*if (!req->stateful)
		err = sip_send(req->sip, NULL, tp, dst, mb);
	else
		err = sip_ctrans_request(&req->ct, req->sip, tp, dst, req->met, branch, mb, response_handler, req);
	if (err)
		goto out;*/

/* out:
	mem_deref(branch);
	mem_deref(mb);

	return err;*/
	//console.log(this);
};

Reticulum.SIP.formatResponse = function(response, responseText, headers, content, request) {
	var msg = new Reticulum.SIP.Message();

	msg.response = response;
	msg.responseText = responseText;
	msg.protocol = "SIP2.0";

	if (request) {
		msg.to = request.to;
		msg.via = request.via;
		msg.from = request.from;
		msg.cseq = request.cseq;
		msg.callid = request.callid;

		msg.method = request.cseq.method;

		if (response === 100) {
			msg.headers[Reticulum.Parser.Enum.SIP_HDR_TIMESTAMP] = request.headers[Reticulum.Parser.Enum.SIP_HDR_TIMESTAMP];
		}
	}

	// add each header

	// add content

	return msg;
};

Reticulum.SIP.Dialog = function(uri, toURI, fromURI, fromName, routev) {
	//int sip_dialog_alloc(struct sip_dialog **dlgp, const char *uri, const char *to_uri, const char *from_name, const char *from_uri, const char *routev[], uint32_t routec)
//{
	/*const uint64_t ltag = rand_u64();
	struct sip_dialog *dlg;
	struct sip_addr addr;
	size_t rend = 0;
	struct pl pl;
	uint32_t i;
	int err;

	if (!dlgp || !uri || !to_uri || !from_uri)
		return EINVAL;

	dlg = mem_zalloc(sizeof(*dlg), destructor);
	if (!dlg)
		return ENOMEM;*/

	//dlg->lseq = rand_u16();

	this.localSequence = Utils.token(4, Utils.TOKEN_NUMERIC_10);

	/*err = str_dup(&dlg->uri, uri);
	if (err)
		goto out;*/

	this.uri = uri;

	/*err = x64_strdup(&dlg->callid, rand_u64());
	if (err)
		goto out;*/

	this.callid = Utils.token(10, Utils.TOKEN_NUMERIC_32);

	/*err = x64_strdup(&dlg->ltag, ltag);
	if (err)
		goto out;*/

	this.localTag = Utils.token(10, Utils.TOKEN_NUMERIC_32);

	/*dlg->mb = mbuf_alloc(512);
	if (!dlg->mb) {
		err = ENOMEM;
		goto out;
	}*/

	/*for (i=0; i<routec; i++) {
		err |= mbuf_printf(dlg->mb, "Route: <%s;lr>\r\n", routev[i]);
		if (i == 0)
			rend = dlg->mb->pos - 2;
	}*/
	this.raw = "";

	for (var i = 0; i < routev.length; i++)
	{
		this.raw += "Route: <" + routev[i] + ";lr>";
	}

	if (this.raw !== "")
		this.raw += "\r\n";

	//err |= mbuf_printf(dlg->mb, "To: <%s>\r\n", to_uri);
	this.raw += "To: <" + toURI + ">\r\n";
	//dlg->cpos = dlg->mb->pos;
	/*err |= mbuf_printf(dlg->mb, "From: %s%s%s<%s>;tag=%016llx\r\n",
			   from_name ? "\"" : "", from_name,
			   from_name ? "\" " : "",
			   from_uri, ltag);
	if (err)
		goto out;*/

	this.raw += "From: ";

	if (fromName !== "")
		this.raw += fromName + " ";

	this.raw += "<" + fromURI + ">;tag=" + this.localTag + "\r\n";

	//dlg->mb->pos = 0;

	if (routev.length > 0)
	{
		var address = Reticulum.Parser.parseAddress(routev[0]);
		this.route = address.uri;
	}
	else
	{
		this.route = this.uri;
	}


	/*if (rend) {
		pl.p = (const char *)mbuf_buf(dlg->mb) + ROUTE_OFFSET;
		pl.l = rend - ROUTE_OFFSET;
		err = sip_addr_decode(&addr, &pl);
		dlg->route = addr.uri;
	}
	else {
		pl_set_str(&pl, dlg->uri);
		err = uri_decode(&dlg->route, &pl);
	}*/

 /*out:
	if (err)
		mem_deref(dlg);
	else
		*dlgp = dlg;

	return err;
}*/
};

Reticulum.SIP.Dialog.prototype.formatDialog = function(cseq, method) {};

//int sip_drequestf(struct sip_request **reqp, struct sip *sip, bool stateful, const char *met, struct sip_dialog *dlg, uint32_t cseq, struct sip_auth *auth, sip_send_h *sendh, sip_resp_h *resph, void *arg, const char *fmt, ...);
Reticulum.SIP.Dialog.prototype.request = function(method, isStateful, cseq, auth, raw, data)
{
	// Force parameters
	/*if (!method || !raw)
		return null;*/
	/*struct mbuf *mb;
	va_list ap;
	int err;

	if (!sip || !met || !dlg || !fmt)
		return EINVAL;

	mb = mbuf_alloc(2048);
	if (!mb)
		return ENOMEM;*/

	//err = mbuf_write_str(mb, "Max-Forwards: 70\r\n");
	raw += "Max-Forwards: 70\r\n";

	/*if (auth)
		err |= sip_auth_encode(mb, auth, met, sip_dialog_uri(dlg));*/
	if (auth !== null)
		raw += Reticulum.SIP.formatAuth(auth, method, this.uri);

	//err |= sip_dialog_encode(mb, dlg, cseq, met);
	raw += this.formatDialog(cseq, method);


	/*if (sip->software)
		err |= mbuf_printf(mb, "User-Agent: %s\r\n", sip->software);*/
	raw += "User-Agent: Reticulum\r\n";

	/*if (err)
		goto out;

	va_start(ap, fmt);
	err = mbuf_vprintf(mb, fmt, ap);
	va_end(ap);*/

	raw += data;

	/*if (err)
		goto out;

	mb->pos = 0;*/

	/*err = sip_request(reqp, sip, stateful, met, -1, sip_dialog_uri(dlg), -1, sip_dialog_route(dlg), mb, sendh, resph, arg);
	if (err)
		goto out;

 out:
	mem_deref(mb);

	return err;*/
	var request = new Reticulum.SIP.Request(method, isStateful, this.requestURI, this.route, raw);
	request.formatRequest();
	//console.log(request);

	return request;
};

Reticulum.SIP.invite = function() {
//int sipsess_connect(struct sipsess **sessp, struct sipsess_sock *sock, const char *to_uri, const char *from_name, const char *from_uri, const char *cuser, const char *routev[], uint32_t routec, const char *ctype, struct mbuf *desc, sip_auth_h *authh, void *aarg, bool aref, sipsess_offer_h *offerh, sipsess_answer_h *answerh, sipsess_progr_h *progrh, sipsess_estab_h *estabh, sipsess_info_h *infoh, sipsess_refer_h *referh, sipsess_close_h *closeh, void *arg, const char *fmt, ...)
//{
	/*struct sipsess *sess;
	int err;

	if (!sessp || !sock || !to_uri || !from_uri || !cuser || !ctype)
		return EINVAL;*/

	/*err = sipsess_alloc(&sess, sock, cuser, ctype, desc, authh, aarg, aref, offerh, answerh, progrh, estabh, infoh, referh, closeh, arg);
	if (err)
		return err;*/

	/* Custom SIP headers */
	/*if (fmt) {
		va_list ap;

		sess->hdrs = mbuf_alloc(256);
		if (!sess->hdrs) {
			err = ENOMEM;
			goto out;
		}

		va_start(ap, fmt);
		err = mbuf_vprintf(sess->hdrs, fmt, ap);
		sess->hdrs->pos = 0;
		va_end(ap);

		if (err)
			goto out;
	}*/

	//sess->owner = true;

	/*err = sip_dialog_alloc(&sess->dlg, to_uri, to_uri, from_name, from_uri, routev, routec);
	if (err)
		goto out;*/

	//hash_append(sock->ht_sess, hash_joaat_str(sip_dialog_callid(sess->dlg)), &sess->he, sess);

	/*err = invite(sess);
	if (err)
		goto out;*/

 /*out:
	if (err)
		mem_deref(sess);
	else
		*sessp = sess;

	return err;*/

//static int invite(struct sipsess *sess)
//{
	/*sess->sent_offer = sess->desc ? true : false;
	sess->modify_pending = false;

	return sip_drequestf(&sess->req, sess->sip, true, "INVITE",
			     sess->dlg, 0, sess->auth,
			     send_handler, invite_resp_handler, sess,
			     "%b"
			     "%s%s%s"
			     "Content-Length: %zu\r\n"
			     "\r\n"
			     "%b",
			     sess->hdrs ? mbuf_buf(sess->hdrs) : NULL,
			     sess->hdrs ? mbuf_get_left(sess->hdrs) :(size_t)0,
			     sess->desc ? "Content-Type: " : "",
			     sess->desc ? sess->ctype : "",
			     sess->desc ? "\r\n" : "",
			     sess->desc ? mbuf_get_left(sess->desc) :(size_t)0,
			     sess->desc ? mbuf_buf(sess->desc) : NULL,
			     sess->desc ? mbuf_get_left(sess->desc):(size_t)0);
}*/
};


Reticulum.SIP.onInviteResponse = function(message) {
//static void invite_resp_handler(int err, const struct sip_msg *msg, void *arg)
//{
	/*struct sipsess *sess = arg;
	struct mbuf *desc = NULL;*/

	/*if (err || sip_request_loops(&sess->ls, msg->scode))
		goto out;*/

	if (message.statusCode < 200) {
		//sess->progrh(msg, sess->arg);
		return;
	} else if (message.statusCode < 300) {

		//sess->hdrs = mem_deref(sess->hdrs);

		//err = sip_dialog_create(sess->dlg, msg);
		/*if (err)
			goto out;*/

		/*if (sess->sent_offer)
			err = sess->answerh(msg, sess->arg);
		else {
			sess->modify_pending = false;
			err = sess->offerh(&desc, msg, sess->arg);
		}*/

		//err |= sipsess_ack(sess->sock, sess->dlg, msg->cseq.num, sess->auth, sess->ctype, desc);

		//sess->established = true;
		//mem_deref(desc);

		/*if (err || sess->terminated)
			goto out;*/

		/*if (sess->modify_pending)
			(void)sipsess_reinvite(sess, true);
		else
			sess->desc = mem_deref(sess->desc);*/

		//sess->estabh(msg, sess->arg);
		return;
	} else if (message.statusCode < 400) {

		// Redirect to first Contact

		/*if (sess->terminated)
			goto out;*/

		//err = sip_dialog_update(sess->dlg, msg);
		/*if (err)
			goto out;*/

		//err = invite(sess);
		/*if (err)
			goto out;*/

		//return;
	} else {
		/*if (sess->terminated)
			goto out;*/

		switch (message.statusCode) {
		case 401:
		case 407:
			//err = sip_auth_authenticate(sess->auth, msg);
			/*if (err) {
				err = (err == EAUTH) ? 0 : err;
				break;
			}*/

			//err = invite(sess);
			/*if (err)
				break;*/

			return;
		}
	}

 /*out:
	if (!sess->terminated)
		sipsess_terminate(sess, err, msg);
	else
		mem_deref(sess);*/
};

var sip = Reticulum.SIP;
