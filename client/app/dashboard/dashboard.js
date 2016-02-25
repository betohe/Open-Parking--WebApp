'use strict';

angular.module('camarboardApp')
  .config(function($routeProvider) {
    $routeProvider
      .when('/dashboard', {
        templateUrl: 'app/dashboard/dashboard.html',
        controller: 'DashboardController',
        controllerAs: 'dashboard',
        authenticate: 'user'
      });
  });
