'use strict';

(function() {

class ChatController {

  constructor($http, $scope, socket) {
    this.$http = $http;
    this.awesomeThings = [];
    $scope.connection = new WebSocket('ws://localhost:9090'); 
    $scope.name = ""; 
    $scope.dataChannel;
    $scope.connectedUser;
    $scope.myConnection;

    $http.get('/api/things').then(response => {
      this.awesomeThings = response .data;
      socket.syncUpdates('thing', this.awesomeThings);
    });

    $scope.$on('$destroy', function() {
      socket.unsyncUpdates('thing');
    });

    function hasUserMedia() { 
       //check if the browser supports the WebRTC 
       return !!(navigator.getUserMedia || navigator.webkitGetUserMedia || 
          navigator.mozGetUserMedia); 
    } 

    if (hasUserMedia()) { 
       navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia
          || navigator.mozGetUserMedia; 
        
       //enabling video and audio channels 
       navigator.getUserMedia({ video: true, audio: true }, function (stream) { 
          var video = document.querySelector('video'); 
        
          //inserting our stream to the video tag     
          video.src = window.URL.createObjectURL(stream); 

          //mute
          stream.removeTrack(stream.getAudioTracks()[0]); 
       }, function (err) {}); 
    } else { 
       alert("WebRTC is not supported"); 
    }

      
    //when a user clicks the login button 
    $scope.login = function(event){ 
       name = $scope.loginInput; 
      
       if(name.length > 0){ 
          send({ 
             type: "login", 
             name: name 
          }); 
       } 
      
    };

    function IsJsonString(str) {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    }
          
    //handle messages from the server 
    $scope.connection.onmessage = function (message) { 
       console.log("Scope Got message", message.data);
       if(IsJsonString(message.data)){
           var data = JSON.parse(message.data); 
          
           switch(data.type) { 
              case "login": 
                 $scope.onLogin(data.success); 
                 break; 
              case "offer": 
                 $scope.onOffer(data.offer, data.name); 
                 break; 
              case "answer": 
                 $scope.onAnswer(data.answer); 
                 break; 
              case "candidate": 
                 $scope.onCandidate(data.candidate); 
                 break; 
              default: 
                 break; 
           }
        }
        else{
          console.log("not a json");
        } 
    };
      
    //when a user logs in 
    $scope.onLogin = function(success) { 

       if (success === false) { 
          alert("oops...try a different username"); 
       } else { 
          //creating our RTCPeerConnection object 
        
          var configuration = { 
             "iceServers": [{ "url": "stun:stun.1.google.com:19302" }] 
          }; 
        
          /*$scope.myConnection = new webkitRTCPeerConnection(configuration, { 
             optional: [{RtpDataChannels: true}] 
          }); */
          $scope.myConnection = new webkitRTCPeerConnection(configuration, null); 
          
          console.log("RTCPeerConnection object was created"); 
          console.log($scope.myConnection); 
      
          //setup ice handling
          //when the browser finds an ice candidate we send it to another peer 
          $scope.myConnection.onicecandidate = function (event) { 
            console.log("found ice candidate");
             if (event.candidate) { 
                send({ 
                   type: "candidate", 
                   candidate: event.candidate 
                }); 
             } 
          }; 

    
          $scope.openDataChannel();
       } 
    };
      
    $scope.connection.onopen = function () { 
       console.log("Connected"); 
    };
      
    $scope.connection.onerror = function (err) { 
       console.log("Got error", err); 
    };

    //setup a peer connection with another user 
    $scope.connectToOtherUsername  = function () { 
     
       var otherUsername = $scope.otherUsernameInput; 
       $scope.connectedUser = otherUsername;
      
       if (otherUsername.length > 0) { 
          //make an offer 
          $scope.myConnection.createOffer(function (offer) { 
             console.log("sending offer"+offer); 
             send({ 
                type: "offer", 
                offer: offer 
             });
          
             $scope.myConnection.setLocalDescription(offer); 
          }, function (error) { 
             alert("An error has occurred."); 
          }); 
       } 
    }; 
     
    //when somebody wants to call us 
    $scope.onOffer = function(offer, name) { 
       $scope.connectedUser = name;
       $scope.myConnection.setRemoteDescription(new RTCSessionDescription(offer)); 
      
       $scope.myConnection.createAnswer(function (answer) { 
          $scope.myConnection.setLocalDescription(answer); 
          send({ 
             type: "answer", 
             answer: answer 
          }); 
        
       }, function (error) { 
          throw error;
          alert("oops...error"+error); 
       }); 
    }
      
    //when another user answers to our offer 
    $scope.onAnswer = function(answer) { 
       $scope.myConnection.setRemoteDescription(new RTCSessionDescription(answer)); 
    } 
     
    //when we got ice candidate from another user 
    $scope.onCandidate = function(candidate) { 

      console.log("candidate received");
      console.log(candidate)
      $scope.myConnection.addIceCandidate(new RTCIceCandidate(candidate)); 
    } 

    //creating data channel 
    $scope.openDataChannel = function() { 

       var dataChannelOptions = ''; 
      console.log("setting up data channel");
      $scope.dataChannel = $scope.myConnection.createDataChannel("myDataChannel", { 
          reliable:true
       });
      console.log($scope.dataChannel);
      
      console.log("data channel ready");
       $scope.dataChannel.onerror = function (error) { 
          console.log("Error:", error); 
       };
      
       $scope.dataChannel.onmessage = function (event) { 
          console.log("Got message:", event.data); 
       };  
       $scope.dataChannel.onopen = function(){console.log("------ DATACHANNEL OPENED ------");};
    }
      
    //when a user clicks the send message button 
    $scope.sendMsg =  function () { 
       console.log("scope send message");
       console.log($scope.myConnection);
       console.log($scope.dataChannel);
       var val = $scope.msgInput; 
       $scope.dataChannel.send(val); 
       console.log($scope.dataChannel);
    };
      
    // Alias for sending messages in JSON format 
    function send(message) { 
      console.log("send to server"+ message);
      console.log($scope.myConnection);
       if ($scope.connectedUser) { 
          message.name = $scope.connectedUser; 
       } 
      
       $scope.connection.send(JSON.stringify(message)); 
    };
    // end controlle constructor
  }
}

angular.module('camarboardApp')
  .controller('ChatController', ChatController);

})();
