(function ($) {
	function Chart(t, i) {
		$this = this,
		this.target = t,
		this.container = $(t),
		this.options = $.extend(!0, {}, $.fn.rxdfchart.defaults, i),
		this.container.data("option", this.options),
		this.originOptions = $.extend(!0, {}, this.options),
		this.stepXArr = [],
		this.stepYArr = [],
		this.xAxisLabelHeight = "falls" == this.options.type ? 1 : 30,
		this.gradientColors = [],
		this.AzimuthCircle = {
			left: 0,
			top: 0,
			height: this.options.height,
			width: this.options.height - 30,
			isNorthAngle: !0,
			ContainsXY: function (t, i) {
				return t >= this.left && t <= this.left + this.width && i >= this.top && i <= this.top + this.height
			}
		},
		this.AzimuthCircle.northImage = new Image,
		this.AzimuthCircle.northImage.src = "../images/measure/df/north.png",
		this.AzimuthCircle.northPointImage = new Image,
		this.AzimuthCircle.northPointImage.src = "../images/measure/df/north-point.png",
		this.AzimuthCircle.carheadImage = new Image,
		this.AzimuthCircle.carheadImage.src = "../images/measure/df/carhead.png",
		this.AzimuthCircle.centerX = this.AzimuthCircle.left + this.AzimuthCircle.width / 2 + 5,
		this.AzimuthCircle.centerY = this.AzimuthCircle.top + this.AzimuthCircle.height / 2 + 10,
		this.AzimuthCircle.radius = (this.AzimuthCircle.width < this.AzimuthCircle.height ? this.AzimuthCircle.width : this.AzimuthCircle.height) / 2 - 10,
		this.AzimuthCircle.isCenterPoint = function (t, i) {
			return t >= this.centerX - 10 && t <= this.centerX + 10 && i >= this.centerY - 10 && i <= this.centerY + 10
		}
		,
		this.LevelMeter = {
			left: this.AzimuthCircle.left + this.AzimuthCircle.width + 50,
			top: 10,
			height: this.options.height / 3 * 2 - 20,
			width: 60,
			min: -30,
			max: 90,
			heightRatio: (this.options.height / 3 * 2 - 20) / 120,
			name: "电平",
			filterImage: function () {
				var t = new Image;
				return t.src = "../images/measure/df/fill_level_quality.png",
					t
			}(),
			ContainsXY: function (t, i) {
				return t >= this.left && t <= this.left + this.width && i >= this.top && i <= this.top + this.height
			},
			isCenterPosition: function (t, i) {
				return t >= this.left + 28 && t <= this.left + 47 && i >= this.top && i <= this.top + this.height
			}
		},
		this.QualityMeter = {
			left: this.LevelMeter.left + this.LevelMeter.width + 20,
			top: 10,
			height: this.LevelMeter.height,
			width: 60,
			min: 0,
			max: 100,
			heightRatio: this.LevelMeter.height / 100,
			name: "质量",
			filterImage: function () {
				var t = new Image;
				return t.src = "../images/measure/df/fill_level_quality.png",
					t
			}(),
			ContainsXY: function (t, i) {
				return t >= this.left && t <= this.left + this.width && i >= this.top && i <= this.top + this.height
			},
			isCenterPosition: function (t, i) {
				return t >= this.left + 28 && t <= this.left + 47 && i >= this.top && i <= this.top + this.height
			}
		},
		this.OptimalAngleGrid = {
			left: this.QualityMeter.left + this.QualityMeter.width + 20,
			top: 10,
			height: this.options.height / 2 - 10,
			width: this.options.width - (this.QualityMeter.left + this.QualityMeter.width + 20),
			heightRatio: (this.options.height / 2 - 20) / 30,
			data: new Array(360),
			maxTimes: 30,
			ContainsXY: function (t, i) {
				return t >= this.left && t <= this.left + this.width && i >= this.top && i <= this.top + this.height
			}
		},
		this.RealtimeAngleGrid = {
			left: this.OptimalAngleGrid.left,
			top: this.OptimalAngleGrid.top + this.OptimalAngleGrid.height + 20,
			height: this.options.height - this.OptimalAngleGrid.height - 32,
			width: this.OptimalAngleGrid.width,
			heightRatio: (this.options.height - this.OptimalAngleGrid.height - 32) / 360,
			data: [],
			itemWidth: 5,
			ContainsXY: function (t, i) {
				return t >= this.left && t <= this.left + this.width && i >= this.top && i <= this.top + this.height
			}
		},
		this.canvasElmBuffer = this._createCanvas(),
		this.context2DBuffer = this._getContext2D(this.canvasElmBuffer),
		this.canvasElm = this._createCanvas(this.grid),
		this.context2D = this._getContext2D(this.canvasElm),
		this.canvasElmInfo = this._createCanvas(this.grid),
		this.context2DInfo = this._getContext2D(this.canvasElmInfo),
		this.itemWidth = 1,
		this.draw(!0),
		this.bindMouseEvent()
	}
	function ChangeCenterImage(chart) {
		var centerX = chart.AzimuthCircle.centerX,centerY = chart.AzimuthCircle.centerY,radius = chart.AzimuthCircle.radius;
		with (chart.context2DBuffer)save(),
		fillStyle = "#2d3132",
		beginPath(),
		fillRect(centerX - 10, centerY - 10, 20, 20),
		clearRect(centerX - 8, centerY - radius - 30, 21, 21),
		chart.AzimuthCircle.isNorthAngle ? (drawImage(chart.AzimuthCircle.carheadImage, centerX - 8, centerY - 8, 16, 16),drawImage(chart.AzimuthCircle.northPointImage, centerX - 8, centerY - radius - 30, 16, 21)) : (drawImage(chart.AzimuthCircle.northImage, centerX - 8, centerY - 8, 16, 16),
		drawImage(chart.AzimuthCircle.carheadImage, centerX - 8, centerY - radius - 30, 16, 21)),
		stroke(),
		restore()
	}
	function _mousedown(t) {
		$.rx.paramGetFocus || t.preventDefault();
		var i = $(this).data("chart");
		if (t = getEventPosition(t),
			i.LevelMeter.isCenterPosition(t.x, t.y)) {
			var e = i._getMeterValueByY(i.LevelMeter, t.y);
			Math.abs(e - (i.LevelMeter.filterValue || 0)) <= 4 && (i.levelMeterDragging = !0)
		} else if (i.QualityMeter.isCenterPosition(t.x, t.y)) {
			var e = i._getMeterValueByY(i.QualityMeter, t.y);
			Math.abs(e - (i.QualityMeter.filterValue || 0)) <= 4 && (i.qualityMeterDragging = !0)
		}
	}
	function _mouseup(t) {
		t.stopPropagation(),
			t.preventDefault();
		var i = $(this).data("chart");
		i.levelMeterDragging ? i.levelMeterDragging = !1 : i.qualityMeterDragging && (i.qualityMeterDragging = !1)
	}
	function _click(t) {
		t.preventDefault();
		var i = $(this).data("chart");
		t = getEventPosition(t),
			i.AzimuthCircle.isCenterPoint(t.x, t.y) && (i.AzimuthCircle.isNorthAngle ? i.AzimuthCircle.isNorthAngle = !1 : i.AzimuthCircle.isNorthAngle = !0,
				ChangeCenterImage(i))
	}
	function _mousemove(t) {
		t.preventDefault();

		var i = $(this).data("chart");

		t = getEventPosition(t);
		i.AzimuthCircle.isCenterPoint(t.x, t.y) ? i.container.css({
			cursor: "pointer"
		}) : i.container.css({
			cursor: "default"
		})
		i.OptimalAngleGrid.ContainsXY(t.x, t.y);
		if( i.RealtimeAngleGrid.ContainsXY(t.x, t.y) ){
			_gridShowInfo(i, t)
		} else {
			i.context2DInfo.clearRect(i.OptimalAngleGrid.left, 0, i.canvasElmInfo.width, i.canvasElmInfo.height);
		}

		if(i.LevelMeter.isCenterPosition(t.x, t.y)) {
			var e = i._getMeterValueByY(i.LevelMeter, t.y);
			Math.abs(e - (i.LevelMeter.filterValue || 0)) <= 4 ? i.container.css({
				cursor: "pointer"
			}) : i.container.css({
				cursor: "default"
			})
		} else {
			i.levelMeterDragging = !1;
		}
			
		if (i.QualityMeter.isCenterPosition(t.x, t.y)) {
			var e = i._getMeterValueByY(i.QualityMeter, t.y);
			Math.abs(e - (i.QualityMeter.filterValue || 0)) <= 4 ? i.container.css({
				cursor: "pointer"
			}) : i.container.css({
				cursor: "default"
			})
		} else {
			i.qualityMeterDragging = !1;
		}
			
		if(i.levelMeterDragging){
			i.LevelMeter.filterValue = i._getMeterValueByY(i.LevelMeter, t.y);
		}
		i._drawMeterfilterValue(i.LevelMeter);

		if(i.qualityMeterDragging){
			i.QualityMeter.filterValue = i._getMeterValueByY(i.QualityMeter, t.y)
		}
		i._drawMeterfilterValue(i.QualityMeter);
	}
	function _gridShowInfo(chart, event) {
		var options, tempHeight, textArr = [], x = event.x - chart.OptimalAngleGrid.left - 20;
		if (chart.OptimalAngleGrid.ContainsXY(event.x, event.y)) {
			if (!chart.OptimalAngleGrid.itemWidth)
				return;
			options = chart.OptimalAngleGrid,
				tempHeight = options.height - 10;
			var index = parseInt(x / chart.OptimalAngleGrid.itemWidth);
			textArr.push("监测角度：" + index + " °"),
				textArr.push("出现次数：" + (chart.OptimalAngleGrid.data[index] || 0))
		} else if (chart.RealtimeAngleGrid.ContainsXY(event.x, event.y)) {
			if (!chart.RealtimeAngleGrid.itemWidth)
				return;
			options = chart.RealtimeAngleGrid,
				tempHeight = options.height;
			var index = parseInt(x / chart.RealtimeAngleGrid.itemWidth);
			textArr.push("监测角度：" + (chart.RealtimeAngleGrid.data[index] || 0) + " °")
		}
		with (chart.context2DInfo) {
			clearRect(options.left, options.top, options.width, options.height + 1),
				strokeStyle = "#00fbfe",
				fillStyle = "#2dfbfe",
				save(),
				beginPath(),
				translate(.5, .5),
				lineWidth = 1,
				moveTo(event.x, options.top),
				lineTo(event.x, options.top + tempHeight),
				moveTo(options.left + 20, event.y),
				lineTo(options.left + 20 + options.width, event.y);
			var textX = event.x + 5;
			if (event.x - options.left > 4 * options.width / 5 && (textX = event.x - 55),
				textArr.length > 0)
				for (var i = 0; i < textArr.length; i++)
					fillText(textArr[i], textX, options.top + 10 + 15 * i);
			stroke(),
				restore()
		}
	}
	Chart.prototype = {
		draw: function (t) {
			if (t) {
				if (this.context2DBuffer.clearRect(0, 0, this.options.width, this.options.height),
					this.drawAzimuthCircle(),
					this.drawTextMark(),
					this.options.showMin)
					return;
				this.drawMeter(this.LevelMeter),
					this.drawMeter(this.QualityMeter),
					this.drawOptimalAngleGrid(),
					this.drawRealtimeAngleGrid()
			}
			this.drawData()
		},
		getOption: function () {
			var t = this.container.data("option");
			return "undefined" == typeof t && (t = {}),
				t
		},
		setOption: function (t, i, e) {
			var a = this.getOption();
			this.options = $.extend({}, a, t),
				this.container.data("option", this.options),
				e && (this.originOptions = $.extend(!0, {}, this.options)),
				this.draw(i)
		},
		resize: function (t, i) {
			this.options.width = t,
				this.options.height = i,
				this.container.width(t + "px"),
				this.container.height(i + "px"),
				this.AzimuthCircle.height = i,
				this.AzimuthCircle.width = i - 30,
				this.AzimuthCircle.centerX = this.AzimuthCircle.left + this.AzimuthCircle.width / 2 + 5,
				this.AzimuthCircle.centerY = this.AzimuthCircle.top + this.AzimuthCircle.height / 2 + 10,
				this.AzimuthCircle.radius = (this.AzimuthCircle.width < this.AzimuthCircle.height ? this.AzimuthCircle.width : this.AzimuthCircle.height) / 2 - 10,
				this.LevelMeter.left = this.AzimuthCircle.left + this.AzimuthCircle.width + 50,
				this.LevelMeter.height = this.options.height / 3 * 2 - 20,
				this.LevelMeter.heightRatio = (this.options.height / 3 * 2 - 20) / 120,
				this.QualityMeter.left = this.LevelMeter.left + this.LevelMeter.width + 20,
				this.QualityMeter.height = this.LevelMeter.height,
				this.QualityMeter.heightRatio = this.LevelMeter.height / 100,
				this.OptimalAngleGrid.left = this.QualityMeter.left + this.QualityMeter.width + 20,
				this.OptimalAngleGrid.height = this.options.height / 2 - 10,
				this.OptimalAngleGrid.width = this.options.width - (this.QualityMeter.left + this.QualityMeter.width + 20),
				this.OptimalAngleGrid.heightRatio = (this.options.height / 2 - 20) / 30,
				this.RealtimeAngleGrid.left = this.OptimalAngleGrid.left,
				this.RealtimeAngleGrid.top = this.OptimalAngleGrid.top + this.OptimalAngleGrid.height + 20,
				this.RealtimeAngleGrid.height = this.options.height - this.OptimalAngleGrid.height - 32,
				this.RealtimeAngleGrid.width = this.OptimalAngleGrid.width,
				this.RealtimeAngleGrid.heightRatio = (this.options.height - this.OptimalAngleGrid.height - 32) / 360,
				this.canvasElmBuffer.width = t,
				this.canvasElmBuffer.height = i,
				this.canvasElm.width = t,
				this.canvasElm.height = i,
				this.canvasElmInfo.width = t,
				this.canvasElmInfo.height = i,
				$(".optimal-mark").css({
					left: this.OptimalAngleGrid.left + 30 + "px",
					top: this.OptimalAngleGrid.top + 5 + "px"
				}),
				$(".text-mark").css({
					left: this.LevelMeter.left + "px",
					top: this.LevelMeter.top + this.LevelMeter.height + 15 + "px"
				}),
				$(".freq-mark").css({
					left: this.AzimuthCircle.left + this.AzimuthCircle.width / 2 - 100 + "px",
					top: this.AzimuthCircle.top + this.AzimuthCircle.height - 25 + "px"
				}),
				this.setOption({
					width: t,
					height: i
				}, !0, !0)
		},
		destroy: function () {
			this.container.remove("canvas"),
				this.container.removeData("option"),
				delete this
		},
		clear: function () {
			_clear(this)
		},
		bindMouseEvent: function (t) {
			"disabled" != this.options.mouseEvent && this.container.mousedown(_mousedown).mousemove(_mousemove).mouseup(_mouseup).click(_click)
		},
		_createCanvas: function (t) {
			this.zIndex = this.zIndex || 0;
			var i = document.createElement("canvas");
			return $(i).appendTo(this.container).css({
				position: "absolute",
				left: "0px",
				top: (t && t.top || 0) + "px",
				"z-index": ++this.zIndex
			}),
				i.id = uuid.v1(),
				i.width = this.options.width,
				i.height = t && t.height || this.options.height,
				i
		},
		_getContext2D: function (t) {
			return t = t || this.canvasElm,
				t.getContext || G_vmlCanvasManager.initElement(t),
				t.getContext("2d")
		},
		getDataItemByX: function (t, i) {
			var e = -1
				, a = t - this.grid.left;
			0 > a && (e = -1);
			var n = this.getSampleData(this.options.data);
			if (n.length > 0) {
				var r = Math.ceil(a / this.itemWidth);
				(r - 1) * this.itemWidth;
				e = r - 1
			}
			return n[e]
		},
		getSampleData: function (t) {
			if (this.options.dataItemRange && 2 == this.options.dataItemRange.length && (t = t.slice(this.options.dataItemRange[0], this.options.dataItemRange[1])),
				len = this.grid.width || 1e3,
				t.length <= len)
				return t;
			for (var i = [], e = t.length / len, a = 0, n = {}, r = 0, o = 0; o < len; o++) {
				a = parseInt(e * o),
					r = parseInt(e * (o + 1)),
					n = t[a];
				for (var s = a + 1; r > s; s++)
					n.value = t[s].value > n.value ? t[s].value : n.value,
						n.maxValue = t[s].maxValue > n.maxValue ? t[s].maxValue : n.maxValue,
						n.minValue = t[s].minValue < n.minValue ? t[s].minValue : n.minValue,
						n.avgValue += t[s].avgValue;
				n.index = o,
					n.avgValue = n.avgValue / (r - a),
					i.push(n)
			}
			return i
		},
		getDataByRange: function (t, i, e) {
			var a = [];
			return t.forEach(function (t) {
				t.name >= i && t.name <= e && a.push(t)
			}),
				a
		},
		getXByIndex: function (t) { },
		getYByValue: function (t) {
			return this.grid.top + this.grid.height - t * this.heightRatio + this.options.yAxis.min * this.heightRatio
		},
		getValueByY: function (t) {
			return ConvertFloat((this.grid.height + this.grid.top - t) / this.heightRatio + this.options.yAxis.min, 3)
		},
		drawAzimuthCircle: function () {
			var chart = this
				, centerX = chart.AzimuthCircle.centerX
				, centerY = chart.AzimuthCircle.centerY
				, radius = chart.AzimuthCircle.radius
				, minangle = 1 / 30 * Math.PI;
			with (chart.context2DBuffer) {
				save(),
					beginPath(),
					lineWidth = 16,
					strokeStyle = "#469090",
					arc(centerX, centerY, radius, .67 * Math.PI, 2.34 * Math.PI, !1),
					stroke(),
					beginPath(),
					fillStyle = "#2d3132",
					arc(centerX, centerY, radius - 65, 0, 2 * Math.PI, !1),
					fill(),
					beginPath(),
					lineWidth = 1,
					strokeStyle = "#2dfbfe",
					translate(centerX, centerY);
				for (var i = 0; 60 > i; i++)
					0 != i && 15 != i && 30 != i && 45 != i || (moveTo(radius - 55, 0),
						lineTo(radius - 35, 0)),
						moveTo(radius - 45, 0),
						lineTo(radius - 35, 0),
						rotate(minangle);
				font = " bold 15px impack",
					fillStyle = "#2dfbfe",
					fillText("0", -4, -(radius - 30)),
					fillText("90", radius - 30, 4),
					fillText("180", -10, radius - 20),
					fillText("270", -(radius - 10), 4.5),
					stroke(),
					restore(),
					beginPath(),
					font = " normal 12px impack",
					fillStyle = "#fff",
					fillText("正北角：", 0, 15),
					fillText("车头角：", 0, 40),
					drawImage(chart.AzimuthCircle.northPointImage, 50, 3, 15, 15),
					drawImage(chart.AzimuthCircle.carheadImage, 50, 28, 15, 15),
					ChangeCenterImage(chart),
					chart.AzimuthCircle.northPointImage.onload = function () {
						drawImage(chart.AzimuthCircle.northPointImage, 50, 3, 15, 15),
							drawImage(chart.AzimuthCircle.carheadImage, 50, 28, 15, 15),
							ChangeCenterImage(chart)
					}
					,
					stroke(),
					restore()
			}
			this.drawAzimuthCircleData()
		},
		drawMeter: function (options) {
			var chart = this
				, meterBackImage = new Image;
			with (meterBackImage.src = "../images/measure/df/fill_back.png",
			chart.context2DBuffer) {
				save(),
					strokeStyle = "#00fbfe",
					fillStyle = "#2d3132",
					beginPath(),
					lineWidth = 1,
					rect(options.left + 30 + .5, options.top, 13, options.height),
					fill(),
					stroke(),
					beginPath(),
					drawImage(meterBackImage, options.left + 32, options.top + 1, 10, options.height - 2),
					meterBackImage.onload = function () {
						drawImage(meterBackImage, options.left + 32, options.top + 1, 10, options.height - 2)
					}
					,
					stroke(),
					restore(),
					save(),
					beginPath(),
					font = " normal 11px impack",
					strokeStyle = "#469090",
					fillStyle = "#2dfbfe",
					lineWidth = 1;
				for (var step = (options.max - options.min) / 10, i = 0; 11 > i; i++) {
					var y = options.top + step * i * options.heightRatio;
					moveTo(options.left + 20, y),
						lineTo(options.left + 29, y);
					var textValue = (options.max - step * i).toString();
					fillText(textValue, options.left - 3 * textValue.length + 10, y + 3)
				}
				stroke(),
					fillStyle = "#fff",
					font = " normal 12px impack";
				for (var i = 0; i < options.name.length; i++)
					fillText(options.name[i], options.left + 46, (options.top + options.height) / 2 - 10 + 20 * i);
				stroke(),
					restore()
			}
			this._drawMeterfilterValue(options)
		},
		_drawMeterfilterValue: function (options) {
			var chart = this, filterImage = options.filterImage;
			with (chart.context2DInfo) {
				clearRect(options.left, options.top - 10, options.width, options.height + 20),
					save(),
					beginPath(),
					drawImage(filterImage, options.left + 28, options.height - ((options.filterValue || 0) - options.min) * options.heightRatio + 2, 19, 14),
					filterImage.onload = function () {
						drawImage(filterImage, options.left + 28, options.height - ((options.filterValue || 0) - options.min) * options.heightRatio + 2, 19, 14)
					}
					,
					font = " normal 10px impack",
					fillStyle = "#fff",
					textAlign = "center";
				var offsetY = 0;
				options.max - options.filterValue < 5 && (offsetY = 25),
					fillText(options.filterValue || 0, options.left + 37, options.height - ((options.filterValue || 0) - options.min) * options.heightRatio + 2 + offsetY),
					stroke(),
					restore()
			}
		},
		_getMeterValueByY: function (t, i) {
			return Math.round((t.height + t.top - i) / t.heightRatio + t.min)
		},
		drawTextMark: function () {
			var t = this
				, i = $(".freq-mark", t.container);
			if (0 == i.length && (i = $('<div class="freq-mark" style="color: #f060a0; width: 200px; height: 25px; text-align: center; font-size: 15px; font-weight: bold;">0MHz</div>').css({
				position: "absolute",
				left: t.AzimuthCircle.left + t.AzimuthCircle.width / 2 - 100 + "px",
				top: t.AzimuthCircle.top + t.AzimuthCircle.height - 25 + "px",
				"z-index": 100
			}).appendTo(t.container)),
				!this.options.showMin) {
				var e = $(".text-mark", t.container);
				0 == e.length && (e = $('<div class="text-mark" style="color: #fff;  width: 160px; text-align: left; font-size: 12px; "></div>').css({
					position: "absolute",
					left: t.LevelMeter.left + "px",
					top: t.LevelMeter.top + t.LevelMeter.height + 15 + "px",
					"z-index": 100
				}).appendTo(t.container),
					e.append('<div><span style="width: 80px;display:inline-block;">[中心频率]：</span><span class="freq">0</span>&nbsp;MHz</div>'),
					e.append('<div><span style="width: 80px;display:inline-block;">[测向电平]：</span><span class="dfLevel">0</span>&nbsp;dbμv</div>'),
					e.append('<div><span style="width: 80px;display:inline-block;">[监测电平]：</span><span class="level">0</span>&nbsp;dbμv</div>'),
					e.append('<div><span style="width: 80px;display:inline-block;">[正北方向]：</span><span class="north">0</span>&nbsp;°</div>'),
					e.append('<div><span style="width: 80px;display:inline-block;">[最优角度]：</span><span class="optimal">0</span>&nbsp;°</div>'),
					e.append('<div><span style="width: 80px;display:inline-block;">[测量质量]：</span><span class="qulity">0</span>&nbsp;%</div>'));
				var a = $(".optimal-mark", t.container);
				0 == a.length && (a = $('<div class="optimal-mark" style="color: #fff;  width: 160px; text-align: left; font-size: 12px; "></div>').css({
					position: "absolute",
					left: t.OptimalAngleGrid.left + 30 + "px",
					top: t.OptimalAngleGrid.top + 5 + "px",
					"z-index": 100
				}).appendTo(t.container),
					a.append('<div style="color:#cc00cc;"><span style="display:inline-block;">最优角：</span><span class="optimal"></span></div>'),
					a.append('<div style="color:#0a8a1f;"><span style="display:inline-block;">次优角：</span><span class="suboptimal"></span></div>'),
					a.append('<div style="color:#985f0d;"><span style="display:inline-block;">再优角：</span><span class="superior"></span></div>'))
			}
		},
		drawOptimalAngleGrid: function () {
			var chart = this;
			with (chart.context2DBuffer) {
				save(),
					lineWidth = 1,
					fillStyle = "rgba(0,177,179,1)",
					strokeStyle = "rgba(0,177,179,1)",
					beginPath(),
					rect(chart.OptimalAngleGrid.left + 20, chart.OptimalAngleGrid.top + .5, chart.OptimalAngleGrid.width - .5 - 20, chart.OptimalAngleGrid.height - 10),
					stroke(),
					save(),
					beginPath(),
					strokeStyle = "rgba(0,77,77)",
					globalAlpha = "0.8",
					lineWidth = .5,
					translate(.25, .25);
				for (var j = 0, stepX = parseInt((this.OptimalAngleGrid.width - 20) / 10), stepY = this.OptimalAngleGrid.height / 10, yStepHeight = (this.OptimalAngleGrid.height - 10) / 6, i = 1, len = 6; len > i; i++) {
					for (beginPath(),
						j = 0; stepX >= j; j++)
						moveTo(this.OptimalAngleGrid.left + 20 + 10 * j, this.OptimalAngleGrid.top + i * yStepHeight),
							lineTo(this.OptimalAngleGrid.left + 20 + 10 * j + 4, this.OptimalAngleGrid.top + i * yStepHeight);
					stroke()
				}
				font = " normal 10px impack",
					fillStyle = "#fff";
				for (var xStepWidth = (this.OptimalAngleGrid.width - 20) / 12, i = 0, len = 12; len > i; i++) {
					for (beginPath(),
						j = 1; stepY - 1 >= j; j++)
						moveTo(this.OptimalAngleGrid.left + 20 + (i + 1) * xStepWidth, this.OptimalAngleGrid.top + 10 * j - 10),
							lineTo(this.OptimalAngleGrid.left + 20 + (i + 1) * xStepWidth, this.OptimalAngleGrid.top + 10 * j + 4 - 10);
					fillText(30 * i, this.OptimalAngleGrid.left + 20 + i * xStepWidth - (0 == i ? 0 : 2 * (30 * i).toString().length), this.OptimalAngleGrid.top + this.OptimalAngleGrid.height),
						stroke()
				}
				fillText(359, this.OptimalAngleGrid.left + this.OptimalAngleGrid.width - 18, this.OptimalAngleGrid.top + this.OptimalAngleGrid.height),
					stroke(),
					restore()
			}
			this.drawOptimalAngleGridYAxisLabel()
		},
		drawOptimalAngleGridYAxisLabel: function () {
			var chart = this
				, times = this.OptimalAngleGrid.optimal && this.OptimalAngleGrid.optimal.times || 30
				, max = 30 * (parseInt((times - 1) / 30) + 1);
			with (this.OptimalAngleGrid.maxTimes = max,
			this.OptimalAngleGrid.heightRatio = (this.OptimalAngleGrid.height - 10) / this.OptimalAngleGrid.maxTimes,
			chart.context2DBuffer) {
				clearRect(this.OptimalAngleGrid.left, this.OptimalAngleGrid.top, 19, this.OptimalAngleGrid.height - 10),
					save(),
					beginPath(),
					lineWidth = .5,
					font = " normal 8px impack",
					fillStyle = "#2dfbfe";
				for (var yStepHeight = (this.OptimalAngleGrid.height - 20) / 6, i = 0, len = 6; len >= i; i++) {
					var textValue = (max - i * (max / 6)).toString();
					fillText(textValue, this.OptimalAngleGrid.left - 3 * textValue.length + 10, this.OptimalAngleGrid.top + i * yStepHeight + 5)
				}
				stroke(),
					restore()
			}
		},
		drawRealtimeAngleGrid: function () {
			var chart = this;
			with (chart.context2DBuffer) {
				save(),
					lineWidth = 1,
					fillStyle = "rgba(0,177,179,1)",
					strokeStyle = "rgba(0,177,179,1)",
					beginPath(),
					rect(chart.RealtimeAngleGrid.left + 20, chart.RealtimeAngleGrid.top, chart.RealtimeAngleGrid.width - .5 - 20, chart.RealtimeAngleGrid.height),
					stroke(),
					restore(),
					save(),
					beginPath(),
					strokeStyle = "rgba(0,77,77)",
					globalAlpha = "0.8",
					lineWidth = .5,
					font = " normal 8px impack",
					fillStyle = "#2dfbfe",
					translate(.25, .25);
				for (var yStepHeight = (parseInt((this.RealtimeAngleGrid.width - 20) / 10),
					this.RealtimeAngleGrid.height / 10,
					this.RealtimeAngleGrid.height / 12), i = 0, len = 12; len > i; i++) {
					moveTo(this.RealtimeAngleGrid.left + 20, this.RealtimeAngleGrid.top + i * yStepHeight),
						lineTo(this.RealtimeAngleGrid.left + this.RealtimeAngleGrid.width, this.RealtimeAngleGrid.top + i * yStepHeight);
					var textValue = (360 - 30 * i).toString();
					"360" == textValue && (textValue = "359"),
						fillText(textValue, this.RealtimeAngleGrid.left - 3 * textValue.length + 10, this.RealtimeAngleGrid.top + i * yStepHeight + 5)
				}
				fillText(0, this.RealtimeAngleGrid.left + 8, this.RealtimeAngleGrid.top + this.RealtimeAngleGrid.height + 1);
				for (var xStepWidth = (this.RealtimeAngleGrid.width - 20) / 12, i = 0, len = 12; len > i; i++)
					moveTo(this.RealtimeAngleGrid.left + 20 + i * xStepWidth, this.RealtimeAngleGrid.top),
						lineTo(this.RealtimeAngleGrid.left + 20 + i * xStepWidth, this.RealtimeAngleGrid.top + this.RealtimeAngleGrid.height);
				stroke(),
					restore()
			}
		},
		drawAzimuthCircleData: function (angle) {
			angle = angle || 0;
			var chart = this
				, centerX = (chart.options.data || {},
					chart.AzimuthCircle.centerX)
				, centerY = chart.AzimuthCircle.centerY
				, radius = chart.AzimuthCircle.radius;
			with (chart.context2D)
			clearRect(chart.AzimuthCircle.left, chart.AzimuthCircle.top, chart.AzimuthCircle.width, chart.AzimuthCircle.height),
				save(),
				strokeStyle = "#f00",
				fillStyle = "#f00",
				beginPath(),
				translate(centerX, centerY),
				rotate((angle - 90) * Math.PI / 180),
				moveTo(10, -3),
				lineTo(10, 3),
				lineTo(radius - 20, 0),
				fill(),
				stroke(),
				restore(),
				save(),
				beginPath(),
				translate(centerX, centerY),
				fillStyle = "#00ffff",
				font = " bold 22px impack",
				textAlign = "center",
				fillText(Math.round(100 * angle) / 100, 0, (radius - 55) / 2 - 5),
				stroke(),
				restore();
			"undefined" != typeof chart.OptimalAngleGrid.optimal && (this._drawOptimalAngel(chart.OptimalAngleGrid.optimal && chart.OptimalAngleGrid.optimal.angle || 0, "#cc00cc"),
				this._drawOptimalAngel(chart.OptimalAngleGrid.suboptimal && chart.OptimalAngleGrid.suboptimal.angle || 0, "#0a8a1f"),
				this._drawOptimalAngel(chart.OptimalAngleGrid.superior && chart.OptimalAngleGrid.superior.angle || 0, "#985f0d"))
		},
		_drawOptimalAngel: function (angle, color) {
			var chart = this
				, centerX = chart.AzimuthCircle.centerX
				, centerY = chart.AzimuthCircle.centerY
				, radius = chart.AzimuthCircle.radius;
			with (chart.context2D)
			save(),
				beginPath(),
				fillStyle = color,
				strokeStyle = color,
				translate(centerX, centerY),
				rotate((angle - 90) * Math.PI / 180),
				moveTo(10, -2),
				lineTo(10, 2),
				lineTo(radius - 25, 0),
				fill(),
				stroke(),
				restore()
		},
		drawTextMarkData: function (t) {
			var i = this
				, e = $(".freq-mark", i.container);
			if (e.text(t.freq + " MHz"),
				!this.options.showMin) {
				var a = $(".text-mark", i.container);
				a.find(".qulity").text(ConvertFloat(t.qulity, 2)),
					a.find(".north").text(t.north),
					a.find(".optimal").text(this.OptimalAngleGrid.optimal && this.OptimalAngleGrid.optimal.angle),
					a.find(".level").text(t.level),
					a.find(".dfLevel").text(t.dfLevel),
					a.find(".freq").text(t.freq)
			}
		},
		drawMeterData: function (options, value) {
			var chart = this;
			with (chart.context2D)
			clearRect(options.left + 31, options.top + 1, 11, options.height - 1),
				save(),
				strokeStyle = "#2d3132",
				fillStyle = "#2d3132",
				beginPath(),
				lineWidth = 1,
				rect(options.left + 31 + .5, options.top + 1, 10.5, (options.max - value) * options.heightRatio - 2),
				fill(),
				stroke(),
				restore()
		},
		drawRealtimeAngleData: function (value) {
			this.RealtimeAngleGrid.data = this.RealtimeAngleGrid.data || [],
				this.RealtimeAngleGrid.data.push(value);
			var itemWidth = this.RealtimeAngleGrid.itemWidth || 5
				, maxLen = parseInt(this.RealtimeAngleGrid.width / itemWidth);
			with (this.RealtimeAngleGrid.data.length >= maxLen && (this.RealtimeAngleGrid.data = this.RealtimeAngleGrid.data.slice(this.RealtimeAngleGrid.data.length - maxLen, maxLen)),
			this.context2D) {
				clearRect(this.RealtimeAngleGrid.left + 20, this.RealtimeAngleGrid.top, this.RealtimeAngleGrid.width, this.RealtimeAngleGrid.height),
					save(),
					beginPath(),
					lineWidth = 1,
					strokeStyle = "#008001",
					moveTo(this.RealtimeAngleGrid.left + 20, this.RealtimeAngleGrid.top + this.RealtimeAngleGrid.height - this.RealtimeAngleGrid.data[0] * this.RealtimeAngleGrid.heightRatio);
				for (var i = 1; i < this.RealtimeAngleGrid.data.length; i++)
					lineTo(this.RealtimeAngleGrid.left + 20 + i * itemWidth, this.RealtimeAngleGrid.top + this.RealtimeAngleGrid.height - this.RealtimeAngleGrid.data[i] * this.RealtimeAngleGrid.heightRatio);
				stroke(),
					restore()
			}
		},
		drawOptimalAngleData: function (value) {
			var index = parseInt(value);
			this.OptimalAngleGrid.data = this.OptimalAngleGrid.data || new Array(360),
				this.OptimalAngleGrid.data[index] = this.OptimalAngleGrid.data[index] || 0,
				this.OptimalAngleGrid.data[index] += 1;
			var $optimalMark = $(".optimal-mark", this.container);
			this.OptimalAngleGrid.optimal = this.OptimalAngleGrid.optimal || {
				angle: 0,
				times: 0
			},
				this.OptimalAngleGrid.suboptimal = this.OptimalAngleGrid.suboptimal || {
					angle: 0,
					times: 0
				},
				this.OptimalAngleGrid.superior = this.OptimalAngleGrid.superior || {
					angle: 0,
					times: 0
				},
				this.OptimalAngleGrid.data[index] > this.OptimalAngleGrid.optimal.times && (this.OptimalAngleGrid.optimal = {
					angle: index,
					times: this.OptimalAngleGrid.data[index]
				},
					$optimalMark.find(".optimal").text(index + "°(" + this.OptimalAngleGrid.data[index] + "次)")),
				index != this.OptimalAngleGrid.optimal.angle && this.OptimalAngleGrid.data[index] > this.OptimalAngleGrid.suboptimal.times && (this.OptimalAngleGrid.suboptimal = {
					angle: index,
					times: this.OptimalAngleGrid.data[index]
				},
					$optimalMark.find(".suboptimal").text(index + "°(" + this.OptimalAngleGrid.data[index] + "次)")),
				index != this.OptimalAngleGrid.optimal.angle && index != this.OptimalAngleGrid.suboptimal.angle && this.OptimalAngleGrid.data[index] > this.OptimalAngleGrid.superior.times && (this.OptimalAngleGrid.superior = {
					angle: index,
					times: this.OptimalAngleGrid.data[index]
				},
					$optimalMark.find(".superior").text(index + "°(" + this.OptimalAngleGrid.data[index] + "次)")),
				this.OptimalAngleGrid.optimal.times > this.OptimalAngleGrid.maxTimes && this.drawOptimalAngleGridYAxisLabel();
			var itemWidth = this.OptimalAngleGrid.itemWidth = (this.OptimalAngleGrid.width - 20) / this.OptimalAngleGrid.data.length;
			with (this.context2D) {
				clearRect(this.OptimalAngleGrid.left + 20, this.OptimalAngleGrid.top, this.OptimalAngleGrid.width - 20, this.OptimalAngleGrid.height),
					save(),
					beginPath(),
					lineWidth = 1,
					strokeStyle = "#2dfbfe",
					fillStyle = "#008001";
				for (var i = 0; i < this.OptimalAngleGrid.data.length; i++)
					this.OptimalAngleGrid.data[i] && fillRect(this.OptimalAngleGrid.left + 20 + i * itemWidth, this.OptimalAngleGrid.top + this.OptimalAngleGrid.height - 10 - this.OptimalAngleGrid.data[i] * this.OptimalAngleGrid.heightRatio, itemWidth, this.OptimalAngleGrid.data[i] * this.OptimalAngleGrid.heightRatio);
				stroke(),
					restore()
			}
		},
		drawData: function () {
			if (this.options.data && 0 != this.options.data.length) {
				var t = this.options.data[0];
				if (this.options.showMin) {
					this.drawTextMarkData(t);
					var i = this.AzimuthCircle.isNorthAngle && t.north || t.azumith || 0;
					return this.drawAzimuthCircleData(i),
						void this.drawOptimalAngleData(t.north)
				}
				if (this.drawTextMarkData(t),
					this.drawMeterData(this.LevelMeter, t.dfLevel),
					this.drawMeterData(this.QualityMeter, t.qulity),
					parseFloat(t.level) >= parseFloat(this.LevelMeter.filterValue || 0) && parseFloat(t.qulity) >= parseFloat(this.QualityMeter.filterValue || 0)) {
					var i = this.AzimuthCircle.isNorthAngle && t.north || t.azumith || 0;
					this.drawAzimuthCircleData(i),
						this.drawRealtimeAngleData(t.north),
						this.drawOptimalAngleData(t.north)
				}
			}
		}
	},
	$.fn.rxdfchart = function (t) {
		var i = new Chart(this, t);
		return $(this).data("chart", i),i
	},
	$.fn.rxdfchart.defaults = {
		width: 850,
		height: 450,
		mouseEvent: "enabled",
		data: []
	}
})(jQuery)