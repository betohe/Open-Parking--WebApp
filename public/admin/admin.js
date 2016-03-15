angular.module( 'sample.admin', [
'auth0'
])
.controller( 'AdminCtrl', function AdminController( $scope, auth, $http, zoneStorage, $location, store, mySocket ) {

  $scope.zones = [];

  $scope.newZoneid = '';
  $scope.newZoneName = '';
  $scope.newZoneX = null;
  $scope.newZoneY = null;
  $scope.newZoneW = null;
  $scope.newZoneH = null;

  $scope.newZoneCap = null;
  $scope.editedZone = null;


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

  zoneStorage.get().success(function(zones) {
    $scope.zones = zones;
  }).error(function(error) {
    alert('Failed to load TODOs');

  });

  $scope.$watch('zones', function (newValue, oldValue) {

    console.log($scope.zones)
  }, true);

  $scope.drawCanvas= function(i) {
      console.log("draw; "+i)
      d3.select("#canvas"+$scope.zones[i].id).select("svg").remove();
      var svgContainer = d3.select("#canvas"+$scope.zones[i].id).append("svg")
                                      .attr("width", $scope.zones[i].w)
                                      .attr("height", $scope.zones[i].h).append("rect")
                              .attr("x", 5)
                              .attr("y", 5)
                              .attr("width", $scope.zones[i].w)
                              .attr("height", $scope.zones[i].h)
                              .attr('fill', colorPercentage($scope.zones[i].full/$scope.zones[i].capacity));
                              console.log($scope.zones[i]);
  }


  function colorPercentage(val){
                                if (val <= 0.25) { // 0.25 is a percentage value representing the data
                                  return 'green';
                                }
                                else if (val <= 0.50) {
                                  return 'yellow';
                                }
                                else if (val  <= 0.75) {
                                  return 'orange';
                                }
                                else if (val <= 1) {
                                  return 'red';
                                }
                              }

  $scope.addZone = function () {
    var newZone = {
      "id": $scope.newZoneid.trim(),
      "name": $scope.newZoneName.trim(),
      "x": $scope.newZoneX,
      "y": $scope.newZoneY,
      "w": $scope.newZoneW,
      "h": $scope.newZoneH,
      "capacity": $scope.newZoneCap,
      "full": 0
    }
    if (!$scope.newZoneid.trim().length || !$scope.newZoneName.trim().length || $scope.newZoneCap <= 0 || $scope.newZoneX < 0 || $scope.newZoneY < 0) {
      alert("wrong input");
      return;
    }
    zoneStorage.create(newZone).success(function(savedZone) {
      $scope.zones.push(savedZone);
      mySocket.emit('zonecreated', savedZone); 
    }).error(function(error) {
      alert('Failed to save the new Zone');
    });
    $scope.newZone = {};
    $scope.newZoneid = '';
    $scope.newZoneName = '';
    $scope.newZoneX = null;
    $scope.newZoneY = null;
    $scope.newZoneW = null;
    $scope.newZoneH = null;
    $scope.newZoneCap = null;
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
      alert('Failed to update the status of this ZONE');
    });

  };

  $scope.editZone = function (position){
    console.log(position);
  }
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
