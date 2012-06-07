/**
*
*
* @class  An interactive violinplot.  A violinplot is a graph of nominal/ordinal data vs.  interval/continuous data.
*       The data is wiggled such that the distribution for any given value on the continuous scale is more apparent.
*        The "violin" (or stingray) shape is due to the empirical distribution calculated over the entire
*
*
*
* The JSON Object passed into the {@link ViolinPlot#draw} function as input to the visualization:
*
*
* <pre> {
*     data_array : {Array},
*	  xcolumnid : {string},
*	  ycolumnid : {string},
*	  valuecolumnid : {string},
*	  xcolumnvalue : {string},
*	  ycolumnvalue : {string},
*	  valuecolumnvalue : {string},
*	  tooltip_items : {Function},
*	  fill_style : {Function} or {string},
*	  stroke_style : {Function} or {string},
*	  radius : {Number},
*	  fill_style : {Function} or {string},
*	  stroke_style : {Function} or {string},
*     show_points : {Boolean},
*       notifier : {Function},
* 	  PLOT : {
*			width : {Number},
*			height : {Number},
*			container : {string}  or {HTMLElement}
*          vertical_padding : {Number},
*          horizontal_padding : {Number},
*			}
*	}
*	</pre>
*
*  @extends vq.Vis
*/


vq.ViolinPlot = function() {
    vq.Vis.call(this);
    // private variables

    this.height(300);     // defaults
    this.width(700);     // defaults
    this.vertical_padding(20);
    this.horizontal_padding(30);
    this.selectedProbesetId('');

};
vq.ViolinPlot.prototype = pv.extend(vq.Vis);

/** @name vq.ViolinPlot.selectedProbesetId **/

vq.ViolinPlot.prototype
        .property('selectedProbesetId');

