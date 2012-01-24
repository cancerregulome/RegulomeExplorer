
function registerLayoutListeners() {
    var d = vq.events.Dispatcher;
    d.addListener('data_ready','dataset_labels',function(obj){
        loadListStores(obj);
        resetFormPanel();
        checkFormURL();
        requestFilteredData();
        re.state.once_loaded=true;
    });
    d.addListener( 'load_fail','associations',function(obj){
        re.windows.masks.network_mask.hide();
    });
    d.addListener( 'query_fail','associations',function(obj){
        Ext.Msg.alert('Query failed',obj.msg);
        re.windows.masks.network_mask.hide();
    });
    d.addListener('click_association',function(link){
        openDetailsWindow(link);
    });
    d.addListener('data_ready','features',function(obj) {
        renderScatterPlot(obj);
        re.windows.masks.details_window_mask.hide();
    });
    d.addListener('data_ready','annotations',function(obj){
        loadDataset();
    });
    d.addListener('render_complete','circvis',function(circvis_plot){
        re.state.query_cancel = false;
        exposeCirclePlot();
    });
    d.addListener('data_ready','associations',function(data) {
        loadDataTableStore(data);
    });
    d.addListener('render_complete','linear',function(linear){
        exposeLinearPlot();
    });
    d.addListener('render_complete','scatterplot',function(obj){
        scatterplot_obj=obj;
    });
    d.addListener('query_complete','label_position', function(obj) {
        completeLabelLookup(obj);
    });
    d.addListener('query_fail','label_position', function(obj) {
        failedLabelLookup(obj);
    });
    d.addListener('query_fail','features', function(obj) {
        re.windows.masks.details_window_mask.hide();
    });
    d.addListener('query_cancel','associations',function(data) {
        re.state.query_cancel = true;
    });
}


/*
 URL-based Form manipulation
 */


window.onpopstate = function(event) {
    if (re.state.once_loaded) loadDataset();
};

function extractURL() {
    var json = null;
    var url = location.search;
    if (url.length > 1) json = Ext.urlDecode(url.slice(1));
    return json;
}

function checkDatasetURL()   {
    var json = extractURL();
    if (json != null && json.dataset !== undefined) {
        selectDatasetByLabel(json.dataset);
    }
}

function checkFormURL() {
    var json = extractURL();
    setFormState(json);
}

function setFormState(json) {
    Ext.iterate(json,setComponentState)
}

function setComponentState(key, value){
    var field = Ext.getCmp(key);
    if (field !== undefined && 'setValue' in field) {
        Ext.getCmp(key).setValue(value,true);
    }
}

function getURI() {
    return location.protocol + '//' + location.href;
}

function removeDefaultValues(json) {
    //remove default clinical label values.  They've already been copied to the label field
    ['t','p'].forEach(function(f) {
        if (json[f + '_type'] == 'CLIN') {
            if (json[f + '_label'] == Ext.getCmp(f + '_clin').defaultValue) {
                delete json[f + '_label'];
            }
        }
    });
    //remove all of the other default value fields
    for (var i in json) {
            if (json[i] == null || json[i] == Ext.getCmp(i).defaultValue) {
                delete json[i];
            }
        }
        return json;
}


function generateStateJSON() {
    var json = getFilterSelections();
    //don't preserve empty or obvious values
    json = removeDefaultValues(json);
    var obj = {};
    obj.dataset = getSelectedDatasetLabel();
    obj = vq.utils.VisUtils.extend(obj,json);
    return obj;
}

function generateStateURL() {
    return getURI() + '?' + Ext.urlEncode(generateStateJSON());
}

function preserveState() {
    window.history.pushState(generateStateJSON(), '','?' + Ext.urlEncode(generateStateJSON()));
}


/*
 Window manipulation
 */

function hideDatasetWindow() {
    re.windows.dataset_window.hide();
}

/*
 hide mask after scatterplot dispatches a 'completion' event?
 */

function openDetailsWindow(association) {
    re.windows.details_window.show();
    re.windows.masks.details_window_mask =  new Ext.LoadMask('details-window', {msg:"Loading Data..."});
    re.windows.masks.details_window_mask.show();
    renderMedlineDocuments(association);
    //renderPathways(association);
}

function showSVGDialog() {
    re.windows.export_window.show();
    export_svg();
}

function export_svg() {
    var serializer = new XMLSerializer();
    var svg_tags;
    var panel_dom = Ext.DomQuery.selectNode('div#circle-panel>svg');
    if (panel_dom !== undefined){
        svg_tags=serializer.serializeToString(panel_dom);
    }
    Ext.getCmp('export-textarea').setRawValue(svg_tags);
}

function loadDataDialog() {
    re.windows.dataset_window.show();
    Ext.getCmp('dataset_grid').store.load();
}

function exportDataDialog() {
    downloadNetworkData(document.getElementById('frame'),this.value);
}

function openHelpWindow(subject,text) {
    if (re.windows.helpWindowReference == null || re.windows.helpWindowReference.closed) {
        re.windows.helpWindowReference = window.open('','help-popup','width=400,height=300,resizable=1,scrollbars=1,status=0,'+
            'titlebar=0,toolbar=0,location=0,directories=0,menubar=0,copyhistory=0');
    }
    re.windows.helpWindowReference.document.title='Help - ' + subject;
    re.windows.helpWindowReference.document.body.innerHTML = '<b>' + subject +'</b><p><div style=width:350>' + text + '</div>';
    re.windows.helpWindowReference.focus();
}

function openBrowserWindow(url,width,height) {
    var w = width || 640, h = height || 480;
    window.open(url,'help-popup','width='+w+',height='+h+',resizable=1,scrollbars=1,status=0,'+
        'titlebar=0,toolbar=0,location=0,directories=0,menubar=0,copyhistory=0');
}

function openBrowserTab(url) {
    var new_window = window.open(url,'_blank');
    new_window.focus();
}


/*
 Filters
 */

function manualFilterRequest() {
    re.state.query_cancel = false;
    preserveState();
    requestFilteredData();
}

function requestFilteredData() {
    vq.events.Dispatcher.dispatch(new vq.events.Event('data_request','associations',getFilterSelections()));
    prepareVisPanels();
}

/*
 getFilterSelections
 gathers the selections of each filter widget, packs it into a single object, and returns it
 easier to consume by event listeners, hopefully?
 */

function getFilterSelections() {
    var type_1 = Ext.getCmp('t_type').getValue();
    var label_1;
    switch(type_1) {
        case('CLIN'):
            label_1 = Ext.getCmp('t_clin').getValue();
            break;
        default :
            label_1 = Ext.getCmp('t_label').getValue();
    }
    var type_2 = Ext.getCmp('p_type').getValue();
    var label_2;
    switch(type_2) {
        case('CLIN'):
            label_2 = Ext.getCmp('p_clin').getValue();
            break;
        default :
            label_2 = Ext.getCmp('p_label').getValue();
    }
    return packFilterSelections(
        type_1,
        label_1,
        Ext.getCmp('t_chr').getValue(),
        Ext.getCmp('t_start').getValue(),
        Ext.getCmp('t_stop').getValue(),

        type_2,
        label_2,
        Ext.getCmp('p_chr').getValue(),
        Ext.getCmp('p_start').getValue(),
        Ext.getCmp('p_stop').getValue(),


        Ext.getCmp('order').getValue(),
        Ext.getCmp('limit').getValue(),

        Ext.getCmp('filter_type').getValue()
    );
}

