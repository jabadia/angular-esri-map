'use strict';

angular.module('esri-map-docs')
    .controller('Gp2Ctrl', function($scope) {
        $scope.$parent.page = 'examples';
        $scope.map = {
            center: {
                lng: -80.162,
                lat: 25.700
            },
            zoom: 11
        };
        $scope.parameters = { Input_Location: null, Drive_Times: "2 4 6" };
        $scope.gpstate = "ready";
        $scope.messages = [];
    });
