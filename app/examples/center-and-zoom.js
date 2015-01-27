'use strict';

angular.module('esri-map-docs')
    .controller('CenterAndZoomCtrl', function($scope) {
        $scope.$parent.page = 'examples';
        $scope.map = {
            center: {
                lng: -3.676,
                lat: 40.430
            },
            zoom: 12,
            basemap: 'streets'
        };
        $scope.cities = {
            Madrid: {
                lng: -3.676,
                lat: 40.430,
                zoom: 12
            },
            Barcelona: {
                lng: 2.145,
                lat: 41.390,
                zoom: 12
            },
            Zaragoza: {
                lng: -0.886,
                lat: 41.651,
                zoom: 12
            }
        };
        $scope.zoomToCity = function(city) {
            $scope.map.center.lat = city.lat;
            $scope.map.center.lng = city.lng;
            $scope.map.zoom = city.zoom;
        }
    });
