function registerDataRetrievalListeners() {
    var d = vq.events.Dispatcher;
    d.addListener('dataset_selected', function(obj) {
        selectDataset(obj);
        loadDatasetLabels();
    });
    d.addListener('data_request', 'associations', function(obj) {
        loadNetworkData(obj);
    });
    d.addListener('data_request', 'label_position', function(obj) {
        lookupLabelPosition(obj);
    });
    d.addListener('data_request', 'annotations', function(obj) {
        loadAnnotations();
    });
    d.addListener('click_association', function(link) {
        loadFeatureData(link);
    });
    d.addListener('data_request', 'patient_categories', function(obj) {
        loadPatientCategories(obj);
    });
}

function selectDataset(set_label) {
    re.tables.current_data = set_label;
    re.tables.network_uri = '/mv_' + set_label + '_feature_networks';
    re.tables.feature_uri = '/v_' + set_label + '_feature_sources';
    re.tables.clin_uri = '/v_' + set_label + '_feature_categorical_labels';
    re.tables.patient_uri = '/v_' + set_label + '_patients';
    re.tables.pathway_uri = '/' + set_label + '_feature_pathways';
    re.tables.features_uri = '/' + set_label + '_features';
}

function loadDatasetLabels() {
    var dataset_labels = {
        feature_sources: null,
        categorical_feature_labels: null,
        patients: null,
	    pathways: null
    };
    var clin_label_query_str = '?' + re.params.query + 'select `alias`, `label`, `source` order by `gene_interesting_score`' + re.params.json_out;
    var clin_label_query = re.databases.base_uri + re.databases.rf_ace.uri + re.tables.clin_uri + re.rest.query + clin_label_query_str;
    var synchronizer = new vq.utils.SyncCallbacks(loadComplete, this);
    function clinicalLabelQueryHandler(response) {
        try {
            if (errorInQuery(response.responseText)) {
                throwQueryError('categorical_feature_labels', response);
            }
            dataset_labels['categorical_feature_labels'] = Ext.decode(response.responseText);
        } catch (err) {
            throwQueryError('categorical_feature_labels', response);
        }
    }
    function loadComplete() {
        vq.events.Dispatcher.dispatch(new vq.events.Event('query_complete', 'dataset_labels', dataset_labels));
    }
    function loadFailed() {
        vq.events.Dispatcher.dispatch(new vq.events.Event('query_fail', 'dataset_labels', {
            msg: 'Failed to load dataset labels.'
        }));
    }
    Ext.Ajax.request({
        url: clin_label_query,
        success: synchronizer.add(clinicalLabelQueryHandler,this),
        failure: function(response) {
            queryFailed('dataset_labels', response);
        }
    });
    var sources_query_str = '?' + re.params.query + 'select source' + re.params.json_out;
    var sources_query = re.databases.base_uri + re.databases.rf_ace.uri + re.tables.feature_uri + re.rest.query + sources_query_str;
    function featureSourceQueryHandler(response) {
        try {
            if (errorInQuery(response.responseText)) {
                throwQueryError('feature_sources', response);
            }
            dataset_labels['feature_sources'] = Ext.decode(response.responseText);
        } catch (err) {
            throwQueryError('feature_sources', response);
        }
    }
    Ext.Ajax.request({
        url: sources_query,
        success: synchronizer.add(featureSourceQueryHandler,this),
        failure: function(response) {
            queryFailed('feature_source', response);
        }
    });
    var patient_query_str = '?' + re.params.query + 'limit 1' + re.params.json_out;
    var patient_query = re.databases.base_uri + re.databases.rf_ace.uri + re.tables.patient_uri + re.rest.query + patient_query_str;
    function patientQueryHandle(response) {
        try {
            if (errorInQuery(response.responseText)) {
                throwQueryError('patients', response);
            }
            dataset_labels['patients'] = Ext.decode(response.responseText)[0]['barcode'].split(':');
        } catch (err) {
            throwQueryError('patients_barcode', response);
        }
    }
    Ext.Ajax.request({
        url: patient_query,
        success: synchronizer.add(patientQueryHandle,this),
        failure: function(response) {
            queryFailed('patient_labels', response);
        }
    });
    var pw_query_str = '?' + re.params.query + ('select pname, pmembers, purl, psource order by pname') + re.params.json_out;
    var pw_query = re.databases.base_uri  + re.databases.metadata.uri + re.tables.pathways + re.rest.query + pw_query_str;
    function handlePathwayQuery(response) {
        try {
            dataset_labels['pathways'] = Ext.decode(response.responseText);
        } catch (err) {
            throwQueryError('pathways', response);
        }
    }
    Ext.Ajax.request({
        url: pw_query,
        success: synchronizer.add(handlePathwayQuery, this),
        failure: function(response) {
            queryFailed('pathways', response);
        }
    });

}

