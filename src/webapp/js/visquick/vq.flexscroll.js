

//intialize with var data ={DATATYPE : "vq.models.FlexScrollData", CONTENTS : "test"};
// notifier = function(x,dx) where x = position within scroll bar range,  dx = total length of window in scale of scroll bar

//draw with draw (data ={DATATYPE : "vq.models.FlexScrollData", CONTENTS : "test"}
//				and options = {plotHeight: xx, plotWidth : xx, vertical_padding: xx,
//				horizontal_padding : xx , max_position: xx, min_position: xx,
//				maxRange: xx, minRange: xx, dblclick_notifier : function(x,dx),
//				fixed_window_width: xx, scale_multiplier : xx, interval : xx, font : "fontname"}
//note dblclick_notifer is the last listed option.  This can be used to create a "zoom" effect by re-instanstiating the scroll bar with new parameters.


vq.FlexScroll = function(){
    vq.Vis.call(this);

    //set option variables to useful values before options are set.
    this.height(40);     // defaults
    this.width(600);     // defaults
    this.vertical_padding(10);
    this.horizontal_padding(10);
    this.max_position(100);
    this.min_position(0);
    this.interval(5);
    this.scale_multiplier(1);
    this.fixed_window_width(-1);
    this.callback_always(false);

};

vq.FlexScroll.prototype = pv.extend(vq.Vis);
vq.FlexScroll.prototype
        .property('max_position',Number)
        .property('min_position',Number)
        .property('interval', Number)
        .property('scale_multiplier',Number)
        .property('callback_always', Boolean)
        .property('fixed_window_width',Number);


vq.FlexScroll.prototype._setOptionDefaults = function(options) {

    if (options.max_position != null) { this.max_position(options.max_position); }

    if (options.min_position != null) { this.min_position(options.min_position); }

    if (options.plotHeight != null) { this.height(options.plotHeight); }

    if (options.plotWidth != null) { this.width(options.plotWidth); }

    if (options.vertical_padding != null) { this.vertical_padding(options.vertical_padding); }

    if (options.horizontal_padding != null) { this.horizontal_padding(options.horizontal_padding); }

    if (options.interval != null) { this.interval(options.interval); }

    if (options.callback_always != null) this.callback_always = options.callbackAlways;

    if (options.scale_multiplier != null) { this.scale_multiplier(options.scale_multiplier); }

    if (options.fixed_window_width != null) {this.fixed_window_width(options.fixed_window_width); }

    if (options.container) { this.container(options.container); }
    if (options.notifier) { this.notifier= options.notifier; }
    if (options.dblclick_notifier) { this.dblclick_notifier = options.dblclick_notifier; }

};

vq.FlexScroll.prototype.set_position = function(x_var,dx_var) {
    this.window = {x: this.xScale(x_var), dx : this.xScale(dx_var)};
    this.render();
};


vq.FlexScroll.prototype.draw = function(data) {
    var data_obj = new vq.models.FlexScrollData(data);
    if(data_obj.isDataReady()) {
        this._setOptionDefaults(data_obj);
        this.data = data_obj;
        this.render();
    }
};

