Reticulum = {};
Reticulum.Parser = {};
Reticulum.Parser.Arrays = {};
Reticulum.Parser.Hashes = {};

Reticulum.Parser.Enum = {
	SIP_HDR_ACCEPT                        : 0, //3186,
	SIP_HDR_ACCEPT_CONTACT                : 1, // 232,
	SIP_HDR_ACCEPT_ENCODING               : 2, // 708,
	SIP_HDR_ACCEPT_LANGUAGE               : 3, //2867,
	SIP_HDR_ACCEPT_RESOURCE_PRIORITY      : 4, //1848,
	SIP_HDR_ALERT_INFO                    : 5, // 274,
	SIP_HDR_ALLOW                         : 6, //2429,
	SIP_HDR_ALLOW_EVENTS                  : 7, //  66,
	SIP_HDR_ANSWER_MODE                   : 8, //2905,
	SIP_HDR_AUTHENTICATION_INFO           : 9, //3144,
	SIP_HDR_AUTHORIZATION                 : 10, //2503,
	SIP_HDR_CALL_ID                       : 11, //3095,
	SIP_HDR_CALL_INFO                     : 12, // 586,
	SIP_HDR_CONTACT                       : 13, // 229,
	SIP_HDR_CONTENT_DISPOSITION           : 14, //1425,
	SIP_HDR_CONTENT_ENCODING              : 15, // 580,
	SIP_HDR_CONTENT_LANGUAGE              : 16, //3371,
	SIP_HDR_CONTENT_LENGTH                : 17, //3861,
	SIP_HDR_CONTENT_TYPE                  : 18, // 809,
	SIP_HDR_CSEQ                          : 19, // 746,
	SIP_HDR_DATE                          : 20, //1027,
	SIP_HDR_ENCRYPTION                    : 21, //3125,
	SIP_HDR_ERROR_INFO                    : 22, //  21,
	SIP_HDR_EVENT                         : 23, //3286,
	SIP_HDR_EXPIRES                       : 24, //1983,
	SIP_HDR_FLOW_TIMER                    : 25, // 584,
	SIP_HDR_FROM                          : 26, //1963,
	SIP_HDR_HIDE                          : 27, // 283,
	SIP_HDR_HISTORY_INFO                  : 28, //2582,
	SIP_HDR_IDENTITY                      : 29, //2362,
	SIP_HDR_IDENTITY_INFO                 : 30, // 980,
	SIP_HDR_IN_REPLY_TO                   : 31, //1577,
	SIP_HDR_JOIN                          : 32, //3479,
	SIP_HDR_MAX_BREADTH                   : 33, //3701,
	SIP_HDR_MAX_FORWARDS                  : 34, //3549,
	SIP_HDR_MIME_VERSION                  : 35, //3659,
	SIP_HDR_MIN_EXPIRES                   : 36, //1121,
	SIP_HDR_MIN_SE                        : 37, //2847,
	SIP_HDR_ORGANIZATION                  : 38, //3247,
	SIP_HDR_P_ACCESS_NETWORK_INFO         : 39, //1662,
	SIP_HDR_P_ANSWER_STATE                : 40, //  42,
	SIP_HDR_P_ASSERTED_IDENTITY           : 41, //1233,
	SIP_HDR_P_ASSOCIATED_URI              : 42, // 900,
	SIP_HDR_P_CALLED_PARTY_ID             : 43, //3347,
	SIP_HDR_P_CHARGING_FUNCTION_ADDRESSES : 44, //2171,
	SIP_HDR_P_CHARGING_VECTOR             : 45, //  25,
	SIP_HDR_P_DCS_TRACE_PARTY_ID          : 46, //3027,
	SIP_HDR_P_DCS_OSPS                    : 47, //1788,
	SIP_HDR_P_DCS_BILLING_INFO            : 48, //2017,
	SIP_HDR_P_DCS_LAES                    : 49, // 693,
	SIP_HDR_P_DCS_REDIRECT                : 50, //1872,
	SIP_HDR_P_EARLY_MEDIA                 : 51, //2622,
	SIP_HDR_P_MEDIA_AUTHORIZATION         : 52, //1035,
	SIP_HDR_P_PREFERRED_IDENTITY          : 53, //1263,
	SIP_HDR_P_PROFILE_KEY                 : 54, //1904,
	SIP_HDR_P_REFUSED_URI_LIST            : 55, //1047,
	SIP_HDR_P_SERVED_USER                 : 56, //1588,
	SIP_HDR_P_USER_DATABASE               : 57, //2827,
	SIP_HDR_P_VISITED_NETWORK_ID          : 58, //3867,
	SIP_HDR_PATH                          : 59, //2741,
	SIP_HDR_PERMISSION_MISSING            : 60, //1409,
	SIP_HDR_PRIORITY                      : 61, //3520,
	SIP_HDR_PRIV_ANSWER_MODE              : 62, //2476,
	SIP_HDR_PRIVACY                       : 63, //3150,
	SIP_HDR_PROXY_AUTHENTICATE            : 64, // 116,
	SIP_HDR_PROXY_AUTHORIZATION           : 65, //2363,
	SIP_HDR_PROXY_REQUIRE                 : 66, //3562,
	SIP_HDR_RACK                          : 67, //2523,
	SIP_HDR_REASON                        : 68, //3732,
	SIP_HDR_RECORD_ROUTE                  : 69, // 278,
	SIP_HDR_REFER_SUB                     : 70, //2458,
	SIP_HDR_REFER_TO                      : 71, //1521,
	SIP_HDR_REFERRED_BY                   : 72, //3456,
	SIP_HDR_REJECT_CONTACT                : 73, // 285,
	SIP_HDR_REPLACES                      : 74, //2534,
	SIP_HDR_REPLY_TO                      : 75, //2404,
	SIP_HDR_REQUEST_DISPOSITION           : 76, //3715,
	SIP_HDR_REQUIRE                       : 77, //3905,
	SIP_HDR_RESOURCE_PRIORITY             : 78, //1643,
	SIP_HDR_RESPONSE_KEY                  : 79, //1548,
	SIP_HDR_RETRY_AFTER                   : 80, // 409,
	SIP_HDR_ROUTE                         : 81, // 661,
	SIP_HDR_RSEQ                          : 82, // 445,
	SIP_HDR_SECURITY_CLIENT               : 83, //1358,
	SIP_HDR_SECURITY_SERVER               : 84, // 811,
	SIP_HDR_SECURITY_VERIFY               : 85, // 519,
	SIP_HDR_SERVER                        : 86, // 973,
	SIP_HDR_SERVICE_ROUTE                 : 87, //1655,
	SIP_HDR_SESSION_EXPIRES               : 88, //1979,
	SIP_HDR_SIP_ETAG                      : 89, //1997,
	SIP_HDR_SIP_IF_MATCH                  : 90, //3056,
	SIP_HDR_SUBJECT                       : 91, //1043,
	SIP_HDR_SUBSCRIPTION_STATE            : 92, //2884,
	SIP_HDR_SUPPORTED                     : 93, // 119,
	SIP_HDR_TARGET_DIALOG                 : 94, //3450,
	SIP_HDR_TIMESTAMP                     : 95, // 938,
	SIP_HDR_TO                            : 96, //1449,
	SIP_HDR_TRIGGER_CONSENT               : 97, //3180,
	SIP_HDR_UNSUPPORTED                   : 98, // 982,
	SIP_HDR_USER_AGENT                    : 99, //4064,
	SIP_HDR_VIA                           : 100, //3961,
	SIP_HDR_WARNING                       : 101, //2108,
	SIP_HDR_WWW_AUTHENTICATE              : 102, //2763,

	SIP_HDR_NONE : -1,
};