function lookupLabelPosition(label_obj) {
    var label = label_obj.label || '';
    var query_str = 'select chr, start, end, alias where alias = \'' + label + '\' limit 1';
    var position_query_str = '?' + re.params.query + query_str + re.params.json_out;
    var position_url = re.databases.base_uri + re.databases.metadata.uri + re.tables.label_lookup + re.rest.query + position_query_str;
    var position_array = [];

    function positionQueryHandle(response) {
        try {
            if (errorInQuery(response.responseText)) {
                throwQueryError('label_position', response);
            }
            position_array = Ext.decode(response.responseText);
        } catch (err) {
            throwQueryError('label_position', response);
        }

        if (position_array.length == 1) {
            loadComplete();
        } else {
            noResults('label_position');
        }
    }

    function loadComplete() {
        vq.events.Dispatcher.dispatch(new vq.events.Event('query_complete', 'label_position', vq.utils.VisUtils.extend({
            feature: position_array[0]
        }, label_obj)));
    }

    function loadFailed() {
        vq.events.Dispatcher.dispatch(new vq.events.Event('query_fail', 'label_position', {
            msg: 'Retrieval Timeout'
        }));
    }

    Ext.Ajax.request({
        url: position_url,
        success: positionQueryHandle,
        failure: function(response) {
            queryFailed('label_position', response);
        }
    });

}

function loadPatientCategories(alias) {
    var query_str = 'select alias, patient_values where alias = \'' + alias + '\' limit 1';
    var query_json = {
        tq: query_str,
        tqx: 'out:json_array'
    };
    var category_query_str = '?' + Ext.urlEncode(query_json);
    var category_query = re.databases.base_uri + re.databases.rf_ace.uri + re.tables.features_uri + re.rest.query + category_query_str;

    function categoryQueryHandle(response) {
        try {
            if(errorInQuery(response.responseText)){throwQueryError('patient_categories', response);}
            var data = Ext.decode(response.responseText);
            if (data.length == 1) {
                loadComplete(data[0]);
            } else {
                //noResults('features');
            }
        } catch (err) {
            throwQueryError('features', response);
        }
    }

    function loadComplete(categories) {
        vq.events.Dispatcher.dispatch(new vq.events.Event('query_complete', 'patient_categories', categories));
    }

    Ext.Ajax.request({
        url: category_query,
        success: categoryQueryHandle,
        failure: function(response) {
            queryFailed('features', response);
        }
    });
}

function loadFeatureData(link) {

    var patients = {
        data: null
    };
    var query_str = 'select alias, patient_values ' + 'where alias  = \'' + link.sourceNode.id + '\' or alias = \'' + link.targetNode.id + '\' limit 2';
    var query_json = {
        tq: query_str,
        tqx: 'out:json_array'
    };
    var patient_query_str = '?' + Ext.urlEncode(query_json);
    var patient_query = re.databases.base_uri + re.databases.rf_ace.uri + re.tables.features_uri + re.rest.query + patient_query_str;

    function patientQueryHandle(response) {
        try {
            if (errorInQuery(response.responseText)) {
                throwQueryError('features', response);
            }
            patients['data'] = Ext.decode(response.responseText);
        } catch (err) {
            throwQueryError('features', response);
        }

        if (patients['data'].length == 2) {
            loadComplete();
        } else {
            noResults('features');
        }
    }

    function loadComplete() {
        vq.events.Dispatcher.dispatch(new vq.events.Event('query_complete', 'features', patients));
    }

    function loadFailed() {
        vq.events.Dispatcher.dispatch(new vq.events.Event('query_fail', 'features', {
            msg: 'Retrieval Timeout'
        }));
    }
    Ext.Ajax.request({
        url: patient_query,
        success: patientQueryHandle,
        failure: function(response) {
            queryFailed('features', response);
        }
    });
}

