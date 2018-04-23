(function($) {
	function ProgressBar(target, options) {
		this.target = target;
		this.bar = $(target)[0];
		this.btn = $(target).find('span')[0];
		this.step = $(target).find("div")[0];
		this.options = $.extend(true, {}, $.fn.progressbar.defaults, options);
		this.barwidth = this.options.barStyle.width;
		this.barVal=this.options.max-this.options.min;
		this.init();
		this.setOptions(this.options);
	}

	ProgressBar.prototype = {
		init: function() {
			var $this = this;
			$this.btn.onmousedown = function(e) {
				e.preventDefault();
				$this.startDrag = true;
				if($this.options.isDrag) {
					var x = (e || window.event).clientX;
					var l = this.offsetLeft;
					var max = $this.bar.offsetWidth;
					var offsetWidth = this.offsetWidth;
					$(document).bind('mousemove', {
						x: x,
						l: l,
						max: max,
						$this: $this
					}, _mousemove);
					$(document).bind('mouseup', {
						$this: $this
					}, _mouseup);
				}
			};

		},
		setVal: function(val,callback) {
			//
			if (this.startDrag) return;
			var now_width = this.getPxByVal(val);
			if (parseInt(now_width.replace('px', '')) >= this.options.barStyle.width) {
				now_width = this.options.barStyle.width + 'px';
			}

			this.step.style.width = now_width;
			this.btn.style.left = now_width;
			if (typeof callback === 'function')
				callback(this);
		},
		getOptions: function() {
			return this.options;
		},
		setOptions: function(options) {
			this.options = $.extend(true, {}, this.options, options);
			//进度条背景样式设置
			this.bar.style.background = this.options.barStyle.background_color;
			this.bar.style.width = this.options.barStyle.width + 'px';
			this.bar.style.height = this.options.barStyle.height + 'px';
			//播放按钮样式设置
			this.btn.style.background = this.options.btnSliderStyle.background_color;
			this.btn.style.width = this.options.btnSliderStyle.width + 'px';
			this.btn.style.height = this.options.barStyle.height * 2 + 'px';
			this.btn.style.top = -(this.options.barStyle.height / 2) + 'px';
			this.btn.style.left = this.options.btnSliderStyle.left + 'px';
			//已经播放过的进度条样式设置
			this.step.style.background = this.options.barSlideredStyle.background_color;
			this.step.style.height = this.bar.style.height;
			this.step.style.width = this.options.barSlideredStyle.width + 'px';
		},
		getValByPx: function(px) {
			var val = parseInt(parseInt(px) * ((this.options.max-this.options.min) /  this.options.barStyle.width));

			return val;
		},
		getPxByVal: function(val) {
			var now_width = parseInt((val-this.options.min) * (this.options.barStyle.width / (this.options.max-this.options.min))) + 'px';
			return now_width;
		},
		getVal: function() {
			var val = this.step.style.width;
			val = this.getValByPx(val);

			return val;
		},
		setIsDrag: function(isDrag) {
			isDrag = isDrag || false;
			this.options.isDrag = isDrag;
		}
	};

	function _mousemove(event) {
		var $this = event.data.$this;
		if($this.startDrag) {
			var max = event.data.max;
			var x = event.data.x;
			var l = event.data.l;

			var thisX = (event || window.event).clientX;
			var to = Math.min(max, Math.max(-2, l + (thisX - x)));
			$this.btn.style.left = Math.max(0, to) + 'px';
			$this.step.style.width = Math.max(0, to) + 'px';
			var val=$this.getValByPx(to);
			$this.btn.setAttribute('title', Math.max(0, val));
			window.getSelection ? window.getSelection().removeAllRanges() : document.selection.empty();
			if(typeof $this.options.sliderDragging === 'function') {
				$this.options.sliderDragging($this.options.min + val);
			}
		}

	};

	function _mouseup(event) {
		var $this = event.data.$this;
		if($this.startDrag) {
			var thisX = (event || window.event).clientX;
			var val = $this.getVal();
			if(typeof $this.options.sliderDragged === 'function') {
				debugger;
				$this.options.sliderDragged($this.options.min + val);
			}
			$this.startDrag = false;
		}
	};

	$.fn.progressbar = function(options) {
		var probar = new ProgressBar(this, options);
		$(this).data('probar',probar);
		return probar;
	};
	$.fn.progressbar.defaults = {
		min:0,
		max:100,
		isDrag: true,
		barStyle: { //进度条的样式
			background_color: '#E4E4E4',
			width: 240, //240px
			height: 10 //10px
		}, //滑动按钮的样式
		btnSliderStyle: {
			width: 9, //9px
			background_color: '#E4E4E4',
			top: -5,
			left: 0
		},
		barSlideredStyle: {
			background_color: '#3BE3FF',
			width: 0
		},
		sliderDragged: function(val) {
			return val;
		},
		sliderDragging: function(val) {
			return val;
		}

	};
})(jQuery);