function registerPlotListeners() {

    var d = vq.events.Dispatcher;
    d.addListener('data_ready','associations',function(data) {
        if (re.state.query_cancel) { return;}
        generateColorScale();
        renderCircleData(data);
        renderCircleLegend('top-right');
	renderPathwayMembers('below-top-right', data);
    });
    d.addListener('data_ready','sf_associations',function(data) {
        if (re.state.query_cancel) { return;}
        generateColorScale();
        renderSFCircleData(data);
        renderCircleLegend('center');
    });
    d.addListener( 'data_ready','graph',function(data) {
        var obj = {
            network : data,
            div : 'graph-panel'
        };
        initializeGraph(obj);
        var e = new vq.events.Event('graph_ready','graph',{});
            e.dispatch();
    });
    d.addListener( 'frame_ready','graph',function() {
        if (!re.display_options.cytoscape.ready) {
            renderGraph();
        }
    });
    d.addListener('data_ready','dataset_labels',function(obj){
        generateColorMaps(obj);
    });
    d.addListener('data_ready','annotations',function(obj){
        re.plot.chrome_length = obj['chrom_leng'];
    });
    d.addListener('data_ready', 'patient_categories', function(obj) {
        updatePatientCategories(obj);
    });
    d.addListener('data_ready','pathways',function(obj){
        re.plot.pw_name = obj['pw_name'];
    });
    d.addListener('render_scatterplot','details', function(obj){
        wipeScatterplotLegend();
        scatterplot_draw(obj);
    });
    d.addListener('render_linearbrowser', function(obj){
        renderLinearData(obj);
        renderLinearLegend();
    });
    d.addListener('render_complete','circvis', function(obj){
        re.circvis_obj = obj;
    });
    d.addListener('render_complete','graph', function(obj){
        //re.cytoscape.obj = obj.graph;
    });
    d.addListener('modify_circvis', function(obj){
        modifyCircle(obj);
    });
    d.addListener('layout_network', function(obj){
        if (re.display_options.cytoscape.ready) {
            layoutGraph();
        }
    });

}
function updatePatientCategories(data) {
    re.plot.scatterplot_category = {};
    re.plot.scatterplot_category.values = data.patient_values.split(':');
    re.plot.scatterplot_category.alias = data.alias;
    vq.events.Dispatcher.dispatch(new vq.events.Event('data_ready', 'features', re.plot.scatterplot_data));
}

function layoutGraph() {
    re.cytoscape.obj.layout(getNetworkLayout());
}

function getNetworkLayout() {
    var layout = {name : "ForceDirected", options  : {gravitation : -500,mass: 3,
        tension: .01,drag:0.1,maxDistance:1000, minDistance: 30,
        iterations:400, autoStabilize: false, maxTime: 3000, restLength: 30}};

    switch(re.display_options.cytoscape.layout) {
        case('tree'):
            layout = {name : 'Tree',
                options:{
                    orientation: "topToBottom",
                    depthSpace: 50,
                    breadthSpace: 30,
                    subtreeSpace: 5
                }};
            break;
        case('radial'):
            layout = {name : 'Radial',
                options:{
                    angleWidth: 360,
                    radius: 150
                }};
            break;
        case('force_directed'):
        default:
            break;
    }

    return layout;
}

function modifyCircle(object) {
    if (object.pan_enable != null) {
        re.circvis_obj.setPanEnabled(object.pan_enable);
    }
    if (object.zoom_enable  != null) {
        re.circvis_obj.setZoomEnabled(object.zoom_enable);
    }
}

function generateColorScale() {
    var pairwise_settings = re.display_options.circvis.rings.pairwise_scores;
    var field = re.display_options.circvis.rings.pairwise_scores.value_field;
        var association  = re.model.association.types[re.model.association_map[field]];
        var settings = association.vis.scatterplot;
        pairwise_settings.color_scale = pv.Scale.linear(settings.color_scale.domain());
        pairwise_settings.color_scale.range.apply(pairwise_settings.color_scale,settings.color_scale.range());

        if (pairwise_settings.manual_y_values) {
            var min = pairwise_settings.min_y_value;
            var max = pairwise_settings.max_y_value;
            pairwise_settings.color_scale.domain(min,max);
        }

        if (pairwise_settings.manual_y_color_scale) { pairwise_settings.color_scale.range(pairwise_settings.min_y_color,pairwise_settings.max_y_color);}


}

function generateColorMaps(dataset_labels) {
    var current_source_list = dataset_labels['feature_sources'].map(function(row) { return row.source;});
    var num_sources = current_source_list.length;
    re.plot.link_sources_array = [];
    current_source_list.forEach(function(row, index) {
        var color = re.plot.colors.link_type_colors(index);
        for (var i = 0; i < num_sources; i++) {
            re.plot.link_sources_array.push(color);
            color = color.darker(.3);
        }
    });
    var source_map = pv.numerate(dataset_labels['feature_sources'], function(row) {return row.source;});
    var current_data = re.plot.all_source_list.filter(function(input_row){return source_map[input_row] != undefined;});
    var current_map = pv.numerate(current_data);

    //re.plot.colors.node_colors = function(source) { return re.plot.colors.source_color_scale(current_map[source]);};
    re.plot.colors.link_sources_colors = function(link) { return re.plot.link_sources_array[current_map[link[0]] * current_data.length + current_map[link[1]]];}
}

function renderCircleLegend(anchor) {
    legend_draw(document.getElementById('circle-legend-panel'),anchor);
}

function renderPathwayMembers(anchor, data) {
    var memberCounts = {};
    var networks = [];
    if (data != null){
	networks = data["network"];
        document.getElementById("pathway-member-item").innerHTML = "";
    }	
    pathway_members_draw(document.getElementById('pathway-member-item'),anchor,networks);
}

function renderLinearLegend(anchor) {
    legend_draw(document.getElementById('linear-legend-panel'));
}

function wipeScatterplotLegend(categories,color_map) {
    document.getElementById('scatterplot-legend-panel').innerHTML = "";
}

function renderScatterplotLegend(categories,color_map) {
    scatterplot_legend_draw(document.getElementById('scatterplot-legend-panel'),categories,color_map);
}

function renderCircleData(data) {
    Ext.getCmp('circle-colorscale-panel').el.dom.innerHTML = '';
    buildNetworkCircvis(data, document.getElementById('circle-panel'));
}

function renderSFCircleData(data) {
    buildSFCircvis(data, document.getElementById('circle-panel'));
    var field = re.display_options.circvis.rings.pairwise_scores.value_field;
    var association  = re.model.association.types[re.model.association_map[field]];
    colorscale_draw( association,'circle-colorscale-panel');
}

function renderLinearData(obj) {
    linear_plot(vq.utils.VisUtils.extend(obj,{div:'linear-panel'}));
}

function renderGraph(data) {

    populateGraph();
}

function inter_chrom_click(node) {
    initiateDetailsPopup(node);
}

function initiateDetailsPopup(link) {
    var e =new vq.events.Event('click_association','vis',link);
    e.dispatch();
}

