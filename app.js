(function() {
  "use strict";

  function App() {
    this.params = {
      serverHostname: 'raspberrypi.local',
      serverAddress: 'raspberrypi.local:8080'
    };
    this.ws = null;
    this.pc = null;
    this.pcConfig = {"iceServers": [
      {urls: ["stun:stun.l.google.com:19302", "stun:" + this.params.serverHostname + ":3478"]}
    ]};
    this.pcOptions = {
      optional: [{DtlsSrtpKeyAgreement: true}]
    };
    this.mediaConstraints = {
      optional: [],
      mandatory: {
        OfferToReceiveAudio: false,
        OfferToReceiveVideo: true
      }
    };
    this.RTCPeerConnection = window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
    this.RTCSessionDescription = window.mozRTCSessionDescription || window.RTCSessionDescription;
    this.RTCIceCandidate = window.mozRTCIceCandidate || window.RTCIceCandidate;
    this.getUserMedia = navigator.mozGetUserMedia || navigator.webkitGetUserMedia;

    this.init();
  }

  App.prototype = {
    constructor: App,

    init: function () {
      this.startVideoStream();
      this.bindEvents();
    },

    createPeerConnection: function() {
      try {
        this.pc = new this.RTCPeerConnection(this.pcConfig, this.pcOptions);
        this.pc.onicecandidate = this.onIceCandidate;
        this.pc.onaddstream = this.onRemoteStreamAdded;
        this.pc.onremovestream = this.onRemoteStreamRemoved;
        console.log("peer connection successfully created!");
        this.progressBar.value = 5;
      } catch (e) {
        console.log("createPeerConnection() failed");
      }
    },

    onIceCandidate: function(e) {
      if (e.candidate) {
        var candidate = {
          sdpMLineIndex: e.candidate.sdpMLineIndex,
          sdpMid: e.candidate.sdpMid,
          candidate: e.candidate.candidate
        };
        var command = {
          command_id: "addicecandidate",
          data: JSON.stringify(candidate)
        };
        this.ws.send(JSON.stringify(command));
      } else {
        console.log("End of candidates.");
      }
    },

    onRemoteStreamAdded: function(e) {
      console.log("Remote stream added:", window.URL.createObjectURL(e.stream));
      var progressBar = document.getElementById("progressBar");
      progressBar.value = 100;
      progressBar.style.display = 'none';
      var video = document.getElementById("remoteVideo");
      video.src = window.URL.createObjectURL(e.stream);
      video.play();
    },

    onRemoteStreamRemoved: function(e) {
      var video = document.getElementById("remoteVideo");
      video.src = '';
    },

    startVideoStream: function() {
      if ("WebSocket" in window) {
        var that = this;
        this.ws = new WebSocket('ws://' + this.params.serverAddress + '/stream/webrtc');

        this.ws.onopen = function () {
          console.log("onopen()");
          that.createPeerConnection();
          var command = {
            command_id: "offer"
          };
          that.ws.send(JSON.stringify(command));
          console.log("onopen(), command=" + JSON.stringify(command));
        };

        this.ws.onmessage = function (e) {
          var msg = JSON.parse(e.data);
          //console.log("message=" + msg);
          console.log("type=" + msg.type);

          switch (msg.type) {
            case "offer":
              that.pc.setRemoteDescription(new that.RTCSessionDescription(msg),
                function onRemoteSdpSuccess() {
                  console.log('onRemoteSdpSuccess()');
                  that.pc.createAnswer(function (sessionDescription) {
                    that.pc.setLocalDescription(sessionDescription);
                    var command = {
                      command_id: "answer",
                      data: JSON.stringify(sessionDescription)
                    };
                    that.ws.send(JSON.stringify(command));
                    console.log(command);
                  }, function (error) {
                    alert("Failed to createAnswer: " + error);
                  }, that.mediaConstraints);
                },
                function onRemoteSdpError(e) {
                  alert('Failed to setRemoteDescription: ' + e);
                }
              );

              var command = {
                command_id: "geticecandidate"
              };
              console.log(command);
              that.ws.send(JSON.stringify(command));
              break;

            case "answer":
              break;

            case "message":
              alert(msg.data);
              break;

            case "geticecandidate":
              var candidates = JSON.parse(msg.data);
              for (var i = 0; i < candidates.length; i++) {
                var elt = candidates[i];
                var candidate = new that.RTCIceCandidate({sdpMLineIndex: elt.sdpMLineIndex, candidate: elt.candidate});
                that.pc.addIceCandidate(candidate,
                  function () {
                    console.log("IceCandidate added: " + JSON.stringify(candidate));
                  },
                  function (error) {
                    console.log("addIceCandidate error: " + error);
                  }
                );
              }
              break;
          }
        };

        this.ws.onclose = function (e) {
          if (that.pc) {
            that.pc.close();
            that.pc = null;
          }
        };

        this.ws.onerror = function (e) {
          alert("An error has occurred!");
          this.close();
        };
      } else {
        alert("Sorry, this browser does not support WebSockets.");
      }
    },

    stopVideoStream: function() {
      if (this.pc) {
        this.pc.close();
        this.pc = null;
      }
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }
    },

    bindEvents: function () {
      var that = this;

      var el = document.getElementById("video");
      //el.addEventListener("click", videoClick, false);

      window.onbeforeunload = function() {
        if (that.ws) {
          that.ws.onclose = function () {}; // disable onclose handler first
          that.stopVideoStream();
        }
      };
    }
  };

  window.onload(function() {
    var app = new App();
  });
});