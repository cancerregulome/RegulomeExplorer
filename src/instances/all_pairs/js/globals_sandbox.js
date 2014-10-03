/*
 globals.js

 Import this before MVC scripts.
 */
if (re === undefined) {
    re = {};
}

vq.utils.VisUtils.extend(re, {

    title: 'Regulome Explorer: All Pairs',
    google: {
        analytics_id: 'UA-20488457-2'
    },
    analysis: {
        dataset_method_clause: ' where method=\'pairwise\'',
        directed_association: false,
        hidden: false
    },
    state: {
        once_loaded: false,
        query_cancel: false,
        network_query: ''
    },
    node: {
        uri: '/node',
        services: {
            data: '/data',
            lookup:'/lookup/label/entrez'
        }
    },
    rest: {
        query: '/query',
        echo: '/echo',
        convert: '/convert',
        select: '/distributed_select'
    },
    params: {
        json_out: '&tqx=out:json_array',
        query: 'tq=',
        network_query: 'q=',
        network_json_out: '&wt=json',
        network_dataset_select: '&fq=%2Bdataset%3A'
    },
    databases: {
        base_uri: '',
        metadata: {
            uri: '/google-dsapi-svc/addama/datasources/csacr'
        },
        rf_ace: {
            uri: '/google-dsapi-svc/addama/datasources/re'
        },
        networks: {
            uri: '/data'
        },
        medline: {
            uri: '/solr/core0',
            select: '/select/'
        },
        ffn : {
            uri: '/addama/services/datastores/ffn_sandbox'
        }
    },
    tables: {
        dataset: '/regulome_explorer_dataset',
        label_lookup: '/refgene',
        chrom_info: '/chrom_info',
        entrez_gene: '/entrez_gene',
        current_data: '',
        network_uri: '',
        feature_uri: '',
        features_uri: '',
        clin_uri: '',
        patient_uri: '',
        feature_data_uri: '',
        pathway_uri: '',
        pathways:'/pathways',
        ffn: '/feature_matrix'
    },
    /*
     *        URL's
     *            addresses to pathways used by MEDLINE tab
     */
    help: {
        strings: {
            // help strings
            filteringHelpString: 'The Filter Panel can be used to specify the type of associations to display in the View Panels.  Queries may specify attributes of each feature, as well as the attributes of the association.',
            pathwaysHelpString: 'The Pathway Panel provides a view onto the individual members of the selected pathway.  It displays the distribution of assoication types for each member.  Hovering over a member activates a highlight mode on the cirular layout panel.  Clicking on a feature locks that highlight mode in.',
            toolsHelpString: 'The Tool Panel provides a way for filtering, selecting, and exporting different datasets.  ' + 'The Panel can also be minimized by clicking the `>>` icon, which then expands main panel view.  ' + 'See each individual tool help for further details on their capabilities.',
            dataLevelViewHelpString: 'The Data-level View is a data table displaying the feature selected in the Genome-level ' + 'view and its related links.  This view allows the user to easily navigate all the related data values ' + 'associated with a single feature.',
            chromosomeLevelHelpString: 'The Chromosome-level View provides a way to navigate the features of a given dataset on ' + 'a single chromosome level.  The view will be populated with chromosome information once a chromosome is ' + 'selected by either clicking on a specific chromosome number  or end-point of a link in the Genome-level view.<p>' + 'Feature information on a given chromosome is displayed in 4 different plots.  The Distal Intra-Chromosome ' + 'Correlates plot shows the location of the predictors for a target within a chromosome.  The Proximal Feature ' + 'Predictors plot also displays feature associations within the chromosome, but only displays ones where the ' + 'start and end location of a predictor is less than 250,000 bp in length.  The Unmapped Feature Coorelates ' + 'shows features for which there does not exist a mapped location.  Finally, the Feature Locations plot shows ' + 'the locations of the various targets involved in the links.   All plots have tooltips giving more details of ' + 'the underlying data. Coorelation scatterplots are displayed when an item is selected within a plot.<p>' + 'A sliding scale showing all feature locations is given at the bottom of the view.  A range can be selected to zoom ' + 'in on a given chromosome location by clicking the mouse and dragging it over a region.  The same zoom and ' + 'selection capability is also available within the top 4 plots.',
            genomeLevelHelpString: 'The Genome-level View is an interactive circular plot showing the links between target and ' + 'predictor features within the dataset.  Tooltips over various points give the underlying data associated with ' + 'a node or link.  Clicking on the links within the plot will display a coorelation scatterplot of the associated ' + 'features.  Mouse clicks on chromosomes, links, and nodes within the plot also bring up drill-down information ' + 'in the Chromosome-level and Data-level views.<p>' + 'The subset of data shown in the circular plot can be filtered by using the tools panel filtering section.  Once a plot ' + 'of interest has been found, an export of the plot can be achieved by using the tools panel export option.  ' + 'The mouse-click behavior of the interactive plot can be changed by choosing different options in the tools ' + 'panel selection area.'
        },
        links: {
            user_guide: 'http://wiki.cancerregulome.org',
            quick_start: 'http://wiki.cancerregulome.org/bin/view/All+Pairs+Analysis/8.1+Quick+Walk-through+for+One+Feature',
            contact_us: 'http://wiki.cancerregulome.org',
            analysis_summary: '/help/all_pairs/analysis.html',
            bug_report: 'http://code.google.com/p/regulome-explorer/issues/entry',
            user_group: 'http://groups.google.com/group/regulome-explorer',
            ideogram: '/help/msae/images/ideogram.png'
        }
    },
    pathways: {
        wikipw_url: 'http://www.wikipathways.org/index.php?title=Special%3ASearchPathways&doSearch=1&sa=Search&species=Homo+sapiens&query=',
        biocarta_url: 'http://www.biocarta.com/pathfiles/h_',
        kegg_url: 'http://www.genome.jp/kegg-bin/search_pathway_text?map=map&mode=1&viewImage=true&keyword=',
        pw_commons_url: 'http://www.pathwaycommons.org/pc/webservice.do?version=3.0&snapshot_id=GLOBAL_FILTER_SETTINGS&record_type=PATHWAY&format=html&cmd=get_by_keyword&q='
    },

    display_options: {
        circvis: {
            rings: {
                karyotype: {
                    hidden: false,
                    radius: 28
                },
                cnvr: {
                    hidden: true,
                    radius: 40
                },
                pairwise_scores: {
                    value_field: re.model.association.types[0].query.id,
                    hidden: false,

                    manual_y_color_scale:false,
                    min_y_color:'#0000FF',
                    max_y_color:'#FF0000',
                    manual_y_values: false,
                    min_y_value:0,
                    max_y_value:1
                }
            },
             quantiled_data: {
                    GEXP: true,
                    CNVR: true,
                    METH: true
            },
            tooltips: {
                feature: {
                    Feature: function(node) {
                        var pos = node.label.indexOf('_');
                        var label = (pos > 0 ? node.label.slice(0, pos) : node.label);
                        label = (label == 'GisticArm' ? "Arm " + node.label.split('_')[1] : label);
                        return label;
                    },
                    Source: function(node) {
                        return re.label_map[node.source];
                    },
                    'Location': function(node) {
                        return 'Chr' + node.chr + ' ' + node.start + (node.end === '' ? '' : '-' + node.end) + ' ';
                    },
                    Annotations: parseAnnotationList
                },
                unlocated_feature : {},
                karyotype_feature: {},
                edge: {},
                link_objects: [
                    {
                        label: 'Pubcrawl',
                        url: 'http://explorer.cancerregulome.org/pubcrawl/',
                        uri: '?term=fbxw7&dataset=gbm_1031',
                        config_object: function(feature) {
                            return 'http://explorer.cancerregulome.org/pubcrawl/?term='+feature.label+'&dataset=' + re.tables.current_data;
                        }
                    }, //pubcrawl
                    {
                        label: 'UCSC Genome Browser',
                        url: 'http://genome.ucsc.edu/cgi-bin/hgTracks',
                        uri: '?db=hg19&position=chr',
                        config_object: function(feature) {
                            return 'http://genome.ucsc.edu/cgi-bin/hgTracks?db=hg19&position=chr' + feature.chr + ':' + feature.start + (feature.end === '' ? '' : '-' + feature.end);
                        }
                    }, //ucsc_genome_browser
                    {
                        label: 'Ensemble',
                        url: 'http://uswest.ensembl.org/Homo_sapiens/Location/View',
                        uri: '?r=',
                        config_object: function(feature) {
                            return 'http://uswest.ensembl.org/Homo_sapiens/Location/View?r=' + feature.chr + ':' + feature.start + (feature.end === '' ? '' : '-' + feature.end);
                        }
                    }, //ensemble
                    {
                        label: 'Cosmic',
                        url: 'http://www.sanger.ac.uk/perl/genetics/CGP/cosmic',
                        uri: '?action=bygene&ln=',
                        config_object: function(feature) {
                            return ['CNVR', 'MIRN','METH'].indexOf(feature.source) < 0 ? 'http://www.sanger.ac.uk/perl/genetics/CGP/cosmic?action=bygene&ln=' + feature.label : null;
                        }
                    },  {
                        label: 'NCBI',
                        url: 'http://www.ncbi.nlm.nih.gov/gene/',
                        uri: '',
                        selector : Ext.DomQuery.compile('a[href*=zzzZZZzzz]'),
                        config_object: function(feature) {
                            return 'http://www.ncbi.nlm.nih.gov/gene?term='+feature.label;
                    }
                }, {
                    label: 'miRBase',
                    url: 'http://mirbase.org/cgi-bin/query.pl',
                    uri: '?terms=',
                    config_object: function(feature) {
                        return feature.source == 'MIRN' ? 'http://www.mirbase.org/cgi-bin/query.pl?terms=' + feature.label : null;
                    }
                }
                   ],
                //link_objects
                edge_links: new Object(null),
                feature_links : new Object(null)
            },
            ticks: {
                tick_overlap_distance: null,
                tile_ticks_manually: false,
                wedge_width: 1,
                wedge_width_manually: false,
                wedge_height: 1,
                wedge_height_manually: false
            },
            network: {
                tile_nodes: false,
                node_overlap_distance: null
            },
            width: 800,
            height: 800,
            ring_radius: 55,
            rotation: 0,
            chrom_keys: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "X", "Y"]
        },
        cytoscape: {
            frame_ready: false,
            ready: false,
            layout: 'force_directed'
        }
    },
    circvis_obj: {},
    cytoscape: {
        obj: {},
        data: [],
        swfPath: "/js/cytoscape_web/1.0/swf/CytoscapeWeb",
        flashInstallerPath: "/js/cytoscape_web/1.0/swf/playerProductInstall"
    },
    plot: {
        locatable_source_list: ['GEXP', 'METH', 'CNVR', 'MIRN', 'GNAB', 'RPPA'],
        unlocatable_source_list: ['CLIN', 'SAMP', 'PRDM'],
        link_sources_array: [],

        colors: {
            link_type_colors: pv.colors("#c2c4ff", "#e7cb94", "#cedb9c", "#e7969c", "#e1daf9", "#b8e2ef"),
            link_sources_colors: {},
            source_color_scale: pv.Colors.category10(),
            stroke_style_attribute: 'white',
            getStrokeStyleAttribute: function() {
                return re.plot.colors.stroke_style_attribute;
            },
            setStrokeStyleAttribute: function(attr) {
                re.plot.colors.stroke_style_attribute = attr;
            },
           
            categorical_values: {
                        'NA' :'#444444',
                        '0': '#1f77b4', //blue
                        '1': '#ff7f0e',  //orange
           },
           category_colors : [
              '#2ca02c',
                '#9467bd',
                '#d62728',
                '#8c564b',
                '#e377c2',
                '#7f7f7f',
                '#bcbd22',
                "#c2c4ff",
                "#e7cb94",
                "#cedb9c",
                "#e7969c",
                "#e1daf9",
                "#b8e2ef"
            ]
        },
        inter_scale: pv.Scale.linear(0.00005, 0.0004).range('lightpink', 'red'),
        linear_unit: 100000,
        chrome_length: [],
        legend: {},
        scatterplot_data: null,
        default_colorby_feature_alias: '',
         category_equivalents :{
                'NEG': '0' ,
                'NEGATIVE' : '0',
                'TUMOR_FREE' : '0',
                'NO': '0',
                'POS': '1',
                'POSITIVE' : '1',
                'WITH_TUMOR' : '1',
                'YES': '1'
            }
    },
    ui: {
        filters: {
            single_feature: true,
            link_distance: true
        },
        chromosomes: [],
        dataset_labels: [],
        categorical_sources_map : {},

        // Removes heading and trailing whitespaces from a string
    getDatasetLabels: function() {
            return re.ui.dataset_labels;
        },
        setDatasetLabels: function(obj) {
            re.ui.dataset_labels = obj;
        },
        current_pathway_members: [],
        getCurrentPathwayMembers: function() {
            return re.ui.current_pathway_members;
        },
        setCurrentPathwayMembers: function(obj) {
            re.ui.current_pathway_members = obj;
        },
        pathway_members_query_counts: {},
        getPathwayMembersQueryCounts: function() {
            return re.ui.pathway_members_query_counts;
        },
        setPathwayMembersQueryCounts: function(obj, ct) {
            re.ui.pathway_members_query_counts[obj] = ct;
        },
        pathway_bar_mouseover_behavior: {},
        getPathwayBarBehavior: function() {
            return re.ui.pathway_bar_mouseover_behavior;
        },
        setPathwayBarBehavior: function(obj) {
            re.ui.pathway_bar_mouseover_behavior = obj;
        },
        pathway_bar_mouseover_behavior_reset: {},
        getPathwayBarBehaviorReset: function() {
            return re.ui.pathway_bar_mouseover_behavior_reset;
        },
        setPathwayBarBehaviorReset: function(obj) {
            re.ui.pathway_bar_mouseover_behavior_reset = obj;
        },
        /*
         *        Order combo list
         *          Objects consist of fields:
         *               value: - String - id to be passed to controller
         *               label - String - id to be used by UI
         */
        limit_list: [{
            value: 10,
            label: '10'
        }, {
            value: 20,
            label: '20'
        }, {
            value: 40,
            label: '40'
        }, {
            value: 100,
            label: '100'
        }, {
            value: 200,
            label: '200'
        }, {
            value: 1000,
            label: '1000'
        }, {
            value: 2000,
            label: '2000'
        }],
        /*
         *        Limit combo list
         *          Objects consist of fields:
         *               value: - String - id to be passed to controller
         *               label - String - id to be used by UI
         */
        order_list: []
    },

    /*
     Window handles
     global handles to the masks and windows used by events
     */

    windows: {
        details_window: null,
        helpWindowReference: null,
        masks: {
            details_window_mask: null,
            network_mask: null
        }
    },
    data: {
        parsed_data: {
            network: null,
            unlocated: null,
            features: null,
            unlocated_features: null,
            located_features: null
        },
        responses: {
            network: null
        },
        patients: {
            data: null
        }
    }
});


