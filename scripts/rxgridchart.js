function ($) {
	function Chart(t, i) {
		$this = this,
			this.target = t,
			this.container = $(t),
			this.options = $.extend(!0, {}, $.fn.rxgridchart.defaults, i),
			this.container.data("option", this.options),
			this.originOptions = $.extend(!0, {}, this.options),
			this.stepXArr = [],
			this.stepYArr = [],
			this.xAxisLabelHeight = "falls" == this.options.type ? 1 : 30,
			this.gradientColors = [],
			this.grid = {
				left: 30,
				top: 0,
				height: 336,
				width: this.options.width - 60,
				ContainsXY: function (t, i) {
					return t >= this.left && t <= this.left + this.width && i >= this.top && i <= this.top + this.height
				}
			},
			this.Colorlegend = {
				left: this.grid.left + this.grid.width + 5,
				top: 35,
				height: this.options.height - 36,
				width: 25,
				ContainsXY: function (t, i) {
					return t >= this.left && t <= this.left + this.width && i >= this.top && i <= this.top + this.height
				}
			};
		var e = this;
		this.canvasElmBuffer = this._createCanvas(),
			this.context2DBuffer = this._getContext2D(this.canvasElmBuffer),
			this.gridContainer = $('<div style="position: absolute;z-index: 100;"><div class="layout-fill" style="height: 336px;"></div></div>').css({
				top: 35,
				left: 0,
				width: e.options.width - 26,
				height: e.options.height - 36
			}).appendTo(e.container),
			this.gridContainer.niceScroll({
				cursorwidth: "12px"
			}),
			this.canvasElmGridBuffer = this._createCanvas($.extend({}, this.grid, {
				width: e.options.width - 26
			}), this.gridContainer.children()),
			this.context2DGridBuffer = this._getContext2D(this.canvasElmGridBuffer),
			this.canvasElm = this._createCanvas($.extend({}, this.grid, {
				width: e.options.width - 26
			}), this.gridContainer.children()),
			this.context2D = this._getContext2D(this.canvasElm),
			this.canvasElmInfo = this._createCanvas($.extend({}, this.grid, {
				width: e.options.width - 26
			}), this.gridContainer.children()),
			this.context2DInfo = this._getContext2D(this.canvasElmInfo),
			this.itemWidth = 1,
			this.draw(!0),
			this.bindMouseEvent()
	}
	function _mousedown(t) {
		$.rx.paramGetFocus || t.preventDefault();
		$(this).data("chart");
		t = getEventPosition(t)
	}
	function _mouseup(t) {
		t.preventDefault();
		$(this).data("chart")
	}
	function _click(t) {
		t.preventDefault();
		$(this).data("chart");
		t = getEventPosition(t)
	}
	function _mousemove(t) {
		t.preventDefault();
		var i = $(this).data("chart");
		t = getEventPosition(t),
			i.grid.ContainsXY(t.x, t.y) ? _gridShowInfo(i, t) : i.context2DInfo.clearRect(0, 0, i.options.width, i.options.height)
	}
	function _mouseout(t) {
		t.preventDefault();
		var i = $(this).data("chart");
		i.context2DInfo.clearRect(0, 0, i.options.width, i.options.height)
	}
	function _gridShowInfo(chart, event) {
		var dataItem = chart._getDataItemByXY(event.x, event.y);
		with (chart.context2DInfo) {
			if (clearRect(chart.grid.left, chart.grid.top - 30, chart.grid.width, chart.grid.height + 30),
				$(".textinfo", chart.container).text(""),
				strokeStyle = "#00fbfe",
				fillStyle = "#2dfbfe",
				save(),
				beginPath(),
				globalAlpha = "0.5",
				translate(.5, .5),
				lineWidth = .5,
				rect(chart.grid.left + parseInt((event.x - chart.grid.left) / chart.grid.cell.width) * chart.grid.cell.width, chart.grid.top + parseInt((event.y - chart.grid.top) / chart.grid.cell.height) * chart.grid.cell.height, chart.grid.cell.width, chart.grid.cell.height),
				stroke(),
				beginPath(),
				lineWidth = 1,
				globalAlpha = "1",
				dataItem) {
				var date = moment(dataItem.name)
					, textValue = "时间:" + date.format("MM月DD日 HH:mm") + "	" + dataItem.value + (dataItem.unit || "")
					, $textInfo = $(".textinfo", chart.container);
				0 == $textInfo.length && $('<div class="textinfo" style="color:#2dfbfe; position: absolute; "></div>').css({
					top: "5px",
					left: chart.grid.left + 65 + "px"
				}).appendTo(chart.container),
					$textInfo.text(textValue)
			}
			stroke(),
				restore()
		}
	}
	Chart.prototype = {
		draw: function (t) {
			t && (this.context2DBuffer.clearRect(0, 0, this.options.width, this.options.height),
				this.context2DGridBuffer.clearRect(0, 0, this.options.width, this.options.height),
				this._drawGrid(),
				this._drawColorlegend()),
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
				this.grid.width = t - 60,
				this.container.width(t + "px"),
				this.container.height(i + "px"),
				this.Colorlegend.left = this.grid.left + this.grid.width + 5,
				this.Colorlegend.height = this.options.height - 36,
				this.gridContainer.width(t - 26 + "px"),
				this.gridContainer.height(i - 36 + "px"),
				this.canvasElmBuffer.width = t,
				this.canvasElmBuffer.height = i,
				this.canvasElm.width = t - 26,
				this.canvasElmInfo.width = t - 26,
				this.canvasElmGridBuffer.width = t - 26,
				this.setOption({
					width: t,
					height: i
				}, !0, !0),
				this.redrawData()
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
			"disabled" != this.options.mouseEvent && this.container.mousedown(_mousedown).mousemove(_mousemove).mouseup(_mouseup).mouseout(_mouseout).click(_click)
		},
		_createCanvas: function (t, i) {
			this.zIndex = this.zIndex || 0;
			var e = document.createElement("canvas");
			return $(e).appendTo(i || this.container).css({
				position: "absolute",
				left: "0px",
				top: (t && t.top || 0) + "px",
				"z-index": ++this.zIndex
			}),
				e.id = uuid.v1(),
				e.width = t && t.width || this.options.width,
				e.height = t && t.height || this.options.height,
				e
		},
		_getContext2D: function (t) {
			return t = t || this.canvasElm,
				t.getContext || G_vmlCanvasManager.initElement(t),
				t.getContext("2d")
		},
		_getDataItemByXY: function (t, i) {
			var e;
			t = parseInt((t - this.grid.left) / this.grid.cell.width),
				i = parseInt((i - this.grid.top) / this.grid.cell.height);
			for (var a = this.options.cacheData, n = 0; n < a.length; n++) {
				var r = this._getXYByName(a[n].name);
				if (r.x == t && r.y == i) {
					e = a[n];
					break
				}
			}
			return e
		},
		_getColor: function (t) {
			if (!this.options.showColorlegend)
				return this.options.colorlegend.colors[0] || "#ff0";
			for (var i = 0, e = this.gradientColors.length - 1, a = Math.floor((e + i) / 2); a > 0 && !(this.gradientColors[a - 1].value <= t && this.gradientColors[a].value >= t) && e > i;)
				this.gradientColors[a].value > t ? e = a - 1 : this.gradientColors[a].value < t && (i = a + 1),
					a = Math.floor((e + i) / 2);
			return this.gradientColors[a].color
		},
		_drawColorlegend: function () {
			if (!(this.options.colorlegend.colors.length < 2)) {
				var gradient = new gradientColorArr(this.options.colorlegend.colors, this.Colorlegend.height)
					, valStep = Math.round(parseFloat(this.options.colorlegend.max - this.options.colorlegend.min) / this.Colorlegend.height * 100) / 100
					, len = gradient.length;
				with (this.context2DBuffer) {
					save(),
						beginPath(),
						fillStyle = gradient[0],
						strokeStyle = gradient[0],
						fillRect(this.Colorlegend.left, this.Colorlegend.top - 1, this.Colorlegend.width, 1);
					for (var i = 0; len > i; i++)
						this.gradientColors.push({
							value: this.options.colorlegend.min + valStep * i,
							color: gradient[len - 1 - i]
						}),
							fillStyle = gradient[i],
							strokeStyle = gradient[i],
							fillRect(this.Colorlegend.left, this.Colorlegend.top + i, this.Colorlegend.width, 1),
							fill();
					beginPath();
					for (var yMax = this.options.colorlegend.max, step = this.options.colorlegend.step, yMin = this.options.colorlegend.min, tickWidth = this.Colorlegend.height / step, i = 0; step >= i; i++)
						if (font = "normal normal 10px 微软雅黑",
							fillStyle = "#000",
							i % 2 == 0) {
							var textoffset = 4;
							0 == i ? textoffset = -2 : i == step && (textoffset = 9),
								textAlign = "left";
							var textValue = Math.round((yMax - yMin) / step * i + yMin);
							fillText(textValue, this.Colorlegend.left, this.Colorlegend.top + this.Colorlegend.height - tickWidth * i + textoffset)
						}
					stroke(),
						restore()
				}
			}
		},
		_drawGrid: function () {
			var chart = this;
			with (chart.grid.cell = {
				width: ConvertFloat(chart.grid.width / 60, 4),
				height: 14
			},
			this.context2DBuffer) {
				save(),
					strokeStyle = "rgba(0,177,179,1)",
					fillStyle = "#2dfbfe",
					lineWidth = 1,
					rect(chart.grid.left + .5, 35.5, chart.grid.width - 1, chart.options.height - 36 - .5),
					fillText("[小时：分钟]", chart.grid.left - 30, 20),
					fillText(chart.options.title, chart.grid.left + .35 * chart.grid.width, 20),
					stroke(),
					restore(),
					save(),
					beginPath(),
					strokeStyle = "rgba(0,177,179,1)",
					fillStyle = "#2dfbfe",
					globalAlpha = "0.5",
					lineWidth = .5,
					chart.options.xAxis.data = [];
				for (var i = 0; 59 >= i; i++)
					beginPath(),
						globalAlpha = "0.5",
						moveTo(chart.grid.left + (i + 1) * chart.grid.cell.width + .25, 35),
						lineTo(chart.grid.left + (i + 1) * chart.grid.cell.width, 35 + chart.grid.height),
						stroke(),
						chart.options.xAxis.data.push(i),
						i % 2 != 0 && (beginPath(),
							globalAlpha = "1",
							textAlign = "center",
							fillText(i, chart.grid.left + (i + .5) * chart.grid.cell.width, 33));
				restore()
			}
			with (chart.context2DGridBuffer) {
				beginPath(),
					strokeStyle = "rgba(0,177,179,1)",
					fillStyle = "#2dfbfe",
					globalAlpha = "0.5",
					lineWidth = .5,
					translate(.25, .25);
				var now = moment();
				chart.options.yAxis.data = [];
				for (var i = 0; 24 > i; i++)
					beginPath(),
						globalAlpha = "0.5",
						moveTo(chart.grid.left, chart.grid.top + (i + 1) * chart.grid.cell.height),
						lineTo(chart.grid.left + chart.grid.width, chart.grid.top + (i + 1) * chart.grid.cell.height),
						stroke(),
						beginPath(),
						globalAlpha = "1",
						textAlign = "right",
						fillText(now.format("HH:00"), chart.grid.left, chart.grid.top + (i + 1) * chart.grid.cell.height - 3),
						chart.options.yAxis.data.push(now.format("HH:00")),
						now.add(1, "h");
				restore()
			}
		},
		_getXYByName: function (t) {
			var i, e, a = moment(t);
			e = a.minutes(),
				i = a.format("HH:00");
			var n = $.inArray(e, this.options.xAxis.data)
				, r = $.inArray(i, this.options.yAxis.data);
			return {
				x: n,
				y: r
			}
		},
		redrawData: function () {
			var t = this;
			t.options.cacheData = t.options.cacheData || [],
				t.options.cacheData.forEach(function (i) {
					var e = [i];
					t.drawData(e, !0)
				})
		},
		drawData: function (data, noCache) {
			var chart = this;
			data = data || chart.options.data || [],
				noCache || (chart.options.cacheData = (chart.options.cacheData || []).concat(data));
			var len = data.length;
			with (chart.context2D) {
				save(),
					beginPath(),
					fillStyle = "#f00";
				for (var i = 0; len > i; i++) {
					var xy = chart._getXYByName(data[i].name);
					fillStyle = chart._getColor(data[i].value) || "#f00",
						fillRect(chart.grid.left + xy.x * chart.grid.cell.width + 1, chart.grid.top + xy.y * chart.grid.cell.height + 1, chart.grid.cell.width - 2, chart.grid.cell.height - 1)
				}
				stroke(),
					restore()
			}
		}
	},
		$.fn.rxgridchart = function (t) {
			var i = new Chart(this, t);
			return $(this).data("chart", i),
				i
		}
		,
		$.fn.rxgridchart.defaults = {
			width: 850,
			height: 450,
			showColorlegend: !0,
			xAxis: {
				data: []
			},
			yAxis: {
				data: []
			},
			colorlegend: {
				min: 0,
				max: 100,
				step: 10,
				colors: []
			},
			mouseEvent: "enabled",
			data: []
		}
}(jQuery);