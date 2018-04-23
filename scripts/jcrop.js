/**
 * Created by Administrator on 2016/7/22.
 */
$(function () {
    var $mainContainer = $('#mainContainer').parent();
//截图
    $('.btn-capture').click(function (event) {
        event.preventDefault();
        var $Jcrop;
        $mainContainer.Jcrop({
            onChange: function (c) {
                //改变按钮位置
                $('.cap_btn_conbg').css({left: c.x2 - 177, top: c.y2 + 3});
                //  debugger;
                //显示裁剪尺寸
                var $capSelectbound = $('.cap_Select_bound');
                if ($capSelectbound.length == 0) {
                    $('<div class="cap_Select_bound"></div>').appendTo($mainContainer);
                }
                $capSelectbound.css({left: c.x, top: c.y - 20}).text(c.w + "X" + c.h);
            },
            onSelect: showCapbtns,
            onRelease: destroySelect

        }, function () {
            $Jcrop = this;

        });

        var CropSelectBound = {};
        //显示操作按钮
        function showCapbtns(c) {
            CropSelectBound = $.extend({}, c); //选择区域范围
            var $capbtnconbg = $('.cap_btn_conbg'); //按钮组
            if ($capbtnconbg.length == 0) {
                $capbtnconbg = $('<div class="cap_btn_conbg"></div>').appendTo($mainContainer);

                $('<span class="cap_btn_cancel"></span>').appendTo($capbtnconbg).click(function () {
                    $Jcrop.release();
                });
                $('<span class="cap_btn_show"></span>').appendTo($capbtnconbg).click(function () {
                    CropMapImage(CropSelectBound, function (data) {
                        window.open('../file/open?filename='+data.filename);

                        destroySelect();
                    });
                });
                $('<span class="cap_btn_save"></span>').appendTo($capbtnconbg).click(function () {
                    CropMapImage(CropSelectBound, function (data) {
                        var $ifDownload = $('#ifDownload');
                        if ($ifDownload.length == 0) {
                            $ifDownload = $('<iframe  id="ifDownload" style="display:none;"></iframe>').appendTo($('body'));
                        }
                        $ifDownload.attr('src', '../file/download?filename='+encodeURIComponent("截图.png")+'&filepath=' + data.filename);

                        destroySelect();
                    });
                });
            } else {
                $capbtnconbg.show();
            }

            $capbtnconbg.css({left: c.x2 - 177, top: c.y2 + 3});
        }

        //清除裁剪区域
        function destroySelect() {
            $('.cap_btn_conbg').remove();
            $('.cap_Select_bound').remove();
            $mainContainer.insertAfter($('.jcrop-holder'));
            $('.jcrop-holder').remove();
            $mainContainer.removeData('Jcrop');
        }

        //截图操作
        function CropMapImage(bound, callback) {
            //html转canvas ，然后通过canvas 转化成图片
            html2canvas($mainContainer, {
                allowTaint: true,
                taintTest: false,
                onrendered: function (canvas) {
                    var imageData = canvas.toDataURL("image/png");
                    var newImg = document.createElement("img");

                    newImg.src = imageData;
                    //  document.body.appendChild(newImg);
                    crop_canvas = document.createElement('canvas');
                    crop_canvas.width = bound.w;
                    crop_canvas.height = bound.h;

                    crop_canvas.getContext('2d').drawImage(newImg, bound.x, bound.y, bound.w, bound.h, 0, 0, bound.w, bound.h);

                    imageData = crop_canvas.toDataURL();
                    //删除字符串前的提示信息 "data:image/png;base64,"
                    $.post('../file/writeImageFromBase64', {imageData:imageData}, function (data) {
                        //回调
                        if (typeof (callback) === 'function') {
                            callback(data);
                        }
                    });

                }
            })
        }

    });
});