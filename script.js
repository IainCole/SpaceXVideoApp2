var spacex = angular.module('spacex', []);

spacex.config(['$sceDelegateProvider', '$compileProvider', function ($sceDelegateProvider, $compileProvider) {
	$sceDelegateProvider.resourceUrlWhitelist(['self', /http:\/\/dz0bwiwndcjbh\.cloudfront\.net/]);
	$compileProvider.aHrefSanitizationWhitelist(/^\s*(http|data):/);
}]);

function opIsValid(op) {
	if (op.__type == 'macro_block_op') {

		if (parseInt(op.x) < 0) {
			return false;
		}

		if (parseInt(op.y) < 0) {
			return false;
		}

		if (isNaN(parseInt(op.pos)) || parseInt(op.pos) < -4) {
			return false;
		}

		if (op.l1 != undefined && op.l1 != null && isNaN(parseInt(op.l1))) {
			return false;
		}

		if (op.l2 != undefined && op.l2 != null && isNaN(parseInt(op.l2))) {
			return false;
		}

		if (op.l3 != undefined && op.l3 != null && isNaN(parseInt(op.l3))) {
			return false;
		}

		if (op.l4 != undefined && op.l4 != null && isNaN(parseInt(op.l4))) {
			return false;
		}

		if (op.c1 != undefined && op.c1 != null && isNaN(parseInt(op.c1))) {
			return false;
		}

		if (op.c2 != undefined && op.c2 != null && isNaN(parseInt(op.c2))) {
			return false;
		}

		if (op.dir != undefined && op.dir != null && (isNaN(parseInt(op.dir)) || parseInt(op.dir) < 0 || parseInt(op.dir) > 63)) {
			return false;
		}
		
		return true;
	} else {
		if (op.__type == 'xor_bitpos') {
			if (isNaN(parseInt(op.pos)) || parseInt(op.pos) < 0) {
				return false;
			}

			if (!/^[0-9a-f]{1,2}$/i.test(maskToHex(op.mask))) {
				return false;
			}

			return true;
		}
	}

	return false;
}

function pad(num, p) {
	if (p === undefined) {
		p = 2;
	}

	var s = num + "";
	while (s.length < p) s = "0" + s;
	return s;
}

function isNullOrEmpty(string) {
	return string === undefined || string === null || string === '' || string === '0' || string === 0;
}

function formatGlobalMmb(value, isolateFrame, currentScrubPosition) {
	var ret = '';
	var first = true;

	for (var i = 0; i < value.length; i++) {
		var mmb = formatMMB(value[i]);

		if (isolateFrame && !mmb && i < currentScrubPosition) {
			mmb = '0:0:-1';
		}
		
		if (mmb != null && mmb != '') {
			if (!first) {
				ret += '=';
			}

			ret += 'FRAME' + i + ':' + mmb;
			first = false;
		}
	}
	return ret;
}

function formatMMB(val) {
	var mmb = [];

	if (val) {
		angular.forEach(val.globalOperations, function (op, i) {
			if (op.__type == 'xor_bitpos' && opIsValid(op)) {
				var pos = op.pos;
				mmb.push('X:' + pos + ':' + maskToHex(op.mask));
			};
		});

		angular.forEach(val.macroblockOperations, function (row, l) {
			if (row) {
				angular.forEach(row, function (op, c) {
					if (op) {
						if (op.__type == 'macro_block_op' && opIsValid(op)) {
							var command = c + ':' + l + ':' + op.pos;

							if (isNullOrEmpty(op.l1) && isNullOrEmpty(op.l2) && isNullOrEmpty(op.l3) && isNullOrEmpty(op.l4) && isNullOrEmpty(op.c1) && isNullOrEmpty(op.c2)) {
								if (op.dir) {
									command += '::' + op.dir;
								}
							} else {
								command += ':' + (isNullOrEmpty(op.l1) ? '0' : op.l1);
								command += ':' + (isNullOrEmpty(op.l2) ? '0' : op.l2);
								command += ':' + (isNullOrEmpty(op.l3) ? '0' : op.l3);
								command += ':' + (isNullOrEmpty(op.l4) ? '0' : op.l4);
								command += ':' + (isNullOrEmpty(op.c1) ? '0' : op.c1);
								command += ':' + (isNullOrEmpty(op.c2) ? '0' : op.c2);
							
								if (op.dir) {
									command += ':' + op.dir;
								}
							}

							mmb.push(command);
						};
					};
				});
			}
		});
	}

	return mmb.join(",");
}

var mbOp = /^([0-9]+):([0-9]+):(-1|-2|-3|-4|[0-9]+)(?::(-?[0-9]+)?)?(?::(-?[0-9]+)?)?(?::(-?[0-9]+)?)?(?::(-?[0-9]+)?)?(?::(-?[0-9]+)?)?(?::(-?[0-9]+)?)?(?::(-?[0-9]+)?)?$/;
var mbOpDirOnly = /^([0-9]+):([0-9]+):(-1|-2|-3|-4|[0-9]+)::([0-9]+)$/;
var reXor = /^x:([0-9]+):([0-9a-f]{1,2})$/i;

