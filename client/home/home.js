angular.module( 'sample.home', [
'auth0'
])
.controller( 'HomeCtrl', function HomeController( $scope, auth, $http, zoneStorage, $location, store, socket  ) {

  $scope.zones = [];

var host = location.origin.replace(/^http/, 'ws');
console.log(host);
$scope.connection= new WebSocket(host);

$scope.connection.onmessage = function (message) { 
       console.log("Scope Got message", message.data);
       if(IsJsonString(message.data)){
           var data = JSON.parse(message.data); 
          
           switch(data.type) { 
              case "newzone": 
                  $scope.zones.push(data.zone);
                 break; 
              case "updatezone": 
              console.log("Zone updated: "+data.id+", action: "+data.action);
                  for(var i = 0; i < $scope.zones.length; i++){
                    if($scope.zones[i].id == data.id){
                      if(data.action === "enter"){
                        $scope.zones[i].full++;
                      }
                      else if (data.action === "leave"){
                        $scope.zones[i].full--;
                      }
                    }
                  }
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

  $scope.updateZone = function(pos) {
    socket.emit('updatezone', $scope.zones[pos]); //op: enter or leave
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

  zoneStorage.get().success(function(zones) {
    $scope.zones = zones;
  }).error(function(error) {
    alert('Failed to load TODOs');

  });

  $scope.$watch('zones', function (newValue, oldValue) {

                    d3.select("#chart").select("svg").remove();
                    var svgContainer = d3.select("#chart").append("svg")
                                    .attr("width", 400)
                                    .attr("height", 500);
                    var rectangles = svgContainer.selectAll("rect")
                        .data($scope.zones)
                        .enter()
                        .append("rect");

                    var textC = svgContainer.selectAll('text')
                        .data($scope.zones)
                        .enter()
                        .append("text");

                    var textAtributes = textC
                         .text(function (d) { return (d.capacity-d.full)+"/"+d.capacity; })
                        .attr("x", function (d) { return d.x + 15; })
                        .attr("y", function (d) { return d.y + 15; })
                        .style('fill', 'black');

                    var rectanglesAtributes = rectangles
                        .attr("x", function (d) { return d.x; })
                        .attr("y", function (d) { return d.y; })
                        .attr("width", function (d) { return d.w; })
                        .attr("height", function (d) { return d.h; })
                        .attr('fill', function(d) {
                                if (d.full/d.capacity <= 0.25) { // 0.25 is a percentage value representing the data
                                  return 'green';
                                }
                                else if (d.full/d.capacity  <= 0.50) {
                                  return 'yellow';
                                }
                                else if (d.full/d.capacity  <= 0.75) {
                                  return 'orange';
                                }
                                else if (d.full/d.capacity <= 1) {
                                  return 'red';
                                }
                              });
    console.log($scope.zones);
  }, true);


});
