(function(angular) {
    'use strict';
    var app = angular.module('FileManagerApp');

    app.directive('angularFilemanager', ['$parse', 'fileManagerConfig', 'apiMiddleware','SocketService',function($parse, fileManagerConfig,ApiMiddleware,SocketService) {
        return {
            restrict: 'EA',
             link: function(scope, elem, attrs){
                var theme = scope.$eval(attrs.theme);
                var folder = attrs['initialFolder'];
                SocketService.connect();
                new ApiMiddleware().initial(folder);
 
                if(theme){
                    $('#bootstrap_theme').attr("href","../bower_components/bootswatch/"+theme+"/bootstrap.min.css");
                }
            },
            templateUrl: fileManagerConfig.tplPath + '/main.html'
        };
    }]);

    app.directive('ngFile', ['$parse', function($parse) {
        return {
            restrict: 'A',
            link: function(scope, element, attrs) {
                var model = $parse(attrs.ngFile);
                var modelSetter = model.assign;

                element.bind('change', function() {
                    scope.$apply(function() {
                        modelSetter(scope, element[0].files);
                    });
                });
            }
        };
    }]);

    app.directive('ngRightClick', ['$parse', function($parse) {
        return function(scope, element, attrs) {
            var fn = $parse(attrs.ngRightClick);
            element.bind('contextmenu', function(event) {
                scope.$apply(function() {
                    event.preventDefault();
                    fn(scope, {$event: event});
                });
            });
        };
    }]);
    
})(angular);