Reticulum.Parser.Hashes.Headers = {
	"Accept": Reticulum.Parser.Enum.SIP_HDR_ACCEPT,
	"Accept-Contact": Reticulum.Parser.Enum.SIP_HDR_ACCEPT_CONTACT,
	"Accept-Encoding": Reticulum.Parser.Enum.SIP_HDR_ACCEPT_ENCODING,
	"Accept-Language": Reticulum.Parser.Enum.SIP_HDR_ACCEPT_LANGUAGE,
	"Accept-Resource-Priority": Reticulum.Parser.Enum.SIP_HDR_ACCEPT_RESOURCE_PRIORITY,
	"Alert-Info": Reticulum.Parser.Enum.SIP_HDR_ALERT_INFO,
	"Allow": Reticulum.Parser.Enum.SIP_HDR_ALLOW,
	"Allow-Events": Reticulum.Parser.Enum.SIP_HDR_ALLOW_EVENTS,
	"Answer-Mode": Reticulum.Parser.Enum.SIP_HDR_ANSWER_MODE,
	"Authentication-Info": Reticulum.Parser.Enum.SIP_HDR_AUTHENTICATION_INFO,
	"Authorization": Reticulum.Parser.Enum.SIP_HDR_AUTHORIZATION,
	"Call-ID": Reticulum.Parser.Enum.SIP_HDR_CALL_ID,
	"Call-Info": Reticulum.Parser.Enum.SIP_HDR_CALL_INFO,
	"Contact": Reticulum.Parser.Enum.SIP_HDR_CONTACT,
	"Content-Disposition": Reticulum.Parser.Enum.SIP_HDR_CONTENT_DISPOSITION,
	"Content-Encoding": Reticulum.Parser.Enum.SIP_HDR_CONTENT_ENCODING,
	"Content-Language": Reticulum.Parser.Enum.SIP_HDR_CONTENT_LANGUAGE,
	"Content-Length": Reticulum.Parser.Enum.SIP_HDR_CONTENT_LENGTH,
	"Content-Type": Reticulum.Parser.Enum.SIP_HDR_CONTENT_TYPE,
	"CSeq": Reticulum.Parser.Enum.SIP_HDR_CSEQ,
	"Date": Reticulum.Parser.Enum.SIP_HDR_DATE,
	"Encryption": Reticulum.Parser.Enum.SIP_HDR_ENCRYPTION,
	"Error-Info": Reticulum.Parser.Enum.SIP_HDR_ERROR_INFO,
	"Event": Reticulum.Parser.Enum.SIP_HDR_EVENT,
	"Expires": Reticulum.Parser.Enum.SIP_HDR_EXPIRES,
	"Flow-Timer": Reticulum.Parser.Enum.SIP_HDR_FLOW_TIMER,
	"From": Reticulum.Parser.Enum.SIP_HDR_FROM,
	"Hide": Reticulum.Parser.Enum.SIP_HDR_HIDE,
	"History-Info": Reticulum.Parser.Enum.SIP_HDR_HISTORY_INFO,
	"Identity": Reticulum.Parser.Enum.SIP_HDR_IDENTITY,
	"Identity-Info": Reticulum.Parser.Enum.SIP_HDR_IDENTITY_INFO,
	"In-Reply-To": Reticulum.Parser.Enum.SIP_HDR_IN_REPLY_TO,
	"Join": Reticulum.Parser.Enum.SIP_HDR_JOIN,
	"Max-Breadth": Reticulum.Parser.Enum.SIP_HDR_MAX_BREADTH,
	"Max-Forwards": Reticulum.Parser.Enum.SIP_HDR_MAX_FORWARDS,
	"MIME-Version": Reticulum.Parser.Enum.SIP_HDR_MIME_VERSION,
	"Min-Expires": Reticulum.Parser.Enum.SIP_HDR_MIN_EXPIRES,
	"Min-SE": Reticulum.Parser.Enum.SIP_HDR_MIN_SE,
	"Organization": Reticulum.Parser.Enum.SIP_HDR_ORGANIZATION,
	"P-Access-Network-Info": Reticulum.Parser.Enum.SIP_HDR_P_ACCESS_NETWORK_INFO,
	"P-Answer-State": Reticulum.Parser.Enum.SIP_HDR_P_ANSWER_STATE,
	"P-Asserted-Identity": Reticulum.Parser.Enum.SIP_HDR_P_ASSERTED_IDENTITY,
	"P-Associated-URI": Reticulum.Parser.Enum.SIP_HDR_P_ASSOCIATED_URI,
	"P-Called-Party-ID": Reticulum.Parser.Enum.SIP_HDR_P_CALLED_PARTY_ID,
	"P-Charging-Function-Addresses": Reticulum.Parser.Enum.SIP_HDR_P_CHARGING_FUNCTION_ADDRESSES,
	"P-Charging-Vector": Reticulum.Parser.Enum.SIP_HDR_P_CHARGING_VECTOR,
	"P-DCS-Trace-Party-ID": Reticulum.Parser.Enum.SIP_HDR_P_DCS_TRACE_PARTY_ID,
	"P-DCS-OSPS": Reticulum.Parser.Enum.SIP_HDR_P_DCS_OSPS,
	"P-DCS-Billing-Info": Reticulum.Parser.Enum.SIP_HDR_P_DCS_BILLING_INFO,
	"P-DCS-LAES": Reticulum.Parser.Enum.SIP_HDR_P_DCS_LAES,
	"P-DCS-Redirect": Reticulum.Parser.Enum.SIP_HDR_P_DCS_REDIRECT,
	"P-Early-Media": Reticulum.Parser.Enum.SIP_HDR_P_EARLY_MEDIA,
	"P-Media-Authorization": Reticulum.Parser.Enum.SIP_HDR_P_MEDIA_AUTHORIZATION,
	"P-Preferred-Identity": Reticulum.Parser.Enum.SIP_HDR_P_PREFERRED_IDENTITY,
	"P-Profile-Key": Reticulum.Parser.Enum.SIP_HDR_P_PROFILE_KEY,
	"P-Refused-URI-List": Reticulum.Parser.Enum.SIP_HDR_P_REFUSED_URI_LIST,
	"P-Server-User": Reticulum.Parser.Enum.SIP_HDR_P_SERVED_USER,
	"P-User-Database": Reticulum.Parser.Enum.SIP_HDR_P_USER_DATABASE,
	"P-Visited-Network-ID": Reticulum.Parser.Enum.SIP_HDR_P_VISITED_NETWORK_ID,
	"Path": Reticulum.Parser.Enum.SIP_HDR_PATH,
	"Permission-Missing": Reticulum.Parser.Enum.SIP_HDR_PERMISSION_MISSING,
	"Priority": Reticulum.Parser.Enum.SIP_HDR_PRIORITY,
	"Priv-Answer-Mode": Reticulum.Parser.Enum.SIP_HDR_PRIV_ANSWER_MODE,
	"Privacy": Reticulum.Parser.Enum.SIP_HDR_PRIVACY,
	"Proxy-Authenticate": Reticulum.Parser.Enum.SIP_HDR_PROXY_AUTHENTICATE,
	"Proxy-Authorization": Reticulum.Parser.Enum.SIP_HDR_PROXY_AUTHORIZATION,
	"Proxy-Require": Reticulum.Parser.Enum.SIP_HDR_PROXY_REQUIRE,
	"Rack": Reticulum.Parser.Enum.SIP_HDR_RACK,
	"Reason": Reticulum.Parser.Enum.SIP_HDR_REASON,
	"Record-Route": Reticulum.Parser.Enum.SIP_HDR_RECORD_ROUTE,
	"Refer-Sub": Reticulum.Parser.Enum.SIP_HDR_REFER_SUB,
	"Refer-To": Reticulum.Parser.Enum.SIP_HDR_REFER_TO,
	"Refered-By": Reticulum.Parser.Enum.SIP_HDR_REFERRED_BY,
	"Reject-Contact": Reticulum.Parser.Enum.SIP_HDR_REJECT_CONTACT,
	"Replaces": Reticulum.Parser.Enum.SIP_HDR_REPLACES,
	"Reply-To": Reticulum.Parser.Enum.SIP_HDR_REPLY_TO,
	"Request-Disposition": Reticulum.Parser.Enum.SIP_HDR_REQUEST_DISPOSITION,
	"Require": Reticulum.Parser.Enum.SIP_HDR_REQUIRE,
	"Resource-Priority": Reticulum.Parser.Enum.SIP_HDR_RESOURCE_PRIORITY,
	"Response-Key": Reticulum.Parser.Enum.SIP_HDR_RESPONSE_KEY,
	"Retry-After": Reticulum.Parser.Enum.SIP_HDR_RETRY_AFTER,
	"Route": Reticulum.Parser.Enum.SIP_HDR_ROUTE,
	"RSeq": Reticulum.Parser.Enum.SIP_HDR_RSEQ,
	"Security-Client": Reticulum.Parser.Enum.SIP_HDR_SECURITY_CLIENT,
	"Security-Server": Reticulum.Parser.Enum.SIP_HDR_SECURITY_SERVER,
	"Security-Verify": Reticulum.Parser.Enum.SIP_HDR_SECURITY_VERIFY,
	"Server": Reticulum.Parser.Enum.SIP_HDR_SERVER,
	"Service-Route": Reticulum.Parser.Enum.SIP_HDR_SERVICE_ROUTE,
	"Session-Expires": Reticulum.Parser.Enum.SIP_HDR_SESSION_EXPIRES,
	"SIP-ETag": Reticulum.Parser.Enum.SIP_HDR_SIP_ETAG,
	"SIP-If-Match": Reticulum.Parser.Enum.SIP_HDR_SIP_IF_MATCH,
	"Subject": Reticulum.Parser.Enum.SIP_HDR_SUBJECT,
	"Subscription-State": Reticulum.Parser.Enum.SIP_HDR_SUBSCRIPTION_STATE,
	"Supported": Reticulum.Parser.Enum.SIP_HDR_SUPPORTED,
	"Target-Dialog": Reticulum.Parser.Enum.SIP_HDR_TARGET_DIALOG,
	"Timestamp": Reticulum.Parser.Enum.SIP_HDR_TIMESTAMP,
	"To": Reticulum.Parser.Enum.SIP_HDR_TO,
	"Trigger-Consent": Reticulum.Parser.Enum.SIP_HDR_TRIGGER_CONSENT,
	"Unsupported": Reticulum.Parser.Enum.SIP_HDR_UNSUPPORTED,
	"User-Agent": Reticulum.Parser.Enum.SIP_HDR_USER_AGENT,
	"Via": Reticulum.Parser.Enum.SIP_HDR_VIA,
	"Warning": Reticulum.Parser.Enum.SIP_HDR_WARNING,
	"WWW-Authenticate": Reticulum.Parser.Enum.SIP_HDR_WWW_AUTHENTICATE,
};

