'use strict';

angular.module('camarboardApp.auth', [
  'camarboardApp.constants',
  'camarboardApp.util',
  'ngCookies',
  'ngRoute'
])
  .config(function($httpProvider) {
    $httpProvider.interceptors.push('authInterceptor');
  });