function parseMMBPart(op) {

	if (mbOpDirOnly.test(op)) {
		var matches = mbOpDirOnly.exec(op);
		var x = parseInt(matches[1]);
		var y = parseInt(matches[2]);
		var pos = parseInt(matches[3]);
		var dir = parseInt(matches[4]);

		var ret = {
			__type: 'macro_block_op',
			x: x,
			y: y,
			pos: pos,
			dir: dir
		};

		return ret;
	} else if (mbOp.test(op)) {
		var matches = mbOp.exec(op);
		var x = parseInt(matches[1]);
		var y = parseInt(matches[2]);
		var pos = parseInt(matches[3]);

		var ret = {
			__type: 'macro_block_op',
			x: x,
			y: y,
			pos: pos
		};

		if (matches[4]) {
			ret.l1 = parseInt(matches[4]);
		}

		if (matches[5]) {
			ret.l2 = parseInt(matches[5]);
		}

		if (matches[6]) {
			ret.l3 = parseInt(matches[6]);
		}
		if (matches[7]) {
			ret.l4 = parseInt(matches[7]);
		}

		if (matches[8]) {
			ret.c1 = parseInt(matches[8]);
		}

		if (matches[9]) {
			ret.c2 = parseInt(matches[9]);
		}

		if (matches[10]) {
			ret.dir = parseInt(matches[10]);
		}

		return ret;
	} else if (reXor.test(op)) {
		var matches = reXor.exec(op);
		var pos = parseInt(matches[1]);
		var bin = parseInt(matches[2], 16).toString(2).substring(0, 8);

		var ret = {
			__type: 'xor_bitpos',
			pos: pos,
			mask: { }
		};

		var len = bin.length;
		
		for (var i = 0; i < bin.length; i++) {
 			ret.mask['b' + ((len- 1) - i)] = bin[i] == '1';
  		}
		
		return ret;
	}

	return null;
}

function parseGlobalMMB(frame) {
	var ret = [];
	ret.push(parseMMB(frame.mmb));

	for (var i = 0; i < frame.pFrames.length; i++) {
		ret.push(parseMMB(frame.pFrames[i].mmb));
	}

	return ret;
}

function parseMMB(mmbString) {
	var parts = mmbString == null ? '' : mmbString.replace(/\n/g, '').split(',');

	var val = {
		globalOperations: [],
		macroblockOperations: []
	};

	for (var i = 0; i < parts.length; i++) {
		var op = parseMMBPart(parts[i].replace(' ', ''));

		if (op == null) {
			continue;
		}

		switch (op.__type) {
			case 'macro_block_op':
				if (!val.macroblockOperations[op.y]) {
					val.macroblockOperations[op.y] = [];
				}

				val.macroblockOperations[op.y][op.x] = op;
				break;
			case 'xor_bitpos':
				val.globalOperations.push(op);
				break;
		}
	}

	return val;
}

spacex.directive('parseMmb', [function () {
	return {
		link: function ($scope, element, attributes, ngModel) {
			$scope.$watch(attributes.ngModel, function (newVal) {
				element[0].value = formatMMB(newVal);
			}, true);

			ngModel.$formatters.push(function (value) {
				return formatMMB(value);
			});

			ngModel.$parsers.push(function (value) {
				return parseMMB(value);
			});
		},
		require: 'ngModel'
	};
} ]);

spacex.directive('parseGlobalMmb', [function () {
	return {
		link: function ($scope, element, attributes, ngModel) {

			$scope.$watch(attributes.ngModel, function (newVal) {
				element[0].value = formatGlobalMmb(newVal);
			}, true);

			ngModel.$formatters.push(function (value) {
				return formatGlobalMmb(value);
			});

			ngModel.$parsers.push(function (value) {
				var parts = value.replace(/\s/g, '').split('=');
				var ret = [];
				var i;

				// We're going to fill the array with 20 empty mmbs first
				for (i = 0; i < $scope.data.currentFrameImages.length; i++) {
					ret[i] = parseMMB(null);
				}

				for (i = 0; i < parts.length; i++) {
					var frame = parseInt(parts[i].replace(/FRAME([0-9]+):.+/, '$1'));
					parts[i] = parts[i].replace(/FRAME[0-9]+:/, '');
					ret[frame] = parseMMB(parts[i]);
				}

				return ret;
			});
		},
		require: 'ngModel'
	};
} ]);

