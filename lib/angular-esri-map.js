(function(angular) {
    'use strict';

    angular.module('esri.map', []);

    angular.module('esri.map').factory('esriLoader', function ($q) {
        return function(moduleName){
            var deferred = $q.defer();

            require([moduleName], function(module){
                if(module){
                    deferred.resolve(module);
                } else {
                    deferred.reject('Couldn\'t load ' + moduleName);
                }
            });

            return deferred.promise;
        };
    });

})(angular);

(function (angular) {
  'use strict';

  angular.module('esri.map').service('esriRegistry', function ($q) {
    var registry = {};

    return {
      _register: function(name, deferred){
        // if there isn't a promise in the registry yet make one...
        // this is the case where a directive is nested higher then the controller
        // needing the instance
        if (!registry[name]){
          registry[name] = $q.defer();
        }

        var instance = registry[name];

        // when the deferred from the directive is rejected/resolved
        // reject/resolve the promise in the registry with the appropriate value
        deferred.promise.then(function(arg){
          instance.resolve(arg);
          return arg;
        }, function(arg){
          instance.reject(arg);
          return arg;
        });

        return function(){
          delete registry[name];
        };
      },

      get: function(name){
        // is something is already in the registry return its promise ASAP
        // this is the case where you might want to get a registry item in an
        // event handler
        if(registry[name]){
          return registry[name].promise;
        }

        // if we dont already have a registry item create one. This covers the
        // case where the directive is nested inside the controler. The parent
        // controller will be executed and gets a promise that will be resolved
        // later when the item is registered
        var deferred = $q.defer();

        registry[name] = deferred;

        return deferred.promise;
      }
    };
  });

})(angular);
(function(angular) {
    'use strict';

    angular.module('esri.map').directive('esriMap', function($q, $timeout, esriLoader, esriRegistry) {

        return {
            // element only
            restrict: 'E',

            // isoloate scope
            scope: {
                // two-way binding for center/zoom
                // because map pan/zoom can chnage these
                center: '=?',
                zoom: '=?',
                itemInfo: '=?',
                clickPoint: '=?',
                // one-way binding for other properties
                basemap: '@',
                // function binding for event handlers
                load: '&',
                extentChange: '&'
            },

            // replace tag with div with same id
            compile: function($element, $attrs) {
                // remove the id attribute from the main element
                $element.removeAttr('id');

                // append a new div inside this element, this is where we will create our map
                $element.append('<div id=' + $attrs.id + '></div>');

                // since we are using compile we need to return our linker function
                // the 'link' function handles how our directive responds to changes in $scope
                /*jshint unused: false*/
                return function(scope, element, attrs, controller) {
                };
            },

            // directive api
            controller: function($scope, $element, $attrs) {
                // only do this once per directive
                // this deferred will be resolved with the map
                var mapDeferred = $q.defer();

                // add this map to the registry
                if($attrs.registerAs){
                    var deregister = esriRegistry._register($attrs.registerAs, mapDeferred);

                    // remove this from the registry when the scope is destroyed
                    $scope.$on('$destroy', deregister);
                }

                require(['esri/map','esri/arcgis/utils'], function(Map, arcgisUtils)
                {
                    if($attrs.webmapId)
                    {
                        arcgisUtils.createMap($attrs.webmapId,$attrs.id).then(function(response)
                        {
                            mapDeferred.resolve(response.map);                            

                            var geoCenter = response.map.geographicExtent.getCenter();
                            $scope.center.lng = geoCenter.x;
                            $scope.center.lat = geoCenter.y;
                            $scope.zoom = response.map.getZoom();
                            $scope.itemInfo = response.itemInfo;
                        });                    
                    }
                    else
                    {
                        // setup our map options based on the attributes and scope
                        var mapOptions = {};

                        // center/zoom/extent
                        // check for convenience extent attribute
                        // otherwise get from scope center/zoom
                        if ($attrs.extent) {
                            mapOptions.extent = $scope[$attrs.extent];
                        } else {
                            if ($scope.center.lng && $scope.center.lat) {
                                mapOptions.center = [$scope.center.lng, $scope.center.lat];
                            } else if ($scope.center) {
                                mapOptions.center = $scope.center;
                            }
                            if ($scope.zoom) {
                                mapOptions.zoom = $scope.zoom;
                            }
                        }

                        // basemap
                        if ($scope.basemap) {
                            mapOptions.basemap = $scope.basemap;
                        }

                        // initialize map and resolve the deferred
                        var map = new Map($attrs.id, mapOptions);
                        mapDeferred.resolve(map);
                    }

                    mapDeferred.promise.then(function(map)
                    {
                        // make a reference to the map object available
                        // to the controller once it is loaded.
                        map.on('load', function() {
                            if (!$attrs.load) {
                                return;
                            }
                            $scope.$apply(function() {
                                $scope.load()(map);
                            });
                        });

                        // listen for changes to scope and update map
                        $scope.$watch('basemap', function(newBasemap, oldBasemap) {
                            if (map.loaded && newBasemap !== oldBasemap) {
                                map.setBasemap(newBasemap);
                            }
                        });

                        $scope.inUpdateCycle = false;

                        $scope.$watch(function(scope){ return [scope.center.lng,scope.center.lat, scope.zoom].join(',');}, function(newCenterZoom,oldCenterZoom)
                        // $scope.$watchGroup(['center.lng','center.lat', 'zoom'], function(newCenterZoom,oldCenterZoom) // supported starting at Angular 1.3
                        {
                            if( $scope.inUpdateCycle ) {                            
                                return;
                            }

                            console.log('center/zoom changed', newCenterZoom, oldCenterZoom);
                            newCenterZoom = newCenterZoom.split(',');
                            if( newCenterZoom[0] !== '' && newCenterZoom[1] !== '' && newCenterZoom[2] !== '' )
                            {                            
                                $scope.inUpdateCycle = true;  // prevent circular updates between $watch and $apply
                                map.centerAndZoom([newCenterZoom[0], newCenterZoom[1]], newCenterZoom[2]).then(function()
                                {
                                    console.log('after centerAndZoom()');
                                    $scope.inUpdateCycle = false;
                                });
                            }
                        });

                        map.on('extent-change', function(e) 
                        {
                            if( $scope.inUpdateCycle ) {                            
                                return;
                            }

                            $scope.inUpdateCycle = true;  // prevent circular updates between $watch and $apply

                            console.log('extent-change geo', map.geographicExtent);

                            $scope.$apply(function()
                            {
                                var geoCenter = map.geographicExtent.getCenter();

                                $scope.center.lng = geoCenter.x;
                                $scope.center.lat = geoCenter.y;
                                $scope.zoom = map.getZoom();

                                // we might want to execute event handler even if $scope.inUpdateCycle is true
                                if( $attrs.extentChange ) {                                
                                    $scope.extentChange()(e);
                                }

                                $timeout(function(){ 
                                    // this will be executed after the $digest cycle
                                    console.log('after apply()'); 
                                    $scope.inUpdateCycle = false; 
                                },0);
                            });
                        });

                        if($scope.clickPoint !== undefined)
                        {
                            console.log('registering click event');
                            map.on('click', function(e)
                            {
                                $scope.$apply(function() // because we are now in a esri callback outside of angular cycle
                                {
                                    console.log('map clicked on',e.mapPoint);
                                    $scope.clickPoint = e.mapPoint; 
                                });
                            });
                        }

                        // clean up
                        $scope.$on('$destroy', function () {
                            map.destroy();
                            // TODO: anything else?
                        });
                    });
                });

                // method returns the promise that will be resolved with the map
                this.getMap = function() {
                    return mapDeferred.promise;
                };

                // adds the layer, returns the promise that will be resolved with the result of map.addLayer
                this.addLayer = function(layer) {
                    return this.getMap().then(function(map) {
                        return map.addLayer(layer);
                    });
                };

                // array to store layer info, needed for legend
                // TODO: is this the right place for this?
                // can it be done on the legend directive itself?
                this.addLayerInfo = function(lyrInfo) {
                    if (!this.layerInfos) {
                        this.layerInfos = [lyrInfo];
                    } else {
                        this.layerInfos.push(lyrInfo);
                    }
                };
                this.getLayerInfos = function() {
                    return this.layerInfos;
                };
            }
        };
    });

})(angular);

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

