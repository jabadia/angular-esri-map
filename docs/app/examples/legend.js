'use strict';

angular.module('esri-map-docs')
    .controller('LegendCtrl', function($scope) {
        $scope.$parent.page = 'examples';
        $scope.map = {
            center: {
                lng: 0.032,
                lat: 42.608
            },
            zoom: 11
        };
    });
