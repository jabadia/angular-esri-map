(function(angular) {
    'use strict';
    angular
        .module('esri-map-docs', ['ngRoute', 'ngSanitize', 'esri.map'])
        .config(function($routeProvider) {
            $routeProvider
            .when('/examples', {
                templateUrl: 'app/examples/examples.html',
                controller: 'ExamplesCtrl'
            })
            .when('/examples/simple-map', {
                templateUrl: 'app/examples/simple-map.html',
                controller: 'SimpleMapCtrl'
            })
            .when('/examples/feature-layers', {
                templateUrl: 'app/examples/feature-layers.html',
                controller: 'FeatureLayersCtrl'
            })
            .when('/examples/web-map', {
                templateUrl: 'app/examples/web-map.html',
                controller: 'WebMapCtrl'
            })
            .when('/examples/legend', {
                templateUrl: 'app/examples/legend.html',
                controller: 'LegendCtrl'
            })
            .when('/examples/center-and-zoom', {
                templateUrl: 'app/examples/center-and-zoom.html',
                controller: 'CenterAndZoomCtrl'
            })
            .when('/examples/basemap', {
                templateUrl: 'app/examples/basemap.html',
                controller: 'BasemapCtrl'
            })
            .when('/examples/map-events', {
                templateUrl: 'app/examples/map-events.html',
                controller: 'MapEventsCtrl'
            })
            .when('/examples/gp', {
                templateUrl: 'app/examples/gp.html',
                controller: 'GpCtrl'
            })
            .when('/examples/gp2', {
                templateUrl: 'app/examples/gp2.html',
                controller: 'Gp2Ctrl'
            })
            .when('/about', {
                templateUrl: 'app/about/about.html',
                controller: 'AboutCtrl'
            })
            .otherwise({
                redirectTo: '/examples'
            });
        });
})(angular);
