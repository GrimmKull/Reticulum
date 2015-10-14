var Media = function (audio, video) {
	this.localVideo = null;
	this.remoteVideo = null;
	this.localStream = null;
	this.remoteStream = null;
	this.localSDP = null;
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
		//console.log('gt media', stream);
		self.localStream = stream;
		self.localVideo.src = window.URL.createObjectURL(stream);

		self.start(true);
	};

	this.gotDescription = function(description) {
		//console.log('got description');
		self.peerConnection.setLocalDescription(description, function() {
			/*serverConnection.send(JSON.stringify({
				'sdp': description
			}));*/
			/*SIP.UA.transport.send(JSON.stringify({
				'sdp': description
			}));*/

			/*console.log("----------SDP----------");
			console.log(description.sdp);*/
			self.localSDP = description.sdp;
		}, function() {
			console.log('set description error');
		});
	};

	this.gotIceCandidate = function(event) {
		//console.log('got ice cands');
		if (event.candidate !== null) {
			/*serverConnection.send(JSON.stringify({
				'ice': event.candidate
			}));*/

			/*SIP.UA.transport.send(JSON.stringify({
				'ice': event.candidate
			}));*/
			self.candidates.push(event.candidate);
			//console.log(event.candidate);
		}
	};

	this.gotRemoteStream = function(event) {
		//console.log("got remote stream");
		self.remoteVideo.src = window.URL.createObjectURL(event.stream);
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
	//console.log(this.getUserMedia);
	//console.log((navigator.getUserMedia), navigator.mozGetUserMedia , navigator.webkitGetUserMedia);
	//navigator.webkitGetUserMedia(this.constraints, this.gotUserMedia, this.log);

	this.getUserMedia.call(navigator, {audio : this.audio, video : this.video}, this.gotUserMedia, this.log);
};

Media.prototype.getLocalSDP = function() {
	return this.peerConnection.localDescription.sdp;
};

Media.prototype.setRemoteSDP = function (sdp) {
	this.peerConnection.setRemoteDescription(new RTCSessionDescription(sdp), function () {
		// if we received an offer, we need to answer
		//if (this.peerConnection.remoteDescription.type == 'offer') this.peerConnection.createAnswer(localDescCreated, logError);
    }, logError);
};

Media.prototype.start = function(isCaller) {
	//console.log(this.localStream);

	this.peerConnection = new this.RTCPeerConnection(this.peerConnectionConfig);
	this.peerConnection.onicecandidate = this.gotIceCandidate;
	this.peerConnection.addStream(this.localStream);
	this.peerConnection.onaddstream = this.gotRemoteStream;

	if (isCaller) {
		this.peerConnection.createOffer(this.gotDescription,
			// Error
			function(e) {
				alert('createOffer() error: ' + e.name);
			});
	} else {
		this.peerConnection.createAnswer(this.gotDescription,
			// Error
			function(e) {
				alert('createOffer() error: ' + e.name);
			});
	}
};

Media.prototype.log = function(e) {
	alert('getUserMedia() error: ' + e.name);
};
