'use strict';

angular.module('camarboardApp')
  .config(function($routeProvider) {
    $routeProvider
      .when('/chat', {
        templateUrl: 'app/chat/chat.html',
        controller: 'ChatController',
        controllerAs: 'chat'
      });
  });

function initialize() {
    console.log("Initializing; room=99688636.");
    card = document.getElementById("card");
    localVideo = document.getElementById("localVideo");
    miniVideo = document.getElementById("miniVideo");
    remoteVideo = document.getElementById("remoteVideo");
    resetStatus();
    openChannel('AHRlWrqvgCpvbd9B-Gl5vZ2F1BlpwFv0xBUwRgLF/* ...*/');
    doGetUserMedia();
  }

  //checks if the browser supports WebRTC 

function hasUserMedia() { 
   navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia 
      || navigator.mozGetUserMedia || navigator.msGetUserMedia; 
   return !!navigator.getUserMedia; 
}
 
if (hasUserMedia()) { 
   navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia
      || navigator.mozGetUserMedia || navigator.msGetUserMedia;
		
   //get both video and audio streams from user's camera 
   navigator.getUserMedia({ video: true, audio: true }, function (stream) { 
      var video = document.querySelector('video'); 
		
      //insert stream into the video tag 
      video.src = window.URL.createObjectURL(stream); 
   }, function (err) {}); 
	
}else {
   alert("Error. WebRTC is not supported!"); 
}