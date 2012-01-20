/*
 globals.js

 Import this before MVC scripts.
 */
 if (re === undefined) { re = {};}

vq.utils.VisUtils.extend(re, {

    analysis : {
        dataset_method_clause : ' where method=\'RF-ACE\''
    }
    state : {
      once_loaded : false,
      query_cancel : false,
        network_query : ''
    },
    rest : {
        query : '/query'
    },
    params: {
        json_out:'&tqx=out:json_array',
        query : 'tq='
    },
    databases: {
        base_uri : '',
        metadata: {
        uri: '/google-dsapi-svc/addama/datasources/csacr'
        },
        rf_ace: {
            uri: '/google-dsapi-svc/addama/datasources/tcga'
        },
        solr : {
            uri : '/solr',
            select : '/select/'

        }
    },
    tables: {
        dataset :   '/regulome_explorer_dataset',
        label_lookup : '/refgene',
        chrom_info : '/chrom_info',
        current_data : '',
        network_uri : '',
        feature_uri : '',
        clin_uri : '',
        patient_uri : '',
        feature_data_uri : '',
        pathway_uri : ''
    },
/*
 *        URL's
 *            addresses to pathways used by MEDLINE tab
 */
    pathways: {
        wikipw_url : 'http://www.wikipathways.org/index.php?title=Special%3ASearchPathways&doSearch=1&sa=Search&species=Homo+sapiens&query=',
        biocarta_url : 'http://www.biocarta.com/pathfiles/h_',
        kegg_url : 'http://www.genome.jp/kegg-bin/search_pathway_text?map=map&mode=1&viewImage=true&keyword=',
        pw_commons_url : 'http://www.pathwaycommons.org/pc/webservice.do?version=3.0&snapshot_id=GLOBAL_FILTER_SETTINGS&record_type=PATHWAY&format=html&cmd=get_by_keyword&q='
    },

    display_options : {
        circvis : {
            rings:{
                karyotype: {
                    hidden :false
                },
                cnvr : {
                    hidden : false
                },
                pairwise_scores : {
                    hidden : false
                }
            },
            ticks : {
                tick_overlap_distance : null,
                tile_ticks_manually : false,
                wedge_width: 1,
                wedge_width_manually: false,
                wedge_height: 1,
                wedge_height_manually: false
            },
            network : {
                tile_nodes : false,
                node_overlap_distance : null
            },
            width : 800,
            height : 800,
            ring_radius : 55,
            rotation : 0,
            chrom_keys : ["1","2","3","4","5","6","7","8","9","10",
                "11","12","13","14","15","16","17","18","19","20","21","22","X","Y"]
        },
        cytoscape : {
            frame_ready : false,
            ready : false,
            layout : 'force_directed'
        }
    },
    circvis_obj : {},
    cytoscape: {
        obj : {},
        data:[],
        swfPath : "/cytoscape_web/swf/CytoscapeWeb",
        flashInstallerPath : "/cytoscape_web/swf/playerProductInstall"
    },


    plot: {
        locatable_source_list : ['GEXP','METH','CNVR','MIRN','GNAB','RPPA'],
        unlocatable_source_list : ['CLIN','SAMP','PRDM'],
        link_sources_array :  [],

        colors: {
            link_type_colors : pv.colors("#c2c4ff","#e7cb94","#cedb9c","#e7969c","#e1daf9","#b8e2ef"),
            link_sources_colors : {},
            source_color_scale : pv.Colors.category10(),
            stroke_style_attribute : 'white',
            getStrokeStyleAttribute : function() { return re.plot.colors.stroke_style_attribute; },
            setStrokeStyleAttribute : function(attr) { re.plot.colors.stroke_style_attribute = attr; }
        },
        inter_scale : pv.Scale.linear(0.00005,0.0004).range('lightpink','red'),
        linear_unit : 100000,
        chrome_length : [],

        scatterplot_data : null
    },
    ui: {
        chromosomes:  [],
        dataset_labels: [],
        getDatasetLabels : function () { return re.ui.dataset_labels;},
        setDatasetLabels :function(obj) { re.ui.dataset_labels = obj;},
        /*
         *        Order combo list
         *          Objects consist of fields:
         *               value: - String - id to be passed to controller
         *               label - String - id to be used by UI
         */
        limit_list : [{value:10,label:'10'},{value:20,label:'20'},{value:40, label:'40'},{value:100, label:'100'},{value:200, label:'200'},
            {value:1000, label:'1000'},{value:2000, label:'2000'}],
        /*
         *        Limit combo list
         *          Objects consist of fields:
         *               value: - String - id to be passed to controller
         *               label - String - id to be used by UI
         */
        order_list : []
    },

/*
 Window handles
 global handles to the masks and windows used by events
 */

 windows : {
     details_window : null,
    helpWindowReference : null,
     masks: {
     details_window_mask: null,
         network_mask : null
     }
    },
    data: {
        parsed_data : {network : null,unlocated : null,features : null,unlocated_features:null,located_features:null},
            responses : {network : null},
            patients : {data : null}
   }
});


(function() {
    re.ui.chromosomes.push({value:'*',label:'All'});
    for(var i =1;i <= 22; i++) {
        re.ui.chromosomes.push({value:i+'',label:i+''});
    }
    re.ui.chromosomes.push({value:'X',label:'X'});
    re.ui.chromosomes.push({value:'Y',label:'Y'});

/*
 Label map
 Hash maps feature type id to feature type label
 */
    re.label_map = {
        '*':'All',
        'GEXP' :'Gene Expression',
        'METH' : 'Methylation',
        'CNVR' : 'Copy # Var Region',
        'CLIN' : 'Clinical',
        'MIRN': 'microRNA',
        'GNAB' : 'Gene Aberration',
        'SAMP' : 'Tumor Sample',
        'PRDM' : 'Paradigm Feature',
        'RPPA'  : 'Reverse Phase Protein Array'
    };
     re.plot.all_source_list = pv.blend([re.plot.locatable_source_list,re.plot.unlocatable_source_list]);
     re.plot.all_source_map = pv.numerate(re.plot.all_source_list);
     re.plot.locatable_source_map = pv.numerate(re.plot.locatable_source_list);

        re.plot.proximal_distance = 2.5 * re.plot.linear_unit;

     re.plot.colors.node_colors = function(source) { return re.plot.colors.source_color_scale(re.plot.all_source_map[source]);};
     re.model.association.types.forEach(function(obj) { 
        re.ui.order_list.push({value:obj.id,label:obj.label});
     })

})();


