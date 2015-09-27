(function($) {
  "use strict";

  function App(el) {
    this.$el = $(el);
    this.params = {
      serverHostname: window.location.hostname,
      serverAddress: window.location.hostname + ':' + 8080
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
        OfferToReceiveAudio: true,
        OfferToReceiveVideo: true
      }
    };
    this.RTCPeerConnection = window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
    this.RTCSessionDescription = window.mozRTCSessionDescription || window.RTCSessionDescription;
    this.RTCIceCandidate = window.mozRTCIceCandidate || window.RTCIceCandidate;
    this.getUserMedia = navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
    this.url = window.URL;

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
        this.pc.onicecandidate = this.onIceCandidate();
        this.pc.onaddstream = this.onRemoteStreamAdded();
        this.pc.onremovestream = this.onRemoteStreamRemoved();
        console.log("peer connection successfully created!");
      } catch (e) {
        console.log("createPeerConnection() failed");
      }
    },

    onIceCandidate: function(event) {
      if (event.candidate) {
        var candidate = {
          sdpMLineIndex: event.candidate.sdpMLineIndex,
          sdpMid: event.candidate.sdpMid,
          candidate: event.candidate.candidate
        };
        var command = {
          command_id: "addicecandidate",
          data: JSON.stringify(candidate)
        };
        ws.send(JSON.stringify(command));
      } else {
        console.log("End of candidates.");
      }
    },

    onRemoteStreamAdded: function(e) {
      console.log("Remote stream added:", this.url.createObjectURL(e.stream));
      var remoteVideoElement = document.getElementById('remote-video');
      remoteVideoElement.src = this.url.createObjectURL(e.stream);
      remoteVideoElement.play();
    },

    onRemoteStreamRemoved: function(e) {
      var remoteVideoElement = document.getElementById('remote-video');
      remoteVideoElement.src = '';
    },

    startVideoStream: function() {
      if ("WebSocket" in window) {
        var that = this;
        this.ws = new WebSocket('ws://' + this.params.serverAddress + '/stream/webrtc');

        this.ws.onopen = function () {
          console.log("onopen()");
          this.createPeerConnection();
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
              that.pc.setRemoteDescription(new this.RTCSessionDescription(msg),
                function onRemoteSdpSuccess() {
                  console.log('onRemoteSdpSucces()');
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
                  }, mediaConstraints);
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
                var candidate = new this.RTCIceCandidate({sdpMLineIndex: elt.sdpMLineIndex, candidate: elt.candidate});
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

      this.$el.on('click', function (e) {
        e.preventDefault();
      });

      window.onbeforeunload = function() {
        if (that.ws) {
          that.ws.onclose = function () {}; // disable onclose handler first
          that.stopVideoStream();
        }
      };
    }
  };

  $(function() {
    var app = new App($('[data-app]'));
  });
}(window.jQuery));