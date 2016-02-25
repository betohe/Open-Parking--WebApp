'use strict';

angular.module('camarboardApp')
  .config(function($routeProvider) {
    $routeProvider
      .when('/dashboard', {
        templateUrl: 'app/main/main.html',
        controller: 'DashboardController',
        controllerAs: 'main'
      });
  });
