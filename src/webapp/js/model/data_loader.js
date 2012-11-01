
function registerModelListeners() {

    var d = vq.events.Dispatcher;
    d.addListener('query_complete','associations',function(data) {
        if (re.state.query_cancel) { return;}
        parseNetwork(data);
        generateNetworkDefinition(data)
    });
    d.addListener('query_complete','sf_associations',function(data) {
        if (re.state.query_cancel) { return;}
        parseSFValues(data);
    });
    d.addListener('query_complete','dataset_labels',function(data) {
        parseDatasetLabels(data);
    });
    d.addListener('query_complete','annotations',function(data) {
        parseAnnotations(data);
    });
    d.addListener('query_complete','features',function(data) {
        parseFeatures(data);
    });
     d.addListener('query_complete','patient_categories',function(data) {
        parsePatientCategories(data);
    });
}

function parseDatasetLabels(data) {
    re.ui.setDatasetLabels(data);
    vq.events.Dispatcher.dispatch(new vq.events.Event('data_ready','dataset_labels', data));
}


function parseAnnotations(data) {
    vq.events.Dispatcher.dispatch(new vq.events.Event('data_ready','annotations', data));
}

function parsePatientCategories(data) {
    var categories = data.patient_values;
    vq.events.Dispatcher.dispatch(new vq.events.Event('data_ready','patient_categories', categories));
}

function parseFeatures(data) {
    //data is only in the first row of this array
    var features = data['data'][0];
    vq.events.Dispatcher.dispatch(new vq.events.Event('data_ready','features', features));
}

function rectifyChrPosition(str_val) {
    return  isNaN(parseInt(str_val)) ? -1 : parseInt(str_val);
}

function generateNetworkDefinition(responses) {

    var network = {nodes: [], edges: []};
    var source_array = [], source_map = {};
    network.edges = responses.map(function(row) {
        var node1 = row.alias1.split(':');
        var node2 = row.alias2.split(':');
        var f1id =    row.alias1 + '';
        var f2id =    row.alias2 + '';

        if (node1.length < 7 || node2.length < 7) {
            console.error('Feature data is malformed. RF-ACE features consist of 7 required properties.');
        }
        var source_id = (source_map[f1id] === undefined ? (source_array.push({
                id : f1id, type : node1[1], label : node1[2], chr : node1[3].slice(3),
                start: rectifyChrPosition(node1[4]) ,
                end:rectifyChrPosition(node1[5]) != -1 ? rectifyChrPosition(node1[5]) : rectifyChrPosition(node1[4])}
        )-1) :
            source_map[f1id]);

        source_map[f1id] = source_id;
        
        var target_id = (source_map[f2id] === undefined ? (source_array.push({id : f2id,
                type : node2[1], label : node2[2], chr : node2[3].slice(3),
                start: rectifyChrPosition(node2[4]) ,
                end:rectifyChrPosition(node2[5]) != -1 ? rectifyChrPosition(node2[5]) : rectifyChrPosition(node2[4])}
        ) -1) :
            source_map[f2id]);

        source_map[f2id] = target_id;
        
        var obj = {id:f1id + '-' + f2id, label : source_id.label + ' -> ' + target_id.label, source:f1id ,target: f2id, directed: re.analysis.directed_association};

        if (re.ui.filters.link_distance) {
            obj.link_distance = row.link_distance;
        }

        re.model.association.types.forEach(function(assoc) {
            if (row[assoc.query.id] === undefined) {
                console.error('Association attribute is malformed. Expected attribute with label \'' + assoc.query.id + '\'');
            }
            obj[assoc.ui.grid.store_index] = row[assoc.query.id];
        });
        return obj;
    });

    network.nodes =  source_array;

    var e = new vq.events.Event('data_ready','graph',network);
    e.dispatch();
}

