window.console = window.console || (function () {
        var c = {};
        c.log = c.warn = c.debug = c.info = c.error = c.time = c.dir = c.profile = c.clear = c.exception = c.trace = c.assert = function () {
        };
        return c;
    })();
/*
 * 自定义tab选项卡
 * */
$(function () {
    $('.nav-custom-tabs>button').click(function () {
        $(this).closest('.nav-custom').find('.btn-custom').removeClass('active');
        $(this).addClass('active');
        var id = $(this).attr('href');
        $(this).closest('.nav-custom').next('.tab-custom-content').find('.tab-custom-panel').hide();
        $(id).show();

        $(this).closest('.nav-custom').next('.tab-custom-content').find('.tab-custom-panel>.tree-container').getNiceScroll().hide();
        $(id).children('.tree-container').getNiceScroll().show().resize();
    });
    /*初始化日期控件*/
    if(typeof $.fn.datetimepicker !== 'undefined') {
        $('.datetime-text').datetimepicker({
            format: $(this).attr("dateformat") || 'yyyy-mm-dd',
            autoclose: true,
            language: "zh-CN",
            forceParse: false,
            startView: 2,
            minView: 2
        });
    }
});

/**
 * 获取监测功能类型
 * */
function getFuncPage(funcno) {
    var page = {};
    switch (funcno) {
        case '10':
            page = {title: '单频测量', id: 'sglfreq', funcno: '10'};
            break;
        case '11':
            page = {title: '中频分析', id: 'ifanalysis', funcno: '11'};
            break;
        case '12':
            page = {title: '单频测向', id: 'df', funcno: '12'};
            break;
        case '13':
            page = {title: '中频测向', id: 'ifdf', funcno: '13'};
            break;
        case '14':
            page = {title: '离散扫描', id: 'mscan', funcno: '14'};
            break;
        case '15':
            page = {title: '频段扫描', id: 'fscan', funcno: '15'};
            break;
        case '16':
            page = {title: '数字扫描', id: 'dscan', funcno: '16'};
            break;
    }
    return page;
}

function getIframeWindow(id) {
    if (!window) {
        return null;
    }
    var contentWindow;
    var contentFrame = window.frames[id] || document.getElementById(id);
    if (contentFrame) {
        try {
            contentWindow = contentFrame.contentWindow || contentFrame;
        } catch (e) {
            contentWindow = contentFrame;
        }
    }

    return contentWindow;
}
function ConvertFloat(val, pos) {
    var f = parseFloat(val);
    f = isNaN(f) ? 0 : f;
    if (pos) {
        f = Math.round(f * Math.pow(10, pos)) / Math.pow(10, pos);
    }
    return f;
}
function getEventPosition(ev) {
    var x, y;
    if (ev.layerX || ev.layerX == 0) {
        x = ev.layerX;
        y = ev.layerY;
    } else if (ev.offsetX || ev.offsetX == 0) { // Opera
        x = ev.offsetX;
        y = ev.offsetY;
    }
    return {x: x, y: y};
}