function loadFeaturesInAFM(label) {
    function loadComplete(ct) {
     	re.ui.setPathwayMembersQueryCounts(label,ct);
        vq.events.Dispatcher.dispatch(new vq.events.Event('query_complete', 'features', features));
    }
    var features = {
        data: null
    };

    var query_str = "select alias where `label` ='"  + label + "' limit 1";
    var query_json = {
        tq: query_str,
        tqx: 'out:json_array'
    };
    var patient_query_str = '?' + Ext.urlEncode(query_json);
    var patient_query = re.databases.base_uri + re.databases.rf_ace.uri + re.tables.features_uri + re.rest.query + patient_query_str;
    function mQueryHandle(response) {
        try {
            var r = Ext.decode(response.responseText);

            re.ui.setPathwayMembersQueryCounts(label,r.length);
        } catch (err) {
            throwQueryError('features', response);
        }
	}

    Ext.Ajax.request({
        url: patient_query,
        success: mQueryHandle,
        failure: function(response) {
            queryFailed('features', response);
        }
    });
    function loadFailed() {
        vq.events.Dispatcher.dispatch(new vq.events.Event('query_fail', 'features', {
            msg: 'Retrieval Timeout'
        }));
    }
}

function loadAnnotations() {
    var annotations = {
        'chrom_leng': null
    };
    var chrom_query_str = '?' + re.params.query + ('select chr_name, chr_length') + re.params.json_out;
    var chrom_query = re.databases.base_uri + re.databases.metadata.uri + re.tables.chrom_info + re.rest.query + chrom_query_str;
    function handleChromInfoQuery(response) {
        try {
            if (errorInQuery(response.responseText)) {
                throwQueryError('annotations', response);
            }
            annotations['chrom_leng'] = Ext.decode(response.responseText);
        } catch (err) {
            throwQueryError('annotations', response);
        }

        if (annotations['chrom_leng'].length >= 1) {
            loadComplete();
        } else {
            noResults('annotations');
        }
    }
    function loadComplete() {
        vq.events.Dispatcher.dispatch(new vq.events.Event('query_complete', 'annotations', annotations));
    }
    function loadFailed() {
        vq.events.Dispatcher.dispatch(new vq.events.Event('query_fail', 'annotations', {
            msg: 'Retrieval Timeout'
        }));
    }
    Ext.Ajax.request({
        url: chrom_query,
        success: handleChromInfoQuery,
        failure: function(response) {
            queryFailed('annotations', response);
        }
    });
}

function loadNetworkData(response) {
    if (response['isolate']) {
        loadNetworkDataSingleFeature(response);
        return;
    }

    switch (response['filter_type']) {

    case (re.ui.feature1.id):
    case (re.ui.feature2.id):
    case (re.ui.feature1.label):
    case (re.ui.feature2.label):
        loadNetworkDataByFeature(response)
        break;
    case ('association'):
    default:
        loadNetworkDataByAssociation(response);
    }
}

