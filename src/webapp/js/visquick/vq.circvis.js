/**
    *
    *
    * @class  Represents the circular ideogram layout.  It includes all of the features of Circvis:  feature glyphs/labels,
    * ring plots, legends,  and a circular network layout.  The visualization is configured with a JSON object that specifies the data and
    * interactive effects/behaviors.
    *
    * The JSON Object passed into the {@link CircVis#draw} function as input to the visualization:
    *
    *   <pre>
    * GENOME: {
    *       DATA:{
    *           key_order : {Array} - An array of string characters denoting the keys for each ideogram ex. ['1','2','X','Y'],
    *           key_length : {Array} - An array of numbers denoting the total length of each ideogram.  The total is fitted to the
    *                  circumference of the circular plot ex. [3231323,2437865,2265741,1987347]
    *       },
    *       OPTIONS: {
    *           key_reverse_list : {Array} - Array of ideogram labels to plot in the reverse (counter-clockwise) direction.
    *              eg. ['16','17'].  Defaults to empty array,
    *           radial_grid_line_width : {Number} - Width of radial grid lines.  Default is null (no grid lines),
    *           label_layout_style : {String} - Layout style for ideogram key labels. either 'clock' or 'default'.  Default is 'default',
    *           listener : {function} - Function handler to execute on click of ideogram label,
    *           label_font_style : {String} - Ideogram label font style.  ex. '20pt helvetica bold'. Defaults to '16px helvetica, monospaced'.
    *           radial_grid_line_width : {Integer} - If defined with a numeric value, ideograms will be partitioned with radial lines having the
    *                   given width.
    *       }
    *   },
    *
    *   PLOT: {
    *       width : {Number} - total width of tool.  Defaults to 400,
    *       height : {Number} - total height of tool. Defaults to 400,
    *       container : {Element or String} - Div to render the tool onto.  Omission of this parameter causes the tool to be
    *          rendered to the document body.  The parameter may be either the HTMLElement or the string id (eg. "circvis_div"),
    *       vertical_padding : {Number} - The number of pixels to pad above and below the rendered tool.  Defaults to 0,
    *       horizontal_padding : {Number} - The number of pixels to pad to the left and right of the rendered tool.  Defaults to 0,
    *       enable_pan : {Boolean} - Enable mouse drag 'pan' behavior for entire plot. Defaults to 'false',
    *       enable_zoom : {Boolean} - Enable mouse wheel 'zoom' behavior for entire plot. Defaults to 'false',
    *       show_legend : {Boolean} - Enable display of a legend for circular plot. Defaults to 'false',
    *       legend_corner : {String} - Anchor point for legend. Either ('ne','nw','se','sw') Defaults to 'ne',
    *       legend_radius  : {Number} - Outer radius for legend circle plot.
    *   },
    *
    *           DATA:{
    *               data_array : {Array} - An array of Circvis data nodes, ex : [ {"chr": "1", "end": 12784268, "start": 644269,
    *                  "value": -0.058664}]
    *               value_key : {String} - The property of each array element that signifies the value to evaluate for the ring.  This 
    *                is useful for scatterplots and other types of rings.
    *           },
    *           PLOT :{
    *              type : The type to be drawn. Options are 'heatmap','histogram','scatterplot','karyotype'.  Defaults to 'histogram',
    *              height :  Radial width (in pixels) of the ring plot.  Defaults to 100,
    *
    *           },
    *           OPTIONS: {
    *               tile_padding  : {Number} Distance (in pixels) between tiles that arranged at different heights. default is  5 ,
    *               tile_overlap_distance : {Number}  Minimum number of base pairs of separation in order to display tiles as neighbors. default is 0.1 ,
    *               tile_height : {Number} - Number of pixels in height for tile type rings. Default is 5 ,
    *               tile_show_all_tiles : {Boolean} - value to determines whether to overlap tiles in order to displa them all. default : false ,
    *               legend_label : {String} - optional string describing ring. Default is '',
    *               legend_description : {String} - Optional string to display when cursor is hovered over ring in legend.  Default is '',
    *               draw_axes : {Boolean} - Determines whether to draw axes and axes labels on a histogram or scatterplot.  Defautlts to true,
    *               outer_padding : {Integer} - Padding of outer edge of ring (in pixels), Dfault is 1,
    *               base_value : : {Number} - base value from which to plot in ring.  Optional,
    *               min_value : {Number} - minimum value to plot in ring.  Optional,
    *               max_value : {Number} - maximum value to plot in ring.  Optional,
    *               fill_style : {Function or String} - Either a function that returns a css color string or the string itself.  Default is
    *                       function(d) { return d.value >= 0 ? "rgba(20,40,200,0.6)" : "rgba(200,20,40,0.6)";} },
    *               stroke_style : {Function or String} - Either a function that returns a css color string or the string itself. Default is
    *                       function(d) {return d.value >= 0 ? "#00f" : "#f00";},
    *               shape : {Function/String} - Scatterplot glyph shape.  'triangle','diamond','cross','square','circle','tick','bar'.  Defaults to
    *                       function(d) {return 'circle';},
    *               radius : {Function/Number} - scatterplot glyph radius.  Defaults to function(d) {return 2;}
    *               listener : {Function} - the function to call on a click.  it is passed {key,{start:{Integer},end:{Integer},value:{Number}},
    *               tooltip_items: {Tooltip Items} - Defaults to {Chr:'chr',Start:'start',End:'end',Value:'value'},
    *               tooltip_links: {Tooltip Links} - Displays links that can be constructed from datapoint attributes. Defaults to {}
    *           }
    *       }
    *
    *    ],
    *
    *    TICKS : {
    *        DATA: {
    *            data_array: {Array} - An array of Circvis data nodes where the 'value' is expected to be the label of the tick.
    *        },
    *        OPTIONS : {
    *            height : {Number},  - The radius(in pixels) of the ring containing the tick labels/feature glyphs .  Defaults to 60,
    *            listener : {Function} - A function to execute on click of a glyph.  Function is passed {key, start,end, value}
    *            fill_style: {Function or CSS Color String} - A declared CSS color or a pv.Color must be the result  Default is function(){return 'red';},
    *            stroke_style : {Function or CSS Color String} - A declared CSS color or a pv.Color must be the result  Default is function(){return 'white';},
    *            display_legend: {Boolean} - Setting this to <i>true</i> will display a legend on the upper left corner mapping the tick color
    *                       to the color_keys array.
    *            legend_corner : {String} - Anchor point for legend. Either ('ne','nw','se','sw') Defaults to 'nw',
    *            outer_padding : {Number} - The distance between the tool boundary and the feature glyph ring.  Defaults to 0,
    *            overlap_distance : {Number} - Used in tiling of the feature glyphs.  The maximum distance (in base pairs) that constitutes overlapping features.  Defaults to 7000000.0
    *            tile_ticks : {Boolean} - Declare whether to tile feature glyphs or lay all of them out at the same level.  Defaults to true,
    *            label_key : {String} - The property of the feature data which denotes the feature label.  eg. {label:'GENEA'} would require label_key: 'label'
    *            label_map : {Array} - A mapping of an example feature label to a string describing that feature type.  Each element is an object.
    *                     eg. [{key:'TP53', label:'Gene'}].  Default is no mapping.
    *            wedge_height : {Number},  - The height(in pixels) of each tick/feature glyphs .  Defaults to 10,
    *            wedge_width : {Number},  - The width(in degrees) of each tick/feature glyphs .  Defaults to 0.5,    

    *            tooltip_items : {Tooltip Object} - JSON object that configures the tooltip display of a feature glyph. The mapping of each property is:
    *            tooltip label : 'data_point_property'.
    *                     The data_point_property can be statically defined or be a function that operates on the data point and returns a string. Default is:
    *                     { Chr : 'chr', Start : 'start', End : 'end', Label:'value'}
        *               tooltip_links: {Tooltip Links} - Displays links that can be constructed from datapoint attributes. Defaults to {}
    *        }
    *    },
    *
    *    NETWORK:{
    *        DATA:{
    *            data_array : {Array} - An array of Circvis network objects, which consist of 2 data nodes, a linkValue, and a linkOptions
    *        },
    *        OPTIONS: {
    *            node_listener : {Function} - function to execute on click on a node. Default is function() {return null;},
    *            link_listener : {Function{  - function to execute on click of a link. Default is function() {return null;},
    *            link_alpha : {Number or Function} - a value between (0.0,1.0) which defines the link 'alpha' for a given edge. Default is function() {return 0.7;},
    *            link_line_width : {Number or Function} - link width in units of pixels.  Default is function(node,link) { return 1; },
    *            node_fill_style : {Function or String} - Either a function that returns a css color string, the string itself, or 'ticks'.  Default is
    *                   function() { return 'blue';},
    *            link_stroke_style : {Function or String} - Either a function that returns a css color string or the string itself. Default is function() { return 'red';},
    *            tile_nodes : {Boolean} - Determines whether network nodes are 'tiled' to prevent visual occlusion by proximal features.  Defaults to 'false'.
    *            node_key : {Function} - Function that accepts a node object argument and returns the ideogram 'key' label.  Defaults to function(node) { return node['chr'];},
    *            max_node_linkdegree : {Number} - A number greater than zero which filters out all nodes with a higher linkDegree ex. 100. Defaults to 9999,
    *            min_node_linkdegree : {Number} - A number greater than zero which filters out all nodes with a lower linkDegree ex. 2. Defaults to 0,
    *            node_overlap_distance : {Number} - When tiling the graph nodes, the maximum distance (in base pairs) that constitutes overlapping tiles.  Defaults to 12000000.0
    *            node_tooltip_items : {Tooltip Object} - Defaults to { Chr : 'chr', Start : 'start', End : 'end'},
    *            link_tooltip_items : {Tooltip Object} - Defaults to { 'Node 1 Chr' : 'sourceNode.chr', 'Node 1 Start' : 'sourceNode.start', 'Node1 End' : 'sourceNode.end',
    *                     'Node 2 Chr' : 'targetNode.chr', 'Node 2 Start' : 'targetNode.start', 'Node 2 End' : 'targetNode.end'},
    *               node_tooltip_links: {Tooltip Links} - Displays links that can be constructed from datapoint attributes. Defaults to {},
    *               link_tooltip_links: {Tooltip Links} - Displays links that can be constructed from datapoint attributes. Defaults to {}
    *
    *        }
    *    }
    *
    *  };
    *  </pre>
    * @extends vq.Vis
    */
