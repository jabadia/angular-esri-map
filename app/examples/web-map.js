'use strict';

angular.module('esri-map-docs')
    .controller('WebMapCtrl', function($scope, esriLoader, esriRegistry) {
        $scope.$parent.page = 'examples';
        $scope.map = {
            center: {
                lng: null,
                lat: null
            },
            zoom: null
        };
        $scope.goToBookmark = function(bookmark) {
            esriRegistry.get('myMap').then(function(map) {
                esriLoader('esri/geometry/Extent').then(function(Extent) {
                    var extent = new Extent(bookmark.extent);
                    map.setExtent(extent);
                });
            });
        };
    });
