'use strict';

(function() {

class DashboardController {

  constructor($http, $scope, socket, Auth) {
    this.$http = $http;
    this.awesomeThings = [];
    $scope.getCurrentUser = Auth.getCurrentUser;

    $http.get('/api/chats/ownedbyuser/'+$scope.getCurrentUser()._id).then(function(response) {
      $scope.myPolls = response.data;
    });
  } 
}

angular.module('camarboardApp')
  .controller('DashboardController', DashboardController);

})();
