angular.module('myApp', [])

.provider('Weather', function() {
	var apiKey = "";

	this.setApiKey = function(key) {
		if (key) this.apiKey = key;
	};
	this.getUrl = function(type, ext) {
		return "http://api.wunderground.com/api/" + 
			this.apiKey + "/" + type + "/q/" +
			ext + '.json';
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
					// The wunderground API returns the
					// object that nests the forecasts inside
					// the forecast.simpleforecast key
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
.controller('MainCtrl', function($scope, $timeout, Weather) {

	$scope.date = {};
	var updateTime = function() {
		$scope.date.raw = new Date();
		$timeout(updateTime, 1000)
	}
	updateTime();

	$scope.weather = {};
	Weather.getWeatherForecast("OH/Sunbury")
	.then(function(data) {
		$scope.weather.forecast = data;
	});

});