Reticulum.Parser.Arrays.Headers = [
	"Accept", //SIP_HDR_ACCEPT
	"Accept-Contact", //SIP_HDR_ACCEPT_CONTACT
	"Accept-Encoding", //SIP_HDR_ACCEPT_ENCODING
	"Accept-Language", //SIP_HDR_ACCEPT_LANGUAGE
	"Accept-Resource-Priority", //SIP_HDR_ACCEPT_RESOURCE_PRIORITY
	"Alert-Info", //SIP_HDR_ALERT_INFO
	"Allow", //SIP_HDR_ALLOW
	"Allow-Events", //SIP_HDR_ALLOW_EVENTS
	"Answer-Mode", //SIP_HDR_ANSWER_MODE
	"Authentication-Info", //SIP_HDR_AUTHENTICATION_INFO
	"Authorization", //SIP_HDR_AUTHORIZATION
	"Call-ID", //SIP_HDR_CALL_ID
	"Call-Info", //SIP_HDR_CALL_INFO
	"Contact", //SIP_HDR_CONTACT
	"Content-Disposition", //SIP_HDR_CONTENT_DISPOSITION
	"Content-Encoding", //SIP_HDR_CONTENT_ENCODING
	"Content-Language", //SIP_HDR_CONTENT_LANGUAGE
	"Content-Length", //SIP_HDR_CONTENT_LENGTH
	"Content-Type", //SIP_HDR_CONTENT_TYPE
	"CSeq", //SIP_HDR_CSEQ
	"Date", //SIP_HDR_DATE
	"Encryption", //SIP_HDR_ENCRYPTION
	"Error-Info", //SIP_HDR_ERROR_INFO
	"Event", //SIP_HDR_EVENT
	"Expires", //SIP_HDR_EXPIRES
	"Flow-Timer", //SIP_HDR_FLOW_TIMER
	"From", //SIP_HDR_FROM
	"Hide", //SIP_HDR_HIDE
	"History-Info", //SIP_HDR_HISTORY_INFO
	"Identity", //SIP_HDR_IDENTITY
	"Identity-Info", //SIP_HDR_IDENTITY_INFO
	"In-Reply-To", //SIP_HDR_IN_REPLY_TO
	"Join", //SIP_HDR_JOIN
	"Max-Breadth", //SIP_HDR_MAX_BREADTH
	"Max-Forwards", //SIP_HDR_MAX_FORWARDS
	"MIME-Version", //SIP_HDR_MIME_VERSION
	"Min-Expires", //SIP_HDR_MIN_EXPIRES
	"Min-SE", //SIP_HDR_MIN_SE
	"Organization", //SIP_HDR_ORGANIZATION
	"P-Access-Network-Info", //SIP_HDR_P_ACCESS_NETWORK_INFO
	"P-Answer-State", //SIP_HDR_P_ANSWER_STATE
	"P-Asserted-Identity", //SIP_HDR_P_ASSERTED_IDENTITY
	"P-Associated-URI", //SIP_HDR_P_ASSOCIATED_URI
	"P-Called-Party-ID", //SIP_HDR_P_CALLED_PARTY_ID
	"P-Charging-Function-Addresses", //SIP_HDR_P_CHARGING_FUNCTION_ADDRESSES
	"P-Charging-Vector", //SIP_HDR_P_CHARGING_VECTOR
	"P-DCS-Trace-Party-ID", //SIP_HDR_P_DCS_TRACE_PARTY_ID
	"P-DCS-OSPS", //SIP_HDR_P_DCS_OSPS
	"P-DCS-Billing-Info", //SIP_HDR_P_DCS_BILLING_INFO
	"P-DCS-LAES", //SIP_HDR_P_DCS_LAES
	"P-DCS-Redirect", //SIP_HDR_P_DCS_REDIRECT
	"P-Early-Media", //SIP_HDR_P_EARLY_MEDIA
	"P-Media-Authorization", //SIP_HDR_P_MEDIA_AUTHORIZATION
	"P-Preferred-Identity", //SIP_HDR_P_PREFERRED_IDENTITY
	"P-Profile-Key", //SIP_HDR_P_PROFILE_KEY
	"P-Refused-URI-List", //SIP_HDR_P_REFUSED_URI_LIST
	"P-Server-User", //SIP_HDR_P_SERVED_USER
	"P-User-Database", //SIP_HDR_P_USER_DATABASE
	"P-Visited-Network-ID", //SIP_HDR_P_VISITED_NETWORK_ID
	"Path", //SIP_HDR_PATH
	"Permission-Missing", //SIP_HDR_PERMISSION_MISSING
	"Priority", //SIP_HDR_PRIORITY
	"Priv-Answer-Mode", //SIP_HDR_PRIV_ANSWER_MODE
	"Privacy", //SIP_HDR_PRIVACY
	"Proxy-Authenticate", //SIP_HDR_PROXY_AUTHENTICATE
	"Proxy-Authorization", //SIP_HDR_PROXY_AUTHORIZATION
	"Proxy-Require", //SIP_HDR_PROXY_REQUIRE
	"Rack", //SIP_HDR_RACK
	"Reason", //SIP_HDR_REASON
	"Record-Route", //SIP_HDR_RECORD_ROUTE
	"Refer-Sub", //SIP_HDR_REFER_SUB
	"Refer-To", //SIP_HDR_REFER_TO
	"Refered-By", //SIP_HDR_REFERRED_BY
	"Reject-Contact", //SIP_HDR_REJECT_CONTACT
	"Replaces", //SIP_HDR_REPLACES
	"Reply-To", //SIP_HDR_REPLY_TO
	"Request-Disposition", //SIP_HDR_REQUEST_DISPOSITION
	"Require", //SIP_HDR_REQUIRE
	"Resource-Priority", //SIP_HDR_RESOURCE_PRIORITY
	"Response-Key", //SIP_HDR_RESPONSE_KEY
	"Retry-After", //SIP_HDR_RETRY_AFTER
	"Route", //SIP_HDR_ROUTE
	"RSeq", //SIP_HDR_RSEQ
	"Security-Client", //SIP_HDR_SECURITY_CLIENT
	"Security-Server", //SIP_HDR_SECURITY_SERVER
	"Security-Verify", //SIP_HDR_SECURITY_VERIFY
	"Server", //SIP_HDR_SERVER
	"Service-Route", //SIP_HDR_SERVICE_ROUTE
	"Session-Expires", //SIP_HDR_SESSION_EXPIRES
	"SIP-ETag", //SIP_HDR_SIP_ETAG
	"SIP-If-Match", //SIP_HDR_SIP_IF_MATCH
	"Subject", //SIP_HDR_SUBJECT
	"Subscription-State", //SIP_HDR_SUBSCRIPTION_STATE
	"Supported", //SIP_HDR_SUPPORTED
	"Target-Dialog", //SIP_HDR_TARGET_DIALOG
	"Timestamp", //SIP_HDR_TIMESTAMP
	"To", //SIP_HDR_TO
	"Trigger-Consent", //SIP_HDR_TRIGGER_CONSENT
	"Unsupported", //SIP_HDR_UNSUPPORTED
	"User-Agent", //SIP_HDR_USER_AGENT
	"Via", //SIP_HDR_VIA
	"Warning", //SIP_HDR_WARNING
	"WWW-Authenticate", //SIP_HDR_WWW_AUTHENTICATE
];

