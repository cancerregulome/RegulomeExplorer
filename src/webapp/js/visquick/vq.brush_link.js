/**
*
*
* @class  An interactive brush-link plot.
*
*
* The JSON Object passed into the {@link BrushLink#draw} function as input to the visualization:
*  
* 	<pre> {
*     	  data_array : {Array},
*	  columns : {Array}, 
*	  tooltipItems : {Function},
*	  notifier : {Function},
*	  PLOT : {
*		width : {int},
*		height : {int},
*		horizontal_padding : {int},
*		vertical_padding : {int},
*		container : {HTMLElement or string},
*		symmetric : {Boolean}
*		},
* 	  CONFIGURATION : {
*			multiple_id : {string},
*			color_id : {string},
*          		show_legend : {Boolean},
*          		AXES: {
*				label_font : {string},
*				}
*			}
*	}
*  </pre>
* @extends vq.Vis
*/
vq.BrushLink = function(){
    vq.Vis.call(this);

    //set option variables to useful values before options are set.
    this.height(500);     // defaults
    this.width(500);     // defaults
    this.vertical_padding(10);
    this.horizontal_padding(10);
    this.symmetric(false);
    this.selection([]);
};
vq.BrushLink.prototype = pv.extend(vq.Vis);

/** @name vq.BrushLink.selection **/

/** @name vq.BrushLink.symmetric **/
vq.BrushLink.prototype
        .property('selection')
        .property('symmetric', Boolean);

/**
* 
*
* @type number
* @name sectionVerticalPadding
*/


/**
*  @private set optional parameters passed in at draw
* @param options JSON object containing the passed in options
*/

vq.BrushLink.prototype._setOptionDefaults = function(options) {

    if (options.height != null) { this.height(options.height); }

     if (options.width != null) { this.width(options.width); }

     if (options.container) { this.container(options.container); }

     if (options.vertical_padding != null) { this.vertical_padding(options.vertical_padding); }

     if (options.horizontal_padding != null) { this.horizontal_padding(options.horizontal_padding); }

    if (options.symmetric != null) { this.symmetric(options.symmetric); }

};

/**
*  Renders the tool to the browser window using the designated
* options and configurations.
 * data :
 * @see vq.BrushLinkData
 *  </pre>
 * options :
 * <pre>
 *      {
 *      container : HTMLDivElement,
 *      plotHeight  : number,
 *      plotWidth : number,
 *      verticalPadding : number,
 *      horizontalPadding : number,
 *      symmetric : Boolean
 * }
 * </pre>
*
* @param data JSON object containing data and Configuration
* @param options JSON object containing visualization options
*/

vq.BrushLink.prototype.draw = function(data) {



    this._bl_data = new vq.models.BrushLinkData(data);
    if (this._bl_data.isDataReady()) {
        this._data = this._bl_data._data;
        this._setOptionDefaults(this._bl_data);
        this.render();
    }
};

/** @private renders the visualization as SVG model to the document DOM */

