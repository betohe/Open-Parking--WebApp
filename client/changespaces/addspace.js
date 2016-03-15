angular.module( 'sample.addspace', [
'auth0'
])
.controller( 'AddSpaceCtrl', function AddSpaceController( $scope, auth, $routeParams, $http, zoneStorage, $location, store, mySocket  ) {
  console.log('leave!!');

   $scope.zones = [];

   zoneStorage.get().success(function(zones) {
    for(var i = 0; i < zones.length; i++){
      if(zones[i].id == $routeParams.id){
        zones[i].full--;
        zoneStorage.update(zones[i]).success(function(newZone) {
              if (newZone === 'null') { // Compare with a string because of https://github.com/angular/angular.js/issues/2973
                console.log('hum');
                $scope.zones.splice($scope.zones.indexOf(zone), 1);
              }
              else {
                console.log(newZone);
                mySocket.emit('updatezone', {id: $routeParams.id, action:"leave"}); //op: enter or leave
              }
            }).error(function() {
              zone._saving = false;
              alert('Failed to update this Zone');
            });
      }
    }
  }).error(function(error) {
    alert('Failed to load Zone');

  });
  
});
