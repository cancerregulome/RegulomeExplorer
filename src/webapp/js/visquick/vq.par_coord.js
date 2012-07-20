

vq.PaCo= function() {
    vq.Vis.call(this);

        //set option variables to useful values before options are set.
        this.height(400);     // defaults
        this.width(600);     // defaults
        this.vertical_padding(0);
        this.horizontal_padding(0);

};

vq.PaCo.prototype = pv.extend(vq.Vis);

vq.PaCo.prototype._setOptionDefaults = function(options) {

        if (options.height != null) {
            this.height(options.height);
        }

        if (options.width != null) {
            this.width(options.width);
        }

        if (options.vertical_padding != null) {
            this.vertical_padding(options.vertical_padding);
        }

        if (options.horizontal_padding != null) {
            this.horizontal_padding(options.horizontal_padding);
        }

        if (options.container != null) {
            this.container(options.container);
        }
};

vq.PaCo.prototype.draw = function(data) {

        this._pa_co_data = new vq.models.PaCoData(data);

        if (this._pa_co_data.isDataReady()) {
            this._setOptionDefaults(this._pa_co_data);
            this.render();
        }

};

vq.PaCo.prototype.getFiltered = function() {
    var that = this,
        dataObj = that._pa_co_data;
    var data = dataObj._data;
    filtered_data = data.filter(
                               function(d) { return dataObj._dims.every(function(dim) {return d[dim] != undefined;}) &&
                                       dataObj._dims.every( function(dim) { return d[dim] <= that.filter[dim].max &&
                                               d[dim] >= that.filter[dim].min  ;});});

    return filtered_data;
};

vq.PaCo.prototype.getSelected = function() {
    return this._pa_co_data.selected||null;
};

vq.PaCo.prototype.render = function() {
    var that = this;
    var w = that.width(),
            h = that.height(),
            div = that.container(),
            dataObj = that._pa_co_data,
            cursor = [{x:0,y:0,dx:0,dy:0}],
            cursor_label = {label:'',coordinate:'',value:0.0};

    dataObj.hovered = null;


    var x = pv.Scale.ordinal(dataObj._dims).splitFlush(0, w),
            y = {},
            c = {};

    dataObj._dims.forEach( function(t) {
        if (dataObj._coordinates[dataObj._coordinates_map[t]].scale_type == undefined) {
            dataObj._coordinates[dataObj._coordinates_map[t]].scale_type = 'linear';
        }

        var config = dataObj._coordinates[dataObj._coordinates_map[t]];
        var min_val = config.min_value != undefined ? config.min_value :
                pv.min(dataObj._data,function(a) { return a[t];});

        var max_val  = config.max_value != undefined ? config.max_value :
                pv.max(dataObj._data,function(a) { return a[t];});

        switch(config.scale_type) {
            case('log'):
                min_val = min_val > 0 ? min_val : 0.1;
                y[t] = pv.Scale.log( min_val, max_val).range(0,h).nice();
                c[t] = pv.Scale.log( min_val,max_val).range("steelblue", "brown").nice();
                break;
            case('linear') :
            case('default'):
                y[t]= pv.Scale.linear( min_val, max_val).range(0,h);
                c[t]= pv.Scale.linear( min_val, max_val).range("steelblue", "brown");
                break;
        }});

    /* Interaction state. */
    that.filter = pv.dict(dataObj._dims, function(t) {
        return {min: y[t].domain()[0], max: y[t].domain()[1]};
    }), active = dataObj._dims[0];

    var vis = new pv.Panel()
            .width(w)
            .height(h)
            .left(that.horizontal_padding())
            .right(that.horizontal_padding())
            .top(that.vertical_padding())
            .bottom(that.vertical_padding())
            .canvas(div);

    // The parallel coordinates display.
    vis.add(pv.Panel)
            .data(dataObj._data)
            .visible(function(d) { return dataObj._dims.every(function(t)
    { return d[t] <= that.filter[t].max &&
            d[t] >= that.filter[t].min ;});})
            .add(pv.Line)
          .data(dataObj._dims)
            .left(function(t) { return x(t);})
            .bottom(function(t, d) { return y[t](d[t]);})
            .strokeStyle("#ddd")
            .lineWidth(1)
            .antialias(false);

    // Rule per dimension.
    rule = vis.add(pv.Rule)
            .data(dataObj._dims)
            .left(x);

    // Dimension label
    rule.anchor("top").add(pv.Label)
            .top(-12)
            .font("bold 16px sans-serif")
            .text(function(d) { return d;});


    // The parallel coordinates display.
    var change = vis.add(pv.Panel);


    function filter_data() {
        return dataObj._data.filter(function(d) {
                    return dataObj._dims.every(function(t)
                                        { return d[t] <= that.filter[t].max &&
                                                d[t] >= that.filter[t].min ;});});
    }

    function invert_x(d) {
        var closest_dim=dataObj._dims[0];
        var distance = 999999;
               dataObj._dims.forEach(function(dim) {var dist = Math.abs(x(dim)-d);
                                        if(distance > dist) {closest_dim=dim; distance = dist; }});
                   return closest_dim;
    }
            //separate click event from handle events
    var line_panel = change.add(pv.Panel)
        .event('click', function(c) {dataObj.selected = dataObj.hovered; highlight.render();})
            .events('all');

    function overLine(c,d) {
                    var cursor_label = {};
                    dataObj.hovered = d;
                    cursor[0] = this.mouse();
                    var dim = invert_x(cursor[0].x);
                    cursor_label.label = d[dataObj._label_column];
                    cursor_label.coordinate = dim;
                    cursor_label.value = d[dim];
                    var config={};
                    config[cursor_label['label']] =  function(cursor) { return cursor.coordinate + ' ' + cursor.value;};
             pv.Behavior.flextip( {
                        include_header : false,
                        include_footer : false,
                        timeout : 20,
                        param_data:true,
                        on_mark:false,
                        close_timeout : 'inf',
                       data_config : config
                   } ).call(this.parent,cursor_label);
                    dataObj.highlight.render();
        }


    var line = line_panel.add(pv.Panel)
            .data(filter_data)

            .add(pv.Line)
            .data(dataObj._dims)
            .events('painted')
            .event('click', function(c) {dataObj.selected = dataObj.hovered; highlight.render();})
            .event('mouseover', overLine)
            .left(function(t, d) { return x(t);})
            .bottom(function(t, d) { return y[t](d[t]);})
            .strokeStyle(function(t, d) { return c[active](d[active]);})
            .lineWidth(1);



    var highlight = change.add(pv.Panel)
            .data(function() {return [dataObj.hovered,dataObj.selected];})
            .event('click', function(c) {dataObj.selected = dataObj.hovered; highlight.render();})
            .visible(function(d) { return d != undefined;});
    highlight.add(pv.Line)
            .data(dataObj._dims)
            .events('painted')
            .event('mouseover',overLine)
            .strokeStyle(function(t,d) {return this.parent.index == 1 ? 'red' : 'yellow';})
            .left(function(t, d) { return x(t);})
            .lineWidth(2.5)
            .bottom(function(t, d) { return y[t](d[t]);});

    dataObj.highlight = highlight;

    var handle = change.add(pv.Panel);

    // Updater for slider and resizer.
    function update(d) {
        var t = d.dim;
        that.filter[t].min = Math.max(y[t].domain()[0], y[t].invert(h - d.y - d.dy));
        that.filter[t].max = Math.min(y[t].domain()[1], y[t].invert(h - d.y));
        active = t;
        change.render();
        return false;
    }

    // Updater for slider and resizer.
    function selectAll(d) {
        if (d.dy < 3) {
            var t = d.dim;
            that.filter[t].min = Math.max(y[t].domain()[0], y[t].invert(0));
            that.filter[t].max = Math.min(y[t].domain()[1], y[t].invert(h));
            d.y = 0; d.dy = h;
            active = t;
            change.render();
        }
        return false;
    }

    /* Handle select and drag */
        handle
            .data(dataObj._dims.map(function(dim) { return {y:0, dy:h, dim:dim}; }))
            .left(function(t) { return x(t.dim) - 15;})
            .width(30)
            .fillStyle("rgba(0,0,0,.1)")
            .strokeStyle("rgba(0,0,0,.5)")
            .lineWidth(".2px")
                .events('all')
            .cursor("crosshair")
            .event("mousedown", pv.Behavior.select())
            .event("select", update)
            .event("selectend", selectAll)
          .add(pv.Bar)
            .left(10)
            .top(function(d) { return d.y;})
            .width(10)
            .height(function(d) { return d.dy;})
            .fillStyle(function(t) { return t.dim == active
            ? c[t.dim]((that.filter[t.dim].max + that.filter[t.dim].min) / 2)
            : "hsla(0,0,50%,.5)";})
            .strokeStyle("white")
            .cursor("move")
            .event("mousedown", pv.Behavior.drag())
            .event("dragstart", update)
            .event("drag", update);

    handle.anchor("bottom").add(pv.Label)
            .textBaseline("top")
            .text(function(d) { return that.filter[d.dim].min.toPrecision(3);});

    handle.anchor("top").add(pv.Label)
            .textBaseline("bottom")
            .text(function(d) { return that.filter[d.dim].max.toPrecision(3);});

    vis.render();
};

