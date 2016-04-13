# Testing project

## Testing with sip2sip proxy

[SIP2SIP](https://mdns.sipthor.net/register_sip_account.phtml)

wss://ns313841.ovh.net:14062

### Credentials

#### User A

**Username:** ana_retic@sip2siip.info
**Password:** apass

#### User B

**Username:** bob_retic@sip2sip.info
**Password:** bpass

## SIPml5 Testing with Reticulum Proxy

[SIPml5](https://www.doubango.org/sipml5/call.htm?svn=250#)

### Settings

**WebSocket Server URL:** wss://10.1.80.105:7000

#### User A

**Display Name:** Ana RTC
**Private Identity:** ana
**Public Identity:** sip:ana@reticulum.local
**Password:** apass
**Realm*:** reticulum.local

#### User B

**Display Name:** Bob RTC
**Private Identity:** bob
**Public Identity:** sip:bob@reticulum.local
**Password:** bpass
**Realm*:** reticulum.local


## JsSIP Testing with Reticulum Proxy

## RFCs

[RFC3261](https://tools.ietf.org/html/rfc3261)
[RFC3665](https://tools.ietf.org/html/rfc3665)
[RFC6026](https://tools.ietf.org/html/rfc6026)
https://tools.ietf.org/html/draft-ietf-sipcore-sip-websocket-09
[RFC7118](https://tools.ietf.org/html/rfc7118)

[RFC6455](http://tools.ietf.org/html/rfc6455)

[RFC4028](https://tools.ietf.org/html/rfc4028)
[RFC5658](https://tools.ietf.org/html/rfc5658)

https://tools.ietf.org/html/draft-kaplan-rtcweb-sip-interworking-requirements-02



## Results

### Retiulum vs JsSIP

Issue with JsSIP unable to create Websocket connect on Chrome (OSX)

#### JsSIP to Reticulum call

Call fails on JsSIP side after 200 OK (Answer)

**ERROR:** JsSIP:RTCSession unable to create a Dialog without Contact header field +1ms


#### Reticulum to JsSIP call

Call fails on JsSIP side after INVITE

**ERROR:**

JsSIP:Transport sending WebSocket message:
SIP/2.0 416 Unsupported URI Scheme

**Reason:** JsSIP does not support SIPS URI Scheme
