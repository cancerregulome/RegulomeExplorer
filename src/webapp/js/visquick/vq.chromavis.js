

//intialize with var data ={DATATYPE : "vq.models.FlexPlotData", CONTENTS : {DATAARRAY : data_array} };
// notifier = function(x,dx) where x = position within scroll bar range,  dx = total length of window in scale of scroll bar

//draw with draw (data ={DATATYPE : "vq.models.FlexPlotData", {DATAARRAY : data_array} }
//				and options = {plotHeight: xx, plotWidth : xx, verticalPadding: xx, 
//				horizontalPadding : xx , max_x_axis_value: xx, min_x_axis_value: xx,
//				maxRange: xx, minRange: xx, dblclick_notifier : function(x,dx),
//				fixedWindowWidth: xx, scaleMultiplier : xx, interval : xx, font : "fontname"}
//note dblclick_notifer is the last listed option.  This can be used to create a "zoom" effect by re-instanstiating the scroll bar with new parameters.


vq.ChromaVis = function() {
    vq.Vis.call(this);

    //set option variables to useful values before options are set.
    this.height(500);     // defaults
    this.width(500);     // defaults
    this.vertical_padding(30);
    this.horizontal_padding(30);
    this.max_x_axis_value(11);
    this.min_x_axis_value(0);
    this.context_height(50);
    this.max_y_axis_value(1);
    this.min_y_axis_value(1);
    this.max_y(1);
    this.min_y(1);
    this.uuid(vq.utils.VisUtils.guid());

};

vq.ChromaVis.prototype = pv.extend(vq.Vis);

vq.ChromaVis.prototype
        .property('uuid',String)
        .property('max_x_axis_value',Number)
        .property('min_x_axis_value',Number)
        .property('max_y_axis_value',Number)
        .property('min_y_axis_value',Number)
        .property('max_y',Number)
        .property('min_y',Number)
        .property('auto_scale_y',Boolean)
        .property('auto_scale_x',Boolean)
        .property('auto_update_scale_y',Boolean)
        .property('context_height',Number);

vq.ChromaVis.prototype.slaveTo = function(master_id) {
    var that = this;
    var slave_x = true, slave_y = true;
    if (arguments.length == 3) { slave_x = arguments[1]; slave_y=arguments[2];}
    this.slaveX = slave_x;
    this.slaveY = slave_y;
    if (!this.windowChangeHandler)  this.windowChangeHandler = {};
    this.windowChangeHandler[master_id] = function(obj) {that.windowchange(obj);};
    vq.events.Dispatcher.addListener('chromavis_windowchange',master_id,that.windowChangeHandler[master_id]);
};

vq.ChromaVis.prototype.unSlaveFrom =function(master_id) {
    var that =this;
    if (!that.windowChangeHandler || !that.windowChangeHandler[master_id]) { return;}
    vq.events.Dispatcher.removeListener('chromavis_windowchange',master_id,that.windowChangeHandler[master_id]);
};

vq.ChromaVis.prototype.windowchange = function(window_obj) {
    this.slaveRenderX = this.slaveX;
    this.slaveRenderY = this.slaveY;
    if (this.slaveRenderX) this.posX.domain(window_obj.pos.x.min,window_obj.pos.x.max);
    if (this.slaveRenderY) this._bl_data.yScale.domain(window_obj.pos.y.min,window_obj.pos.y.max);
    this.drawPanel.render();
    this.slaveRenderX = false;
    this.slaveRenderY = false;
};

vq.ChromaVis.prototype._setOptionDefaults =  function(options) {

    if (options.max_x_axis_value != null) { this.max_x_axis_value(options.max_x_axis_value); }

    if (options.min_x_axis_value != null) { this.min_x_axis_value(options.min_x_axis_value); }

    if (options.context_height != null) { this.context_height(options.context_height); }

    if (options.auto_scale_y != null) { this.auto_scale_y(options.auto_scale_y); }
    if (options.auto_scale_x != null) { this.auto_scale_x(options.auto_scale_x); }

    if (options.auto_update_scale_y != null) { this.auto_update_scale_y(options.auto_update_scale_y); }

    if (options.max_y_axis_value != null) { this.max_y_axis_value(options.max_y_axis_value); }
    if (options.min_y_axis_value != null) { this.min_y_axis_value(options.min_y_axis_value); }

    if (options.height != null) { this.height(options.height); }

    if (options.width != null) { this.width(options.width); }

    if (options.container) { this.container(options.container); }

    if (options.vertical_padding != null) { this.vertical_padding(options.vertical_padding); }

    if (options.horizontal_padding != null) { this.horizontal_padding(options.horizontal_padding); }

};

