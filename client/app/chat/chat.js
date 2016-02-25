'use strict';

angular.module('camarboardApp')
  .config(function($routeProvider) {
    $routeProvider
      .when('/chat', {
        templateUrl: 'app/chat/chat.html',
        controller: 'ChatController',
        controllerAs: 'chat'
      });
  });