spacex.directive('scrubber', [function () {
	return {
		link: function ($scope, element, attributes) {
			var scrubHandle = element.find('#scrubHandle');

			var enabled = true;

			$scope.$watch('data.isolateFrame', function (newVal) {
				enabled = !newVal;
				if (enabled) {
					element.removeClass('disabled');
				} else {
					element.addClass('disabled');
				}

			});

			$scope.$watch('data.currentFrameImages.length', function () {
				scrubHandle.width(element.width() / ($scope.data.currentFrameImages.length));
			});

			scrubHandle.width(element.width() / $scope.data.currentFrameImages.length);

			$scope.$watch('data.currentScrubPosition', function (newVal, oldVal) {
				if (newVal != oldVal) {
					var left = newVal * scrubHandle.width();
					scrubHandle.css({ left: left });
				}
			});

			function setPosition(pageX) {
				var left = pageX - element.offset().left - (scrubHandle.width() / 2);

				var frame = Math.round(left / element.width() * ($scope.data.currentFrameImages.length));

				if (frame < 0) {
					frame = 0;
				} else if (frame > $scope.data.currentFrameImages.length) {
					frame = $scope.data.currentFrameImages.length;
				}

				left = frame * (element.width() / $scope.data.currentFrameImages.length);

				if (left < 0) {
					left = 0;
				} else if (left > element.width() - scrubHandle.width()) {
					left = element.width() - scrubHandle.width();
				}

				scrubHandle.css({ left: left });

				$scope.$apply(function () {
					$scope.data.currentScrubPosition = frame;
				});
			}

			element.bind('click', function (e) {
				if (!enabled) {
					return;
				}
				setPosition(e.pageX);
			});

			scrubHandle.bind('mousedown.scrubber', function (e) {
				if (!enabled) {
					return;
				}
				e.preventDefault();
				e.stopPropagation();

				$(window).bind('mousemove.scrubber', function (e) {
					e.preventDefault();
					setPosition(e.pageX);
				});

				$(window).bind('mouseup', function () {
					$(window).unbind('mousemove.scrubber');
				});
			});
		}
	};
} ]);

function maskToHex(mask) {
	var val = 0;

	if (mask.b0) {
		val += 1;
	}

	if (mask.b1) {
		val += 2;
	}

	if (mask.b2) {
		val += 4;
	}

	if (mask.b3) {
		val += 8;
	}

	if (mask.b4) {
		val += 16;
	}

	if (mask.b5) {
		val += 32;
	}

	if (mask.b6) {
		val += 64;
	}

	if (mask.b7) {
		val += 128;
	}

	return pad(val.toString(16).toUpperCase());
}

spacex.directive('bitmask', function () {
	return {
		link: function ($scope, element, attributes, ngModel) {

			function format(value) {
				return maskToHex(value);
			}

			$scope.$watch(attributes.ngModel, function (newVal) {
				element[0].value = format(newVal);
			}, true);

			ngModel.$formatters.push(format);

			ngModel.$parsers.push(function (value) {
				var bin = parseInt(value, 16).toString(2).substring(0, 8);

				var ret = {};

				for (var i = 0; i < bin.length; i++) {
					ret['b' + (7 - i)] = bin[i] == '1';
				}

				return ret;
			});
		},
		require: 'ngModel'
	};
});

spacex.directive('macroblockSelector', ['$compile', function ($compile) {
	return {
		link: function ($scope, element, attributes) {
			element.bind('click', function (event) {
				var imgTop = Math.floor((event.pageY - $(this).offset().top) / 16);
				var imgLeft = Math.floor((event.pageX - $(this).offset().left) / 16);

				blockSelected.show().css({
					top: imgTop * 16,
					left: imgLeft * 16
				});

				$scope.$apply(function () {
					$scope.data.selectedMacroBlock = {
						x: imgLeft,
						y: imgTop
					};
				});
			});

			$scope.$watch('data', function (newVal, oldVal) {
				if (newVal.selectedMacroBlock) {
					blockSelected.show().css({
						top: newVal.selectedMacroBlock.y * 16,
						left: newVal.selectedMacroBlock.x * 16
					});
				} else {
					blockSelected.hide();
				}
			}, true);

			var blockCursor = $compile('<div id="imgCursor"></div>')($scope);
			var blockSelected = $compile('<div id="selectedBlock"></div>')($scope);

			element.append(blockSelected);
			element.append(blockCursor);

			element.bind('mouseenter', function (event) {
				blockCursor.show();
			});

			element.bind('mouseleave', function (event) {
				blockCursor.hide();
			});

			element.bind('mousemove', function (event) {
				var imgTop = Math.floor((event.pageY - element.offset().top) / 16);
				var imgLeft = Math.floor((event.pageX - element.offset().left) / 16);

				blockCursor.css({
					top: imgTop * 16,
					left: imgLeft * 16
				});
			});
		},
		scope: {
			data: '=macroblockSelector'
		}
	};
} ]);

spacex.directive('macroblockOperation', ['$compile', function ($compile) {
	return {
		link: function ($scope, element, attributes) {
			$scope.$watch('op.__visible', function(newVal){
				if ($scope.op.__selfShown) {
					$scope.op.__selfShown = false;
				} else if (newVal) {
					var offsetTop = element.offset().top;
					if(offsetTop - 100 < 0){
						offsetTop = 0;
					} else {
						offsetTop = offsetTop - 100;
					}
					
					$('#operations').scrollTop(offsetTop);
				}
			});
		},
		controller:'MacroblockController'
	};
} ]);

