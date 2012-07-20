

vq.LinearBrowser = function() {
      vq.Vis.call(this);
        //set option variables to useful values before options are set.
    this.height(40);     // defaults
    this.width(600);     // defaults
    this.vertical_padding(10);
    this.horizontal_padding(10);
    this.max_position(100);
    this.min_position(0);
    this.context_height(50);
};

vq.LinearBrowser.prototype = pv.extend(vq.Vis);

vq.LinearBrowser.prototype
    .property('max_position',Number)
    .property('min_position',Number)
    .property('context_height',Number);

vq.LinearBrowser.prototype._setOptionDefaults = function(options) {

    if (options.max_position != null) { this.max_position(options.max_position); }

    if (options.min_position != null) { this.min_position(options.min_position); }

    if (options.context_height != null) { this.context_height(options.context_height); }

    if (options.height != null) { this.height(options.height); }

    if (options.width != null) { this.width(options.width); }

    if (options.container) { this.container(options.container); }

    if (options.vertical_padding != null) { this.vertical_padding(options.vertical_padding); }

    if (options.horizontal_padding != null) { this.horizontal_padding(options.horizontal_padding); }

};

vq.LinearBrowser.prototype.setFocusRange = function(start,dx) {
        var range_start = Math.max(this.min_position(),start);
        var range_size = Math.min(this.max_position() - range_start,dx);
        this.window ={x: this.context_posX(range_start),
            dx: this.context_posX(range_size) - this.context_posX(0)};
        this.focus_window = {x:0,dx:0};
        this.drawPanel.render();
    };

vq.LinearBrowser.prototype.getFocusRange = function() {
        var focal_range = this.posX.domain();
        return {x:focal_range[0],dx:focal_range[1]-focal_range[0]};
    };

vq.LinearBrowser.prototype.draw = function(data) {

    this._li_br_data = new vq.models.LinearBrowserData(data);

        if (this._li_br_data.isDataReady()) {
            this._setOptionDefaults(this._li_br_data);
            this._render();
        }
    };