(function(angular) {
    'use strict';

    angular.module('esri.map').directive('esriFeatureLayer', function ($q) {
        // this object will tell angular how our directive behaves
        return {
            // only allow esriFeatureLayer to be used as an element (<esri-feature-layer>)
            restrict: 'E',

            // require the esriFeatureLayer to have its own controller as well an esriMap controller
            // you can access these controllers in the link function
            require: ['esriFeatureLayer', '^esriMap'],

            // replace this element with our template.
            // since we aren't declaring a template this essentially destroys the element
            replace: true,

            // define an interface for working with this directive
            controller: function ($scope, $element, $attrs) {
                var layerDeferred = $q.defer();

                require([
                    'esri/layers/FeatureLayer'], function (FeatureLayer) {
                    var layer = new FeatureLayer($attrs.url);

                    layerDeferred.resolve(layer);
                });

                // return the defered that will be resolved with the feature layer
                this.getLayer = function () {
                    return layerDeferred.promise;
                };
            },

            // now we can link our directive to the scope, but we can also add it to the map..
            link: function (scope, element, attrs, controllers) {
                // controllers is now an array of the controllers from the 'require' option
                var layerController = controllers[0];
                var mapController = controllers[1];

                layerController.getLayer().then(function (layer) {
                    // add layer
                    mapController.addLayer(layer);

                    //look for layerInfo related attributes. Add them to the map's layerInfos array for access in other components
                    mapController.addLayerInfo({
                      title: attrs.title || layer.name,
                      layer: layer,
                      hideLayers: (attrs.hideLayers) ? attrs.hideLayers.split(',') : undefined,
                      defaultSymbol: (attrs.defaultSymbol) ? JSON.parse(attrs.defaultSymbol) : true
                    });

                    // return the layer
                    return layer;
                });
            }
        };
    });

})(angular);

