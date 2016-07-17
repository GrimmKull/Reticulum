/**
 * @namespace
 */
var Utils = {
	/*** Token types ***/
	TOKEN_ALPHA : 0,
	TOKEN_ALPHANUMERIC : 1,
	TOKEN_NUMERIC_8 : 2,
	TOKEN_NUMERIC_16 : 3,
	TOKEN_NUMERIC_32 : 4,
	TOKEN_NUMERIC_10 : 10,
	//TOKEN_NUMERIC_64 : 5, // not supported base must be between 2 and 36

	/**
	 * token - Token generator
	 *
	 * @param  {number} length length of token
	 * @param  {number} src    token type
	 * @return {type}        calculated token
	 */
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

	unquote: function(str) {
		if (str === undefined || str === null) return "";
		if (str.length === 0) return "";

		var quote = '"';
		if (str[0] === quote && str[str.length - 1] === quote)
			return str.slice(1, str.length - 1);
		else
			return str;
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
		//return Utils.hex(Utils.md51(s));
		return MD5.hexdigest(s);
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

var MD5 = (function() {
	var p = 0;
	var a = "";
	var m = 8;
	var k = function(s, v) {
		var u = (s & 65535) + (v & 65535);
		var t = (s >> 16) + (v >> 16) + (u >> 16);
		return (t << 16) | (u & 65535)
	};
	var o = function(s, t) {
		return (s << t) | (s >>> (32 - t))
	};
	var b = function(v) {
		var u = [];
		var s = (1 << m) - 1;
		for (var t = 0; t < v.length * m; t += m) {
			u[t >> 5] |= (v.charCodeAt(t / m) & s) << (t % 32)
		}
		return u
	};
	var g = function(u) {
		var v = "";
		var s = (1 << m) - 1;
		for (var t = 0; t < u.length * 32; t += m) {
			v += String.fromCharCode((u[t >> 5] >>> (t % 32)) & s)
		}
		return v
	};
	var r = function(u) {
		var t = p ? "0123456789ABCDEF" : "0123456789abcdef";
		var v = "";
		for (var s = 0; s < u.length * 4; s++) {
			v += t.charAt((u[s >> 2] >> ((s % 4) * 8 + 4)) & 15) + t.charAt((u[s >> 2] >> ((s % 4) * 8)) & 15)
		}
		return v
	};
	var q = function(v) {
		var u = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
		var x = "";
		var w, s;
		for (var t = 0; t < v.length * 4; t += 3) {
			w = (((v[t >> 2] >> 8 * (t % 4)) & 255) << 16) | (((v[t + 1 >> 2] >> 8 * ((t + 1) % 4)) & 255) << 8) | ((v[t + 2 >> 2] >> 8 * ((t + 2) % 4)) & 255);
			for (s = 0; s < 4; s++) {
				if (t * 8 + s * 6 > v.length * 32) {
					x += a
				} else {
					x += u.charAt((w >> 6 * (3 - s)) & 63)
				}
			}
		}
		return x
	};
	var d = function(A, w, v, u, z, y) {
		return k(o(k(k(w, A), k(u, y)), z), v)
	};
	var l = function(w, v, B, A, u, z, y) {
		return d((v & B) | ((~v) & A), w, v, u, z, y)
	};
	var c = function(w, v, B, A, u, z, y) {
		return d((v & A) | (B & (~A)), w, v, u, z, y)
	};
	var n = function(w, v, B, A, u, z, y) {
		return d(v ^ B ^ A, w, v, u, z, y)
	};
	var j = function(w, v, B, A, u, z, y) {
		return d(B ^ (v | (~A)), w, v, u, z, y)
	};
	var f = function(D, y) {
		D[y >> 5] |= 128 << ((y) % 32);
		D[(((y + 64) >>> 9) << 4) + 14] = y;
		var C = 1732584193;
		var B = -271733879;
		var A = -1732584194;
		var z = 271733878;
		var w, v, u, s;
		for (var t = 0; t < D.length; t += 16) {
			w = C;
			v = B;
			u = A;
			s = z;
			C = l(C, B, A, z, D[t + 0], 7, -680876936);
			z = l(z, C, B, A, D[t + 1], 12, -389564586);
			A = l(A, z, C, B, D[t + 2], 17, 606105819);
			B = l(B, A, z, C, D[t + 3], 22, -1044525330);
			C = l(C, B, A, z, D[t + 4], 7, -176418897);
			z = l(z, C, B, A, D[t + 5], 12, 1200080426);
			A = l(A, z, C, B, D[t + 6], 17, -1473231341);
			B = l(B, A, z, C, D[t + 7], 22, -45705983);
			C = l(C, B, A, z, D[t + 8], 7, 1770035416);
			z = l(z, C, B, A, D[t + 9], 12, -1958414417);
			A = l(A, z, C, B, D[t + 10], 17, -42063);
			B = l(B, A, z, C, D[t + 11], 22, -1990404162);
			C = l(C, B, A, z, D[t + 12], 7, 1804603682);
			z = l(z, C, B, A, D[t + 13], 12, -40341101);
			A = l(A, z, C, B, D[t + 14], 17, -1502002290);
			B = l(B, A, z, C, D[t + 15], 22, 1236535329);
			C = c(C, B, A, z, D[t + 1], 5, -165796510);
			z = c(z, C, B, A, D[t + 6], 9, -1069501632);
			A = c(A, z, C, B, D[t + 11], 14, 643717713);
			B = c(B, A, z, C, D[t + 0], 20, -373897302);
			C = c(C, B, A, z, D[t + 5], 5, -701558691);
			z = c(z, C, B, A, D[t + 10], 9, 38016083);
			A = c(A, z, C, B, D[t + 15], 14, -660478335);
			B = c(B, A, z, C, D[t + 4], 20, -405537848);
			C = c(C, B, A, z, D[t + 9], 5, 568446438);
			z = c(z, C, B, A, D[t + 14], 9, -1019803690);
			A = c(A, z, C, B, D[t + 3], 14, -187363961);
			B = c(B, A, z, C, D[t + 8], 20, 1163531501);
			C = c(C, B, A, z, D[t + 13], 5, -1444681467);
			z = c(z, C, B, A, D[t + 2], 9, -51403784);
			A = c(A, z, C, B, D[t + 7], 14, 1735328473);
			B = c(B, A, z, C, D[t + 12], 20, -1926607734);
			C = n(C, B, A, z, D[t + 5], 4, -378558);
			z = n(z, C, B, A, D[t + 8], 11, -2022574463);
			A = n(A, z, C, B, D[t + 11], 16, 1839030562);
			B = n(B, A, z, C, D[t + 14], 23, -35309556);
			C = n(C, B, A, z, D[t + 1], 4, -1530992060);
			z = n(z, C, B, A, D[t + 4], 11, 1272893353);
			A = n(A, z, C, B, D[t + 7], 16, -155497632);
			B = n(B, A, z, C, D[t + 10], 23, -1094730640);
			C = n(C, B, A, z, D[t + 13], 4, 681279174);
			z = n(z, C, B, A, D[t + 0], 11, -358537222);
			A = n(A, z, C, B, D[t + 3], 16, -722521979);
			B = n(B, A, z, C, D[t + 6], 23, 76029189);
			C = n(C, B, A, z, D[t + 9], 4, -640364487);
			z = n(z, C, B, A, D[t + 12], 11, -421815835);
			A = n(A, z, C, B, D[t + 15], 16, 530742520);
			B = n(B, A, z, C, D[t + 2], 23, -995338651);
			C = j(C, B, A, z, D[t + 0], 6, -198630844);
			z = j(z, C, B, A, D[t + 7], 10, 1126891415);
			A = j(A, z, C, B, D[t + 14], 15, -1416354905);
			B = j(B, A, z, C, D[t + 5], 21, -57434055);
			C = j(C, B, A, z, D[t + 12], 6, 1700485571);
			z = j(z, C, B, A, D[t + 3], 10, -1894986606);
			A = j(A, z, C, B, D[t + 10], 15, -1051523);
			B = j(B, A, z, C, D[t + 1], 21, -2054922799);
			C = j(C, B, A, z, D[t + 8], 6, 1873313359);
			z = j(z, C, B, A, D[t + 15], 10, -30611744);
			A = j(A, z, C, B, D[t + 6], 15, -1560198380);
			B = j(B, A, z, C, D[t + 13], 21, 1309151649);
			C = j(C, B, A, z, D[t + 4], 6, -145523070);
			z = j(z, C, B, A, D[t + 11], 10, -1120210379);
			A = j(A, z, C, B, D[t + 2], 15, 718787259);
			B = j(B, A, z, C, D[t + 9], 21, -343485551);
			C = k(C, w);
			B = k(B, v);
			A = k(A, u);
			z = k(z, s)
		}
		return [C, B, A, z]
	};
	var e = function(u, x) {
		var w = b(u);
		if (w.length > 16) {
			w = f(w, u.length * m)
		}
		var s = new Array(16),
			v = new Array(16);
		for (var t = 0; t < 16; t++) {
			s[t] = w[t] ^ 909522486;
			v[t] = w[t] ^ 1549556828
		}
		var y = f(s.concat(b(x)), 512 + x.length * m);
		return f(v.concat(y), 512 + 128)
	};
	var h = {
		hexdigest: function(t) {
			return r(f(b(t), t.length * m))
		},
		b64digest: function(t) {
			return q(f(b(t), t.length * m))
		},
		hash: function(t) {
			return g(f(b(t), t.length * m))
		},
		hmac_hexdigest: function(s, t) {
			return r(e(s, t))
		},
		hmac_b64digest: function(s, t) {
			return q(e(s, t))
		},
		hmac_hash: function(s, t) {
			return g(e(s, t))
		},
		test: function() {
			return MD5.hexdigest("abc") === "900150983cd24fb0d6963f7d28e17f72"
		}
	};
	return h
})();
