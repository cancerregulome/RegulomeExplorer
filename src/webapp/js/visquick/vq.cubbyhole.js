/**
*
*
* @class  An interactive cubbyhole plot.  A cubbyhole is a graph of nominal/ordinal data vs.  nominal/ordinal data.
*       The data is wiggled such that the distribution for any given value on the continuous scale is more apparent.
*        The circular shape is generated such that there is initially separation for small distributions, with larger distributions
 *        packed into the cubbyhole.
*
*
*
* The JSON Object passed into the {@link CubbyHole#draw} function as input to the visualization:
*
*
* <pre> {
*         data_array : {Array},
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
*	  radial_interval : {Number},
*	  fill_style : {Function} or {string},
*	  stroke_style : {Function} or {string},
*     	  show_points : {Boolean},
*         notifier : {Function},
* 	  PLOT : {
*			width : {Number},
*			height : {Number},
*			container : {string}  or {HTMLElement}
*          		vertical_padding : {Number},
*          		horizontal_padding : {Number},
*			}
*	}
*	</pre>
*
*  @extends vq.Vis
*/

vq.CubbyHole = function() {
    vq.Vis.call(this);
    // private variables

    this.height(300);     // defaults
    this.width(700);     // defaults
    this.vertical_padding(20);
    this.horizontal_padding(30);
    this.selectedProbesetId('');

};
vq.CubbyHole.prototype = pv.extend(vq.Vis);

vq.CubbyHole.prototype
        .property('selectedProbesetId');