function packFilterSelections() {
    var return_obj = {
        t_type:arguments[0],t_label:arguments[1], t_chr:arguments[2],
        t_start:arguments[3],t_stop:arguments[4],
        p_type:arguments[5],p_label:arguments[6], p_chr:arguments[7],
        p_start:arguments[8],p_stop:arguments[9],
        order:arguments[10],
        limit:arguments[11],
        filter_type:arguments[12]};
  
        re.model.association.types.forEach(function (obj){
          return_obj[obj.id] = Ext.getCmp(obj.id).getValue();
            if (obj.ui.filter.component instanceof re.multirangeField)  {
                return_obj[obj.id + '_fn'] =  Ext.getCmp(obj.id + '_fn').getValue(); 
            }
        });
    return return_obj;
}


function resetFormPanel() {
    Ext.getCmp('t_type').reset(),
        Ext.getCmp('t_label').reset(),
        Ext.getCmp('t_chr').reset(),
        Ext.getCmp('t_clin').reset(),
        Ext.getCmp('t_start').reset(),
        Ext.getCmp('t_stop').reset(),
        Ext.getCmp('p_type').reset(),
        Ext.getCmp('p_label').reset(),
        Ext.getCmp('p_chr').reset(),
        Ext.getCmp('p_clin').reset(),
        Ext.getCmp('p_start').reset(),
        Ext.getCmp('p_stop').reset(),
        Ext.getCmp('order').reset(),
        Ext.getCmp('limit').reset(),
    Ext.getCmp('filter_type').reset();

          re.model.association.types.forEach( function(obj){
                Ext.getCmp(obj.id).reset();
            if (obj.ui.filter.component instanceof re.multirangeField)  {
                Ext.getCmp(obj.id + '_fn').reset(); 
            }
        });
}

/*
 should be called by an event listener
 */

function loadListStores(dataset_labels) {
    var label_list = dataset_labels['feature_sources'].map(function(row) {
        return {value:row.source, label: re.label_map[row.source] || row.source};
    });
    label_list.unshift({value:'*',label:'All'});
    Ext.StoreMgr.get('f1_type_combo_store').loadData(label_list);
    Ext.getCmp('t_type').setValue('GEXP');
    Ext.StoreMgr.get('f2_type_combo_store').loadData(label_list);
    Ext.getCmp('p_type').setValue('*');
    var clin_list = dataset_labels['clin_labels'].map(function(row) {
        return {value:row.label, label: row.label};
    });
    clin_list.unshift({value:'*',label:'All'});
    Ext.StoreMgr.get('f1_clin_list_store').loadData(clin_list);
    Ext.getCmp('t_clin').setValue('*');
    Ext.getCmp('t_clin').defaultValue = '*';
    Ext.StoreMgr.get('f2_clin_list_store').loadData(clin_list);
    Ext.getCmp('p_clin').setValue('*');
    Ext.getCmp('p_clin').defaultValue = '*';
}

function loadDataTableStore(data) {
    var mapped_data = pv.blend([data['network'],data['unlocated']]).map(function(row) {
        var obj = {target_id: row.node1.id, target_source: row.node1.source,target_label: row.node1.label,target_chr: row.node1.chr,
            target_start: row.node1.start,target_stop:row.node1.stop,
            source_id: row.node2.id, source_source :row.node2.source,source_label: row.node2.label,source_chr: row.node2.chr,
            source_start: row.node2.start,source_stop: row.node2.stop};
            re.model.association.types.forEach(function(assoc) {
                obj[assoc.ui.grid.store_index] = row[assoc.query.id];
            });
        return obj;
    });
    Ext.StoreMgr.get('data_grid_store').loadData(mapped_data);
}

/*
 loadSelectedDataset
 should dispatch an event after validating dataset selection
 */

function loadDataset() {
    checkDatasetURL();
    if(Ext.getCmp('dataset_grid').getSelectionModel().getSelected() === undefined)
        Ext.getCmp('dataset_grid').getSelectionModel().selectFirstRow();
    loadSelectedDataset();
}

function selectDatasetByLabel(label)  {
    var record_index = Ext.StoreMgr.get('dataset_grid_store').find('label',label);
    if (record_index >= 0) {
        Ext.getCmp('dataset_grid').getSelectionModel().selectRow(record_index);
    }
}

function getSelectedDataset() {
    return Ext.getCmp('dataset_grid').getSelectionModel().getSelected();
}

function getSelectedDatasetLabel() {
    var selected_record = getSelectedDataset();
    var selected_dataset = '';
    if (selected_record != null) {
        selected_dataset = selected_record.json.label;
    }
    return selected_dataset;
}

function getSelectedDatasetDescription() {
    var selected_record = getSelectedDataset();
    var selected_dataset = '';
    if (selected_record != null) {
        selected_dataset = selected_record.json.description;
    }
    return selected_dataset;
}


function manualLoadSelectedDataset() {
    preserveState();
    loadSelectedDataset();
}

function loadSelectedDataset() {
    var selected_dataset = getSelectedDatasetLabel();
    var selected_description = getSelectedDatasetDescription();
    if (selected_dataset != '') {
        vq.events.Dispatcher.dispatch(new vq.events.Event('dataset_selected','dataset_grid',selected_dataset));
        hideDatasetWindow();
        Ext.getCmp('filters').setTitle( 'Filtering \'' + selected_description + '\'');
    } else {
        Ext.MessageBox.alert('Dataset not selected','Select a dataset to load.');
    }
}

function completeLabelLookup(lookup_obj) {
    var feature = lookup_obj.feature || {};
    if (feature === {} ) { return;}
    var ui = (lookup_obj.ui == 'f2' ? 'p' : 't');
    var chr_ui = Ext.getCmp(ui+'_chr');
    var start_ui = Ext.getCmp(ui+'_start');
    var end_ui = Ext.getCmp(ui+'_stop');
    var chr = feature.chr.slice(3);
    var start = Math.max (feature.start - 5000, 0);
    var stop = feature.end + 5000;
    chr_ui.setValue(chr);
    start_ui.setValue(start);
    end_ui.setValue(stop);
    var label_ui = Ext.getCmp(ui+'_label');
    label_ui.setValue('');
}

function failedLabelLookup() {
    var alert = Ext.Msg.alert('Failure ', 'Specified Gene Label was not found.', function() { task.cancel()});
    var task = new Ext.util.DelayedTask(function(){
        alert.hide();
    });
    task.delay(1300);
}

/*
 renderScatterPlot
 should be wrapped in an event listener external to the ui layout code
 */
