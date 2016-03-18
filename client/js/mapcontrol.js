
window.onscroll = function() {myFunction()};
window.onload = function(){
  var scrollPosition = window.pageYOffset;
  var windowSize     = window.innerHeight;
  var bodyHeight     = document.body.offsetHeight;
  console.log("LOAD!"+Math.max(bodyHeight - (scrollPosition + windowSize), 0));
    if (document.body.scrollTop > 40 && (Math.max(bodyHeight - (scrollPosition + windowSize), 0)) > 200 ) {
        document.getElementById("adminchartcard").setAttribute('style', 'position: fixed; top: 0px;');
        document.getElementById("adminchartcardhold").setAttribute('style', 'display: block');
    } 
    else if(Math.max(bodyHeight - (scrollPosition + windowSize), 0) < 60 ){
        document.getElementById("adminchartcard").setAttribute('style', 'position: fixed; bottom: 180px;');
        document.getElementById("adminchartcardhold").setAttribute('style', 'display: block');

    }else {
        document.getElementById("adminchartcard").removeAttribute('style');
        document.getElementById("adminchartcardhold").setAttribute('style', 'display: none');
    }
}

function myFunction() {
  var scrollPosition = window.pageYOffset;
var windowSize     = window.innerHeight;
var bodyHeight     = document.body.offsetHeight;
  console.log(Math.max(bodyHeight - (scrollPosition + windowSize), 0));
    if (document.body.scrollTop > 40 && (Math.max(bodyHeight - (scrollPosition + windowSize), 0)) > 100 ) {
        document.getElementById("adminchartcard").setAttribute('style', 'position: fixed; top: -10px;-webkit-transition: position 2s; /* For Safari 3.1 to 6.0 */transition: position 2s;');
        document.getElementById("adminchartcardhold").setAttribute('style', 'display: block;');
    } 
    else if((Math.max(bodyHeight - (scrollPosition + windowSize), 0)) < 60 ){
        document.getElementById("adminchartcard").setAttribute('style', 'position: fixed; bottom: 180px;  -webkit-transition: position 2s; /*For Safari 3.1 to 6.0 */ transition: position 2s;');
        document.getElementById("adminchartcardhold").setAttribute('style', 'display: block');
    }else {
        document.getElementById("adminchartcard").removeAttribute('style');
        document.getElementById("adminchartcardhold").setAttribute('style', 'display: none');
    }
}