/** @private **/
vq.CubbyHole.prototype._setOptionDefaults = function(options) {
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


/** @name vq.CubbyHole.selectedProbesetId **/
vq.CubbyHole.prototype.onProbesetSelect = function(probesetId) {
    this.selectedProbesetId = probesetId;
};

vq.CubbyHole.prototype.draw = function(data) {
    var that = this;

    this.data = new vq.models.CubbyHoleData(data);

    this._setOptionDefaults(this.data);
//    this._visHeight = this.height() - ( 2 * this.vertical_padding());
//    this._visWidth = this.width() - ( 2 * this.horizontal_padding());

    var div = this.container();

    if (this.data.isDataReady()) {
        var dataObj = this.data;

        var x = dataObj.COLUMNID.x;
        var y = dataObj.COLUMNID.y;
        var value = dataObj.COLUMNID.value;

        var data_array = dataObj.data;
        var xScale = pv.Scale.ordinal(dataObj.sortOrderX).splitBanded(0, that.width(),0.8);
        var yScale = pv.Scale.ordinal(dataObj.sortOrderY).splitBanded(0, that.height(),0.8);
        var bandWidth = xScale.range().band / 2;
        var bandHeight = yScale.range().band / 2;
        var padHeight = bandHeight /4;
        var padWidth = bandWidth /4;

        //start protovis code

        //identify selected Probeset, if passed in.
        var selectedProbesetId;

        if (this._selectedProbesetId) {
            selectedProbesetId = this._selectedProbesetId;
        }

        var vis = new pv.Panel()
                .width(that.width())
                .height(that.height())
                .bottom(that.vertical_padding())
                .top(that.vertical_padding())
                .left(that.horizontal_padding())
                .right(that.horizontal_padding())
                .strokeStyle("#aaa")
                .events("all")
                .event("mousemove", pv.Behavior.point())
                .canvas(div);

        //y-axis ticks
        vis.add(pv.Rule)
                .data(yScale.domain())
                .bottom(function(val) { return yScale(val) + bandHeight;})
                .strokeStyle(function(d) {
                    return d ? "#ccc" : "#999"
                })
                .anchor("left").add(pv.Label);

        //y-axis label
        vis.add(pv.Label)
                .text(dataObj.COLUMNLABEL.y)
                .font(that.font)
                .textAlign("center")
                .left(-20)
                .bottom(this.height() / 2)
               .textAngle(-1 * Math.PI / 2);

        //x-axis ticks
        vis.add(pv.Rule)
                .data(xScale.domain())
                .left(function(val) { return xScale(val) + bandWidth;})
                .strokeStyle(function(d) {
                    return d ? "#ccc" : "#999"
                })
                .anchor("bottom").add(pv.Label);

        //x-axis label
        vis.add(pv.Label)
            .text(dataObj.COLUMNLABEL.x)
            .font(that.font)
            .textAlign("center")
            .bottom(-30)
            .left(this.width() / 2);

        vis.add(pv.Rule)        //y-axis frame
            .data(yScale.domain())
             .bottom(function(val) { return yScale(val) - padHeight;})
              .strokeStyle('#444');
        vis.add(pv.Rule)        //x-axis frame
                    .data(xScale.domain())
                     .left(function(val) { return xScale(val)- padWidth;})
                      .strokeStyle('#444');

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
            .strokeStyle(null)
            .fillStyle(null);

        var ln2 =Math.LN2;

         var ring_number = function(index) {
            //ring 0 is size 1
            //ring 1 is size 4
            //ring 2 is size 8
            return index == 0 ? 0 : index <= 4 ? 1 : Math.floor(Math.log(index -1)/ln2);
        };

        var ring_size = function(index) {
          return  index == 0 ? 1 : index <= 4 ? 4 : (Math.pow(2,ring_number(index)+1) - Math.pow(2,ring_number(index)));
        };

        var theta = function(index) {
            // theta = index / (ring + 3) in radians
            // ring 0
            return (index / ring_size(index) * (2 * Math.PI)) +
                // phase angle induced by moving outward
                ((Math.PI / 4) * (ring_number(index)%2));
        };

        var radial_interval = dataObj._radial_interval;

        var radius = function(index) {
            return (ring_number(index) * radial_interval);
        };

        var x_pos =function(index) {
            return radius(index) * Math.cos(theta(index));
        };
        var y_pos =function(index) {
            return radius(index) * Math.sin(theta(index));
        };

        if(dataObj._showPoints) {
       var dot= violinPanel.add(pv.Dot)
                 .data(data_array)
                .def("active", -1)
                .left(function(c) {
                    return xScale(c[x]) + bandWidth + x_pos(c.dist_index);
                })
                .bottom(function(c) {
                    return yScale(c[y])+bandHeight + y_pos(c.dist_index);
                })
                .shape(dataObj._shape)
                .fillStyle(fillStyle)
                .strokeStyle(strokeStyle)
                .radius(dataObj._radius)
                .event("point", function() {
                     this.active(this.index);
                    return label.render();
                })
                .event("unpoint", function() {
                     this.active(-1);
                    return label.render();
                })
                .event('click', dataObj._notifier)

                var label = dot.anchor("right").add(pv.Label)
                .visible(function() {  return this.anchorTarget().active() == this.index;  })
                .text(function(d) {  return dataObj.COLUMNLABEL.value + " " + d[value];  });
        }

        /** Update the x- and y-scale domains per the new transform. */

        vis.render();
    }
};


/**
 *
 * @class Internal data model for cubbyhole plots.
 *
 * @param data {JSON Object} - Configures a cubbyhole plot.
 * @extends vq.models.VisData
 */


vq.models.CubbyHoleData = function(data) {
    vq.models.VisData.call(this, data);
    this.setDataModel();
    if (this.getDataType() == 'vq.models.CubbyHoleData') {
        this._build_data(this.getContents());
    } else {
        console.warn('Unrecognized JSON object.  Expected vq.models.CubbyHoleData object.');
    }
};
vq.models.CubbyHoleData.prototype = pv.extend(vq.models.VisData);


vq.models.CubbyHoleData.prototype.setDataModel = function () {
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
            return 2; }},
        {label : '_shape', id: 'shape',cast : vq.utils.VisUtils.wrapProperty, defaultValue : function() {
            return 'dot';
        }},
        {label : '_radial_interval', id: 'radial_interval',cast :Number, defaultValue : 6 },
        {label : '_showPoints', id: 'show_points',cast :Boolean, defaultValue : true},
        {label : '_notifier', id: 'notifier', cast : Function, defaultValue : function() {
            return null;
        }}
    ];
};

vq.models.CubbyHoleData.prototype._build_data = function(data) {
    var that = this;
    this._processData(data);

    if (this.COLUMNLABEL.x == '') this.COLUMNLABEL.x = this.COLUMNID.x;
    if (this.COLUMNLABEL.y == '') this.COLUMNLABEL.y = this.COLUMNID.y;
    if (this.COLUMNLABEL.value == '') this.COLUMNLABEL.value = this.COLUMNID.value;

    var x  = this.COLUMNID.x;
    var y  = this.COLUMNID.y;
    var value = this.COLUMNID.value;

    this.dist = {};
    this.dist_index = {};

    this.data.forEach(function(point) {
        if (that.dist[point[x]] ===undefined) {
            that.dist[point[x]] = {};
        }
        if (that.dist[point[x]][point[y]] === undefined) {
            that.dist[point[x]][point[y]] =0;
        }
        point.dist_index = that.dist[point[x]][point[y]];
        that.dist[point[x]][point[y]]++;
    });

    //maintain a strict ordering on the category labels
    this.sortOrderX = pv.uniq(that.data, function(a) { return a[x];}).sort();
    this.sortOrderY = pv.uniq(that.data, function(a) { return a[y];}).sort();

    if (this.data.length > 0) this.setDataReady(true);


};
