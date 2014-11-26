'use strict';

angular.module('esri-map-docs')
    .controller('BasemapCtrl', function($scope) {
        $scope.$parent.page = 'examples';
        $scope.map = {
            center: {
                lng: -3.688,
                lat: 40.453
            },
            zoom: 16,
            basemap: 'satellite'
        };
    });
