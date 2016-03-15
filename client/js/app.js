/*global angular */
/*jshint unused:false */
'use strict';

/**
 * The main TodoMVC app module
 *
 * @type {angular.Module}
 */
var todomvc = angular.module('todomvc',
    [
    'auth0',
    'ngRoute',
    'angular-storage',
    'angular-jwt'
  ])
  .config(function myAppConfig( $routeProvider, authProvider, $httpProvider, $locationProvider,
  jwtInterceptorProvider) {
    $routeProvider.when('/', {
      controller: 'TodoCtrl',
      templateUrl: 'views/todomvc-index.html'
    })
    .when('/login', {
      controller: 'LoginCtrl',
      templateUrl: 'views/login.html'
    })
    .when('/:status', {
      controller: 'TodoCtrl',
      templateUrl: 'todomvc-index.html'
    })
    .otherwise({
      redirectTo: '/'
    });
     $locationProvider.html5Mode(true);
  authProvider.init({
      domain: 'manbm.auth0.com',
      clientID: 'bgkOcvKKZ8YcChJyDb9iuYgtynuZeRMn'
    });


  jwtInterceptorProvider.tokenGetter = function(store) {
    return store.get('token');
  }

  // Add a simple interceptor that will fetch all requests and add the jwt token to its authorization header.
  // NOTE: in case you are calling APIs which expect a token signed with a different secret, you might
  // want to check the delegation-token example
  $httpProvider.interceptors.push('jwtInterceptor');

  })
  .run(function($rootScope, auth, store, jwtHelper, $location) {
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
});
