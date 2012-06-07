vq.ScatterPlot = function() {
    vq.Vis.call(this);
    // private variables

    this.height(300);     // defaults
    this.width(700);     // defaults
    this.vertical_padding(20);
    this.horizontal_padding(30);
    this.selectedProbesetId('');

};
vq.ScatterPlot.prototype = pv.extend(vq.Vis);

vq.ScatterPlot.prototype
        .property('selectedProbesetId');

// sets default variables based on the options
vq.ScatterPlot.prototype._setOptionDefaults = function(options) {
    // PUBLIC OPTIONS
    // padding
    if (options.selectedProbesetId) {
        this._selectedProbesetId = options.selectedProbesetId;
    }

    if (options.height != null) {
        this.height(options.height);
    }

    if (options.width != null) {
        this.width(options.width);
    }

    if (options.container != null) {
        this.container(options.container);
    }

    if (options.vertical_padding != null) {
        this.vertical_padding(options.vertical_padding);
    }

    if (options.horizontal_padding != null) {
        this.horizontal_padding(options.horizontal_padding);
    }
};

vq.ScatterPlot.prototype.onProbesetSelect = function(probesetId) {
    this.selectedProbesetId = probesetId;
};


vq.ScatterPlot.prototype.setRegression = function(obj) {
    this.data._regression = obj || 'none';
    this._render();
};

vq.ScatterPlot.prototype.draw = function(data) {
      this.data = new vq.models.ScatterPlotData(data);

    if (!this.data.isDataReady()) { return;}

        this._setOptionDefaults(this.data);
        this._visHeight = this.height() - ( 2 * this.vertical_padding());
        this._visWidth = this.width() - ( 2 * this.horizontal_padding());


    this._render();
};