vq.LinearBrowser.prototype._render = function() {
        var that = this;
        var dataObj = this._li_br_data;

        this.visibleWidth = (this.width() - 2 * this.horizontal_padding());
        this.visibleHeight = (this.height() - this.vertical_padding() * 2);
        this.focus_height = this.visibleHeight - this.context_height();
        this.posX =  pv.Scale.linear().range(0,that.visibleWidth);
            this.context_posX = pv.Scale.linear(that.min_position(), that.max_position()).range(0,that.visibleWidth);

        that.window = {x:that.context_posX.range()[0]*.2,dx:(that.context_posX.range()[1] - that.context_posX.range()[0]) *.6};
        that.posX.domain(that.context_posX.invert(that.window.x),that.context_posX.invert(that.window.x + that.window.dx));
        that.focus_window = {x:0,dx:0};

        var x = pv.Scale.linear(that.min_position(),that.max_position())
                .range(0,that.visibleWidth);

        var context_scale = that.context_height() / that.focus_height;

        var log_ticks = function(domain) {
                           var b = 10,
                           p = Math.log(b),
                        log = function(x) { return Math.log(x) / p; },
                        pow = function(y) { return Math.pow(b, y); };
                        n = domain[0] < 0,
                        i = Math.floor(n ? -log(-domain[0]) : log(domain[0])),
                        j = Math.ceil(n ? -log(-domain[1]) : log(domain[1]));
                           return function() { return pv.range(i,j+1,1).map(pow);};};

        var init =  function(index) {

            var d1 = that.context_posX.invert(that.window.x),
                    d2 = that.context_posX.invert(that.window.x + that.window.dx),
                    dd =   dataObj.tracks[index].data_array.map(function(datum) { return datum;});
                       var min_val = pv.max(dd.filter(function(d) { return d.start < d1;}),function(e) { return e.start;});
            var max_val = pv.min(dd.filter(function(d) { return d.start > d2;}),function(e) { return e.start;});
            that.posX.domain(d1, d2);
            dd = dataObj.tracks[index].type =='tile' ? dd.filter(function(d) { return d.start <= d2 || d.end >= d1;})
            : dd.filter(function(d){ return (d.start <= max_val && d.start >= min_val); } );
            return dd;
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

        var drawPanel = vis.add(pv.Panel)
                .width(that.visibleWidth);

  	this.drawPanel = drawPanel;
        
        var focus = drawPanel.add(pv.Panel)
                .top(0)
                .height(that.focus_height);
                
        var bg_plot = focus.add(pv.Panel)
                .bottom(0);  
        
        var focus_click_panel = focus.add(pv.Panel);
                
        var plot = focus.add(pv.Panel)
                .bottom(0);
                        
            focus.add(pv.Rule)
                .left(0)
              .add(pv.Rule)
                .data(function() { return that.posX.ticks();} )
                .left(that.posX)
                .strokeStyle("#888")
              .anchor("bottom").add(pv.Label)
                .text(that.posX.tickFormat);
            
        var bg_panel = bg_plot.add(pv.Panel)
                .left(0)
                .width(that.visibleWidth);
                        
        var tracks_panel = plot.add(pv.Panel)
                .left(0)
                .fillStyle(null)
                .strokeStyle(null)
	        .width(that.visibleWidth);
        var track_height;

    for(var index = 0; index < dataObj.tracks.length; index++) {

        var fillStyle = dataObj.tracks[index].fillStyle,
                strokeStyle = dataObj.tracks[index].strokeStyle,
                lineWidth  = dataObj.tracks[index].lineWidth;
        track_height = dataObj.tracks[index].track_height;

    var bg_index = bg_panel.add(pv.Panel)
                .data([index]);

        var bg_track = bg_index.add(pv.Panel)
                .data(function(c) { return [dataObj.tracks[c]];})
                .bottom(function(c,index){
            return pv.sum(  dataObj.tracks.slice(0,index),function(d) {
                return d.track_height+d.track_padding; })})
                        .fillStyle(function(c) { return c.trackFillStyle();})
                        .strokeStyle(function(c) { return c.trackStrokeStyle();})
                        .lineWidth(function(c) { return c.trackLineWidth();})
                .height(function(c) { return c.track_height+c.track_padding;});
                
        var track_index = tracks_panel.add(pv.Panel)
                .data([index]);
        var track = track_index.add(pv.Panel)
                .data(function(c) { return [dataObj.tracks[c]];})
                .bottom(function(c,index){
            return pv.sum(  dataObj.tracks.slice(0,index),function(d) {
                return d.track_height+d.track_padding; })})
                .height(function(c) { return c.track_height+c.track_padding;});

        var yScale, min_val,max_val,plot_track,item,shape,radius;
	var num_y_rule_lines = dataObj.tracks[index].num_y_rule_lines;

                plot_track = track.add(pv.Panel)
                        .height(track_height)
			.bottom(2)
                        .events('painted')
			.overflow('hidden');

        var value_key = dataObj.tracks[index].value_key;
			

        switch (dataObj.tracks[index].type){

            case 'scatter':
            case 'scatterplot':
                 shape = dataObj.tracks[index].shape;
                radius = dataObj.tracks[index].radius;
                min_val = dataObj.tracks[index].min_value != undefined ? dataObj.tracks[index].min_value :
                        pv.min(dataObj.tracks[index].data_array,function(a) { return a[value_key];});
                max_val  = dataObj.tracks[index].max_value != undefined ? dataObj.tracks[index].max_value :
                        pv.max(dataObj.tracks[index].data_array,function(a) { return a[value_key];});
                yScale = pv.Scale.linear(min_val,max_val ).range(0,track_height);
                if (dataObj.tracks[index].yaxis_scale_type != undefined && dataObj.tracks[index].yaxis_scale_type != null &&
                        dataObj.tracks[index].yaxis_scale_type == 'log') {
                    min_val = min_val > 0 ? min_val : 1;
                    dataObj.tracks[index].base_value = dataObj.tracks[index].base_value > 0
                            ? dataObj.tracks[index].base_value : min_val;
                    yScale = pv.Scale.log(min_val,max_val ).range(0,track_height).nice();

                    yScale.ticks = log_ticks(yScale.domain());
                }

                dataObj.tracks[index].yScale = yScale;

                item = plot_track.add(pv.Dot)
                        .data(function(d,obj,index){ return init(index);})
                        .left(function(c) { return that.posX(c.start);})
                        .lineWidth(lineWidth)
                        .bottom(function(c,d){ return d.yScale(c[value_key]);})
                        .fillStyle(fillStyle)
                        .shape(shape)
                        .radius(radius)
                        .strokeStyle(strokeStyle);

                    item.event('mouseover',
                        pv.Behavior.hovercard(
                            {
                                include_header : false,
                                include_footer : true,
                                self_hover : true,
                                timeout : dataObj.tracks[index]._tooltip_timeout,
                                data_config :
                                    dataObj.tracks[index]._tooltipItems,
                                tool_config : dataObj.tracks[index]._tooltipLinks
                            }
                        ));

                if (dataObj.tracks[index].notifier != undefined){
                    item
                            .cursor('pointer')
                            .event('click',function(c,d){ d.notifier(c,d); });
                }
                track.add(pv.Rule)
                        .bottom(function(c) { return c.yScale(c.base_value);})
                        .add(pv.Rule)
                        .data(function(c) { return c.yScale.ticks(num_y_rule_lines);})
                        .bottom(function(c,d) {return d.yScale(c);})
                        .strokeStyle('#222')
                        .anchor('left').add(pv.Label)
                        .font('4pt')
                        .text(function(c,d) {return d.yScale.tickFormat(c);});
                break;

            case  'line' :

                min_val = dataObj.tracks[index].min_value != undefined ? dataObj.tracks[index].min_value :
                        pv.min(dataObj.tracks[index].data_array,function(a) { return a[value_key];});

                max_val  = dataObj.tracks[index].max_value != undefined ? dataObj.tracks[index].max_value :
                        pv.max(dataObj.tracks[index].data_array,function(a) { return a[value_key];});
                yScale = pv.Scale.linear(min_val,max_val ).range(0,track_height);
                if (dataObj.tracks[index].yaxis_scale_type != undefined && dataObj.tracks[index].yaxis_scale_type != null &&
                        dataObj.tracks[index].yaxis_scale_type == 'log') {
                    min_val = min_val > 0 ? min_val : 1;
                    dataObj.tracks[index].base_value = dataObj.tracks[index].base_value > 0
                            ? dataObj.tracks[index].base_value : min_val;
                    yScale = pv.Scale.log(min_val,max_val ).range(0,track_height).nice();

                    yScale.ticks = log_ticks(yScale.domain());
                }

                dataObj.tracks[index].yScale = yScale;

                item = plot_track.add(pv.Line)
                        .data(function(d,obj,index){ return init(index);})
                        .left(function(c) { return that.posX(c.start);})
                        .lineWidth(lineWidth)
                        .bottom(function(c,d){ return d.yScale(c[value_key]);})
                        .fillStyle(fillStyle)
                        .strokeStyle(strokeStyle);
                item.event('mouseover',
                    pv.Behavior.hovercard(
                        {
                            include_header : false,
                            include_footer : true,
                            self_hover : true,
                            timeout : dataObj.tracks[index]._tooltip_timeout,
                            data_config :
                                dataObj.tracks[index]._tooltipItems,
                            tool_config : dataObj.tracks[index]._tooltipLinks
                        }
                    ));


                if (dataObj.tracks[index].notifier != undefined){
                            item.cursor('pointer')
                            .event('click',function(c,d){ d.notifier(c,d); });
                }
              track.add(pv.Rule)
                        .bottom(function(c) { return c.yScale(c.base_value);})
                        .add(pv.Rule)
                        .data(function(c) { return c.yScale.ticks(num_y_rule_lines);})
                        .bottom(function(c,d) {return d.yScale(c);})
                        .strokeStyle('#222')
                        .anchor('left').add(pv.Label)
                        .font('4pt')
                        .text(function(c,d) {return d.yScale.tickFormat(c);});
            break;

            case 'bar':

                min_val = dataObj.tracks[index].min_value != undefined ? dataObj.tracks[index].min_value :
                        pv.min(dataObj.tracks[index].data_array,function(a) { return a[value_key];});

                max_val  = dataObj.tracks[index].max_value != undefined ? dataObj.tracks[index].max_value :
                        pv.max(dataObj.tracks[index].data_array,function(a) { return a[value_key];});
                yScale = pv.Scale.linear(min_val,max_val ).range(0,track_height);
                if (dataObj.tracks[index].yaxis_scale_type != undefined && dataObj.tracks[index].yaxis_scale_type != null &&
                        dataObj.tracks[index].yaxis_scale_type == 'log') {
                    min_val = min_val > 0 ? min_val : 1;
                    dataObj.tracks[index].base_value = dataObj.tracks[index].base_value > 0
                            ? dataObj.tracks[index].base_value : min_val;
                    yScale = pv.Scale.log(min_val,max_val ).range(0,track_height).nice();
                    yScale.ticks = log_ticks(yScale.domain());
                }

                dataObj.tracks[index].yScale = yScale;

                item = plot_track.add(pv.Bar)
                        .data(function(d,obj,index){ return init(index);})
                        .left(function(c) { return that.posX(c.start);})
                        .lineWidth(lineWidth)
                        .width(function(c) { return that.posX(c.end)-that.posX(c.start);})
                        .bottom(function(c,d){ return d.yScale(Math.min(d.base_value,c[value_key]));})
                        .height(function(c,d) { return d.yScale(Math.max(d.base_value,c[value_key])) - this.bottom();})
                        .fillStyle(fillStyle)
                        .strokeStyle(strokeStyle);
                item.event('mouseover',
                    pv.Behavior.hovercard(
                        {
                            include_header : false,
                            include_footer : true,
                            self_hover : true,
                            timeout : dataObj.tracks[index]._tooltip_timeout,
                            data_config :
                                dataObj.tracks[index]._tooltipItems,
                            tool_config : dataObj.tracks[index]._tooltipLinks
                        }
                    ));

                if (dataObj.tracks[index].notifier != undefined){
                            item.cursor('pointer')
                            .event('click',function(c,d){ d.notifier(c,d); });
                }
                track.add(pv.Rule)
                        .bottom(function(c) { return c.yScale(c.base_value);})
                        .add(pv.Rule)
                        .data(function(c) { return c.yScale.ticks(num_y_rule_lines);})
                        .bottom(function(c,d) {return d.yScale(c);})
                        .strokeStyle('#222')
                        .anchor('left').add(pv.Label)
                        .font('4pt')
                        .text(function(c,d) {return d.yScale.tickFormat(c);});
                break;
            case 'glyph' :
              shape = dataObj.tracks[index].shape;
              radius = dataObj.tracks[index].radius;

                item = plot_track.add(pv.Dot)
                        .data(function(d,obj,index){ return init(index);})
                        .left(function(c) { return that.posX(c.start);})
                        .bottom(function(c,d) { return c.level*(d.tile_height + d.tile_padding) + (radius*2);})
                        .shape(shape)
                        .radius(radius)
                        .fillStyle(fillStyle)
                        .strokeStyle(strokeStyle);

                 if (dataObj.tracks[index]._tooltipItems != undefined){
                     item.event('mouseover',
                         pv.Behavior.hovercard(
                             {
                                 include_header : false,
                                 include_footer : true,
                                 self_hover : true,
                                 timeout : dataObj.tracks[index]._tooltip_timeout,
                                 data_config :
                                     dataObj.tracks[index]._tooltipItems,
                                 tool_config : dataObj.tracks[index]._tooltipLinks
                             }
                         ));

                }
                if (dataObj.tracks[index].notifier != undefined){
                    item
                            .cursor('pointer')
                            .event('click',function(c,d){ d.notifier(c,d); });
                }
                break;
            case 'tile':
            default :

                item = plot_track.add(pv.Bar)
                        .data(function(d,obj,index){ return init(index);})
                        .left(function(c) { return that.posX(c.start);})
                        .width(function(c) { return that.posX(c.end)-that.posX(c.start)})
                        .bottom(function(c,d) { return c.level*(d.tile_height + d.tile_padding);})
                        .height(function(c,d) { return d.tile_height;})
                        .lineWidth(1)
                        .fillStyle(fillStyle)
                        .strokeStyle(strokeStyle);

                 if (dataObj.tracks[index]._tooltipItems != undefined){
                     item.event('mouseover',
                         pv.Behavior.hovercard(
                             {
                                 include_header : false,
                                 include_footer : true,
                                 self_hover : true,
                                 timeout : dataObj.tracks[index]._tooltip_timeout,
                                 data_config :
                                     dataObj.tracks[index]._tooltipItems,
                                 tool_config : dataObj.tracks[index]._tooltipLinks
                             }
                         ));

                }
                if (dataObj.tracks[index].notifier != undefined){
                    item
                            .cursor('pointer')
                            .event('click',function(c,d){ d.notifier(c,d); });
                }
                break;

        }

        track.add(pv.Label)
                .font('12pt helvetica')
                .title(function(c) { return c.description;})
                .text(function(c) { return c.label;})
                .left(0)
                .top(0)
                .textAlign('left')
                .textStyle("#333")
                .textBaseline('top');

    }

        /* Context panel (zoomed out). */
        var context = drawPanel.add(pv.Panel)
                .bottom(0)
                .width(that.visibleWidth)
                .left(0)
                .height(that.context_height());
        var context_panel = context.add(pv.Panel)
                .bottom(0);

        for(index = 0; index < dataObj.tracks.length; index++) {
            var context_index = context_panel.add(pv.Panel)
                    .data([index]);
            var context_track = context_index.add(pv.Panel)
                    .data(function(c) { return [dataObj.tracks[c]];})
                    .bottom(function(c,index){return pv.sum(  dataObj.tracks.slice(0,index),function(d) {
                return d.track_height+d.track_padding; }) * context_scale;  })
                    .height(function(c) { return (c.track_height + c.track_padding) * context_scale;})
                    .width(that.visibleWidth)
                    .overflow('hidden')
                    .fillStyle(function(c) { return c.trackFillStyle();})
                    .strokeStyle(function(c) { return c.trackStrokeStyle();})
                    .lineWidth(function(c) { return c.trackLineWidth();})
                    .left(0);

            switch (dataObj.tracks[index].type){
                 case 'scatter':
                 case 'scatterplot':
                     context_track.add(pv.Dot)
                            .data(function(d){ return d.data_array;})
                            .left(function(c) { return x(c.start);})
                            .bottom(function(c,d){ return d.yScale(c[value_key])* context_scale;})
                            .radius(1)
                            .shape('circle')
                            .fillStyle(function() { return "#00c";} )
                            .strokeStyle(function() { return "#009";} );
                    break;
                 case 'line':
                     context_track.add(pv.Line)
                            .data(function(d){ return d.data_array;})
                            .left(function(c) { return x(c.start);})
                            .bottom(function(c,d){ return d.yScale(c[value_key])* context_scale;})
                            .fillStyle(function() { return null;} )
                            .lineWidth(.5)
                            .strokeStyle(function() { return "#009";} );
                    break;
                case 'bar':
                     context_track.add(pv.Bar)
                            .data(function(d){ return d.data_array;})
                            .left(function(c) { return x(c.start);})
                            .width(function(c) { return x(c.end-c.start);})
                            .bottom(function(c,d){ return d.yScale(Math.min(d.base_value,c[value_key]))* context_scale;})
                            .height(function(c,d) { return (d.yScale(Math.max(d.base_value,c[value_key]))* context_scale - this.bottom());})
                            .lineWidth(1)
                            .fillStyle(function() { return "#00c";} )
                            .strokeStyle(function() { return "#009";} );
                    break;
                case 'glyph':
                        context_track.add(pv.Dot)
                            .data(function(d){ return d.data_array;})
                            .left(function(c) { return x(c.start);})
                            .shape('circle')
                            .radius(.5)
                            .bottom(function(c,d) { return (c.level*(d.tile_padding + d.tile_height) + (d.radius*2)) * context_scale;})
                            .fillStyle(function() { return "#00c";} )
                            .strokeStyle(function() { return "#009";} );
                    break;
                    case 'tile':
                    default :
                        context_track.add(pv.Bar)
                            .data(function(d){ return d.data_array;})
                            .left(function(c) { return x(c.start);})
                            .width(function(c) { return x(c.end-c.start);})
                            .bottom(function(c,d) { return c.level*(d.tile_padding + d.tile_height) * context_scale;})
                            .height(function(c,d) { return d.tile_height * context_scale;})
                            .lineWidth(1)
                            .fillStyle(function() { return "#00c";} )
                            .strokeStyle(function() { return "#009";} );
                    break;

            }
        }
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

       /* Y-axis ticks. */
        context.add(pv.Rule)
                .bottom(0) 
                .add(pv.Label)
                .bottom(-21)
                .text(dataObj.axes.x.label);
                

        /* The selectable, draggable focus region. */
        context.add(pv.Panel)
                .data(function() {return [that.window];})
                .cursor("crosshair")
                .events("all")
                .event("mousedown", pv.Behavior.select())
                .event("select", function() {
                                if (that.window.dx < 2) { return; }
                                focus.render();})
                .add(pv.Bar)
                .left(function(d) { return d.x;})
                .width(function(d) {return d.dx;})
                .fillStyle("rgba(255, 128, 128, .4)")
                .cursor("move")
                .event("mousedown", pv.Behavior.drag())
                .event("drag", focus);

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
                                that.focus_window = {x:0,dx:0};
                                focus.render();
                                context.render();})
                .add(pv.Bar)
                .left(function(d) { return d.x;})
                .width(function(d) {return d.dx;})
                .fillStyle("rgba(128, 128, 255, .4)");

        vis.render();
};


