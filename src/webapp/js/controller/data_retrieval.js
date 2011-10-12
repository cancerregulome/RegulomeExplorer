
var base_query_url = '',
    csacr_base_query_uri = '/google-dsapi-svc/addama/datasources/csacr',
    tcga_base_query_uri = '/google-dsapi-svc/addama/datasources/tcga',
    dataset_table = '/regulome_explorer_dataset/query';

var query_uri = '/query',
    json_out_param='&tqx=out:json_array';
query_param='?tq=';
parsed_data = {network : null,unlocated : null,features : null,unlocated_features:null,located_features:null},
    responses = {network : null},
    patients = {data : null},
    cancer = {sv : null},
    dataset_labels,
    label_position_uri = '/refgene/query',
    current_data = '';
network_query ='',
    network_uri = '',
    feature_uri ='',
    clin_uri ='',
    patient_uri =  '',
    pathway_uri = '',
    feature_data_uri =  '';

function registerDataRetrievalListeners() {
    var d = vq.events.Dispatcher;
    d.addListener('dataset_selected',function(obj){
        selectDataset(obj);
        loadDatasetLabels();
    });

    d.addListener('data_request','associations',function(obj){
        loadNetworkData(obj);
    });
    d.addListener('data_request','label_position', function(obj){
        lookupLabelPosition(obj);
    });
    d.addListener('data_request','annotations', function(obj){
        loadAnnotations();
    });
    d.addListener('click_association',function(link) {
        loadFeatureData(link);
    });
}

function selectDataset(set_label) {
    current_data = set_label;
    network_uri = '/mv_'+set_label+'_feature_networks/query';
    feature_uri = '/v_'+set_label+'_feature_sources/query';
    clin_uri = '/v_'+set_label+'_feature_clinlabel/query';
    patient_uri =  '/v_'+set_label+'_patients/query';
    feature_data_uri =  '/v_' + set_label + '_patient_values/query';
    pathway_uri = '/' + set_label + '_feature_pathways/query';
}

function loadDatasetLabels() {

    function loadComplete() {
        vq.events.Dispatcher.dispatch(new vq.events.Event('query_complete','dataset_labels',dataset_labels));
    }

    function loadFailed() {
        vq.events.Dispatcher.dispatch(new vq.events.Event('query_fail','dataset_labels',{msg:'Retrieval Timeout'}));
    }

    var dataset_labels = {feature_sources : null, clin_labels : null, patients: null};

    var clin_label_query_str = query_param + 'select `label`' + json_out_param;
    var clin_label_query = base_query_url + tcga_base_query_uri + clin_uri+clin_label_query_str;

    var timer = new vq.utils.SyncDatasources(200,40,loadComplete,dataset_labels,loadFailed);

    function clinicalLabelQueryHandler(response) {
        dataset_labels['clin_labels'] = Ext.decode(response.responseText);
    }

    function queryFailed(response) {
        vq.events.Dispatcher.dispatch(new vq.events.Event('query_fail','dataset_labels',{msg:'Query Error: ' + response.status + ': ' + response.responseText}));
    }


    Ext.Ajax.request({url:clin_label_query,success:clinicalLabelQueryHandler,failure: queryFailed});

    var sources_query_str = query_param + 'select source' + json_out_param;
    var sources_query = base_query_url + tcga_base_query_uri + feature_uri + sources_query_str;

    function featureSourceQueryHandler(response) {
        dataset_labels['feature_sources'] = Ext.decode(response.responseText);
    }

    Ext.Ajax.request({url:sources_query,success:featureSourceQueryHandler,failure: queryFailed});


    var patient_query_str = query_param + 'limit 1'+json_out_param;
    var patient_query = base_query_url + tcga_base_query_uri + patient_uri+patient_query_str;

    function patientQueryHandle(response) {
        dataset_labels['patients'] = Ext.decode(response.responseText)[0]['barcode'].split(':');
    }

    timer.start_poll();
    Ext.Ajax.request({url:patient_query,success:patientQueryHandle,failure: queryFailed});

}