function colorscale_draw(association_obj, div) {
    var color_scale = re.display_options.circvis.rings.pairwise_scores.color_scale;
    var dom = color_scale.domain();
    var width = 240,
        scale_width = 160,
        box_width = 4,
        end = dom[dom.length-1],
        start = dom[0],
        step_size = end - start,
        steps = scale_width / box_width;
    var vis= new pv.Panel()
        .height(70)
        .width(width)
        .strokeStyle(null)
        .canvas(div);
    var x_axis = pv.Scale.linear(start,end).range(0,scale_width);
    var legend = vis.add(pv.Panel)
        .left((width-scale_width)/2)
        .right((width-scale_width)/2)
        .strokeStyle('black')
        .lineWidth(1)
        .bottom(30)
        .height(30);
    legend.add(pv.Bar)
            .data(pv.range(start,end,step_size/steps))
            .width(box_width)
            .left(function() { return this.index * box_width;})
            .fillStyle(color_scale);
    legend.add(pv.Rule)
        .data(x_axis.ticks(2))
        .left(x_axis)
        .strokeStyle('#000')
        .lineWidth(1)
        .anchor('bottom').add(pv.Label)
        .font('10px bold Courier, monospace')
        .text(x_axis.tickFormat);
    vis.anchor('bottom').add(pv.Label)
        .text(association_obj.label);
    vis.render();

}

function scatterplot_legend_draw(div,categories,color_map) {
    
    var width = 100,
        offset = 10,
        lineHeight = 10,
        box_width = 10;

    var vis= new pv.Panel()
        .height(400)
        .width(width)
        .strokeStyle(null)
        .canvas(div);
    var legend = vis.add(pv.Panel)
        .top(30)
        .left(offset)
        .right(width-offset)
        .strokeStyle(null);

    var entry = legend.add(pv.Panel)
            .data(categories)
            .top(function() { return this.index * lineHeight;})
            .height(lineHeight);
        
        entry.add(pv.Bar)         
            .width(lineHeight)
            .left(1)
            .top(1)
            .bottom(0)
            .fillStyle(function(cat) { return color_map[cat];});
        
        entry.add(pv.Label)
            .left(lineHeight)
            .bottom(0)
            .textAlign('left')
            .textBaseline('bottom')
            .font("11px helvetica");

    vis.render();

}

function pathway_members_draw(div,anchor,networks) {
    var dataset_labels = re.ui.getDatasetLabels();
    if (re.ui.getCurrentPathwayMembers() == null || re.ui.getCurrentPathwayMembers().length == 0)
        return;
    var currentMemberList = re.ui.getCurrentPathwayMembers().split(/\s*,\s*/);
    currentMemberList.sort();
    var memberSourceCountArray = {};
    var memberCountArray = [];  
    for (var k = 0; k < currentMemberList.length; k++){
	if (currentMemberList[k] == null || currentMemberList[k] == "")
		continue;
        var member = currentMemberList[k];
    	var mobj = {};
        var mcount = 0;
        var gexpcount = 0;
        var methcount = 0;
        var cnvrcount = 0;
        var mirncount = 0;
        var gnabcount = 0;
        var prdmcount = 0;
        var rppacount = 0;
        var clincount = 0;
        var sampcount = 0;
        for (var n = 0; n < networks.length; n++){
            var label = networks[n].node1.label;
            var psource = networks[n].node2.source;
            if (Ext.getCmp("filter_type").getValue() == re.ui.feature2.id )
                label = networks[n].node2.label;
            if (label == member){
                mcount++;
                if (psource == 'GEXP')
                    gexpcount++;
                if (psource == 'METH')
                    methcount++;
                if (psource == 'CNVR')
                    cnvrcount++;
                if (psource == 'MIRN')
                    mirncount++;
                if (psource == 'GNAB')
                    gnabcount++;
                if (psource == 'PRDM')
                    prdmcount++;
                if (psource == 'RPPA')
                    rppacount++;
                if (psource == 'CLIN')
                    clincount++;
                if (psource == 'SAMP')
                    sampcount++;
            }
        }
        mobj["GEXP"] = gexpcount;
        mobj["METH"] = methcount;
        mobj["CNVR"] = cnvrcount;
        mobj["MIRN"] = mirncount;
        mobj["GNAB"] = gnabcount;
        mobj["PRDM"] = prdmcount;
        mobj["RPPA"] = rppacount;
        mobj["CLIN"] = clincount;
        mobj["SAMP"] = sampcount;
        mobj["offset"] = 35;
        memberSourceCountArray[member] = mobj;
        if (mcount > 0)
            memberCountArray[member] = mcount;
    }

    var sortedMembers = {};
    var tuples = [];
    for (var key in memberCountArray) tuples.push([key, memberCountArray[key]]);
    tuples.sort(function(a, b) {
       a = a[1];
       b = b[1];
       return b < a ? -1 : (b > a ? 1 : 0);
    });
    for (var i = 0; i < tuples.length; i++) {
        var key = tuples[i][0];
        var value = tuples[i][1];
	if (key == "remove" || !isUnsignedInteger(value)){
		continue;
	}
        sortedMembers[key] = value;
    }
    var stuples = [];
    for (var member in sortedMembers){
    	stuples.push([member,sortedMembers[member]]);
    }
    for (var member in currentMemberList){
    	var memberstr = currentMemberList[member];
        var add = true;
            for (var s =0; s < stuples.length; s++){
                if (memberstr == stuples[s][0]){
                    add = false;
                    break;
            }
        }
        if (add && memberstr.length > 1){
            stuples.push([memberstr, 0]);
        }
    }
    stuples.sort(function(a,b){
    	return b[1] - a[1];
    });
    var source_map = pv.numerate(dataset_labels['feature_sources'], function(row) {return row.source;});

    var current_data = re.plot.all_source_list.filter(function(input_row){return source_map[input_row] != undefined;});
    var current_map = pv.numerate(current_data);

    re.plot.colors.link_sources_colors = function(link) { return re.plot.link_sources_array[current_map[link[0]] * current_data.length + current_map[link[1]]];}

    var top_padding = 20,
        left_padding = 0;
    var legend_height = (30 + stuples.length * 13),
        legend_width = 400;

    var pathway_members_query_counts = re.ui.getPathwayMembersQueryCounts();
    var locatable_sources = re.plot.locatable_source_list;
    var horizontal_offset = 65;
    var bar_height = 12;
    var label_offset = 10;
    var scale_factor = 5;

    var draw_data = [];
    stuples.forEach(function(mv, index) {
        var pathway_member = mv[0];

        var sources = [];
        var total = 0;
        locatable_sources.forEach(function(src, source_index) {
            var count = memberSourceCountArray[pathway_member][src];

            if (count > 0) {
                sources.push({
                    source_index: source_index,
                    label_index: index,
                    offset: total,
                    width: count
                });

                total = total + count;
            }
        });

        var obj = {
            label: pathway_member,
            label_index: index,
            sources: sources
        };

        draw_data.push(obj);
    });

    var vis = new pv.Panel()
        .left(0)
        .top(0)
        .width(legend_width)
        .height(legend_height)
        .canvas(div);

    var draw_panel = vis.add(pv.Panel)
        .def("active_label_index", -1)
        .left(left_padding)
        .top(top_padding)
        .events("all")
        .event("click", function() {
            this.active_label_index(-1);
            this.render();
            re.circvis_obj.highlightConnectedNodes('');
        });

    var entries = draw_panel.add(pv.Panel)
        .data(draw_data)
        .top(function() { return this.index * bar_height;})
        .height(bar_height)
        .strokeStyle(function(d) {
            // Red rectangle for highlighting the selected pathway member
            return d.label_index == draw_panel.active_label_index() ? "red" : pv.color("rgba(1, 1, 1, 0)");
        })
        .event("mouseover", function(d) {
            if (draw_panel.active_label_index() == -1 && pathway_members_query_counts[d.label] > 0) {
                re.circvis_obj.highlightConnectedNodes(d.label);
            }
        })
        .event("mouseout", function() {
            if (draw_panel.active_label_index() == -1) {
                re.circvis_obj.highlightConnectedNodes('');
            }
        })
        .event("click", function(d) {
            if (pathway_members_query_counts[d.label] > 0) {
                draw_panel.active_label_index(d.label_index);
                draw_panel.render();
                re.circvis_obj.highlightConnectedNodes(d.label);
            }
        });

    // Pathway member name labels
    entries.add(pv.Panel)
        .left(label_offset)
        .width(horizontal_offset-label_offset)
        .fillStyle("white")
        .event("dblclick", function(d) {
            var url = 'http://www.genecards.org/cgi-bin/carddisp.pl?gene=' + d.label;
            var newwindow=window.open(url,"Gene Card:" + d.label,'height=500,width=800');
            if (window.focus) {
                newwindow.focus()
            }
            return false;
        })
        .anchor("left").add(pv.Label)
        .textStyle(function(d) {
            return pathway_members_query_counts[d.label] == 0 ? "red" :  "black";
        })
        .font(function(d) {
            if (d.label_index == draw_panel.active_label_index()) {
                return "bold 10px sans-serif";
            }
            else {
                return "10px sans-serif";
            }
        })
        .text(function(d) {
            return d.label;
        });

    var x_scale = pv.Scale.linear(0, 50*4).range(0, legend_width);

    draw_panel.add(pv.Panel)
        .left(horizontal_offset)
        .add(pv.Rule)
        .data(x_scale.ticks())
        .strokeStyle("#eee")
        .left(function(d) {
            return scale_factor * d;
        })
        .anchor("top").add(pv.Label)
        .text(x_scale.tickFormat);

    // Horizontal bar for each source
    entries.add(pv.Panel)
        .left(horizontal_offset)
        .add(pv.Bar)
        .data(function(d) {
            return d.sources;
        })
        .left(function(d) {
            return scale_factor * d.offset;
        })
        .width(function(d) {
            return scale_factor * d.width;
        })
        .fillStyle(function(d) {
            var color = re.plot.colors.node_colors(locatable_sources[d.source_index]);

            if (d.label_index == draw_panel.active_label_index()) {
                return color;
            }
            else {
                color.opacity = 0.7;
                return color;
            }
        })
        .bottom(1.0);

    vis.render();
}