function renderScatterPlot() {
    var regression_type = Ext.getCmp('scatterplot_regression_radiogroup').getValue().getRawValue();
    var reverse_axes = Ext.getCmp('scatterplot_axes_checkbox').getValue();
    var discretize_x = Ext.getCmp('scatterplot_discrete_x_checkbox').getValue();
    var discretize_y = Ext.getCmp('scatterplot_discrete_y_checkbox').getValue();
    var event_obj =  {
        div:document.getElementById('scatterplot_panel'),
        regression_type:regression_type,
        reverse_axes:reverse_axes,
        discretize_x : discretize_x,
        discretize_y :discretize_y
    };
    if (arguments.length ==1)  //data passed into function
        event_obj['data'] = arguments[0];

    Ext.getCmp('details-tabpanel').layout.setActiveItem('scatterplot_parent');
    Ext.getCmp('scatterplot_parent').show();
    vq.events.Dispatcher.dispatch(
        new vq.events.Event('render_scatterplot','details',event_obj)
    );
}

/*
 MEDLINE functions
 */

function renderMedlineDocuments(association) {
    var term1 = association.sourceNode.label;
    var term2 = association.targetNode.label;
    retrieveMedlineDocuments(term1,term2);
    Ext.StoreMgr.get('dataDocument_grid_store').load({params: {start:0, rows:20}});
}

function retrieveMedlineDocuments(term1,term2){
    Ext.StoreMgr.get('dataDocument_grid_store').on({
        beforeload:{
            fn: function(store,options){
                store.proxy.setUrl(re.databases.solr.uri + re.databases.solr.select + '?q=%2Btext%3A\"' + term1 + '\" %2Btext%3A\"' + term2 + '\"&fq=%2Bpub_date_year%3A%5B1991 TO 2011%5D&wt=json' +
                    '&hl=true&hl.fl=article_title,abstract_text&hl.snippets=100&hl.fragsize=50000&h.mergeContiguous=true');
            }
        }
    });
}

/*
 Grid Column rendering functions
 */

function renderPMID(value, p, record) {
    return String.format('<b><a href="http://www.ncbi.nlm.nih.gov/pubmed/{0}" target="_blank">{0}</a></b>', record.data.pmid);
}

function renderTitle(value, p, record) {
    var jsonData = record.store.reader.jsonData;
    if (jsonData.highlighting[record.id] != undefined && jsonData.highlighting[record.id].article_title != undefined) {
        return jsonData.highlighting[record.id].article_title[0];
    }
    else
        return record.data.article_title;
}
/*
 Pathways functions
 */
// function renderPathways(association) {
//     var target_id = association.sourceNode.id;
//     var predictor_id = association.targetNode.id;
//     retrievePathways(target_id,predictor_id);
//     Ext.StoreMgr.get('target_pathways_grid_store').load();
//     Ext.StoreMgr.get('predictor_pathways_grid_store').load();
//     Ext.getCmp('target_pathways_grid').setTitle('Target: ' + association.sourceNode.label);
//     Ext.getCmp('predictor_pathways_grid').setTitle('Predictor: ' + association.targetNode.label);
// }

// function retrievePathways(target_id,predictor_id){
//     var pathway_query = 'select pathway_name, pathway_type, pvalue';
//     Ext.StoreMgr.get('target_pathways_grid_store').on({
//         beforeload:{
//             fn: function(store,options){
//                 store.proxy.setUrl(re.databases.base_uri + re.databases.rf_ace.uri + re.tables.pathway_uri + re.rest.query +
//                     '?' + re.params.query + pathway_query +
//                     ' where featureid = ' + target_id+'&tqx=out:json_array');
//             }
//         }
//     });
//     Ext.StoreMgr.get('predictor_pathways_grid_store').on({
//         beforeload:{
//             fn: function(store,options){
//                 store.proxy.setUrl(re.databases.base_uri + re.databases.rf_ace.uri + re.tables.pathway_uri + re.rest.query +
//                     '?' + re.params.query + pathway_query +
//                     ' where featureid = ' + predictor_id+'&tqx=out:json_array');
//             }
//         }
//     });
// }

/*clean divs*/

function prepareVisPanels() {
    re.windows.masks.network_mask = new Ext.LoadMask('view-region',
                                {
                                msg:"Loading Data...",
                                cancelEvent:function() {
                                    vq.events.Dispatcher.dispatch(
                                        new vq.events.Event('query_cancel','associations',{}));
                                                        }
                                        });
    re.windows.masks.network_mask.show();
    wipeLinearPlot();
}

function wipeLinearPlot(){
    Ext.getCmp('linear-parent').setTitle('Chromosome-level View');
    document.getElementById('linear-panel').innerHTML='';
    Ext.getCmp('linear-parent').collapse(true);
}

function exposeCirclePlot(){
    Ext.getCmp('circle-parent').expand(true);
    re.windows.masks.network_mask.hide();
}
function exposeLinearPlot(chr,start,range_length) {
    Ext.getCmp('linear-parent').expand(true);
    Ext.getCmp('linear-parent').setTitle('Chromosome-level View: Chromosome ' + chr);
    var task = new Ext.util.DelayedTask(function(){
        var rf =  Ext.getCmp('rf-graphical').body;
        var d = rf.dom;
        rf.scroll('b',d.scrollHeight - d.offsetHeight,true);
    });
    task.delay(300);
}

function openRFPanel() {
    loadDataLabelLists(function() {
        if (Ext.get('circle-panel').dom.firstChild.id != ""){
            getFilterSelections();
        }
    });
}

function registerAllListeners() {
    registerLayoutListeners();
    registerDataRetrievalListeners();
    registerModelListeners();
    registerPlotListeners();
}

