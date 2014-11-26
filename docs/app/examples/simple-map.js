'use strict';

angular.module('esri-map-docs')
    .controller('SimpleMapCtrl', function($scope) {
        $scope.$parent.page = 'examples';
        $scope.map = {
            center: {
                lng: -3.692,
                lat: 40.426
            },
            zoom: 16
        };
    });
