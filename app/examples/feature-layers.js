'use strict';

angular.module('esri-map-docs')
    .controller('FeatureLayersCtrl', function($scope) {
        $scope.$parent.page = 'examples';
        $scope.map = {
            center: {
                lng: -0.136,
                lat: 51.513
            },
            zoom: 17
        };
    });
