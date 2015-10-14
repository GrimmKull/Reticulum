# Reticulum

To start the Reticulum server use:
```
./run.sh
```

## Diagrams

[Diagrams](https://bramp.github.io/js-sequence-diagrams/)

```
Title: Call 1
A->>Proxy: Invite
Proxy->>A: 100 Trying
Proxy->>B: Invite

B->>Proxy: 180 Ringing
Proxy->>A: 180 Ringing

B->>Proxy: 200 OK
Proxy->>A: 200 OK

A-->>B: ACK
```

## Proxy TODO

 * [ ] Connections handling
 * [ ] Authorization
 * [ ] DNS resolution for Addresses
 * [ ] Multiple proxy support
 * [ ] Fix routing
 * [ ] Fix multiple 404 being sent on timeout
 * [ ] Implement unregister `Expires: 0`
 * [ ] Create a separate admin WebSocket which will display logging information sent as json that will contain message with its to, from and context, contacts, contexts, clients, users ...

## ACK and non 2xx final repsonses handling

from : SIP: Understanding the Session Initiation Protocol

### Acknowledgment of Messages

Most SIP requests are end-to-end messages between user agents. Proxies between the two user agents simply forward the messages they receive and rely on the user agents to generate acknowledgments or responses. There are some exceptions to this general rule. The CANCEL method (used to terminate pending calls or searches and discussed in detail in Section 4.1.5) is a hop-by-hop request. A proxy receiving a CANCEL immediately sends a 200 OK response back to the sender and generates a new CANCEL, which is then forwarded in the next hop to the same set of destinations as the original request. (The order of sending the 200 OK and forwarding the CANCEL is not important.) This is shown in Figure 3.4. Other exceptions to this rule include 3xx, 4xx, 5xx, and 6xx responses to an INVITE request. While an ACK to a 2xx response is generated by the end point, a 3xx, 4xx, 5xx, or 6xx response is acknowledged on a hop-by-hop basis. A proxy server receiving one of these responses immediately generates an ACK back to the sender and forwards the response to the next hop. This type of hop-byhop acknowledgment is shown in Figure 4.2. ACK messages are only sent to acknowledge responses to INVITE requests. For responses to all other request types, there is no acknowledgment. A lost response is detected by the UAS when the request is retransmitted.


## Client TODO

 * [ ] Auth

## Example application - Interphone

 * [ ] register `reticulum:` protocol in chrome extension
 * [ ] create golang app that handles a GrovePI button press and calls `reticulum://call?home@reticulum.local`
 * [ ] handle `reticulum:` protocol calls in webphone

## Status

![status](https://img.shields.io/badge/reticulum server-80%25-green.svg?style=flat-square)

![status](https://img.shields.io/badge/reticulum client-23%25-orange.svg?style=flat-square)


## Resources

 * [Faye WS](https://github.com/faye/faye-websocket-ruby)  
 * [P2P SIP](https://github.com/theintencity/p2p-sip)  
 * [SIP](https://github.com/kirm/sip.js)  


## Notes

Using thin server to run the proxy is a must.

A new function needs to be added to the Thin server code in `gems/thin-1.6.3/lib/thin/connection.rb`

```ruby
def remote_port
    peer = get_peername
    Socket.unpack_sockaddr_in(peer)[0] if peer
end
```

in order to get the port number for remote connection.

Can't use google for registrations since the device might not be connected to internet.
Additional problem might be 2 factor authentication.