function lookupLabelPosition(label_obj) {
    var label = label_obj.label || '';
    function loadComplete() {
        vq.events.Dispatcher.dispatch(new vq.events.Event('query_complete','label_position',vq.utils.VisUtils.extend({feature:position_array[0]},label_obj)));
    }

    function loadFailed() {
        vq.events.Dispatcher.dispatch(new vq.events.Event('query_fail','label_position',{msg:'Retrieval Timeout'}));
    }

    var query_str = 'select chr, start, end, alias where alias = \'' + label + '\' limit 1';

    var position_query_str = query_param + query_str + json_out_param;

    var position_url = base_query_url  + csacr_base_query_uri + label_position_uri + position_query_str;

    var  position_array = [];
    function positionQueryHandle(response) {
        position_array = Ext.decode(response.responseText);
        if (position_array.length ==1) {
            loadComplete();
        }
        else{
            loadFailed();
        }
    }

    function queryFailed(response) {
        vq.events.Dispatcher.dispatch(new vq.events.Event('query_fail','label_position',{msg:'Query Error: ' + response.status + ': ' + response.responseText}));
    }
    Ext.Ajax.request({url:position_url,success:positionQueryHandle,failure: queryFailed});

}

function loadFeatureData(link) {

    function loadComplete() {
        vq.events.Dispatcher.dispatch(new vq.events.Event('query_complete','features',patients));
    }

    function loadFailed() {
        vq.events.Dispatcher.dispatch(new vq.events.Event('query_fail','features',{msg:'Retrieval Timeout'}));
    }

    var patients = {data : null};

    var query_str = 'select f1id, f2id, f1alias, f1values, f2alias, f2values ' +
        'where f1id  = ' + link.sourceNode.id + ' and f2id = ' + link.targetNode.id + ' limit 1';
    var patient_query_str = query_param + query_str + json_out_param;
    var patient_query = base_query_url + tcga_base_query_uri + feature_data_uri + patient_query_str;

    function patientQueryHandle(response) {
        patients['data'] = Ext.decode(response.responseText);
        loadComplete();
    }

    function queryFailed(response) {
        vq.events.Dispatcher.dispatch(new vq.events.Event('query_fail','features',{msg:'Query Error: ' + response.status + ': ' + response.responseText}));
    }
    Ext.Ajax.request({url:patient_query,success:patientQueryHandle,failure: queryFailed});

}

function loadAnnotations() {

    function loadComplete() {
        vq.events.Dispatcher.dispatch(new vq.events.Event('query_complete','annotations',annotations));
    }

    function loadFailed() {
        vq.events.Dispatcher.dispatch(new vq.events.Event('query_fail','annotations',{msg:'Retrieval Timeout'}));
    }
    var annotations = {'chrom_leng': null};

    var chrom_query_str = query_param + ('select chr_name, chr_length') + json_out_param;
    var chrom_query = base_query_url + csacr_base_query_uri + '/chrom_info' + query_uri+ chrom_query_str;

    function handleChromInfoQuery(response) {
        annotations['chrom_leng'] = Ext.decode(response.responseText);
        loadComplete();
    }
    function queryFailed(response) {
        vq.events.Dispatcher.dispatch(new vq.events.Event('query_fail','annotations',{msg:'Query Error: ' + response.status + ': ' + response.responseText}));
    }

    Ext.Ajax.request({url:chrom_query,success:handleChromInfoQuery,failure: queryFailed});
}

/*
 not very good yet.  move json_array responsibility to server.. stop running cascading timers!
 */

function loadNetworkData(query_params,callback) {
    function loadComplete() {
        vq.events.Dispatcher.dispatch(new vq.events.Event('query_complete','associations', responses));
    }

    function loadFailed() {
        vq.events.Dispatcher.dispatch(new vq.events.Event('query_fail','associations',{msg:'Retrieval Timeout'}));
    }

    var responses = {network : null};

    var network_query=buildGQLQuery(query_params);

    function handleNetworkQuery(response) {
        responses['network'] = Ext.decode(response.responseText);
        loadComplete();
    }
    function queryFailed(response) {
        vq.events.Dispatcher.dispatch(new vq.events.Event('query_fail','assocations',{msg:'Query Error: ' + response.status + ': ' + response.responseText}));
    }

    var association_query_str = query_param + network_query + json_out_param;
    var association_query = base_query_url + tcga_base_query_uri + network_uri + association_query_str;

    Ext.Ajax.request({url:association_query,success:handleNetworkQuery,failure: queryFailed});

}

/*
 Utility functions
 */