vq.CircVis = function() {
    vq.Vis.call(this);
};
vq.CircVis.prototype = pv.extend(vq.Vis);

vq.CircVis.prototype.setPanEnabled = function(pan_enabled) {
    if (arguments.length < 1) { return; }
    var enable_pan = Boolean(pan_enabled);
    this.chromoData._plot.enable_pan = enable_pan;
            if ( enable_pan) {this.event_panel.cursor('move'); this.event_panel.event("mousedown",pv.Behavior.pan());}
    else  {
                if (!this.chromoData._plot.enable_zoom) {this.event_panel.cursor('default'); }
                this.event_panel.event("mousedown",null);
            }
};

/**
 *   Include/Remove the zoom effect using a mousewheel
 *
 * @param {Boolean} zoom_enabled - the index of the ring to set the value for.  Zero is the outermost ring.
 */

vq.CircVis.prototype.setZoomEnabled = function(zoom_enabled) {
    if (arguments.length < 1) { return; }
    var enable_zoom = Boolean(zoom_enabled);
    this.chromoData._plot.enable_zoom = enable_zoom;
    if ( enable_zoom) {this.event_panel.cursor('move'); this.event_panel.event("mousewheel",pv.Behavior.zoom());}
    else {
               if (!this.chromoData._plot.enable_pan) {this.event_panel.cursor('default'); }
                this.event_panel.event("mousewheel",null);
    }
};

/**
 *   Set the maximum value on the y-axis of a ring plot.
 *
 * @param {Integer} ring_number - the index of the ring to set the value for.  Zero is the outermost ring.
 * @param {Number} max_value - the value to assign as the maximum to plot.
 */

vq.CircVis.prototype.setMaxPlotValue = function(wedge_number,value) {
    if ( value > this.chromoData._wedge[wedge_number]._min_plotValue){
        this.chromoData._wedge[wedge_number]._max_plotValue = value;
        this._render();
    }
};
/**
 *   Set the minimum value on the y-axis of a ring plot.
 *
 * @param {Integer} ring_number - the index of the ring to set the value for.  Zero is the outermost ring.
 * @param {Number} min_value - the value to assign as the minimum to plot.
 */


vq.CircVis.prototype.setMinPlotValue = function(wedge_number,value) {
    if ( value < this.chromoData._wedge[wedge_number]._max_plotValue){
        this.chromoData._wedge[wedge_number]._min_plotValue = value;
        this._render();
    }
};

/**
 *   Set the maximum link degree for which a node will be displayed
 *
 * @param {Number} max_linkDegree - the value to assign as the maximum link degree allowable.
 */

vq.CircVis.prototype.setMaxNodeLinkDegree = function(value) {
    if ( value > this.chromoData._network.min_node_linkDegree){
        this.chromoData._network.max_node_linkDegree = value;
        this._render();
    }
};

/**
 *   Set the minimum link degree for which a node will be displayed
 *
 * @param {Number} min_linkDegree - the value to assign as the minimum link degree allowable.
 */
vq.CircVis.prototype.setMinNodeLinkDegree = function(value) {
    if ( value < this.chromoData._network.max_node_linkDegree){
        this.chromoData._network.min_node_linkDegree = value;
        this._render();
    }
};
/**
 *      Changes the plot size and re-renders the plot.
 *
 * @param {Number} height - plot height in units of pixels
 * @param {Number} width  - plot width in units of pixels
 */

vq.CircVis.prototype.setSize = function(height, width) {
    if (height > 1 && width > 1 && (width != this.width() && height != this.height())) {
        this.width(width);
        this.height(height);
        this._render();
    }
};

/**
 *   Highlight the network and tick corresponding to the requested tick.  Passing the empty string('') causes the
 *   highlighting to be turned off.
 *
 * @param {String} label - the node id (commonly the tick label string) of the feature to highlight
 */

vq.CircVis.prototype.selectNodeLabel = function(label) {
    if (label == '') //empty all active lists
    {
        this.chromoData.network_panel.activeNetworkNode(null);
        this.chromoData.network_panel.render();
        this.chromoData.tick_panel.activeTickList([]);
        this.chromoData.tick_panel.render();
        return;
    }

    this.chromoData._network.selectedLabel = label;
    var match = this.chromoData._network.nodes_array.map(function(c) { return vq.utils.VisUtils.network_node_id(c);})
            .filter(function(c) { return c == label;});
    if (match.length > 0) {
        this.chromoData.network_panel.activeNetworkNode(label);
        this.chromoData.network_panel.render();
    }
    var list = this.chromoData.tick_panel.activeTickList();
    list.push(label);
    this.chromoData.tick_panel.activeTickList(list);
    this.chromoData.tick_panel.render();
};

/** @private **/

vq.CircVis.prototype._setOptionDefaults = function(options) {

    if (options.height != null) {this.height(options.height); }

    if (options.width != null) { this.width(options.width); }

    if (options.vertical_padding != null) { this.vertical_padding(options.vertical_padding);    }

    if (options.horizontal_padding != null) { this.horizontal_padding(options.horizontal_padding);}

    if (options.container) {  this.container(options.container);   }

};
/**
 *
 *  Constructs the Circvis model and adds the SVG tags to the defined DOM element.
 *
 * @param {JSON Object} circvis_object - the object defined above.
 */
vq.CircVis.prototype.draw = function(data) {

    var vis_data = new vq.models.CircVisData(data);

    if (vis_data.isDataReady()) {
        this._setOptionDefaults(vis_data);
        this.chromoData = vis_data;
        this._render();
    } else {
        console.warn('Invalid data input.  Check data for missing or improperly formatted values.');
    }
};