vq.models.PaCoData = function(data) {

    vq.models.VisData.call(this,data);
    this.setDataModel();
    if (this.getDataType() == 'vq.models.PaCoData') {
        this._build_data(this.getContents());
    } else {
        console.warn('Unrecognized JSON object.  Expected vq.models.PaCoData object.');
    }
};

vq.models.PaCoData.prototype = pv.extend(vq.models.VisData);


/**
 * @private Builds the data structure up.
 * @param data Contents of JSON data structure
 */
vq.models.PaCoData.prototype._build_data  = function(data) {
    var that = this;

    this._processData(data);

    if (this._coordinates != null) {
        this._dims=this._coordinates.map(function(coord) { return coord.id;});
        this._coordinates_map = pv.numerate(that._coordinates,function(d) {return d.id;});
        this.setDataReady(true);
    } else {
        console.error('Coordinate configuration not passed to constructor!');
    }
};

vq.models.PaCoData.prototype.setDataModel = function () {
    this._dataModel = [
        {label: 'width', id: 'PLOT.width', cast : Number, defaultValue: 700},
        {label: 'height', id: 'PLOT.height', cast : Number, defaultValue: 300},
        {label : 'container', id:'PLOT.container', optional : true},
        {label:  'vertical_padding', id: 'PLOT.vertical_padding', cast : Number, defaultValue: 20},
        {label:  'horizontal_padding', id: 'PLOT.horizontal_padding',cast : Number,  defaultValue:30},
        {label : '_data', id: 'data_array', defaultValue : [] },
        {label : '_identifier_column', id: 'CONFIGURATION.identifier_column ',cast : String, defaultValue : ''},
        {label : '_label_column', id: 'CONFIGURATION.label_column',cast : String, defaultValue : ''},
        {label : '_coordinates', id: 'CONFIGURATION.COORD_COLUMN_ARRAY', defaultValue : []},
        {label : 'tooltipItems', id: 'tooltip_items', defaultValue : {
            Name : 'nodeName',
            Parent : 'parentNode.nodeName'
        }  },
        {label : '_notifier', id: 'notifier', cast : Function, defaultValue : function() {return null;}}
    ];
};