vq.BrushLink.prototype.render = function() {

    var that = this;
    var columns = that._bl_data._columns;
    var listener = that._bl_data._notifier;
    var tooltip = that._bl_data._tooltipFormat;
    var color_scale =  that._bl_data.color_scale;
    var shape_map = that._bl_data.shape_map;
    var grey = pv.rgb(144, 144, 144, .2),
            red = pv.rgb(255,144,144,.7),
            color = pv.colors(
                    "rgba(50%, 0%, 0%, .5)",
                    "rgba(0%, 50%, 0%, .5)",
                    "rgba(0%, 0%, 50%, .5)");

    var s;
    var columns_map = pv.numerate(columns);

    var legend_height = that._bl_data.show_legend ? 25 : 0;

    var visibleWidth = (this.width() + 2 * this.horizontal_padding()) * columns.length ,
        visibleHeight = (this.height() + this.vertical_padding() * 2) * columns.length + legend_height,
        posX = pv.dict(columns, function(c) { return pv.Scale.linear(that._data, function(d){
	                return d[c];}).range(0,that.width()).nice();}),
	posY = pv.dict(columns, function(c) { return pv.Scale.linear(that._data, function(d){
        		return d[c];}).range(0,that.height()).nice();});

    var vis = new pv.Panel()
            .width(visibleWidth)
            .height(visibleHeight)
            .left(that.horizontal_padding())
            .top(that.vertical_padding())
            .canvas(that.container());

    var	cell = vis.add(pv.Panel)
            .data(columns)
            .top(function(){return this.index * (that.height() + 2 * that.vertical_padding()) + that.vertical_padding(); })
            .height(that.height())
          .add(pv.Panel)
            .data(function(y) {return columns.map(function(x) { return ({px:x,py:y});});})
            .left(function() { return this.index * (that.width() + 2 * that.horizontal_padding()) + that.horizontal_padding(); } )
            .width(that.width());

    var plot  = cell.add(pv.Panel)
            .events('all')
            .strokeStyle("#aaa");

    var xtick = plot.add(pv.Rule)
            .data(function(t) { return posX[t.px].ticks(5);})
            .left(function(d,t) {return posX[t.px](d);})
            .strokeStyle("#eee");

    /* Y-axis ticks. */
    var ytick = plot.add(pv.Rule)
            .data(function(t) {return posY[t.py].ticks(5);})
            .bottom(function(d, t) {return posY[t.py](d);})
            .strokeStyle("#eee");

   if (this.symmetric()) {
        plot.visible(function(t) { return t.px != t.py;});

       xtick.anchor("bottom").add(pv.Label)
            .visible(function() { return (cell.parent.index == columns.length -1) && !(cell.index & 1);})
            .text(function(d,t) {return posX[t.px].tickFormat(d);});

    xtick.anchor("top").add(pv.Label)
            .visible(function() { return (cell.parent.index == 0) && !(cell.index & 1);})
            .text(function(d,t) {return posX[t.px].tickFormat(d);});

    /* Left label. */
    ytick.anchor("left").add(pv.Label)
            .visible(function() {return (cell.index == 0) && (cell.parent.index & 1);})
            .text(function(d, t) {return posY[t.py].tickFormat(d);});

    /* Right label. */
    ytick.anchor("right").add(pv.Label)
            .visible(function() {return (cell.index == columns.length - 1) && !(cell.parent.index & 1);})
            .text(function(d, t) { return posY[t.py].tickFormat(d);});
   } else {
        plot.visible(function(t) { return columns_map[t.px] < columns_map[t.py];});

       xtick.anchor("bottom").add(pv.Label)
            .text(function(d,t) {return posX[t.px].tickFormat(d);});

    ytick.anchor("left").add(pv.Label)
            .text(function(d, t) {return posY[t.py].tickFormat(d);});
    }

    /* Interaction: new selection and display and drag selection */
    var select_panel = plot.add(pv.Panel);

    /* Frame and dot plot. */
//    var dot = plot.add(pv.Dot)
//            .events('all')
//            .data(that._data)
//            .left(function(d, t) {return posX[t.px](d[t.px]);})
//            .bottom(function(d, t) {return posY[t.py](d[t.py]);})
//            .size(10)
//            .shape(shape_map)
//            .fillStyle(grey)
//            .strokeStyle(function() { return this.fillStyle();})
//            .cursor('pointer')
////            .event('mouseover',pv.Behavior.flextip({include_footer : false, self_hover : true,
////                                                     data_config:that._bl_data.tooltipItems}))
//            .event('click',listener);

    function filtered_data() {
        var filtered = [];
        if (!s) { return that._data;}
        if ( that.new_update) {
            that.new_update = false;
        filtered =that._data.filter(function(d) {return  !((d[s.px] < s.x1) || (d[s.px] > s.x2)
            || (d[s.py] < s.y1) || (d[s.py] > s.y2));});
        that.selection(filtered);
        //return filtered;
        } else {
            //return that.selection();
        }

    }

    function visible_data(point) {
        return  s ? !((point[s.px] < s.x1) || (point[s.px] > s.x2)
            || (point[s.py] < s.y1) || (point[s.py] > s.y2)) : true;
    }

    function active_color(point) {
        return visible_data(point) ? color_scale(point) : grey;
    }

   var dot_panel = plot.add(pv.Panel);

    var highlighted_dot = dot_panel.add(pv.Dot)
//            .data(filtered_data)
            .data(that._data)
            .left(function(d, t) {return posX[t.px](d[t.px]);})
            .bottom(function(d, t) {return posY[t.py](d[t.py]);})
            .size(10)
            .fillStyle(active_color)
            .strokeStyle(function() { return this.fillStyle();})
            .shape(shape_map)
            .events('none')
            .cursor('pointer')
            .events('painted')
            .event('mouseover',pv.Behavior.hovercard({include_footer : false, self_hover : true,
                                                     data_config:that._bl_data.tooltipItems}))
            .event('click',listener);

    select_panel
            .data([{x:20, y:20, dx:80, dy:80}])
            .events('all')
            .cursor("crosshair")
            .event("mousedown", pv.Behavior.select())
            .event("selectstart", function() {return (s = null,
            highlighted_dot.context(null, 0, function() {return this.render();}),
        select_panel.context(null, 0, function() {return this.render();}));})
            .event("select", update)
            .event('selectend', filtered_data)
         .add(pv.Bar)
            .visible(function(d, k, t) { return s && s.px == t.px && s.py == t.py; })
            .left(function(d) { return d.x;} )
            .top(function(d) { return d.y;} )
            .width(function(d) { return d.dx;} )
            .height(function(d) { return d.dy;} )
            .fillStyle("rgba(0,0,0,.15)")
            .strokeStyle("white")
            .cursor("move")
            .event("mousedown", pv.Behavior.drag())
            .event("dragend", filtered_data)
            .event("drag", update);

    /* Labels along the diagonal. */
    cell.anchor("center").add(pv.Label)
            .visible(function(t) { return t.px == t.py;} )
            .font(that._bl_data.axes_label_font)
            .text(function(t) { return t.px.replace(/([WL])/, " $1").toLowerCase();});

    if(this._bl_data.show_legend) {
       var legend_panel =  vis.add(pv.Panel)
                                .bottom(0)
                                .height(legend_height)
                                .strokeStyle('#222')
                                .width(that.width() * (that._bl_data._columns.length - 1))
                                .left(that.horizontal_padding())
                                .lineWidth(1);

       var color_panel = legend_panel.add(pv.Panel)
                                .data(that._bl_data.unique_color_ids)
                                .strokeStyle(null)
                                .bottom(legend_height /2)
                                .height(legend_height /2 - 2)
                                .left(function() { return 30 + (this.index * 40);})
                                .width(40);

            color_panel.add(pv.Bar)
                        .left(2)
                        .width(15)
                        .bottom(0)
                        .fillStyle(function(id) {var  a = {}; a[that._bl_data.color_id] = id; return color_scale(a); });

            color_panel.anchor('right').add(pv.Label)
                        .font('16px');


       if (that._bl_data.multiple_id) {

            var shape_panel = legend_panel.add(pv.Panel)
                        .data(that._bl_data.unique_multiple_ids)
                        .bottom(0)
                        .height(legend_height / 2)
                        .strokeStyle(null)
                        .left(function() { return 30 + (this.index * 40);})
                        .width(40);

            shape_panel.add(pv.Dot)
                             .left(12)
                             .strokeStyle('#222')
                             .fillStyle(function() { return this.strokeStyle();})
                             .radius(legend_height /4 -2)
                             .shape(function(id) {var  a = {}; a[that._bl_data.multiple_id] = id; return shape_map(a); });

            shape_panel.anchor('right').add(pv.Label)
                        .font('16px');

        }

    }

    vis.render();

    /* Interaction: update selection. */
    function update(d, t) {
        if (d.dx < 5 && d.dy < 5) {s = null;}
        else {
        s = d;
        s.px = t.px;
        s.py = t.py;
        s.x1 = posX[t.px].invert(d.x);
        s.x2 = posX[t.px].invert(d.x + d.dx);
        s.y1 = posY[t.py].invert(that.height() - d.y - d.dy);
        s.y2 = posY[t.py].invert(that.height() - d.y);
        that.new_update=true;
        }
        highlighted_dot.context(null, 0, function() {return this.render();});
    }

};