/** private **/
vq.CircVis.prototype._add_ticks = function(outerRadius) {
    var dataObj = this.chromoData;
    var outerTickRadius = outerRadius - dataObj.ticks.outer_padding;
    var innerRadius = outerTickRadius - dataObj.ticks.height;
    var inner = dataObj.ticks.tile_ticks ?  function(feature) { return innerRadius + (feature.level * (dataObj.ticks.wedge_height * 1.3)) ;} :
                function(feature) { return innerRadius;};
    var outer = function(feature) { return inner(feature) + dataObj.ticks.wedge_height;};
    var feature_angle_map = function(c,d) {return dataObj.startAngle_map[d] + dataObj.theta[d](c.start);  };
    var tick_fill = function(c) { return pv.color(dataObj.ticks.fill_style(c));};
    var tick_stroke = function(c) { return pv.color(dataObj.ticks.stroke_style(c));};
    var label_key = dataObj.ticks.label_key;

    var tick_angle = function(tick) { var angle = tick_length / inner(tick); return  isNodeActive(tick) ? angle * 2 : angle; };
    var isNodeActive = function(c) { return ( c.active ||
            (dataObj.tick_panel.activeTickList().filter(function(d) { return d == c[label_key];}).length > 0));};

var tick_width = Math.PI / 180 * dataObj.ticks.wedge_width;
    var tick_length = tick_width * innerRadius;

    dataObj.tick_panel = this.event_panel.add(pv.Panel)
            .def('activeTickList',[])
            .fillStyle(null)
            .data(dataObj._chrom.keys);

     var behavior = function(d) {
        return (pv.Behavior.hovercard(
        {
            include_header : false,
            include_footer : true,
            self_hover : true,
            timeout : dataObj._plot.tooltip_timeout,
            data_config : dataObj.ticks.tooltipItems,
            tool_config : dataObj.ticks.tooltipLinks
        }
                ).call(this,d),
                d.active = 1,
                this.render(),
                this.parent.children[1].render());};

    dataObj.tick_panel.add(pv.Wedge)
            .events("all")
            .data(function(d) { return dataObj.ticks.data_map[d];  } )
            .angle(tick_angle)
            .startAngle(function(c,d) { return feature_angle_map(c,d);})
            .innerRadius(inner)
            .outerRadius(outer)
            .event("mouseout", function(c) { c.active = 0; this.render(); this.parent.children[1].render(); })
            .event('mouseover',behavior)
            .event("click", function(c) { dataObj.ticks.listener(c); })
            .cursor('pointer')
            .strokeStyle(function(c) { return  tick_stroke(c);})
            .lineWidth(1)
            .fillStyle(function(c) { return  tick_fill(c);})
            .anchor("inner").add(pv.Label)
            .text(function(c) { return isNodeActive(c) ? c[label_key] : "";  })
            .font('14px helvetica');

    if (dataObj.ticks.display_legend){

        var corner = dataObj.ticks.legend_corner;

        var legend = this.event_panel.add(pv.Panel)
                .height(dataObj.ticks.label_map.length * 14)
                .width(60)
                .title('Tick Legend');

        switch(corner) {
            case 'ne' :
                legend.right(0).top(0);
                break;
            case 'se' :
                legend.right(0).bottom(0);
                break;
            case 'sw' :
                legend.left(0).bottom(0);
                break;
            case 'nw' :
            default :
                legend.left(0).top(0);
        }

        legend.add(pv.Label)
                .top(10)
                .left(10)
                .font("11px helvetica")
                .text("Tick Legend");
        legend.add(pv.Bar)
                .data(dataObj.ticks.label_map)
                .left(10)
                .top(function() {return 20 + 15*this.index;} )
                .fillStyle(function(d) {return tick_fill(d.key);})
                .width(36)
                .height(12)
                .anchor("right").add(pv.Label)
                .text(function(d) { return d.label;})
                .font("11px helvetica")
                .textMargin(6)
                .textAlign("left");
    }
};

