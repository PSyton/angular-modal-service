describe('controller', function() {

  var ModalService = null;
  var $httpBackend = null;
  var $timeout = null;

  angular.module('controllertests', ['angularModalService'])
    .controller('CloseController', function ($scope, close) {
      $scope.close = close;
    })
    .controller('InputsController', function ($scope, input1, input2, close) {
      $scope.input1 = input1;
      $scope.input2 = input2;
      $scope.close = close;
    })
    .controller('ControllerAsController', function() {
      this.character = "Fry";
    });

  beforeEach(function() {
    module('controllertests');
    inject(function(_ModalService_, $injector) {
      ModalService = _ModalService_;
      $httpBackend = $injector.get('$httpBackend');
      $timeout = $injector.get('$timeout');
      $httpBackend.when('GET', 'some/controllertemplate.html').respond("<div id='controllertemplate'>controller template</div>");
      $httpBackend.when('GET', 'some/controllertemplate1.html').respond("<div id='controllertemplate'><div ng-if=\"futurama.character == 'Fry'\"><span id='xyz'>Hello!!!</span></div></div>");
    });
  });

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });
 
  it('should inject the close function into the controller', function() {

    $httpBackend.expectGET('some/controllertemplate.html');

    ModalService.showModal({
      controller: "CloseController",
      templateUrl: "some/controllertemplate.html"
    }).then(function(modal) {
      
      //  The controller we've created should put the close function on
      //  the scope, this is how we test it's been passed.
      expect(modal.scope.close).not.toBeUndefined();

    });

    $httpBackend.flush();
  
  });

  it('should inject inputs to the controller', function() {

    $httpBackend.expectGET('some/controllertemplate.html');

    ModalService.showModal({
      controller: "InputsController",
      templateUrl: "some/controllertemplate.html",
      inputs: {
        input1: 15,
        input2: "hi"
      }
    }).then(function(modal) {
      
      //  The controller sets the inputs on the scope.
      expect(modal.scope.input1).toBe(15);
      expect(modal.scope.input2).toBe("hi");

    });

    $httpBackend.flush();

  });

  /*
  it('controller shoulkd be instantiated before template', function() {

    $httpBackend.expectGET('some/controllertemplate1.html');

    ModalService.showModal({
      controller: 'ControllerAsController',
      controllerAs: 'futurama',
      templateUrl: 'some/controllertemplate1.html'
    }).then(function(modal) {
      
      //  The controller should be on the scope.
      expect(modal.scope.futurama).not.toBeNull();

      //  Fields defined on the controller instance should be on the 
      //  controller on the scope.
      expect(modal.scope.futurama.character).toBe('Fry');

      console.log(modal.element.html());

      expect(modal.element.find("#xyz").length > 0).toBe(true);
    });

    $httpBackend.flush();

  });
*/

});
