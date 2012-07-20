

//intialize with var data ={DATATYPE : "vq.models.StemPlotData", CONTENTS : {DATAARRAY : data_array} };
// notifier = function(x,dx) where x = position within scroll bar range,  dx = total length of window in scale of scroll bar

//draw with draw (data ={DATATYPE : "vq.models.StemPlotData", {DATAARRAY : data_array} }
//				and options = {plotHeight: xx, plotWidth : xx, vertical_padding: xx,
//				horizontal_padding : xx , maxPosition: xx, minPosition: xx,
//				maxRange: xx, minRange: xx, dblclick_notifier : function(x,dx),
//				fixedWindowWidth: xx, scaleMultiplier : xx, interval : xx, font : "fontname"}
//note dblclick_notifer is the last listed option.  This can be used to create a "zoom" effect by re-instanstiating the scroll bar with new parameters.


vq.StemPlot = function() {
    vq.Vis.call(this);

        //set option variables to useful values before options are set.
        this.height(500);     // defaults
        this.width(500);     // defaults
        this.vertical_padding(30);
        this.horizontal_padding(30);

    };
    vq.StemPlot.prototype = pv.extend(vq.Vis);

vq.StemPlot.prototype._setOptionDefaults =  function(options) {

    if (options.height != null) { this.height(options.height); }

     if (options.width != null) { this.width(options.width); }

     if (options.container) { this.container(options.container); }

     if (options.vertical_padding != null) { this.vertical_padding(options.vertical_padding); }

     if (options.horizontal_padding != null) { this.horizontal_padding(options.horizontal_padding); }

    };

    vq.StemPlot.prototype.setXRange = function(x,dx){
        this.posX.domain(x, x+dx);
        this.redraw();
};

    vq.StemPlot.prototype.draw = function(data) {

        this._bl_data = new vq.models.StemPlotData(data);
        if (this._bl_data.isDataReady()) {
            this._setOptionDefaults(this._bl_data);
           this.render();
        }
    };

    vq.StemPlot.prototype.render = function() {
        var that = this;
        this._data = this._bl_data._data;
        this.visibleWidth = (this.width() - 2 * this.horizontal_padding());
        this.visibleHeight = (this.height() - this.vertical_padding() * 2);
        this.context_height = 50;
        this.focus_height = this.visibleHeight - this.context_height;
         var x_id = that._bl_data.COLUMNID.x, y_id = that._bl_data.COLUMNID.y;
               this.posX =  pv.Scale.linear().range(0,that.visibleWidth);
                this.posY = pv.Scale.linear().range(0,that.focus_height);
            this.context_posX = pv.Scale.linear(0, pv.max(that._data.map(function(d){
                    return d[x_id];}))).range(0,that.visibleWidth).nice();
            this.context_posY =  pv.Scale.linear(0, pv.max(that._data.map(function(d){
                    return d[y_id];}))).range(0,that.context_height).nice();

        that.window = {x:that.context_posX.range()[0]*.2,dx:(that.context_posX.range()[1] - that.context_posX.range()[0]) *.6};

         var s;
         var x = that._bl_data.COLUMNID.x, y = that._bl_data.COLUMNID.y;


        var dispatchEvent = function(d) {
            notifier(d);
        };

        var vis = new pv.Panel()
                .width(that.width())
                .height(that.height())
                .left(that.horizontal_padding())
                .right(that.horizontal_padding())
                .bottom(that.vertical_padding())
                .top(that.vertical_padding())
                .canvas(that.container());

        var	drawPanel = vis.add(pv.Panel);

        var focus = drawPanel.add(pv.Panel)
                .def("init", function() {
                                var d1 = that.context_posX.invert(that.window.x),
                                        d2 = that.context_posX.invert(that.window.x + that.window.dx),
                                        dd = that._data.slice(Math.max(0, pv.search.index(that._data, d1, function(d) {return d[x];} ) - 1),
                                    pv.search.index(that._data, d2, function(d) { return d[x]; } ) + 1);
                                    that.posX.domain(d1, d2);
                                    that.posY.domain(that.context_posY.domain());
                                    return dd;
                            })
                .top(0)
                .height(that.focus_height);

        var plot = focus.add(pv.Panel)
                .overflow('hidden')

        //        Stem plot
                .add(pv.Bar)
                    .data(function() { return focus.init();})
                    .left(function(t) { return that.posX(t[x]);})
                     .height(function(t){ return that.posY(t[y]);})
                     .bottom(1)
                     .width(.5)                       
                     .strokeStyle("red")
                     .fillStyle("red")
             .anchor("top").add(pv.Label)
                     .fillStyle(null)
                     .visible(function(t) { return t[y] > pv.mean(that.posY.domain()) / 2;})
                     .textBaseline("bottom")
                     .textAlign("right")
                     .textAngle(-Math.PI / 2)
                     .text(function(t){ return parseInt(t[y]);});
        

        var xtick = focus.add(pv.Rule)
                .data(function() { return that.posX.ticks();} )
                .left(that.posX)
                .strokeStyle("#eee");
            xtick.anchor("bottom").add(pv.Label)
                .text(that.posX.tickFormat);


        /* Y-axis ticks. */
        var ytick = focus.add(pv.Rule)
                .data(function() { return that.posY.ticks(7);} )
                .bottom(that.posY)
                .strokeStyle("#aaa")
        /* Left label. */
            .anchor("left").add(pv.Label)
                .text(that.posY.tickFormat);

/* Context panel (zoomed out). */
        var context = drawPanel.add(pv.Panel)
            .bottom(0)
            .height(that.context_height);

/* X-axis ticks. */
        context.add(pv.Rule)
            .data(that.context_posX.ticks())
            .left(that.context_posX)
            .strokeStyle("#eee")
          .anchor("bottom").add(pv.Label)
            .text(that.context_posX.tickFormat);

/* Y-axis ticks. */
        context.add(pv.Rule)
            .bottom(0);

/* Context area chart. */
        context.add(pv.Bar)
            .data(that._data)
            .left(function(d) {return that.context_posX(d[x]);})
            .width(1)
            .bottom(1)
            .height(function(d) { return that.context_posY(d[y]);})
            .fillStyle("blue");
 

/* The selectable, draggable focus region. */
        context.add(pv.Panel)
            .data([that.window])
            .cursor("crosshair")
            .events("all")
            .event("mousedown", pv.Behavior.select())
            .event("select", focus)
          .add(pv.Bar)
            .left(function(d) { return d.x;})
            .width(function(d) {return d.dx;})
            .fillStyle("rgba(255, 128, 128, .4)")
            .cursor("move")
            .event("mousedown", pv.Behavior.drag())
            .event("drag", focus);

        vis.render();

    };