/**private **/
vq.CircVis.prototype._add_wedge = function(index,outerRadius) {
    var dataObj = this.chromoData, dot;
    var width = this.width(), height = this.height();
    var outerPlotRadius = outerRadius - dataObj._wedge[index]._outer_padding;
    var innerRadius = outerPlotRadius - dataObj._wedge[index]._plot_height;

    this.wedge_layer[index] = this.event_panel.add(pv.Wedge)
            .data(dataObj._chrom.keys)
            .left(width/2)
            .top(height/2)
            .innerRadius(innerRadius)
            .outerRadius(outerPlotRadius)
            .angle(function(d) { return dataObj.normalizedLength[d] * 2 * Math.PI;} )
            .startAngle(function(d) { return dataObj.startAngle_map[d]; } )
            //.fillStyle("#ddd")
	    .fillStyle("#F8F8F8")	
            //.strokeStyle("#444")
            .lineWidth(1)
            .overflow("hidden")
            .add(pv.Wedge)
            .innerRadius(innerRadius)
            .outerRadius(outerPlotRadius)
            .lineWidth(1)
            .strokeStyle("#444");

    if ((dataObj._wedge[index]._plot_type != 'karyotype') &&
        (dataObj._wedge[index]._plot_type != 'tile') &&
        (dataObj._wedge[index]._plot_type != 'band') &&
        (dataObj._wedge[index]._plot_type != 'glyph')) {
        if (isNaN(dataObj._wedge[index]._min_plotValue) || isNaN(dataObj._wedge[index]._max_plotValue)) {
            console.warn('Range of values for ring with index (' + index +') not detected.  Data has not been plotted.');
            return;
        }
    }

    if (dataObj._wedge[index]._min_plotValue == dataObj._wedge[index]._max_plotValue) {
        dataObj._wedge[index]._min_plotValue = dataObj._wedge[index]._min_plotValue - 1;
        dataObj._wedge[index]._max_plotValue = dataObj._wedge[index]._max_plotValue + 1;
    }

    var range_mean = dataObj._wedge[index]._base_plotValue != null ? dataObj._wedge[index]._base_plotValue :
        (dataObj._wedge[index]._min_plotValue+ dataObj._wedge[index]._max_plotValue) / 2;
    var y_axis = pv.Scale.linear(dataObj._wedge[index]._min_plotValue, dataObj._wedge[index]._max_plotValue).range(innerRadius,outerPlotRadius);
    var thresholded_innerRadius = function(d) { return Math.max(y_axis(Math.min(d,range_mean)),innerRadius); };
    var thresholded_outerRadius = function(d) { return Math.min(y_axis(Math.max(d,range_mean)),outerPlotRadius); };
    var thresholded_value_to_radius = function(d) { return Math.min(Math.max(y_axis(d),innerRadius),outerPlotRadius); };
    var thresholded_radius = function(d) { return Math.min(Math.max(d,innerRadius),outerPlotRadius); };
    var thresholded_tile_innerRadius = function(c,d) { return innerRadius + (d._tile_height + d._tile_padding) * c.level;};
    var thresholded_tile_outerRadius = function(c,d) { return innerRadius + ((d._tile_height + d._tile_padding) * c.level) + d._tile_height;};
    var glyph_distance = function(c,d) { return (((d._tile_height + d._tile_padding) * c.level)
        + innerRadius + (d._radius() * 2));};
    var checked_endAngle = function(c,d) {
    if (dataObj._chrom.keys.length == 1) {
        return Math.min(dataObj.startAngle_map[d] + dataObj.theta[d](c.end||c.start+1),dataObj.startAngle_map[dataObj._chrom.keys[0]] + (Math.PI * 2));
    }
    else if (this.parent.index+1 == dataObj._chrom.keys.length) { 
        return Math.min(dataObj.startAngle_map[d] + dataObj.theta[d](c.end||c.start+1),dataObj.startAngle_map[dataObj._chrom.keys[0]] + (Math.PI * 2));
    }   
        else {return Math.min(dataObj.startAngle_map[d] + dataObj.theta[d](c.end||c.start+1),
            dataObj.startAngle_map[dataObj._chrom.keys[(this.parent.index+1)%dataObj._chrom.keys.length]]);
        }
    };
    var feature_angle = function(d) { return dataObj.startAngle_map[d.chr] + dataObj.theta[d.chr](d.start); };

    var value_key = dataObj._wedge[index]._value_key;

    var behavior = function(d) {
        return (pv.Behavior.hovercard(
            {
                include_header : false,
                include_footer : true,
                self_hover : true,
                timeout: dataObj._plot.tooltip_timeout,
                data_config :
                    dataObj._wedge[index]._tooltipItems,
                tool_config : dataObj._wedge[index]._tooltipLinks
            }
        ).call(this,d));};
    //add a new panel each time we want to draw on top of the previously created image.
    var panel_layer = this.event_panel.add(pv.Panel)
            .fillStyle(null)
            .data(dataObj._chrom.keys);

    switch (dataObj._wedge[index]._plot_type) {
        case 'histogram':
                if(dataObj._wedge[index]._draw_axes) {
            /* Circular grid lines. */
             dot = this.event_panel.add(pv.Dot)
                    .data(y_axis.ticks(4))
                    .fillStyle(null)
                    .strokeStyle("#444")
                    .lineWidth(1)
                    .radius(function(i) { return y_axis(i); } );
            dot.anchor("top").add(pv.Label)
                    .textBaseline("middle")
                    .textAlign("right")
                    .text(function(i) {return y_axis.tickFormat(i);});
            dot.anchor("bottom").add(pv.Label)
                    .textBaseline("middle")
                    .textAlign("right")
                    .text(function(i) {return y_axis.tickFormat(i);});
                    }
            panel_layer.add(pv.Wedge)   //histogram
                .data(function(d) { return dataObj._wedge[index]._chr_map[d];})
                .startAngle(function(c,d) { return dataObj.startAngle_map[d] + dataObj.theta[d](c.start);   })
                .endAngle(checked_endAngle)
                .innerRadius(function(c) { return thresholded_innerRadius(c[value_key]);} )
                .outerRadius(function(c) { return thresholded_outerRadius(c[value_key]); } )
                .strokeStyle(dataObj._wedge[index]._strokeStyle)
                .fillStyle(dataObj._wedge[index]._fillStyle)
                .cursor('pointer')
                .event('click',function(c,d){ dataObj._wedge[index].listener(c);} )
                .event('mouseover',behavior);
            break;
        case 'scatterplot':
            if(dataObj._wedge[index]._draw_axes) {
                dot = this.event_panel.add(pv.Dot)
                        .data(y_axis.ticks(4))
                        .fillStyle(null)
                        .strokeStyle("#444")
                        .lineWidth(1)
                        .radius(function(i) { return y_axis(i); } );
                dot.anchor("top").add(pv.Label)
                        .textBaseline("middle")
                        .textAlign("right")
                        .text(function(i) {return y_axis.tickFormat(i);});
                dot.anchor("bottom").add(pv.Label)
                        .textBaseline("middle")
                        .textAlign("right")
                        .text(function(i) {return y_axis.tickFormat(i);});
            }
            panel_layer.add(pv.Dot) //scatterplot
                    .data(function(d) { return dataObj._wedge[index]._chr_map[d];})
                    .left(function(c,d) { return width/2 + (thresholded_value_to_radius(c[value_key]) * Math.cos(feature_angle(c))); })
                    .bottom(function(c,d) { return height/2 + (-1 * (thresholded_value_to_radius(c[value_key])) * Math.sin(feature_angle(c))); })
                    .shape(dataObj._wedge[index]._shape)
                    .radius(dataObj._wedge[index]._radius)
                    .strokeStyle(dataObj._wedge[index]._strokeStyle)
                    .fillStyle(dataObj._wedge[index]._fillStyle)
                    .cursor('pointer')
                    .event('click',function(c,d){ dataObj._wedge[index].listener(c);} )
                    .event('mouseover',behavior);
            break;
        case 'glyph':
            panel_layer.add(pv.Dot) //glyph
                    .data(function(d) { return dataObj._wedge[index]._chr_map[d];})
                    .left(function(c,d) { return width/2 + (glyph_distance(c,dataObj._wedge[index])) *  Math.cos(feature_angle(c)); })
                    .bottom(function(c,d) { return height/2 + (-1 * glyph_distance(c,dataObj._wedge[index]) * Math.sin(feature_angle(c))); })
                    .shape(dataObj._wedge[index]._shape)
                    .radius(dataObj._wedge[index]._radius)
                    .strokeStyle(dataObj._wedge[index]._strokeStyle)
                    .fillStyle(dataObj._wedge[index]._fillStyle)
                    .cursor('pointer')
                    .event('click',function(c,d){ dataObj._wedge[index].listener(c);} )
                    .event('mouseover',behavior);
            break;
            case 'band':
            panel_layer.add(pv.Wedge)   //tile
                .data(function(d) { return dataObj._wedge[index]._chr_map[d];})
                .startAngle(function(c,d) { return dataObj.startAngle_map[d] + dataObj.theta[d](c.start); })
                .endAngle(checked_endAngle)
                .innerRadius(innerRadius )
                .outerRadius(outerPlotRadius )
                .strokeStyle(dataObj._wedge[index]._strokeStyle)
                .fillStyle(dataObj._wedge[index]._fillStyle)
                .cursor('pointer')
                .event('click',function(c,d){ dataObj._wedge[index].listener(c);} )
                .event('mouseover',behavior);
            break;
        case 'tile':
            panel_layer.add(pv.Wedge)   //tile
                .data(function(d) { return dataObj._wedge[index]._chr_map[d];})
                .startAngle(function(c,d) { return dataObj.startAngle_map[d] + dataObj.theta[d](c.start); })
                .endAngle(checked_endAngle)
                .innerRadius(function(c,d) { return thresholded_tile_innerRadius(c,dataObj._wedge[index]);} )
                .outerRadius(function(c,d) { return thresholded_tile_outerRadius(c,dataObj._wedge[index]);} )
                .strokeStyle(dataObj._wedge[index]._strokeStyle)
                .fillStyle(dataObj._wedge[index]._fillStyle)
                .cursor('pointer')
                .event('click',function(c,d){ dataObj._wedge[index].listener(c);} )
                .event('mouseover',behavior);
            break;
        case 'heatmap':
            panel_layer.add(pv.Wedge)   //heatmap plot of cnv
                .data(function(d) { return dataObj._wedge[index]._chr_map[d];})
                .startAngle(function(c,d) { return dataObj.startAngle_map[d] + dataObj.theta[d](c.start); })
                .endAngle(function(c,d) {
                    if (this.parent.index+1 == dataObj._chrom.keys.length) { return dataObj.startAngle_map[dataObj._chrom.keys[0]] + (Math.PI * 2);}
                    else {return Math.min(dataObj.startAngle_map[d] + dataObj.theta[d](c.end||c.start+1),
                        dataObj.startAngle_map[dataObj._chrom.keys[(this.parent.index+1)%dataObj._chrom.keys.length]]);
                    }
                })
                .innerRadius(thresholded_innerRadius(dataObj._wedge[index]._min_plotValue) )
                .outerRadius(thresholded_outerRadius(dataObj._wedge[index]._max_plotValue) )
                .strokeStyle(dataObj._wedge[index]._strokeStyle)
                .fillStyle(dataObj._wedge[index]._fillStyle)
                .cursor('pointer')
                .event('click',function(c,d){ dataObj._wedge[index].listener(c);} )
                .event('mouseover',behavior);
            break;
        case 'karyotype':
            panel_layer.add(pv.Wedge)   //karyotype
                .data(function(d) { return dataObj._wedge[index]._chr_map[d];})
                .startAngle(function(c,d) { return dataObj.startAngle_map[d] + dataObj.theta[d](c.start); })
                .endAngle(checked_endAngle)
                .innerRadius(innerRadius )
                .outerRadius(outerPlotRadius )
                .fillStyle( function(d) {return d[value_key];})
                .cursor('pointer')
                .event('click',function(c,d){ dataObj._wedge[index].listener(c);} )
                .event('mouseover',behavior);
            break;
        default:
            console.warn('No plot type definition detected.');
    }

};