function legend_draw(div,anchor) {
    var dataset_labels = re.ui.getDatasetLabels();
    var source_map = pv.numerate(dataset_labels['feature_sources'], function(row) {return row.source;});
    var current_locatable_data = re.plot.locatable_source_list.filter(function(input_row){return source_map[input_row] != undefined;});
    var current_data = re.plot.all_source_list.filter(function(input_row){return source_map[input_row] != undefined;});
    var current_map = pv.numerate(current_data);
    var anchor = anchor || 'top-right';
    var width=800, height=800;
	var padding = 20;
	var indent = 12;
	var lineHeight = 12;
	var nFeatureTypes = current_locatable_data.length;
	var variableTypeBoxHeight = padding + 5 + nFeatureTypes * lineHeight;
	//var dataRingTypes = ['1. Cytoband','2. Gene Expression','3. Methylation','4. Copy Number','5. Unmapped Associations'];

	var dataRingBoxHeight = padding + re.plot.legend.dataRingTypes.length * lineHeight;
	var quantileBoxHeight = padding + Object.keys(re.plot.colors.quantinfo).length * lineHeight;
	// Three legend boxes on top of each other
    var legend_height = variableTypeBoxHeight + 15;//+ dataRingBoxHeight + quantileBoxHeight + 3 * 5;
	var legend_width = 150;
    var top = 20, left = 0;
    if (arguments[1] != undefined) {anchor = arguments[1];}
    switch(anchor) {
        case('center'):
            Ext.getCmp('circle-legend-panel').setPosition(375,330);
            Ext.getCmp('circle-legend-panel').doLayout();
            break;
        case('top-right'):
            Ext.getCmp('circle-legend-panel').setPosition(880,20);
            Ext.getCmp('circle-legend-panel').doLayout();
	    break;
	case('below-top-right'):
	    Ext.getCmp('pathway-legend-panel').setPosition(880,legend_height + 20);
            Ext.getCmp('pathway-legend-panel').doLayout();
        default:
            break;
    }
    re.plot.colors.link_sources_colors = function(link) { return re.plot.link_sources_array[current_map[link[0]] * current_data.length + current_map[link[1]]];}
	// Container for all sub-legends (variable types, data rings, and quantiles)
    var vis= new pv.Panel()
        .left(left)
        .top(top)
        .width(legend_width)
        .height(legend_height)
        .lineWidth(1)
        .strokeStyle('black')
        .canvas(div);

	// Create variable type sub-legend box
    var drawPanel = vis.add(pv.Panel)

	// Draw title for variable type sub-legend box:
	// Take it 5px away from top and 12px away from the left 
    drawPanel.add(pv.Label)
        .textAlign('left')
        .left(indent)
		.top(padding)
        .text('Variable Types')
        .font("15px helvetica"); // Title that starts from 5px from the top and extends to 20px from the top

    var color_panel = drawPanel.add(pv.Panel)
		.top(padding)        
		.left(indent);

    var entry = color_panel.add(pv.Panel)
        .data(current_locatable_data)
        .top(function() { return this.index * lineHeight;})
        .height(lineHeight);
    entry.add(pv.Bar)
        .left(0)
        .width(lineHeight)
        .top(1)
        .bottom(0)
        .fillStyle(function(type) { return re.plot.colors.node_colors(type);});
    entry.add(pv.Label)
        .text(function(id) { return re.label_map[id] || id;})
        .bottom(0)
        .left(lineHeight)
        .textAlign('left')
        .textBaseline('bottom')
        .font("11px helvetica");

     var ringPanel = vis.add(pv.Panel)
        .top(variableTypeBoxHeight)
        .left(0); // .top(function(){ return current_locatable_data.length*12;})

 //     var quantPanel = vis.add(pv.Panel)
 //        .top(variableTypeBoxHeight)
 //        .left(0);

 //     quantPanel.add(pv.Label)
 //        .textAlign('left')
 //        .top(padding)
 //        .left(indent)
 //        .text('Quantile colors')
 //        .font("15px helvetica");

 //     var qrings =  quantPanel.add(pv.Panel)
 //        .data(Object.keys(re.plot.colors.quants))
 //        .top(function() { return padding + this.index * lineHeight;})
 //        .height(lineHeight);
 //       qrings.add(pv.Bar)
 //        .left(indent)
 //        .width(lineHeight)
 //        .top(1)
 //        .bottom(0)
 //        .fillStyle(function(type) { 
	// 	return re.plot.colors.quants[type];
	// })
	// qrings.add(pv.Label)
 //        .text(function(q) { return q + " " + re.plot.colors.quantinfo[q];})
 //        .bottom(0)
 //        .left(25)
 //        .textAlign('left')
 //        .textBaseline('bottom')
        // .font("11px helvetica");
   vis.render();
}

