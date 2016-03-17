// JavaScript Document
  
  function lightboxIn(lightboxID, lightboxfade){
	  document.getElementById(lightboxID).style.opacity=0;
	  document.getElementById(lightboxfade).style.opacity=0;
	  document.getElementById(lightboxID).style.display='block';
	  document.getElementById(lightboxID).style.zIndex =1002;
	  console.log(document.getElementById(lightboxID).style.zIndex);
	  document.getElementById(lightboxfade).style.display='block';
	  var i=0;
	  
	  var id = setInterval(function() {
		 document.getElementById(lightboxID).style.opacity=i+0.4;
	 	 document.getElementById(lightboxfade).style.opacity=i;
		 i+=0.1;
		 if(i>0.6){
		 	clearInterval(id);
		 }
	  }, 10);
	  if(typeof map !== 'undefined'){
	  	google.maps.event.trigger(map, 'resize');
	  }
	  if(typeof mapEditLoc !== 'undefined'){
		  google.maps.event.trigger(mapEditLoc, 'resize');
	  }
	  if(typeof lightboxmap !== 'undefined'){
		  google.maps.event.trigger(lightboxmap, 'resize');
	  }
  }
  
  function lightboxPopIn(lightboxID, lightboxfade){
	  document.getElementById(lightboxID).style.opacity=0;
	  document.getElementById(lightboxfade).style.opacity=0;
	  document.getElementById(lightboxID).style.display='block';
	  document.getElementById(lightboxID).style.zIndex =1002;
	  document.getElementById(lightboxfade).style.zIndex =1001;
	  console.log(document.getElementById(lightboxID).style.zIndex);
	  document.getElementById(lightboxfade).style.display='block';
	  document.getElementById(lightboxID).style.opacity=1;
	  document.getElementById(lightboxfade).style.opacity=0.5;
  }
  function lightboxOut(lightboxID, lightboxfade){
	  var i=0.6;
	  var id = setInterval(function() {
		 document.getElementById(lightboxID).style.opacity=i+0.4;
	 	 document.getElementById(lightboxfade).style.opacity=i;
		 i-=0.1;
		 if(i<0.0){
		 	clearInterval(id);
			  document.getElementById(lightboxID).style.display='none';
			  document.getElementById(lightboxfade).style.display='none'
		 }
	  }, 10);
  }
  function lightboxPopOut(lightboxID, lightboxfade){
	  document.getElementById(lightboxID).style.opacity=0;
	  document.getElementById(lightboxfade).style.opacity=0;
	  document.getElementById(lightboxID).style.zIndex =-2;
	  document.getElementById(lightboxfade).style.zIndex =-2;
  }