/** private **/
vq.CircVis.prototype._add_network = function () {
    var     dataObj = this.chromoData,
            w = this.width(),
            h = this.height();
    var network_radius = dataObj._network.radius;
    var node_behavior = function(d) {
       return (pv.Behavior.hovercard(
       {
           include_header : false,
           include_footer : false,
           self_hover : true,
           timeout : dataObj._plot.tooltip_timeout,
           data_config : dataObj._network.node_tooltipItems,
           tool_config : dataObj._network.node_tooltipLinks
       }
               ).call(this,d),

        dataObj.network_panel.activeNetworkNode(this.index),
        populateConnectedNodes(this.index),
        dataObj.network_panel.render()
        );};
    re.ui.setPathwayBarBehavior(function(d, index){
	return (
	dataObj.network_panel.activeNetworkNode(index),
        populateConnectedNodes(index),
        dataObj.network_panel.render()
    );});
    re.ui.setPathwayBarBehaviorReset(function(){
       return (
    		dataObj.network_panel.activeNetworkNode(null),
        	dataObj.network_panel.connectedToActiveNetworkNode([]),
		dataObj.network_panel.render()
       );
    });
    var link_behavior = function(c,d) {
       return (pv.Behavior.hovercard(
       {
           include_header : false,
           include_footer : false,
           self_hover : true,
           param_data : true,
           timeout : dataObj._plot.tooltip_timeout,
           data_config :
           dataObj._network.link_tooltipItems,
           tool_config :
           dataObj._network.link_tooltipLinks
       }
               ).call(this,d),

        dataObj.network_panel.activeNetworkLink(this.parent.index),
        dataObj.network_panel.render()
        );};

    var feature_angle = function(d) { return dataObj.startAngle_map[d.chr] + dataObj.theta[d.chr](d.start); };

    var network_node_y = dataObj._network.tile_nodes ?
                    function(d) { return h/2 + (-1 * (network_radius - (d.level * 10)) * Math.sin(feature_angle(d))); }  :
                  function(d) { return h/2 + (-1 * (network_radius) * Math.sin(feature_angle(d))) };
    var network_node_x = dataObj._network.tile_nodes ?
            function(d) { return w/2 + ((network_radius - (d.level * 10)) * Math.cos(feature_angle(d))); } :
            function(d) { return w/2 + ((network_radius) * Math.cos(feature_angle(d))); };
    var node_angle = function(d) { return feature_angle(d) + Math.PI /2;};

    var link_color = function(link) {return pv.color(dataObj._network.link_strokeStyle(link));};
    /** @private */
    var node_colors;

        if (dataObj._network.node_fillStyle() == 'ticks') {
            node_colors = function(node) { return dataObj.ticks.fill_style(node);};
        } else {
            node_colors =  function(node) {return pv.color(dataObj._network.node_fillStyle(node));};
        }

    var node_stroke =  function(node) {return pv.color(dataObj._network.node_strokeStyle(node));};

    var link_active = function(c,d)  {return (dataObj.network_panel.activeNetworkNode() == null ||
            this.parent.index == dataObj.network_panel.activeNetworkLink() ||
            d.source == dataObj.network_panel.activeNetworkNode() ||
            d.target == dataObj.network_panel.activeNetworkNode()) &&
            (linkDegreeInBounds(d.sourceNode) || linkDegreeInBounds(d.targetNode));};

    var link_width_active = function(node, link) {
        return (this.parent.index == dataObj.network_panel.activeNetworkLink() ||
                link.source == dataObj.network_panel.activeNetworkNode() ||
                link.target == dataObj.network_panel.activeNetworkNode() ) ?
                dataObj._network.link_line_width(node, link) + 1.0 : dataObj._network.link_line_width(node, link);
    };

    function link_angle(node, link) {
        return (feature_angle(link.sourceNode) - feature_angle(link.targetNode) <= -1 * Math.PI) ? "polar" :
                (feature_angle(link.sourceNode) - feature_angle(link.targetNode) >= Math.PI) ? "polar-reverse" :
                        (feature_angle(link.sourceNode) - feature_angle(link.targetNode) >= 0) ? "polar" : "polar-reverse";
    }

    function link_eccentricity(c, d) {
        return Math.round(Math.pow(Math.sin(Math.abs(feature_angle(d.sourceNode) - feature_angle(d.targetNode))/ 2 ) ,4)*100)/100;
    }

    var link_visible = function(c,d) { return true;};

    switch(dataObj._network.node_highlightMode) {
        case('isolate'):
            link_visible = link_active;
            break;
        case('brighten'):
        default:
    }

    function link_strokeStyle(c,d) {
        return (this.parent.index == dataObj.network_panel.activeNetworkLink() ||
                d.source == dataObj.network_panel.activeNetworkNode() ||
                d.target == dataObj.network_panel.activeNetworkNode() ) ?
                link_color(d).darker(2).alpha(dataObj._network.link_alpha(d)) :
                link_color(d).alpha(dataObj._network.link_alpha(d) );
    }
    function linkDegreeInBounds(node) {
        return ( dataObj._network.min_node_linkDegree == null ? true : node.linkDegree >= dataObj._network.min_node_linkDegree) &&
                ( dataObj._network.max_node_linkDegree == null ? true : node.linkDegree <= dataObj._network.max_node_linkDegree);
    }

    function populateConnectedNodes(nodes_array_index) {
        var nodes1 = dataObj._network.links_array.filter(function(d) {
            return d.source == nodes_array_index;}).map(function(b) {
            return {node:b.targetNode,linkValue:b.linkValue};
        });
        var nodes2 = dataObj._network.links_array.filter(function(d) {
            return d.target == nodes_array_index;}).map(function(b) {
            return {node:b.sourceNode,linkValue:b.linkValue};
        });
        dataObj.network_panel.connectedToActiveNetworkNode(nodes1.concat(nodes2));
    }

    function link_listener(c,link) {
        dataObj._network.link_listener(link);
    }

    dataObj.network_panel = this.event_panel.add(pv.Layout.Network)
            .def('connectedToActiveNetworkNode', [])
            .def('activeNetworkNode', null)
            .def('activeNetworkLink', null)
            .nodes(dataObj._network.nodes_array)
            .links(dataObj._network.links_array);

    dataObj.network_panel.link.add(pv.Line)
            .visible(link_visible)
            .interpolate(link_angle)
            .strokeStyle(link_strokeStyle)
            .eccentricity(link_eccentricity)
            .cursor('pointer')
            .event('mouseover',link_behavior)
            .event('mouseout', function() {
        dataObj.network_panel.activeNetworkLink(null);
        dataObj.network_panel.render();
    })
            .event('click', link_listener)
            .lineWidth(link_width_active);

    dataObj.network_panel.node
            .bottom(network_node_y)
            .left(network_node_x)
            .fillStyle(function(c,d) { return node_colors(c).alpha(0.9); })
            .strokeStyle(function(c) { return node_stroke(c).alpha(0.9); });

    dataObj.network_panel.node.add(pv.Dot)
            .shape('dot')
            .lineWidth(1)
            .radius(2.0)
            .angle(node_angle)
            .event('mouseover',node_behavior)
            //.title(dataObj._network.node_tooltipFormat)
            .event('mouseout', function() {
        dataObj.network_panel.activeNetworkNode(null);
        dataObj.network_panel.connectedToActiveNetworkNode([]);
        dataObj.network_panel.render();
    })
            .cursor('pointer')
            .event('click', function(c) {
        dataObj._network.node_listener(c, dataObj.network_panel.connectedToActiveNetworkNode());
    });
};

/** private **/
vq.CircVis.prototype._add_legend = function() {
    var  dataObj = this.chromoData,
            h = this.height(),
        w = this.width();
        
    var radius = dataObj._plot.legend_radius,
            diameter = radius * 2,
            corner = dataObj._plot.legend_corner;

    var legend = this.event_panel.add(pv.Panel)
            .width(diameter+20)
            .height(diameter+(dataObj._wedge.length*10))
            .title('Legend');
    var rings = legend.add(pv.Panel)
                .bottom(0)
                .left(0)
                .data(pv.range(0,dataObj._wedge.length));

    switch(corner) {
        case 'ne' :
            legend.right(0).top(0);
            break;
        case 'se' :
            legend.right(0).bottom(0);
            break;
        case 'sw' :
            legend.left(0).bottom(0);
            break;
        case 'nw' :
        default :
            legend.left(0).top(0);
    }

    var legend_color = pv.Colors.category10(0,dataObj._wedge.length);
    var legend_rings = radius - 5;
    var ring_width = Math.min(legend_rings / dataObj._wedge.length, 5);
   var ring_space = 2;

    var legend_outerRadius = function(i) {
        return  radius - (i*(ring_width + ring_space)) ;
    };
    var legend_innerRadius = function(i) {
        return  Math.min((legend_outerRadius(i) - ring_width),legend_outerRadius(i) - 2);
    };

   if(dataObj._plot.legend_show_rings) {
       rings.add(pv.Wedge)
            .outerRadius(legend_outerRadius)
            .innerRadius(legend_innerRadius)
            .title(function(c) { return dataObj._wedge[c]._legend_desc;})
            .lineWidth(0)
        .angle(Math.PI * 2)
            .fillStyle(legend_color)
            .strokeStyle(legend_color)
            .left(radius+10)
            .bottom(radius);
   }
        rings.add(pv.Bar)
            .top(function(c) {return c*10;} )
            .height(10)
            .title(function(c) { return dataObj._wedge[c]._legend_desc;})
            .fillStyle(null)
            .lineWidth(0)
            .strokeStyle(null)
         .add(pv.Label)
            .textStyle(legend_color)
            .textAlign('center')
            .font("11px helvetica")
            .text(function(c) { return dataObj._wedge[c]._legend_label;});
};

/** private **/