function singlefeature_circvis(parsed_data,div) {
    var width=800, height=800;
    var ring_radius = width / 10;
    var chrom_keys = ["1","2","3","4","5","6","7","8","9","10",
        "11","12","13","14","15","16","17","18","19","20","21","22","X","Y"];
    var stroke_style = re.plot.colors.getStrokeStyleAttribute();

    function genome_listener(chr) {
        var e = new vq.events.Event('render_linearbrowser','circvis',{data:vq.utils.VisUtils.clone(parsed_data),chr:chr});
        e.dispatch();
    }

    function wedge_listener(feature) {
        var chr = feature.chr;
        var neighborhood = getFeatureNeighborhood(feature,2.5*re.MILLION);
        var start = neighborhood.start;
        var range_length = neighborhood.end - neighborhood.start;
        var e = new vq.events.Event('render_linearbrowser','circvis',{data:vq.utils.VisUtils.clone(parsed_data),chr:chr,start:start,range:range_length});
        e.dispatch();
    }

    var karyotype_tooltip_items = {
        'Cytogenetic Band' : function(feature) { 
		return  vq.utils.VisUtils.options_map(feature)['label'];
	},
        Location :  function(feature) { return 'Chr' + feature.chr + ' ' + feature.start + '-' + feature.end;}
    };

    var scatterplot_data = parsed_data['features'];

    var pairwise_settings = re.display_options.circvis.rings.pairwise_scores;
    var field = re.display_options.circvis.rings.pairwise_scores.value_field;
    var association  = re.model.association.types[re.model.association_map[field]];
    var settings = association.vis.scatterplot;

    if (settings.values === undefined) { settings.values = {};}
    var min = settings.values.min === undefined ? pv.min(scatterplot_data, function(o) { return o[field];}) : settings.values.min;
    var max = settings.values.max === undefined ? pv.max(scatterplot_data, function(o) { return o[field];}) : settings.values.max;
    var scale_type = settings.scale_type;

    if (pairwise_settings.manual_y_values) { min = pairwise_settings.min_y_value; max = pairwise_settings.max_y_value;}

    var chrom_leng = vq.utils.VisUtils.clone(re.plot.chrome_length);
    var ticks = vq.utils.VisUtils.clone(parsed_data['features']);
    var isolated_feature = parsed_data['isolated_feature'];

    var data = {
        GENOME: {
            DATA:{
                key_order : chrom_keys,
                key_length : chrom_leng
            },
            OPTIONS: {
                radial_grid_line_width: 1,
                label_layout_style : 'clock',
                listener : genome_listener,
                label_font_style : '18pt helvetica'
            }
        },
        TICKS : {
            DATA : {
                data_array : ticks
            },
            OPTIONS :{
                display_legend : false,
                listener : wedge_listener,
                stroke_style :stroke_style,
                fill_style : function(tick) {return re.plot.colors.node_colors(tick.source); },
                tooltip_items :  re.display_options.circvis.tooltips.feature,
                tooltip_links : re.display_options.circvis.tooltips.feature_links
            }
        },
        PLOT: {
            width : width,
            height :  height,
            horizontal_padding : 30,
            vertical_padding : 30,
            container : div,
            enable_pan : false,
            enable_zoom : false,
            show_legend: false,
            legend_include_genome : false,
            legend_corner : 'ne',
            legend_radius  : width / 15
        },
        WEDGE:[
            {
                PLOT : {
                    height : ring_radius/2,
                    type :   'karyotype'
                },
                DATA:{
                    data_array : cytoband
                },
                OPTIONS: {
                    legend_label : 'Cytogenetic Bands' ,
                    legend_description : 'Chromosomal Cytogenetic Bands',
                    outer_padding : 10,
                    tooltip_items : karyotype_tooltip_items
                }
          },{
                PLOT : {
                    height : ring_radius,
                    type :   'scatterplot'
                },
                DATA:{
                    data_array : scatterplot_data,
                    value_key : field
                },
                OPTIONS: {
                    legend_label : association.label ,
                    legend_description : association.label + ' Values',
                    outer_padding : 10,
                    base_value : (max - min) / 2,
                    min_value : min,
                    max_value : max,
                    radius : 2,
                    draw_axes : true,
                    listener: function(node) { initiateDetailsPopup({sourceNode:node,targetNode:{id:isolated_feature}});},
                    shape:'dot',
                    fill_style  : function(feature) {return pairwise_settings.color_scale(feature[field]); },
                    stroke_style  : function(feature) {return pairwise_settings.color_scale(feature[field]); },
                    tooltip_items : re.display_options.circvis.tooltips.feature,
                    tooltip_links : re.display_options.circvis.tooltips.feature_links
                }
            }
        ]
    };
   return data;
}

function buildSFCircvis(parsed_data,div) {
    re.display_options.circvis.rings.pairwise_scores.hidden=false;
    var circle_vis = new vq.CircVis();
    var config = singlefeature_circvis(parsed_data,div);
        var obj = modifyCircvisObject(config);
        var dataObject ={DATATYPE : "vq.models.CircVisData", CONTENTS : obj };
        circle_vis.draw(dataObject);

        var e = new vq.events.Event('render_complete','circvis',circle_vis);
        e.dispatch();

        return circle_vis;
}