vq.models.LinearBrowserData = function(data) {

    vq.models.VisData.call(this,data);
    this._setDataModel();

            if (this.getDataType() == 'vq.models.LinearBrowserData') {
                this._build_data(this.getContents())
            } else {
                console.warn('Unrecognized JSON object.  Expected vq.models.LinearBrowserData object.');
            }
        };
vq.models.LinearBrowserData.prototype = pv.extend(vq.models.VisData);

vq.models.LinearBrowserData.prototype._setDataModel = function() {
         this._dataModel = [
           {label: 'width', id: 'PLOT.width', cast : Number, defaultValue: 400},
           {label: 'height', id: 'PLOT.height', cast : Number, defaultValue: 400},
           {label : 'container', id:'PLOT.container', optional : true},
           {label: 'vertical_padding', id: 'PLOT.vertical_padding', cast : Number, defaultValue: 0},
           {label: 'horizontal_padding', id: 'PLOT.horizontal_padding',cast : Number,  defaultValue: 0},
           {label: 'min_position', id: 'PLOT.min_position', cast : Number, defaultValue: 0},
            {label: 'max_position', id: 'PLOT.max_position',cast : Number,  defaultValue: 100},
            {label: 'context_height', id: 'PLOT.context_height',cast : Number,  defaultValue: 50},
             {label : 'axes.x.label', id: 'PLOT.axes.x.label', cast: String, defaultValue : '' },

            {label : 'tracks', id: 'TRACKS', defaultValue : [] }
    ];
};