function buildGQLQuery(args) {
    var query = 'select alias1, alias2, feature1id, feature2id, f1genescore, f2genescore, correlation, pvalue, importance';
    var whst = ' where',
        where = whst;

    if (args['f1_type'] != '' && args['f1_type'] != '*') {
        where += (where.length > whst.length ? ' and ' : ' ');
        where += 'f1source = \'' +args['f1_type']+ '\'';
    }
    if (args['f2_type'] != '' && args['f2_type'] != '*') {
        where += (where.length > whst.length ? ' and ' : ' ');
        where += 'f2source = \'' +args['f2_type']+ '\'';
    }
    if (args['f1_label'] != '' && args['f1_label'] != '*') {
        where += (where.length > whst.length ? ' and ' : ' ');
        where += parseLabelList('f1label',args['f1_label']);
        //'`f1label` ' + parseLabel(args['f1_label']);
    }
    if (args['f2_label'] != '' && args['f2_label'] != '*') {
        where += (where.length > whst.length ? ' and ' : ' ');
        where +=parseLabelList('f2label',args['f2_label']);
        //'`f2label` ' + parseLabel(args['f2_label']);
    }
    if (args['f1_chr'] != '' && args['f1_chr'] != '*') {
        where += (where.length > whst.length ? ' and ' : ' ');
        where += 'f1chr = \'' +args['f1_chr']+'\'';
    }
    if (args['f2_chr'] != '' && args['f2_chr'] != '*') {
        where += (where.length > whst.length ? ' and ' : ' ');
        where += 'f2chr = \'' +args['f2_chr']+'\'';
    }
    if (args['f1_start'] != '') {
        where += (where.length > whst.length ? ' and ' : ' ');
        where += 'f1start >= ' +args['f1_start'];
    }
    if (args['f2_start'] != '') {
        where += (where.length > whst.length ? ' and ' : ' ');
        where += 'f2start >= ' +args['f2_start'];
    }
    if (args['f1_stop'] != '') {
        where += (where.length > whst.length ? ' and ' : ' ');
        where += 'f1end <= ' +args['f1_stop'];
    }
    if (args['f2_stop'] != '') {
        where += (where.length > whst.length ? ' and ' : ' ');
        where += 'f2end <= ' +args['f2_stop'];
    }
    if ((args['f2_start'] != '') && (args['f2_stop'] != '')) {
        where += ' and (f2end = 0 or f2end >= ' +args['f2_start'] + ') and f2start <= ' +args['f2_stop']
    }
    if ((args['f1_start'] != '') && (args['f1_stop'] != '')) {
        where += ' and (f1end = 0 or f1end >= ' +args['f1_start'] + ') and f1start <= ' +args['f1_stop'];
    }
    if (args['importance'] != '') {
        where += (where.length > whst.length ? ' and ' : ' ');
        where += 'importance >= ' +args['importance'];
    }
    if (args['pvalue'] != '') {
        where += (where.length > whst.length ? ' and ' : ' ');
        where += 'pvalue <= ' +args['pvalue'];
    }
    var corr_clause = flex_field_query('correlation',args['correlation'],args['correlation_fn']);
    where += ((where.length > whst.length && corr_clause.length > 0) ? ' and ' : ' ') + corr_clause;


    query += (where.length > whst.length ? where : '');
    query += ' order by '+args['order'] + (args['order'] == 'pvalue' ? ' ASC' : ' DESC');
    query += ' limit '+args['limit'] + ' label `feature1id` \'f1id\', `feature2id` \'f2id\'';

    return query;
}

function flex_field_query(label, value, fn) {
    var where = '';
    if (value != '') {
        if (fn == 'Btw'){
            where += '(' + label + ' >= -' +value + ' and '+ label + ' <= ' + value +')';
        }else if (fn == '<='){
            where += '('+ label + ' <= ' + value +')';
        }else if (fn == '>='){
            where += '('+ label + ' >= ' +value +')';
        }else{
            if (parseFloat(value) != '0' ) {
                where += '('+ label + ' >= ' +value + ' or '+ label + ' <= -' + value +')';
            }
        }
    }
    return where;

}

function parseLabelList(field_id,labellist) {
    var clause = '(';
    var labels = labellist.split(',');
    if (labels.length < 1) return '';
    labels.forEach( function(label) {
        clause += ' `' + field_id + '` ' + parseLabel(label);
        clause += ' or'
    });
    clause = clause.slice(0,-3)
    clause += ')';
    return clause;
}

function parseLabel(label) {
    label = label.replace(new RegExp(' ','g'),'');
    if (label.length > 1  && (label.indexOf('*')>=0 || label.indexOf('%')>=0)) {
        return 'like \'' + label.replace(new RegExp('[*%]', 'g'),'%25') + '\'';
    } else {
        return '=\'' + label + '\'';
    }
}

/*
 Misc data/file retrieval
 */

function downloadNetworkData(target_frame,output) {
    var output_label = output;
    var output_extension=output;
    if (output_label =='tsv') {output_extension=output_label;output_label='tsv-excel';}
    target_frame.src = 'http://' + window.location.host + encodeURI(base_query_url +
        tcga_base_query_uri + network_uri+ '?tq=' + network_query + '&tqx=out:' +output_label+';outFileName:'+current_data+'_query.'+output_extension);
}