var sipmsg1 = [
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
].join("\r\n");

var sipmsg2 = [
"REGISTER sip:registrar.biloxi.com SIP/2.0",
"Via: SIP/2.0/UDP bobspc.biloxi.com:5060;branch=z9hG4bKnashds7",
"Max-Forwards: 70",
"To: Bob <sip:bob@biloxi.com>",
"From: Bob <sip:bob@biloxi.com>;tag=456248",
"Call-ID: 843817637684230@998sdasdh09",
"CSeq: 1826 REGISTER",
"Contact: <sip:bob@192.0.2.4>",
"Expires: 7200",
"Content-Length: 0",
"",
"",
].join("\r\n");

var sipmsg3 = [
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
].join("\r\n");

var sipmsg4 = [
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
].join("\r\n");

var sipmsg5 = [
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
].join("\r\n");

var sipmsg6 = [
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
].join("\r\n");

var sipmsg7 = [
"INVITE sip:bob@u2.biloxi.com SIP/2.0",
"Record-Route: <sip:p2.biloxi.com;lr>",
"Record-Route: <sip:p1.atlanta.com;lr>",
"From: \"Alice Ana\" <sip:alice@atlanta.com>;tag=1354385",
"To: \"Bob\" <sip:bob@biloxi.com>",
"Call-ID: xyz",
"CSeq: 1 INVITE",
"Contact: <sip:alice@u1.atlanta.com>",
"",
"",
].join("\r\n");