function loadNetworkDataSingleFeature(params) {
    var responses = [];
    var feature_types = ['t', 'p'];

    function loadComplete() {
        vq.events.Dispatcher.dispatch(new vq.events.Event('query_complete', 'sf_associations', {data: responses, isolated_feature:params['t_label']}));
    }

    function loadFailed() {
        vq.events.Dispatcher.dispatch(new vq.events.Event('query_fail', 'associations', {
            msg: 'Retrieval Timeout'
        }));
    }

    function handleNetworkQuery(response) {
        try {
            if (errorInQuery(response.responseText)) {
                throwQueryError('associations', response);
            }
            responses.push(Ext.decode(response.responseText).response.docs);
        } catch (err) { //an error detected in one of the responses
            throwQueryError('associations', response);
            return;
        }
        if (responses.length >= feature_types.length) {
            responses = pv.blend(responses);
            if (responses.length == 2) {
                loadComplete();
                return;
            } else { //no matching results
                noResults('associations')
            }
        } else { // haven't gathered all of the responses yet
            return;
        }

    }

    var query_obj = {
        order: params['order'],
        limit: Math.ceil((parseInt(params['limit']) / feature_types.length)) + ''
    };

      re.model.association.types.forEach(function(obj) {
        if (Ext.getCmp(obj.id) === undefined) {
            return;
        }
        if (obj.ui.filter.component instanceof re.multirangeField) {
            query_obj[obj.id + '_value']  = Ext.getCmp(obj.id + '_value').getValue();
            query_obj[obj.id + '_fn'] = Ext.getCmp(obj.id + '_fn').getValue();
        } else{
        query_obj[obj.id] = Ext.getCmp(obj.id).getValue();
    }
    });

    feature_types.forEach(function(f) {
        var obj = vq.utils.VisUtils.clone(query_obj);
        var of = (f === 't' ? 'p' : 't'); // other feature
        obj[f + '_label'] = params['t_label'];
        obj[f + '_type'] = params['t_type'];
        obj[of + '_label'] = params['p_label'];
        obj[of + '_type'] = params['p_type'];
        obj[of + '_chr'] = params['p_chr'];
        obj[of + '_start'] = params['p_start'];
        obj[of + '_stop'] = params['p_stop'];
        var network_query = buildSingleFeatureGQLQuery(obj, f == 't' ? re.ui.feature1.id : re.ui.feature2.id);
        var association_query_str = '?' + re.params.network_query + network_query + re.params.network_json_out + re.params.network_dataset_select + re.tables.current_data;
        var association_query = re.databases.networks.uri + re.rest.select +'/' + association_query_str;
        requestWithRetry(association_query,handleNetworkQuery,'associations',1);
    });
}


function loadNetworkDataByFeature(params) {
    var feature = params['filter_type'] == re.ui.feature1.id ? 't' : 'p';
    if (params[feature + '_type'] && params[feature + '_type'] == 'Pathway')
		params[feature + '_type'] = '';
    var labels = re.functions.parseLabelList(params[feature + '_label']);

    function loadComplete() {
        vq.events.Dispatcher.dispatch(new vq.events.Event('query_complete', 'associations', responses));
    }

    function loadFailed() {
        vq.events.Dispatcher.dispatch(new vq.events.Event('query_fail', 'associations', {
            msg: 'Retrieval Timeout'
        }));
    }

    var responses = [];

    function handleNetworkQuery(response) {
        try {
            if (errorInQuery(response.responseText)) {
                throwQueryError('associations', response);
            }
            var results = Ext.decode(response.responseText).response.docs;
            responses.push(results);
        } catch (err) { //an error detected in one of the responses
            throwQueryError('associations', response);
        }
        if (responses.length >= labels.length) {
            responses = pv.blend(responses);
            if (responses.length >= 1) {
                loadComplete();
                return;
            } else { //no matching results
                noResults('associations')
            }
        } else { // haven't gathered all of the responses yet
            return;
        }
    }
    //some lists have empty labels.
    labels =  labels.filter(function(l) { return l!= null && l!='';})
    labels.forEach(function(label) {
        params[feature + '_label'] = label;
        var network_query = buildGQLQuery(params);
        var association_query_str = '?' + re.params.network_query + network_query + re.params.network_json_out + re.params.network_dataset_select + re.tables.current_data;
        var association_query = re.databases.networks.uri + re.rest.select + '/' + association_query_str;
        
        requestWithRetry(association_query,handleNetworkQuery,'associations',1);
    });

}

function loadNetworkDataByAssociation(params) {

    if (re.analysis.directed_association != undefined && re.analysis.directed_association == false) {
        loadUndirectedNetworkDataByAssociation(params);
        return;
    } else {
        loadDirectedNetworkDataByAssociation(params);
        return;
    }
}

function loadDirectedNetworkDataByAssociation(params) {

    var responses = [];

    re.state.network_query = buildGQLQuery(params);
    var association_query_str = '?' + re.params.network_query + re.state.network_query + re.params.network_json_out + re.params.network_dataset_select + re.tables.current_data;
    var association_query = re.databases.networks.uri + re.rest.select +  association_query_str;

    function handleNetworkQuery(response) {
        try {
            if (errorInQuery(response.responseText)) {
                throwQueryError('associations', response);
            }
           responses = Ext.decode(response.responseText).response.docs;
            // responses = Ext.decode(response.responseText);
        } catch (err) {
            throwQueryError('associations', response);
        }

        if (responses.length >= 1) {
            loadComplete();
        } else {
            noResults('associations');
        }
    }

    function loadComplete() {
        vq.events.Dispatcher.dispatch(new vq.events.Event('query_complete', 'associations', responses));
    }

    function loadFailed() {
        vq.events.Dispatcher.dispatch(new vq.events.Event('query_fail', 'associations', {
            msg: 'Retrieval Timeout'
        }));
    }

    requestWithRetry(association_query,handleNetworkQuery,'associations',1);
}

