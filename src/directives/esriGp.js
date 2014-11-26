(function(angular) {
    'use strict';

    angular.module('esri.map').directive('esriGp', function($q) {

    	return {

            // element only
            restrict: 'E',

            // you can access these controllers in the link function
            require: ['esriGp', '^esriMap'],

            // replace this element with our template.
            // since we aren't declaring a template this essentially destroys the element
            replace: true,

            scope: {
            	parameters: '=?'
            },

            // define an interface for working with this directive
            controller: function ($scope, $element, $attrs, $http) {
            	console.log('directive controller');

                var gpDeferred = $q.defer();
                var gpDescription = null;

                require([
                    'esri/tasks/Geoprocessor'], function (Geoprocessor) {
                    var gp = new Geoprocessor($attrs.url);
					gp.setOutputSpatialReference({
						wkid: 102100
					});
					console.log('creating gp', gp);

					$http.get($attrs.url + 'f=json')
						.success(function(data,status,headers,config)
						{
							gpDescription = data;
		                    gpDeferred.resolve(gp);
						})
						.error(function(data,status,headers,config)
						{
		                    gpDeferred.reject(status);
						});
                });

                // return the defered that will be resolved with the gp
                this.getGp = function () {
                    return gpDeferred.promise;
                };

                this.getGpDescription = function() {
                	return gpDescription;
                };
            },

            // now we can link our directive to the scope..
            link: function (scope, element, attrs, controllers) {
            	console.log('linking');
                // controllers is now an array of the controllers from the 'require' option
                var gpController = controllers[0];
                var mapController = controllers[1];

                gpController.getGp().then(function (gp) {
                	mapController.getMap().then(function(map)
                	{
                		console.log('setting output sr to', map.spatialReference);
						gp.setOutputSpatialReference( map.spatialReference );

						var gpDescription = gpController.getGpDescription();
						// console.log(gpDescription);

						var inputParameters = gpDescription.parameters.filter(function(p){ return p.direction === 'esriGPParameterDirectionInput';});
						var outputParameters = gpDescription.parameters.filter(function(p){ return p.direction === 'esriGPParameterDirectionOutput';});

						console.log('inputs', inputParameters);
						console.log('outputs', outputParameters);
                	});
                });

                scope.$watch('parameters', function(newParameters,oldParameters)
                {
                	console.log('parameters changed', newParameters);
                });
            }
    	};
    });


})(angular);
