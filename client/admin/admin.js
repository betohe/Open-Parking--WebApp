angular.module( 'sample.admin', [
'auth0'
])
.controller( 'AdminCtrl', function AdminController( $scope, auth, $http, zoneStorage, $location, store, mySocket, socket ) {

  $scope.zones = [];

  $scope.newZoneid = '';
  $scope.newZoneName = '';
  $scope.newZoneX = null;
  $scope.newZoneY = null;
  $scope.newZoneW = null;
  $scope.newZoneH = null;

  $scope.newZoneCap = null;
  $scope.editedZone = null;
  $scope.saving = false;


var host = location.origin.replace(/^http/, 'ws');
//console.log(host);

$scope.connection= new WebSocket(host);

  $scope.connection.onopen = function () { 
  console.log(auth.profile.clientID);
      send({ 
             type: "login", 
             id:  auth.profile.clientID
          }); 
};

  if(auth.profile == undefined){

    $location.path('/login');
  }
  else{
    if(auth.profile.roles.indexOf("admin") == -1){
          $location.path("/");
    }
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

    //console.log($scope.zones)
  }, true);

  $scope.drawCanvas= function(i) {
      //console.log("draw; "+i)
      d3.select("#canvas"+$scope.zones[i].id).select("svg").remove();
      var svgContainer = d3.select("#canvas"+$scope.zones[i].id).append("svg")
                                      .attr("width", $scope.zones[i].w)
                                      .attr("height", $scope.zones[i].h).append("rect")
                              .attr("x", 5)
                              .attr("y", 5)
                              .attr("width", $scope.zones[i].w)
                              .attr("height", $scope.zones[i].h)
                              .attr('fill', colorPercentage($scope.zones[i].full/$scope.zones[i].capacity));

      d3.select("#edcanvas"+$scope.zones[i].id).select("svg").remove();
      edsvgContainer = d3.select("#edcanvas"+$scope.zones[i].id).append("svg")
                                      .attr("width", $scope.zones[i].w)
                                      .attr("height", $scope.zones[i].h).append("rect")
                              .attr("x", 5)
                              .attr("y", 5)
                              .attr("width", $scope.zones[i].w)
                              .attr("height", $scope.zones[i].h)
                              .attr('fill', colorPercentage($scope.zones[i].full/$scope.zones[i].capacity));
                              //console.log($scope.zones[i]);
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
      send({ 
             type: "zonecreated", 
             savedZone:  savedZone
          }); 
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

  $scope.activeZone = function (id){
    console.log(id);
  }

  $scope.cancelEditZone = function (i) {
    $scope.editedZone =  null;
    // Clone the original zone to restore it on demand.
    $scope.originalZone = null;
  };

  $scope.editZone = function (i) {
    $scope.editedZone =  $scope.zones[i];
    // Clone the original zone to restore it on demand.
    $scope.originalZone = angular.extend({}, $scope.zones[i]);
  };

  $scope.doneEditing = function (i) {
    if($scope.editedZone.id !== $scope.originalZone.id){
      console.log("different!");
      zoneStorage.delete($scope.originalZone.id).success(function() {
        console.log("deleted");
        $scope.originalZone  = null;
      }).error(function() {
        alert('Failed to delete this Zone');
      });

      zoneStorage.create($scope.editedZone).success(function(savedZone) {
        $scope.zones[i] = savedZone;
        $scope.editedZone = null;
      }).error(function(error) {
        alert('Failed to save the new Zone');
      });
      return;
    }
    if (($scope.saving !== true) && ($scope.editedZone !== $scope.originalZone)) {
      $scope.saving = true; // submit and blur trigger this method. Let's save the document just once
      zoneStorage.update($scope.editedZone).success(function(newZone) {
        if (newZone === 'null') { // Compare with a string because of https://github.com/angular/angular.js/issues/2973
          console.log('hum');
          $scope.zones.splice($scope.zones.indexOf(zone), 1);
        }
        else {
          console.log("successfully updated");
          $scope.zones[i] = newZone;
          $scope.editedZone = null;
        }
      }).error(function() {
        $scope.saving = false;
        alert('Failed to update this Zone');
      });
    }
    else {
      $scope.editedZone = null;
    }
    /*
    zoneStorage.create($scope.editedZone).success(function(savedZone) {
      $scope.zones[i] = savedZone;
      $scope.editedZone = null;


      zoneStorage.delete($scope.originalZone).success(function() {
        $scope.originalZone = null
      }).error(function() {
        alert('Failed to update this Zone');
      });
    }).error(function(error) {
      alert('Failed to save the new Zone');
    });*/
  };

  $scope.revertEditing = function (zone) {
    $scope.zones[$scope.zones.indexOf(zone)] = $scope.originalZone;
    $scope.doneEditing($scope.originalZone);
  };

  $scope.removeZone = function (i) {

    zoneStorage.delete($scope.zones[i].id).success(function() {
      $scope.zones.splice(i, 1);
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


// Alias for sending messages in JSON format 
    function send(message) { 
      console.log("send to server"+ message);
      console.log($scope.myConnection);
       if ($scope.connectedUser) { 
          message.name = $scope.connectedUser; 
       } 
      
       $scope.connection.send(JSON.stringify(message)); 
    };

});