function wedge_plot(parsed_data,div) {
    var width=800, height=800;
    var ring_radius = width / 20;
    var chrom_keys = ["1","2","3","4","5","6","7","8","9","10",
        "11","12","13","14","15","16","17","18","19","20","21","22","X","Y"];
    var stroke_style = re.plot.colors.getStrokeStyleAttribute();

    function genome_listener(chr) {
        var e = new vq.events.Event('render_linearbrowser','circvis',{data:vq.utils.VisUtils.clone(parsed_data),chr:chr});
        e.dispatch();
    }

    function wedge_listener(feature) {
        var chr = feature.chr;
        var neighborhood = getFeatureNeighborhood(feature,2.5*re.MILLION);
                var start = neighborhood.start;
                var range_length = neighborhood.end - neighborhood.start;
        var e = new vq.events.Event('render_linearbrowser','circvis',{data:vq.utils.VisUtils.clone(parsed_data),chr:chr,start:start,range:range_length});
        e.dispatch();
    }

    var link_tooltip_items = { };
    link_tooltip_items[re.ui.feature1.label] = function(link) { return link.sourceNode.pretty_label+ ' ' + link.sourceNode.source + ' Chr' + link.sourceNode.chr + ' ' + link.sourceNode.start +
        '-' + link.sourceNode.end + ' ' +link.sourceNode.label_mod;};

    link_tooltip_items[re.ui.feature2.label] = function(link) { return link.targetNode.pretty_label+ ' ' + link.targetNode.source + ' Chr' + link.targetNode.chr + ' ' + link.targetNode.start +
        '-' + link.targetNode.end + ' ' + link.targetNode.label_mod;};

    var karyotype_tooltip_items = {
        'Cytogenetic Band' : function(feature) {
		return  vq.utils.VisUtils.options_map(feature)['label'];},
        Location :  function(feature) { return 'Chr' + feature.chr + ' ' + feature.start + '-' + feature.end;}
    },
        unlocated_tooltip_items = {};
    unlocated_tooltip_items[re.ui.feature1.label] =  function(feature) { return feature.sourceNode.source + ' ' + feature.sourceNode.pretty_label +
        (feature.sourceNode.chr ? ' Chr'+ feature.sourceNode.chr : '') +
        (feature.sourceNode.start > -1 ? ' '+ feature.sourceNode.start : '') +
        (!isNaN(feature.sourceNode.end) ? '-'+ feature.sourceNode.end : '')  + ' '+
        feature.sourceNode.label_mod;};
    unlocated_tooltip_items[re.ui.feature2.label] = function(feature) { return feature.targetNode.source + ' ' + feature.targetNode.pretty_label +
        (feature.targetNode.chr ? ' Chr'+ feature.targetNode.chr : '') +
        (feature.targetNode.start > -1 ? ' '+ feature.targetNode.start : '') +
        (!isNaN(feature.targetNode.end) ? '-'+ feature.targetNode.end : '')  + ' ' +
        feature.targetNode.label_mod;};

    re.model.association.types.forEach( function(assoc) {
        vq.utils.VisUtils.extend(link_tooltip_items, assoc.vis.tooltip.entry);
        vq.utils.VisUtils.extend(unlocated_tooltip_items, assoc.vis.tooltip.entry);
    });

    var chrom_leng = vq.utils.VisUtils.clone(re.plot.chrome_length);
    var ticks = vq.utils.VisUtils.clone(parsed_data['features']);
    var types = re.model.association.types.map(function(assoc) { return assoc.query.id;});
    var unlocated_map = vq.utils.VisUtils.clone(parsed_data['unlocated']).filter(function(link) { return  link.node1.chr != '';})
        .map(function(link) {
            var node =  { chr:link.node1.chr, start:link.node1.start,end:link.node1.end, value: 0};
            node.sourceNode = vq.utils.VisUtils.extend({},link.node1); node.targetNode = vq.utils.VisUtils.extend({},link.node2);
            types.forEach(function(assoc) {
                node[assoc] = link[assoc];
            });
            return node;
        }).concat(vq.utils.VisUtils.clone(parsed_data['unlocated']).filter(function(link) { return  link.node2.chr != '';})
        .map(function(link) {
            var node =  { chr:link.node2.chr, start:link.node2.start,end:link.node2.end, value: 0};
            node.sourceNode = vq.utils.VisUtils.extend({},link.node1); node.targetNode = vq.utils.VisUtils.extend({},link.node2);
            types.forEach(function(assoc) {
                node[assoc] = link[assoc];
            });
            return node;
        }));

    var data = {
        GENOME: {
            DATA:{
                key_order : chrom_keys,
                key_length : chrom_leng
            },
            OPTIONS: {
                radial_grid_line_width: 1,
                label_layout_style : 'clock',
                listener : genome_listener,
                label_font_style : '18pt helvetica'
            }
        },
        TICKS : {
            DATA : {
                data_array : ticks
            },
            OPTIONS :{
                display_legend : false,
                listener : wedge_listener,
                stroke_style :stroke_style,
                fill_style : function(tick) {return re.plot.colors.node_colors(tick.source); },
                tooltip_links :re.display_options.circvis.tooltips.feature_links,
                tooltip_items :  re.display_options.circvis.tooltips.feature     //optional
            }
        },
        PLOT: {
            width : width,
            height :  height,
            horizontal_padding : 30,
            vertical_padding : 30,
            container : div,
            enable_pan : false,
            enable_zoom : false,
            show_legend: false,
            legend_include_genome : false,
            legend_corner : 'ne',
            legend_radius  : width / 15
        },
        WEDGE:[
            {
                PLOT : {
                    height : ring_radius/4,
                    type :   'karyotype'
                },
                DATA:{
                    data_array : cytoband
                },
                OPTIONS: {
                    legend_label : 'Cytogenetic Bands' ,
                    legend_description : 'Chromosomal Cytogenetic Bands',
                    outer_padding : 6,
                    tooltip_items : karyotype_tooltip_items,
                    background_style: re.display_options.circvis.rings.karyotype.color_background
                }
            },
            {
                PLOT : {
                    height : ring_radius/4,
                    type :   'scatterplot'
                },
                DATA:{
                    data_array : unlocated_map
                },
                OPTIONS: {
                    legend_label : 'Unmapped Feature Correlates' ,
                    legend_description : 'Feature Correlates with No Genomic Position',
                    outer_padding : 6,
                    base_value : 0,
                    min_value : -1,
                    max_value : 1,
                    radius : 4,
                    draw_axes : false,
                    shape:'dot',
                    fill_style  : function(feature) {
                        return re.plot.colors.link_sources_colors([feature.sourceNode.source,feature.targetNode.source]);
                    },
                    stroke_style : stroke_style,
                    background_style: re.display_options.circvis.rings.color_background,
                    tooltip_items : unlocated_tooltip_items,
                    listener : initiateDetailsPopup
                }
            }
        ],

        NETWORK:{
            DATA:{
                data_array : parsed_data['network']
            },
            OPTIONS: {
                outer_padding : 6,
                node_highlight_mode : 'isolate',
                node_fill_style : 'ticks',
                node_stroke_style : stroke_style,
                link_line_width : 2,
                node_key : function(node) { 
			return node['id'];
		},
                node_listener : wedge_listener,
                link_listener: initiateDetailsPopup,
                link_stroke_style : function(link) {
                    return re.plot.colors.link_sources_colors([link.sourceNode.source,link.targetNode.source]);},
                constant_link_alpha : 0.7,
                node_tooltip_items :   re.display_options.circvis.tooltips.feature,
                node_tooltip_links : re.display_options.circvis.tooltips.feature_links,
                tile_nodes: true,
                node_overlap_distance : 10000,
                link_tooltip_items :  link_tooltip_items
            }
        }
    };
    return data;
}

function buildNetworkCircvis(data,div) {
    re.display_options.circvis.rings.pairwise_scores.hidden=true;
    var circle_vis = new vq.CircVis();
    var config = wedge_plot(data,div);
    var obj = modifyCircvisObject(config);
    var dataObject ={DATATYPE : "vq.models.CircVisData", CONTENTS : obj };
    circle_vis.draw(dataObject);

    var e = new vq.events.Event('render_complete','circvis',circle_vis);
    e.dispatch();

    return circle_vis;
}

function getFeatureNeighborhood(feature,window_size) {
    var f= vq.utils.VisUtils.clone(feature);
    f.start = f.start - window_size;
    f.end = (f.end || feature.start) + window_size;
    return f;
}