Reticulum.Parser.TestFormatURI = "sip:user:password@host:port;uri-parameters?headers";

Reticulum.Parser.getHeaderId = function(name) {
	if (name.length === 0)
		return this.Enum.SIP_HDR_NONE;

	var id = Reticulum.Parser.Hashes.Headers[name];

	if (id)
		return id;

	/* compact headers */
	switch (name[0].toLowerCase()) {

	case 'a': return this.Enum.SIP_HDR_ACCEPT_CONTACT;
	case 'b': return this.Enum.SIP_HDR_REFERRED_BY;
	case 'c': return this.Enum.SIP_HDR_CONTENT_TYPE;
	case 'd': return this.Enum.SIP_HDR_REQUEST_DISPOSITION;
	case 'e': return this.Enum.SIP_HDR_CONTENT_ENCODING;
	case 'f': return this.Enum.SIP_HDR_FROM;
	case 'i': return this.Enum.SIP_HDR_CALL_ID;
	case 'j': return this.Enum.SIP_HDR_REJECT_CONTACT;
	case 'k': return this.Enum.SIP_HDR_SUPPORTED;
	case 'l': return this.Enum.SIP_HDR_CONTENT_LENGTH;
	case 'm': return this.Enum.SIP_HDR_CONTACT;
	case 'n': return this.Enum.SIP_HDR_IDENTITY_INFO;
	case 'o': return this.Enum.SIP_HDR_EVENT;
	case 'r': return this.Enum.SIP_HDR_REFER_TO;
	case 's': return this.Enum.SIP_HDR_SUBJECT;
	case 't': return this.Enum.SIP_HDR_TO;
	case 'u': return this.Enum.SIP_HDR_ALLOW_EVENTS;
	case 'v': return this.Enum.SIP_HDR_VIA;
	case 'x': return this.Enum.SIP_HDR_SESSION_EXPIRES;
	case 'y': return this.Enum.SIP_HDR_IDENTITY;
	default:  return this.Enum.SIP_HDR_NONE;
	}
};