function loadUndirectedNetworkDataByAssociation(params) {

    var responses = [];

    function handleNetworkQuery(response) {
        try {
            if (errorInQuery(response.responseText)) {
                throwQueryError('associations', response);
            }
            responses.push(Ext.decode(response.responseText).response.docs);
        } catch (err) {
            throwQueryError('associations', response);
        }

        if (responses.length == 1) { flipQuery(); }
        else if (responses.length == 2) {
            responses = pv.blend(responses);
            if (responses.length < 1) {
                noResults('associations');
            } else {
                loadComplete();
            }
        } else {
            return;
        }
    }

    function loadComplete() {
        vq.events.Dispatcher.dispatch(new vq.events.Event('query_complete', 'associations', responses));
    }

    function loadFailed() {
        vq.events.Dispatcher.dispatch(new vq.events.Event('query_fail', 'associations', {
            msg: 'Retrieval Timeout'
        }));
    }

    re.state.network_query = buildGQLQuery(params);
    var association_query_str = '?' + re.params.network_query + re.state.network_query + re.params.network_json_out + re.params.network_dataset_select + re.tables.current_data;
    var association_query = re.databases.networks.uri + re.rest.select + '/' + association_query_str;

    requestWithRetry(association_query,handleNetworkQuery,'associations',1);

    function flipQuery() {
        var flip_params = flipParams(params);
        re.state.network_query = buildGQLQuery(flip_params);
        association_query_str = '?' + re.params.network_query + re.state.network_query + re.params.network_json_out + re.params.network_dataset_select + re.tables.current_data;
        association_query = re.databases.networks.uri + re.rest.select + '/' + association_query_str;

    requestWithRetry(association_query,handleNetworkQuery,'associations',1);
    }
}

function queryFailed(data_type, response) {
    var msg = '';
    msg = response.isTimeout ? 'Timeout. Re-submitting the filter may provide the results.' : response.statusText;
    vq.events.Dispatcher.dispatch(new vq.events.Event('query_fail', data_type, {
        msg: 'Query Error: ' + msg
    }));
}

function requestWithRetry(query, handler, failed_type, times) {
    var that = this;
    var repeat = times > -1 ? times : 1;
    var requestRetry = function() { 
        var q = query, h=handler, f=failed_type, r = repeat;
        requestWithRetry.call(that,q, h, f, r);
    }

    Ext.Ajax.request({
        //timeout:8000, //decrease timeout
        url: query,
        success: handler,
        failure: function(response) {
            if (--repeat == 0) {
                queryFailed(failed_type, response);
            } else if (response.isTimeout) {
                requestRetry();
            }
        }
    });
}

/* Handler functions */

function noResults(query_type) {
    vq.events.Dispatcher.dispatch(new vq.events.Event('query_fail', query_type, {
        msg: 'No matching results found.'
    }));
}

function throwQueryError(query_type, response) {
    var text = response.responseText;
    var json_index = text.indexOf('(') + 1;
    // -2 because we want to cut the ); out of the end of the message
    var json = Ext.decode(text.slice(json_index, -2));
    var error = json.errors[0];
    vq.events.Dispatcher.dispatch(new vq.events.Event('query_fail', query_type, {
        msg: error.message //+ error.detailed_message
    }));
}

/*
 Utility functions
 */

function flipParams(params) {
    var temp = vq.utils.VisUtils.clone(params);
    return vq.utils.VisUtils.extend(temp, {
        t_type: params['p_type'],
        p_type: params['t_type'],

        t_label: params['p_label'],
        p_label: params['t_label'],

        t_chr: params['p_chr'],
        p_chr: params['t_chr'],

        t_start: params['p_start'],
        p_start: params['t_start'],

        t_stop: params['p_stop'],
        p_stop: params['t_stop']

    });
};

