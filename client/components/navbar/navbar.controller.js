angular.module('sample')
  .controller('NavbarController', function NavbarController($scope, $location, auth, store) {



    if(auth.profile != undefined){
    $scope.$location = $location;
    $scope.isAdmin = auth.profile.roles.indexOf("admin") > -1;
    $scope.isLoggedIn = auth.isAuthenticated;
     $scope.isActive = function(route) {
      return route === $location.path();
    };
    $scope.logout = function() {
      auth.signout();
      store.remove('profile');
      store.remove('token');
      $location.path('/login');
    }
  }
});