/**
* Constructs the data model used in the BrushLink visualization
* @class Represents the data, custom configuration, and behavioral functions
*
*
* @extends vq.models.VisData
 * @see vq.BrushLink
 * @param object An object that configures a vq.BrushLink visualization
*/

vq.models.BrushLinkData = function(data) {
    vq.models.VisData.call(this,data);

    this.setDataModel();

    if (this.getDataType() == 'vq.models.BrushLinkData') {
        this._build_data(this.getContents());
    } else {
        console.warn('Unrecognized JSON object.  Expected vq.models.BrushLinkData object.');
    }
};
vq.models.BrushLinkData.prototype = pv.extend(vq.models.VisData);

/**
 * @private
 *
 */

vq.models.BrushLinkData.prototype.setDataModel = function () {
    this._dataModel = [
        {label: 'width', id: 'PLOT.width', cast : Number, defaultValue: 400},
        {label: 'height', id: 'PLOT.height', cast : Number, defaultValue: 400},
        {label : 'container', id:'PLOT.container', optional : true},
        {label: 'vertical_padding', id: 'PLOT.vertical_padding', cast : Number, defaultValue: 0},
        {label: 'horizontal_padding', id: 'PLOT.horizontal_padding',cast : Number,  defaultValue: 0},
        {label : 'symmetric', id:'PLOT.symmetric', cast : Boolean, defaultValue : false},
        {label : '_data', id: 'data_array', defaultValue : [] },
        {label : '_columns', id: 'columns', defaultValue : [] },
        {label : '_tooltipFormat', id: 'tooltipFormat', cast: vq.utils.VisUtils.wrapProperty, defaultValue : null },
        {label : 'tooltipItems', id: 'tooltip_items', defaultValue : [] },
        {label : 'color_id', id: 'CONFIGURATION.color_id', cast: String, defaultValue : null },
        {label : 'multiple_id', id: 'CONFIGURATION.multiple_id', cast: String, defaultValue : null},
        {label : 'show_legend', id: 'CONFIGURATION.show_legend', cast: Boolean, defaultValue : false },
        {label : 'axes_label_font', id: 'CONFIGURATION.AXES.label_font', cast: String, defaultValue : "bold 14px sans-serif" },
        {label : '_notifier', id: 'notifier', cast : Function, defaultValue : function() {return null;}}
    ];
};

/**
 * @private
 * @param data
 */

vq.models.BrushLinkData.prototype._build_data = function(data) {
	var that = this;
    this.color_scale = vq.utils.VisUtils.wrapProperty(pv.color('red').alpha(0.8));
    var shape_map=['cross','triangle','square','cross','diamond','bar','tick'];
    var default_shape = 'circle';

    this._processData(data);

    if (this._data.length > 0) {
        this.setDataReady(true);
    }

    if (this.color_id) {
            this.unique_color_ids = pv.uniq(that._data,function(row) { return row[that.color_id];});
            var cat10 =  pv.Colors.category10();
            this.color_scale = this.unique_color_ids.length > 1 ?
                    function(c) { return cat10(c[that.color_id]).alpha(0.8);} :
                    this.color_scale;
    }

    if (this.multiple_id) {
            this.unique_multiple_ids = pv.uniq(that._data,function(row) { return row[that.multiple_id];});
            var map = pv.dict(that.unique_multiple_ids, function(id) { return shape_map[this.index];})
            this.shape_map = that.unique_multiple_ids.length > 1 ?
                    function(feature) { return map[feature[that.multiple_id]]; }
                    :  function() { return default_shape;};
    }

};