(function() {
    re.ui.chromosomes.push({
        value: '*',
        label: 'All'
    });
    for (var i = 1; i <= 22; i++) {
        re.ui.chromosomes.push({
            value: i + '',
            label: i + ''
        });
    }
    re.ui.chromosomes.push({
        value: 'X',
        label: 'X'
    });
    re.ui.chromosomes.push({
        value: 'Y',
        label: 'Y'
    });

    /*
     Label map
     Hash maps feature type id to feature type label
     */
    re.label_map = {
        '*': 'All',
        'GEXP': 'Gene Expression',
        'METH': 'DNA Methylation',
        'CNVR': 'Somatic Copy Number',
        'CLIN': 'Clinical',
        'MIRN': 'MicroRNA Expression',
        'GNAB': 'Somatic Mutation',
        'SAMP': 'Tumor Sample',
        'PRDM': 'Paradigm Feature',
        'RPPA': 'Protein Level - RPPA'
    };
    re.plot.all_source_list = pv.blend([re.plot.locatable_source_list, re.plot.unlocatable_source_list]);
    re.plot.all_source_map = pv.numerate(re.plot.all_source_list);
    re.plot.locatable_source_map = pv.numerate(re.plot.locatable_source_list);

    re.plot.proximal_distance = 2.5 * re.plot.linear_unit;

    re.plot.colors.features = {
        'GEXP': '#1f77b4',
        //blue
        'METH': '#2ca02c',
        //green
        'CNVR': '#ff7f0e',
        //orange
        'MIRN': '#9467bd',
        //purple
        'GNAB': '#d62728',
        //red
        'PRDM': '#8c564b',
        //pink
        'RPPA': '#e377c2',
        //brown
        'CLIN': '#7f7f7f',
        'SAMP': '#bcbd22'
        //#17becf
    };

    re.plot.legend.dataRingTypes = ['1. Cytoband','2. Gene Expression','3. Methylation','4. Copy Number','5. Unmapped Associations'];
    re.plot.colors.quants = {"Q1":"#000099", "Q2":"#66A3FF","Q3":"#959595","Q4":"#FF8080","Q5":"#800000"};
    re.plot.colors.quantinfo = {"Q1":"<5%", "Q2":"5-25%","Q3":"25-75%","Q4":"75-95%","Q5":">95%"};//,"Q6":"90-95%","Q7":">95%"};

    re.plot.colors.node_colors = function(source) {
        if (source in re.plot.colors.features) {
            return pv.color(re.plot.colors.features[source]);
        }
        return "blue";
    };
    re.model.association.types.forEach(function(obj) {
        if ( obj.ui.filter === undefined || obj.ui.filter.component === undefined) { return; }
        re.ui.order_list.push({
            value: obj.id,
            label: obj.label
        });
    });

    if (re.analysis.directed_association) {
        re.ui.feature1 = {
            label: 'Target',
            id: 'target'
        };
        re.ui.feature2 = {
            label: 'Predictor',
            id: 'predictor'
        };
    } else {
        re.ui.feature1 = {
            label: 'Feature 1',
            id: 'feature1'
        };
        re.ui.feature2 = {
            label: 'Feature 2',
            id: 'feature2'
        };
    }

    re.build_tooltips();

})();