function buildGQLQuery(args) {
    var flparam = 'alias1,alias2,f1qtinfo,f2qtinfo';
    if (re.ui.filters.link_distance) {
        flparam+= ',link_distance';
    }
    //try out solr query

    re.model.association.types.forEach(function(obj) {
            flparam += ',' + obj.query.id;
        });
    var qparam='';
    if (args['t_type'] != '' && args['t_type'] != '*') {
        qparam += '+f1source:"'+ args['t_type'] + '"';
    }
    if (args['p_type'] != '' && args['p_type'] != '*') {
               qparam += '+f2source:"'+ args['p_type'] + '"';
    }
    if (args['t_label'] != '' && args['t_label'] != '*') {
               qparam += re.functions.convertListToSolrQueryClause(args['t_label'],'f1label');
    }
    if (args['p_label'] != '' && args['p_label'] != '*') {
               qparam += re.functions.convertListToSolrQueryClause(args['p_label'],'f2label');
    }
    if (args['t_chr'] != '' && args['t_chr'] != '*') {
        qparam += re.functions.convertListToSolrQueryClause(args['t_chr'],'f1chr');

    }
    if (args['p_chr'] != '' && args['p_chr'] != '*') {
        qparam += re.functions.convertListToSolrQueryClause(args['p_chr'],'f2chr');

    }
    if ((args['p_start'] != '') && (args['p_stop'] != '')) {
        qparam += '+f2start:['+ args['p_start'] + ' TO ' + args['p_stop'] + '] '
                     '+f2end:['+ args['p_start'] + ' TO ' + args['p_stop'] + ']';
    }
    else if (args['p_start'] != '') {
        qparam += '+f2start:['+ args['p_start'] + ' TO *]';
    }
    else if (args['p_stop'] != '') {
        qparam += '+f2end:[* TO '+ args['p_stop'] + ']';
    }

    if ((args['t_start'] != '') && (args['t_stop'] != '')) {
        qparam += '+f1start:['+ args['t_start'] + ' TO ' + args['t_stop'] + '] '
                  '+f1end:['+ args['t_start'] + ' TO ' + args['t_stop'] + ']';
        }
    else if (args['t_start'] != '') {
               qparam += '+f1start:['+ args['t_start'] + ' TO *]';
    }
    else if (args['t_stop'] != '') {
        qparam += '+f1end:[* TO '+ args['t_stop'] + ']';
    }
  
    if (args['cis']) {
        qparam += '-link_distance:"500000000"';

    }
    if(args['cis'] && args['cis_distance_value'] != '') {
        var clause1 = solr_flex_field_query('link_distance',args['cis_distance_value'], args['cis_distance_fn']);
       qparam += ((clause1.length < 1) ? '' : clause1);
    }

    if(args['trans']) {
        qparam += '+link_distance:"500000000"';
    }

    var fqparam='';
    re.model.association.types.forEach(function(obj) {
        if (typeof obj.query.clause == 'function') {
            var clause = solr_flex_field_query(obj.query.id, args[obj.query.id+'_value'], args[obj.query.id + '_fn']);
                   fqparam += ((clause.length < 1) ? '' : clause);
            return;
        }
        if (args[obj.query.id] != '') {
            var clause_array=trim(obj.query.clause).split(" ");
            if(clause_array.length > 1){
            var clause = solr_flex_field_query(obj.query.id, args[obj.query.id],clause_array[clause_array.length-1] );
             fqparam += ((clause.length < 1) ? '' : clause);
            }
        }
    });

    var order_id = (re.model.association.types[re.model.association_map[args['order']]].query.order_id === undefined) ? args['order'] : re.model.association.types[re.model.association_map[args['order']]].query.order_id;
    var fn;
        if(fn = args[order_id+'_fn'] =='Abs'){
            order_id = 'abs(' + order_id +')';
        }
        var sort =  order_id + ' ' + ((re.model.association.types[re.model.association_map[args['order']]].query.order_direction).toLowerCase() || 'desc');
        var limit = args['limit'];

    if(qparam == ''){
        qparam='*:*';
    }
     return encodeURIComponent(qparam) + '&fq=' + encodeURIComponent(fqparam) + '&sort=' + encodeURIComponent(sort) + '&rows=' + encodeURIComponent(limit) + '&fl=' + encodeURIComponent(flparam);
}


