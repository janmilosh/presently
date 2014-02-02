angular.module('myApp', ['ngRoute', 'ngSanitize'])

.provider('Weather', function() {
	var apiKey = "";
	this.getUrl = function(type, ext) {
		return 'http://api.wunderground.com/api/' + 
			this.apiKey + '/' + type + '/q/' +
			ext + '.json';
	};
	this.setApiKey = function(key) {
		if (key) this.apiKey = key;
	};
	
	this.$get = function($q, $http) {
		var self = this;
		return {
			getWeatherForecast: function(city) {
				var d = $q.defer();
				$http({
					method: 'GET',
					url: self.getUrl('forecast', city),
					cache: true
				}).success(function(data) {
					d.resolve(data.forecast);
				}).error(function(err) {
					d.reject(err);
				});
				return d.promise;
			},
			getCityDetails: function(query) {
			  var d = $q.defer();
			  $http({
			    method: 'GET',
			    url: "http://autocomplete.wunderground.com/aq?query=" + query
			  }).success(function(data) {
			    d.resolve(data.RESULTS);
			  }).error(function(err) {
			    d.reject(err);
			  });
			  return d.promise;
			}
		};
	};
})

.config(function(WeatherProvider) {
	WeatherProvider.setApiKey('daea4dbf8e2953aa');
})
.config(['$routeProvider', function($routeProvider) {
	$routeProvider
	.when('/', {
		templateUrl: 'templates/home.html',
		controller: 'MainCtrl'
	})
	.when('/settings', {
		templateUrl: 'templates/settings.html',
		controller: 'SettingsCtrl'
	})
	.otherwise({redirectTo: '/'});
}])
.directive('autoFill', function($timeout, Weather) {
  return {
    restrict: 'EA',
    scope: {
      autoFill: '&',
      ngModel: '='
    },
    compile: function(tEle, tAttrs) {
      var tplEl = angular.element(
      '<div class="typeahead"> \
      	<input type="text" autocomplete="off" /> \
      	<ul id="autolist" ng-show="reslist"> \
        	<li ng-repeat="res in reslist">{{res.name}}</li> \
      	</ul> \
      </div>');
      var input = tplEl.find('input');
      input.attr('type', tAttrs.type);
      input.attr('ng-model', tAttrs.ngModel);
      tEle.replaceWith(tplEl);
      return function(scope, ele, attrs, ctrl) {
        var minKeyCount = attrs.minKeyCount || 3, timer;
        ele.bind('keyup', function(e) {
          val = ele.val();
     //     scope.reslist = data;
          if (val.length < minKeyCount) {
            if (timer) $timeout.cancel(timer);
            scope.reslist = null;
            return;
          } else {
            if (timer) $timeout.cancel(timer);
            timer = $timeout(function() {
              scope.autoFill()(val)
              .then(function(data) {
                if (data && data.length > 0) {
                  scope.reslist = data;
                  scope.ngModel = data[0].name;
                }
              });
            }, 1000);
          }
        });
 
        // Hide the reslist on blur
        input.bind('blur', function(e) {
          scope.reslist = null;
          scope.$digest();
        });
      };
    }
  };
})
.controller('MainCtrl', function($scope, $timeout, Weather, UserService) {

	$scope.weather = {};
	$scope.success = false;
	$scope.user = UserService.user;
	if(!$scope.user.location) {
		$scope.user.location = 'autoip';
	}
	Weather.getWeatherForecast($scope.user.location)
	.then(function(data) {
		$scope.success = true;
		$scope.weather.forecast = data;
		$scope.timezone = $scope.weather.forecast.simpleforecast.forecastday[0].date.tz_long;
	});

	$scope.date = {};
	var updateTime = function() {
		$scope.date.tz = new Date(new Date().toLocaleString(
          "en-US", {timeZone: $scope.timezone}
        ));
		$scope.date.raw = new Date();
		$timeout(updateTime, 1000);
	};
	updateTime();

	$scope.prettyLocation = function() {
		var location = $scope.user.location;
		var capitalize = function(str) {
    	var pieces = str.split(" ");
    	for (var i = 0; i < pieces.length; i++) {
        var j = pieces[i].charAt(0).toUpperCase();
        pieces[i] = j + pieces[i].substr(1);
    	}
    	return pieces.join(" ");
		};
		if (location !== 'autoip') {
			prettifiedLocation = capitalize(location);
			return prettifiedLocation;
		} else {
			return '';
		}
	};
	

	function whatsTheWeather(index) {
		$scope.gotWeather = $scope.success;
		$scope.dayLabel = $scope.weather.forecast.txt_forecast.forecastday[index*2].title;
		$scope.nightLabel = $scope.weather.forecast.txt_forecast.forecastday[index*2 + 1].title;
		$scope.dayTime =  $scope.weather.forecast.txt_forecast.forecastday[index*2].fcttext;
		$scope.nightTime = $scope.weather.forecast.txt_forecast.forecastday[index*2 +1].fcttext;
		$scope.timezone = $scope.weather.forecast.simpleforecast.forecastday[0].date.tz_long;
	};
	
	$scope.$watch('success', function(newValue, oldValue) {
	  if (newValue === true) {
	  	$scope.activeClass = 'active';
	  	$scope.transitionClass = '';
	  	whatsTheWeather(0);
	  }
	});

	$scope.mouseEnterForecast = function(index) {
		if (index > 0 ) {	
			$scope.activeClass = '';
			$scope.transitionClass = 'transition'
			$timeout(function() {
				$scope.transitionClass = ''
				$scope.activeClass = 'active';
				whatsTheWeather(index);
			}, 1000);
		} else {
			whatsTheWeather(index);
		}	
	};	

	$scope.mouseOutForecast = function(index) {
		if (index > 0 ) {
			$scope.activeClass = '';
			$scope.transitionClass = 'transition';
			$timeout(function() {
				$scope.transitionClass = '';
				$scope.activeClass = 'active';
				whatsTheWeather(0);
			}, 1000);
		} else {
			whatsTheWeather(0);
		}
	};	
})

.factory('UserService', function() {
	var defaults = {
		location: 'autoip'
	};

	var service = {
		user: {},
		save: function() {
			localStorage.presently = angular.toJson(service.user);
		},
		restore: function() {
			//Pull from localStorage
			service.user = angular.fromJson(localStorage.presently) || defaults;
			return service.user;
		}
	};
	service.restore();
	return service;
})
.controller('SettingsCtrl', 
  function($scope, $location, Weather, UserService) {
    $scope.user = UserService.user;
 
    $scope.save = function() {
      UserService.save();
      $location.path('/');
    }
    $scope.fetchCities = Weather.getCityDetails;
});
