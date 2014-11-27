'use strict';

angular.module('esri-map-docs')
    .controller('Gp2Ctrl', function($scope) {
        $scope.$parent.page = 'examples';
        $scope.map = {
            center: {
                lng: -122.45,
                lat: 37.75
            },
            zoom: 14
        };
        $scope.parameters = { Input_Location: null, Drive_Times: "1 5 10" };
        $scope.gpstate = "ready";
        $scope.messages = [];
    });