Reticulum.Parser.isCommaSeparatedHeader = function(id) {
	switch (id) {

	case this.Enum.SIP_HDR_ACCEPT:
	case this.Enum.SIP_HDR_ACCEPT_CONTACT:
	case this.Enum.SIP_HDR_ACCEPT_ENCODING:
	case this.Enum.SIP_HDR_ACCEPT_LANGUAGE:
	case this.Enum.SIP_HDR_ACCEPT_RESOURCE_PRIORITY:
	case this.Enum.SIP_HDR_ALERT_INFO:
	case this.Enum.SIP_HDR_ALLOW:
	case this.Enum.SIP_HDR_ALLOW_EVENTS:
	case this.Enum.SIP_HDR_AUTHENTICATION_INFO:
	case this.Enum.SIP_HDR_CALL_INFO:
	case this.Enum.SIP_HDR_CONTACT:
	case this.Enum.SIP_HDR_CONTENT_ENCODING:
	case this.Enum.SIP_HDR_CONTENT_LANGUAGE:
	case this.Enum.SIP_HDR_ERROR_INFO:
	case this.Enum.SIP_HDR_HISTORY_INFO:
	case this.Enum.SIP_HDR_IN_REPLY_TO:
	case this.Enum.SIP_HDR_P_ASSERTED_IDENTITY:
	case this.Enum.SIP_HDR_P_ASSOCIATED_URI:
	case this.Enum.SIP_HDR_P_EARLY_MEDIA:
	case this.Enum.SIP_HDR_P_MEDIA_AUTHORIZATION:
	case this.Enum.SIP_HDR_P_PREFERRED_IDENTITY:
	case this.Enum.SIP_HDR_P_REFUSED_URI_LIST:
	case this.Enum.SIP_HDR_P_VISITED_NETWORK_ID:
	case this.Enum.SIP_HDR_PATH:
	case this.Enum.SIP_HDR_PERMISSION_MISSING:
	case this.Enum.SIP_HDR_PROXY_REQUIRE:
	case this.Enum.SIP_HDR_REASON:
	case this.Enum.SIP_HDR_RECORD_ROUTE:
	case this.Enum.SIP_HDR_REJECT_CONTACT:
	case this.Enum.SIP_HDR_REQUEST_DISPOSITION:
	case this.Enum.SIP_HDR_REQUIRE:
	case this.Enum.SIP_HDR_RESOURCE_PRIORITY:
	case this.Enum.SIP_HDR_ROUTE:
	case this.Enum.SIP_HDR_SECURITY_CLIENT:
	case this.Enum.SIP_HDR_SECURITY_SERVER:
	case this.Enum.SIP_HDR_SECURITY_VERIFY:
	case this.Enum.SIP_HDR_SERVICE_ROUTE:
	case this.Enum.SIP_HDR_SUPPORTED:
	case this.Enum.SIP_HDR_TRIGGER_CONSENT:
	case this.Enum.SIP_HDR_UNSUPPORTED:
	case this.Enum.SIP_HDR_VIA:
	case this.Enum.SIP_HDR_WARNING:
		return true;

	default:
		return false;
	}
};