vq.FlexScroll.prototype.render = function() {
    var that = this;

    var w = this.width(),
            h2 = this.height(),
            scrollWidth = this.width() - (2 * this.horizontal_padding()) ,
            focusMap = pv.Scale.linear(0, w).range(this.min_position(),this.max_position()),
            x=pv.Scale.linear(this.min_position(), this.max_position()).range(0, scrollWidth),
            isWindowWidthFixed = (this.fixed_window_width() > 0),
            windowWidth = (isWindowWidthFixed) ? this.fixed_window_width() : this.interval(),
            maxX = this.max_position(),
            minX = this.min_position(),
            halfX = (maxX - minX) / 2,
            formatter = pv.Format.number(),
            scale_multiplier = this.scale_multiplier(),
            scaleX = 2 * halfX / scrollWidth;

    if (this.window == undefined){
        this.window = {x:x(this.min_position()), dx:x(this.min_position() + windowWidth) - x(this.min_position()) };

    }
    this.xScale = x;

    var notify_dblclick = function(d) {
        var window = translateAndScale(d);
        that.dblclick_notifier(window.x, window.dx);
    };

    var zoom = function() {
        var t = this.transform().invert();
        var halfX = (maxX - minX) / 2,
                centerX = maxX - halfX,
                scaleX = 2 * halfX / (scrollWidth);
        var start = t.x * scaleX - (halfX) + centerX,
                end = centerX + (scrollWidth * t.k + t.x) * scaleX - halfX;
        x.domain(start, end).nice();
        focusMap.range(start, end);
        that.notifier(i.x * scaleX + centerX - halfX, (i.dx) * scaleX);
        vis.render();
    };

    var translateFocus = function(d) {
        var endX = pv.min( [ pv.max(x.domain()), maxX ] );
        var startX = pv.max( [ pv.min(x.domain()), minX] );
        var halfX = (endX - startX) / 2;
        var scaleX = 2 * halfX / scrollWidth;
        return { x: Math.round((d.x *scaleX + startX))  , dx : (isWindowWidthFixed) ? Math.round(windowWidth * scaleX) : Math.round((d.dx * scaleX))   };
    };

    var translateAndScale = function(d) {
        var translated = translateFocus(d);
        return {x : translated.x * scale_multiplier, dx : translated.dx * scale_multiplier };
    };

    var dragStart = function(d) {
        this.parent.active(true) ;
        this.fillStyle("steelblue");
        if (that.callbackAlways) { dispatchEvent(d);}
        vis.render();
    };

    var dragEnd = function(d) {
//	this.parent.active(false) ;
        this.fillStyle(undefined);
        dispatchEvent(d);
        vis.render();
    };

    var selectStart = function(d) {
        this.parent.active(true) ;
        if (that.callbackAlways) { dispatchEvent(d);}
        vis.render();
    };

    var selectEnd = function(d) {
//	this.parent.active(false) ;
        dispatchEvent(d);
        vis.render();
    };

    var isActive = function(active) {
        return active;
    };

    var dispatchEvent = function(d) {
//if we're at the same place as last time, do nothing
        var window = translateAndScale(d);
        that.notifier(window.x ,window.dx );
    };

    var vis = new pv.Panel()
            .width(w)
            .height(h2)
            .strokeStyle("#aaa")
            .canvas(that.container());

    var	scroll = vis.add(pv.Panel)
            .left(this.horizontal_padding())
            .width(scrollWidth )
            .top(this.vertical_padding())
            .bottom(12)
            .events("all")
            .event("mousemove",pv.Behavior.point(Infinity).collapse("y"))
            .def ("active", false);

    var panel = scroll.add(pv.Panel)
            .data([that.window])
            .fillStyle("white")
            .events("all")
            .cursor("crosshair");
    var bar = scroll.add(pv.Bar)
            .data([that.window])
            .left(function(d) {return d.x;})
            .width(function(d) {return isWindowWidthFixed ==  true ? x(windowWidth) : d.dx;})
            .def ("fillStyle", 'rgba(255, 128, 128, .4)')
            .cursor("move")
            .events("painted")
            .event("mousedown", pv.Behavior.drag())
            .event("drag", function(d) { if(that.callbackAlways) {dispatchEvent(d);}vis.render();})
            .event("dragstart",dragStart )
            .event("dragend", dragEnd )
            .event("point", function() { this.parent.active(true); return vis.render(); } )
            .event("unpoint", function() { this.parent.active(false); return vis.render(); } )
            .event("dblclick", function(d) { notify_dblclick(d) } );
    panel.add(pv.Label)
            .top(2)
            .left(function(d) { return d.x + (d.dx/2) - 10;} )
            .text(function(d) { return translateFocus(d).dx});

    scroll.add(pv.Rule)
            .data(function() { return x.ticks(); })
            .left(x)
            .strokeStyle("#eee")
            .fillStyle("white")
            .anchor("bottom").add(pv.Label)
            .text( x.tickFormat );

    if(!isWindowWidthFixed) {
        scroll.add(pv.Bar)
                .data([this.window])
                .fillStyle("steelblue")
                .left(function(d) {return d.x+ d.dx;})
                .width(function(d) {return  4;})
                .events("painted")
                .event("mousedown",pv.Behavior.resize("right"))
                .event("resize",function(d) { if(that.callbackAlways) {dispatchEvent(d);}vis.render();})
                .event("resizestart", selectStart)
                .event("resizeend",selectEnd);
        var labels = vis.add(pv.Panel)
                .data([this.window]);
        labels.anchor("left").add(pv.Label)
                .visible(function() { return isActive(scroll.active());  })
                .text(function(d) { return translateFocus({x: d.x , dx: 0}).x; } );
        labels.anchor("right").add(pv.Label)
                .visible(function() { return isActive(scroll.active());  })
                .text(function(d) { return translateFocus({x: d.x+d.dx , dx: 0}).x; } );

        scroll.add(pv.Bar)
                .data([this.window])
                .fillStyle("steelblue")
                .left(function(d) {return d.x-4;})
                .width(function(d) {return  4;})
                .events("painted")
                .event("mousedown",pv.Behavior.resize("left"))
                .event("resize",function(d) { if(that.callbackAlways) {dispatchEvent(d);}vis.render(); })
                .event("resizeend", selectEnd)
                .event("resizestart", selectStart);

    }

    vis.render();

    dispatchEvent(this.window);
};


vq.models.FlexScrollData = function(data) {
    vq.models.VisData.call(this,data);

    this.setDataModel();

            if (this.getDataType() == 'vq.models.FlexScrollData') {
                this._build_data(this.getContents());
            } else {
                console.warn('Unrecognized JSON object.  Expected vq.models.FlexPlotData object.');
            }
        };
vq.models.FlexScrollData.prototype = pv.extend(vq.models.VisData);

vq.models.FlexScrollData.prototype._build_data = function(data) {
        this._processData(data);

        if (this.interval === undefined) {this.interval = (this.max_position - this.min_position) / 20; }

                this.setDataReady(true);
};


vq.models.FlexScrollData.prototype.setDataModel = function () {
    this._dataModel = [
        {label: 'width', id: 'PLOT.width', cast : Number, defaultValue: 600},
        {label: 'height', id: 'PLOT.height', cast : Number, defaultValue: 40},
        {label :'container', id:'PLOT.container', optional : true},
        {label: 'vertical_padding', id: 'PLOT.vertical_padding', cast : Number, defaultValue: 10},
        {label: 'horizontal_padding', id: 'PLOT.horizontal_padding',cast : Number,  defaultValue: 10},
        {label: 'min_position', id: 'PLOT.min_position', cast : Number, defaultValue: 0},
        {label: 'max_position', id: 'PLOT.max_position',cast : Number,  defaultValue: 100},
        {label: 'scale_multiplier', id: 'PLOT.scale_multiplier',cast : Number, defaultValue : 1},
        {label: 'fixed_window_width', id: 'PLOT.fixed_window_width',cast : Number, defaultValue : -1},
        {label: 'interval', id: 'PLOT.interval', cast : Number, optional : true},
        {label: 'notifier', id: 'notifier', defaultValue : function(a){return null;}},
        {label :'callback_always', id:'callback_always', cast : Boolean, defaultValue : true},
        {label: 'dblclick_notifier', id: 'dblclick_notifier', defaultValue : function(a){return null;}}

    ];
};