function parseNetwork(responses) {

    function loadComplete() {
        vq.events.Dispatcher.dispatch(new vq.events.Event('data_ready','associations', parsed_data));
    }

    function loadFailed() {
        vq.events.Dispatcher.dispatch(new vq.events.Event('load_fail','associations',{msg:'Error in loading association data'}));
    }

    var parsed_data = {network : null,unlocated : null, features : null,unlocated_features:null,located_features:null};
    var null_node = {
                id : '', 
                source : '', 
                label : '', 
                chr : '',
                label_mod : '',
                start: -1,
                end:-1, 
                qtinfo: ''
    };
   
    var whole_net = responses.map(function(row) {
            var node1 = row.alias1.split(':');
            var node2 = row.alias2.split(':');

            if (node1.length < 7 || node2.length < 7) {
                console.error('Feature data is malformed. RF-ACE features consist of 7 required properties.');
            }

            var label_mod1 = node1.length >=8 ? node1[7] : '';
            var label_mod2 = node2.length >=8 ? node2[7] : '';
            var new_node1 = vq.utils.VisUtils.clone(null_node),
                new_node2 = vq.utils.VisUtils.clone(null_node);
            var obj =  {node1: 
                vq.utils.VisUtils.extend(new_node1, {id : row.alias1, source : node1[1], label : node1[2], chr : node1[3].slice(3),
                label_mod : label_mod1,
                start: node1[4] != '' ? parseInt(node1[4]) : -1,
                end:node1[5] != '' ? parseInt(node1[5]) : parseInt(node1[4]), qtinfo: row.f1qtinfo}),
                node2: vq.utils.VisUtils.extend(new_node2,{id : row.alias2, source : node2[1], label : node2[2], chr : node2[3].slice(3),
                    label_mod : label_mod2,
                    start: node2[4] != '' ? parseInt(node2[4]) : -1,
                    end:node2[5] != '' ? parseInt(node2[5]) : parseInt(node2[4]), qtinfo: row.f2qtinfo})
            };


        if (re.ui.filters.link_distance) {
            obj.link_distance = row.link_distance;
        }
        re.model.association.types.forEach(function(assoc) {
            if (row[assoc.query.id] === undefined) {
                console.error('Association attribute is malformed. Expected attribute with label \'' + assoc.query.id + '\'');
            }
            obj[assoc.ui.grid.store_index] = row[assoc.query.id];
        });

        return obj;
        }
    );
    var located_responses = whole_net.filter(function(feature) {
        return feature.node1.chr != '' && feature.node2.chr != '';});

    var unlocated_responses =  whole_net.filter(function(feature) {
        return feature.node1.chr == '' || feature.node2.chr == '' || feature.node1.chr == 'NA' || feature.node2.chr == 'NA';});

    var feature_ids = {};
    var features = [];
    whole_net.forEach(function(link) {
        if (feature_ids[link.node1.id] == null) {feature_ids[link.node1.id]=1;features.push(vq.utils.VisUtils.extend({value:link.node1.label},link.node1));    }
        if (feature_ids[link.node2.id] == null) {feature_ids[link.node2.id]=1;features.push(vq.utils.VisUtils.extend({value:link.node2.label},link.node2));    }
    });

    parsed_data['features'] = features;
    parsed_data['network'] = located_responses;
    parsed_data['unlocated'] = unlocated_responses;
    parsed_data['unlocated_features'] = vq.utils.VisUtils.clone(features).filter(function(feature) {
        return feature.chr =='';
    });
    parsed_data['located_features'] = vq.utils.VisUtils.clone(features).filter(function(feature) {
        return feature.chr !='';
    });

    loadComplete();
}


function parseSFValues(responses) {

    var parsed_data = {features:[]};
    function loadComplete() {
        vq.events.Dispatcher.dispatch(new vq.events.Event('data_ready','sf_associations', parsed_data));
    }

    function loadFailed() {
        vq.events.Dispatcher.dispatch(new vq.events.Event('load_fail','associations',{msg:'Zero mappable features found.'}));
    }
    

    var row1 = responses.data[0], row2 = responses.data[1];
    var alias = '';
    var aliases = {};
    [row1,row2].forEach(function(row){
        aliases[row.alias1] = aliases[row.alias1] + 1 || 1;
        aliases[row.alias2] = aliases[row.alias2] + 1 || 1;
    });
    var keys = Object.keys(aliases);
    for (i in keys) {
        if (aliases[keys[i]] == 2) { alias = keys[i];}
    }
    if (alias === '') { loadFailed();}

    var data = [];
    data = responses.data.map(function(row) { 
        var obj = row; 
        obj.alias = (row.alias1 == alias ? row.alias2 : row.alias1);
        return obj;
    })
        .map(parseFeatureAlias);
    if (data.length < 1)loadFailed();

    parsed_data.features = data.filter(function(feature) { return feature.chr != '' && feature.start != '';});
    parsed_data['isolated_feature'] = alias;
    if (parsed_data.features.length > 0) loadComplete();
    else loadFailed();
}

function parseFeatureAlias(row) {

    var node = row.alias.split(':');
    var label_mod = node.length >=8 ? node[7] : '';
    var chr = '';
    var start=parseInt(node[4]);
    start = isNaN(start) ? '' : start;
    var end=parseInt(node[5]);
    end = isNaN(end) ? '' : end;

    try{
        chr = node[3].slice(3);
    }
    catch(e) {
        chr = '';
    }
    var obj =  {id : row.alias, source : node[1], label : node[2], chr : chr,
        label_mod : label_mod,
        start: start,
        end:end
    };
    if (re.ui.filters.link_distance) {
            obj.link_distance = row.link_distance;
        }
    re.model.association.types.forEach(function(assoc) {
        obj[assoc.ui.grid.store_index] = row[assoc.query.id];
    });
    return obj;
}