Ext.onReady(function() {
    Ext.QuickTips.init();

    registerAllListeners();

    var randomforestPanel = new Ext.Panel({
        id:'randomforest-panel',
        name:'randomforest-panel',
        layout : 'border',
        frame : false,
        border : false,
        defaults: {
            bodyStyle: 'padding:5px',
            animFloat: false,
            floatable: false
        },
        items:[
            {region: 'center', id: 'view-region',
                xtype: 'tabpanel',
                border : false,
                activeTab : 0,
                deferredRender : false,
                items: [               {
                    xtype : 'panel', id :'rf-graphical',
                    layout : 'auto', title: 'Multi-Scale',
                    autoScroll : 'true',
                    items: [{
                        xtype: 'panel', id:'circle-parent',
                        layout : 'absolute',
                        height: 900,
                        width:1050,
                        collapsible : true,
                        title : 'Genome-level View',
                        tools: [{
                            id: 'help',
                            handler: function(event, toolEl, panel){
                                openHelpWindow('Genome-level View',genomeLevelHelpString);
                            }}],
                        items : [ {
                            xtype: 'panel', id:'circle-panel',
                            width:800,
                            x:20,
                            y:20
                        },
                            {
                                xtype: 'panel', id:'circle-legend-panel',
                                width:150,
                                border:false,
                                frame : false,
                                x:880,
                                y:20
                            }]
                    }, {
                        xtype: 'panel', id:'linear-parent',
                        layout : 'absolute',
                        height: 800,
                        width:1050,
                        collapsible : true,
                        collapsed : true,
                        title : 'Chromosome-level View',
                        tools: [{
                            id: 'help',
                            handler: function(event, toolEl, panel){
                                openHelpWindow('Chromosome-level View',chromosomeLevelHelpString);
                            }}],
                        items : [ {
                            xtype: 'panel', id:'linear-panel',
                            width:800,
                            x:20,
                            y:20,
                            html: 'For a Chromosome-level view of the data, select a point of focus from the Genome-level View.<p>' +
                                'Click on:' +
                                '<ol><li>Chromosome Label</li><li>Tick Label</li>'
                        },
                            {
                                xtype: 'panel', id:'linear-legend-panel',
                                width:150,
                                border:false,
                                frame : false,
                                x:820,
                                y:20
                            }]
                    }]},{
                    xtype: 'panel',  id:'network-panel',
                    name : 'network-panel',
                    title : 'Network',
                    monitorResize : true,
                    autoScroll : false,
                    layout : 'absolute',
                    height: 800,
                    width:1050,
                    collapsible : false,
                    listeners: {
                        activate: function() {
                            var e = new vq.events.Event('frame_ready','graph',{});
                            e.dispatch();
                        }
                    },
                    items : [
                        { xtype : 'panel',
                            border : false,
                            frame : false,
                            items: [ {
                                xtype:'panel' ,
                                id : 'graph-panel',
                                name : 'graph-panel',
                                autoScroll:false,
                                height: 800,
                                width:800
                            }]
                        }]
                }, {
                    xtype: 'panel',  id:'grid-panel',
                    name : 'grid-panel',
                    title : 'Data Table',
                    monitorResize : true,
                    autoScroll : false,
                    layout : 'fit',
                    height: 650,
                    width:1050,
                    collapsible : false,
                    tools: [{
                        id: 'help',
                        handler: function(event, toolEl, panel){
                            openHelpWindow('Data-level View',dataLevelViewHelpString);
                        }}],
                    items : [
                        {
                            xtype:'grid',
                            id : 'data_grid',
                            name : 'data_grid',
                            autoScroll:true,
                            monitorResize: true,
                            autoWidth : true,
                            height: 650,
                            viewConfig: {
                                forceFit : true
                            },
                            cm : new Ext.grid.ColumnModel({
                                columns: [
                                    {header : "Id", width:40, hidden: true, id:'target_id', dataIndex:'target_id'},
                                    { header: "Type", width: 40,  id:'target_source', dataIndex:'target_source',groupName:'Target'},
                                    { header: "Label", width: 120, id: 'target_label',dataIndex:'target_label',groupName:'Target'},
                                    { header: "Chr", width:30 , id:'target_chr', dataIndex:'target_chr',groupName:'Target'},
                                    { header: "Start", width:100, id:'target_start',dataIndex:'target_start',groupName:'Target'},
                                    { header: "Stop", width:100, id:'target_stop',dataIndex:'target_stop',groupName:'Target'},
                                    { header : "Id", width:40,  hidden: true, id:'source_id', dataIndex:'source_id'},
                                    { header: "Type", width: 40,  id:'source_source', dataIndex:'source_source',groupName:'Source'},
                                    { header: "Label", width: 120, id: 'source_label',dataIndex:'source_label',groupName:'Source'},
                                    { header: "Chr", width:30 , id:'source_chr', dataIndex:'source_chr',groupName:'Source'},
                                    { header: "Start", width:100, id:'source_start',dataIndex:'source_start',groupName:'Source'},
                                    { header: "Stop", width:100, id:'source_stop',dataIndex:'source_stop',groupName:'Source'}
                                    ].concat(re.model.association.types.map( function(obj){ return obj.ui.grid.column;})),
                                defaults: {
                                    sortable: true,
                                    width: 100
                                }
                            }),
                            store : new Ext.data.JsonStore({
                                autoLoad:false,
                                storeId:'data_grid_store',
                               fields : ['target_id','target_source','target_label','target_chr','target_start','target_stop',
                                    'source_id', 'source_source','source_label','source_chr','source_start','source_stop'
                                    ].concat(re.model.association.types.map( function(obj){ return obj.ui.grid.store_index;}))
                            }),
                            listeners: {
                                rowclick : function(grid,rowIndex,event) {
                                    var record = grid.getStore().getAt(rowIndex);
                                    var link = {};link.sourceNode = {};link.targetNode = {};
                                    link.sourceNode.id = record.get('target_id');
                                    link.targetNode.id = record.get('source_id');
                                    link.sourceNode.label = record.get('target_label');
                                    link.targetNode.label = record.get('source_label');
                                    //initiateDetailsPopup(link);
                                    vq.events.Dispatcher.dispatch(new vq.events.Event('click_association','associations_table',link));
                                }
                            }
                        }]
                }]
            },
            {region: 'east',
                collapsible: true,
                floatable: true,
                autoHide:false,
                split: true,
                width: 280,
                title: 'Tools',
                layout: {
                    type: 'accordion'
                },
                tools: [{
                    id: 'help',
                    handler: function(event, toolEl, panel){
                        openHelpWindow('Tools',toolsHelpString);
                    }}],
                items: [
                    {
                        xtype: 'panel', id:'filters',
                        title : 'Filtering',
                        autoScroll : true,
                        height : 250,
                        tools: [{
                            id: 'help',
                            handler: function(event, toolEl, panel){
                                openHelpWindow('Filtering',filteringHelpString);
                            }}],
                        items :[
                            { xtype:'form',
                                id :'filter_panel',
                                name :'filter_panel',
                                bodyStyle:'padding:5px 5px 5px 5px',
                                defaults:{anchor:'100%'},
                                border : false,
                                labelAlign : 'right',
                                labelWidth: 70,
                                labelSeparator : '',
                                defaultType:'textfield',
                                monitorValid : true,
                                buttons : [
                                    {
                                        text: 'Filter',
                                        formBind : true,
                                        listeners : {
                                            click : function(button,e) {
                                                manualFilterRequest();
                                            }
                                        }
                                    },
                                    { text: 'Reset',
                                        listeners : {
                                            click : function(button,e) {
                                                resetFormPanel();
                                            }
                                        }
                                    }
                                ],
                                items : [
                                    {  xtype:'fieldset',
                                        title:re.ui.feature1.label,
                                        collapsible: true,
                                        defaults:{anchor:'100%'},
                                        labelWidth: 70,
                                        labelSeparator : '',forceSelection : true,
                                        defaultType:'textfield',
                                        autoHeight:true,
                                        items:[
                                            {
                                                xtype:'combo',
                                                name:'t_type',
                                                id:'t_type',
                                                mode:'local',
                                                allowBlank : true,
                                                store: new Ext.data.JsonStore({
                                                    autoLoad : false,
                                                    fields : ['value','label'],
                                                    idProperty:'value',
                                                    data: [
                                                        {value: '*',label:'All'}
                                                    ],
                                                    storeId:'f1_type_combo_store'
                                                }),
                                                fieldLabel:'Type',
                                                valueField:'value',
                                                displayField:'label',
                                                tabIndex : 0,
                                                typeAhead : true,
                                                selectOnFocus:true,
                                                triggerAction : 'all',
                                                forceSelection : true,
                                                emptyText : 'Select a Type...',
                                                defaultValue : 'GEXP',
                                                value : 'GEXP',
                                                listeners : {
                                                    select : function(field,record, index) {
                                                        switch(record.id)  {
                                                            case('CLIN'):
                                                                Ext.getCmp('f1_label_comp').setVisible(false);
                                                                Ext.getCmp('t_clin').setVisible(true);
                                                                break;
                                                            default:
                                                                Ext.getCmp('f1_label_comp').setVisible(true);
                                                                Ext.getCmp('t_clin').setVisible(false);
                                                        }
                                                    }
                                                }
                                            }, {
                                                xtype:'compositefield',
                                                fieldLabel:'Label',
                                                id:'f1_label_comp',
                                                items:[
                                                    {
                                                        xtype:'textfield',
                                                        name:'t_label',
                                                        id:'t_label',
                                                        emptyText : 'Input Label...',
                                                        tabIndex: 1,
                                                        width:80,
                                                        selectOnFocus:true,
                                                        fieldLabel:'Label',
                                                        defaultValue : '',
                                                        value : ''
                                                    },
                                                    {
                                                        xtype:'button',
                                                        text:'Lookup',
                                                        width:50,
                                                        handler:function(evt) {
                                                            var label = Ext.getCmp('t_label').getValue();
                                                            if (label.length > 0) {
                                                                vq.events.Dispatcher.dispatch(new vq.events.Event('data_request','label_position',{ui:'f1',label:label}));
                                                            }
                                                        }
                                                    }
                                                ]
                                            }, {
                                                name:'t_clin',
                                                mode:'local',
                                                id:'t_clin',
                                                xtype:'combo',
                                                allowBlank : false,
                                                hidden:true,
                                                store: new Ext.data.JsonStore({
                                                    autoLoad : false,
                                                    data: [],
                                                    fields : ['value','label'],
                                                    idProperty:'value',
                                                    storeId:'f1_clin_list_store'
                                                }),
                                                listWidth:200,
                                                fieldLabel:'Clinical Feature',
                                                selectOnFocus:true,
                                                forceSelection : true,
                                                triggerAction : 'all',
                                                valueField:'value',
                                                displayField:'label',
                                                emptyText:'CLIN Feature...',
                                                defaultValue:'*',
                                                value:'*'
                                            },
                                            {
                                                xtype:'combo', name:'t_chr',id:'t_chr',
                                                mode:'local',
                                                allowBlank : false,
                                                store: new Ext.data.JsonStore({
                                                    autoLoad : true,
                                                    fields : ['value','label'],
                                                    idProperty:'value',
                                                    data: re.ui.chromosomes,
                                                    storeId:'f1_chr_combo_store'
                                                }),
                                                fieldLabel:'Chromosome',
                                                valueField:'value',
                                                displayField:'label',
                                                tabIndex : 2,
                                                selectOnFocus:true,
                                                forceSelection : true,
                                                triggerAction : 'all',
                                                emptyText : 'Select Chr...',
                                                defaultValue:'*',
                                                value : '*'
                                            },{xtype : 'numberfield',
                                                id:'t_start',
                                                name :'t_start',
                                                allowNegative: false,
                                                decimalPrecision : 0,
                                                emptyText : 'Input value...',
                                                invalidText:'This value is not valid.',
                                                maxValue: 250999999,
                                                minValue:1,
                                                tabIndex : 1,
                                                validateOnBlur : true,
                                                allowDecimals : false,
                                                fieldLabel : 'Start >=',
                                                defaultValue : '',
                                                value : ''
                                            },{xtype : 'numberfield',
                                                id:'t_stop',
                                                name :'t_stop',
                                                allowNegative: false,
                                                decimalPrecision : 0,
                                                emptyText : 'Input value...',
                                                invalidText:'This value is not valid.',
                                                maxValue: 250999999,
                                                minValue:1,
                                                tabIndex : 1,
                                                validateOnBlur : true,
                                                allowDecimals : false,
                                                fieldLabel : 'Stop <=',
                                                defaultValue : '',
                                                value : ''
                                            }
                                        ]},
                                    {  xtype:'fieldset',
                                        title:re.ui.feature2.label,
                                        collapsible: true,
                                        defaults:{anchor:'100%'},
                                        labelWidth: 70,
                                        labelSeparator : '',
                                        defaultType:'textfield',
                                        autoHeight:true,
                                        items: [
                                            {
                                                xtype:'combo',
                                                name:'p_type',
                                                id:'p_type',
                                                mode:'local',
                                                allowBlank : true,
                                                store: new Ext.data.JsonStore({
                                                    autoLoad : false,
                                                    fields : ['value','label'],
                                                    idProperty:'value',
                                                    data: [
                                                        {value: '*',label:'All'}
                                                    ],
                                                    storeId:'f2_type_combo_store'
                                                }),
                                                fieldLabel:'Type',
                                                valueField:'value',
                                                displayField:'label',
                                                tabIndex : 0,
                                                typeAhead : true,
                                                selectOnFocus:true,
                                                triggerAction : 'all',
                                                forceSelection : true,
                                                emptyText : 'Select a Type...',
                                                defaultValue : '*',
                                                value : '*',
                                                listeners : {
                                                    select : function(field,record, index) {
                                                        switch(record.id)  {
                                                            case('CLIN'):
                                                                var label_cmp = Ext.getCmp('f2_label_comp'),
                                                                    clin_cmp = Ext.getCmp('p_clin');
                                                                label_cmp.setVisible(false);
                                                                clin_cmp.setVisible(true);
                                                                break;
                                                            default:
                                                                var label_cmp = Ext.getCmp('f2_label_comp'),
                                                                    clin_cmp = Ext.getCmp('p_clin');
                                                                label_cmp.setVisible(true);
                                                                clin_cmp.setVisible(false);
                                                        }
                                                    }
                                                }
                                            }, {
                                                xtype:'compositefield',
                                                fieldLabel:'Label',
                                                id:'f2_label_comp',
                                                items:[
                                                    {
                                                        xtype:'textfield',
                                                        name:'p_label',
                                                        id:'p_label',
                                                        emptyText : 'Input Label...',
                                                        tabIndex: 1,
                                                        width:80,
                                                        selectOnFocus:true,
                                                        fieldLabel:'Label',
                                                        defaultValue : '',
                                                        value : ''
                                                    },
                                                    {
                                                        xtype:'button',
                                                        text:'Lookup',
                                                        width:50,
                                                        handler:function(evt) {
                                                            var label = Ext.getCmp('p_label').getValue();
                                                            if (label.length > 0) {
                                                                vq.events.Dispatcher.dispatch(new vq.events.Event('data_request','label_position',{ui:'f2',label:label}));
                                                            }
                                                        }
                                                    }
                                                ]
                                            },  {

                                                mode:'local',
                                                name:'p_clin',
                                                id:'p_clin',
                                                xtype:'combo',
                                                allowBlank : false,
                                                hidden:true,
                                                store: new Ext.data.JsonStore({
                                                    autoLoad : false,
                                                    data: [],
                                                    fields : ['value','label'],
                                                    idProperty:'value',
                                                    storeId:'f2_clin_list_store'
                                                }),
                                                listWidth:200,
                                                fieldLabel:'Clinical Feature',
                                                selectOnFocus:true,
                                                forceSelection : true,
                                                triggerAction : 'all',
                                                valueField:'value',
                                                displayField:'label',
                                                emptyText:'CLIN Feature...',
                                                defaultValue:'*',
                                                value:'*'
                                            },
                                            { xtype:'combo', name:'p_chr',id:'p_chr',
                                                mode:'local',
                                                allowBlank : true,
                                                store: new Ext.data.JsonStore({
                                                    autoLoad : true,
                                                    fields : ['value','label'],
                                                    idProperty:'value',
                                                    data: re.ui.chromosomes,
                                                    storeId:'f2_chr_combo_store'
                                                }),
                                                fieldLabel:'Chromosome',
                                                valueField:'value',
                                                displayField:'label',
                                                tabIndex : 2,
                                                selectOnFocus:true,
                                                forceSelection : true,
                                                triggerAction : 'all',
                                                emptyText : 'Select Chr...',
                                                defaultValue : '*',
                                                value : '*'
                                            },{xtype : 'numberfield',
                                                id:'p_start',
                                                name :'p_start',
                                                allowNegative: false,
                                                decimalPrecision : 0,
                                                emptyText : 'Input value...',
                                                invalidText:'This value is not valid.',
                                                maxValue: 250999999,
                                                minValue:1,
                                                tabIndex : 1,
                                                validateOnBlur : true,
                                                allowDecimals : false,
                                                fieldLabel : 'Start >=',
                                                defaultValue : '',
                                                value : ''
                                            },{xtype : 'numberfield',
                                                id:'p_stop',
                                                name :'p_stop',
                                                allowNegative: false,
                                                decimalPrecision : 0,
                                                emptyText : 'Input value...',
                                                invalidText:'This value is not valid.',
                                                maxValue: 250999999,
                                                minValue:1,
                                                tabIndex : 1,
                                                validateOnBlur : true,
                                                allowDecimals : false,
                                                fieldLabel : 'Stop <=',
                                                defaultValue : '',
                                                value : ''
                                            }

                                        ]},
                                    {  xtype:'fieldset',
                                        defaults:{anchor:'100%'},
                                        labelWidth : 90,
                                        labelSeparator : '',
                                        title:'Association',
                                        collapsible: true,
                                        autoHeight:true,
                                        items:
                                                re.model.association.types.map( function (obj) {
                                                    return obj.ui.filter.component;
                                                }).concat([                                            
                                            { xtype:'combo', name:'order',id:'order',
                                                mode:'local',
                                                allowBlank : true,
                                                store: new Ext.data.JsonStore({
                                                    autoLoad : true,
                                                    fields : ['value','label'],
                                                    idProperty:'value',
                                                    data: re.ui.order_list,
                                                    storeId:'order_combo_store'
                                                }),
                                                fieldLabel:'Order By',
                                                valueField:'value',
                                                displayField:'label',
                                                tabIndex : 2,
                                                typeAhead : true,
                                                selectOnFocus:true,
                                                triggerAction : 'all',
                                                defaultValue : re.ui.order_list[0]['value'],
                                                value : re.ui.order_list[0]['value']
                                            },
                                            { xtype:'combo', name:'limit',id:'limit',
                                                mode:'local',
                                                allowBlank : true,
                                                store: new Ext.data.JsonStore({
                                                    autoLoad : true,
                                                    fields : ['value','label'],
                                                    idProperty:'value',
                                                    data: re.ui.limit_list,
                                                    storeId:'limit_combo_store'
                                                }),
                                                fieldLabel:'Max Results',
                                                valueField:'value',
                                                displayField:'label',
                                                tabIndex : 2,
                                                typeAhead : true,
                                                selectOnFocus:true,
                                                triggerAction : 'all',
                                                defaultValue : 200,
                                                value : 200
                                            }
                                        ])
                                    },
                                    {xtype:'combo',
                                        fieldLabel:'Filter By',
                                        displayField: 'label',
                                        valueField:'value',
                                        id:'filter_type',
                                        mode: 'local',
                                        defaultValue:'association',
                                        value:'association',
                                        typeAhead : true,
                                        forceSelection : true,
                                        selectOnFocus: true,
                                        triggerAction : 'all',
                                        allowBlank : false,
                                        store: {
                                            xtype: 'jsonstore',
                                            fields:['label','value'],
                                            autoLoad: true,
                                            idProperty:'value',
                                            data:[
                                                {  label:'Association', value:'association' },
                                                re.ui.feature1,
                                                re.ui.feature2
                                            ]
                                        }}]}
                        ]
                    }]
            }]
    });

    new Ext.Viewport({
        layout: {
            type: 'border',
            padding: 5
        },
        defaults: {
            split: true
        },
        items: [
            {
                region: 'north', id:'toolbar-region',
                collapsible: false,
                border : false,
                title: re.title || 'Multi-Scale Explorer',
                split: false,
                height: 27,
                layout : 'fit',
                tbar: [
                    {
                        id:'dataMenu',
                        text:'Data',
                        labelStyle: 'font-weight:bold;',
                        menu:[{
                            text:'Select',
                            handler:loadDataDialog
                        },{
                            text:'Export',
                            menu:[{
                                text:'CSV',
                                value:'csv',
                                handler:exportDataDialog
                            },{
                                text:'TSV',value:'tsv',
                                handler:exportDataDialog
                            },
                                {text:'SVG',value:'svg',
                                    handler:showSVGDialog
                                }]
                        }]
                    },{
                        id:'displayMenu',
                        text:'Display',
                        labelStyle: 'font-weight:bold;',
                        menu:[{
                            id:'networkMenu',
                            text:'Network',
                            labelStyle: 'font-weight:bold;',
                            menu:[{
                                checked:true,
                                text:'Force Directed',
                                xtype:'menucheckitem',
                                handler:networkLayoutHandler,
                                group:'networklayout_group'
                            },
                                { text:'Radial',
                                    xtype:'menucheckitem',
                                    handler:networkLayoutHandler,
                                    checked: false,
                                    group:'networklayout_group'},
                                { text:'Tree',
                                    xtype:'menucheckitem',
                                    handler:networkLayoutHandler,
                                    checked: false,
                                    group:'networklayout_group'}
                            ]
                        }]
                    },{
                        id:'modalMenu',
                        text:'Mode',
                        labelStyle: 'font-weight:bold;',
                        menu:[{
                            text:'Circular Plot',
                            menu:[{
                                xtype:'menucheckitem',
                                handler: modeHandler,
                                checked:true,
                                id:'explore_check',
                                group:'mode_group',
                                text:'Explore',
                                value: 'explore'
                            },
                                {
                                    xtype:'menucheckitem',
                                    handler: modeHandler,
                                    group:'mode_group',
                                    id:'nav_check',
                                    text:'Navigate',
                                    value: 'navigate'
                                }, {
                                    xtype:'menucheckitem',
                                    handler: modeHandler,
                                    group:'mode_group',
                                    disabled:true,
                                    id:'select_check',
                                    text:'Select',
                                    value: 'Select'
                                }]
                        }]
                    }]
            },
            { region:'center',
                id:'center-panel', name:'center-panel',
                layout:'card',
                border:false,
                closable:false,
                activeItem:0,
                height: 800,
                margins: '0 5 5 0',
                items:[
                    randomforestPanel
                ]
            }
        ],
        renderTo:Ext.getBody()
    });

    function modeHandler(item){
        switch(item.getId()) {
            case('nav_check'):
                vq.events.Dispatcher.dispatch(new vq.events.Event('modify_circvis','main_menu',{pan_enable:true,zoom_enable:true}));
                break;
            case('explore_check'):
            default:
                vq.events.Dispatcher.dispatch(new vq.events.Event('modify_circvis','main_menu',{pan_enable:false,zoom_enable:false}));
        }
    }

    function networkLayoutHandler(item) {
        switch(item.text) {
            case('Radial'):
                re.display_options.cytoscape.layout = 'radial';
                break;
            case('Tree'):
                re.display_options.cytoscape.layout = 'tree';
                break;
            case('Force Directed') :
            default:
                re.display_options.cytoscape.layout = 'force_directed';
                break;
        }
        vq.events.Dispatcher.dispatch(new vq.events.Event('layout_network','main_menu',{}));
    }

    re.windows.export_window = new Ext.Window( {
        id          : 'export-window',
        renderTo    : 'view-region',
        modal       : true,
        closeAction : 'hide',
        layout      : 'anchor',
        width       : 600,
        height      : 500,
        title       : "Export Image",
        closable    : true,
        tools: [{
            id: 'help',
            handler: function(event, toolEl, panel){
                openHelpWindow('Export',exportHelpString);
            }}],
        layoutConfig : {
            animate : true
        },
        maximizable : false,
        items: {
            xtype:'textarea',
            id:'export-textarea',
            name:'export-textarea',
            padding : '5 0 0 0',
            autoScroll:true,
            anchor:'100% 100%'
        }
    });
    re.windows.export_window.hide();

    var loadListener = function(store,records) {
        store.removeListener('load',loadListener) ;
        var e = new vq.events.Event('data_request','annotations',{});
        e.dispatch();
    };

    re.windows.dataset_window =
        new Ext.Window({
            id          : 'dataset-window',
            renderTo    : 'view-region',
            modal       : false,
            closeAction : 'hide',
            layout      : 'fit',
            width       : 600,
            height      : 300,
            title       : "Load Dataset",
            closable    : true,
            layoutConfig : {
                animate : true
            },
            maximizable : false,
            items: {
                xtype:'grid',
                id:'dataset_grid',
                autoScroll:true,
                loadMask:true,
                monitorResize: true,
                autoWidth : true,
                height: 250,
                viewConfig: {
                    forceFit : true
                },
                cm : new Ext.grid.ColumnModel({
                    columns: [
                        {header:"Description", width:120, id:'description',dataIndex:'description'},
                        {header:"Date", width: 90, id:'dataset_date',dataIndex:'dataset_date',hidden:false},
                        {header : "Label", width:120, id:'label', dataIndex:'label', hidden: true},
                        { header: "Method", width: 70,  id:'method', dataIndex:'method'},
                        { header: "Source", width: 70, id: 'source',dataIndex:'source'},
                        { header: "Contact", width:200 , id:'contact', dataIndex:'contact'},
                        { header: "Comments", width:100, id:'comments',dataIndex:'comments'}
                    ],
                    defaults: {
                        sortable: true,
                        width: 100
                    }
                }),
                store : new Ext.data.JsonStore({
                    autoLoad:true,
                    storeId:'dataset_grid_store',
                    idProperty:'label',
                    proxy: new Ext.data.HttpProxy({
                        url: re.databases.base_uri + re.databases.rf_ace.uri + re.tables.dataset + re.rest.query + '?' +
                            re.params.query +
                            'select `description`, `dataset_date`,`label`, `method`, `source`, `contact`, `comments`' +
                            re.analysis.dataset_method_clause +
                            ' order by default_display DESC' +
                            re.params.json_out
                    }),
                    fields : ['description','label','dataset_date','method','source','contact','comments'],
                    listeners : {
                        load :  loadListener
                    }
                })
            },
            bbar:[{
                text:'Load',
                handler: manualLoadSelectedDataset
            },
                {text:'Cancel',
                    handler: hideDatasetWindow
                }
            ]
        });
    re.windows.dataset_window.hide();

    var medlineStore= new Ext.data.JsonStore({
        root: 'response.docs',
        totalProperty:'response.numFound',
        idProperty:'pmid',
        remoteSort: true,
        storeId:'dataDocument_grid_store',
        fields : ['pmid','article_title','abstract_text','pub_date_month','pub_date_year'],
        proxy: new Ext.data.HttpProxy({
            url: re.databases.solr.uri + re.databases.solr.select + '?'
        })
    });

    // var targetPathwayStore= new Ext.data.JsonStore({
    //     idProperty:'pathway',
    //     remoteSort: false,
    //     storeId:'target_pathways_grid_store',
    //     fields : ['pathway_name','pathway_type','pvalue'],
    //     proxy: new Ext.data.HttpProxy({
    //         url: '/addama/datasources/?'
    //     })
    // });
    // var predictorPathwayStore= new Ext.data.JsonStore({
    //     idProperty:'pathway',
    //     remoteSort: false,
    //     storeId:'predictor_pathways_grid_store',
    //     fields : ['pathway_name','pathway_type','pvalue'],
    //     proxy: new Ext.data.HttpProxy({
    //         url: '/addama/datasources/?'
    //     })
    // });

    // function openPathwayLink(grid,rowIndex,event) {
    //     var record = grid.getStore().getAt(rowIndex);
    //     var type = record.json.pathway_type; var title = record.json.pathway_name;
    //     switch (type) {
    //         case('WIKIPW'):
    //             window.open(re.pathways.wikipw_url + title,'_blank');
    //             break;
    //         case('BIOCARTA'):
    //             var position = title.indexOf('_',1);
    //             var title_url = title.slice(1,position)+'Pathway.asp';
    //             window.open(re.pathways.biocarta_url+title_url,'_blank');
    //             break;
    //         case('KEGG'):
    //             window.open(re.pathways.kegg_url+title.replace(new RegExp('[_]', 'g'),' '),'_blank');
    //             break;
    //         case(''):
    //             window.open(re.pathways.pw_commons_url + title.replace(new RegExp('[_]', 'g'),'+'),'_blank');
    //             break;
    //     }
    //     return;
    // }

    re.windows.details_window =
        new Ext.Window({
            id          : 'details-window',
            renderTo    : 'view-region',
            modal       : false,
            closeAction : 'hide',
            layout      : 'fit',
            width       : 600,
            height      : 500,
            title       : "Details",
            closable    : true,
            layoutConfig : {
                animate : true
            },
            maximizable : false,
            items:[{
                xtype:'tabpanel',
                id: 'details-tabpanel',
                name: 'details-tabpanel',
                activeTab : 'scatterplot_parent',
                layoutOnCardChange: true,
                items : [{
                    xtype:'panel',
                    id:'scatterplot_parent',
                    name:'scatterplot_parent',
                    title:'Data Plot',
                    layout : 'anchor',
                    margins: '3 0 3 3',
                    height : 500,
                    width : 600,
                    frame:true,
                    items: [{
                        xtype:'panel',
                        id:'scatterplot_panel',
                        name:'scatterplot_panel',
                        anchor: '100% -100'
                        },
                        {
                            xtype:'panel',
                            id:'scatterplot_controls',
                            name:'scatterplot_controls',
                            layout: 'form',
                            items:[{
                                xtype:'radiogroup',
                                id:'scatterplot_regression_radiogroup',
                                fieldLabel:'Regression',
                                items:[{
                                    checked:true,
                                    boxLabel:'None',
                                    inputValue : 'none',
                                    name :'sp_rb'
                                },
                                    {
                                        boxLabel:'Linear' ,
                                        inputValue : 'linear',
                                        name :'sp_rb'
                                    }],
                                listeners: {
                                    change : function(checked_radio) {
                                        renderScatterPlot();
                                    }
                                }
                            },{ xtype:'compositefield',
                                defaultMargins:'0 20 0 0',
                                items:[
                                    {
                                        xtype:'checkbox',
                                        id:'scatterplot_axes_checkbox',
                                        boxLabel:'Reverse Axes',
                                        listeners:{
                                            check : function(checked) {
                                                renderScatterPlot();
                                            }
                                        }
                                    },
                                    {
                                        xtype:'checkbox',
                                        id:'scatterplot_discrete_x_checkbox',
                                        boxLabel:'Discretize Target',
                                        listeners:{
                                            check : function(checked) {
                                                renderScatterPlot();
                                            }
                                        }
                                    },
                                    {
                                        xtype:'checkbox',
                                        id:'scatterplot_discrete_y_checkbox',
                                        boxLabel:'Discretize Predictor',
                                        listeners:{
                                            check : function(checked) {
                                                renderScatterPlot();
                                            }
                                        }
                                    }]
                            }]
                        }]
                },
                    {
                        xtype:'panel',
                        id:'medline_parent',
                        name:'medline_parent',
                        title:'MEDLINE',
                        layout: 'anchor',
                        margins:'3 0 3 3',
                        height : 500,
                        width: 600,
                        frame : true,
                        items:[  {
                            id:'dataDocument-panel',
                            name : 'dataDocument-panel',
                            layout : 'anchor',
                            anchor: '100% 100%',
                            collapsible : false,
                            items : [
                                {
                                    xtype:'grid',
                                    id : 'dataDocument_grid',
                                    name : 'dataDocument_grid',
                                    autoScroll:true,
                                    autoWidth : true,
//                                    height: 425,
                                    loadMask: true,
                                    anchor: '100% 100%',
                                    store: medlineStore,
                                    viewConfig: {
                                        forceFit : true,
                                        enableRowBody:true,
                                        showPreview:true,
                                        getRowClass: function(record, rowIndex, p, store) {
                                            var jsonData = store.reader.jsonData;
                                            if (jsonData.highlighting[record.id] != undefined && jsonData.highlighting[record.id].abstract_text != undefined) {
                                                p.body = '<p>' + jsonData.highlighting[record.id].abstract_text[0] + '</p>';
                                            }
                                            else
                                                p.body = '<p>' + record.data.abstract_text + '</p>';
                                            return 'x-grid3-row-expanded';
                                        }
                                    },
                                    cm : new Ext.grid.ColumnModel({
                                        columns: [
                                            {header : "PMID", width:50,  id:'pmid', dataIndex:'pmid', groupName: 'Documents',renderer:renderPMID},
                                            { header: "Title", width: 300,  id:'article_title', dataIndex:'article_title',groupName:'Documents', renderer: renderTitle},
                                            { header: "Month", width:75 , id:'pub_date_month', dataIndex:'pub_date_month',groupName:'Documents'},
                                            { header: "Year", width:75, id:'pub_date_year',dataIndex:'pub_date_year',groupName:'Documents'}
                                        ],
                                        defaults: {
                                            sortable: true
                                        }
                                    }),
                                    bbar: new Ext.PagingToolbar({
                                        pageSize: 20,
                                        store: medlineStore,
                                        displayInfo: true,
                                        displayMsg: 'Displaying documents {0} - {1} of {2}',
                                        emptyMsg: "No documents",
                                        items:[
                                            '-',{
                                                pressed:true,
                                                enableToggle:true,
                                                text: 'Show Preview',
                                                cls: 'x-btn-text-icon details',
                                                toggleHandler: function(btn,pressed){
                                                    var view = Ext.getCmp('dataDocument_grid').getView();
                                                    view.showPreview = pressed;
                                                    view.refresh();
                                                }
                                            }]
                                    })
                                }]
                        }]
                    // },{  xtype:'panel',
                    //     id:'pathways_parent',
                    //     name:'pathways_parent',
                    //     title:'Pathways',
                    //     layout: 'anchor',
                    //     margins:'3 0 3 3',
                    //     height : 500,
                    //     width: 600,
                    //     frame : true,
                    //     items:[  {  id:'target_pathways-panel',
                    //         name : 'target_pathways-panel',
                    //         layout : 'fit',
                    //         anchor : '100% 50%',
                    //         collapsible : false,
                    //         items : [{xtype:'grid',
                    //             id:'target_pathways_grid',
                    //             autoScroll:true,
                    //             anchor : '100% 100%',
                    //             loadMask: true,
                    //             title :'Target',
                    //             store: targetPathwayStore,
                    //             viewConfig: {
                    //                 forceFit : true
                    //             },
                    //             cm : new Ext.grid.ColumnModel({
                    //                 columns: [
                    //                     {header : "Pathway", width:350,  id:'pathway', dataIndex:'pathway_name'},
                    //                     { header: "Type", width:75 , id:'pathway_type', dataIndex:'pathway_type'},
                    //                     { header: "p-value", width:75, id:'pvalue',dataIndex:'pvalue'}
                    //                 ],
                    //                 defaults: {
                    //                     sortable: true
                    //                 }
                    //             }),
                    //             listeners : {
                    //                 rowclick: openPathwayLink
                    //             }
                    //         }]
                    //     },{  id:'predictor_pathways-panel',
                    //         name : 'predictor_pathways-panel',
                    //         layout : 'fit',
                    //         anchor : '100% 50%',
                    //         collapsible : false,
                    //         items : [{xtype:'grid',
                    //             id:'predictor_pathways_grid',
                    //             autoScroll:true,
                    //             anchor : '100% 100%',
                    //             loadMask: true,
                    //             store: predictorPathwayStore,
                    //             title: 'Predictor',
                    //             viewConfig: {
                    //                 forceFit : true
                    //             },
                    //             cm : new Ext.grid.ColumnModel({
                    //                 columns: [
                    //                     {header : "Pathway", width:350,  id:'pathway', dataIndex:'pathway_name'},
                    //                     { header: "Type", width:75 , id:'pathway_type', dataIndex:'pathway_type'},
                    //                     { header: "p-value", width:75, id:'pvalue',dataIndex:'pvalue'}
                    //                 ],
                    //                 defaults: {
                    //                     sortable: true
                    //                 }
                    //             }),
                    //             listeners : {
                    //                 rowclick: openPathwayLink
                    //             }
                            // }]
                        // }]
                    }] // medline tab
                }] //tabpanel
        });
    re.windows.details_window.hide();

});