vq.ChromaVis.prototype.draw = function(data) {
    var that = this;
    this._bl_data = new vq.models.ChromaVisData(data);
    if (this._bl_data.isDataReady()) {
        this._setOptionDefaults(that._bl_data);
        this._render();
    }
};

vq.ChromaVis.prototype._render = function() {

    var that = this;
    var dataObj = this._bl_data;

    var x_label;
    var left_margin = 55;

    this.show_vals = false;
    this.current_vals = {};
    that.mouse_x = null;
    that.slaveRenderX = false;
    that.slaveRenderY = false;

    this.visibleWidth = (this.width() - 2 * this.horizontal_padding() - dataObj.legend_width) - left_margin;  //40 is for y-axis label
    this.visibleHeight = (this.height() - this.vertical_padding() * 2);
    this.focus_height = this.visibleHeight - this.context_height();
    this.posX =  pv.Scale.linear().range(0,that.visibleWidth);
	this.min_x = pv.min(dataObj.data_array,function(a) { return pv.min(a[dataObj.data_contents_id],function(b) {return b[dataObj.x_column_id];});});
	this.max_x = pv.max(dataObj.data_array,function(a) { return pv.max(a[dataObj.data_contents_id],function(b) {return b[dataObj.x_column_id];});});

        this.max_y(pv.max(dataObj.data_array,function(a) { return pv.max(a[dataObj.data_contents_id],function(b) {return b[dataObj.y_column_id];});}));

    var  min_x =  that.auto_scale_x()  ? this.min_x :
            that.min_x_axis_value(),
         max_x =  that.auto_scale_x()  ? this.max_x :
            that.max_x_axis_value();

    that.min_x_axis_value(min_x);
    that.max_x_axis_value(max_x);


    this.context_posX = pv.Scale.linear(that.min_x_axis_value(), that.max_x_axis_value()).range(0,that.visibleWidth);
    that.window = {x:that.context_posX.range()[0] + ((that.context_posX.range()[1] - that.context_posX.range()[0])* .2),dx:(that.context_posX.range()[1] - that.context_posX.range()[0]) *.6};
    that.posX.domain(that.context_posX.invert(that.window.x),that.context_posX.invert(that.window.x + that.window.dx));
    that.focus_window = {x:0,dx:0};

    function update_vals() {
        var index = -1;
         that.show_vals = true;
         that.mouse_x = that.posX.invert(tracks_panel.mouse().x);
         dataObj.data_array.forEach(function(line) {
            index = pv.search(line[dataObj.data_contents_id].map(function(point) { return point[dataObj.x_column_id];}),that.mouse_x);
             index = index < 0 ? (-index -2) : index;
             if (index < 0) { that.show_vals = false;}
            that.current_vals[line[dataObj.data_label]]= index < 0 ? 0 : line[dataObj.data_contents_id][index][dataObj.y_column_id];
         });
        x_label.render();
        if (bubble) {
            bubble.render();
        }
        return legend;
    }

    function remove_vals() { that.show_vals = false; that.mouse_x = null; x_label.render(); return legend;}

   
 var     x = pv.Scale.linear(that.min_x_axis_value(),that.max_x_axis_value())
            .range(0,that.visibleWidth),
            scale_height = this.focus_height - 4,
             min_val = that.min_y_axis_value(),
            max_val  = that.auto_scale_y()  ? this.max_y() :
                     this.max_y_axis_value(),
            yScale = pv.Scale.linear(min_val,max_val ).range(0,scale_height);
    dataObj.context_yScale = pv.Scale.linear(min_val,max_val ).range(0,that.context_height()-1);

    this.max_y_axis_value(max_val);
    this.min_y_axis_value(min_val);

    if (dataObj.yaxis_scale_type != undefined && dataObj.yaxis_scale_type != null &&
            dataObj.yaxis_scale_type == 'log') {
        min_val = min_val > 0 ? min_val : 1;
        dataObj.base_value = dataObj.base_value > 0
                ? dataObj.base_value : min_val;
        yScale = pv.Scale.log(min_val,max_val ).range(0,scale_height).nice();
        dataObj.context_yScale =  pv.Scale.log(min_val,max_val ).range(0,that.context_height()-1).nice();
        yScale.ticks = log_ticks(yScale.domain());
    }

    dataObj.yScale = yScale;

    var log_ticks = function(domain) {
        var b = 10,
                p = Math.log(b),
                log = function(x) { return Math.log(x) / p; },
                pow = function(y) { return Math.pow(b, y); };
        n = domain[0] < 0,
                i = Math.floor(n ? -log(-domain[0]) : log(domain[0])),
                j = Math.ceil(n ? -log(-domain[1]) : log(domain[1]));
        return function() { return pv.range(i,j+1,1).map(pow);};};

//    var dd =   vq.utils.VisUtils.clone(dataObj.data_array);
//    //array of array of  timestamps
//    var contents = dd.map(function(a) { return a[dataObj.data_contents_id].map(function(b) { return b[dataObj.x_column_id];});});

    var init =  function() {

        var contents = dataObj.data_array.map(function(a) { return a[dataObj.data_contents_id].map(function(b) { return b[dataObj.x_column_id];});});

        var d1,d2;
          if (!that.slaveRenderX) {
            d1 = that.context_posX.invert(that.window.x),
                d2 =  that.context_posX.invert(that.window.x + that.window.dx),
                that.posX.domain(d1, d2);
        }
        else {
            d1 =that.posX.domain()[0];
            d2 =that.posX.domain()[1];
            that.window.x =that.context_posX(d1);
            that.window.dx = that.context_posX(d2) - that.window.x;
        }
        //find the values just less than the minimum displayed x-axis value
        //find the data line with the smallest of these values (how low to plot from)
        var min_val = pv.min(
            pv.blend(
                contents.map(function(a) {
                    return pv.max(
                        a.filter(function(d) {
                            return d < d1;}));})));

        var max_val = pv.max(
            pv.blend(
                contents.map(function(a) {
                    return pv.min(
                        a.filter(function(d) {
                            return d > d2;}));})));

        var data = dd.map(function(line) {
            var obj = {};
            obj[dataObj.data_label] = line[dataObj.data_label];
            obj[dataObj.data_contents_id] =
                line[dataObj.data_contents_id].filter(function(d){
                    return (d[dataObj.x_column_id] <= max_val && d[dataObj.x_column_id] >= min_val);
                });
            return obj;
        });
        if(!that.slaveRenderY) {
            if (that.auto_update_scale_y()) {
                var y_max_val  =
                    pv.max(data,function(a) { return pv.max(a[dataObj.data_contents_id],function(b) {return b[dataObj.y_column_id];});});
                var domain = dataObj.yScale.domain();
                dataObj.yScale.domain(domain[0],y_max_val);
            } else {
                dataObj.yScale.domain(that.min_y_axis_value(),that.max_y_axis_value());
            }
        }

       return data;
    };

    var vis = new pv.Panel()
            .top(that.vertical_padding())
            .bottom(that.vertical_padding())
            .left(that.horizontal_padding())
            .right(that.horizontal_padding())
            .width(that.width())
            .height(that.height())
            .fillStyle(null)
            .canvas(that.container());

    var wholePanel = vis.add(pv.Panel)
            .left(0)
            .top(0);

    var drawPanel = wholePanel.add(pv.Panel)
                            .width(that.visibleWidth)
                           .left(left_margin);
    this.drawPanel = drawPanel;

    var   y_axis_label=wholePanel.add(pv.Panel)
       .top(that.focus_height/3)
       .height(that.focus_height/3)
       .left(0)
       .width(10);

    var focus = drawPanel.add(pv.Panel)
            .top(0)
            .left(0)
            .height(that.focus_height);
    var focus_click_panel = focus.add(pv.Panel);

    var plot = focus.add(pv.Panel)
            .bottom(0)
            .overflow("hidden");

    focus.add(pv.Rule)
            .left(0)
            .add(pv.Rule)
            .data(function() { return that.posX.ticks();} )
            .left(that.posX)
            .strokeStyle("#888")
            .events('none')
            .anchor("bottom").add(pv.Label)
            .text(that.posX.tickFormat);

     x_label = focus.add(pv.Panel);
    var x_rule = x_label.add(pv.Rule)
            .visible(function() { return that.mouse_x;})
            .bottom(-10)
            .height(10)
            .strokeStyle("#888")
            .events('none')
            .left(function() { return that.posX(that.mouse_x);});
    x_rule.anchor("bottom").add(pv.Label)
            .text(function() { return that.mouse_x.toFixed(2);})
            .font('4pt');

    if (dataObj.vertical_marker_array.length > 0) {
          var marker_panel = focus.add(pv.Panel)
                  .overflow("hidden")
                  .data(dataObj.vertical_marker_array);
       marker_panel.add(pv.Bar)
                       .lineWidth(2)
                       .left(function(marker) { return that.posX(marker.value);})
                       .fillStyle('rgba(240,0,0,0.6)')
                       .strokeStyle('rgba(240,0,0,0.6)')
                       .width(1)
                  .anchor('left').add(pv.Label)
                      .font('10px sans-serif')
                      .textAngle(-Math.PI/2)
                      .textAlign('center')
                      .textBaseline('bottom')
                      .textStyle('black')
                      .text(function(marker){return marker.id;});
      }

    var tracks_panel = plot.add(pv.Panel)
            .data(function() { return init();})
            .left(0)
            .width(that.visibleWidth);


    var strokeStyle = dataObj.strokeStyle,
            lineWidth  = dataObj.lineWidth,
            item = tracks_panel.add(pv.Line)
                    .data(function(d){ return d[dataObj.data_contents_id];})
                    .left(function(c) { return that.posX(c[dataObj.x_column_id]);})
                    .lineWidth(lineWidth)
                    .interpolate('cardinal')
                    .tension(0.7)
                    .bottom(function(c){ return dataObj.yScale(c[dataObj.y_column_id]);})
                    .strokeStyle(function() {return strokeStyle.call(this.parent);});


    if (dataObj.notifier != undefined){
        item.cursor('pointer')
                .event('click',function(c,d){ dataObj.notifier(c,d); });
    }

    if (dataObj.legend_width){
           item
                   .event('mousemove',update_vals)
                   .event('mouseout',function() { that.show_vals = false; that.mouse_x = null; return legend;});
    }

    //only plot base_value ruler line if it falls in the current range of y-axis values
    if (dataObj.yScale.domain()[0] <= dataObj.base_value &&
            dataObj.yScale.domain()[1] >= dataObj.base_value) {
        focus.add(pv.Rule)
                .bottom(function() { return dataObj.yScale(dataObj.base_value);});
    } else { // otherwise put the ruler along the bottom.
        focus.add(pv.Rule)
                .bottom(0);
    }
    focus.add(pv.Rule)
            .data(function() { return dataObj.yScale.ticks(5);})
            .bottom(function(c) {return dataObj.yScale(c);})
            .strokeStyle('#222')
            .width(10)
            .left(0)
            .anchor('left').add(pv.Label)
            .font('4pt')
            .text(function(c,d) {return dataObj.yScale.tickFormat(c);});

    y_axis_label.add(pv.Label)
    .textAngle(-Math.PI/2)
    .font('4pt')
    .textAlign('center')
    .textBaseline('middle')
    .text(dataObj.y_axis_label);

    var x_axis_label = drawPanel.add(pv.Panel)
        .bottom(that.context_height())
        .height(15)
        .left(0)
        .width(that.visibleWidth)
    .anchor('center').add(pv.Label)
        .text(dataObj.x_axis_label)
        .font('4pt')
        .textBaseline('middle');


    /* Context panel (zoomed out). */
    var context = drawPanel.add(pv.Panel)
            .bottom(0)
            .width(that.visibleWidth)
            .left(0)
            .height(that.context_height());
    var context_panel = context.add(pv.Panel)
            .bottom(0);

    if (dataObj.vertical_marker_array.length > 0) {
          var context_marker_panel = context_panel.add(pv.Panel)
                      .data(dataObj.vertical_marker_array);
          context_marker_panel.add(pv.Bar)
                      .lineWidth(2)
                      .fillStyle('rgba(240,0,0,0.5)')
                      .left(function(marker) { return x(marker.value);})
                      .fillStyle('rgba(240,0,0,0.5)')
                      .width(1)

      }

    var context_track = context_panel.add(pv.Panel)
            .data(function(c) { return dataObj.data_array;})
            .overflow('hidden')
            .left(0);
    context_track.add(pv.Line)
            .data(function(d){ return d[dataObj.data_contents_id];})
            .left(function(c) { return x(c[dataObj.x_column_id]);})
            .bottom(function(c){ return dataObj.context_yScale(c[dataObj.y_column_id]);})
            .lineWidth(.5)
            .antialias(true)
            .strokeStyle(function() {return strokeStyle.call(this.parent);});

    context.add(pv.Rule)
            .left(0)
        /* X-axis ticks. */
            .add(pv.Rule)
            .data(that.context_posX.ticks())
            .left(that.context_posX)
            .strokeStyle("#888")
            .anchor("bottom").add(pv.Label)
            .text(that.context_posX.tickFormat);

    /* Y-axis ticks. */
    context.add(pv.Rule)
            .bottom(0);

function render() {
                drawPanel.render();
}

    function renderAndDispatch() {
        if (that.window.dx < 2) { return; }
        render();
        if(!dataObj.dispatch_events) { return; }
         vq.events.Dispatcher.dispatch(
                new vq.events.Event('chromavis_windowchange',that.uuid(),{
                    pos: {
                        x:{min:that.context_posX.invert(that.window.x),max:that.context_posX.invert(that.window.dx +that.window.x) },
                        y:{min: dataObj.yScale.domain()[0], max : dataObj.yScale.domain()[1]}        }
        }));
    }

    /* The selectable, draggable focus region. */
    context.add(pv.Panel)
            .data(function() {return [that.window];})
            .cursor("crosshair")
            .events("all")
            .event("mousedown", pv.Behavior.select())
            .event("select", function() {
                    render();
                })
            .event("selectend", function() {
            renderAndDispatch();
        })
        .add(pv.Bar)
        .left(function(d) { return d.x;})
         .width(function(d) {return d.dx;})
         .fillStyle("rgba(255, 128, 128, .4)")
         .cursor("move")
         .event("mousedown", pv.Behavior.drag())
         .event("drag", function() {
                render();
             })
         .event("dragend", function() {
                renderAndDispatch();
             });

    /* The selectable, draggable focus region. */
    focus_click_panel
            .data(function() { return [that.focus_window];})
            .cursor("crosshair")
            .events("all")
            .event("mousedown", pv.Behavior.select())
            .event("selectend", function() {
                    if (that.focus_window.dx < 2) { that.focus_window = {x:0,dx:0}; focus.render();
                        context.render();return; }
                        that.window ={x: that.context_posX(that.posX.invert(that.focus_window.x)),
                            dx: that.context_posX(that.posX.invert(that.focus_window.dx)) -
                                    that.context_posX(that.posX.invert(0))};
                            if (dataObj.dispatch_events) {
                                vq.events.Dispatcher.dispatch(
                                new vq.events.Event('chromavis_windowchange',that.uuid(),{
                                    pos: {
                                        x:{min:that.posX.invert(that.focus_window.x),max:that.posX.invert(that.focus_window.dx+that.focus_window.x)},
                                        y:{min: dataObj.yScale.domain()[0], max : dataObj.yScale.domain()[1]}        }

                                }));
                            }
                        that.focus_window = {x:0,dx:0};
                    drawPanel.render();
        })
            .add(pv.Bar)
            .left(function(d) { return d.x;})
            .width(function(d) {return d.dx;})
            .fillStyle("rgba(128, 128, 255, .4)");

    var legend_height = 0;

    if (dataObj.legend_width){
        legend_height = 12 * dataObj.data_array.length;

        focus_click_panel
                .event('mousemove',update_vals)
                .event('mouseout',remove_vals);

        var legend = drawPanel.add(pv.Panel)
                .left(that.visibleWidth)
                .width(dataObj.legend_width)
                .top(10)
                .height(legend_height);
        var legend_item = legend.add(pv.Panel)
                .data(dataObj.data_array)
                .top(function(c) { return this.index * 12;})
                .height(10);

        legend_item.add(pv.Bar)
                .left(2)
                .width(10)
                .height(2)
                .top(2)
                .strokeStyle(function() {return strokeStyle.call(this.parent);})
       .anchor('right').add(pv.Label)
                .text(function(c) { return c[dataObj.data_label] + (that.show_vals ? ' : ' + (that.current_vals[c[dataObj.data_label]]).toFixed(3) : '');})
                .textAlign('left')
                .font("10px monospace");

    }

if (dataObj.data_array[0][dataObj.eri_id] != undefined && !isNaN(dataObj.data_array[0][dataObj.eri_id])) {

    var new_vals = pv.normalize(dataObj.data_array, function(val){ return val.eri;});

    var norm_eri_ordered = dataObj.data_array.map(function(data,index) { return {eri:new_vals[index],label:data[dataObj.data_label]};})
                   .sort(function(a,b) {
                           if(a.eri > b.eri) { return 1;}
                            else if(a.eri < b.eri) { return 1;}
                            else { return 0;}});

    function update_bubble() {
        if(!that.show_vals) { return [50];}
        var mean_square = pv.normalize(norm_eri_ordered.map(function(val) { return that.current_vals[val.label];}))
                        .reduce(function(prev,curr,index,arr){
                            return prev +
                                            (norm_eri_ordered[index][dataObj.eri_id]  - curr) *
                                            (norm_eri_ordered[index][dataObj.eri_id] - curr);},0);
        return [Math.sqrt(mean_square) || 0];
    }
    var bubble;
    var eri_gauge_height = 0;
    if(dataObj.eri_gauge) {
        eri_gauge_height = 20;
        var eri_gauge_width = 70;
        var gauge_color_scale = pv.Scale.quantitative(0,dataObj.eri_bubble_max).range('#2f2','#f22');
        var gauge_xscale = pv.Scale.linear(0,dataObj.eri_bubble_max).range(0,eri_gauge_width);
         var eri_gauge = drawPanel.add(pv.Panel)
                    .left(that.visibleWidth + 5)
                    .width(80)
                    .top(legend_height + 5)
                    .height(eri_gauge_height);

        var gauge_line = eri_gauge.add(pv.Bar)
                    .bottom(9)
                    .width(eri_gauge_width)
                    .height(2)
                    .left(10)
                    .strokeStyle('#333')
                    .lineWidth(1);
           eri_gauge.add(pv.Label)
                .bottom(-10)
                .left(3)
              .text('Prediction Match');

        eri_gauge.add(pv.Rule)
                            .left(10)
                            .height(8)
                            .bottom(6)
                            .strokeStyle('#333')
                            .lineWidth(2);

        eri_gauge.add(pv.Rule)
                      .left(eri_gauge_width+10)
                      .height(8)
                      .bottom(6)
                      .strokeStyle('#333')
                      .lineWidth(2);

        var line_panel = eri_gauge.add(pv.Panel)
                          .bottom(10)
                          .width(eri_gauge_width)
                          .height(2)
                          .left(10)
                          .strokeStyle(null);

        bubble = line_panel.add(pv.Dot)
                    .data(function() {return update_bubble();})
                    .shape('circle')
                    .radius(4)
                    .strokeStyle('#333')
                    .lineWidth(1)
                .fillStyle(function(c) { return gauge_color_scale(Math.min(dataObj.eri_bubble_max,c));})
                .bottom(0)
                .left(function(c) { return gauge_xscale(Math.min(dataObj.eri_bubble_max,c));});
}

        var top_height =  (legend_height + 15 + eri_gauge_height);
        var height = that.focus_height - top_height;
        function gaussian(val,eri) {
            var exp = -1* Math.pow((val),2) / 2;
            return  eri * Math.exp(exp);
        }

        var line = pv.range(-1,1.01,0.01);
        var x_axis = pv.Scale.linear(-1,1).range(0,80);

          var expected = dataObj.data_array.map(function(line) {
            return isNaN(line[dataObj.eri_id]) ? 0 : line[dataObj.eri_id];   });
        var max_eri = pv.max(expected);
        var y_axis = pv.Scale.linear(0,max_eri).range(0,height -5);

        var eri = drawPanel.add(pv.Panel)
                    .left(that.visibleWidth + 5)
                    .width(80)
                    .top(top_height)
                    .height(height);

        eri.add(pv.Panel)
                .data(expected)
                .top(1)
                .strokeStyle('black')
                .lineWidth(1)
            .add(pv.Line)
                .data(line)
                .bottom(function(c,d) { return y_axis(gaussian(c,d));})
                .interpolate('cardinal')
                .tension(0.7)
                .left(x_axis)
                .strokeStyle(function() { return strokeStyle.call(this.parent);})
                .lineWidth(dataObj.lineWidth);
    }

    vis.render();

};


