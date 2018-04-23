var sortTable = sortTable || function () {
    };
//table排序处理
sortTable.sort = function (tableHeadTrList, tableContent) {
    tableHeadTrList.each(function () {
        var th = $(this), thIndex = th.index(), inverse = false;
        th.click(function () {
            tableHeadTrList.find('i').remove();

            tableContent.find('td').filter(function () {
                return $(this).index() === thIndex;

            }).sortElements(function (a, b) {
                var aValue = $.text([a]);
                var bValue = $.text([b]);
                if ($(a).hasClass('number')) {
                    aValue = parseFloat(aValue);
                    bValue = parseFloat(bValue);
                }
                return aValue > bValue ?
                    inverse ? -1 : 1
                    : inverse ? 1 : -1;
            }, function () {
                return this.parentNode;
            });
            inverse = !inverse;
            //升序
            if (inverse) {
                $('<i class="fa fa-caret-up pull-right"></i>').appendTo(th);
            }//降序
            else {
                $('<i class="fa fa-caret-down pull-right"></i>').appendTo(th);
            }
        });
    });
};
$(function () {
    if (!$.nicescroll) return;
    var $tableBody = $('.table-body table');
    var $tableHead = $('.table-head table tr th:not(:first)');
    $('.table-body').niceScroll({cursorwidth: "12px"});//添加列表滚动条
    if ($tableBody.hasClass('not-sort')) return;
    sortTable.sort($tableHead, $tableBody);
});
