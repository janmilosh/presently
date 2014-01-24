angular.module('myApp', [])
.controller('MainCtrl', function($scope, $timeout) {
	$scope.date = {};
	var updateTime = function() {
		$scope.date.raw = new Date();
		$timeout(updateTime, 1000)
	}
	updateTime();
});