function buildSingleFeatureGQLQuery(args, feature) {
    var flparam = 'alias1,alias2';
    if (re.ui.filters.link_distance) {
        flparam+= ',link_distance';
    }
    re.model.association.types.forEach(function(obj) {
        flparam += ',' + obj.query.id;
    });

    var qparam = '';


    if (args['t_type'] && args['t_type'] != '' && args['t_type'] != '*') {
        qparam += '+f1source:"'+ args['t_type'] + '"';
    }
    if (args['p_type'] && args['p_type'] != '' && args['p_type'] != '*') {
        qparam += '+f2source:"'+ args['p_type'] + '"';
    }
    if (args['t_label'] && args['t_label'] != '' && args['t_label'] != '*') {
        qparam += '+f1label:'+ re.functions.parseSolrLabel(args['t_label']) + ' ';
    }
    if (args['p_label'] && args['p_label'] != '' && args['p_label'] != '*') {
        qparam += '+f2label:'+ re.functions.parseSolrLabel(args['p_label']) + ' ';
    }
    if (args['t_chr'] && args['t_chr'] != '' && args['t_chr'] != '*') {
        qparam += '+f1chr:"'+ args['t_chr'] + '"';
    }
    if (args['p_chr'] && args['p_chr'] != '' && args['p_chr'] != '*') {
        qparam += '+f2chr:"'+ args['p_chr'] + '"';
    }
    if (args['t_start'] && args['t_start'] != '') {
        qparam += '+f1start:['+ args['t_start'] + ' TO *]';
    }
    if (args['p_start'] && args['p_start'] != '') {
        qparam += '+f2start:['+ args['p_start'] + ' TO *]';
    }
    if (args['t_stop'] && args['t_stop'] != '') {
        if (args['t_start'] != '') {
            qparam += '+f1end:[' + args['t_start'] + ' TO '+ args['t_stop'] + ']';
        }
        else
               qparam += '+f1end:[* TO '+ args['t_stop'] + ']';

    }
    if (args['p_stop'] && args['p_stop'] != '') {
               if (args['p_start'] != '') {
                   qparam += '%2Bf2end:[' + args['p_start'] + ' TO '+ args['p_stop'] + ']';
               }
               else
                      qparam += '%2Bf2end:[* TO '+ args['p_stop'] + ']';
    }

    if(args['cis'] && args['cis_distance_value'] != '') {
        var clause1 = solr_flex_field_query('link_distance',args['cis_distance_value'], args['cis_distance_fn']);
             qparam += ((clause1.length < 1) ? '' : clause1);
    }
    else if (args['cis']) {
               qparam += '-link_distance:"500000000"';
    }
    if(args['trans']) {
               qparam += '+link_distance:"500000000"';
    }

    var fqparam='';
    re.model.association.types.forEach(function(obj) {
        if (typeof obj.query.clause == 'function') {
            var clause = solr_flex_field_query(obj.query.id, args[obj.query.id+'_value'], args[obj.query.id + '_fn']);
                      fqparam += ((clause.length < 1) ? '' :  clause);
            return;
        }
        if (args[obj.query.id] != '') {
            var clause_array=trim(obj.query.clause).split(" ");
                       if(clause_array.length > 1){
                       var clause = solr_flex_field_query(obj.query.id, args[obj.query.id],clause_array[clause_array.length-1] );
                        fqparam += ((clause.length < 1) ? '' : clause);
                       }
        }
    });

    var order_id = (re.model.association.types[re.model.association_map[args['order']]].query.order_id === undefined) ? args['order'] : re.model.association.types[re.model.association_map[args['order']]].query.order_id;
    var fn;
        if ((fn = args[order_id+'_fn'] =='Abs') || (fn === '<=' && parseFloat(arg[order_id+'_value']) <= 0)){
            order_id = 'abs(' + order_id +')';
        }

    var sort =  order_id + ' ' + ((re.model.association.types[re.model.association_map[args['order']]].query.order_direction).toLowerCase() || 'desc');
    var limit = args['limit'];
    
     if(qparam == ''){
         qparam='*:*';
     }
     return encodeURIComponent(qparam) + '&fq=' + encodeURIComponent(fqparam) + '&sort=' + encodeURIComponent(sort) + '&rows=' + encodeURIComponent(limit) + '&fl=' + encodeURIComponent(flparam);
}