(function(angular) {
    'use strict';

    /**
     * @ngdoc directive
     * @name esriApp.directive:esriLegend
     * @description
     * # esriLegend
     */
    angular.module('esri.map')
      .directive('esriLegend', function ($document, $q) {
        return {
          //run last
          priority: -10,
          scope:{},
          replace: true,
          // require the esriMap controller
          // you can access these controllers in the link function
          require: ['^esriMap'],

          // now we can link our directive to the scope, but we can also add it to the map..
          link: function(scope, element, attrs, controllers){
            // controllers is now an array of the controllers from the 'require' option
            var mapController = controllers[0];
            var targetId = attrs.targetId || attrs.id;
            var legendDeferred = $q.defer();

            require(['esri/dijit/Legend', 'dijit/registry'], function (Legend, registry) {
              mapController.getMap().then(function(map) {
                var opts = {
                    map: map
                };
                var layerInfos = mapController.getLayerInfos();
                if (layerInfos) {
                  opts.layerInfos = layerInfos;
                }
                // NOTE: need to come up w/ a way to that is not based on id
                // or handle destroy at end of this view's lifecyle
                var legend = registry.byId(targetId);
                if (legend) {
                  legend.destroyRecursive();
                }
                legend = new Legend(opts, targetId);
                legend.startup();
                scope.layers = legend.layers;
                angular.forEach(scope.layers, function(layer, i) {
                  scope.$watch('layers['+i+'].renderer',function() {
                    legend.refresh();
                  });
                });
                legendDeferred.resolve(legend);
              });
            });
          }
        };
      });

})(angular);
