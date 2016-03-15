angular.module( 'sample.home', [
'auth0'
])
.controller( 'HomeCtrl', function HomeController( $scope, auth, $http, todoStorage, $location, store ) {

  $scope.auth = auth;

  $scope.callApi = function() {
    // Just call the API as you'd do using $http
    $http({
      url: 'http://localhost:3001/secured/ping',
      method: 'GET'
    }).then(function() {
      alert("We got the secured data successfully");
    }, function(response) {
      if (response.status == 0) {
        alert("Please download the API seed so that you can call it.");
      }
      else {
        alert(response.data);
      }
    });
  }

  $scope.logout = function() {
    auth.signout();
    store.remove('profile');
    store.remove('token');
    $location.path('/login');
  }

  // ToDos

  $scope.todos = [];

  todoStorage.get().success(function(todos) {
    $scope.todos = todos;
  }).error(function(error) {
    alert('Failed to load TODOs');

  });

  $scope.newTodo = '';
  $scope.editedTodo = null;

  $scope.$watch('todos', function (newValue, oldValue) {
    console.log($scope.todos)
  }, true);

  $scope.addTodo = function () {
    var newTitle = $scope.newTodo.trim();
    if (!newTitle.length) {
      return;
    }
    var newTodo = {
      title: newTitle,
      completed: false
    }
    todoStorage.create(newTodo).success(function(savedTodo) {
      $scope.todos.push(savedTodo);
    }).error(function(error) {
      alert('Failed to save the new TODO');
    });
    $scope.newTodo = '';
  };

  $scope.toggleTodo = function (todo) {
    var copyTodo = angular.extend({}, todo);
    copyTodo.completed = !copyTodo.completed
    todoStorage.update(copyTodo).success(function(newTodo) {
      if (newTodo === 'null') { // Compare with a string because of https://github.com/angular/angular.js/issues/2973
        $scope.todos.splice($scope.todos.indexOf(todo), 1);
      }
      else {
        $scope.todos[$scope.todos.indexOf(todo)] = newTodo;
        $scope.editedTodo = null;
      }
    }).error(function() {
      console.log('fds');
      alert('Failed to update the status of this TODO');
    });

  };
  $scope.editTodo = function (todo) {
    $scope.editedTodo = todo;
    // Clone the original todo to restore it on demand.
    $scope.originalTodo = angular.extend({}, todo);
  };

  $scope.doneEditing = function (todo, $event) {
    todo.title = todo.title.trim();
    if ((todo._saving !== true) && ($scope.originalTodo.title !== todo.title)) {
      todo._saving = true; // submit and blur trigger this method. Let's save the document just once
      todoStorage.update(todo).success(function(newTodo) {
        if (newTodo === 'null') { // Compare with a string because of https://github.com/angular/angular.js/issues/2973
          console.log('hum');
          $scope.todos.splice($scope.todos.indexOf(todo), 1);
        }
        else {
          $scope.todos[$scope.todos.indexOf(todo)] = newTodo;
          $scope.editedTodo = null;
        }
      }).error(function() {
        todo._saving = false;
        alert('Failed to update this TODO');
      });
    }
    else {
      $scope.editedTodo = null;
    }
  };

  $scope.revertEditing = function (todo) {
    $scope.todos[$scope.todos.indexOf(todo)] = $scope.originalTodo;
    $scope.doneEditing($scope.originalTodo);
  };

  $scope.removeTodo = function (todo) {
    todoStorage.delete(todo.id).success(function() {
      $scope.todos.splice($scope.todos.indexOf(todo), 1);
    }).error(function() {
      alert('Failed to delete this TODO');
    });
  };

  $scope.clearCompletedTodos = function () {
    $scope.todos.forEach(function (todo) {
      if(todo.completed) {
        $scope.removeTodo(todo);
      }
    });
  };

  $scope.markAll = function (completed) {
    $scope.todos.forEach(function (todo) {
      if (todo.completed !== !completed) {
        $scope.toggleTodo(todo);
      }
      //todo.completed = !completed;
    });
  };

});
