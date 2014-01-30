angular.module('myApp', ['ngRoute', 'ngSanitize'])

.provider('Weather', function() {
	var apiKey = "";
	this.getUrl = function(type, ext) {
		return "http://api.wunderground.com/api/" + 
			this.apiKey + "/" + type + "/q/" +
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
					url: self.getUrl("forecast", city),
					cache: true
				}).success(function(data) {
					d.resolve(data.forecast);
				}).error(function(err) {
					d.reject(err);
				});
				return d.promise;
			}
		}
	}
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
.controller('MainCtrl', function($scope, $timeout, Weather, UserService) {

	$scope.date = {};
	var updateTime = function() {
		$scope.date.raw = new Date();
		$timeout(updateTime, 1000)
	}
	updateTime();

	$scope.weather = {};
	$scope.success = false;
	$scope.user = UserService.user;
	Weather.getWeatherForecast($scope.user.location)
	.then(function(data) {
		$scope.success = true;
		$scope.weather.forecast = data;
	});

	function whatsTheWeather(index) {
		$scope.gotWeather = $scope.success;
		$scope.dayLabel = $scope.weather.forecast.txt_forecast.forecastday[index*2].title;
		$scope.nightLabel = $scope.weather.forecast.txt_forecast.forecastday[index*2 + 1].title;
		$scope.dayTime =  $scope.weather.forecast.txt_forecast.forecastday[index*2].fcttext;
		$scope.nightTime = $scope.weather.forecast.txt_forecast.forecastday[index*2 +1].fcttext;
	}
	
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
	// Immediately call restore from the session storage
	// so we have our user data available immediately
	service.restore();
	return service;
})
.controller('SettingsCtrl', function($scope, UserService) {
		$scope.user = UserService.user;
		$scope.save = function() {
			UserService.save();
		}
});