function linear_plot(obj) {
    var div = obj.div || null, parsed_data = obj.data || [], chrom = obj.chr || '1', start = obj.start || null, range_length = obj.range || null;
    var ucsc_genome_url = 'http://genome.ucsc.edu/cgi-bin/hgTracks';
    var tile_listener = function(feature){
        window.open(ucsc_genome_url + '?db=hg18&position=chr' + feature.chr + ':' + feature.start +
            '-'+ feature.end,'_blank');
        return false;
    };

    var unlocated_tooltip_items = { };
    unlocated_tooltip_items[re.ui.feature1.label] = function(tie) {
        return tie.sourceNode.pretty_label + ' ' + tie.sourceNode.source};
    unlocated_tooltip_items[re.ui.feature2.label] = function(tie) {
        return tie.targetNode.pretty_label + ' ' + tie.targetNode.source };

    var located_tooltip_items = {
        Feature : function(tie) {
            return tie.label + ' ' + tie.source + ' Chr' +tie.chr + ' ' +
                tie.start + (tie.end != null ? '-'+tie.end : '')  + ' '+ tie.label_mod;}
    };
    var   inter_tooltip_items = { };
    inter_tooltip_items[re.ui.feature1.label] = function(tie) {
        return tie.sourceNode.pretty_label + ' ' + tie.sourceNode.source + ' Chr' +tie.sourceNode.chr + ' ' +tie.sourceNode.start +'-'+
            tie.sourceNode.end + ' ' + tie.sourceNode.label_mod;};
    inter_tooltip_items[re.ui.feature2.label] = function(tie) {
        return tie.targetNode.pretty_label + ' ' + tie.targetNode.source +
            ' Chr' + tie.targetNode.chr+ ' ' +tie.targetNode.start +'-'+tie.targetNode.end + ' ' + tie.targetNode.label_mod};

    re.model.association.types.forEach( function(assoc) {
        vq.utils.VisUtils.extend(unlocated_tooltip_items, assoc.vis.tooltip.entry);
        vq.utils.VisUtils.extend(inter_tooltip_items, assoc.vis.tooltip.entry);
    });


    var hit_map = parsed_data['unlocated'].filter(function(link) { return  link.node1.chr == chrom;})
        .map(function(link) {
            var obj = {};
            re.model.association.types.forEach(function(assoc) {
                obj[assoc.ui.grid.store_index] = link[assoc.query.id];
            })
            var node1_clone = vq.utils.VisUtils.extend(obj,link.node1);
            node1_clone.start = node1_clone.start; node1_clone.end = node1_clone.end;
            node1_clone.sourceNode = vq.utils.VisUtils.extend({},link.node1);
            node1_clone.targetNode = vq.utils.VisUtils.extend({},link.node2);
            return node1_clone;
        }).concat(parsed_data['unlocated'].filter(function(link) { return  link.node2.chr == chrom;})
        .map(function(link) {
            var obj = {};
            re.model.association.types.forEach(function(assoc) {
                obj[assoc.ui.grid.store_index] = link[assoc.query.id];
            })
            var node1_clone = vq.utils.VisUtils.extend(obj,link.node2);
            node1_clone.start = node1_clone.start; node1_clone.end = node1_clone.end;
            node1_clone.sourceNode = vq.utils.VisUtils.extend({},link.node1);
            node1_clone.targetNode = vq.utils.VisUtils.extend({},link.node2);
            return node1_clone;
        }));


    var tie_map = parsed_data['network'].filter(function(link) {
        return link.node1.chr == chrom && link.node2.chr == chrom &&
            Math.abs(link.node1.start - link.node2.start) > re.plot.proximal_distance;})
        .map(function(link) {
            var obj = {};
            re.model.association.types.forEach(function(assoc) {
                obj[assoc.ui.grid.store_index] = link[assoc.query.id];
            });
            var node1_clone = vq.utils.VisUtils.extend(obj,link.node1);
            node1_clone.start = link.node1.start <= link.node2.start ?
                link.node1.start : link.node2.start;
            node1_clone.end = link.node1.start <= link.node2.start ? link.node2.start : link.node1.start;
            node1_clone.start = node1_clone.start;node1_clone.end = node1_clone.end;
            node1_clone.sourceNode = vq.utils.VisUtils.extend({},link.node1);
            node1_clone.targetNode = vq.utils.VisUtils.extend({},link.node2);
            re.model.association.types.forEach(function(assoc) {
                node1_clone[assoc.ui.grid.store_index] = link[assoc.query.id];
            });
            return node1_clone;
        });

    var neighbor_map = parsed_data['network'].filter(function(link) {
        return link.node1.chr == chrom && link.node2.chr == chrom &&
            Math.abs(link.node1.start - link.node2.start) < re.plot.proximal_distance;})
        .map(function(link) {
            var obj = {};
            re.model.association.types.forEach(function(assoc) {
                obj[assoc.ui.grid.store_index] = link[assoc.query.id];
            });
            var node1_clone = vq.utils.VisUtils.extend(obj,link.node1);
            node1_clone.start = node1_clone.start;node1_clone.end = node1_clone.end;
            node1_clone.sourceNode = vq.utils.VisUtils.extend({},link.node1);
            node1_clone.targetNode = vq.utils.VisUtils.extend({},link.node2);
            return node1_clone;
        });

    var locations = vq.utils.VisUtils.clone(parsed_data['features']).filter(function(node) { return node.chr == chrom;})
        .map(function (location)  {
            return vq.utils.VisUtils.extend(location,{ start: location.start, end : location.end , label : location.value});
        });
    var node2_locations = parsed_data['network']
        .filter(function(link) {  return link.node2.chr == chrom;})
        .map(function(link) {
            return vq.utils.VisUtils.extend(link.node2, { start : link.node2.start, end: link.node2.end});
        });

    locations = locations.concat(node2_locations);

    var location_map = pv.numerate(locations,function(node) { return node.id+'';});

    locations = pv.permute(locations,pv.values(location_map));

    var data_obj = function() { return {
        PLOT :     {
            width:800,
            height:700,
            min_position:1,
            max_position:maxPos,
            vertical_padding:20,
            horizontal_padding:20,
            container : div,
            context_height: 100,
                            axes : {
                                x: {
                                    label : 'Chromosome ' + obj.chr + ' (Mb)',
                                    scale_multiplier : (1 / re.MILLION)
                                }
                            }},
        TRACKS : [
            { type: 'tile',
                label : 'Feature Locations',
                description : 'Genome Location of Features',
                CONFIGURATION: {
                    fill_style : function(node) { return re.plot.colors.node_colors(node.source);},          //required
                    stroke_style : function(node) { return re.plot.colors.node_colors(node.source);},          //required
                    track_height : 50,           //required
                    tile_height:13,                //required
                    track_padding: 10,             //required
                    tile_padding:5,              //required
                    tile_overlap_distance:1 * re.MILLION,
                    notifier:tile_listener,         //optional
                    track_fill_style : pv.color('#EEDEDD'),
                    track_line_width : 1,
                    track_stroke_style: pv.color('#000000')
                },
                OPTIONS: {
                   tooltip_links :re.display_options.circvis.tooltips.feature_links,
                    tooltip_items :  re.display_options.circvis.tooltips.feature     //optional
                },
                data_array : locations
            },  { type: 'glyph',
                label : 'Associations lacking Genomic Coordinates',
                description : '',
                CONFIGURATION: {
                    fill_style : function(hit) { return re.plot.colors.node_colors(hit.source);},
                    stroke_style : null,
                    track_height : 60,
                    track_padding: 20,
                    tile_padding:6,              //required
                    tile_overlap_distance:.1 * re.MILLION,    //required
                    shape :  'dot',
                    tile_show_all_tiles : true,
                    radius : 3,
                    track_fill_style : pv.color('#EEEEEE'),
                    track_line_width : 1,
                    track_stroke_style: pv.color('#000000'),
                    notifier:inter_chrom_click
                },
                OPTIONS: {
                    tooltip_items : unlocated_tooltip_items
                },
                data_array : hit_map
            },
            { type: 'glyph',
                label : 'Proximal Feature Associations',
                description : '',
                CONFIGURATION: {
                    fill_style : function(link) { return re.plot.colors.link_sources_colors([link.sourceNode.source,link.targetNode.source])},
                    stroke_style : null,
                    track_height : 80,
                    track_padding: 20,
                    tile_padding:4,              //required
                    tile_overlap_distance:1 * re.MILLION,    //required
                    shape :  'dot',
                    tile_show_all_tiles : true,
                    radius : 3,
                    track_fill_style : pv.color('#DDEEEE'),
                    track_line_width : 1,
                    track_stroke_style: pv.color('#000000'),
                    notifier:inter_chrom_click
                },
                OPTIONS: {
                    tooltip_items : inter_tooltip_items
                },
                data_array : neighbor_map
            },
            { type: 'tile',
                label : 'Distal Intra-Chromosomal Associations',
                description : '',
                CONFIGURATION: {
                    fill_style :  function(link) { return re.plot.colors.link_sources_colors([link.sourceNode.source,link.targetNode.source]);},
                    stroke_style : function(link) { return re.plot.colors.link_sources_colors([link.sourceNode.source,link.targetNode.source]);},
                    track_height : 280,
                    track_padding: 15,             //required
                    tile_height : 2,
                    tile_padding:7,              //required
                    tile_overlap_distance:.1 * re.MILLION,    //required
                    tile_show_all_tiles : true,
                    track_fill_style : pv.color('#EEDDEE'),
                    track_line_width : 1,
                    track_stroke_style: pv.color('#000000'),
                    notifier : inter_chrom_click
                },
                OPTIONS: {
                    tooltip_items : inter_tooltip_items
                },
                data_array : tie_map
            }]
    }
    };
    var chrom_leng = vq.utils.VisUtils.clone(re.plot.chrome_length);
    var chr_match = chrom_leng.filter(function(chr_obj) { return chr_obj.chr_name == chrom;});
    var maxPos = Math.ceil(chr_match[0]['chr_length']);

    var lin_browser = new vq.LinearBrowser();
    var lin_data = {DATATYPE: 'vq.models.LinearBrowserData',CONTENTS: data_obj()};

    lin_browser.draw(lin_data);

    if (start != null && start > 0 && range_length != null && range_length > 0) {
        lin_browser.setFocusRange(start,range_length);
    }


    var e = new vq.events.Event('render_complete','linear',obj);
    e.dispatch();

    return lin_browser;
}


