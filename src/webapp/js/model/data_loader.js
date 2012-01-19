
function registerModelListeners() {

var d = vq.events.Dispatcher;
    d.addListener('query_complete','associations',function(data) {
        if (re.state.query_cancel) { return;}
        parseNetwork(data);
        generateNetworkDefinition(data)
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
    d.addListener('query_cancel','associations',function(data) {
        re.state.query_cancel = true;
    });
}

function parseDatasetLabels(data) {
        re.ui.setDatasetLabels(data);
        vq.events.Dispatcher.dispatch(new vq.events.Event('data_ready','dataset_labels', data));
}


function parseAnnotations(data) {
        vq.events.Dispatcher.dispatch(new vq.events.Event('data_ready','annotations', data));
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
        var f1id =    row.f1id + '';
        var f2id =    row.f2id + '';

        var source_id = (source_map[f1id] === undefined ? (source_array.push({
            id : f1id, type : node1[1], label : node1[2], chr : node1[3].slice(3),
            start: rectifyChrPosition(node1[4]) ,
            end:rectifyChrPosition(node1[5]) != -1 ? rectifyChrPosition(node1[5]) : rectifyChrPosition(node1[4]),
            genescore:row.f1genescore}
        )-1) :
            source_map[f1id]);

        source_map[row.f1id] = source_id;

        var target_id = (source_map[f2id] === undefined ? (source_array.push({id : f2id,
            type : node2[1], label : node2[2], chr : node2[3].slice(3),
            start: rectifyChrPosition(node2[4]) ,
            end:rectifyChrPosition(node2[5]) != -1 ? rectifyChrPosition(node2[5]) : rectifyChrPosition(node2[4]),
            genescore:row.f2genescore}
        ) -1) :
            source_map[f2id]);

        source_map[f2id] = target_id;

        return {id:f1id + '-' + f2id, label : f1id + ' -> ' + f2id, source:f1id ,target: f2id,
            pvalue : row.pvalue,importance : row.importance, correlation:row.correlation};
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
        vq.events.Dispatcher.dispatch(new vq.events.Event('load_fail','associations',{msg:'Error in loading assocation data'}));
    }

    var parsed_data = {network : null,unlocated : null, features : null,unlocated_features:null,located_features:null};
    var timer = new vq.utils.SyncDatasources(400,40,loadComplete,parsed_data,loadFailed);
    timer.start_poll();

   var whole_net = responses.map(function(row) {
        var node1 = row.alias1.split(':');
        var node2 = row.alias2.split(':');
           var label_mod1 = node1.length >=8 ? node1[7] : '';
           var label_mod2 = node2.length >=8 ? node2[7] : '';
           return {node1: {id : row.f1id, source : node1[1], label : node1[2], chr : node1[3].slice(3),
               label_mod : label_mod1,
               start: node1[4] != '' ? parseInt(node1[4]) : -1, end:node1[5] != '' ? parseInt(node1[5]) : parseInt(node1[4]),genescore:row.f1genescore},
            node2: {id : row.f2id, source : node2[1], label : node2[2], chr : node2[3].slice(3),
                label_mod : label_mod2,
                start: node2[4] != '' ? parseInt(node2[4]) : -1, end:node2[5] != '' ? parseInt(node2[5]) : parseInt(node2[4]),genescore:row.f2genescore},
            pvalue : row.pvalue,importance : row.importance, correlation:row.correlation};
    }
            );
        var located_responses = whole_net.filter(function(feature) {
        return feature.node1.chr != '' && feature.node2.chr != '';});

        var unlocated_responses =  whole_net.filter(function(feature) {
        return feature.node1.chr == '' || feature.node2.chr == '';});

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
}