vq.models.LinearBrowserData.prototype._build_data = function(data_struct) {

    this._processData(data_struct);

            this.tracks = this.tracks.map(function(b) {
               return new vq.models.LinearBrowserData.TrackData(b);
            });

            this.tracks.forEach(function(b){
                if (b.type == 'tile' || b.type == 'glyph') {
                    var  max_tile_level = b.tile_show_all_tiles ?
                               Math.floor((b.track_height - (b.radius * 4)) / (b.tile_height + b.tile_padding)) :
                               undefined;
                    b.data_array = (b.type =='tile' ? vq.utils.VisUtils.layoutChrTiles(b.data_array,b.tile_overlap_distance,max_tile_level) :
                            vq.utils.VisUtils.layoutChrTicks(b.data_array,b.tile_overlap_distance,max_tile_level));
                }
            });

            this.setDataReady(true);
        };

vq.models.LinearBrowserData.TrackData = function(data) {

    vq.models.VisData.call(this,{CONTENTS:data});
    this._setDataModel();

    this._build_data(this.getContents());
};


vq.models.LinearBrowserData.TrackData.prototype = pv.extend(vq.models.VisData);

vq.models.LinearBrowserData.TrackData.prototype._setDataModel = function() {
    this._dataModel = [
        {label : 'label', id: 'label', cast: String, defaultValue : '' },
            {label : 'type', id: 'type', cast: String, defaultValue : 'scatter' },
            {label : '_plot.axes.y.label', id: 'CONFIGURATION.axes.y.label', cast: String, defaultValue : '' },
            {label : 'fillStyle', id: 'CONFIGURATION.fill_style', cast: vq.utils.VisUtils.wrapProperty, defaultValue : null },
            {label : 'strokeStyle', id: 'CONFIGURATION.stroke_style', cast: vq.utils.VisUtils.wrapProperty, defaultValue : null },
            {label : 'lineWidth', id: 'CONFIGURATION.line_width', cast: vq.utils.VisUtils.wrapProperty, defaultValue : vq.utils.VisUtils.wrapProperty(1) },
            {label : 'trackFillStyle', id: 'CONFIGURATION.track_fill_style', cast: vq.utils.VisUtils.wrapProperty, defaultValue : function() { return pv.color('#FFFFFF');} },
            {label : 'trackStrokeStyle', id: 'CONFIGURATION.track_stroke_style', cast: vq.utils.VisUtils.wrapProperty, defaultValue : null },
            {label : 'trackLineWidth', id: 'CONFIGURATION.track_line_width', cast: vq.utils.VisUtils.wrapProperty, defaultValue : vq.utils.VisUtils.wrapProperty(1) },
            {label : 'track_height', id: 'CONFIGURATION.track_height', cast: Number, defaultValue : 80 },
            {label : 'track_padding', id: 'CONFIGURATION.track_padding', cast: Number, defaultValue : 20 },
            {label : 'base_value', id: 'CONFIGURATION.base_value', cast: Number, defaultValue : 0 },
            {label : 'max_value', id: 'CONFIGURATION.max_value', cast: Number, defaultValue : null, optional : true },
            {label : 'min_value', id: 'CONFIGURATION.min_value', cast: Number, defaultValue : null, optional : true },
            {label : 'num_y_rule_lines', id: 'CONFIGURATION.num_y_rule_lines', cast: Number, defaultValue : 3 },
            {label : 'shape', id: 'CONFIGURATION.shape', cast: String, defaultValue : 'circle' },
            {label : 'radius', id: 'CONFIGURATION.radius', cast: Number, defaultValue : 5 },
            {label : 'yaxis_scale_type', id: 'CONFIGURATION.yaxis_scale_type', cast: String, defaultValue : 'linear' },
            {label : 'notifier', id: 'CONFIGURATION.notifier', cast: Function, optional : true },
            {label : 'tile_padding', id: 'CONFIGURATION.tile_padding', cast: Number, defaultValue : 5 },
            {label : 'tile_overlap_distance', id: 'CONFIGURATION.tile_overlap_distance', cast: Number, defaultValue : 0.1 },
            {label : 'tile_height', id: 'CONFIGURATION.tile_height', cast: Number, defaultValue : 5 },
            {label : 'tile_show_all_tiles', id: 'CONFIGURATION.tile_show_all_tiles', cast: Boolean, defaultValue : false },
           {label : '_tooltipItems', id: 'OPTIONS.tooltip_items',  defaultValue :{Start : 'start' , End : 'end', Value : 'value'} },
         {label : '_tooltipLinks', id: 'OPTIONS.tooltip_links',  defaultValue : {} },
        {label : '_tooltip_timeout', id: 'OPTIONS.tooltip_timeout',  defaultValue : 200 },
            {label : 'data_array', id: 'data_array', defaultValue : [] },
        {label : 'value_key', id: 'value_key', defaultValue : 'value' }
    ];
};

vq.models.LinearBrowserData.TrackData.prototype._build_data = function(data) {
            this._processData(data);
};