vq.ScatterPlot.prototype._render = function() {
    var that = this;
    var div = this.container();

    function trans() {
        var t = this.transform().invert();
        var w = vis.width();
        var h = vis.height();
        var halfX = (showMaxX - showMinX) / 2, halfY = (showMaxY - showMinY) / 2,
                centerX = showMaxX - halfX,  centerY = showMaxY - halfY,
                scaleX = 2 * halfX / (w), scaleY = 2 * halfY / h;

        xScale.domain(t.x * scaleX - (halfX) + centerX, centerX + (w * t.k + t.x) * scaleX - halfX);
        yScale.domain(-1 * ( h * t.k + (t.y)) * scaleY + halfY + centerY, -1 * ( t.y) * scaleY + halfY + centerY);

        vis.render();
    }

        var dataObj = this.data;

        var x = dataObj.COLUMNID.x;
        var y = dataObj.COLUMNID.y;
        var value = dataObj.COLUMNID.value;

        var data_array = dataObj.data;
        var minX = data_array.reduce(function(previous, current) {
            return (current[x] != null) && current[x] < previous ? current[x] : previous;
        }, 999999);
        var maxX = data_array.reduce(function(previous, current) {
            return (current[x] != null) && current[x] > previous ? current[x] : previous;
        }, -999999);
        var minY = data_array.reduce(function(previous, current) {
            return (current[y] != null) && current[y] < previous ? current[y] : previous;
        }, 999999);
        var maxY = data_array.reduce(function(previous, current) {
            return (current[y] != null) && current[y] > previous ? current[y] : previous;
        }, -999999);

        //expand plot around highest/lowest values
        var showMinX = minX - (Math.abs(maxX - minX) * 0.03);
        var showMaxX = maxX + (Math.abs(maxX - minX) * 0.03);
        var showMinY = minY - (Math.abs(maxY - minY) * 0.03);
        var showMaxY = maxY + (Math.abs(maxY - minY) * 0.03);

        //start protovis code
        var xScale = pv.Scale.linear(showMinX, showMaxX).range(0, this.width());
        var yScale = pv.Scale.linear(showMinY, showMaxY).range(0, this.height());

        //regression line!
        var regress = dataObj._regression;
        if (regress=='linear') {
            var valid_data = data_array.filter(function(d, e, f) {
                return (d[y] && d[x]);
            }),
                    sum_x = pv.sum(valid_data, function(d) {
                        return d[x];
                    }),
                    sum_y = pv.sum(valid_data, function(d) {
                        return d[y];
                    }),
                    sum_x2 = pv.sum(valid_data, function(d) {
                        return d[x] * d[x];
                    }),
                //sum_y2 = pv.sum(valid_data, function(d) { return d[y] * d[y]; }),
                    sum_xy = pv.sum(valid_data, function(d) {
                        return d[x] * d[y];
                    }),
                    slope = ((valid_data.length * sum_xy) - (sum_x * sum_y)) / ((valid_data.length * sum_x2) - (sum_x * sum_x));

            var intercept = (sum_y - slope * sum_x) / valid_data.length;
        }
        var line_minX = showMinX * 0.95;
        var line_maxX = showMaxX * 1.05;
        var line_maxY = slope * line_maxX + intercept;
        var line_minY = slope * line_minX + intercept;

        var lineArray = pv.Scale.linear(line_minX, line_maxX).range(line_minY, line_maxY);

        //identify selected Probeset, if passed in.
        var selectedProbesetId;

        if (this._selectedProbesetId) {
            selectedProbesetId = this._selectedProbesetId;
        }

        var vis = new pv.Panel()
                .width(this.width())
                .height(this.height())
                .bottom(this.vertical_padding())
                .left(this.horizontal_padding())
                .right(this.horizontal_padding())
                .top(this.vertical_padding())
                .strokeStyle("#aaa")
                .events("all")
                .event("mousemove", pv.Behavior.point())
                .canvas(div);

        //y-axis ticks
        vis.add(pv.Rule)
                .data(function() {
                    return yScale.ticks()
                })
                .bottom(yScale)
                .strokeStyle(function(d) {
                    return d ? "#ccc" : "#999"
                })
                .anchor("left").add(pv.Label)
                .text(function(d){
			if (d >= 1000) 
				return d/1000 + "E3";			
			return d});

        //y-axis label
        vis.add(pv.Label)
                .text(dataObj.COLUMNLABEL.y)
                .font(that.font)
                .textAlign("center")
                .left(-24)
                .bottom(this.height() / 2)
                .textAngle(-1 * Math.PI / 2);

        //x-axis ticks
        vis.add(pv.Rule)
                .data(function() {
                    return xScale.ticks()
                })
                .left(xScale)
                .strokeStyle(function(d) {
                    return d ? "#ccc" : "#999"
                })
                .anchor("bottom").add(pv.Label)
                .text(function(d){
		if (d >= 1000)
                                return d/1000 + "E3";
                        return d});

        //x-axis label
        vis.add(pv.Label)
                .text(dataObj.COLUMNLABEL.x)
                .font(that.font)
                .textAlign("center")
                .bottom(-30)
                .left(this.width() / 2);

        var panel = vis.add(pv.Panel)
                .events('all')
                .overflow("hidden");

        if (!isNaN(slope) && regress =='linear') {
            panel.add(pv.Line)
                    .data([line_minX, line_maxX])
                    .left(function(d) {
                        return xScale(d);
                    })
                    .bottom(function(d) {
                        return yScale(lineArray(d));
                    })
                    .strokeStyle("#0b0");
        }

        var strokeStyle = function(data) {
            return pv.color(dataObj._strokeStyle(data));
        };
        var fillStyle = function(data) {
            return pv.color(dataObj._fillStyle(data));
        };
        panel.add(pv.Dot)
                .def("active", -1)
                .data(data_array)
                .left(function(d) {
                    return xScale(d[x]);
                })
                .bottom(function(d) {
                    return yScale(d[y])
                })
                .strokeStyle(strokeStyle)
                .fillStyle(fillStyle)
                .radius(dataObj._radius)
                .shape(dataObj._shape)
                .event("point", function() {
                    return this.active(this.index).parent;
                })
                .event("unpoint", function() {
                    return this.active(-1).parent;
                })
                .event('click', dataObj._notifier)
                .anchor("right").add(pv.Label)
                .visible(function() {
                    return this.anchorTarget().active() == this.index;
                })
                .text(function(d) {
                    return dataObj.COLUMNLABEL.value + " " + d[value];
                });


        /* Use an invisible panel to capture pan & zoom events. */
        vis.add(pv.Panel)
                .left(0)
                .bottom(0)
                .events("all")
                .event("mousedown", pv.Behavior.pan())
                .event("mousewheel", pv.Behavior.zoom())
                .event("pan", trans)
                .event("zoom", trans);

        /** Update the x- and y-scale domains per the new transform. */

        vis.render();

};