function isOrdinal(label) {
    return label =='B';
}

function isNominal(label) {
    return  label =='C';
}

function isNonLinear(label) {
    return isOrdinal(label) || isNominal(label);
}


function isNAValue(data_type,value) {
    if (isNonLinear(data_type))  return value == 'NA';
    else  return isNaN(value);
}

re.MILLION = 1000000;

function scatterplot_draw(params) {
    var data = params.data || re.plot.scatterplot_data || {data:[]},
        div = params.div || null,
        regression_type = params.regression_type || 'none',
        reverse_axes = params.reverse_axes || false,
        discretize_x = params.discretize_x || false,
        discretize_y = params.discretize_y || false;
    re.plot.scatterplot_data = data;
    if (data === undefined) {return;}  //prevent null plot
    var dataset_labels=re.ui.getDatasetLabels();
    var patient_labels = dataset_labels['patients'];
    var f1 = data.f1alias, f2 = data.f2alias;
    var f1id = data.f1alias, f2id=data.f2alias;
    var f1label = re.functions.lookupFFN(data.f1alias),
        f2label = re.functions.lookupFFN(data.f2alias);
    var f1AxisLabel = f1label + re.functions.prettyFeatureLabelSuffix(data.f1alias),
        f2AxisLabel = f2label  + re.functions.prettyFeatureLabelSuffix(data.f2alias);
    var f1values, f2values;
    var category_labels = new Array(2);
    var categories = re.plot.scatterplot_category ? re.plot.scatterplot_category.values : undefined;
    var label_fn, uniq_cat, temp;

    function makeLabelMap(label_fn) {
        var fn = label_fn;
        return function(cat) { 
            return fn ? fn(cat) : cat;
        };
    }
    if (isNonLinear(f1id[0])) {
        f1values = data.f1values;
        //calculate human readable tick labels:
         label_fn= re.functions.getValueToLabelFunction(f1id, f1label);
        //labels to display for category values;
        uniq_cat = pv.uniq(f1values);
         category_labels[0] = makeLabelMap(label_fn);
    } else {
        f1values = data.f1values.map(function(val) {return parseFloat(val);});
    }
    
    if (isNonLinear(f2id[0])) {
        f2values = data.f2values;
         //calculate human readable tick labels:
         label_fn= re.functions.getValueToLabelFunction(f2id, f2label);
        //labels to display for category values;
        uniq_cat = pv.uniq(f2values);
        category_labels[1] = makeLabelMap(label_fn);
    } else {
        f2values = data.f2values.map(function(val) {return parseFloat(val);});
    }

    var dot_colors;
    var fill_style_fn = undefined;
    var stroke_style_fn = undefined;
    if (categories !== undefined) {
        var category_feature_alias = re.plot.scatterplot_category.alias;
        var labelFunction = re.functions.getValueToLabelFunction(category_feature_alias, re.functions.lookupFFN(category_feature_alias));
        //labels to display for category values;
        var uniq_categories = pv.uniq(categories);
        var mappedValues = labelFunction ? uniq_categories.map(labelFunction) : uniq_categories;
        mappedValues.sort();
        mappedValues.sort(function(a,b) { 
            if (b === 'NA'){ return -1;}
            else if (a === 'NA') { return 1;} 
            return 0;});

        dot_colors = re.functions.assignValueColors(categories);

        var mappedColors = {};
        Object.keys(dot_colors).forEach(function(category){
            var modified_cat = labelFunction ? labelFunction(category) : category;
            mappedColors[modified_cat] = dot_colors[category];
        });

        fill_style_fn = function(d) {
            return dot_colors[d.category];
        };
        stroke_style_fn = function(d) {
            return dot_colors[d.category];
        }
        renderScatterplotLegend(mappedValues,mappedColors);
    }
    else {
        fill_style_fn = function() {return pv.color('steelblue').alpha(0.2);};
        stroke_style_fn = function() {return "steelblue";};
    }
    if (f1values.length != f2values.length) {
        vq.events.Dispatcher.dispatch(new vq.events.Event('render_fail','scatterplot','Data cannot be rendered correctly.'));
        return;
    }
    var data_array = [];
    for (var i=0; i< f1values.length; i++) {
        if (!isNAValue(f1id[0],f1values[i]) && !isNAValue(f2id[0],f2values[i]) ) {
            var obj = {};
            obj[f1] = f1values[i], obj[f2]=f2values[i], obj['patient_id'] = patient_labels[i];
            if (categories !== undefined) {
                obj.category = categories[i];
                obj.patient_id = patient_labels[i] + " " + categories[i];
            }
	    data_array.push(obj);
        }
    }
    function reverseAxes() {
        config.CONTENTS.xcolumnid = f2;config.CONTENTS.ycolumnid=f1;config.CONTENTS.xcolumnlabel=f2AxisLabel;config.CONTENTS.ycolumnlabel=f1AxisLabel;
        tooltip[data.f1alias]=f2;tooltip[data.f2alias]=f1;
        config.CONTENTS.tooltip_items=tooltip;
            //swap label maps        
        if (cubbyhole || violin) { category_labels.unshift(category_labels[1]); category_labels.pop(); }
    }
    var tooltip = {};
    tooltip[data.f1alias] = f1,tooltip[data.f2alias] = f2,tooltip['Sample'] = 'patient_id';

    if(discretize_x && !isNonLinear(f1id[0])) {
        var values1 = data_array.map(function(obj){return obj[f1];});
        var binFunc1 = binData(values1);
        var cat1 = new Array();
        data_array.forEach(function(val) {
            val[f1] = binFunc1(val[f1]);
            cat1.push(val[f1]);
        });
        //calculate human readable tick labels:
         label_fn= re.functions.getValueToLabelFunction(f1id, f1label);
        //labels to display for category values;
        uniq_cat = pv.uniq(cat1);
        category_labels[0] = makeLabelMap(label_fn);
    }

    if(discretize_y && !isNonLinear(f2id[0])) {
        var values2 = data_array.map(function(obj){return obj[f2];});
        var binFunc2 = binData(values2);
        var cat2 = new Array();
        data_array.forEach(function(val) {
            val[f2] = binFunc2(val[f2]);
            cat2.push(val[f2]);
        });
          //calculate human readable tick labels:
         label_fn= re.functions.getValueToLabelFunction(f2id, f2label);
        //labels to display for category values;
        uniq_cat = pv.uniq(cat2);
        category_labels[1] = makeLabelMap(label_fn);
    }

    f1id = (discretize_x ? 'C' : f1id[0]) + f1id.slice(1);
    f2id = (discretize_y ? 'C' : f2id[0]) + f2id.slice(1);
    var violin = (isNonLinear(f1id[0]) ^ isNonLinear(f2id[0])); //one is nonlinear, one is not
    var cubbyhole = isNonLinear(f1id[0]) && isNonLinear(f2id[0]);

    var sp,config;
    if (violin)     {
        sp = new vq.ViolinPlot();
        config ={DATATYPE : "vq.models.ViolinPlotData", CONTENTS : {
            PLOT : {container: div,
                width : 540,
                height: 300,
                vertical_padding : 40,
                horizontal_padding: 100,
                font :"14px sans"},
            data_array: data_array,
            xcolumnid: f1,
            ycolumnid: f2,
            valuecolumnid: 'patient_id',
            xcolumnlabel : f1AxisLabel,
            ycolumnlabel : f2AxisLabel,
            valuecolumnlabel : '',
            tooltip_items : tooltip,
            show_points : true,
            regression :regression_type,
            fill_style: fill_style_fn,
            stroke_style: stroke_style_fn,
            x_axis_tick_format: function(d) {
                var e = d + '';
                var c = category_labels[0](e);
                return c !== e ? c : (isNaN(parseFloat(d)) ? e : parseFloat(d).toPrecision(3))  ;
            },
            y_axis_tick_format: function(d) {
                return parseFloat(d).toPrecision(3);
            }
        }};
        if (isNonLinear(f2id[0])) {
            reverseAxes();
        }
        sp.draw(config);
    }
    else if(cubbyhole) {
        sp = new vq.CubbyHole();
        config ={DATATYPE : "vq.models.CubbyHoleData", CONTENTS : {
            PLOT : {container: div,
                width : 540,
                height: 300,
                vertical_padding : 40, horizontal_padding: 100, font :"14px sans"},
            data_array: data_array,
            xcolumnid: f1,
            ycolumnid: f2,
            valuecolumnid: 'patient_id',
            xcolumnlabel : f1AxisLabel,
            ycolumnlabel : f2AxisLabel,
            valuecolumnlabel : '',
            tooltip_items : tooltip,
            show_points : true,
            radial_interval : 7,
            fill_style: fill_style_fn,
            stroke_style: stroke_style_fn,  
            x_axis_tick_format: function(d) {
                var e = d + '';
                var c = category_labels[0](e);
                return c !== e ? c : (isNaN(parseFloat(d)) ? e : parseFloat(d).toPrecision(3))  ;
            },
            y_axis_tick_format: function(d) {
                 var e = d + '';
                var c = category_labels[1](e);
                return c !== e ? c : (isNaN(parseFloat(d)) ? e : parseFloat(d).toPrecision(3))  ;
            }
        }};
        if (reverse_axes) {
            reverseAxes();
        }
        sp.draw(config);
    }
    else {
        sp = new vq.ScatterPlot();

        config ={DATATYPE : "vq.models.ScatterPlotData", CONTENTS : {
            PLOT : {container: div,
                width : 540,
                height: 300,
                vertical_padding : 40, horizontal_padding: 100, font :"14px sans"},
            data_array: data_array,
            xcolumnid: f1,
            ycolumnid: f2,
            valuecolumnid: 'patient_id',
            xcolumnlabel : f1AxisLabel,
            ycolumnlabel : f2AxisLabel,
            valuecolumnlabel : '',
            tooltip_items : tooltip,
            radial_interval : 7,
            regression :regression_type,
            fill_style: fill_style_fn,
            stroke_style: stroke_style_fn,
            x_axis_tick_format: function(d) {
                return d.toPrecision(3);
            },
            y_axis_tick_format: function(d) {
                return d.toPrecision(3);
            }
        }};
        if (reverse_axes) {
            reverseAxes();
        }
        sp.draw(config);
    }

    var e = new vq.events.Event('render_complete','scatterplot',sp);
    e.dispatch();
    return sp;
}


