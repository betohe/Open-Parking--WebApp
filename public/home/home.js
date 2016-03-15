angular.module( 'sample.home', [
'auth0'
])
.controller( 'HomeCtrl', function HomeController( $scope, auth, $http, zoneStorage, $location, store, mySocket  ) {

  $scope.updateZone = function() {
    mySocket.emit('updatezone', {id: "Z6", op:"enter"}); //op: enter or leave
  }
  $scope.auth = auth;
  $scope.callApi = function() {
    // Just call the API as you'd do using $http
    $http({
      url: 'http://localhost:3001/secured/ping',
      method: 'GET'
    }).then(function() {
      alert("We got the secured data successfully");
    }, function(response) {
      if (response.status == 0) {
        alert("Please download the API seed so that you can call it.");
      }
      else {
        alert(response.data);
      }
    });
  }

  $scope.logout = function() {
    auth.signout();
    store.remove('profile');
    store.remove('token');
    $location.path('/login');
  }

  // ToDos

  $scope.zones = [];

  zoneStorage.get().success(function(zones) {
    $scope.zones = zones;
  }).error(function(error) {
    alert('Failed to load TODOs');

  });

  $scope.newZone = '';
  $scope.editedZone = null;

  $scope.$watch('zones', function (newValue, oldValue) {
    console.log($scope.zones)
  }, true);


});
