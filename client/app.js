angular.module( 'sample', [
  'auth0',
  'ngRoute',
  'sample.home',
  'sample.login',
  'sample.admin',
  'sample.takespace',
  'sample.addspace',
  'angular-storage',
  'btford.socket-io',
  'angular-jwt'
])
.config( function myAppConfig ( $routeProvider, authProvider, $httpProvider, $locationProvider,
  jwtInterceptorProvider) {
  $routeProvider
    .when( '/', {
      controller: 'HomeCtrl',
      templateUrl: 'home/home.html',
      pageTitle: 'Homepage',
      requiresLogin: true
    })
    .when( '/login', {
      controller: 'LoginCtrl',
      templateUrl: 'login/login.html',
      pageTitle: 'Login'
    })
    .when( '/admin', {
      controller: 'AdminCtrl',
      templateUrl: 'admin/admin.html',
      pageTitle: 'Admin'
    })
    .when( '/zonedata', {
      controller: 'ZoneDataCtrl',
      templateUrl: 'zonedata/zonedata.html',
      pageTitle: 'ZoneData'
    })
    .when( '/enter/:id', {
      controller: 'TakeSpaceCtrl',
      template: 'space taken',
    })
    .when( '/leave/:id', {
      controller: 'AddSpaceCtrl',
      template: 'space free'
    });


  authProvider.init({
    domain: AUTH0_DOMAIN,
    clientID: AUTH0_CLIENT_ID,
    loginUrl: '/login'
  });

  jwtInterceptorProvider.tokenGetter = function(store) {
    return store.get('token');
  }

  // Add a simple interceptor that will fetch all requests and add the jwt token to its authorization header.
  // NOTE: in case you are calling APIs which expect a token signed with a different secret, you might
  // want to check the delegation-token example
  $httpProvider.interceptors.push('jwtInterceptor');
}).run(function($rootScope, auth, store, jwtHelper, $location) {
  $rootScope.$on('$locationChangeStart', function() {
    if (!auth.isAuthenticated) {
      var token = store.get('token');
      if (token) {
        if (!jwtHelper.isTokenExpired(token)) {
          auth.authenticate(store.get('profile'), token);
        } else {
          $location.path('/login');
        }
      }
    }

  });
})
.controller( 'AppCtrl', function AppCtrl ( $scope, $location ) {
  $scope.$on('$routeChangeSuccess', function(e, nextRoute){
    if ( nextRoute.$$route && angular.isDefined( nextRoute.$$route.pageTitle ) ) {
      $scope.pageTitle = nextRoute.$$route.pageTitle + ' | Auth0 Sample' ;
    }
  });
}).factory('zoneStorage', function ($http) {
  var STORAGE_ID = 'zones-angularjs';

  return {
    get: function () {
      var url = '/zones';
      return $http.get(url);
    },
    create: function (zone) {
      var url = '/zones';
      return $http.post(url, zone);
    },
    update: function (zone) {
      var url = '/zones/' + zone.id;
      return $http.put(url, zone);
    },
    delete: function(id) {
      var url = '/zones/' + id;
      return $http.delete(url);
    }
  };
})
.factory('mySocket', function (socketFactory) {
  return socketFactory({
        ioSocket: io.connect({path:'/CAH/socket.io'})
    });
}).directive('ghVisualization', function () {


  return {
    restrict: 'E',
    scope: {
      val: '=',
      grouped: '='
    },
    link: function (scope, element, attrs) {

                  //var jsonString = '{"zones":[{"id":"Z1","name":"Zone1 - Purple","x":205,"y":0,"w":50,"h":130,"capacity":446,"full":400},{"id":"Z2","name":"Zone2 - Civil","x":255,"y":65,"w":40,"h":50,"capacity":291,"full":200},{"id":"Z3","name":"Zone3 - Light Purple","x":205,"y":130,"w":50,"h":60,"capacity":269,"full":100},{"id":"Z4","name":"Zone4 - Red","x":205,"y":190,"w":50,"h":50,"capacity":341,"full":270},{"id":"Z5","name":"Zone5 - yellow","x":205,"y":240,"w":50,"h":130,"capacity":269,"full":100},{"id":"Z6","name":"Zone6 - Residences","x":255,"y":305,"w":40,"h":120,"capacity":230,"full":200},{"id":"Z7","name":"Zone7 - Blue","x":205,"y":370,"w":50,"h":110,"capacity":229,"full":75},{"id":"Z8","name":"Zone8 - Cafeteria","x":115,"y":450,"w":90,"h":50,"capacity":288,"full":280},{"id":"Z9","name":"Zone9 - Visitors","x":25,"y":450,"w":90,"h":50,"capacity":237,"full":100},{"id":"Z10","name":"Zone10 - health Building","x":0,"y":400,"w":50,"h":100,"capacity":412,"full":100}]}';
                  //var zones = JSON.parse(jsonString).zones;
                  //console.log(zones);
                    
                    
                    
                
      }
  }
});

;

