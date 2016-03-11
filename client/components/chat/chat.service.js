'use strict';

(function() {

function ChatResource($resource) {
  return $resource('/api/chats/:id/:controller', {
    id: '@_id'
  }, {
    changePassword: {
      method: 'PUT'
    },
    get: {
      method: 'GET',
    }
  });
}

angular.module('camarboardApp')
  .factory('Chat', ChatResource);

})();