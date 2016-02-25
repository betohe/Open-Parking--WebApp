'use strict';

describe('Controller: NewChatController', function() {

  // load the controller's module
  beforeEach(module('camarboardApp'));
  beforeEach(module('socketMock'));

  var scope;
  var NewChatController;
  var $httpBackend;

  // Initialize the controller and a mock scope
  beforeEach(inject(function(_$httpBackend_, $controller, $rootScope) {
    $httpBackend = _$httpBackend_;
    $httpBackend.expectGET('/api/things')
      .respond(['HTML5 Boilerplate', 'AngularJS', 'Karma', 'Express']);

    scope = $rootScope.$new();
    NewChatController = $controller('NewChatController', {
      $scope: scope
    });
  }));

  it('should attach a list of things to the controller', function() {
    $httpBackend.flush();
    expect(NewChatController.awesomeThings.length).toBe(4);
  });
});
