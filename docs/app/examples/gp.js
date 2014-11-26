'use strict';

angular.module('esri-map-docs')
    .controller('GpCtrl', function($scope) {
        $scope.$parent.page = 'examples';
        $scope.map = {
            center: {
                lng: -3.692,
                lat: 40.426
            },
            zoom: 16
        };
        $scope.parameters = { Pour_Point: null };

        $scope.$watch('parameters.Pour_Point', function(newpoint,oldpoint)
        {
            console.log("Pour_Point", newpoint);
        })
    });
