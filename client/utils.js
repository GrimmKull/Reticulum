var Utils = {
	/*** Token types ***/
	TOKEN_ALPHA : 0,
	TOKEN_ALPHANUMERIC : 1,
	TOKEN_NUMERIC_8 : 2,
	TOKEN_NUMERIC_16 : 3,
	TOKEN_NUMERIC_32 : 4,
	TOKEN_NUMERIC_10 : 10,
	//TOKEN_NUMERIC_64 : 5, // not supported base must be between 2 and 36

	/*** Token generator***/
	token: function(length, src) {
		src = typeof src !== 'undefined' ? src : 1;
		var text = "";
		var alpha = "abcdefghijklmnopqrstuvwxyz";
		var alphanum = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		var base = Math.pow(2,src + 1);

		for ( var i = 0; i < length; i++ )
		{
			if (src === Utils.TOKEN_ALPHA)
			{
				text += alpha.charAt((Math.random() *1000|0) % alpha.length);
			}
			else if (src === Utils.TOKEN_ALPHANUMERIC)
			{
				text += alphanum.charAt((Math.random() *1000|0) % alphanum.length);
			}
			else if (src === Utils.TOKEN_NUMERIC_10)
			{
				text += (Math.random()*10|0).toString(10);
			}
			else
			{
				text += (Math.random()*base|0).toString(base);
			}
		}

		return text;
	},

	uuid: function() {
		var token = Utils.token(36, Utils.TOKEN_NUMERIC_16);

		token[8] = "-"; token[13] = "-"; token[18] = "-"; token[23] = "-";
		//token[14] = "4";
		//token[19] = token[19]&0x3|0x8;

		return token;
	},

	// https://github.com/onsip/SIP.js/blob/master/src/Utils.js
	newUUID: function() {
		var UUID = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = Math.random() * 16 | 0,
				v = c === 'x' ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		});

		return UUID;
	},
	/**
	MD5 by Joseph's Myers

	http://www.myersdaily.org/joseph/javascript/md5-text.html
	**/

	md5cycle: function(x, k) {
		var a = x[0], b = x[1], c = x[2], d = x[3];

		a = Utils.ff(a, b, c, d, k[0], 7, -680876936);
		d = Utils.ff(d, a, b, c, k[1], 12, -389564586);
		c = Utils.ff(c, d, a, b, k[2], 17,  606105819);
		b = Utils.ff(b, c, d, a, k[3], 22, -1044525330);
		a = Utils.ff(a, b, c, d, k[4], 7, -176418897);
		d = Utils.ff(d, a, b, c, k[5], 12,  1200080426);
		c = Utils.ff(c, d, a, b, k[6], 17, -1473231341);
		b = Utils.ff(b, c, d, a, k[7], 22, -45705983);
		a = Utils.ff(a, b, c, d, k[8], 7,  1770035416);
		d = Utils.ff(d, a, b, c, k[9], 12, -1958414417);
		c = Utils.ff(c, d, a, b, k[10], 17, -42063);
		b = Utils.ff(b, c, d, a, k[11], 22, -1990404162);
		a = Utils.ff(a, b, c, d, k[12], 7,  1804603682);
		d = Utils.ff(d, a, b, c, k[13], 12, -40341101);
		c = Utils.ff(c, d, a, b, k[14], 17, -1502002290);
		b = Utils.ff(b, c, d, a, k[15], 22,  1236535329);

		a = Utils.gg(a, b, c, d, k[1], 5, -165796510);
		d = Utils.gg(d, a, b, c, k[6], 9, -1069501632);
		c = Utils.gg(c, d, a, b, k[11], 14,  643717713);
		b = Utils.gg(b, c, d, a, k[0], 20, -373897302);
		a = Utils.gg(a, b, c, d, k[5], 5, -701558691);
		d = Utils.gg(d, a, b, c, k[10], 9,  38016083);
		c = Utils.gg(c, d, a, b, k[15], 14, -660478335);
		b = Utils.gg(b, c, d, a, k[4], 20, -405537848);
		a = Utils.gg(a, b, c, d, k[9], 5,  568446438);
		d = Utils.gg(d, a, b, c, k[14], 9, -1019803690);
		c = Utils.gg(c, d, a, b, k[3], 14, -187363961);
		b = Utils.gg(b, c, d, a, k[8], 20,  1163531501);
		a = Utils.gg(a, b, c, d, k[13], 5, -1444681467);
		d = Utils.gg(d, a, b, c, k[2], 9, -51403784);
		c = Utils.gg(c, d, a, b, k[7], 14,  1735328473);
		b = Utils.gg(b, c, d, a, k[12], 20, -1926607734);

		a = Utils.hh(a, b, c, d, k[5], 4, -378558);
		d = Utils.hh(d, a, b, c, k[8], 11, -2022574463);
		c = Utils.hh(c, d, a, b, k[11], 16,  1839030562);
		b = Utils.hh(b, c, d, a, k[14], 23, -35309556);
		a = Utils.hh(a, b, c, d, k[1], 4, -1530992060);
		d = Utils.hh(d, a, b, c, k[4], 11,  1272893353);
		c = Utils.hh(c, d, a, b, k[7], 16, -155497632);
		b = Utils.hh(b, c, d, a, k[10], 23, -1094730640);
		a = Utils.hh(a, b, c, d, k[13], 4,  681279174);
		d = Utils.hh(d, a, b, c, k[0], 11, -358537222);
		c = Utils.hh(c, d, a, b, k[3], 16, -722521979);
		b = Utils.hh(b, c, d, a, k[6], 23,  76029189);
		a = Utils.hh(a, b, c, d, k[9], 4, -640364487);
		d = Utils.hh(d, a, b, c, k[12], 11, -421815835);
		c = Utils.hh(c, d, a, b, k[15], 16,  530742520);
		b = Utils.hh(b, c, d, a, k[2], 23, -995338651);

		a = Utils.ii(a, b, c, d, k[0], 6, -198630844);
		d = Utils.ii(d, a, b, c, k[7], 10,  1126891415);
		c = Utils.ii(c, d, a, b, k[14], 15, -1416354905);
		b = Utils.ii(b, c, d, a, k[5], 21, -57434055);
		a = Utils.ii(a, b, c, d, k[12], 6,  1700485571);
		d = Utils.ii(d, a, b, c, k[3], 10, -1894986606);
		c = Utils.ii(c, d, a, b, k[10], 15, -1051523);
		b = Utils.ii(b, c, d, a, k[1], 21, -2054922799);
		a = Utils.ii(a, b, c, d, k[8], 6,  1873313359);
		d = Utils.ii(d, a, b, c, k[15], 10, -30611744);
		c = Utils.ii(c, d, a, b, k[6], 15, -1560198380);
		b = Utils.ii(b, c, d, a, k[13], 21,  1309151649);
		a = Utils.ii(a, b, c, d, k[4], 6, -145523070);
		d = Utils.ii(d, a, b, c, k[11], 10, -1120210379);
		c = Utils.ii(c, d, a, b, k[2], 15,  718787259);
		b = Utils.ii(b, c, d, a, k[9], 21, -343485551);

		x[0] = Utils.add32(a, x[0]);
		x[1] = Utils.add32(b, x[1]);
		x[2] = Utils.add32(c, x[2]);
		x[3] = Utils.add32(d, x[3]);
	},

	cmn: function(q, a, b, x, s, t) {
		a = Utils.add32(Utils.add32(a, q), Utils.add32(x, t));
		return Utils.add32((a << s) | (a >>> (32 - s)), b);
	},

	ff: function(a, b, c, d, x, s, t) {
		return Utils.cmn((b & c) | ((~b) & d), a, b, x, s, t);
	},

	gg: function(a, b, c, d, x, s, t) {
		return Utils.cmn((b & d) | (c & (~d)), a, b, x, s, t);
	},

	hh: function(a, b, c, d, x, s, t) {
		return Utils.cmn(b ^ c ^ d, a, b, x, s, t);
	},

	ii: function(a, b, c, d, x, s, t) {
		return Utils.cmn(c ^ (b | (~d)), a, b, x, s, t);
	},

	md51: function(s) {
		var txt = '';
		var n = s.length, state = [1732584193, -271733879, -1732584194, 271733878], i;
		for (i=64; i<=s.length; i+=64) {
			Utils.md5cycle(state, Utils.md5blk(s.substring(i-64, i)));
		}
		s = s.substring(i-64);
		var tail = [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0];
		for (i=0; i<s.length; i++)
		tail[i>>2] |= s.charCodeAt(i) << ((i%4) << 3);
		tail[i>>2] |= 0x80 << ((i%4) << 3);
		if (i > 55) {
			md5cycle(state, tail);
			for (i=0; i<16; i++) tail[i] = 0;
		}
		tail[14] = n*8;
		Utils.md5cycle(state, tail);

		return state;
	},

	/* there needs to be support for Unicode here,
	 * unless we pretend that we can redefine the MD-5
	 * algorithm for multi-byte characters (perhaps
	 * by adding every four 16-bit characters and
	 * shortening the sum to 32 bits). Otherwise
	 * I suggest performing MD-5 as if every character
	 * was two bytes--e.g., 0040 0025 = @%--but then
	 * how will an ordinary MD-5 sum be matched?
	 * There is no way to standardize text to something
	 * like UTF-8 before transformation; speed cost is
	 * utterly prohibitive. The JavaScript standard
	 * itself needs to look at this: it should start
	 * providing access to strings as preformed UTF-8
	 * 8-bit unsigned value arrays.
	 */
	md5blk: function(s) { /* I figured global was faster.   */
		var md5blks = [], i; /* Andy King said do it this way. */
		for (i=0; i<64; i+=4) {
			md5blks[i>>2] = s.charCodeAt(i) + (s.charCodeAt(i+1) << 8) + (s.charCodeAt(i+2) << 16) + (s.charCodeAt(i+3) << 24);
		}
		return md5blks;
	},

	hex_chr: '0123456789abcdef'.split(''),

	rhex: function(n)
	{
		var s='', j=0;
		for(; j<4; j++)
			s += Utils.hex_chr[(n >> (j * 8 + 4)) & 0x0F] + Utils.hex_chr[(n >> (j * 8)) & 0x0F];
		return s;
	},

	hex: function(x) {
		for (var i=0; i<x.length; i++)
			x[i] = Utils.rhex(x[i]);
		return x.join('');
	},

	md5: function(s) {
		return Utils.hex(Utils.md51(s));
	},

	/* this function is much faster,
	so if possible we use it. Some IEs
	are the only ones I know of that
	need the idiotic second function,
	generated by an if clause.  */

	add32: function(a, b) {
		return (a + b) & 0xFFFFFFFF;
	},

	/*if (md5('hello') != '5d41402abc4b2a76b9719d911017c592') {
		function add32(x, y) {
			var lsw = (x & 0xFFFF) + (y & 0xFFFF),
			msw = (x >> 16) + (y >> 16) + (lsw >> 16);
			return (msw << 16) | (lsw & 0xFFFF);
		}
	}*/
};