Reticulum.Parser.parseHost = function(data) {
	var host = new Reticulum.SIP.Host();

	/* Try IPv6 first */
	var re = /\[([0-9a-f:]+)\][:]*([0-9]*)/;
	var result = re.exec(data);

	host.isipv6 = true;

	if (result === null)
	{
		var re2 = /([^:]+)[:]*([0-9]*)/;
		result = re2.exec(data);

		if (result === null)
		{
			return null;
		}

		host.isipv6 = false;
	}

	host.name = result[1];
	host.port = result[2];

	return host;
};

Reticulum.Parser.parseURI = function(data) {
	var uri = new Reticulum.SIP.URI();

	var re = /([^:]+):([^@:]*)[:]*([^@]*)@([^;? ]+)([^?]*)([^]*)/;
	var result = re.exec(data);

	var hostPort = "";

	// TODO: check the less then 4 condition
	if (result !== null && result.length > 5)
	{

		uri.scheme = result[1];
		uri.user = result[2];
		uri.password = result[3];
		hostPort = result[4];
		uri._params_string = result[5];
		uri.headers = result[6];

		uri.host = this.parseHost(hostPort);

		if (uri.host === null)
			return null;
	}
	else
	{
		//var re2 = /([^:]+):([^;? ]+)([^?]*)([^]*)/;
		var re2 = /([^:]+):\/?\/?([^;? ]+)([^?]*)([^]*)/;
		result = re2.exec(data);

		if (result === null)
			return null;

		uri.scheme = result[1];
		hostPort = result[2];
		uri._params_string = result[3];
		uri.headers = result[4];

		uri.host = this.parseHost(hostPort);

		if (uri.host === null)
			return null;
	}

	if (uri.host.port && uri.host.port !== "")
		uri.port = parseInt(uri.host.port);

	uri.params = this.parseParams(uri._params_string);

	uri.raw = data;

	return uri;
};

Reticulum.Parser.parseAddress = function(data) {
	var address = new Reticulum.SIP.Address();

	//var re = /([^ \t\r\n<]*)[ \t\r\n]*<([^>]+)>([^]*)/;
	var re = /[ \t\r\n]*([^\t\r\n<]*)[ \t\r\n]*<([^>]+)>([^]*)/;
	var result = re.exec(data);

	address.value = data;

	if (result === null)
	{
		var re2 = /([^;]+)([^]*)/;
		result = re2.exec(data);

		if (result === null)
		{
			return null;
		}

		address.auri = result[1];
		address._params_string = result[2];
	}
	else
	{
		address.dname = Utils.unquote(result[1].trim()).trim();
		address.auri = result[2];
		address._params_string = result[3];
	}

	address.uri = this.parseURI(address.auri);

	if (address.uri === null)
		return null;

	address.params = this.parseParams(address._params_string);


	return address;
};

Reticulum.Parser.parseContact = function(data) {
	var contact = new Reticulum.SIP.Contact();

	contact.address = this.parseAddress(data);
// console.log("parse Contact", contact.address.params);

	if (contact.address !== null && contact.address.params !== null)
		contact.expires = contact.address.params.expires;

	return contact;
};

Reticulum.Parser.parseCSeq = function(data) {
	var callSequence = new Reticulum.SIP.CSeq();

	var re = /([0-9]+)[ \t\r\n]+([^ \t\r\n]+)/;
	var result = re.exec(data);

	if (result === null)
		return null;

	var number = result[1];
	callSequence.method = result[2];

	if (number === null)
		return null;

	callSequence.number = parseInt(number);

	return callSequence;
};

Reticulum.Parser.parseContentType = function(data) {
	var contentType = new Reticulum.SIP.ContentType();

	var re = /([ \t\r\n]*)([^ \t\r\n;\/]+)[ \t\r\n]*\/[ \t\r\n]*([^ \t\r\n;]+)([^]*)/;
	var result = re.exec(data);

	contentType.type = result[2];
	contentType.subtype = result[3];
	contentType._params_string = result[4];

	contentType.params = this.parseParams(contentType._params_string);

	return contentType;
};

Reticulum.Parser.parseVia = function(data) {
	var via = new Reticulum.SIP.Via();

	var re = /SIP[  \t\r\n]*\/[ \t\r\n]*2.0[ \t\r\n]*\/([ \t\r\n]*[A-Z]+)[ \t\r\n]*([^; \t\r\n]+)[ \t\r\n]*([^]*)/;
	var result = re.exec(data);

	if (result === null)
		return null;

	via.transport = result[1];
	via.sentby = result[2];
	via._params_string = result[3];
	via.value = data;

	via.host = this.parseHost(via.sentby);

	if (via.host === null)
		return null;

	if (via.host.port && via.host.port !== "")
		via.port = parseInt(via.host.port);

	via.params = this.parseParams(via._params_string);
	via.branch = via.params.branch;

	if (via.branch === null)
		return null;

	return via;
};

Reticulum.Parser.parseParams = function(data) {
	var params = {};

	data.trim().split(";").forEach(function(x) {
		var y = x.trim();
		if (y !== "") {
			y = y.split("=");

			if (y.length < 2) y.push("");

			params[y[0]] = y[1];
		}
	});

	return params;
};

Reticulum.Parser.stringifyParams = function(params) {
	var string = "";

	for(var key in params) {
		string += ";" + key;
		if (params[key] !== "") string += "=" + params[key];
	}

	return string;
};