vq.models.StemPlotData = function(data) {
    vq.models.VisData.call(this,data);

    this.setDataModel();

            if (this.getDataType() == 'vq.models.StemPlotData') {
                this._build_data(this.getContents());
            } else {
                console.warn('Unrecognized JSON object.  Expected vq.models.StemPlotData object.');
            }
        };
vq.models.StemPlotData.prototype = pv.extend(vq.models.VisData);

vq.models.StemPlotData.prototype._build_data = function(data) {
        this._processData(data);
        if (this._data.length) {
                this.setDataReady(true);
            }

        };


vq.models.StemPlotData.prototype.setDataModel = function () {
    this._dataModel = [
     {label: 'width', id: 'PLOT.width', cast : Number, defaultValue: 400},
     {label: 'height', id: 'PLOT.height', cast : Number, defaultValue: 400},
     {label : 'container', id:'PLOT.container', optional : true},
     {label: 'vertical_padding', id: 'PLOT.vertical_padding', cast : Number, defaultValue: 0},
     {label: 'horizontal_padding', id: 'PLOT.horizontal_padding',cast : Number,  defaultValue: 0},
        {label: 'COLUMNID.x', id: 'xcolumnid',cast : String, defaultValue : 'x'},
            {label: 'COLUMNID.y', id: 'ycolumnid',cast : String, defaultValue : 'y'},
        {label : '_data', id: 'data_array', defaultValue : [] }

     ];
};