spacex.directive('imageLegend', ['$compile', function ($compile) {
	return {
		link: function ($scope, element, attributes) {

			function updateErrorBlocks() {
				element.find('.blockError').remove();

				var frame = $scope.data.currentScrubPosition;

				if ($scope.data.currentImageError[frame]) {
					for (var y = 0; y < $scope.data.currentImageError.length; y++) {
						if ($scope.data.currentImageError[frame][y]) {
							for (var x = 0; x < $scope.data.currentImageError[frame][y].length; x++) {
								if ($scope.data.currentImageError[frame][y][x]) {
									var errDiv = $compile('<div class="blockError"></div>')($scope);
									errDiv.css({ left: x * 16, top: y * 16 });
									element.append(errDiv);
								}
							}
						}
					}
				}
			}

			$scope.$watch('data.currentImageError', function (newVal) {
				updateErrorBlocks();
			}, true);

			$scope.$watch('data.currentScrubPosition', function (newVal) {
				updateErrorBlocks();
			}, true);
		}
	};
} ]);


spacex.factory('imgService', ['$http', '$q', function ($http, $q) {
	var basePath = 'http://dz0bwiwndcjbh.cloudfront.net';
	//basePath = 'http://localhost:59000';

	return {
		getVersion: function () {
			return $http({
				method: 'GET',
				url: 'http://ec2-54-187-31-68.us-west-2.compute.amazonaws.com/v' // Bypass the CDN otherwise the version gets cached which kinda defeats the object
			}).then(function (result) {
				return result.data.version;
			});
		},
		getFrames: function () {
			return $http({
				method: 'GET',
				url: './data.json'
			}).then(function (result) {
				return result.data.iframes;
			});
		},
		getFramesInfo: function (selectedFrame, version, mmb) {
			return $http({
				method: 'GET',
				url: basePath + '/splodge/' + selectedFrame + '?v=' + version + '&mmb=' + mmb
			}).then(function (result) {
				return result.data;
			});
		},
		getAppVersion: function () {
			return $http({
				method: 'GET',
				url: './version.json'
			}).then(function (result) {
				return result.data.version;
			});
		},
		getFramesLog: function (selectedFrame, version, mmb) {
			return $http({
				method: 'GET',
				url: basePath + '/splodge/info/' + selectedFrame + '?v=' + version + '&mmb=' + mmb
			}).then(function (result) {
				return result.data;
			});
		}
	};
} ]);

spacex.factory("preloader", function ($q, $rootScope) {
	function Preloader(imageLocations) {
		this.imageLocations = imageLocations;

		this.imageCount = this.imageLocations.length;
		this.loadCount = 0;
		this.errorCount = 0;

		this.states = {
			PENDING: 1,
			LOADING: 2,
			RESOLVED: 3,
			REJECTED: 4
		};

		this.state = this.states.PENDING;

		this.deferred = $q.defer();
		this.promise = this.deferred.promise;

	}
	
	Preloader.preloadImages = function (imageLocations) {
		var preloader = new Preloader(imageLocations);
		return (preloader.load());
	};

	Preloader.prototype = {
		constructor: Preloader,
		isInitiated: function isInitiated() {
			return (this.state !== this.states.PENDING);
		},
		isRejected: function isRejected() {
			return (this.state === this.states.REJECTED);
		},
		isResolved: function isResolved() {
			return (this.state === this.states.RESOLVED);
		},
		load: function load() {
			if (this.isInitiated()) {
				return (this.promise);
			}
			
			this.state = this.states.LOADING;
			
			for (var i = 0; i < this.imageCount; i++) {
				this.loadImageLocation(this.imageLocations[i]);
			}
			return (this.promise);
		},
		handleImageError: function handleImageError(imageLocation) {
			this.errorCount++;
			
			if (this.isRejected()) {
				return;
			}
			
			this.state = this.states.REJECTED;
			this.deferred.reject(imageLocation);
		},
		handleImageLoad: function handleImageLoad(imageLocation) {
			this.loadCount++;
			
			if (this.isRejected()) {
				return;
			}
			
			this.deferred.notify({
				percent: Math.ceil(this.loadCount / this.imageCount * 100),
				imageLocation: imageLocation
			});
			
			if (this.loadCount === this.imageCount) {
				this.state = this.states.RESOLVED;
				this.deferred.resolve(this.imageLocations);
			}
		},
		
		loadImageLocation: function loadImageLocation(imageLocation) {
			var preloader = this;
			var image = $(new Image()).load(function (event) {
				$rootScope.$apply(function () {
					preloader.handleImageLoad(event.target.src);
					preloader = image = event = null;
				});
			}).error(function (event) {
				$rootScope.$apply(function () {
					preloader.handleImageError(event.target.src);
					preloader = image = event = null;
				});
			}).prop("src", imageLocation);
		}
	};
	return (Preloader);
});