/** @private **/
vq.ViolinPlot.prototype._setOptionDefaults = function(options) {
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

vq.ViolinPlot.prototype.onProbesetSelect = function(probesetId) {
    this.selectedProbesetId = probesetId;
};

/**
 *
 *  Constructs the ViolinPlot model and adds the SVG tags to the defined DOM element.
 *
 * @param {JSON Object} violinplot_object - the object defined above.
 */

vq.ViolinPlot.prototype.draw = function(data) {
    var that = this;

    this.data = new vq.models.ViolinPlotData(data);

    this._setOptionDefaults(this.data);

    var div = this.container();

    function trans() {
        var t = this.transform().invert();
        var w = that.width();
        var h = that.height();
        var  halfY = (showMaxY - showMinY) / 2,
                  centerY = showMaxY - halfY,
                scaleY = 2 * halfY / h;

        //xScale.domain(t.x * scaleX - (halfX) + centerX, centerX + (w * t.k + t.x) * scaleX - halfX);
        yScale.domain(-1 * ( h * t.k + (t.y)) * scaleY + halfY + centerY, -1 * ( t.y) * scaleY + halfY + centerY);
        vis.render();
    }

    if (this.data.isDataReady()) {
        var dataObj = this.data;

        var x = dataObj.COLUMNID.x;
        var y = dataObj.COLUMNID.y;
        var value = dataObj.COLUMNID.value;

        var data_array = dataObj.data;
        var data_summary = dataObj.data_summary;
        var summary_map = {};
        var highest = -9999999,lowest = 9999999;
	 if (typeof data_array[0][x] == 'number') data_array.sort(function(a,b) { return a[x]-b[x];} ); //sort numerically ascending
         var xScale = pv.Scale.ordinal(data_array,function(val){return val[x];}).splitBanded(0, that.width(),0.8);
        var bandWidth = xScale.range().band / 2;

        data_summary.forEach(function(category) {
            var minY = pv.min(category[y]);
            var maxY = pv.max(category[y]);
            var sampleCount = category[y].length;

            category.bottom = minY;
            category.top = maxY;
            category.mean = pv.mean(category[y]);
            if (sampleCount <=4) {
                summary_map[category[x]] = category;
                category.dist=[];
                category.bandScale=0;
                category.setSize=1;
		highest = maxY > highest ? maxY : highest;
		lowest = minY < lowest ? minY : lowest;
                return;
            }
            var quartiles = pv.Scale.quantile(category[y]).quantiles(4).quantiles();
            //Freedman-Diaconis' choice for bin size
            var setSize = 2 * (quartiles[3] - quartiles[1]) / Math.pow(sampleCount,0.33);
            category.dist = pv.range(minY- 3*setSize/2,maxY+ 3*setSize/2,setSize).map(function(subset) {
                        return {position : subset + setSize/2,
                            value : category[y].filter(function(val) { return val >= subset && val < subset + setSize;}).length/category[y].length};
            });
            category.bandScale =  pv.Scale.linear(0,pv.max(category.dist,function(val) { return val.value;})).range(0,bandWidth);
            highest = maxY+ 3*setSize/2 > highest ? maxY+ 3*setSize/2 : highest;
            lowest = minY- 3*setSize/2 < lowest ? minY- 3*setSize/2 : lowest;
            category.setSize=setSize;
            summary_map[category[x]] = category;
        });

        delete data_summary;

         //expand plot around highest/lowest values
        var showMinY = lowest - (highest - lowest) / 15;
        var showMaxY = highest + (highest - lowest) /15;

        //start protovis code

        var yScale = pv.Scale.linear(showMinY, showMaxY).range(0, that.height());

        //identify selected Probeset, if passed in.
        var selectedProbesetId;

        if (this._selectedProbesetId) {
            selectedProbesetId = this._selectedProbesetId;
        }

        var vis = new pv.Panel()
                .width(that.width())
                .height(that.height())
                .top(that.vertical_padding())
                .bottom(that.vertical_padding())
                .left(that.horizontal_padding())
                .right(that.horizontal_padding())
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
                .data(xScale.domain())
                .left(function(val) { return xScale(val) + bandWidth;})
                .strokeStyle(function(d) {
                    return d ? "#ccc" : "#999"
                })
                .anchor("bottom").add(pv.Label)
		.text(function(d){
			if (xScale.domain().length >= 2*yScale.ticks().length ){
				var ci = this.index;
				if (ci%2 == 0)
					return parseFloat(d).toFixed(2);
				return "";
				//parseFloat(d).toFixed(2);
			}
			//var ci = this.index;
                        return parseFloat(d).toFixed(2);}//d.toFixed(2)}
		);

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

        var strokeStyle = function(data) {
            return pv.color(dataObj._strokeStyle(data));
        };
        var fillStyle = function(data) {
            return pv.color(dataObj._fillStyle(data));
        };
       var violinPanel =  panel.add(pv.Panel)
                .data(xScale.domain())
                .strokeStyle(null)
                .fillStyle(null);

        //mean of distribution
        violinPanel.add(pv.Bar)
                .left(function(c) {return xScale(c);})
                .visible(function(c) { return summary_map[c].dist.length;})
                .width(bandWidth * 2)
                .height(2)
                .bottom(function(label) {return yScale(summary_map[label].mean)-1;})
                .fillStyle('rgb(255,0,0,0.6)');

        //left side of distribution
        violinPanel.add(pv.Line)
                .data(function(label){return summary_map[label].dist;})
                .strokeStyle('black')
                .lineWidth(1)
            .left(function(set,label) { return xScale(label) + bandWidth - summary_map[label].bandScale(set.value);})
            .bottom(function(set) { return yScale(set.position);});

        //right side of distribution
        violinPanel.add(pv.Line)
            .data(function(label){return summary_map[label].dist;})
                .strokeStyle('black')
                .lineWidth(1)
            .left(function(set,label) { return xScale(label) + bandWidth + summary_map[label].bandScale(set.value);})
            .bottom(function(set) { return yScale(set.position);});

        //data points
        if(dataObj._showPoints) {
            violinPanel.add(pv.Dot)
                .def("active", -1)
                .data(data_array)
                .left(function(c) {
                    //if only one point in distribution, just put it on the axis
                    if (summary_map[c[x]].dist.length < 1) {return xScale(c[x]) + bandWidth;}
                    //if more than one point in distribution, wiggle it around
                    var distSize = summary_map[c[x]].dist[Math.floor((c[y]-summary_map[c[x]].bottom)/summary_map[c[x]].setSize)].value;
                    var distSize2 =  summary_map[c[x]].dist[Math.ceil((c[y]-summary_map[c[x]].bottom)/summary_map[c[x]].setSize)].value;
                    var average = (distSize +distSize2) / 3;
                    return xScale(c[x]) + bandWidth + summary_map[c[x]].bandScale(Math.cos(this.index%(summary_map[c[x]][y].length/3))*average);
                })
                .bottom(function(c) { return yScale(c[y]);})
                .shape(dataObj._shape)
                .fillStyle(fillStyle)
                .strokeStyle(strokeStyle)
                .radius(dataObj._radius)
                .event("point", function() {
                    return this.active(this.index).parent;
                })
                .event("unpoint", function() {
                    return this.active(-1).parent;
                })
                .event('click', dataObj._notifier)
                .anchor("right").add(pv.Label)
                .visible(function() {  return this.anchorTarget().active() == this.index;  })
                .text(function(d) {  return dataObj.COLUMNLABEL.value + " " + d[value];  });
        }

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
    }
};



/**
 *
 * @class Internal data model for violin plots.
 *
 * @param data {JSON Object} - Configures a violin plot.
 * @extends vq.models.VisData
 */

vq.models.ViolinPlotData = function(data) {
    vq.models.VisData.call(this, data);
    this.setDataModel();
    if (this.getDataType() == 'vq.models.ViolinPlotData') {
        this._build_data(this.getContents());
    } else {
        console.warn('Unrecognized JSON object.  Expected vq.models.ViolinPlotData object.');
    }
};
vq.models.ViolinPlotData.prototype = pv.extend(vq.models.VisData);


vq.models.ViolinPlotData.prototype.setDataModel = function () {
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
        {label : '_showPoints', id: 'show_points',cast :Boolean, defaultValue : true},
        {label : '_notifier', id: 'notifier', cast : Function, defaultValue : function() {
            return null;
        }}
    ];
};

vq.models.ViolinPlotData.prototype._build_data = function(data) {
    var that = this;
    this._processData(data);

    if (this.COLUMNLABEL.x == '') this.COLUMNLABEL.x = this.COLUMNID.x;
    if (this.COLUMNLABEL.y == '') this.COLUMNLABEL.y = this.COLUMNID.y;
    if (this.COLUMNLABEL.value == '') this.COLUMNLABEL.value = this.COLUMNID.value;


    //aggregate categorical data
            this.data_summary = [];
            pv.uniq(that.data,function(val) { return val[that.COLUMNID.x];}).forEach(function(label){
                var obj={};
                var set = that.data.filter(function(a){return a[that.COLUMNID.x]==label;});
                obj[that.COLUMNID.x] = label;
                obj[that.COLUMNID.y] = set.map(function(val){return val[that.COLUMNID.y];});
                 obj[that.COLUMNID.value] = set.map(function(val){return val[that.COLUMNID.value];});
                that.data_summary.push(obj);
            });
    if (this.data.length > 0) this.setDataReady(true);
};
