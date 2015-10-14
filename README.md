# Reticulum

WebRTC Webphone with SIP Proxy implemented on Raspberry Pi platform.

![LOGO](https://raw.githubusercontent.com/GrimmKull/Reticulum/github/client/icons/dark%20icon_128.png)

## Status

![status](https://img.shields.io/badge/reticulum proxy-90%25-green.svg?style=flat-square)

![status](https://img.shields.io/badge/reticulum webphone-80%25-green.svg?style=flat-square)


## Launching SIP Proxy and Webphone static file hosting

To start the Reticulum server use:

```bash
./run.sh
```

When running on Windows make sure that the ruby gems have been installed with `openssl` support.

For detailed deployment and setup instructions take a look at [SETUP.md](https://github.com/GrimmKull/Reticulum/blob/github/SETUP.md) file.

## Using the webphone

Navigate to: https://$IP_ADDRESS:7000/index.html?#  
where `$IP_ADDRESS` is the address of the machine where Reticulum Proxy is hosted. Click on `Connect` to make a WebSocket connection to Reticulum Proxy and to get the Media from your microphone and webcam. Once the video from webcam shows up in the lower right corner click `Register`. Congratulations you can now make a call to another registered Reticulum user.

## Admin page

Navigate to: https://$IP_ADDRESS:7000/admin.html?#  
in order to access the Admin page. This page allows you to view SIP message flow, view all transactions and their states on Proxy and create new users.

## Creating new users

Reticulum has several users created by default to be used for testing.
Navigate to users tab on Admin page and click `Register` to add another user.

## Default test users for Reticulum

| username | password |
|----------|----------|
| ana      | apass    |
| bob      | bpass    |

## User DB

Create the user DB storage:

```sql
CREATE DATABASE reticulum;

CREATE TABLE user (
    id INT AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password VARCHAR(250) NOT NULL,
    PRIMARY KEY(id)
);
```

## Resources

 * [Faye WS](https://github.com/faye/faye-websocket-ruby)  
 * [P2P SIP](https://github.com/theintencity/p2p-sip)  
 * [SIP](https://github.com/kirm/sip.js)  
 * [libre](http://www.creytiv.com/re.html)
 * [baresip](http://www.creytiv.com/baresip.html)
 * [sipml5](https://github.com/DoubangoTelecom/sipml5)

## STUN server issues

[Trickle example ](http://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/)

To test total time for ICE candidates look at the link above.

Usually getting the candidates takes about 9 seconds regardless of the configuration parameters on Windows machine.

On OSX machine getting the candidates is much faster.

## Admin page diagrams example

There might be performance issues when using the Admin after many calls have been made. Rendering diagrams in such a case can be extremely resource consuming.

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