Reticulum.Parser.parseParam = function(data, name) {
	var restr = ";[ \t\r\n]*" + name + "[ \t\r\n]*=[ \t\r\n]*([^ \t\r\n;]+)";

	var re = new RegExp(restr);
	var result = re.exec(data);

	if (result === null)
		return null;

	return result[1];
};

Reticulum.Parser.parseAuthenticate = function(data) {
	var challenge = {};
	// Proxy-Authenticate: Digest realm="atlanta.example.com", qop="auth",
	// nonce="f84f1cec41e6cbe5aea9c8e88d359",
	// opaque="", stale=FALSE, algorithm=MD5
	var pos = data.indexOf(" ");
	challenge.type = data.substr(0, pos);

	data.substr(pos+1).split(",").forEach(function(el) {
		var els = el.trim().split("=");

		var val = Utils.unquote(els[1]);

		switch (els[0]) {
			case "realm":
				challenge.realm = val;
				break;
			case "domain":
				challenge.domain = val;
				break;
			case "nonce":
				challenge.nonce = val;
				break;
			case "opaque":
				challenge.opaque = val;
				break;
			case "stale":
				challenge.stale = val;
				break;
			case "algorithm":
				challenge.algorithm = val;
				break;
			case "qop":
				challenge.qop = val;
				break;
			case "qop-options":
				challenge.qop_options = val;
				break;
			case "auth-param":
				challenge.auth_param = val;
				break;
		}
	});

	return challenge;
};

Reticulum.Parser.parseAuthorization = function(data, proxy) {
	var auth = {};
	// Authorization: Digest username="bob", realm="atlanta.example.com"
	// nonce="ea9c8e88df84f1cec4341ae6cbe5a359", opaque="",
	// uri="sips:ss2.biloxi.example.com",
	// response="dfe56131d1958046689d83306477ecc"

	var pos = data.indexOf(" ");
	auth.type = data.substr(0, pos);

	data.substr(pos+1).split(",").forEach(function(el) {
		var els = el.trim().split("=");

		var val = Utils.unquote(els[1]);

		switch (els[0]) {
			case "realm":
				auth.realm = val;
				break;
			case "nonce":
				auth.nonce = val;
				break;
			case "response":
				auth.response = val;
				break;
			case "username":
				auth.username = val;
				break;
			case "uri":
				auth.uri = val;
				break;
			case "nc":
				auth.nc = val;
				break;
			case "cnonce":
				auth.cnonce = val;
				break;
			case "qop":
				auth.qop = val;
				break;
		}
	});

	return auth;
};

Reticulum.Parser.parse = function(data) {
	var message = new Reticulum.SIP.Message();

	var buffer = data;

	var re = /([^ \t\r\n]+) ([^ \t\r\n]+) ([^\r\n]*)[\r]*[\n]/;
	var result = re.exec(data);

	if (result === null)
		return null;

	message.tag = Utils.token(10, Utils.TOKEN_NUMERIC_16);
	message.raw = data;
	message.isRequest = false;

	if (result.length < 4)
		return null;

	if(result[3] == "SIP/2.0")
		message.isRequest = true;

	if (message.isRequest) {
		message.method = result[1];
		message.remoteURI = result[2];
		message.version = result[3];

		message.uri = this.parseURI(result[2]);

		if (!message.uri)
			return null;

	} else {
		message.version = result[1];
		message.statusCode = parseInt(result[2]);
		message.reason = result[3];

		if(!message.statusCode)
			return null;
	}

	var p = 0;//result[0].length; // position
	var l = buffer.length; // length

	l -= result[0].length;
	p = result[0].length;

	var name = {};
	var v, cv, ws, lf;
	name.p = v = cv = null;
	name.l = ws = lf = 0;
	var comsep = false;
	var quote = false;

	var id = this.Enum.SIP_HDR_NONE;

	for (; l > 0; p++, l--) {
		switch (buffer[p]) {

		case ' ':
		case '\t':
			lf = 0; // folding
			++ws;
			break;

		case '\r':
			++ws;
			break;

		case '\n':
			++ws;

			if (!(lf++))
				break;

			++p; --l; // eoh

			// FALLTHROUGH

		default:
			if (lf || (buffer[p] == ',' && comsep && !quote)) {

				if (!name.l) {
					return null;
				}

				message.addHeader(buffer.substr(name.p, name.l), id, buffer.substr(cv ? cv : p, cv ? p - cv - ws : 0));

				if (!lf) { // comma separated
					cv = null;
					break;
				}

				if (cv != v) {
					message.addHeader(buffer.substr(name.p, name.l), id, buffer.substr(v ? v : p, v ? p - v - ws : 0));
				}

				if (lf > 1) { // eoh
					message.pos = p;
					return message;
				}

				comsep = false;
				name.p = null;
				cv = v = null;
				lf = 0;
			}

			if (!name.p) {
				name.p = p;
				name.l = 0;
				ws = 0;
			}

			if (!name.l) {
				if (buffer[p] != ':') {
					ws = 0;
					break;
				}

				name.l = Math.max((p - name.p - ws), 0);

				if (!name.l) {
					return null;
				}

				id = this.getHeaderId(buffer.substr(name.p, name.l));
				comsep = this.isCommaSeparatedHeader(id);

				break;
			}

			if (!cv) {
				quote = false;
				cv = p;
			}

			if (!v) {
				v = p;
			}

			if (buffer[p] == '"')
				quote = !quote;

			ws = 0;
			break;
		}
	}

	return message;
};

var parser = Reticulum.Parser;