vq.CircVis.prototype._render = function() {
    var     dataObj = this.chromoData,
            w = this.width(),
            h = this.height();

    var container = this.container();
    var outerRadius = h/2;
    var verticalPadding = this.vertical_padding(), horizontalPadding = this.horizontal_padding();


    this.vis = new pv.Panel()
            .width(w)
            .height(h)
            .bottom(verticalPadding)
            .left(horizontalPadding)
            .right(horizontalPadding)
            .top(verticalPadding)
            .fillStyle(null)
            .canvas(container);

    this.event_panel = this.vis.add(pv.Panel)
            .events('all')
            .data([{x:0, y: 0, dx:w, dy:h}])
            .left(function(d) { return d.x;})
            .fillStyle(null)
            .bottom(function(d) { return d.y});
    if ( dataObj._plot.enable_pan) {this.event_panel.event("mousedown",pv.Behavior.pan());}
    if ( dataObj._plot.enable_zoom) {this.event_panel.event("mousewheel",pv.Behavior.zoom());}

    var tick_padding = 0;

    if (dataObj.ticks._data_array != undefined) {
        this._add_ticks(outerRadius);
        tick_padding =  dataObj.ticks.outer_padding + dataObj.ticks.height;
    }
    this.wedge_layer=[];
    if (dataObj._wedge != undefined) {
        for(var i = 0; i < dataObj._wedge.length; i++){
            var wedge_outerRadius =
                    outerRadius -
                            (pv.sum(dataObj._wedge.slice(0,i), function(a) { return a._plot_height;}) + pv.sum(dataObj._wedge.slice(0,i), function(a) { return a._outer_padding;})) -
                            (tick_padding);
            this._add_wedge(i,wedge_outerRadius);
        }
    }

var wedge_width = 0;
if (dataObj._wedge === undefined && dataObj._wedge.length > 0) {
       wedge_width = dataObj._wedge[0]._outer_padding;
}

    var label_wedge = this.event_panel.add(pv.Wedge)
            .data(dataObj._chrom.keys)
            .left(w/2)
            .top(h/2)
            .innerRadius(outerRadius-wedge_width)
            .outerRadius(outerRadius)
            .angle(function(d) { return dataObj.normalizedLength[d] * 2 * Math.PI;} )
            .startAngle(function(d) { return dataObj.startAngle_map[d]; } )
            .fillStyle(null)
            .strokeStyle(null)
            .lineWidth(0);

    switch ( dataObj._chrom.label_layout_style) {
        case ('clock'):
            var dot = label_wedge.anchor("outer").add(pv.Dot)  //chromosome labels
                    .fillStyle('rgba(140,140,140,0.7)')
                    .strokeStyle('rgba(255,255,255,0.9)')
                    .lineWidth(1)
                    .radius(14);
            dot.anchor("center").add(pv.Label)
                    .textAlign("center")
                    .font(dataObj._chrom.label_font_style)
                    .textAngle(0);
            if (dataObj._chrom.listener != null) {
                dot.events('all')
                        .cursor('pointer')
                        .event('click',function(key){dataObj._chrom.listener(this.data());});
            }
            break;
        case ('default'):
        default:
            label_wedge.anchor("center").add(pv.Label)
                    .textAlign("center")
                    .font(dataObj._chrom.label_font_style);
            if (dataObj._chrom.listener != null) {
                label_wedge.events('all')
                        .cursor('pointer')
                        .event('click',function(key){dataObj._chrom.listener(this.data());});
            }
            break;
    }

    var plot_radius = outerRadius -
            (pv.sum(dataObj._wedge, function(a) { return a._plot_height;}) + pv.sum(dataObj._wedge, function(a) { return a._outer_padding;}) +
                    tick_padding);

    if(    dataObj._chrom.radial_grid_line_width != null &&
            dataObj._chrom.radial_grid_line_width > 0) {
        var radial_lines = this.event_panel.add(pv.Wedge)
                .data(dataObj._chrom.keys)
                .left(w/2)
                .top(h/2)
                .innerRadius(plot_radius)
                .outerRadius(outerRadius)
                .angle(0)
                .startAngle(function(d) { return dataObj.startAngle_map[d]; } )
                .fillStyle(null)
                .strokeStyle('#333')
                .lineWidth(dataObj._chrom.radial_grid_line_width);
    }

    if (dataObj._network.data != undefined) {
        dataObj._network.radius =
                plot_radius - (dataObj._network._outer_padding);
        this._add_network();
    }
    if (dataObj._plot.show_legend) {
        this._add_legend();
    }
    this.vis.render();
};

/**
 *
 * @class Internal data model for Circvis tool.
 *
 * @param data {JSON object} - Object described previously.
 * @extends vq.models.VisData
 */
vq.models.CircVisData = function(data) {

    vq.models.VisData.call(this,data);

    this.setDataModel();


    if (this.getDataType() == 'vq.models.CircVisData') {
        this._build_data(this.getContents())
    } else {
        console.warn('Unrecognized JSON object.  Expected vq.models.CircVisData object.');
    }
};


vq.models.CircVisData.prototype = pv.extend(vq.models.VisData);