//从服务器端获取json格式的数据(若指定msg参数则自动显示等待消息，否则不显示等待消息)
function getJsonData2(url, params, callback, msg) {
    if (msg) showWait(msg);
    return $.ajax({
        url: fixUrl(url),
        type: 'get',
        dataType: 'json',
        data: serializeParams(params),
        complete: function () {
            if (msg) hideWait();
        },
        error: function (jqXHR, textStatus, errorThrown) {
            logAjaxErr(jqXHR, textStatus, errorThrown);
        },
        success: function (data) {
            if (callback) {
                callback(data);
            }
        }
    });
}
//从服务器端获取json格式的数据(若指定msg参数则自动显示等待消息，否则不显示等待消息)
function getJsonDatasync2(url, params, callback, msg) {
    if (msg) showWait(msg);
    return $.ajax({
        url: fixUrl(url),
        type: 'get',
        dataType: 'json',
        data: serializeParams(params),
        async: false,
        complete: function () {
            if (msg) hideWait();
        },
        error: function (jqXHR, textStatus, errorThrown) {
            logAjaxErr(jqXHR, textStatus, errorThrown);
        },
        success: function (data) {
            if (callback) {
                callback(data);
            }
        }
    });
}
function fixUrl(url) {
    //若url以“http://”或者“https://”或者“/”开头，则表明是绝对路径，无需处理
    if (/^http:\/\//.test(url) || /^https:\/\//.test(url) || /^\//.test(url)) return url;

    //若以～开头，则表示是相对于应用程序目录的相对路径
    if ($.appServerVariables && /^~/.test(url)) return url.replace(/^~\//, $.appServerVariables.appPath);

    //否则被视作相对于当前页面的路径
    var i = location.pathname.lastIndexOf("/");
    var curPath = location.pathname.substring(0, i + 1);
    return curPath + url;
}
function serializeParams(params) {
    var newParams = {};

    if (params) {
        $.each(params, function (key, val) {
            var typeStr = $.type(val);
            if (typeStr === "array" || typeStr === "object") {
                newParams[key] = JSON.stringify(val); //序列化复杂对象
            } else {
                newParams[key] = val;
            }
        });
    }

    return newParams;
}
function logAjaxErr(jqXHR, textStatus, errorThrown) {
    if (jqXHR.status === '401') {
        $(document).trigger('accessdenied')
    }

    var errMsg = "web请求失败！\rhttp code:" + jqXHR.status + '\r' + jqXHR.responseText;
    xhr = null;
    if (typeof (console) != 'undefined' && console) console.log(errMsg);
}

String.prototype.format = function (args) {
    var result = this;
    if (arguments.length > 0) {
        if (arguments.length == 1 && typeof (args) == "object") {
            for (var key in args) {
                if (args[key] != undefined) {
                    var reg = new RegExp("({" + key + "})", "g");
                    result = result.replace(reg, args[key]);
                }
            }
        }
        else {
            for (var i = 0; i < arguments.length; i++) {
                if (arguments[i] != undefined) {
                    //var reg = new RegExp("({[" + i + "]})", "g");//这个在索引大于9时会有问题，谢谢何以笙箫的指出

                    var reg = new RegExp("({)" + i + "(})", "g");
                    result = result.replace(reg, arguments[i]);
                }
            }
        }
    }
    return result;
};
function isJson(obj) {
    return typeof(obj) == "object" && Object.prototype.toString.call(obj).toLowerCase() == "[object object]" && !obj.length;
}

function setLocalStorage(key, value) {
    var storage = window.localStorage;
    if (storage.getItem(key)) storage.removeItem(key);
    storage.setItem(key, value);
}
function getLocalStorage(key) {
    return window.localStorage.getItem(key)
}
/*
 * 下载文件
 * */
function downfile(url) {
    var $ifDownload = $('#ifDownload');
    if ($ifDownload.length == 0) {
        $ifDownload = $('<iframe  id="ifDownload" style="display:none;"></iframe>').appendTo($('body'));
    }
    if (!!window.ActiveXObject || "ActiveXObject" in window) { //IE
        window.open(url);
    } else {
        $ifDownload.attr('src', url);
    }
}

/*
 *显示提示信息
 * tipmsg 提示信息
 * type 显示的类型(success,error)
 * time 显示时间（秒）
 * */
function popTips(tipmsg, type, time) {
    type = type || 'info';
    time = time || 2;
    var winWidth = document.documentElement.clientWidth;
    var $tipDiv = $('body').find('div.tip-message');
    if ($tipDiv.length != 0) {//不存在
        $tipDiv.remove();
    }
    var imageStyle = type == "info" && 'fa-info-circle' || type == "success" && 'fa-check-circle' || type == "error" && 'fa-times-circle' || type == "warning" && 'fa-warning';
    var div = '<div class="tip-message ' + type + '"><i class="fa  ' + imageStyle + '"></i>' + tipmsg + '</div>';
    $('body').append(div);

    $('div.tip-message').css({
        'top': 150 + 'px',
        'left': (winWidth / 2) - (tipmsg.length * 13 / 2) + 'px'
    }).show();
    setTimeout(function () {
        $('div.tip-message').fadeOut(1000);
    }, time * 1000);
}
/*
 * 计算两个日期时间之差
 * bDate 开始时间
 * eDate 结束时间 格式为YYYY-MM-DD HH:mm:ss 字符串
 * totalTime 返回的格式为 0天0小时0分0秒 */
function countTimeLong(bDate, eDate) {
    var dateVal =this.timeDiff(bDate,eDate);
    //计算出相差天数
    var days = Math.floor(dateVal / (24 * 3600 * 1000)) + '天';
    //计算出小时数
    var leave1 = dateVal % (24 * 3600 * 1000);    //计算天数后剩余的毫秒数
    var hours = Math.floor(leave1 / (3600 * 1000)) + '小时';
    //计算相差分钟数
    var leave2 = leave1 % (3600 * 1000);        //计算小时数后剩余的毫秒数
    var minutes = Math.floor(leave2 / (60 * 1000)) + '分 ';
    //计算相差秒数
    var leave3 = leave2 % (60 * 1000);      //计算分钟数后剩余的毫秒数
    var seconds = Math.round(leave3 / 1000) + '秒';
    var totalTime = days + ' ' + hours + ' ' + minutes + ' ' + seconds;

    return totalTime;
}
/*
 **计算两个日期时间相差多少秒
 * */
function timeDiff(bDate, eDate) {
    var dateVal = new Date(Date.parse(eDate.replace(/-/g, "/"))).getTime() - new Date(Date.parse(bDate.replace(/-/g, "/"))).getTime();
    return dateVal;
}

/*
 *获取长整型的时间，将常规时间字符串转换为长整型数字
 * */
function convertToLongDate(dateStr) {
    return (new Date(Date.parse(dateStr.replace(/-/g, "/"))).getTime() - new Date('1601/01/01 08:00:00').getTime()) * 10000;
}
/*
 *获取时间字符串，将长整型数字转换成字符串的时间格式
 * */
function longDateConvertDateStr(longDate,format) {
    format = format || 'YYYY-MM-DD HH:mm:ss';
    return new moment((parseInt(longDate) - 116444736000000000) / 10000 - 28800000).format(format);
}

/*获取设备状态名称*/
function getDevStatus(status) {
    var statusName = '未知';
    switch (status) {
        case '0':
            statusName = '可用';
            break;
        case '1':
            statusName = '忙碌';
            break;
        case '2':
            statusName = '故障';
            break;
        case '3':
            statusName = '未知';
            break;
        case '4':
            statusName = '可用有任务运行';
            break;
    }
    return statusName;
}