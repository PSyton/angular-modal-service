//  angularModalService.js
//
//  Service for showing modal dialogs.

/***** JSLint Config *****/
/*global angular  */
(function() {

  'use strict';

  var module = angular.module('angularModalService', []);

  module.factory('ModalService', ['$document', '$compile', '$controller', '$http', '$rootScope', '$q', '$timeout', '$templateCache', '$injector',
    function($document, $compile, $controller, $http, $rootScope, $q, $timeout, $templateCache, $injector) {

    //  Get the body of the document, we'll add the modal to this.
    var body = $document.find('body');

    function ModalService() {

      var self = this;

      //  Returns a promise which gets the template, either
      //  from the template parameter or via a request to the
      //  template url parameter.
      var getTemplate = function(template, templateUrl) {
        var deferred = $q.defer();
        if(template) {
          deferred.resolve(template);
        } else if(templateUrl) {
          // check to see if the template has already been loaded
          var cachedTemplate = $templateCache.get(templateUrl);
          if(cachedTemplate !== undefined) {
            deferred.resolve(cachedTemplate);
          }
          // if not, let's grab the template for the first time
          else {
            $http({method: 'GET', url: templateUrl, cache: true})
              .then(function(result) {
                // save template into the cache and return the template
                $templateCache.put(templateUrl, result.data);
                deferred.resolve(result.data);
              })
              .catch(function(error) {
                deferred.reject(error);
              });
          }
        } else {
          deferred.reject("No template or templateUrl has been specified.");
        }
        return deferred.promise;
      };

      var resolveLocals = function(aLocals) {
        var deferred = $q.defer();
        if (!aLocals) {
          deferred.resolve(null);
        }

        var locals = angular.extend({}, aLocals);
        angular.forEach(locals, function(value, key) {
          locals[key] = angular.isString(value) ? $injector.get(value) : $injector.invoke(value);
        });

        $q.all(locals).then(function(aResolvedLocals) {
          deferred.resolve(aResolvedLocals);
        }, function(error) {
          deferred.reject(error);
        });

        return deferred.promise;
      };

      self.showModal = function(options) {

        //  Create a deferred we'll resolve when the modal is ready.
        var deferred = $q.defer();

        //  Validate the input parameters.
        var controllerName = options.controller;
        if(!controllerName) {
          deferred.reject("No controller has been specified.");
          return deferred.promise;
        }

        //  If a 'controllerAs' option has been provided, we change the controller
        //  name to use 'as' syntax. $controller will automatically handle this.
        if(options.controllerAs) {
          controllerName = controllerName + " as " + options.controllerAs;
        }

        // Try to resolve additional dependancies
        resolveLocals(options.locals).then(function(locals) {

          //  Get the actual html of the template.
          getTemplate(options.template, options.templateUrl)
            .then(function(template) {

              //  Create a new scope for the modal.
              var modalScope = $rootScope.$new();

              //  Create the inputs object to the controller - this will include
              //  the scope, as well as all inputs provided.
              //  We will also create a deferred that is resolved with a provided
              //  close function. The controller can then call 'close(result)'.
              //  The controller can also provide a delay for closing - this is
              //  helpful if there are closing animations which must finish first.
              var closeDeferred = $q.defer();
              var inputs = {
                $scope: modalScope,
                close: function(result, delay) {
                  if(delay === undefined || delay === null) delay = 0;
                  $timeout(function () {
                    closeDeferred.resolve(result);
                  }, delay);
                },
                locals: locals
              };

              //  If we have provided any inputs, pass them to the controller.
              inputs = angular.extend(inputs, options.inputs);

              //  Parse the modal HTML into a DOM element (in template form).
              var modalElementTemplate = angular.element(template);

              //  Compile then link the template element, building the actual element.
              //  Set the $element on the inputs so that it can be injected if required.
              var linkFn = $compile(modalElementTemplate);

              //  Create the controller, explicitly specifying the scope to use.
              var modalController = $controller(controllerName, inputs);
              
              var modalElement = linkFn(modalScope);
              inputs.$element = modalElement;

              //  Finally, append the modal to the dom.
              if (options.appendElement) {
                // append to custom append element
                options.appendElement.append(modalElement);
              } else {
                // append to body when no custom append element is specified
                body.append(modalElement);
              }

              //  We now have a modal object.
              var modal = {
                controller: modalController,
                scope: modalScope,
                element: modalElement,
                close: closeDeferred.promise
              };

              //  When close is resolved, we'll clean up the scope and element.
              modal.close.then(function(result) {
                //  Clean up the scope
                modalScope.$destroy();
                //  Remove the element from the dom.
                modalElement.remove();
              });

              deferred.resolve(modal);
            })
            .catch(function(error) {
              deferred.reject(error);
            });
        }).catch(function(error) {
          deferred.reject(error);
        });

        return deferred.promise;
      };

    }

    return new ModalService();
  }]);

}());
