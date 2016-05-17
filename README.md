# Reticulum

WebRTC Webphone with SIP Proxy implemented on Raspberry Pi platform.

![LOGO](https://raw.githubusercontent.com/GrimmKull/Reticulum/master/client/icons/dark%20icon_128.png)

## Status

![status](https://img.shields.io/badge/reticulum proxy-98%25%20done-brightgreen.svg?style=flat-square&logoWidth=30)

![status](https://img.shields.io/badge/reticulum webphone-95%25%20done-green.svg?style=flat-square&logoWidth=5)

Try it out at [reticulum.outbox.systems](https://reticulum.outbox.systems/?#).

## Browser support

Currently Reticulum supports only the latest Chrome browser on desktop and mobile.

Please note that mobile version still has same issues with website responsive layout and might be difficult to use.

Firefox and Opera support coming soon.

## Launching SIP Proxy and Webphone static file hosting

To start the Reticulum server use:

```bash
./run.sh
```

To stop the Reticulum server use:

```bash
./stop.sh
```

When running on Windows make sure that the ruby gems have been installed with `openssl` support.

For detailed deployment and setup instructions take a look at [SETUP.md](https://github.com/GrimmKull/Reticulum/blob/master/SETUP.md) file.

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

## Building single JavaScript webphone file

To combine all Webphone source files use `gulp`.

### Install gulp

Inside the builds folder run the following commands:

```
npm install gulp
npm install gulp-concat gulp-rename gulp-uglify
```

To start the default `gulp` task and concatenate all JavaScript files call:

```
gulp
```

This will create a file `reticulum_phone.js` in the `builds/build` folder. To use this file copy it to the `client` folder, comment all other source files in `index.html` and uncomment the following line:

```html
<script type="text/javascript" src="reticulum_phone.js"></script>
```


To create a single uglified Javascript file with null media call:

```
gulp node
```

This will create a file `reticulum_node_phone.min.js` in the `builds/build` folder.

**NOTE:** Null media build can be used for testing the SIP stack since it will not reference the WebRTC and media components nor will it add SDP payload to SIP messages.

## Using NGINX as reverse proxy

If you checkout the code for Reticulum to `/var/www/` folder on your server you can use the following configuration to use NGINX as the proxy. NGINX will host your static files and proxy all WebSocket requests on https://your.comain.com/ws to Reticulum. To see an example of this configuration in action go to [reticulum.outbox.systems](https://reticulum.outbox.systems/?#).


```
upstream reticulum {
    server 0.0.0.0:7000;
}

server {
    listen 443 ssl;

    # The host name to respond to
    server_name your.domain.com;

    ssl_certificate /home/user/path_to_certs/certificates/your.domain.crt;
    ssl_certificate_key /home/user/path_to_certs/certificates/your.domain.key;

    # Logs
    access_log /var/log/your.domain.log;

    # Path for static files
    root /var/www/reticulum/client;
    index index.html;

    #Specify a charset
    charset utf-8;

    # WS conf
    location /ws {
        proxy_pass https://reticulum/ws;
        proxy_http_version 1.1;

        add_header Access-Control-Allow-Origin *;

        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Upgrade websocket;
        proxy_set_header Connection Upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Sec-WebSocket-Protocol $http_sec_websocket_protocol;

        proxy_read_timeout 86400;
        proxy_redirect off;
        break;
    }
}
```

## Resources

 * [Faye WS](https://github.com/faye/faye-websocket-ruby)
 * [P2P SIP](https://github.com/theintencity/p2p-sip)
 * [SIP.js](https://github.com/onsip/SIP.js)
 * [SIP](https://github.com/kirm/sip.js)
 * [libre](http://www.creytiv.com/re.html)
 * [baresip](http://www.creytiv.com/baresip.html)
 * [sipml5](https://github.com/DoubangoTelecom/sipml5)
 * [JsSIP](https://github.com/versatica/JsSIP)

## JsSIP support and interoperability

To test the JsSIP support go to [tryit.jssip.net](https://tryit.jssip.net/)

**WARNING:** Handshake errors with WebSocket connection in JsSIP you may encounter are probably caused by the fact you are using a different, possibly unsigned, certificate with your Reticulum proxy then the one on [tryit.jssip.net](https://tryit.jssip.net/). This error usually appears on OSX.

Reticulum supports JsSIP as a client. You can use it to communicate between different instances of JsSIP client and with Reticulum webphone. Use the example bellow

![JsSIP config example](http://photos.lishich.com/figures/jssip_ana.jpg)

as a configuration template.

## sipml5 support and interoperability

To test the sipml5 support go to [sipml5 call](https://www.doubango.org/sipml5/call.htm?svn=250)

**WARNING:** Handshake errors with WebSocket connection in sipml5 you may encounter are probably caused by the fact you are using a different, possibly unsigned, certificate with your Reticulum proxy then the one on [sipml5 call](https://www.doubango.org/sipml5/call.htm?svn=250). This error usually appears on OSX.

Reticulum supports sipml5 as a client. You can use it to communicate between different instances of sipml5 client and with Reticulum webphone. Use the examples bellow as a configuration template.

![sipml5 config example](http://photos.lishich.com/figures/sipml5_ana.jpg)

To configure sipml5 to use Websocket connection to an instance of Reticulum proxy click on the **Expert mode?** button and use the following example configuration:

![sipml5 advanced config example](http://photos.lishich.com/figures/sipml5_settings.jpg)


## STUN server issues

[Trickle example](http://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/)

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

## Running WS stress test

```bash
npm install -g thor
```

Add support for SIP messages to `Thor` by adding the `protocol: "sip"` line to `mjolnir.js`:

```javascript
var socket = new Socket(task.url, {
	protocolVersion: protocol,
	protocol: "sip"
});
```

Run `Thor` with the following command:

```bash
thor --amount 1000 --messages 1 --masked wss://$IP_ADDRESS:7000
```

Make sure to add a unique SIP Register message generator to generator.js
