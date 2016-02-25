'use strict';

angular.module('camarboardApp')
  .config(function($routeProvider) {
    $routeProvider
      .when('/newchat', {
        templateUrl: 'app/chat/newchat.html',
        controller: 'NewChatController',
        controllerAs: 'newchat'
      });
  });
