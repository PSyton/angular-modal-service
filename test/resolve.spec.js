describe('controller', function() {

  var ModalService = null;
  var $httpBackend = null;
  var $timeout = null;

  angular.module('resolvetests', ['angularModalService'])
    .factory("Dep1", function() {
      return {
        x: 0
      };
    })
    .factory("Dep2", function() {
      return {
        y: "XX"
      };
    })
    .controller('EmpyResolveController', function ($scope, close, locals) {
      $scope.locals = locals;
    });

  beforeEach(function() {
    module('resolvetests');
    inject(function(_ModalService_, $injector) {
      ModalService = _ModalService_;
      $httpBackend = $injector.get('$httpBackend');
      $timeout = $injector.get('$timeout');
      $httpBackend.when('GET', 'some/controllertemplate.html').respond("<div id='controllertemplate'>controller template</div>");
    });
  });

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });
 
  it('should inject empty locals if no locals set in params', function() {
    $httpBackend.expectGET('some/controllertemplate.html');

    ModalService.showModal({
      controller: "EmpyResolveController",
      templateUrl: "some/controllertemplate.html"
    }).then(function(modal) {
      expect(modal.scope.locals).toBeNull();
    });

    $httpBackend.flush();
  });

  it('should inject locals from string dependancy', function() {
    $httpBackend.expectGET('some/controllertemplate.html');    

    ModalService.showModal({
      controller: "EmpyResolveController",
      templateUrl: "some/controllertemplate.html",
      locals: {"t1": "Dep1", "t2": "Dep2"}
    }).then(function(modal) {
      expect(modal.scope.locals.t1).toBeDefined();
      expect(modal.scope.locals.t1.x).toBe(0);
      expect(modal.scope.locals.t2).toBeDefined();
      expect(modal.scope.locals.t2.y).toBe("XX");
    });

    $httpBackend.flush();
  });

  it('should inject locals from resolver', function() {
    $httpBackend.expectGET('some/controllertemplate.html');    

    function createResolver() {
      resolve.$inject = ['$q'];
      function resolve($q) {
        var deferred = $q.defer();
        deferred.resolve({z: "qwe"});
        return deferred.promise;
      }

      return resolve;
    }

    ModalService.showModal({
      controller: "EmpyResolveController",
      templateUrl: "some/controllertemplate.html",
      locals: {"t": createResolver()}
    }).then(function(modal) {
      expect(modal.scope.locals.t).toBeDefined();
      expect(modal.scope.locals.t.z).toBe("qwe");
    });

    $httpBackend.flush();
  });

  it('should rejected when failed to resolve locals', function() {
    function createResolver() {
      resolve.$inject = ['$q'];
      function resolve($q) {
        var deferred = $q.defer();
        deferred.reject("some error");
        return deferred.promise;
      }
      
      return resolve;
    }

    ModalService.showModal({
      controller: "EmpyResolveController",
      templateUrl: "some/controllertemplate.html",
      locals: {"t": createResolver()}
    }).then(function(modal) {
      expect(false).toBe(true);
    }).catch(function(error) {
      expect(error).toBe("some error");
    });
  });

});