vq.models.CircVisData.prototype.setDataModel = function() {
 this._dataModel = [
     {label: 'width', id: 'PLOT.width', defaultValue: 400},
     {label: 'height', id: 'PLOT.height', defaultValue: 400},
     {label : 'container', id:'PLOT.container', optional : true},
         {label: 'vertical_padding', id: 'PLOT.vertical_padding', defaultValue: 0},
         {label: 'horizontal_padding', id: 'PLOT.horizontal_padding', defaultValue: 0},
    {label : '_chrom.keys', id: 'GENOME.DATA.key_order', defaultValue : ["1","2","3","4","5","6","7","8","9","10",
                                                        "11","12","13","14","15","16","17","18","19","20","21","22","X","Y"] },
    {label : '_chrom.length', id: 'GENOME.DATA.key_length', defaultValue : [] },
    {label : '_chrom.reverse_list', id: 'GENOME.OPTIONS.key_reverse_list', optional : true },
    {label : '_chrom.label_layout_style', id: 'GENOME.OPTIONS.label_layout_style', defaultValue : 'default' },
    {label : '_chrom.label_font_style', id: 'GENOME.OPTIONS.label_font_style', cast: String, defaultValue : "16px helvetica, monospaced" },
    {label : '_chrom.radial_grid_line_width', id: 'GENOME.OPTIONS.radial_grid_line_width', cast : Number, defaultValue : null },
    {label : '_chrom.listener', id: 'GENOME.OPTIONS.listener', cast: Function, defaultValue : function() {return null;}},
    {label : '_plot.enable_pan', id: 'PLOT.enable_pan', cast: Boolean, defaultValue : false },
    {label : '_plot.enable_zoom', id: 'PLOT.enable_zoom', cast: Boolean, defaultValue : false },
    {label : '_plot.show_legend', id: 'PLOT.show_legend', cast: Boolean, defaultValue : false },
    {label : '_plot.legend_corner', id: 'PLOT.legend_corner', cast: String, defaultValue : 'ne' },
    {label : '_plot.legend_radius', id: 'PLOT.legend_radius', cast: Number, defaultValue : 25 },
     {label : '_plot.legend_show_rings', id: 'PLOT.legend_show_rings', cast: Boolean, defaultValue : true },
    {label : '_plot.rotate_degrees', id: 'PLOT.rotate_degrees', cast: Number, defaultValue : 0 },
     {label : '_plot.tooltip_timeout', id: 'PLOT.tooltip_timeout', cast: Number, defaultValue : 200 },
    {label : '_network.data', id: 'NETWORK.DATA.data_array',  optional : true },
    //{label : '_network.radius', id: 'NETWORK.OPTIONS.network_radius', cast : Number, defaultValue : 100 },
    {label : '_network._outer_padding', id: 'NETWORK.OPTIONS.outer_padding',  optional : true },
    {label : '_network.node_listener', id: 'NETWORK.OPTIONS.node_listener', cast: Function, defaultValue : function() {return null;} },
    {label : '_network.link_listener', id: 'NETWORK.OPTIONS.link_listener', cast: Function, defaultValue : function() {return null;} },
         {label : '_network.link_tooltipItems', id: 'NETWORK.OPTIONS.link_tooltip_items',
             defaultValue :  { 'Node 1 Chr' : 'sourceNode.chr', 'Node 1 Start' : 'sourceNode.start', 'Node1 End' : 'sourceNode.end',
             'Node 2 Chr' : 'targetNode.chr', 'Node 2 Start' : 'targetNode.start', 'Node 2 End' : 'targetNode.end'} },
      {label : '_network.link_tooltipLinks', id: 'NETWORK.OPTIONS.link_tooltip_links',  defaultValue : {} },
    {label : '_network.link_line_width', id: 'NETWORK.OPTIONS.link_line_width', cast : vq.utils.VisUtils.wrapProperty,
        defaultValue : function(node,link) { return 1; }},
    {label : '_network.link_alpha', id: 'NETWORK.OPTIONS.link_alpha', cast : vq.utils.VisUtils.wrapProperty,  defaultValue : function() {return 0.7;} },
    {label : '_network.link_strokeStyle', id: 'NETWORK.OPTIONS.link_stroke_style', cast : vq.utils.VisUtils.wrapProperty, defaultValue : function() { return 'red';} },
    {label : '_network.node_fillStyle', id: 'NETWORK.OPTIONS.node_fill_style', cast : vq.utils.VisUtils.wrapProperty, defaultValue : function() { return 'blue';} },
    {label : '_network.node_strokeStyle', id: 'NETWORK.OPTIONS.node_stroke_style', cast : vq.utils.VisUtils.wrapProperty, defaultValue : function() { return 'blue';} },
    {label : '_network.node_key', id: 'NETWORK.OPTIONS.node_key', cast : Function, defaultValue : function(node) { return node['chr'];} },
    {label : '_network.node_highlightMode', id: 'NETWORK.OPTIONS.node_highlight_mode', cast : String, defaultValue : 'brighten' },
    {label : '_network.node_tooltipFormat', id: 'NETWORK.OPTIONS.node_tooltipFormat', cast : vq.utils.VisUtils.wrapProperty, defaultValue : vq.utils.VisUtils.network_node_title },
    {label : '_network.node_tooltipItems', id: 'NETWORK.OPTIONS.node_tooltip_items', defaultValue :  { Chr : 'chr', Start : 'start', End : 'end'} },
     {label : '_network.node_tooltipLinks', id: 'NETWORK.OPTIONS.node_tooltip_links',  defaultValue : {} },
    {label : '_network.max_node_linkDegree', id: 'NETWORK.OPTIONS.max_node_linkdegree', cast : Number, defaultValue :  9999 },
    {label : '_network.min_node_linkDegree', id: 'NETWORK.OPTIONS.min_node_linkdegree', cast : Number, defaultValue :  0 },
         {label : '_network.node_overlap_distance', id: 'NETWORK.OPTIONS.node_overlap_distance', cast : Number, defaultValue :  12000000.0},
    {label : '_network.tile_nodes', id: 'NETWORK.OPTIONS.tile_nodes', cast : Boolean, defaultValue : false },
         {label : 'ticks.tooltipItems', id: 'TICKS.OPTIONS.tooltip_items', defaultValue :  { Chr : 'chr', Start : 'start', End : 'end', Label:'value'} },
     {label : 'ticks.tooltipLinks', id: 'TICKS.OPTIONS.tooltip_links',  defaultValue : {} },
    {label : 'ticks.label_map', id: 'TICKS.OPTIONS.label_map', defaultValue:[{key:'',label:''}]},

    {label : 'ticks.label_key', id: 'TICKS.OPTIONS.label_key', defaultValue:'value',cast: String},
    {label : 'ticks._data_array', id: 'TICKS.DATA.data_array',  optional : true },
    {label : 'ticks.height', id: 'TICKS.OPTIONS.height', cast : Number, defaultValue: 60 },
    {label : 'ticks.wedge_width', id: 'TICKS.OPTIONS.wedge_width', cast : Number, defaultValue: 0.5 },
    {label : 'ticks.wedge_height', id: 'TICKS.OPTIONS.wedge_height', cast : Number, defaultValue: 10 },
    {label : 'ticks.outer_padding', id: 'TICKS.OPTIONS.outer_padding', cast : Number, defaultValue: 0 },
    {label : 'ticks.listener', id: 'TICKS.OPTIONS.listener', cast : Function, defaultValue : function() {return null;} },
    {label : 'ticks.display_legend', id: 'TICKS.OPTIONS.display_legend', cast : Boolean, defaultValue : true },
    {label : 'ticks.legend_corner', id: 'TICKS.OPTIONS.legend_corner', cast : String, defaultValue : 'nw' },
     {label : 'ticks.tile_ticks', id: 'TICKS.OPTIONS.tile_ticks', cast : Boolean, defaultValue: true },
    {label : 'ticks.overlap_distance', id: 'TICKS.OPTIONS.overlap_distance', cast : Number, optional: true},
    {label : 'ticks.fill_style', id: 'TICKS.OPTIONS.fill_style', cast : vq.utils.VisUtils.wrapProperty, defaultValue : function() { return pv.color('red');}},
     {label : 'ticks.stroke_style', id: 'TICKS.OPTIONS.stroke_style', cast : vq.utils.VisUtils.wrapProperty, defaultValue : function() { return pv.color('white');}},
     {label : '_wedge' , id:'WEDGE', optional : true}
    ];
};

vq.models.CircVisData.prototype._build_data = function(data_struct) {
    var data = data_struct;

    this._processData(data);

    if (this._wedge) {
        this._wedge = this._wedge.map(function(b) {
            return new vq.models.CircVisData.WedgeData(b);
        });
    }

    this._setupData();
};