function initializeGraph(obj) {
    var div_id = obj.div;

    // initialization options
    var options = {
        // where you have the Cytoscape Web SWF
        swfPath: re.cytoscape['swfPath'],
        // where you have the Flash installer SWF
        flashInstallerPath: re.cytoscape['flashInstallerPath']
    };
    re.cytoscape.obj = new org.cytoscapeweb.Visualization(div_id, options);
    re.cytoscape.obj["customTooltip"] = function(data){
        return "Chr: "+ data.chr + "\n" + "Start: " + data.start + "\n" + "End: " + data.end;
    };
    re.cytoscape.data = obj.network;
}


function populateGraph(obj) {

    // you could also use other formats (e.g. GraphML) or grab the network data via AJAX
    var network = {
        dataSchema: {
            nodes: [ { name: "label", type: "string" },
                //{ name: "genescore", type: "number" },
                { name: "type", type: "string" },
                { name: "chr", type: "string" },
                { name: "start", type: "int" },
                { name: "end", type: "int" }
            ],
            edges: [ { name: "label", type:"string"},
                { name: "directed", type: "boolean", defValue: false} ]
                .concat( re.ui.filters.link_distance ? {name:'link_distance', type: 'int'}: [])
                .concat(
                re.model.association.types.map(function(obj) { return obj.vis.network.edgeSchema;}))
        },
        data:  re.cytoscape.data
    };

    var visual_style = {
        nodes: {
            shape:'ELLIPSE',
            size: 25,
            color: {
                defaultValue: '#FFF',
                customMapper: { functionName :'mapFeatureType'}
            },
            labelFontSize : 20,
            labelHorizontalAnchor: "center",
            labelVerticalAnchor : "top",
            tooltipText: {customMapper: { functionName: "customTooltip" }}
        },
        edges: {
            width: 3,
            color: "#0B94B1"
        }
    };

    // init and draw

    function rgbToHex(R,G,B) {return '#' + toHex(R)+toHex(G)+toHex(B)}
    function toHex(n) {
        n = parseInt(n,10);
        if (isNaN(n)) return "00";
        n = Math.max(0,Math.min(n,255));
        return "0123456789ABCDEF".charAt((n-n%16)/16)
            + "0123456789ABCDEF".charAt(n%16);
    }

    re.cytoscape.obj["mapFeatureType"] =  function(data)   {
        var color = re.plot.colors.node_colors(data.type);
        return rgbToHex(color.r,color.g,color.b);
    };
    var layout =getNetworkLayout();

    re.cytoscape.obj.ready(function() {
        re.cytoscape.obj.initialized = true;
        re.cytoscape.obj.addListener("click", "edges", function(event){
            var data = event.target.data;
            var target = data.target.split(":");
            var source = data.source.split(":");
            var association = {sourceNode: {id: data.source, label: source[2] },
            targetNode: {id: data.target, label: target[2]}}; 
            initiateDetailsPopup(association);
        });
        re.display_options.cytoscape.ready = true;
        var e = new vq.events.Event('render_complete','graph',{});
        e.dispatch();
    });

    re.cytoscape.obj.draw({ network: network,

        // let's try another layout
        layout:layout,

        // set the style at initialisation
        visualStyle: visual_style,
        nodeTooltipsEnabled: true
        });
}


function modifyCircvisObject(obj) {
    if (re.display_options.circvis.ticks.wedge_width_manually) {
        obj.PLOT.width=re.display_options.circvis.width;
    }
    if (re.display_options.circvis.ticks.wedge_width_manually) {
        obj.PLOT.height=re.display_options.circvis.height;
    }
    var chrom_keys = re.display_options.circvis.chrom_keys;

    var chrom_leng = vq.utils.VisUtils.clone(re.plot.chrom_length);

    if (re.display_options.circvis.ticks.tile_ticks_manually) {
        obj.TICKS.OPTIONS.tile_ticks  = true;
        obj.TICKS.OPTIONS.overlap_distance = re.display_options.circvis.ticks.tick_overlap_distance;
    }

    obj.PLOT.rotate_degrees = re.display_options.circvis.rotation;
    if (re.display_options.circvis.ticks.wedge_width_manually) {
        obj.TICKS.OPTIONS.wedge_width = re.display_options.circvis.ticks.wedge_width;
    }
    if (re.display_options.circvis.ticks.wedge_height_manually) {
        obj.TICKS.OPTIONS.wedge_height = re.display_options.circvis.ticks.wedge_height;
    }
    return obj;
}

