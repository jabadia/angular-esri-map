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
            	parameters: '=?',            	
            	state: '=?',
            	messages: '=?'
            },

            // define an interface for working with this directive
            controller: function ($scope, $element, $attrs, $http) {
            	console.log('directive controller');

                var gpDeferred = $q.defer();
                var gpDescription = null;

                $scope.state = 'initalizing';

                require([
                    'esri/tasks/Geoprocessor'], function (Geoprocessor) {
                    var gp = new Geoprocessor($attrs.url);
					gp.setOutputSpatialReference({
						wkid: 102100
					});
					console.log('creating gp', gp);

					$http.jsonp($attrs.url + '?f=json&callback=JSON_CALLBACK')
						.success(function(data/*,status,headers,config*/)
						{
							gpDescription = data;
		                    gpDeferred.resolve(gp);
						})
						.error(function(data,status/*,headers,config*/)
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

                gpController.getGp().then(function (gp) 
                {
					var gpDescription = gpController.getGpDescription();

					var inputParameters = gpDescription.parameters.filter(function(p){ return p.direction === 'esriGPParameterDirectionInput';});
					var outputParameters = gpDescription.parameters.filter(function(p){ return p.direction === 'esriGPParameterDirectionOutput';});

					console.log('inputs', inputParameters);
					console.log('outputs', outputParameters);

					/* for each input parameter NOT specified in attrs, create a UI element */
					var freeInputParameters = inputParameters.filter(function(p){ return !scope.parameters.hasOwnProperty(p.name)})
					console.log(freeInputParameters);

	                scope.state = 'ready';
                });

                // notice 3rd parameter to $watch(_,_,true), telling angular to look at the properties of the object
                scope.$watch('parameters', function(newParameters,oldParameters) 
                {
                	console.log('parameters changed', newParameters);
                	if(newParameters === null) {
                		return;
                	}

                	require(['esri/graphic','esri/tasks/FeatureSet','esri/graphicsUtils',
							 'esri/symbols/SimpleMarkerSymbol', 'esri/symbols/SimpleLineSymbol', 'esri/symbols/SimpleFillSymbol', 'dojo/_base/Color' ], 
                		function(Graphic,FeatureSet,graphicsUtils, SimpleMarkerSymbol,SimpleLineSymbol,SimpleFillSymbol,Color)
                	{                		
                		var parameters = {};

                		mapController.getMap().then(function(map)
                		{
                			if( map.graphics ) {
								map.graphics.clear();
							}

		                	for(var p in newParameters)
		                	{
		                		if( newParameters[p] === null ) {
		                			return;
		                		}

		                		if( newParameters[p].type === 'point' )
		                		{
									var pointSymbol = new SimpleMarkerSymbol();
									pointSymbol.setSize(14);
									pointSymbol.setOutline(new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255, 0, 0]), 1));
									pointSymbol.setColor(new Color([255, 255, 0, 0.75]));

		                			var graphic = new Graphic(newParameters[p], pointSymbol);
		                			var featureSet = new FeatureSet();
		                			featureSet.features = [ graphic ];
		                			parameters[p] = featureSet;
									map.graphics.add(graphic);
		                		}
		                		else
		                		{
		                			parameters[p] = newParameters[p];
		                		}
		                	}

			                gpController.getGp().then(function (gp) {
			                	console.log('invoking gp',gp, parameters);
								scope.state = 'working';
		                		console.log('setting output sr to', map.spatialReference);
								gp.setOutputSpatialReference( map.spatialReference );
			                	gp.execute(parameters, function(results,messages)
			                	{
									var pointSymbol = new SimpleMarkerSymbol();
									pointSymbol.setSize(14);
									pointSymbol.setOutline(new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255, 0, 0]), 1));
									pointSymbol.setColor(new Color([255, 0, 0, 0.75]));

									var polySymbol = new SimpleFillSymbol();
									polySymbol.setOutline(new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0, 0, 255, 0.5]), 1));
									polySymbol.setColor(new Color([0, 127, 255, 0.6]));

			                		console.log(results);
			                		console.log(messages);

									for(var i=0; i<results.length; i++)
									{										
										var features = results[i].value.features;
										for (var f = 0, fl = features.length; f < fl; f++) {
											var feature = features[f];
											console.log(results[i].value.geometryType);
											switch(results[i].value.geometryType)
											{
												case 'esriGeometryPoint':
													console.log('pointSymbol', pointSymbol);
													feature.setSymbol(pointSymbol);	
													break;
												case 'esriGeometryPolygon':
													console.log('polySymbol', polySymbol);
													feature.setSymbol(polySymbol);
													break;
											}
											console.log(feature);
											map.graphics.add(feature).getDojoShape().moveToBack();
										}
									}
									console.log(map.graphics.graphics);
									map.setExtent(graphicsUtils.graphicsExtent(map.graphics.graphics), true);
									scope.$apply(function()
									{
										scope.messages = messages;
										scope.state = 'ready';										
									});
		                		});
			                });
			            });	
                	});

                }, true);
            }
    	};
    });


})(angular);
