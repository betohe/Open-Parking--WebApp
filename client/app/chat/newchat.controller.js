'use strict';

(function() {

class NewChatController {

  constructor($http, $scope, $location, socket, Auth, Chat) {
    this.$http = $http;
    this.awesomeThings = [];
    $scope.isPrivate = false;

    $http.get('/api/things').then(response => {
      this.awesomeThings = response.data;
      socket.syncUpdates('thing', this.awesomeThings);
    });

    $scope.$on('$destroy', function() {
      socket.unsyncUpdates('thing');
    });

    $scope.sendData = function(){

      if($scope.roomTitle){

          var o =  new Chat;

          console.log(o);

          o.name = $scope.roomTitle
          o.isPrivate = $scope.isPrivate
          o.owner = Auth.getCurrentUser()._id;
          o.participants = {};
          o.participants[o.owner] = 200;


          o.$save(function(savedChat) {
              var chatId = savedChat._id;
              console.log("successfully added question with id", chatId);
              $location.path('/chat/'+chatId );
          });
              console.log(JSON.stringify(o));
        }
        else{
           Materialize.toast('Necesitas escribir un nombre!', 4000) // 4000 is the duration of the toast
        }
    }
  }

  addThing() {
    if (this.newThing) {
      this.$http.post('/api/things', { name: this.newThing });
      this.newThing = '';
    }
  }

  deleteThing(thing) {
    this.$http.delete('/api/things/' + thing._id);
  }
}

angular.module('camarboardApp')
  .controller('NewChatController', NewChatController);

})();