function AppController($scope, $q, imgService, preloader, $timeout) {
	$scope.loaded = false;
	$scope.lastCommandChanged = null;

	$scope.reloadApp = function () {
		location.reload();
	};

	var versionCheckSeconds = 60;
	
	function checkVersion() {
		imgService.getAppVersion().then(function (version) {
			if (version > $scope.appVersion) {
				$scope.newVersionAvailable = true;
			} else {
				$timeout(checkVersion, versionCheckSeconds * 1000);
			}
		});
	}

	$q.all([
			imgService.getVersion(),
			imgService.getAppVersion(),
			imgService.getFrames()]
	).then(function (result) {
		$scope.version = result[0];
		$scope.newVersionAvailable = false;
		$scope.appVersion = result[1];
		$scope.frames = result[2];
		
		$scope.loaded = true;

		$timeout(checkVersion, versionCheckSeconds * 1000);
	});

	$scope.data = {
		mmb: [
			{
				globalOperations: [],
				macroblockOperations: []
			}
		],
		selectedFrame: null,
		selectedMacroBlock: null,
		currentScrubPosition: 0,
		currentFrameImages: [],
		currentImageInfo: [],
		currentImageError: [],
		errorCount: 0,
		showLegend: false
	};

	$scope.$watch('data.selectedFrame', function (newVal, oldVal) {
		if (newVal !== oldVal) {
			$scope.data.isolateFrame = false;
			$scope.data.currentScrubPosition = 0;
			$scope.data.mmb = parseGlobalMMB(newVal);
			$scope.updateImage();
		}
	}, true);

	$scope.$watch('data.currentScrubPosition', function() {
		$scope.selectScrubbedFrame();
	});

	$scope.$watch('data.mmb', function (newVal, oldVal) {
		if (newVal !== oldVal) {
			if ($scope.data.isolateFrame) {
				updateIsolateFrame();
			} else {
				$scope.updateImage();
			}
		}
	}, true);

	$scope.rotateMaskLeft = function (mask) {
		var shifted = mask.b7;
		mask.b7 = mask.b6;
		mask.b6 = mask.b5;
		mask.b5 = mask.b4;
		mask.b4 = mask.b3;
		mask.b3 = mask.b2;
		mask.b2 = mask.b1;
		mask.b1 = mask.b0;
		mask.b0 = shifted;
	};

	$scope.invertMask = function (mask) {
		mask.b0 = !mask.b0;
		mask.b1 = !mask.b1;
		mask.b2 = !mask.b2;
		mask.b3 = !mask.b3;
		mask.b4 = !mask.b4;
		mask.b5 = !mask.b5;
		mask.b6 = !mask.b6;
		mask.b7 = !mask.b7;
	};

	$scope.rotateMaskRight = function (mask) {
		var shifted = mask.b0;
		mask.b0 = mask.b1;
		mask.b1 = mask.b2;
		mask.b2 = mask.b3;
		mask.b3 = mask.b4;
		mask.b4 = mask.b5;
		mask.b5 = mask.b6;
		mask.b6 = mask.b7;
		mask.b7 = shifted;
	};

	$scope.playing = false;

	var fps = 15;

	function gotoNextFrame() {
		if ($scope.data.currentScrubPosition == $scope.data.currentFrameImages.length) {
			$scope.data.currentScrubPosition = 0;
		} else {
			$scope.data.currentScrubPosition++;	
		}
		
		if ($scope.playing) {
			$timeout(gotoNextFrame, 1000 / fps);
		}
	}

	$scope.togglePlaying = function () {
		if ($scope.playing) {
			$scope.playing = false;
		} else {
			$scope.playing = true;
			gotoNextFrame();
		}
	};
	
	//var currentImageUrl;

	$scope.selectScrubbedFrame = function() {
		$scope.imagePath = 'data:image/jpeg;base64,' + $scope.data.currentFrameImages[$scope.data.currentScrubPosition];
	};

	$scope.$watch('data.isolateFrame', function (newVal, oldVal) {
		if (newVal == oldVal) {
			return;
		}

		if (newVal) {
			currentIsolateKey = null;
			updateIsolateFrame();
		} else {
			currentImageKey = null;
			$scope.updateImage();
		}
	});

	var currentIsolateKey;
	
	function updateIsolateFrame() {
		var mmbCopy = angular.copy($scope.data.mmb);

		for (var i = 0; i < mmbCopy.length; i++) {
			if (i != $scope.data.currentScrubPosition) {
				mmbCopy[i] = undefined;
			}
		}

		var mmbString = formatGlobalMmb(mmbCopy, true, $scope.data.currentScrubPosition);

		var isolateKey = $scope.data.selectedFrame.frame + '_' + mmbString;

		if (currentIsolateKey != isolateKey) {
			currentIsolateKey = isolateKey;

			$scope.showSpinner = true;
			
			imgService.getFramesInfo($scope.data.selectedFrame.frame, $scope.version, mmbString).then(function(data) {
				$scope.data.currentFrameImages = data;
				$scope.selectScrubbedFrame();
				$scope.showSpinner = false;
			});

			imgService.getFramesLog($scope.data.selectedFrame.frame, $scope.version, mmbString).then(function(result) {
				$scope.data.frameLog = result;
				parseInfo(result);
			});
		}
	}

	var currentImageKey;

	$scope.updateImage = function () {
		if (!$scope.data.selectedFrame) {
			$scope.imagePath = null;
			return;
		}

		var mmbString = formatGlobalMmb($scope.data.mmb);

		var imageKey = $scope.data.selectedFrame.frame + mmbString;

		if (currentImageKey !== imageKey) {
			$scope.showSpinner = true;
			currentImageKey = imageKey;

			imgService.getFramesInfo($scope.data.selectedFrame.frame, $scope.version, mmbString).then(function (data) {
				$scope.data.currentFrameImages = data;
				$scope.selectScrubbedFrame();
				$scope.showSpinner = false;
			});

			imgService.getFramesLog($scope.data.selectedFrame.frame, $scope.version, mmbString).then(function (result) {
				$scope.data.frameLog = result;
				parseInfo(result);
			});
		}
	};

	$scope.addInvertBits = function () {
		removeEmptyMacroblocks();
		$scope.data.mmb[$scope.data.currentScrubPosition].globalOperations.push({
			__type: 'xor_bitpos',
			mask: {
				b0: true,
				b1: false,
				b2: false,
				b3: false,
				b4: false,
				b5: false,
				b6: false,
				b7: false
			}
		});
	};

	$scope.getMacroblockOperations = function () {
		var ret = [];

		for (y = 0; y < $scope.data.mmb[$scope.data.currentScrubPosition].macroblockOperations.length; y++) {
			if (!$scope.data.mmb[$scope.data.currentScrubPosition].macroblockOperations[y]) {
				continue;
			}

			for (x = 0; x < $scope.data.mmb[$scope.data.currentScrubPosition].macroblockOperations[y].length; x++) {
				if (!$scope.data.mmb[$scope.data.currentScrubPosition].macroblockOperations[y][x]) {
					continue;
				}

				ret.push($scope.data.mmb[$scope.data.currentScrubPosition].macroblockOperations[y][x]);
			}
		}

		return ret;
	};

	$scope.showMb = function (op) {
		if (op.__visible) {
			return;
		}
		for (y = 0; y < $scope.data.mmb[$scope.data.currentScrubPosition].macroblockOperations.length; y++) {
			if (!$scope.data.mmb[$scope.data.currentScrubPosition].macroblockOperations[y]) {
				continue;
			}

			for (x = 0; x < $scope.data.mmb[$scope.data.currentScrubPosition].macroblockOperations[y].length; x++) {
				if (!$scope.data.mmb[$scope.data.currentScrubPosition].macroblockOperations[y][x]) {
					continue;
				}

				$scope.data.mmb[$scope.data.currentScrubPosition].macroblockOperations[y][x].__visible = false;
			}
		}

		op.__visible = true;
		op.__selfShown = true;

		
		$scope.data.selectedMacroBlock = {
			x: op.x,
			y: op.y
		};
	};

	$scope.removeGlobalOp = function (op) {
		if ($scope.data.mmb[$scope.data.currentScrubPosition].globalOperations.indexOf(op) > -1) {
			$scope.data.mmb[$scope.data.currentScrubPosition].globalOperations.splice($scope.data.mmb[$scope.data.currentScrubPosition].globalOperations.indexOf(op), 1);	
		}
	};

	$scope.removeMb = function (op) {
		if (!$scope.data.mmb[$scope.data.currentScrubPosition].macroblockOperations[op.y]) {
			return;
		}

		if (!$scope.data.mmb[$scope.data.currentScrubPosition].macroblockOperations[op.y][op.x]) {
			return;
		}

		$scope.data.mmb[$scope.data.currentScrubPosition].macroblockOperations[op.y][op.x] = undefined;
	};
	
	function removeEmptyMacroblocks() {
		// Remove any completely empty macroblock operations
		for (y = 0; y < $scope.data.mmb[$scope.data.currentScrubPosition].macroblockOperations.length; y++) {
			if (!$scope.data.mmb[$scope.data.currentScrubPosition].macroblockOperations[y]) {
				continue;
			}

			for (x = 0; x < $scope.data.mmb[$scope.data.currentScrubPosition].macroblockOperations[y].length; x++) {
				if (!$scope.data.mmb[$scope.data.currentScrubPosition].macroblockOperations[y][x]) {
					continue;
				}

				if ($scope.data.mmb[$scope.data.currentScrubPosition].macroblockOperations[y][x].__type == 'macro_block_op') {
					if ($scope.data.mmb[$scope.data.currentScrubPosition].macroblockOperations[y][x].pos != null && $scope.data.mmb[$scope.data.currentScrubPosition].macroblockOperations[y][x].pos != '') {
						continue;
					}

					if ($scope.data.mmb[$scope.data.currentScrubPosition].macroblockOperations[y][x].l1 != null && $scope.data.mmb[$scope.data.currentScrubPosition].macroblockOperations[y][x].l1 != '') {
						continue;
					}

					if ($scope.data.mmb[$scope.data.currentScrubPosition].macroblockOperations[y][x].l2 != null && $scope.data.mmb[$scope.data.currentScrubPosition].macroblockOperations[y][x].l2 != '') {
						continue;
					}

					if ($scope.data.mmb[$scope.data.currentScrubPosition].macroblockOperations[y][x].l3 != null && $scope.data.mmb[$scope.data.currentScrubPosition].macroblockOperations[y][x].l3 != '') {
						continue;
					}

					if ($scope.data.mmb[$scope.data.currentScrubPosition].macroblockOperations[y][x].l4 != null && $scope.data.mmb[$scope.data.currentScrubPosition].macroblockOperations[y][x].l4 != '') {
						continue;
					}

					if ($scope.data.mmb[$scope.data.currentScrubPosition].macroblockOperations[y][x].c1 != null && $scope.data.mmb[$scope.data.currentScrubPosition].macroblockOperations[y][x].c1 != '') {
						continue;
					}

					if ($scope.data.mmb[$scope.data.currentScrubPosition].macroblockOperations[y][x].c2 != null && $scope.data.mmb[$scope.data.currentScrubPosition].macroblockOperations[y][x].c2 != '') {
						continue;
					}

					$scope.data.mmb[$scope.data.currentScrubPosition].macroblockOperations[y][x] = undefined;
				}
			}
		}
	}

	$scope.$watch('data.selectedMacroBlock', function (newVal) {
		removeEmptyMacroblocks();

		if(!newVal) {
			return;
		}

		for (y = 0; y < $scope.data.mmb[$scope.data.currentScrubPosition].macroblockOperations.length; y++) {
			if (!$scope.data.mmb[$scope.data.currentScrubPosition].macroblockOperations[y]) {
				continue;
			}

			for (x = 0; x < $scope.data.mmb[$scope.data.currentScrubPosition].macroblockOperations[y].length; x++) {
				if (!$scope.data.mmb[$scope.data.currentScrubPosition].macroblockOperations[y][x]) {
					continue;
				}

				$scope.data.mmb[$scope.data.currentScrubPosition].macroblockOperations[y][x].__visible = false;
			}
		}

		if (!$scope.data.mmb[$scope.data.currentScrubPosition].macroblockOperations[newVal.y]) {
			$scope.data.mmb[$scope.data.currentScrubPosition].macroblockOperations[newVal.y] = [];
		}

		if (!$scope.data.mmb[$scope.data.currentScrubPosition].macroblockOperations[newVal.y][newVal.x]) {
			$scope.data.mmb[$scope.data.currentScrubPosition].macroblockOperations[newVal.y][newVal.x] = {
				__type: 'macro_block_op',
				__visible: true,
				x: newVal.x,
				y: newVal.y
			};
		} else {
			$scope.data.mmb[$scope.data.currentScrubPosition].macroblockOperations[newVal.y][newVal.x].__visible = true;
			$scope.data.mmb[$scope.data.currentScrubPosition].macroblockOperations[newVal.y][newVal.x].__selfShown = true;
		}
	});

	//MB pos/size: 0 00:00:550 119 dc: 162 169 161 169 - 132 124
	//MB pos/size: 0 002:10:02:2361 66 dc: -29 0 -29 0 - 0 0, MB_type: 12296, MV: -3 0

	var infoRe = /MB pos\/size: (-?[0-9]) ([0-9]+):([0-9]+):([0-9]+):([0-9]+) ([0-9]+) dc: (-?[0-9]+) (-?[0-9]+) (-?[0-9]+) (-?[0-9]+) - (-?[0-9]+) (-?[0-9]+).*/;
	var dcClippedRe = /dc clipped at ([0-9]+)x([0-9]+)/;
	var cbpcDamagedRe = /I cbpc damaged at ([0-9]+) ([0-9]+) [0-9]+/;
	var acTexDamagedRe = /ac-tex damaged at ([0-9]+) ([0-9]+) [0-9]+/;
	var dQuantRe = /dquant at ([0-9]+) ([0-9]+)/;
	var stuffingRe = /stuffing at ([0-9]+) ([0-9]+)/;

	function addImageError(frame, x, y, err) {
		if (!$scope.data.currentImageError[frame]) {
			$scope.data.currentImageError[frame] = [];
		}

		if (!$scope.data.currentImageError[frame][y]) {
			$scope.data.currentImageError[frame][y] = [];
		}

		if (!$scope.data.currentImageError[frame][y][x]) {
			$scope.data.currentImageError[frame][y][x] = '';
		}

		$scope.data.currentImageError[frame][y][x] += ', ' + err;

		if (!errorCount[frame]) {
			errorCount[frame] = 0;
		}

		errorCount[frame]++;
	}

	var currentImageInfo = [];
	var errorCount = [];
	
	function parseInfo(info) {
		var lines = info.split('\n');
		currentImageInfo = [];
		$scope.data.currentImageError = [];
		errorCount = [];

		var currentFrame = 0;
		
		for (var i = 0; i < lines.length; i++) {
			if (infoRe.test(lines[i])) {
				var match = infoRe.exec(lines[i]);
				var s = parseInt(match[1]);
				var frame = currentFrame = parseInt(match[2]);
				var x = parseInt(match[3]);
				var y = parseInt(match[4]);
				var pos = parseInt(match[5]);
				var len = parseInt(match[6]);

				var dc1 = parseInt(match[7]);
				var dc2 = parseInt(match[8]);
				var dc3 = parseInt(match[9]);
				var dc4 = parseInt(match[10]);
				var dc5 = parseInt(match[11]);
				var dc6 = parseInt(match[12]);

				if (!currentImageInfo[frame]) {
					currentImageInfo[frame] = [];
				}

				if (!currentImageInfo[frame][y]) {
					currentImageInfo[frame][y] = [];
				}

				currentImageInfo[frame][y][x] = {
					s: s,
					frame: frame,
					pos: pos,
					len: len,
					dc1: dc1,
					dc2: dc2,
					dc3: dc3,
					dc4: dc4,
					dc5: dc5,
					dc6: dc6
				};
			} else if(dcClippedRe.test(lines[i])) {
				var match = dcClippedRe.exec(lines[i]);
				var x = parseInt(match[1]);
				var y = parseInt(match[2]);
				addImageError(currentFrame, x, y, match[0]);
			} else if (cbpcDamagedRe.test(lines[i])) {
				var match = cbpcDamagedRe.exec(lines[i]);
				var x = parseInt(match[1]);
				var y = parseInt(match[2]);
				addImageError(currentFrame, x, y, match[0]);
			} else if (acTexDamagedRe.test(lines[i])) {
				var match = acTexDamagedRe.exec(lines[i]);
				var x = parseInt(match[1]);
				var y = parseInt(match[2]);
				addImageError(currentFrame, x, y, match[0]);
			} else if (dQuantRe.test(lines[i])) {
				var match = dQuantRe.exec(lines[i]);
				var x = parseInt(match[1]);
				var y = parseInt(match[2]);
				addImageError(currentFrame, x, y, match[0]);
			} else if (stuffingRe.test(lines[i])) {
				var match = stuffingRe.exec(lines[i]);
				var x = parseInt(match[1]);
				var y = parseInt(match[2]);
				addImageError(currentFrame, x, y, match[0]);
			}
		}
	}

	$scope.getMBLogInfo = function (x, y) {
		var frame = $scope.data.currentScrubPosition;

		if (!currentImageInfo[frame]) {
			return '';
		}

		if (!currentImageInfo[frame][y]) {
			return '';
		}

		if (!currentImageInfo[frame][y][x]) {
			return '';
		}

		var block = currentImageInfo[frame][y][x];

		return 'MB pos/size: ' + block.s + ' ' + pad(frame, 3) + ':' + pad(x) + ':' + pad(y) + ':' + block.pos + ' ' + block.len + ' dc: ' + block.dc1 + ' ' + block.dc2 + ' ' + block.dc3 + ' ' + block.dc4 + ' - ' + block.dc5 + ' ' + block.dc6;
	};

	$scope.getMBErrorInfo = function (x, y) {
		var frame = $scope.data.currentScrubPosition;
		
		if (!$scope.data.currentImageError[frame]) {
			return '';
		}

		if (!$scope.data.currentImageError[frame][y]) {
			return '';
		}

		if (!$scope.data.currentImageError[frame][y][x]) {
			return '';
		}

		return $scope.data.currentImageError[frame][y][x];
	};

	$scope.getMBErrorCount = function () {
		var frame = $scope.data.currentScrubPosition;

		if (!errorCount[frame]) {
			return '';
		}

		return errorCount[frame];
	};
	
	$scope.$on("commandChanged", function (event) {
		var lastCommandChanged = event.targetScope;
		$scope.lastCommandChanged = lastCommandChanged;
	});
}

spacex.controller('InvertBitsController', function ($scope) {
	$scope.$watch('op.pos', function (newValue, oldValue) {
		var delta = newValue-oldValue;
		$scope.preload = Math.abs(delta)==1;
                $scope.delta = delta;
		$scope.$emit("commandChanged");
	});
});

spacex.controller('MacroblockController', function ($scope) {
	$scope.$watchCollection('[op.x, op.y, op.pos, op.l1, op.l2, op.l3, op.l4, op.c1, op.c2]', function (newValues, oldValues) {
		var preload = false;
		var deltas = [];
		for(var i=0; i<newValues.length; i++) {
			var delta = newValues[i]-oldValues[i] || 0;
			preload = preload || Math.abs(delta)==1;
			deltas.push(delta);
		};
		$scope.preload = preload;
		$scope.delta = deltas;
		$scope.$emit("commandChanged");
	});
});
