var Media = function (audio, video) {
	this.to = null;
	this.uri = null;
	this.localVideo = null;
	this.remoteVideo = null;
	this.localStream = null;
	this.remoteStream = null;
	this.localSDP = null;
    this.remoteSDP = null;
	this.peerConnection = null;
	this.candidates = [];
	this.peerConnectionConfig = {
		'iceServers': [{
			'url': 'stun:stun.services.mozilla.com'
		}, {
			'url': 'stun:stun.l.google.com:19302'
		}]
	};

	this.audio = audio;
	this.video = video;

	this.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
	this.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
	this.RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate;
	this.RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;

    var self = this;

	this.gotUserMedia = function(stream) {
		console.log('got media', stream);
		self.localStream = stream;
		self.localVideo.src = window.URL.createObjectURL(stream);

		//TODO: enable call and answer
        self.start();
	};

    this.gotDescription = function(description) {
		console.log('got description');
	};

    this.handleOffer = null;
    this.handleAnswer = null

	this.gotIceCandidate = function(event) {
		if (event.candidate === null) {
			console.log("handle answer or call")
			if (self.to === null) {
				self.handleAnswer();
			} else {
				self.handleOffer(self.to, self.uri);
				self.to = null;
				self.uri = null;
			}
		}
		//console.log("got ice c", event.candidate);
    };

    this.gotRemoteStream = function(event) {
		console.log("got remote stream");
		self.remoteStream = event.stream;
		self.remoteVideo.src = window.URL.createObjectURL(event.stream);

		self.remoteStream.onended = function() {
			self.remoteVideo.src = "";
			console.log("REMOTE ended");

			self.start();
		};
	};

	this.onRemoveStream = function(event) {
		console.log("lost stream");

		self.start();
	};
};

Media.prototype.setVideoContainersIDs = function(local, remote) {
	this.localVideo = document.getElementById(local);
	this.remoteVideo = document.getElementById(remote);
};

Media.prototype.checkSupport = function() {
	if (!this.getUserMedia) {
		console.log('getUserMedia not supported');
		return false;
	}

	if (!this.RTCPeerConnection) {
		console.log('RTCPeerConnection not supported');
		return false;
	}

	if (!this.RTCIceCandidate) {
		console.log('RTCIceCandidate not supported');
		return false;
	}

	if (!this.RTCSessionDescription) {
		console.log('RTCSessionDescription not supported');
		return false;
	}

	console.log("All supported.");
	return true;
};

Media.prototype.getMedia = function() {
	this.getUserMedia.call(navigator, {audio : this.audio, video : this.video}, this.gotUserMedia, this.log);
};

Media.prototype.getLocalSDP = function() {
	var sdp = this.peerConnection.localDescription.sdp;

	//if (sdp === "") return null;

	return sdp;
};

Media.prototype.start = function() {
	console.log("media start", this.localStream);

	this.peerConnection = new this.RTCPeerConnection(this.peerConnectionConfig);
	this.peerConnection.onicecandidate = this.gotIceCandidate;
	this.peerConnection.addStream(this.localStream);
	this.peerConnection.onaddstream = this.gotRemoteStream;
	this.peerConnection.onremovestream = this.onRemoveStream;

	/*if (isCaller) {

	} else {
		this.peerConnection.createAnswer(this.gotDescription,
			// Error
			function(e) {
				alert('createOffer() error: ' + e.name);
			}
        );
	}*/
};

Media.prototype.makeOffer = function (to, uri) {
	// NOTE: check if offer already made and restart media if true
	if (EXISTS(this.localSDP) || this.localSDP !== "") this.start();

	console.log("make offer");
    var self = this;
    this.peerConnection.createOffer(/*this.gotDescription*/
        function (description) {
			self.peerConnection.setLocalDescription(description, function() {
				/*serverConnection.send(JSON.stringify({
					'sdp': description
				}));*/
				/*SIP.UA.transport.send(JSON.stringify({
					'sdp': description
				}));*/

				/*console.log("----------SDP----------");*/
				console.log("set local description");
				self.localSDP = description.sdp;
			});
            console.log("MAKE OFFER", to, uri);
            //self.handleOffer(to, uri);
			self.to = to;
			self.uri = uri;
        },
        // Error
        function(e) {
            alert('createOffer() error: ' + e.name);
        }
    );
};

Media.prototype.makeAnswer = function () {
	console.log("make answer");
    var self = this;
    this.peerConnection.setRemoteDescription(new this.RTCSessionDescription({ type: "offer", sdp: this.remoteSDP }));
    this.peerConnection.createAnswer(/*this.peerConnection.remoteDescription,/*this.gotDescription*/
        function (description) {
			self.peerConnection.setLocalDescription(description, function() {
				/*serverConnection.send(JSON.stringify({
					'sdp': description
				}));*/
				/*SIP.UA.transport.send(JSON.stringify({
					'sdp': description
				}));*/

				/*console.log("----------SDP----------");*/
				console.log("set local description");
				self.localSDP = description.sdp;
			});
            //console.log("MAKE ANSWER", self.localSDP);
            //self.handleAnswer();
        },
        // Error
        function(e) {
            alert('createOffer() error: ' + e.name);
        }
    );
};

Media.prototype.setRemoteSDP = function (sdp) {
	console.log("set remote SDP");
    this.remoteSDP = sdp;
    this.peerConnection.setRemoteDescription(new this.RTCSessionDescription({ type: "answer", sdp: this.remoteSDP }));
};


Media.prototype.log = function(e) {
	alert('getUserMedia() error: ' + e.name);
};

Media.prototype.startAudio = function() {
	// TODO: start stream
	console.log("START AUDIO");
};

Media.prototype.stopAudio = function() {
	console.log("STOP AUDIO");
	// TODO: remove local stream
	//this.peerConnection.removeStream(this.localStream);
	//this.localStream.stop();
	//this.localStream = null;

	this.peerConnection.close();

	this.start();
};
