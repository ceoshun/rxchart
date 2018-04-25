(function ($) {
	function Chart(Elm, opt) {
		this.init(Elm,opt)
	}
	Chart.prototype = {
		init:function(Elm,opt){
			$this = this,
			this.target = Elm,
			this.container = $(Elm),
			this.options = $.extend(false, {}, $.fn.ngchart.defaults, opt),
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
					return l >= this.left && l <= this.left + this.width && t >= this.top && t <= this.top + this.height;
				}
			},
			this.heightRatio = this.grid.height / (this.options.yAxis.max - this.options.yAxis.min);
			this.canvasElmBuffer = this._createCanvas();
			this.context2DBuffer = this._getContext2D(this.canvasElmBuffer);
			this.canvasElm = this._createCanvas(this.grid);
			this.context2D = this._getContext2D(this.canvasElm);
			this.canvasElmInfo = this._createCanvas(this.grid);
			this.context2DInfo = this._getContext2D(this.canvasElmInfo);
			this.canvasElmASThr = this._createCanvas(this.grid);
			this.context2DASThr = this._getContext2D(this.canvasElmASThr);
			this.itemWidth = 1;
			this.draw(false);
			this.bindMouseEvent();
		}
		,draw: function (bDraw) {
			if (bDraw) {
				this.context2DBuffer.clearRect(0, 0, this.options.width, this.options.height);
				this.options.showColorlegend && this._drawColorlegend();
				this._drawYAxis();
				if("colorlegend" == this.options.type){
					return;
				}
					
				if(this.options.xAxisType == 2){
					this._drawXAxis2()
				}else{
					this._drawXAxis()
				}

				if("falls" != this.options.type){
					this._drawGrid()
				}

				this.options.showOccupancy && this._drawOccupancy();
				this.options.showASThreshold && this._drawASThreshold();
			}
			
			if("falls" == this.options.type){
				this._drawfalls()
			}else{
				this._drawData()
			}
		},
		getOption: function () {
			var t = this.container.data("option");
			if(typeof t == "undefined"){
				t = {}
			}
			return t;
		},
		setOption: function (_options, bDraw, bSave) {
			var a = this.getOption();
			this.options = $.extend({}, a, _options);
			this.container.data("option", this.options);
			if(bSave){
				this.originOptions = $.extend(false, {}, this.options);
			}
			this.draw(bDraw)
		},
		setHeight: function (height) {
			this.options.height = height;
			this.container.height(height + "px");
			this.Colorlegend.height = height - this.xAxisLabelHeight;
			this.grid.height = this.Colorlegend.height;
			this.heightRatio = this.grid.height / (this.options.yAxis.max - this.options.yAxis.min);
			this.canvasElmBuffer.height = height;
			this.canvasElm.height = this.grid.height;
			this.canvasElmInfo.height = this.grid.height;
			this.canvasElmASThr.height = this.grid.height;
			this.setOption({
				height: height
			}, false, false);
		},
		resize: function (width, height) {
			this.options.width = width;
			this.options.height = height;
			this.container.width(width + "px");
			this.container.height(height + "px");
			this.Colorlegend.height = height - this.xAxisLabelHeight;
			this.grid.width = this.options.width - this.Colorlegend.width;
			this.grid.height = this.Colorlegend.height;
			this.heightRatio = this.grid.height / (this.options.yAxis.max - this.options.yAxis.min);
			this.canvasElmBuffer.width = width;
			this.canvasElmBuffer.height = height;
			this.canvasElm.width = width;
			this.canvasElm.height = this.grid.height;
			this.canvasElmInfo.width = width;
			this.canvasElmInfo.height = this.grid.height;
			this.canvasElmASThr.width = width;
			this.canvasElmASThr.height = this.grid.height;
			this.setOption({
				width: width,
				height: height
			}, true, true);
			this.options.showOccupancy && this.showOccupancy();
			this._redrawfalls();
		},
		destroy: function () {
			this.container.remove("canvas");
			this.container.removeData("option");
			delete this;
		},
		clear: function () {
			_clear(this);
		},
		bindMouseEvent: function (t) {
			if("falls" == this.options.type){
				this.container.dblclick(_dblclick);
			} if("disabled" != this.options.mouseEvent) {
				this.container.mousedown(_mousedown).mousemove(_mousemove).mouseup(_mouseup).dblclick(_dblclick).mouseout(_mouseout).click(_click);
			}
		},
		showOccupancy: function () {
			this.options.showOccupancy = true;
			this.OccColorlegend = {
				left: 0,
				top: 0,
				height: 100,
				width: this.options.yAxis.hidden ? 0 : 35
			};
			this.OccGrid = {
				left: this.OccColorlegend.width,
				top: 1,
				height: 100,
				width: this.options.width - this.OccColorlegend.width
			};
			this.Colorlegend.top = this.OccColorlegend.height + 1;
			this.Colorlegend.height = this.options.height - this.xAxisLabelHeight - this.OccGrid.height - 1;
			this.grid.top = this.Colorlegend.top;
			this.grid.height = this.Colorlegend.height;
			this.heightRatio = this.grid.height / (this.options.yAxis.max - this.options.yAxis.min);
			this.draw(true);
			if(this.canvasElmOcc){
				this.canvasElmOcc.height = this.OccGrid.height;
			}
		},
		hideOccupancy: function () {
			this.options.showOccupancy = false;
			this.Colorlegend.top = 0;
			this.Colorlegend.height = this.options.height - this.xAxisLabelHeight;
			this.grid.top = this.Colorlegend.top;
			this.grid.height = this.Colorlegend.height;
			this.heightRatio = this.grid.height / (this.options.yAxis.max - this.options.yAxis.min);
			this.draw(true);
			this.canvasElmOcc.height = 0;
		},
		_drawOccupancy: function () {
			if(!this.context2DOcc){
				this.canvasElmOcc = this._createCanvas(this.OccGrid);
				this.canvasElmOcc.height = this.OccGrid.height + 1;
				this.context2DOcc = this._getContext2D(this.canvasElmOcc);
			}
			with (this.context2DBuffer) {
				save();
				font = "normal normal 12px 微软雅黑";
				fillStyle = "#000";
				beginPath();
				translate(0.5, 0.5);
				var textValue = "占用度";
				for (i = 0; i < textValue.length; i++){
					fillText(textValue[i], this.OccColorlegend.width / 2 - 2, this.OccColorlegend.height / 2 + 14 * (i - 1));
				}
				rect(this.OccGrid.left, this.OccGrid.top - 1, this.OccGrid.width - 1, this.OccGrid.height + 1);
				stroke();
				restore();
			}
		},
		_drawASThreshold: function (drawLine) {
			var asThrValue = this.options.asThrValue = this.options.asThrValue || 40;
			var y = this.getYByValue(asThrValue);
			with (this.context2DASThr){
				clearRect(this.grid.left, this.grid.top, this.canvasElmASThr.width, this.canvasElmASThr.height);
				save();
				strokeStyle = "#f00";
				fillStyle = "#f00";
				beginPath();
				moveTo(this.grid.left + 1, y - 8);
				lineTo(this.grid.left + 11, y);
				lineTo(this.grid.left + 1, y + 8);
				closePath();
				fill();
				if(drawLine){
					beginPath();
					translate(0.5, 0.5);
					moveTo(this.grid.left + 11, y);
					lineTo(this.grid.left + this.grid.width, y);
					fillStyle = "#fff";
					font = "normal normal 14px 微软雅黑";
					fillText(ConvertFloat(asThrValue, 2), this.grid.left + 12, y + 5);
					stroke();
				};
				restore();
			}
		},
		_createCanvas: function (t) {
			this.zIndex = this.zIndex || 0;
			var canvas = document.createElement("canvas");
			$(canvas).appendTo(this.container).css({
				position: "absolute",
				left: "0px",
				top: (t && t.top || 0) + "px",
				"z-index": ++this.zIndex
			});
			canvas.id = Math.random();//uuid.v1();
			canvas.width = this.options.width;
			canvas.height = t && t.height || this.options.height;
			return  canvas;
		},
		_getContext2D: function (canvasele) {
			if(!canvasele){
				canvasele = this.canvasElm;
			}
			if(!canvasele.getContext){
				// IE 不支持getContext
				G_vmlCanvasManager.initElement(canvasele);
			}
			return canvasele.getContext("2d")
		},
		_getColor: function (value) {
			if (!this.options.showColorlegend){
				return this.options.yAxis.colors[0] || "#ff0";
			}
			return this.binarySearch(this.gradientColors,"value","color",value)
		},
		getDataItemByX: function (t, i) {
			var e = -1;
			var a = t - this.grid.left;
			if( 0 > a ) {
				e = -1;
			}
			var n = this.getSampleData(this.options.data);
			if (n.length > 0) {
				//(r - 1) * this.itemWidth;
				e = Math.ceil(a / this.itemWidth) - 1
			}
			return n[e]
		},
		getSampleData: function (t, i) {
			if ("undefined" == typeof t) return [];
			if(this.options.dataItemRange && 2 == this.options.dataItemRange.length){
				t = t.slice(this.options.dataItemRange[0], this.options.dataItemRange[1])
			}
			var e = [];
			var len = this.grid.width || 1e3;
			if (t.length <= len) return t;

			for (var a = t.length / len, n = 0, r = {}, o = 0, s = 0; s < len; s++) {
				n = parseInt(a * s),
				o = parseInt(a * (s + 1)),
				r = $.extend({}, t[n]);
				for (var h = n + 1; o > h; h++){
					if(t[h].value > r.value){
						r.value =  t[h].value;
					}else{
						r.value =  r.value;
					}
					if(t[h].minValue > r.minValue){
						r.minValue =  t[h].minValue;
					}else{
						r.minValue =  r.minValue;
					}
					if(t[h].maxValue > r.maxValue){
						r.maxValue =  t[h].maxValue;
					}else{
						r.maxValue =  r.maxValue;
					}

					r.avgValue += t[h].avgValue;
				}
				r.index = s;
				r.avgValue = r.avgValue / (o - n);
				e.push(r);
			}
			return e
		},
		getDataByRange: function (t, i, e) {
			var a = [];
			t.forEach(function (t) {
				if(t.name >= i && t.name <= e){
					a.push(t)
				}
			})
			return a;
		},
		getXByIndex: function (index) {
			return this.grid.left + this.itemWidth * index;
		},
		getYByValue: function (value) {
			return this.grid.top + this.grid.height - value * this.heightRatio + this.options.yAxis.min * this.heightRatio
		},
		getValueByY: function (y) {
			return ConvertFloat((this.grid.height + this.grid.top - y) / this.heightRatio + this.options.yAxis.min, 3)
		},
		// 二分法查找
		binarySearch:function(data,keyProp,valueProp,value){
			var low = 0;
			var high = data.length -1;
			var mid = -1;
			while (low<high) {
				var mid = Math.floor((low+high)/2);
				if(value == data[mid][keyProp]){
					return mid;
				} else if(value > data[mid][keyProp]){
					low = mid + 1;
				} else if(value < data[mid][keyProp]){
					high = mid -1;
				} else {
					return -1;
				}
			}
			return data[mid][valueProp];
		},
		getValueByName: function (name) {
			var data = this.getSampleData(this.options.data);
			return binarySearch(data,"name","value",name);
		},
		_drawXAxis: function () {
			this.stepXArr = [];
			var textValue, chart = this, xAxisData = chart.options.xAxis, len = xAxisData.length;
			if (this.options.xAxis.length > 0) {
				var fianlData = this.getSampleData(this.options.data);
				if(fianlData.length > 0 && fianlData.length / this.grid.width < 0.01) {
					if(fianlData[0].name == this.options.xAxis[0].startfreq){
						this.options.xAxis[0].startfreq -= this.options.xAxis[0].step
					}

					if(fianlData[fianlData.length - 1].name == this.options.xAxis[this.options.xAxis.length - 1].endfreq){
						this.options.xAxis[this.options.xAxis.length - 1].endfreq += this.options.xAxis[this.options.xAxis.length - 1].step
					}
				}
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
						var avgValue = (xAxisData[0].endfreq - xAxisData[0].startfreq) / (newlen - 1);
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
							fillStyle = this.options.style.textColor || "#000";
							fillText(textValue, this.grid.left + i * xStepWidth, this.grid.top + this.grid.height + 18);
						}
					} else {
						for (var i = 0; i < pointData.length; i++){
							fillStyle = this.options.style.lineColor || "rgba(0,177,179,1)";
							moveTo(this.grid.left + (i + 0.5) * chart.itemWidth, this.grid.top + this.grid.height);
							lineTo(this.grid.left + (i + 0.5) * chart.itemWidth, this.grid.top + this.grid.height + 6);
							textValue = ConvertFloat(pointData[i].name, 3) + "MHz";
							textAlign = "left";
							fillStyle = this.options.style.textColor || "#000";
							fillText(textValue, +(i + 0.5) * chart.itemWidth, this.grid.top + this.grid.height + 18);
						}
					}
				} else {
					var _allpoints=0;
					chart.options.xAxis.forEach(function(t){
						_allpoints+=t.points
					});
					var _startX=this.grid.left;
					var _endX=0;
					for(var i=0;len>i;i++){
						_startX=_endX;
						_endX=_startX + xAxisData[i].points / _allpoints * chart.grid.width;
						_endX=Math.ceil(_endX/this.itemWidth)*this.itemWidth;
						fillStyle="#000";
						if(i==0){
							moveTo(this.grid.left+_startX,this.grid.top+this.grid.height);
							lineTo(this.grid.left+_startX,this.grid.top+this.grid.height+6);
							textValue=ConvertFloat(xAxisData[i].startfreq,3)+"MHz";
							fillText(textValue,this.grid.left+_startX,this.grid.top+this.grid.height+18);
						}else{
							this.stepXArr.push(this.grid.left+_startX);
							textValue=ConvertFloat(xAxisData[i-1].endfreq,3)+"/"+ConvertFloat(xAxisData[i].startfreq,3)+"MHz";
							fillText(textValue,this.grid.left+_startX-5*textValue.length/2,this.grid.top+this.grid.height+18);
						}
	
						// 最后一个坐标
						if(i==len-1){
							textValue=ConvertFloat(xAxisData[i].endfreq,3)+"MHz";
							fillText(textValue,this.grid.left+_endX-6*(textValue.length-3)-30,this.grid.top+this.grid.height+18);
						}
						moveTo(this.grid.left+_endX,this.grid.top+this.grid.height),
						lineTo(this.grid.left+_endX,this.grid.top+this.grid.height+6)
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
						fillStyle = "#000";
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
						var textXoffset = -3;
						var textAlign = "right";
						if(i==0){
							textoffset = -2;
						}else if(i == step){
							textoffset = 9;
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
				restore();
			}
		},
		_drawGrid: function () {
			with (this.context2DBuffer) {
				save();
				strokeStyle = "#000";
				globalAlpha = "0.8";
				fillStyle = "#fff";
				lineWidth = 0.5;
				translate(.25, .25);
				var j = 0;
				var stepX = parseInt(this.grid.width / 10);
				var stepY = this.grid.height / 10;
				var len = this.stepYArr.length - 1;

				for (var i = 1; len > i; i++) {
					beginPath();
					for (var j = 1; stepX > j; j++){
						moveTo(this.grid.left + 10 * j, this.stepYArr[i]);
						lineTo(this.grid.left + 10 * j + 4, this.stepYArr[i]);
					}
					stroke();
				}

				if (this.options.xStep){
					var xStep = this.options.xStep || 5;
					var xStepWidth = this.grid.width / (xStep - 1);
					for (var i = 0; xStep > i; i++){
						this.stepXArr.push(this.grid.left + (i + 1) * xStepWidth);
					}
				}
					
				for (var i = 0, len = this.stepXArr.length; len > i; i++) {
					beginPath();
					for (var j = 1; stepY > j; j++){
						moveTo(this.stepXArr[i], this.grid.top + 10 * j);
						lineTo(this.stepXArr[i], this.grid.top + 10 * j + 4);
					}
					stroke();
				}
				restore();
			}
		},
		gradientColorArr:function(colors,height) {
			//t color
			//i height
			var e = [];
			if ("[object Array]" !== Object.prototype.toString.call(colors))
				return e;
			for (var i = 1; i < colors.length; i++){
				e = e.concat(new gradientColor(colors[i - 1], colors[i], parseInt(height / (colors.length - 1))));
			}
			for (var i = 1; i < height % (colors.length - 1);i++) {
				var n = parseInt(height / (colors.length - 1));
				e.splice(n, 0, e[n])
			}
			return e
		},
		_drawColorlegend: function () {
			if (this.options.yAxis.colors.length < 2) {
				return;
			}
			var gradient = new this.gradientColorArr(this.options.yAxis.colors, this.grid.height);
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
			var chart = this;
			var data = chart.options.data || []
			var barData = chart.getSampleData(data);
			chart.itemWidth = 1;
			var barHeight = 0;
			var len = barData.length;
			if (len < 1) return;
			if(len >= chart.grid.width){
				len = chart.grid.width
			}else{
				chart.itemWidth = chart.grid.width / len
			}
			with (chart.context2D) {
				save();
				clearRect(0, 0, this.canvasElm.width, this.canvasElm.height);
				if(chart.options.showOccupancy && chart.context2DOcc){
					// if(!chart.context2DOcc){
					// 	chart._drawOccupancy();
					// }
					chart.context2DOcc.fillStyle = "#000"
					chart.context2DOcc.fillRect(this.OccGrid.left + 1, 1, this.OccGrid.width - 2, this.OccGrid.height)
				}
				for (var i = 0; len > i; i++){
					if ("undefined" != typeof barData[i] && "undefined" != typeof barData[i].value) {
						beginPath();
						barHeight = barData[i].value * chart.heightRatio - chart.options.yAxis.min * chart.heightRatio;
						var y = chart.getYByValue(barData[i].value);
						if (y < chart.grid.top) {
							y = chart.grid.top;
							barHeight = chart.grid.height
						}
						if ("bar" == chart.options.type){
							fillStyle = chart._getColor(barData[i].value);
							if(2 == chart.options.xAxisType){
								fillRect(chart.grid.left + i * chart.itemWidth + chart.itemWidth / 2, y, 1, barHeight)
							}else{
								fillRect(chart.grid.left + i * chart.itemWidth + (chart.itemWidth - 1) / 6, y, (chart.itemWidth - 1) / 6 * 4 + 1, barHeight)
							}
						} else if ("line" == chart.options.type) {
							beginPath();
							strokeStyle = chart._getColor(barData[i].value);
							if (i >= len -1) return;
							moveTo(chart.grid.left + i * chart.itemWidth + chart.itemWidth / 2, chart.getYByValue(barData[i].value));
							lineTo(chart.grid.left + (i + 1) * chart.itemWidth + chart.itemWidth / 2, chart.getYByValue(barData[i + 1].value));
							stroke();
						}
						if(chart.options.showMax){
							beginPath();
							strokeStyle = "#f00";
							if(i>=1){
								moveTo(chart.grid.left + (i - 1) * chart.itemWidth + chart.itemWidth / 2, chart.getYByValue(barData[i - 1].maxValue));
								lineTo(chart.grid.left + i * chart.itemWidth + chart.itemWidth / 2, chart.getYByValue(barData[i].maxValue));
								stroke();
							}
						}
						if(chart.options.showMin){
							beginPath();
							strokeStyle = "#0065fc";
							if(i>=1){
								moveTo(chart.grid.left + (i - 1) * chart.itemWidth + chart.itemWidth / 2, chart.getYByValue(barData[i - 1].minValue));
								lineTo(chart.grid.left + i * chart.itemWidth + chart.itemWidth / 2, chart.getYByValue(barData[i].minValue));
								stroke()
							}
						}
						if(chart.options.showAvg){
							beginPath();
							strokeStyle = "#ffa500";
							if(i>=1){
								moveTo(chart.grid.left + (i - 1) * chart.itemWidth + chart.itemWidth / 2, chart.getYByValue(barData[i - 1].avgValue));
								lineTo(chart.grid.left + i * chart.itemWidth + chart.itemWidth / 2, chart.getYByValue(barData[i].avgValue));
								stroke()
							}
						}
						if(chart.options.showOccupancy){
							chart.context2DOcc.fillStyle = "#52caf3";
							y = this.OccGrid.top + this.OccGrid.height - barData[i].occValue * (chart.OccGrid.height / 100);
							chart.context2DOcc.fillRect(chart.OccGrid.left + i * chart.itemWidth + (chart.itemWidth - 1) / 6, y, (chart.itemWidth - 1) / 6 * 4 + 1, barData[i].occValue * (chart.OccGrid.height / 100))
						}
						if(chart.options.showThreshold){
							beginPath();
							strokeStyle = "#f00";
							if(i>=1){
								moveTo(chart.grid.left + (i - 1) * chart.itemWidth + chart.itemWidth / 2, chart.getYByValue(barData[i - 1].thrValue));
								lineTo(chart.grid.left + i * chart.itemWidth + chart.itemWidth / 2, chart.getYByValue(barData[i].thrValue));
								stroke()
							}
						}
						if("function" == typeof chart.options.event.ondatadrawing){
							chart.options.event.ondatadrawing(i, barData[i])
						}
					}
				}
				restore()
			}
		},
		_redrawfalls: function () {
			var t = this;
			t.options.cacheFallsData = t.options.cacheFallsData || [];
			t.fallsY = 0;
			t.options.cacheFallsData.forEach(function (i) {
				t._drawfalls(i, false)
			})
		},
		_drawfalls: function (data, noCache) {
			var fallsHeight = 5,chart = this;
			data = data || chart.options.data || [];
			if(!noCache){
				chart.options.cacheFallsData = chart.options.cacheFallsData || [];
				if(chart.options.cacheFallsData.length > Math.ceil(this.options.height / fallsHeight)){
					chart.options.cacheFallsData.splice(0, 1);
				}
				chart.options.cacheFallsData.push(data);
			};
			var fallsData = chart.getSampleData(data);
			chart.itemWidth = 1;
			var len = fallsData.length;
			if (len < 1) return;
			if(len >= chart.grid.width){
				len = chart.grid.width
			}else{
				chart.itemWidth = chart.grid.width / len
			}
			with (chart.context2D) {
				if (chart.fallsY >= chart.grid.height) {
					chart.fallsY = chart.grid.height;
					var imgData = getImageData(chart.grid.left, fallsHeight, chart.grid.width, chart.grid.height - fallsHeight);
					clearRect(0, 0, chart.canvasElm.width, chart.canvasElm.height);
					putImageData(imgData, chart.grid.left, 1);
				} else {
					chart.fallsY = (chart.fallsY || 0) + fallsHeight;
				}
					
				for (var i = 0; len > i; i++){
					if("undefined" != typeof fallsData[i] && "undefined" != typeof fallsData[i].value){
						beginPath();
						fillStyle = chart._getColor(fallsData[i].value);
						fillRect(chart.grid.left + i * chart.itemWidth - .5, chart.fallsY - fallsHeight, chart.itemWidth + 1, fallsHeight);
					}
				}
			}
		},
		_drawMark: function (index, dataItem) {
			if(!chart.context2DMark){
				this.canvasElmMark = this._createCanvas(this.grid);
				this.context2DMark = this._getContext2D(this.canvasElmMark);
			}
			with (chart.context2DMark){
				save();
				clearRect(0, 0, this.canvasElmMark.width, this.canvasElmMark.height);
				beginPath();
				fillStyle = "#000";
				moveTo(chart.grid.left + index * this.itemWidth + chart.itemWidth / 2 - 6, this.getYByValue(dataItem.value) - 12);
				lineTo(chart.grid.left + index * this.itemWidth + chart.itemWidth / 2 + 6, this.getYByValue(dataItem.value) - 12);
				lineTo(chart.grid.left + index * this.itemWidth + chart.itemWidth / 2, this.getYByValue(dataItem.value));
				fill();
				restore();
			}
			
		},
		//更新Mark点的带宽信息
		updateMarkBandInfo:function(event) {
			$('.myMark', chart.container).each(function () {
				var $markbandInfo = $(this).find('.mark-bandInfo');
				if ($markbandInfo.length == 0) {
					$('<span class="mark-bandInfo">&nbsp;带宽：<span class="bandValue"></span>,下降：<span class="dropValue"></span></span>').appendTo($(this));
				}
				var mark = $(this).data('mark');
				var dataItem = chart.getDataItemByX(event.x);
				if (dataItem) {
					$markbandInfo.children('.bandValue').html(Math.round((Math.abs(dataItem.name - mark.name)) * 1000) + 'kHz');
				}
				var yValue = chart.getValueByY(event.y);
				if (yValue) {
					$markbandInfo.children('.dropValue').html(Math.round((Math.abs(yValue - mark.value)) * 10) / 10 + 'dB');
				}
			});
		},
		//初始化按钮
		initButtons:function() {
			//切换波形图/柱状图
			$('#btnChangeChartType').click(function (event) {
				event.preventDefault();
				var btnText = $(this).text();
				var option = chart.getOption();
				if (btnText.indexOf("波形") != -1) {
					$(this).html('<i>&nbsp;</i>切换柱状图');
					option.type = "line";
				} else {
					$(this).html('<i>&nbsp;</i>切换波形图');
					option.type = "bar";
				}
				chart.setOption(option);
			});
			//显示最大值曲线
			$('#btnShowMax').click(function (event) {
				event.preventDefault();
				var option = chart.getOption();
				var $this = $(this);
				if (!$this.children('i').hasClass('fa fa-check')) {
					$this.children('i').addClass('fa fa-check');
					option.showMax = true;
				} else {
					$this.children('i').removeClass('fa fa-check');
					option.showMax = false;
				}
				chart.setOption(option);
			});
			//显示最小值曲线
			$('#btnShowMin').click(function (event) {
				event.preventDefault();
				var option = chart.getOption();
				var $this = $(this);
				if (!$this.children('i').hasClass('fa fa-check')) {
					$this.children('i').addClass('fa fa-check');
					option.showMin = true;
				} else {
					$this.children('i').removeClass('fa fa-check');
					option.showMin = false;
				}
				chart.setOption(option);
			});
			//显示均值
			$('#btnShowAvg').click(function (event) {
				event.preventDefault();
				var option = chart.getOption();
				var $this = $(this);
				if (!$this.children('i').hasClass('fa fa-check')) {
					$this.children('i').addClass('fa fa-check');
					option.showAvg = true;
				} else {
					$this.children('i').removeClass('fa fa-check');
					option.showAvg = false;
				}
				chart.setOption(option);
			});
			//显示占用度
			$('#btnOcc').click(function (event) {
				event.preventDefault();
				var $this = $(this);
				if (!$this.children('i').hasClass('fa fa-check')) {
					$this.children('i').addClass('fa fa-check');
					chart.showOccupancy();
				} else {
					$this.children('i').removeClass('fa fa-check');
					chart.hideOccupancy();
				}
				$('.myMark', chart.container).each(function (index) {
					$(this).css({'top': (chart.grid.top + 18 * (index + 1) - 9) + 'px'});
				});
			});
			//显示门限
			$('#btnShowThr').click(function (event) {
				event.preventDefault();
				var $this = $(this);
				var option = chart.getOption();
				if (!$this.children('i').hasClass('fa fa-check')) {
					$this.children('i').addClass('fa fa-check');
					option.showThreshold = true;
				} else {
					$this.children('i').removeClass('fa fa-check');
					option.showThreshold = false;
				}
				chart.setOption(option);
			});

			//设置Mark点
			$('#btnSetMark').click(function (event) {
				event.preventDefault();
				chart.setMarking = true;
			});
		},
		// 设置Markd点
		setMark:function(chart, mark) {
			if (chart.options.data.length == 0) return;
			var len = $('.myMark', chart.container).length;
			if (len >= 5) {
				popTips('最多只能添加5个Mark点');
				return;
			}
			chart.markColors = chart.markColors || ["#f00", "#ff0", "#fff", "#0000ff", "#68228B"];
			mark.color = chart.markColors[0];
			chart.drawMark(chart, mark);
			chart.markColors.splice(0, 1);
			//添加mark标签
			var dataItem = chart.getDataItemByX(event.x);
			mark.name = dataItem.name;
			var $mark = $('<div class="myMark" style="color:#000;font-family:sans-serif, 宋体; "><i class="fa fa-square" style=" color:' + mark.color + ';">&nbsp;</i>Mark点：<span class="freq"></span></div>').css({
				'position': 'absolute',
				'left': (chart.grid.left + 10) + 'px',
				'top': (chart.grid.top + 18 * (len + 1) - 9) + 'px',
				'z-index': 100,
				'cursor': 'pointer'
			}).data('mark', mark).appendTo(chart.container);
			$mark.find('span').html(dataItem.name + 'MHz，' + (dataItem.value || 0) + 'dbμv');
	
			$('.myMark', chart.container).mousemove(function (event) {
				event.stopPropagation();
			}).dblclick(function (event) {
				event.stopPropagation();
				chart.markColors.push($(this).data('mark').color);
				$(this).remove();
				//重绘Mark点
				chart.context2DMark.clearRect(0, 0, chart.canvasElmMark.width, chart.canvasElmMark.height);
				$('.myMark', chart.container).each(function (index) {
					$(this).css({'top': (chart.grid.top + 18 * (index + 1) - 9) + 'px'});//改变位置
					drawMark(chart, $(this).data('mark'));
				});
			});
		},
		// 绘制Markd点
		drawMark:function(chart, mark) {
			if (typeof mark.isShow !== 'undefined' && !mark.isShow) return;
			if (!chart.context2DMark) {
				chart.canvasElmMark = chart._createCanvas(chart.grid);
				chart.context2DMark = chart._getContext2D(chart.canvasElmMark);//绘制Mark点
			}
	
			with (chart.context2DMark) {
				save();
				lineWidth = 0.5;
				strokeStyle = mark.color;
				fillStyle = mark.color;
				beginPath();
				//Mark点
				moveTo(mark.x - 6, mark.y - 12);
				lineTo(mark.x + 6, mark.y - 12);
				lineTo(mark.x, mark.y);
				closePath();
				fill();
				stroke();
				restore();
			}
		}
	},
	$.fn.ngchart = function (options) {
		var chart = new Chart(this, options);
		return $(this).data("chart", chart),chart
	}
	,
	$.fn.ngchart.defaults = {
		width: 850,
		height: 450,
		type: "bar",
		showColorlegend: false,
		mouseEvent: "enabled",
		hiddenXAxis: !1,
		style: {
			textColor: "#000",
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


	function getEventPosition(event){
		var x,y;//t eveete
		if(!event.layerX){
			if(event.layerX == 0){
				x=event.layerX;
				y=event.layerY;
			}else if(event.offsetX || event.offsetX == 0){
				x=event.offsetX;
				y=event.offsetY;
			}
		}
		return  {
			x:x,
			y:y
		}
	}

	function ConvertFloat(value,digit){
		var e = parseFloat(value);
		if(isNaN(e)){
			e = 0;
		}
		if(digit){
			e=Math.round(e*Math.pow(10,digit))/Math.pow(10,digit);
		}
		return e;
	}

	function _mousemove(event) {
		event.preventDefault();
		var chart = $(this).data("chart");
		event = getEventPosition(event);
		if (chart.grid.ContainsXY(event.x, event.y)) {
			if (chart.dragging){
				_gridDragging(chart, event);
			} else if (chart.draggingAThr) {
				var valueY = chart.getValueByY(event.y);
				chart.options.asThrValue = valueY;
				chart._drawASThreshold(false);
			} else {
				var valueY = chart.getValueByY(event.y);
				if (chart.options.showASThreshold && Math.abs(chart.options.asThrValue - valueY) < 3 / chart.heightRatio){
					chart._drawASThreshold(false);
					chart.container.css({
						cursor: "pointer"
					});
					chart.context2DInfo.clearRect(chart.grid.left, chart.grid.top, chart.grid.width, chart.grid.height);
				} else {
					chart.container.css({
						cursor: ""
					});
					chart.context2DASThr.clearRect(chart.grid.left + 11, chart.grid.top, chart.grid.width, chart.grid.height);
					_gridShowInfo(chart, event);
				}
			}
			if("function" == typeof chart.options.event.onmousemove){
				chart.options.event.onmousemove(event);
			}
		} else {
			_clear(chart, event)
		}
	}

	function _mousedown(event) {
		event.preventDefault()
		if (event.which == 1) {
			var _chart = $(this).data("chart");
			event = getEventPosition(event);
			if (_chart.grid.ContainsXY(event.x, event.y)) {
				var yvalue = _chart.getValueByY(event.y);
				if(_chart.options.showASThreshold && Math.abs(_chart.options.asThrValue - yvalue) < 3 / _chart.heightRatio){
					_chart.draggingAThr = false;
				 } else {
					_chart.dragging = false,
					_chart.grid.event = $.extend(_chart.grid.event || {}, {
						startX: event.x,
						startY: event.y
					})
				 }
				if("function" == typeof _chart.options.event.onmousedown){
					_chart.options.event.onmousedown(event);
				}
			}
		}
	}
	function _mouseup(event) {
		event.preventDefault();
		var chart = $(this).data("chart");
		event= getEventPosition(event);
		if(chart.grid.ContainsXY(event.x, event.y)){
			if(chart.dragging){
				_girdDragEnd(chart, event);
			}
			if(chart.draggingAThr){
				chart.draggingAThr = false;
				if("function" == typeof chart.options.event.ondrawasthrchanged){
					chart.options.event.ondrawasthrchanged(chart.options.asThrValue);
				} 
			} 
				
			if("function" == typeof chart.options.event.onmouseup){
				chart.options.event.onmouseup(event);
			}
		}
	}
	function _dblclick(event) {
		if ("CANVAS" != event.target.tagName) return false;
		event.stopPropagation();
		event.preventDefault();
		var chart = $(this).data("chart");
		event = getEventPosition(event);
		if (chart.grid.ContainsXY(event.x, event.y)) {
			var valueY = chart.getValueByY(event.y);
			if (chart.options.showASThreshold && Math.abs(chart.options.asThrValue - valueY) < 3 / chart.heightRatio) {
				var model = $(document).find("#modalSetAsThr" + chart.canvasElm.id);
				if(model.length ==0){
					model = $(
					'<div class="modal modal-custom" role="dialog" aria-labelledby="gridSystemModalLabel">'+
						'<div class="modal-dialog modal-sm" role="document">'+
							'<div class="modal-content">'+
								'<div class="modal-header"> '+
									'<button type="button" class="close" data-dismiss="modal" aria-label="Close">'+
									'<span aria-hidden="true">&times;</span></button> '+
									'<h4 class="modal-title" id="gridSystemModalLabel">设置异常信号门限</h4> '+
								'</div>'+
								'<div class="modal-body">'+
									'<div class="form-group form-inline">'+
										'<label class="control-label">异常信号门限：</label>'+
										'<div class="input-group">'+
										'<input type="text" class="form-control input-custom double minus asThrValue" max="120" min="-40" maxlength="6" >'+
										'<span class="input-custom-addon">dbμv</span>'+
										'</div>'+
									'</div>'+
								'</div>'+
								'<div class="modal-footer">'+
									'<button type="button" class="btn btn-warning btn-sm" data-dismiss="modal">'+
									'<i class="">&nbsp;</i>取消</button>'+
									'<button type="button" class="btn btn-primary btn-sm btnSetAsThrValue" ><i class="fa fa-save">&nbsp;</i>确定</button>'+
								'</div>'+
							'</div>'+
						'</div>'+
					'</div>'
					);
					model.attr("id", "modalSetAsThr" + chart.canvasElm.id);
					model.find(".btnSetAsThrValue").click(function () {
						chart.options.asThrValue = ConvertFloat(model.find(".asThrValue").val(), 2);
						if(chart.options.asThrValue > chart.options.yAxis.max){
							chart.options.asThrValue = chart.options.yAxis.max;
						}
						if(chart.options.asThrValue < chart.options.yAxis.min){
							chart.options.asThrValue = chart.options.yAxis.min;
						}					
						chart._drawASThreshold(false);
						if("function" == typeof chart.options.event.ondrawasthrchanged){
							chart.options.event.ondrawasthrchanged(chart.options.asThrValue);
						}
						model.modal("hide");
					});
					$("body").append(model);
					if("function" == typeof initParamEvent){
						initParamEvent();
					}
				} 
				model.find(".asThrValue").val(ConvertFloat(chart.options.asThrValue, 2));
				model.modal("show");
			}
			chart.dragging = false;
			if (!chart.gridZoomDisable) {
				var n = chart.getOption();
				n.xAxis = chart.originOptions.xAxis.map(function (xAxis) {
					return 2 == chart.options.xAxisType ? xAxis : $.extend({}, xAxis);
				});
				n.dataItemRange = [];
				chart.draw(false);
				_gridZoomComplate(chart);
			}
			if("function" == typeof chart.options.event.ondblclick){
				chart.options.event.ondblclick(event);
			}
		} else if (chart.Colorlegend.ContainsXY(event.x, event.y)) {
			var model = $(document).find("#modal" + chart.canvasElm.id);
			if(model.length == 0){
				model = $(
					'<div  class="modal modal-custom" role="dialog" aria-labelledby="gridSystemModalLabel">'+
					'	<div class="modal-dialog modal-sm" role="document">'+
					'		<div class="modal-content">'+
					'			<div class="modal-header">'+
					'				<button type="button" class="close" data-dismiss="modal" aria-label="Close">'+
					'				<span aria-hidden="true">&times;</span>'+
					'				</button>'+
					'				<h4 class="modal-title" id="gridSystemModalLabel">设置坐标上下限</h4>'+
					'			</div>'+
					'			<div class="modal-body">'+
					'				<div class="form-group form-inline">'+
					'					<label class="control-label">坐标上限值：</label>'+
					'					<div class="input-group">'+
					'						<input type="text" class="form-control input-custom int minus yAxisUp" maxlength="3" max="120" >'+
					'						<span class="input-custom-addon">dbμv</span>'+
					'					</div>'+
					'				</div>'+
					'				<div class="form-group form-inline">'+
					'					<label class="control-label">坐标下限值：</label>'+
					'					<div class="input-group">'+
					'						<input type="text" class="form-control input-custom int minus yAxisDown" maxlength="3" min="-40"  >'+
					'						<span class="input-custom-addon">dbμv</span>'+
					'					</div>'+
					'				</div>'+
					'			</div>'+
					'			<div class="modal-footer">'+
					'				<button type="button" class="btn btn-warning btn-sm" data-dismiss="modal">'+
					'					<i class="">&nbsp;</i>取消'+
					'				</button>'+
					'				<button type="button" class="btn btn-primary btn-sm btnSetYAxisUpdown" >'+
					'					<i class="fa fa-save">&nbsp;</i>确定'+
					'				</button>'+
					'			</div>'+
					'		</div>'+
					'	</div>'+
					'</div>'
				);
			}
			model.attr("id", "modal" + chart.canvasElm.id);
			model.find(".btnSetYAxisUpdown").click(function () {
				chart.options.yAxis.max = ConvertFloat(model.find(".yAxisUp").val(), 2);
				chart.options.yAxis.min = ConvertFloat(model.find(".yAxisDown").val(), 2);
				if(chart.options.yAxis.min > chart.options.yAxis.max){
					alert("坐标下限值必须小于上限值")
				} else {
					chart.draw(true);
					model.modal("hide");
					if("function" == typeof chart.options.event.onyaxischanged){
						chart.options.event.onyaxischanged(chart.options);
					}
				}
			});
			model.find(".yAxisUp").val(chart.options.yAxis.max);
			model.find(".yAxisDown").val(chart.options.yAxis.min);
			$("body").append(model);
			if("function" == typeof initParamEvent){
					initParamEvent();
			}
			model.modal("show");
		}
	}

	function _click(event) {
		var chart = $(this).data("chart");
		event = getEventPosition(event);
		if(chart.grid.ContainsXY(event.x, event.y) && "function" == typeof chart.options.event.onclick){
			chart.options.event.onclick(event);
		}
	}

	function _mouseout(event) {
		var chart = $(this).data("chart");
		_clear(chart);
		if("function" == typeof chart.options.event.onmouseout){
			chart.options.event.onmouseout(event);
		}
	}
	function _clear(chart, i) {
		chart.dragging = false;
		chart.grid.event = {};
		chart.context2DInfo.clearRect(0, 0, chart.canvasElmInfo.width, chart.canvasElmInfo.height);
		chart.draggingAThr = false;
		chart.container.css({
			cursor: ""
		});
		chart.context2DASThr.clearRect(chart.grid.left + 11, 0, chart.canvasElmInfo.width, chart.canvasElmInfo.height);
	}
	function _girdDragEnd(chart, event) {
		chart.dragging = false;
		chart.context2DInfo.clearRect(0, 0, chart.canvasElmInfo.width, chart.canvasElmInfo.height);
		$.extend(chart.grid.event, {
			endX: event.x,
			endY: event.y
		});
		if (Math.abs(chart.grid.event.endX - chart.grid.event.startX) >= 20) {
			var startX = chart.getDataItemByX(chart.grid.event.startX, false); // e
			var endX = chart.getDataItemByX(chart.grid.event.endX, false); //a
			if (startX && startX) {
				if (startX.index > startX.index) {
					var n = $.extend({}, startX);
					startX = $.extend({}, endX);
					endX = n;
				}
				var startXindex = startX.index; //r
				var endXindex = endX.index;         //0
				if (startXindex && endXindex) {
					var _option = chart.getOption();
					if (_option.data.slice(startXindex, endXindex).length >=3) {
						_option.dataItemRange = [startXindex, endXindex];
						chart.itemWidth = chart.grid.width / chart.data.slice(startXindex, endXindex).length;
						if (chart.options.xAxisType != 2) {
							var h = [];
							for (var l = 0; l < _option.xAxis.length; l++){
								if(_option.xAxis[l].endindex >= startX.index && _option.xAxis[l].startindex <= endX.index){
									h.push($.extend({}, _option.xAxis[l]));
								}
							}
							if(h.length > 0){
								h[0].startfreq = startX.name;
								h[0].startindex = startX.index;
								h[0].points = parseInt((h[0].endfreq - h[0].startfreq) / h[0].step + 1);
								h[h.length - 1].endfreq = endX.name;
								h[h.length - 1].endindex = endX.index;
								h[h.length - 1].points = parseInt((h[h.length - 1].endfreq - h[h.length - 1].startfreq) / h[h.length - 1].step + 1);
							}
							_option.xAxis = h;
						}
						chart.draw(false);
						_gridZoomComplate(chart);
					}
				}
			}
		}
	}
	function _gridDragging(chart, event) {
		$.extend(chart.grid.event, {
			endX: event.x,
			endY: event.y
		})
		if (Math.abs(chart.grid.event.endX - chart.grid.event.startX) >=5 ){
			with (chart.context2DInfo){
				save();
				clearRect(0, 0, chart.canvasElmInfo.width, chart.canvasElmInfo.height);
				beginPath();
				translate(0.5, 0.5);
				lineWidth = 1;
				rect(chart.grid.event.startX, chart.grid.event.startY, chart.grid.event.endX - chart.grid.event.startX, chart.grid.event.endY - chart.grid.event.startY);
				stroke();
				restore();
			}
		}
	}
	function _gridShowInfo(chart, event) {
		if ("undefined" == typeof chart.showInfo || chart.showInfo) {
			var dataItem = chart.getDataItemByX(event.x);
			with (chart.context2DInfo) {
				clearRect(chart.grid.left, chart.grid.top, chart.grid.width, chart.grid.height);
				strokeStyle = chart.options.style.lineColor || "#00fbfe";
				fillStyle = chart.options.style.textColor || "#000";
				save();
				beginPath();
				translate(0.5, 0.5);
				lineWidth = 1;
				moveTo(event.x, chart.grid.top);
				lineTo(event.x, chart.grid.top + chart.grid.height);
				moveTo(chart.grid.left, event.y);
				lineTo(chart.grid.left + chart.grid.width, event.y);
				textAlign = "left";
				var textX = event.x + 5;
				if( event.x - chart.grid.left > 4 * chart.grid.width / 5){
					textAlign = "right";
					textX = event.x - 5;
				} 
				if(dataItem){
					fillText(dataItem.name + "MHz", textX, chart.grid.top + 10);
					fillText(ConvertFloat(dataItem.value, 3) + (decodeURIComponent(dataItem.unit || "") || "dbμv"), textX, chart.grid.top + 25);
					if(chart.options.showOccupancy){
						fillText((dataItem.occValue || 0) + "%", textX, chart.grid.top + 40);
					}
				}
				stroke();
				restore();
			}
		}
	}
	function _gridZoomComplate(t) {
		if("function" == typeof t.options.event.onZoomChanged){
			t.options.event.onZoomChanged(t.options);
		}
	}	
})(jQuery)