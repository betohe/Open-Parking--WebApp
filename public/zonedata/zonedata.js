angular.module( 'sample.zonedata', [
'auth0'
])
.controller( 'ZoneDataCtrl', function AdminController( $scope, auth, $http, zoneStorage, $location, store, mySocket ) {

  if(auth.profile.roles.indexOf("admin") == -1){
        $location.path("/");
  }
  mySocket.on('zones', function (item) {
    console.log(item);
  });
  mySocket.on('welcome', function (item) {
    console.log(item.message);
  });
  mySocket.on('adminsupdatezone', function (zone) {
    console.log(zone);
  });
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

  $scope.addZone = function () {
    var newTitle = $scope.newZone.trim();
    if (!newTitle.length) {
      return;
    }
    var newZone = {
      title: newTitle,
      completed: false
    }
    zoneStorage.create(newZone).success(function(savedZone) {
      $scope.zones.push(savedZone);
    }).error(function(error) {
      alert('Failed to save the new TODO');
    });
    $scope.newZone = '';
  };

  $scope.toggleZone = function (zone) {
    var copyZone = angular.extend({}, zone);
    copyZone.completed = !copyZone.completed
    zoneStorage.update(copyZone).success(function(newZone) {
      if (newZone === 'null') { // Compare with a string because of https://github.com/angular/angular.js/issues/2973
        $scope.zones.splice($scope.zones.indexOf(zone), 1);
      }
      else {
        $scope.zones[$scope.zones.indexOf(zone)] = newZone;
        $scope.editedZone = null;
      }
    }).error(function() {
      console.log('fds');
      alert('Failed to update the status of this TODO');
    });

  };
  $scope.editZone = function (zone) {
    $scope.editedZone = zone;
    // Clone the original zone to restore it on demand.
    $scope.originalZone = angular.extend({}, zone);
  };

  $scope.doneEditing = function (zone, $event) {
    zone.title = zone.title.trim();
    if ((zone._saving !== true) && ($scope.originalZone.title !== zone.title)) {
      zone._saving = true; // submit and blur trigger this method. Let's save the document just once
      zoneStorage.update(zone).success(function(newZone) {
        if (newZone === 'null') { // Compare with a string because of https://github.com/angular/angular.js/issues/2973
          console.log('hum');
          $scope.zones.splice($scope.zones.indexOf(zone), 1);
        }
        else {
          $scope.zones[$scope.zones.indexOf(zone)] = newZone;
          $scope.editedZone = null;
        }
      }).error(function() {
        zone._saving = false;
        alert('Failed to update this TODO');
      });
    }
    else {
      $scope.editedZone = null;
    }
  };

  $scope.revertEditing = function (zone) {
    $scope.zones[$scope.zones.indexOf(zone)] = $scope.originalZone;
    $scope.doneEditing($scope.originalZone);
  };

  $scope.removeZone = function (zone) {
    zoneStorage.delete(zone.id).success(function() {
      $scope.zones.splice($scope.zones.indexOf(zone), 1);
    }).error(function() {
      alert('Failed to delete this TODO');
    });
  };

  $scope.clearCompletedZones = function () {
    $scope.zones.forEach(function (zone) {
      if(zone.completed) {
        $scope.removeZone(zone);
      }
    });
  };

  $scope.markAll = function (completed) {
    $scope.zones.forEach(function (zone) {
      if (zone.completed !== !completed) {
        $scope.toggleZone(zone);
      }
      //zone.completed = !completed;
    });
  };

});