vq.models.ScatterPlotData = function(data) {
    vq.models.VisData.call(this, data);
    this.setDataModel();
    if (this.getDataType() == 'vq.models.ScatterPlotData') {
        this._build_data(this.getContents());
    } else {
        console.warn('Unrecognized JSON object.  Expected vq.models.ScatterPlotData object.');
    }
};
vq.models.ScatterPlotData.prototype = pv.extend(vq.models.VisData);


vq.models.ScatterPlotData.prototype.setDataModel = function () {
    this._dataModel = [
        {label: 'width', id: 'PLOT.width', cast : Number, defaultValue: 400},
        {label: 'height', id: 'PLOT.height', cast : Number, defaultValue: 300},
        {label : 'container', id:'PLOT.container', optional : true},
        {label:  'vertical_padding', id: 'PLOT.vertical_padding', cast : Number, defaultValue: 20},
        {label:  'horizontal_padding', id: 'PLOT.horizontal_padding',cast : Number,  defaultValue:30},
        {label : 'data', id: 'data_array', defaultValue : [] },
        {label : 'COLUMNID.x', id: 'xcolumnid',cast : String, defaultValue : 'X'},
        {label : 'COLUMNID.y', id: 'ycolumnid',cast : String, defaultValue : 'Y'},
        {label : 'COLUMNID.value', id: 'valuecolumnid',cast : String, defaultValue : 'VALUE'},
        {label : 'COLUMNLABEL.x', id: 'xcolumnlabel',cast : String, defaultValue : ''},
        {label : 'COLUMNLABEL.y', id: 'ycolumnlabel',cast : String, defaultValue : ''},
        {label : 'COLUMNLABEL.value', id: 'valuecolumnlabel',cast : String, defaultValue : ''},
        {label : 'COLUMNLABEL.value', id: 'valuecolumnlabel',cast : String, defaultValue : ''},
        {label : 'tooltipItems', id: 'tooltip_items', defaultValue : {
            X : 'X', Y : 'Y', Value : 'VALUE'            }  },
        {label : '_fillStyle', id: 'fill_style',cast :vq.utils.VisUtils.wrapProperty,
            defaultValue : function() {
                return pv.color('steelblue').alpha(0.2);
            }},
        {label : '_strokeStyle', id: 'stroke_style',
            cast :vq.utils.VisUtils.wrapProperty, defaultValue : function() {
            return 'steelblue';
        }},
        {label : '_radius', id: 'radius',cast :vq.utils.VisUtils.wrapProperty, defaultValue : function() {
            return 2;
        }},
        {label : '_shape', id: 'shape',cast : vq.utils.VisUtils.wrapProperty, defaultValue : function() {
            return 'dot';
        }},
        {label : '_regression', id: 'regression',cast :String, defaultValue : 'none'},
        {label : '_notifier', id: 'notifier', cast : Function, defaultValue : function() {
            return null;
        }}
    ];
};

vq.models.ScatterPlotData.prototype._build_data = function(data) {
    this._processData(data);

    if (this.COLUMNLABEL.x == '') this.COLUMNLABEL.x = this.COLUMNID.x;
    if (this.COLUMNLABEL.y == '') this.COLUMNLABEL.y = this.COLUMNID.y;
    if (this.COLUMNLABEL.value == '') this.COLUMNLABEL.value = this.COLUMNID.value;

    if (this.data.length > 0) this.setDataReady(true);
};
