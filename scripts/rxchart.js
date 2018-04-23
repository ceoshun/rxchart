(function ($) {
	function Chart(Elm, opt) {
		$this = this,
		this.target = Elm,
		this.container = $(Elm),
		this.options = $.extend(false, {}, $.fn.rxchart.defaults, opt),
		this.container.data("option", this.options),
		this.originOptions = $.extend(false, {}, this.options),
		this.stepXArr = [],
		this.stepYArr = [],
		this.xAxisLabelHeight = this.options.hiddenXAxis ? 1 : 30,
		this.gradientColors = [],
		this.Colorlegend = {
			left: 0,
			top: 0,
			height: this.options.height - this.xAxisLabelHeight,
			width: this.options.yAxis.hidden ? 0 : 35,
			ContainsXY: function (l, t) {
				return l >= this.left && l <= this.left + this.width && t >= this.top && t <= this.top + this.height
			}
		},
		this.grid = {
			left: this.Colorlegend.left + this.Colorlegend.width,
			top: this.Colorlegend.top,
			height: this.Colorlegend.height,
			width: this.options.width - this.Colorlegend.width,
			ContainsXY: function (l, t) {
				return l >= this.left && l <= this.left + this.width && t >= this.top && t <= this.top + this.height
			}
		},
		this.heightRatio = this.grid.height / (this.options.yAxis.max - this.options.yAxis.min),
		this.canvasElmBuffer = this._createCanvas(),
		this.context2DBuffer = this._getContext2D(this.canvasElmBuffer),
		this.canvasElm = this._createCanvas(this.grid),
		this.context2D = this._getContext2D(this.canvasElm),
		this.canvasElmInfo = this._createCanvas(this.grid),
		this.context2DInfo = this._getContext2D(this.canvasElmInfo),
		this.canvasElmASThr = this._createCanvas(this.grid),
		this.context2DASThr = this._getContext2D(this.canvasElmASThr),
		this.itemWidth = 1,
		this.draw(false),
		this.bindMouseEvent()
	}
	function _mousemove(t) {
		t.preventDefault();
		var i = $(this).data("chart");
		if (t = getEventPosition(t),
			i.grid.ContainsXY(t.x, t.y)) {
			if (i.dragging)
				_gridDragging(i, t);
			else if (i.draggingAThr) {
				var e = i.getValueByY(t.y);
				i.options.asThrValue = e,
					i._drawASThreshold(false)
			} else {
				var e = i.getValueByY(t.y);
				if (i.options.showASThreshold && Math.abs(i.options.asThrValue - e) < 3 / i.heightRatio)
					return i._drawASThreshold(false),
						i.container.css({
							cursor: "pointer"
						}),
						void i.context2DInfo.clearRect(i.grid.left, i.grid.top, i.grid.width, i.grid.height);
				i.container.css({
					cursor: ""
				}),
					i.context2DASThr.clearRect(i.grid.left + 11, i.grid.top, i.grid.width, i.grid.height),
					_gridShowInfo(i, t)
			}
			"function" == typeof i.options.event.onmousemove && i.options.event.onmousemove(t)
		} else
			_clear(i, t)
	}
	function _mousedown(t) {
		if ($.rx.paramGetFocus || t.preventDefault(),
			1 == t.which) {
			var i = $(this).data("chart");
			if (t = getEventPosition(t),
				i.grid.ContainsXY(t.x, t.y)) {
				var e = i.getValueByY(t.y);
				i.options.showASThreshold && Math.abs(i.options.asThrValue - e) < 3 / i.heightRatio ? i.draggingAThr = false : (i.dragging = false,
					i.grid.event = $.extend(i.grid.event || {}, {
						startX: t.x,
						startY: t.y
					})),
					"function" == typeof i.options.event.onmousedown && i.options.event.onmousedown(t)
			}
		}
	}
	function _mouseup(t) {
		t.preventDefault();
		var i = $(this).data("chart");
		t = getEventPosition(t),
			i.grid.ContainsXY(t.x, t.y) && (i.dragging && _girdDragEnd(i, t),
				i.draggingAThr && (i.draggingAThr = !1,
					"function" == typeof i.options.event.ondrawasthrchanged && i.options.event.ondrawasthrchanged(i.options.asThrValue)),
				"function" == typeof i.options.event.onmouseup && i.options.event.onmouseup(t))
	}
	function _dblclick(t) {
		if ("CANVAS" != t.target.tagName) return false;
		t.stopPropagation();
		t.preventDefault();
		var i = $(this).data("chart");
		t = getEventPosition(t)
		if (i.grid.ContainsXY(t.x, t.y)) {
			var e = i.getValueByY(t.y);
			if (i.options.showASThreshold && Math.abs(i.options.asThrValue - e) < 3 / i.heightRatio) {
				var a = $(document).find("#modalSetAsThr" + i.canvasElm.id);
				if(0 == a.length){
					a = $('<div class="modal modal-custom" role="dialog" aria-labelledby="gridSystemModalLabel"> <div class="modal-dialog modal-sm" role="document"> <div class="modal-content"> <div class="modal-header"> <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button> <h4 class="modal-title" id="gridSystemModalLabel">设置异常信号门限</h4> </div> <div class="modal-body"> <div class="form-group form-inline"> <label class="control-label">异常信号门限：</label> <div class="input-group"><input type="text" class="form-control input-custom double minus asThrValue" max="120" min="-40" maxlength="6" ><span class="input-custom-addon">dbμv</span> </div> </div> </div> <div class="modal-footer"> <button type="button" class="btn btn-warning btn-sm" data-dismiss="modal"><i class="">&nbsp;</i>取消</button> <button type="button" class="btn btn-primary btn-sm btnSetAsThrValue" ><i class="fa fa-save">&nbsp;</i>确定</button> </div> </div> </div> </div>'),
					a.attr("id", "modalSetAsThr" + i.canvasElm.id),
					a.find(".btnSetAsThrValue").click(function () {
						i.options.asThrValue = ConvertFloat(a.find(".asThrValue").val(), 2);
						if(i.options.asThrValue > i.options.yAxis.max){
							i.options.asThrValue = i.options.yAxis.max;
						}
						if(i.options.asThrValue < i.options.yAxis.min){
							i.options.asThrValue = i.options.yAxis.min;
						}					
						i._drawASThreshold(false);
						if("function" == typeof i.options.event.ondrawasthrchanged){
							i.options.event.ondrawasthrchanged(i.options.asThrValue);
						}
						a.modal("hide");
					});
					$("body").append(a);
					if("function" == typeof initParamEvent){
						initParamEvent();
					}
				} 
				a.find(".asThrValue").val(ConvertFloat(i.options.asThrValue, 2));
				a.modal("show");
			}
			i.dragging = false;
			if (!i.gridZoomDisable) {
				var n = i.getOption();
				n.xAxis = i.originOptions.xAxis.map(function (t) {
					return 2 == i.options.xAxisType ? t : $.extend({}, t);
				});
				var n = i.getOption();
				n.dataItemRange = [];
				i.draw(false);
				_gridZoomComplate(i);
			}
			if("function" == typeof i.options.event.ondblclick){
				i.options.event.ondblclick(t);
			}
		} else if (i.Colorlegend.ContainsXY(t.x, t.y)) {
			var r = $(document).find("#modal" + i.canvasElm.id);
			if(0 == r.length){
				r = $('<div  class="modal modal-custom" role="dialog" aria-labelledby="gridSystemModalLabel"> <div class="modal-dialog modal-sm" role="document"> <div class="modal-content"> <div class="modal-header"> <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button> <h4 class="modal-title" id="gridSystemModalLabel">设置坐标上下限</h4> </div> <div class="modal-body"> <div class="form-group form-inline"> <label class="control-label">坐标上限值：</label> <div class="input-group"> <input type="text" class="form-control input-custom int minus yAxisUp" maxlength="3" max="120" ><span class="input-custom-addon">dbμv</span></div> </div> <div class="form-group form-inline"> <label class="control-label">坐标下限值：</label> <div class="input-group"> <input type="text" class="form-control input-custom int minus yAxisDown" maxlength="3" min="-40"  ><span class="input-custom-addon">dbμv</span> </div> </div> </div> <div class="modal-footer"> <button type="button" class="btn btn-warning btn-sm" data-dismiss="modal"><i class="">&nbsp;</i>取消</button> <button type="button" class="btn btn-primary btn-sm btnSetYAxisUpdown" ><i class="fa fa-save">&nbsp;</i>确定</button> </div> </div></div></div>');
				r.attr("id", "modal" + i.canvasElm.id);
				r.find(".btnSetYAxisUpdown").click(function () {
					i.options.yAxis.max = ConvertFloat(r.find(".yAxisUp").val(), 2);
					i.options.yAxis.min = ConvertFloat(r.find(".yAxisDown").val(), 2);
					if(i.options.yAxis.min > i.options.yAxis.max){
						alert("坐标下限值必须小于上限值")
					} else {
						i.draw(false);
						r.modal("hide");
						if("function" == typeof i.options.event.onyaxischanged){
							i.options.event.onyaxischanged(i.options);
						}
					}
				});
				r.find(".yAxisUp").val(i.options.yAxis.max);
				r.find(".yAxisDown").val(i.options.yAxis.min);
				$("body").append(r);
				if("function" == typeof initParamEvent){
					 initParamEvent();
				}
			}
			r.modal("show")
		}
	}
	function _click(t) {
		var i = $(this).data("chart");
		t = getEventPosition(t);
		if(i.grid.ContainsXY(t.x, t.y) && "function" == typeof i.options.event.onclick){
			i.options.event.onclick(t);
		}
	}
	function _mouseout(t) {
		var i = $(this).data("chart");
		_clear(i);
		if("function" == typeof i.options.event.onmouseout){
			i.options.event.onmouseout(t);
		}
	}
	function _clear(t, i) {
		t.dragging = false,
		t.grid.event = {},
		t.context2DInfo.clearRect(0, 0, t.canvasElmInfo.width, t.canvasElmInfo.height),
		t.draggingAThr = !1,
		t.container.css({
			cursor: ""
		}),
		t.context2DASThr.clearRect(t.grid.left + 11, 0, t.canvasElmInfo.width, t.canvasElmInfo.height)
	}
	function _girdDragEnd(t, i) {
		if (t.dragging = !1,
			t.context2DInfo.clearRect(0, 0, t.canvasElmInfo.width, t.canvasElmInfo.height),
			$.extend(t.grid.event, {
				endX: i.x,
				endY: i.y
			}),
			!(Math.abs(t.grid.event.endX - t.grid.event.startX) < 20)) {
			var e = t.getDataItemByX(t.grid.event.startX, false)
				, a = t.getDataItemByX(t.grid.event.endX, false);
			if (e && a) {
				if (e.index > a.index) {
					var n = $.extend({}, e);
					e = $.extend({}, a),
						a = n
				}
				var r = e.index
					, o = a.index;
				if (r && o) {
					var s = t.getOption();
					if (!(s.data.slice(r, o).length < 3)) {
						if (s.dataItemRange = [r, o],
							t.itemWidth = t.grid.width / s.data.slice(r, o).length,
							2 != t.options.xAxisType) {
							for (var h = [], l = 0; l < s.xAxis.length; l++)
								s.xAxis[l].endindex >= e.index && s.xAxis[l].startindex <= a.index && h.push($.extend({}, s.xAxis[l]));
							h.length > 0 && (h[0].startfreq = e.name,
								h[0].startindex = e.index,
								h[0].points = parseInt((h[0].endfreq - h[0].startfreq) / h[0].step + 1),
								h[h.length - 1].endfreq = a.name,
								h[h.length - 1].endindex = a.index,
								h[h.length - 1].points = parseInt((h[h.length - 1].endfreq - h[h.length - 1].startfreq) / h[h.length - 1].step + 1)),
								s.xAxis = h
						}
						t.draw(false),
							_gridZoomComplate(t)
					}
				}
			}
		}
	}
	function _gridDragging(chart, event) {
		if ($.extend(chart.grid.event, {
			endX: event.x,
			endY: event.y
		}),
			!(Math.abs(chart.grid.event.endX - chart.grid.event.startX) < 5))
			with (chart.context2DInfo)
			save(),
				clearRect(0, 0, chart.canvasElmInfo.width, chart.canvasElmInfo.height),
				beginPath(),
				translate(.5, .5),
				lineWidth = 1,
				rect(chart.grid.event.startX, chart.grid.event.startY, chart.grid.event.endX - chart.grid.event.startX, chart.grid.event.endY - chart.grid.event.startY),
				stroke(),
				restore()
	}
	function _gridShowInfo(chart, event) {
		if ("undefined" == typeof chart.showInfo || chart.showInfo) {
			var dataItem = chart.getDataItemByX(event.x);
			with (chart.context2DInfo) {
				clearRect(chart.grid.left, chart.grid.top, chart.grid.width, chart.grid.height),
					strokeStyle = chart.options.style.lineColor || "#00fbfe",
					fillStyle = chart.options.style.textColor || "#2dfbfe",
					save(),
					beginPath(),
					translate(.5, .5),
					lineWidth = 1,
					moveTo(event.x, chart.grid.top),
					lineTo(event.x, chart.grid.top + chart.grid.height),
					moveTo(chart.grid.left, event.y),
					lineTo(chart.grid.left + chart.grid.width, event.y),
					textAlign = "left";
				var textX = event.x + 5;
				event.x - chart.grid.left > 4 * chart.grid.width / 5 && (textAlign = "right",
					textX = event.x - 5),
					dataItem && (fillText(dataItem.name + "MHz", textX, chart.grid.top + 10),
						fillText(ConvertFloat(dataItem.value, 3) + (decodeURIComponent(dataItem.unit || "") || "dbμv"), textX, chart.grid.top + 25),
						chart.options.showOccupancy && fillText((dataItem.occValue || 0) + "%", textX, chart.grid.top + 40)),
					stroke(),
					restore()
			}
		}
	}
	function _gridZoomComplate(t) {
		"function" == typeof t.options.event.onZoomChanged && t.options.event.onZoomChanged(t.options)
	}
	Chart.prototype = {
		draw: function (bDraw) {
			if (bDraw) {
				this.context2DBuffer.clearRect(0, 0, this.options.width, this.options.height);
				this.options.showColorlegend && this._drawColorlegend();
				this._drawYAxis();
				if("colorlegend" == this.options.type){
					return;
				}
					
				if(2 == this.options.xAxisType){
					this._drawXAxis2()
				}else{
					this._drawXAxis()
				}

				if("falls" != this.options.type){
					this._drawGrid()
				}
				this.options.showOccupancy && this._drawOccupancy(),
				this.options.showASThreshold && this._drawASThreshold()
			}

			if("falls" == this.options.type){
				this._drawfalls()
			}else{
				this._drawData()
			}
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
				e && (this.originOptions = $.extend(false, {}, this.options)),
				this.draw(i)
		},
		setHeight: function (t) {
			this.options.height = t,
				this.container.height(t + "px"),
				this.Colorlegend.height = t - this.xAxisLabelHeight,
				this.grid.height = this.Colorlegend.height,
				this.heightRatio = this.grid.height / (this.options.yAxis.max - this.options.yAxis.min),
				this.canvasElmBuffer.height = t,
				this.canvasElm.height = this.grid.height,
				this.canvasElmInfo.height = this.grid.height,
				this.canvasElmASThr.height = this.grid.height,
				this.setOption({
					height: t
				}, false, false)
		},
		resize: function (t, i) {
			this.options.width = t,
				this.options.height = i,
				this.container.width(t + "px"),
				this.container.height(i + "px"),
				this.Colorlegend.height = i - this.xAxisLabelHeight,
				this.grid.width = this.options.width - this.Colorlegend.width,
				this.grid.height = this.Colorlegend.height,
				this.heightRatio = this.grid.height / (this.options.yAxis.max - this.options.yAxis.min),
				this.canvasElmBuffer.width = t,
				this.canvasElmBuffer.height = i,
				this.canvasElm.width = t,
				this.canvasElm.height = this.grid.height,
				this.canvasElmInfo.width = t,
				this.canvasElmInfo.height = this.grid.height,
				this.canvasElmASThr.width = t,
				this.canvasElmASThr.height = this.grid.height,
				this.setOption({
					width: t,
					height: i
				}, false, false),
				this.options.showOccupancy && this.showOccupancy(),
				this._redrawfalls()
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
			"falls" == this.options.type ? this.container.dblclick(_dblclick) : "disabled" != this.options.mouseEvent && this.container.mousedown(_mousedown).mousemove(_mousemove).mouseup(_mouseup).dblclick(_dblclick).mouseout(_mouseout).click(_click)
		},
		showOccupancy: function () {
			this.options.showOccupancy = false,
				this.OccColorlegend = {
					left: 0,
					top: 0,
					height: 59,
					width: this.options.yAxis.hidden ? 0 : 35
				},
				this.OccGrid = {
					left: this.OccColorlegend.width,
					top: 1,
					height: 59,
					width: this.options.width - this.OccColorlegend.width
				},
				this.Colorlegend.top = this.OccColorlegend.height + 1,
				this.Colorlegend.height = this.options.height - this.xAxisLabelHeight - this.OccGrid.height - 1,
				this.grid.top = this.Colorlegend.top,
				this.grid.height = this.Colorlegend.height,
				this.heightRatio = this.grid.height / (this.options.yAxis.max - this.options.yAxis.min),
				this.draw(false),
				this.canvasElmOcc && (this.canvasElmOcc.height = this.OccGrid.height)
		},
		hideOccupancy: function () {
			this.options.showOccupancy = !1,
				this.Colorlegend.top = 0,
				this.Colorlegend.height = this.options.height - this.xAxisLabelHeight,
				this.grid.top = this.Colorlegend.top,
				this.grid.height = this.Colorlegend.height,
				this.heightRatio = this.grid.height / (this.options.yAxis.max - this.options.yAxis.min),
				this.draw(false),
				this.canvasElmOcc.height = 0
		},
		_drawOccupancy: function () {
			with (this.context2DOcc || (this.canvasElmOcc = this._createCanvas(this.OccGrid),
				this.canvasElmOcc.height = this.OccGrid.height + 1,
				this.context2DOcc = this._getContext2D(this.canvasElmOcc)),
			this.context2DBuffer) {
				save(),
					font = "normal normal 12px 微软雅黑",
					fillStyle = "#2dfbfe",
					beginPath(),
					translate(.5, .5);
				var textValue = "占用度";
				for (i = 0; i < textValue.length; i++)
					fillText(textValue[i], this.OccColorlegend.width / 2 - 2, this.OccColorlegend.height / 2 + 14 * (i - 1));
				rect(this.OccGrid.left, this.OccGrid.top - 1, this.OccGrid.width - 1, this.OccGrid.height + 1),
					stroke(),
					restore()
			}
		},
		_drawASThreshold: function (drawLine) {
			var asThrValue = this.options.asThrValue = this.options.asThrValue || 40
				, y = this.getYByValue(asThrValue);
			with (this.context2DASThr)
			clearRect(this.grid.left, this.grid.top, this.canvasElmASThr.width, this.canvasElmASThr.height),
				save(),
				strokeStyle = "#f00",
				fillStyle = "#f00",
				beginPath(),
				moveTo(this.grid.left + 1, y - 8),
				lineTo(this.grid.left + 11, y),
				lineTo(this.grid.left + 1, y + 8),
				closePath(),
				fill(),
				drawLine && (beginPath(),
					translate(.5, .5),
					moveTo(this.grid.left + 11, y),
					lineTo(this.grid.left + this.grid.width, y),
					fillStyle = "#fff",
					font = "normal normal 14px 微软雅黑",
					fillText(ConvertFloat(asThrValue, 2), this.grid.left + 12, y + 5),
					stroke()),
				restore()
		},
		_createCanvas: function (t) {
			this.zIndex = this.zIndex || 0;
			var i = document.createElement("canvas");
			$(i).appendTo(this.container).css({
				position: "absolute",
				left: "0px",
				top: (t && t.top || 0) + "px",
				"z-index": ++this.zIndex
			});
			i.id = uuid.v1();
			i.width = this.options.width;
			i.height = t && t.height || this.options.height;
			return  i;
		},
		_getContext2D: function (canvasele) {
			canvasele = canvasele || this.canvasElm,
			canvasele.getContext || G_vmlCanvasManager.initElement(canvasele);
			return canvasele.getContext("2d")
		},
		_getColor: function (t) {
			if (!this.options.showColorlegend)
				return this.options.yAxis.colors[0] || "#ff0";
			for (var i = 0, e = this.gradientColors.length - 1, a = Math.floor((e + i) / 2); a > 0 && !(this.gradientColors[a - 1].value <= t && this.gradientColors[a].value >= t) && e > i;)
				this.gradientColors[a].value > t ? e = a - 1 : this.gradientColors[a].value < t && (i = a + 1),
					a = Math.floor((e + i) / 2);
			return this.gradientColors[a].color
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
		getSampleData: function (t, i) {
			if ("undefined" == typeof t)
				return [];
			!i && this.options.dataItemRange && 2 == this.options.dataItemRange.length && (t = t.slice(this.options.dataItemRange[0], this.options.dataItemRange[1]));
			var e = [];
			if (len = this.grid.width || 1e3,
				t.length <= len)
				return t;
			for (var a = t.length / len, n = 0, r = {}, o = 0, s = 0; s < len; s++) {
				n = parseInt(a * s),
					o = parseInt(a * (s + 1)),
					r = $.extend({}, t[n]);
				for (var h = n + 1; o > h; h++)
					r.value = t[h].value > r.value ? t[h].value : r.value,
						r.maxValue = t[h].maxValue > r.maxValue ? t[h].maxValue : r.maxValue,
						r.minValue = t[h].minValue < r.minValue ? t[h].minValue : r.minValue,
						r.avgValue += t[h].avgValue;
				r.index = s,
					r.avgValue = r.avgValue / (o - n),
					e.push(r)
			}
			return e
		},
		getDataByRange: function (t, i, e) {
			var a = [];
			return t.forEach(function (t) {
				t.name >= i && t.name <= e && a.push(t)
			}),
				a
		},
		getXByIndex: function (t) {
			return this.grid.left + this.itemWidth * t
		},
		getYByValue: function (t) {
			return this.grid.top + this.grid.height - t * this.heightRatio + this.options.yAxis.min * this.heightRatio
		},
		getValueByY: function (t) {
			return ConvertFloat((this.grid.height + this.grid.top - t) / this.heightRatio + this.options.yAxis.min, 3)
		},
		getValueByName: function (t) {
			for (var i = this.getSampleData(this.options.data), e = 0, a = i.length - 1, n = Math.floor((a + e) / 2); n > 0 && i[n].name != t && a > e;)
				i[n - 1].name > t ? a = n - 1 : i[n - 1].name < t && (e = n + 1),
					n = Math.floor((a + e) / 2);
			return i[n + 1].value
		},
		_drawXAxis: function () {
			this.stepXArr = [];
			var textValue, chart = this, xAxisData = chart.options.xAxis, len = xAxisData.length;
			if (this.options.xAxis.length > 0) {
				var fianlData = this.getSampleData(this.options.data);
				fianlData.length > 0 && fianlData.length / this.grid.width < .01 && (fianlData[0].name == this.options.xAxis[0].startfreq && (this.options.xAxis[0].startfreq -= this.options.xAxis[0].step),
					fianlData[fianlData.length - 1].name == this.options.xAxis[this.options.xAxis.length - 1].endfreq && (this.options.xAxis[this.options.xAxis.length - 1].endfreq += this.options.xAxis[this.options.xAxis.length - 1].step))
			}
			with (this.context2DBuffer) {
				font = "normal normal normal 10px 微软雅黑",
				strokeStyle = this.options.style.lineColor || "rgba(0,177,179,1)",
				fillStyle = this.options.style.lineColor || "rgba(0,177,179,1)",
				lineWidth = 1,
				save(),
				beginPath(),
				translate(0, 0),
				moveTo(this.grid.left, this.grid.top + this.grid.height),
				lineTo(this.grid.left + this.grid.width, this.grid.top + this.grid.height),
				stroke(),
				moveTo(this.grid.left, this.grid.top),
				lineTo(this.grid.left + this.grid.width, this.grid.top),
				translate(0.5, 0.5);
				if (1 == len) {
					var pointData = chart.getSampleData(chart.options.data || []);
					if (0 == pointData.length || pointData.length > 10) {
						var newlen = 5, newxAxisData = [];
						var avgValue = (xAxisData[0].endfreq - xAxisData[0].startfreq) / (newlen - 1),;
						for (var i = 0; newlen > i; i++) {
							newxAxisData.push(ConvertFloat(xAxisData[0].startfreq + avgValue * i, 3));
						}
						var xStepWidth = this.grid.width / (newlen - 1)
						for (var i = 0; newlen > i; i++){
							fillStyle = this.options.style.lineColor || "rgba(0,177,179,1)";
							moveTo(this.grid.left + i * xStepWidth, this.grid.top + this.grid.height);
							lineTo(this.grid.left + i * xStepWidth, this.grid.top + this.grid.height + 6);
							textValue = newxAxisData[i] + "MHz";
							textAlign = "center";
							if(0 == i){
								textAlign = "left";
							} else if( i == newlen - 1){
								textAlign = "right"
							}
							fillStyle = this.options.style.textColor || "#2dfbfe";
							fillText(textValue, this.grid.left + i * xStepWidth, this.grid.top + this.grid.height + 18);
						}
					} else {
						for (var i = 0; i < pointData.length; i++){
							fillStyle = this.options.style.lineColor || "rgba(0,177,179,1)";
							moveTo(this.grid.left + (i + 0.5) * chart.itemWidth, this.grid.top + this.grid.height);
							lineTo(this.grid.left + (i + 0.5) * chart.itemWidth, this.grid.top + this.grid.height + 6);
							textValue = ConvertFloat(pointData[i].name, 3) + "MHz";
							textAlign = "left";
							fillStyle = this.options.style.textColor || "#2dfbfe";
							fillText(textValue, +(i + 0.5) * chart.itemWidth, this.grid.top + this.grid.height + 18);
						}
					}
				} else {
					var _allpoints = 0;
					chart.options.xAxis.forEach(function (t) {
						_allpoints += t.points
					});
					var _startX = this.grid.left, _endX = 0;
					for (i = 0; len > i; i++){
						_startX = _endX,
						_endX = _startX + xAxisData[i].points / _allpoints * chart.grid.width;
						_endX = Math.ceil(_endX / this.itemWidth) * this.itemWidth;
						fillStyle = "#2dfbfe";
						if(0 == i){
							moveTo(this.grid.left + _startX, this.grid.top + this.grid.height),
							lineTo(this.grid.left + _startX, this.grid.top + this.grid.height + 6),
							textValue = ConvertFloat(xAxisData[i].startfreq, 3) + "MHz",
							fillText(textValue, this.grid.left + _startX, this.grid.top + this.grid.height + 18);
						} else {
							this.stepXArr.push(this.grid.left + _startX);
							textValue = ConvertFloat(xAxisData[i - 1].endfreq, 3) + "/" + ConvertFloat(xAxisData[i].startfreq, 3) + "MHz",
							fillText(textValue, this.grid.left + _startX - 5 * textValue.length / 2, this.grid.top + this.grid.height + 18);
						}
						if(i == len - 1){
							textValue = ConvertFloat(xAxisData[i].endfreq, 3) + "MHz";
							fillText(textValue, this.grid.left + _endX - 6 * (textValue.length - 3) - 30, this.grid.top + this.grid.height + 18);
							moveTo(this.grid.left + _endX, this.grid.top + this.grid.height);
							lineTo(this.grid.left + _endX, this.grid.top + this.grid.height + 6);
						} 
					}
				}
				stroke(),
				restore()
			}
		},
		_drawXAxis2: function () {
			this.stepXArr = [];
			var textValue, 
			chart = this, xAxisData = chart.options.xAxis;
			xAxisData.length;
			if(chart.options.dataItemRange && 2 == chart.options.dataItemRange.length){
				xAxisData = chart.originOptions.xAxis.slice(chart.options.dataItemRange[0], chart.options.dataItemRange[1]);
			}
			with (this.context2DBuffer) {
				font = "normal normal normal 10px 微软雅黑",
				strokeStyle = this.options.style.lineColor || "rgba(0,177,179,1)",
				fillStyle = this.options.style.lineColor || "rgba(0,177,179,1)",
				lineWidth = 1,
				save(),
				beginPath(),
				translate(0, 0),
				moveTo(this.grid.left, this.grid.top + this.grid.height),
				lineTo(this.grid.left + this.grid.width, this.grid.top + this.grid.height),
				stroke(),
				translate(0, 0.5),
				moveTo(this.grid.left, this.grid.top),
				lineTo(this.grid.left + this.grid.width, this.grid.top);

				var newlen = xAxisData.length;
				var xStepWidth = this.grid.width / newlen;
				var isSampling = false;
				if(newlen >= 8){
					isSampling = true;
				}
				for (var i = 0; newlen > i; i++){
					if(!isSampling && i % parseInt(newlen / 8) == 0){
						moveTo(this.grid.left + (i + 0.5) * xStepWidth, this.grid.top + this.grid.height);
						lineTo(this.grid.left + (i + 0.5) * xStepWidth, this.grid.top + this.grid.height + 6);
						textValue = xAxisData[i] + "MHz";
						textAlign = "center";
						fillStyle = "#2dfbfe";
						fillText(textValue, this.grid.left + (i + 0.5) * xStepWidth, this.grid.top + this.grid.height + 18);
						this.stepXArr.push(this.grid.left + (i + 0.5) * xStepWidth);
					}
				}
					
				stroke(),
				restore()
			}
		},
		_drawYAxis: function () {
			this.stepYArr = [];
			var yMax = this.options.yAxis.max
				, step = this.options.yAxis.step
				, yMin = this.options.yAxis.min;

			this.heightRatio = this.grid.height / (yMax - yMin);
			with (this.context2DBuffer) {
				font = "normal normal normal 10px 微软雅黑",
				strokeStyle = this.options.style.lineColor || "rgba(0,177,179,1)",
				fillStyle = this.options.style.lineColor || "rgba(0,177,179,1)",
				lineWidth = 1;
				if("colorlegend" != this.options.type){
					save();
					beginPath();
					translate(.5, 0);

					moveTo(this.grid.left, this.grid.top);
					lineTo(this.grid.left, this.grid.top + this.grid.height);
					translate(-1, 0);
					moveTo(this.grid.left + this.grid.width, this.grid.top);
					lineTo(this.grid.left + this.grid.width, this.grid.top + this.grid.height);
				}
				var tickWidth = this.grid.height / step;
				for (var i = 0; step >= i; i++) {
					moveTo(this.grid.left, this.grid.top + this.grid.height - tickWidth * i);
					lineTo(this.grid.left, this.grid.top + this.grid.height - tickWidth * i);
					font = "normal normal 10px 微软雅黑";
					fillStyle = "#000";
					if (i % 2 == 0) {
						var textoffset = 4;
						if(i==0){
							textoffset = -2;
						}else if(i == step){
							textoffset = 9;
							textAlign = "right";
							textXoffset = -3;
							if("colorlegend" == this.options.type){
								textAlign = "left";
								textXoffset = -30
							}
						}
						var textValue = Math.round((yMax - yMin) / step * i + yMin);
						fillText(textValue, this.grid.left + textXoffset, this.grid.top + this.grid.height - tickWidth * i + textoffset)
					}
					this.stepYArr.push(this.grid.top + this.grid.height - tickWidth * i)
				}
				stroke(),
				restore()
			}
		},
		_drawGrid: function () {
			with (this.context2DBuffer) {
				save(),
					strokeStyle = "rgba(0,77,77)",
					globalAlpha = "0.8",
					fillStyle = "#fff",
					lineWidth = .5,
					translate(.25, .25);
				for (var j = 0, stepX = parseInt(this.grid.width / 10), stepY = this.grid.height / 10, i = 1, len = this.stepYArr.length - 1; len > i; i++) {
					for (beginPath(),
						j = 1; stepX > j; j++)
						moveTo(this.grid.left + 10 * j, this.stepYArr[i]),
							lineTo(this.grid.left + 10 * j + 4, this.stepYArr[i]);
					stroke()
				}
				if (this.options.xStep)
					for (var xStep = this.options.xStep || 5, xStepWidth = this.grid.width / (xStep - 1), i = 0; xStep > i; i++)
						this.stepXArr.push(this.grid.left + (i + 1) * xStepWidth);
				for (var i = 0, len = this.stepXArr.length; len > i; i++) {
					for (beginPath(),
						j = 1; stepY > j; j++)
						moveTo(this.stepXArr[i], this.grid.top + 10 * j),
							lineTo(this.stepXArr[i], this.grid.top + 10 * j + 4);
					stroke()
				}
				restore()
			}
		},
		_drawColorlegend: function () {
			if (this.options.yAxis.colors.length < 2) {
				return;
			}
			var gradient = new gradientColorArr(this.options.yAxis.colors, this.grid.height);
			var valStep = Math.round(parseFloat(this.options.yAxis.max - this.options.yAxis.min) / this.grid.height * 100) / 100;
			var len = gradient.length;
			this.context2DBuffer.save(),
			this.context2DBuffer.beginPath(),
			this.context2DBuffer.fillStyle = gradient[0],
			this.context2DBuffer.strokeStyle = gradient[0],
			this.context2DBuffer.fillRect(this.Colorlegend.left, this.Colorlegend.top - 1, this.Colorlegend.width, 1);
			for (var i = 0; len > i; i++){
				this.gradientColors.push({
					value: this.options.yAxis.min + valStep * i,
					color: gradient[len - 1 - i]
				});
				this.context2DBuffer.fillStyle = gradient[i];
				this.context2DBuffer.strokeStyle = gradient[i];
				this.context2DBuffer.fillRect(this.Colorlegend.left - 2, this.Colorlegend.top + i, this.Colorlegend.width, 1);
				this.context2DBuffer.fill();
			}
				
			this.context2DBuffer.font = "normal normal 12px 幼园",
			this.context2DBuffer.fillStyle = "#000";
			var title = this.options.title || "dbμv";
			this.context2DBuffer.translate(this.Colorlegend.left + 8, (this.Colorlegend.top + this.Colorlegend.height + (this.options.showOccupancy ? 60 : 0)) / 2 + 4 * title.length),
			this.context2DBuffer.rotate(270 * Math.PI / 180),
			this.context2DBuffer.fillText(title, 5, 5),
			this.context2DBuffer.restore();
		},
		_drawData: function () {
			var chart = this
				, data = chart.options.data || []
				, barData = chart.getSampleData(data);
			chart.itemWidth = 1;
			var barHeight = 0
				, len = barData.length;
			if (0 != len)
				with (len >= chart.grid.width ? len = chart.grid.width : chart.itemWidth = chart.grid.width / len,
				chart.context2D) {
					save(),
						clearRect(0, 0, this.canvasElm.width, this.canvasElm.height),
						chart.options.showOccupancy && (chart.context2DOcc.fillStyle = "#000",
							chart.context2DOcc.fillRect(this.OccGrid.left + 1, 1, this.OccGrid.width - 2, this.OccGrid.height));
					for (var i = 0; len > i; i++)
						if ("undefined" != typeof barData[i] && "undefined" != typeof barData[i].value) {
							beginPath(),
								barHeight = barData[i].value * chart.heightRatio - chart.options.yAxis.min * chart.heightRatio;
							var y = chart.getYByValue(barData[i].value);
							if (y < chart.grid.top && (y = chart.grid.top,
								barHeight = chart.grid.height),
								"bar" == chart.options.type)
								fillStyle = chart._getColor(barData[i].value),
									2 == chart.options.xAxisType ? fillRect(chart.grid.left + i * chart.itemWidth + chart.itemWidth / 2, y, 1, barHeight) : fillRect(chart.grid.left + i * chart.itemWidth + (chart.itemWidth - 1) / 6, y, (chart.itemWidth - 1) / 6 * 4 + 1, barHeight);
							else if ("line" == chart.options.type) {
								if (beginPath(),
									strokeStyle = chart._getColor(barData[i].value),
									i + 1 >= len)
									return;
								moveTo(chart.grid.left + i * chart.itemWidth + chart.itemWidth / 2, chart.getYByValue(barData[i].value)),
									lineTo(chart.grid.left + (i + 1) * chart.itemWidth + chart.itemWidth / 2, chart.getYByValue(barData[i + 1].value)),
									stroke()
							}
							chart.options.showMax && (beginPath(),
								strokeStyle = "#f00",
								i - 1 >= 0 && (moveTo(chart.grid.left + (i - 1) * chart.itemWidth + chart.itemWidth / 2, chart.getYByValue(barData[i - 1].maxValue)),
									lineTo(chart.grid.left + i * chart.itemWidth + chart.itemWidth / 2, chart.getYByValue(barData[i].maxValue)),
									stroke())),
								chart.options.showMin && (beginPath(),
									strokeStyle = "#0065fc",
									i - 1 >= 0 && (moveTo(chart.grid.left + (i - 1) * chart.itemWidth + chart.itemWidth / 2, chart.getYByValue(barData[i - 1].minValue)),
										lineTo(chart.grid.left + i * chart.itemWidth + chart.itemWidth / 2, chart.getYByValue(barData[i].minValue)),
										stroke())),
								chart.options.showAvg && (beginPath(),
									strokeStyle = "#ffa500",
									i - 1 >= 0 && (moveTo(chart.grid.left + (i - 1) * chart.itemWidth + chart.itemWidth / 2, chart.getYByValue(barData[i - 1].avgValue)),
										lineTo(chart.grid.left + i * chart.itemWidth + chart.itemWidth / 2, chart.getYByValue(barData[i].avgValue)),
										stroke())),
								chart.options.showOccupancy && (chart.context2DOcc.fillStyle = "#52caf3",
									y = this.OccGrid.top + this.OccGrid.height - barData[i].occValue * (chart.OccGrid.height / 100),
									chart.context2DOcc.fillRect(chart.OccGrid.left + i * chart.itemWidth + (chart.itemWidth - 1) / 6, y, (chart.itemWidth - 1) / 6 * 4 + 1, barData[i].occValue * (chart.OccGrid.height / 100))),
								chart.options.showThreshold && (beginPath(),
									strokeStyle = "#f00",
									i - 1 >= 0 && (moveTo(chart.grid.left + (i - 1) * chart.itemWidth + chart.itemWidth / 2, chart.getYByValue(barData[i - 1].thrValue)),
										lineTo(chart.grid.left + i * chart.itemWidth + chart.itemWidth / 2, chart.getYByValue(barData[i].thrValue)),
										stroke())),
								"function" == typeof chart.options.event.ondatadrawing && chart.options.event.ondatadrawing(i, barData[i])
						}
					restore()
				}
		},
		_redrawfalls: function () {
			var t = this;
			t.options.cacheFallsData = t.options.cacheFallsData || [],
				t.fallsY = 0,
				t.options.cacheFallsData.forEach(function (i) {
					t._drawfalls(i, false)
				})
		},
		_drawfalls: function (data, noCache) {
			var fallsHeight = 5
				, chart = this;
			data = data || chart.options.data || [],
				noCache || (chart.options.cacheFallsData = chart.options.cacheFallsData || [],
					chart.options.cacheFallsData.length > Math.ceil(this.options.height / fallsHeight) && chart.options.cacheFallsData.splice(0, 1),
					chart.options.cacheFallsData.push(data));
			var fallsData = chart.getSampleData(data);
			chart.itemWidth = 1;
			var len = fallsData.length;
			if (0 != len)
				with (len >= chart.grid.width ? len = chart.grid.width : chart.itemWidth = chart.grid.width / len,
				chart.context2D) {
					if (chart.fallsY >= chart.grid.height) {
						chart.fallsY = chart.grid.height;
						var imgData = getImageData(chart.grid.left, fallsHeight, chart.grid.width, chart.grid.height - fallsHeight);
						clearRect(0, 0, chart.canvasElm.width, chart.canvasElm.height),
							putImageData(imgData, chart.grid.left, 1)
					} else
						chart.fallsY = (chart.fallsY || 0) + fallsHeight;
					for (var i = 0; len > i; i++)
						"undefined" != typeof fallsData[i] && "undefined" != typeof fallsData[i].value && (beginPath(),
							fillStyle = chart._getColor(fallsData[i].value),
							fillRect(chart.grid.left + i * chart.itemWidth - .5, chart.fallsY - fallsHeight, chart.itemWidth + 1, fallsHeight))
				}
		},
		_drawMark: function (index, dataItem) {
			with (chart.context2DMark || (this.canvasElmMark = this._createCanvas(this.grid),
				this.context2DMark = this._getContext2D(this.canvasElmMark)),
			chart.context2DMark)
			save(),
				clearRect(0, 0, this.canvasElmMark.width, this.canvasElmMark.height),
				beginPath(),
				fillStyle = "#2dfbfe",
				moveTo(chart.grid.left + index * this.itemWidth + chart.itemWidth / 2 - 6, this.getYByValue(dataItem.value) - 12),
				lineTo(chart.grid.left + index * this.itemWidth + chart.itemWidth / 2 + 6, this.getYByValue(dataItem.value) - 12),
				lineTo(chart.grid.left + index * this.itemWidth + chart.itemWidth / 2, this.getYByValue(dataItem.value)),
				fill(),
				restore()
		}
	},
	$.fn.rxchart = function (options) {
		var chart = new Chart(this, options);
		return $(this).data("chart", chart),chart
	}
	,
	$.fn.rxchart.defaults = {
		width: 850,
		height: 450,
		type: "bar",
		showColorlegend: false,
		mouseEvent: "enabled",
		hiddenXAxis: !1,
		style: {
			textColor: "#2dfbfe",
			lineColor: "rgba(0,177,179,1)"
		},
		xAxis: {
			min: 100,
			max: 200,
			step: 5,
			unit: "MHz"
		},
		yAxis: {
			min: -20,
			max: 80,
			step: 10,
			hidden: !1,
			align: "right",
			colors: ["#7aff00", "#00fa00", "#055605"]
		},
		data: [],
		event: {
			onzoomchanged: function () { },
			onyaxischanged: function () { },
			ondrawasthrchanged: function () { },
			onclick: function () { },
			onmousemove: function () { },
			onmousedown: function () { },
			onmouseup: function () { },
			onmouseout: function () { },
			ondblclick: function () { }
		}
	}
})(jQuery)