vq.models.ChromaVisData = function(data) {
    vq.models.VisData.call(this,data);
    this._setDataModel();
    if (this.getDataType() == 'vq.models.ChromaVisData') {
        this._build_data(this.getContents());
    } else {
        console.warn('Unrecognized JSON object.  Expected vq.models.ChromaVisData object.');
    }
};
vq.models.ChromaVisData.prototype = pv.extend(vq.models.VisData);

vq.models.ChromaVisData.prototype._build_data = function(data) {

    this._processData(data);
    this.setDataReady(true);
};


vq.models.ChromaVisData.prototype._setDataModel = function() {
    this._dataModel = [
        {label: 'width', id: 'PLOT.width', cast : Number, defaultValue: 500},
        {label: 'height', id: 'PLOT.height', cast : Number, defaultValue: 500},
        {label : 'container', id:'PLOT.container', optional : true},
        {label: 'vertical_padding', id: 'PLOT.vertical_padding', cast : Number, defaultValue: 30},
        {label: 'horizontal_padding', id: 'PLOT.horizontal_padding',cast : Number,  defaultValue: 30},
        {label: 'min_x_axis_value', id: 'PLOT.min_x_axis_value', cast : Number, defaultValue: 0},
        {label: 'max_x_axis_value', id: 'PLOT.max_x_axis_value',cast : Number,  defaultValue: 100},
        {label: 'max_y_axis_value', id: 'PLOT.max_y_axis_value',cast : Number,  defaultValue : 1},
        {label: 'min_y_axis_value', id: 'PLOT.min_y_axis_value',cast : Number,  defaultValue : 0},
        {label: 'context_height', id: 'PLOT.context_height',cast : Number,  defaultValue: 50},
        {label: 'legend_width', id: 'PLOT.legend_width',cast : Number,  defaultValue : 0},
        {label: 'auto_scale_y', id: 'PLOT.auto_scale_y',cast : Boolean,  defaultValue: false},
        {label: 'auto_update_scale_y', id: 'PLOT.auto_update_scale_y',cast : Boolean,  defaultValue: false},
        {label : 'auto_scale_x', id: 'PLOT.auto_scale_x',cast : Boolean,  defaultValue: false},
        {label : 'label', id: 'label', cast: String, defaultValue : '' },
        {label : 'type', id: 'type', cast: String, defaultValue : 'line' },
        {label : 'x_column_id' , id: 'x_column_id', cast : String, defaultValue : 'x'},
        {label : 'y_column_id' , id: 'y_column_id', cast : String, defaultValue : 'y'},
        {label : 'eri_id' , id: 'eri_id', cast : String, defaultValue : 'eri'},
         {label : 'eri_gauge' , id: 'PLOT.eri_gauge', cast : Boolean, defaultValue : false},
        {label : 'y_axis_label' , id: 'y_axis_label', cast : String, defaultValue : 'Intensity'},
        {label : 'x_axis_label' , id: 'x_axis_label', cast : String, defaultValue : 'Time(ms)'},
        {label : 'strokeStyle', id: 'stroke_style', cast: vq.utils.VisUtils.wrapProperty, defaultValue : pv.Colors.category10() },
        {label : 'lineWidth', id: 'line_width', cast: vq.utils.VisUtils.wrapProperty, defaultValue : vq.utils.VisUtils.wrapProperty(1) },
        {label : 'base_value', id: 'base_value', cast: Number, defaultValue : 0 },
        {label : 'yaxis_scale_type', id: 'yaxis_scale_type', cast: String, defaultValue : 'linear' },
        {label : 'eri_bubble_max', id:'eri_bubble_max', cast : Number, defaultValue : 0.1},
        {label : 'notifier', id: 'notifier', cast: Function, optional : true },
        {label : 'tooltipItems', id: 'tooltip_items', defaultValue :
        {X : 'x' , Value : 'y'} },
        {label : 'dispatch_events', id:'dispatch_events',cast: Boolean, defaultValue: true},
        {label : 'data_array', id: 'data_array', defaultValue : [] },
        {label : 'vertical_marker_array', id:'vertical_marker_array', cast: Object, defaulValue: [] },
        {label : 'data_label', id: 'data_label', defaultValue : 'label'},
        {label : 'data_contents_id', id : 'data_contents_id', defaultValue : 'data'}
    ];
};