vq.models.CircVisData.prototype._setupData =  function() {
    var chrom_keys_order,chrom_length_map,chrom_length_array=[],cnv_map, startAngle={},
            cnv_array, cnv_height= [], startAngle_map={},normalizedLength={},
            deviation =[],median =[], theta={}, totalChromLength;
    this.normalizedLength,this.theta=[],this.startAngle_map;

    var that = this;

    if (this._chrom.keys == [] || this._chrom.length == []) {
        console.warn('Chromosome/Ideogram information has not been detected.  Please verify that keys and length/key mappings have been ' +
                'passed into the GENOME.DATA object.');
        return;
    }

    var chrom_keys_array = this._chrom.keys;       //array in pre-sorted order
    chrom_keys_order= pv.numerate(chrom_keys_array);

    chrom_length_array = this._chrom.length.filter(function(d) {return chrom_keys_order[d['chr_name']] != null;});
    chrom_length_array.sort(function(c,d) {return chrom_keys_order[c['chr_name']] - chrom_keys_order[d['chr_name']] > 0;});  //sort by given order
    totalChromLength = pv.sum(chrom_length_array, function(d) { return d['chr_length'];} );

    chrom_length_map = pv.nest( chrom_length_array )
            .key( function(d) { return d['chr_name'].toUpperCase();} )
            .sortKeys(function(c,d) {return chrom_keys_order[c['chr_name']] - chrom_keys_order[d['chr_name']] > 0;})  //sort by given order
            .map();

    normalizedLength = pv.dict(chrom_keys_array, function(d) { return chrom_length_map[d.toUpperCase()][0]['chr_length'] / totalChromLength;});

    this.normalizedLength = normalizedLength;

    //for each index of chrom_keys ( pre-sorted)
    // sum all lengths from 1st index to last index of chrom_length (sorted to chrom_length)
    chrom_keys_array.forEach( function(d) {
        startAngle[d] = pv.sum(chrom_keys_array.slice(0,(chrom_keys_order[d])),
                              function() {
                                  return (normalizedLength[chrom_keys_array[this.index]] * 2 * Math.PI);} );

        theta[d] = pv.Scale.linear( 0 , chrom_length_map[d.toUpperCase()][0]['chr_length'])
                .range(0,2 * Math.PI * normalizedLength[d]);

        if ( that._chrom.reverse_list != undefined &&
                that._chrom.reverse_list.filter(function(c){return c == d;}).length > 0){  //defined as reversed!
            theta[d] = pv.Scale.linear( 0 , chrom_length_map[d.toUpperCase()][0]['chr_length'])
                    .range(2 * Math.PI * normalizedLength[d],0);

        } else {
            theta[d] = pv.Scale.linear( 0 , chrom_length_map[d.toUpperCase()][0]['chr_length'])
                    .range(0,2 * Math.PI * normalizedLength[d]);

        }
    });

    var rotation = (this._plot.rotate_degrees) * Math.PI /180;

    startAngle_map = pv.dict(chrom_keys_array,(function(d) {return startAngle[d] - (Math.PI / 2) + rotation; } ));
    this.startAngle_map = startAngle_map;
    this.theta = theta;

    if (this._wedge != undefined) {
        this._wedge.forEach(function(wedge,index) {

            if (wedge._plot_type == 'tile' || wedge._plot_type == 'glyph') {
                var  max_tile_level = wedge._tile_show_all_tiles ?
                    Math.floor((wedge._plot_height - (wedge._radius() * 4)) / (wedge._tile_height + wedge._tile_padding)) :
                    undefined;
                wedge._data = (wedge._plot_type =='tile' ? vq.utils.VisUtils.layoutChrTiles(wedge._data,wedge._tile_overlap_distance,max_tile_level) :
                    vq.utils.VisUtils.layoutChrTicks(wedge._data,wedge._tile_overlap_distance,max_tile_level));
            }

            cnv_map = pv.nest(wedge._data)
                .key(function(d) { return d.chr; } )
                .map();

            wedge._chr_map = [];
            wedge._chr_map = pv.dict(that._chrom.keys, function(d)
            { return cnv_map[d] === undefined ? [] : cnv_map[d];  });

            var value_label = wedge._value_key;
            deviation = pv.deviation(wedge._data, function(d) { return d[value_label];});
            median = pv.median(wedge._data, function(d) { return d[value_label];});

            wedge._min_plotValue =  (wedge._min_plotValue === undefined && !isNaN(deviation) && !isNaN(median)) ? parseFloat(((-1 * deviation) + median).toFixed(2)) : wedge._min_plotValue;
            wedge._max_plotValue = (wedge._max_plotValue === undefined && !isNaN(deviation) && !isNaN(median)) ?  parseFloat((deviation + median).toFixed(2)) : wedge._max_plotValue;

            delete wedge._data;
        }); //foreach
    }
    //------------------- NETWORK DATA
    var nodes = pv.dict(this._chrom.keys, function() { return {}; });
    var node_array=[];
    var links_array = [];
    var length;
    var index1,index2;
    if (this._network != undefined && this._network.data != undefined) {
        this._network.data.forEach(function(d) {
            index1 = null;
            index2 = null;
            if (nodes[d.node1.chr] != undefined){
                if (nodes[d.node1.chr][d.node1.start] === undefined ){
                    nodes[d.node1.chr][d.node1.start] = {};
                    if (nodes[d.node1.chr][d.node1.start][d.node1.source] === undefined ) {
                        var temp_node = d.node1;
                        temp_node.nodeName = d.node1.chr;
                        length = node_array.push(temp_node);
                        index1 = length - 1;
                        nodes[d.node1.chr][d.node1.start][d.node1.source] = index1;
                    } else {
                        index1 = nodes[d.node1.chr][d.node1.start][d.node1.source];
                    }
                } else {
                    index1 = nodes[d.node1.chr][d.node1.start][d.node1.source];
                }
            }
            if (nodes[d.node2.chr] != undefined) {
                if (nodes[d.node2.chr][d.node2.start] === undefined ) {
                    nodes[d.node2.chr][d.node2.start] = {};
                    if (nodes[d.node2.chr][d.node2.start][d.node2.source] === undefined ) {
                        var temp_node = d.node2;
                        temp_node.nodeName = d.node2.chr;
                        length = node_array.push(temp_node);
                        index2 = length - 1;
                        nodes[d.node2.chr][d.node2.start][d.node2.source] = index2;
                    } else {
                        index2 = nodes[d.node2.chr][d.node2.start][d.node2.source];
                    }
                } else {
                    index2 = nodes[d.node2.chr][d.node2.start][d.node2.source];
                }
            }

            if (index1 != null && index2 !=null) {
                //copy out useful properties
                var node = {source : index1, target : index2} ;
                for (var p in d) {
                    if (p != 'node1' && p!= 'node2') {
                        node[p] = d[p];
                    }
                }
                links_array.push(node);
            }
        });
        this._network.nodes_array = this._network.tile_nodes ?  vq.utils.VisUtils.layoutChrTiles(node_array,that._network.node_overlap_distance) : node_array;
        this._network.links_array = links_array;
        this._network.data = 'loaded';
        nodes = [];
        node_array = [];
        links_array = [];
    }

    if (this.ticks != undefined && this.ticks._data_array != undefined && this.ticks._data_array != null) {
        if (that.ticks.overlap_distance === undefined) {
            var overlap_ratio =  7000000.0 / 3080419480;
             that.ticks.overlap_distance = overlap_ratio * totalChromLength;
        }
    var tick_array = that.ticks.tile_ticks ? vq.utils.VisUtils.layoutChrTicks(that.ticks._data_array,that.ticks.overlap_distance) :
            that.ticks._data_array;
        
        var ticks_map = pv.nest(tick_array)
                .key(function(d) {return d.chr;})
                .map();

        this.ticks.data_map = pv.dict(that._chrom.keys, function(d)
        { return ticks_map[d] === undefined ? [] : ticks_map[d];  });
        this.ticks._data_array = [];
        delete tick_array;
        ticks_map = [];
    }
    this.setDataReady(true);
};


/**
 *
 * @class Internal data model for ring plots.
 *
 * @param data {JSON Object} - Configures a single ring plot.
 * @extends vq.models.VisData
 */
vq.models.CircVisData.WedgeData = function(data) {

    vq.models.VisData.call(this,{CONTENTS:data});

    this.setDataModel();
        this._build_data(this.getContents())

};

vq.models.CircVisData.WedgeData.prototype = pv.extend(vq.models.VisData);


vq.models.CircVisData.WedgeData.prototype.setDataModel = function() {
 this._dataModel = [
     {label : '_data', id: 'DATA.data_array', defaultValue : [ {"chr": "1", "end": 12784268, "start": 644269,
         "value": -0.058664}]},
     {label : '_value_key', id: 'DATA.value_key', defaultValue : 'value',cast: String },
     {label : 'listener', id: 'OPTIONS.listener', defaultValue :  function(a,b) {} },
     {label : '_plot_type', id: 'PLOT.type', defaultValue : 'histogram' },
     {label : '_plot_height', id: 'PLOT.height', cast: Number, defaultValue : 100 },
     {label : '_fillStyle', id: 'OPTIONS.fill_style', cast : vq.utils.VisUtils.wrapProperty, defaultValue : function(d) { return pv.color('red');} },
     {label : '_strokeStyle', id: 'OPTIONS.stroke_style', cast : vq.utils.VisUtils.wrapProperty, defaultValue : function(d) {return pv.color('red');} },
     {label : '_shape', id: 'OPTIONS.shape', cast : vq.utils.VisUtils.wrapProperty, defaultValue : function(d) {return 'circle';} },
     {label : '_radius', id: 'OPTIONS.radius', cast : vq.utils.VisUtils.wrapProperty, defaultValue : function(d) {return 2;} },
     {label : '_outer_padding', id: 'OPTIONS.outer_padding', cast : Number, defaultValue : 1 },
     {label : '_min_plotValue', id: 'OPTIONS.min_value',  cast : Number , optional : true },
     {label : '_max_plotValue', id: 'OPTIONS.max_value',  cast : Number , optional : true },
     {label : '_base_plotValue', id: 'OPTIONS.base_value', cast: Number, optional : true },
     {label : '_legend_label', id: 'OPTIONS.legend_label', cast: String, defaultValue : '' },
     {label : '_legend_desc', id: 'OPTIONS.legend_description', cast: String, defaultValue : '' },
     {label : '_draw_axes', id: 'OPTIONS.draw_axes', cast: Boolean, defaultValue : true },
     {label : '_tooltipFormat', id: 'OPTIONS.tooltipFormat', cast :vq.utils.VisUtils.wrapProperty,
         defaultValue : function(c,d) { return "Chr " + d + "\nStart: " + c.start + "\nEnd: " + c.end;}   },
     {label : '_tooltipItems', id: 'OPTIONS.tooltip_items',  defaultValue : {Chr:'chr',Start:'start',End:'end',Value:'value'} },
     {label : '_tooltipLinks', id: 'OPTIONS.tooltip_links',  defaultValue : {} },
     {label : '_tile_padding', id: 'OPTIONS.tile_padding', cast: Number, defaultValue : 5 },
     {label : '_tile_overlap_distance', id: 'OPTIONS.tile_overlap_distance', cast: Number, defaultValue : 0.1 },
     {label : '_tile_height', id: 'OPTIONS.tile_height', cast: Number, defaultValue : 5 },
     {label : '_tile_show_all_tiles', id: 'OPTIONS.tile_show_all_tiles', cast: Boolean, defaultValue : false }
    ];
};

vq.models.CircVisData.WedgeData.prototype._build_data = function(data_struct) {
    this._processData(data_struct)
};
