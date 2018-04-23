// 通用方法
(function (t) {
    "use strict";
    function i(t) {
        "string" == typeof t ? (t = JSON.parse(t), this._size = t._size || 0, this.datastore = t.datastore || Object.create(null)) : (this._size = 0, this.datastore = Object.create(null))
    }
    i.prototype.toString = function () {
        return JSON.stringify(this)
    },i.prototype.isEmpty = function () {
        return 0 === this._size
    },
    i.prototype.size = function () {
        return this._size
    },
    i.prototype.clear = function () {
        for (var t in this.datastore)
            delete this.datastore[t];
        this._size = 0
    },
    i.prototype.add = function (t, i) {
        this.datastore[t] = i,
        this._size++
    },
    i.prototype.find = function (t) {
        return this.datastore[t]
    },
    i.prototype.count = function () {
        var t = 0;
        for (var i in this.datastore)
            t++;
        return t
    },
    i.prototype.remove = function (t) {
        delete this.datastore[t],
            this._size--
    },
    i.prototype.showAll = function () {
        for (var t in this.datastore)
            console.log(t + "->" + this.datastore[t])
    },
    t.Dictionary = i
})("undefined" != typeof window ? window : null)
   
    
    
    
