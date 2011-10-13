

function registerLayoutListeners() {
    var d = vq.events.Dispatcher;
    d.addListener('data_ready','dataset_labels',function(obj){
        loadListStores(obj);
        resetFormPanel();
        requestFilteredData();
    });
    d.addListener( 'load_fail','associations',function(obj){
        network_mask.hide();
    });
    d.addListener( 'query_fail','associations',function(obj){
        network_mask.hide();
    });
    d.addListener('click_association',function(link){
        openDetailsWindow(link);
    });
    d.addListener('data_ready','features',function(obj) {
        renderScatterPlot(obj);
        details_window_mask.hide();
    });
    d.addListener('data_ready','annotations',function(obj){
        //Ext.getCmp('dataset_grid').getSelectionModel().selectFirstRow();
        var index = Ext.getCmp('dataset_grid').getStore().find('label','gbm_1006_mask');
        var record = Ext.getCmp('dataset_grid').getStore().getAt(index);
        Ext.getCmp('dataset_grid').getSelectionModel().selectRecords([record]);
        loadSelectedDataset();
    });
    d.addListener('render_complete','circvis',function(circvis_plot){
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
}

/*
 Window manipulation
 */

function hideDatasetWindow() {
    dataset_window.hide();
}

/*
 hide mask after scatterplot dispatches a 'completion' event?
 */

function openDetailsWindow(association) {
    details_window.show();
    details_window_mask =  new Ext.LoadMask('details-window', {msg:"Loading Data..."});
    details_window_mask.show();
    renderMedlineDocuments(association);
    renderPathways(association);
}

function showSVGDialog() {
    export_window.show();
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
    dataset_window.show();
    Ext.getCmp('dataset_grid').store.load();
}

function exportDataDialog() {
    downloadNetworkData(document.getElementById('frame'),this.value);
}

function openHelpWindow(subject,text) {
    if (helpWindowReference == null || helpWindowReference.closed) {
        helpWindowReference = window.open('','help-popup','width=400,height=300,resizable=1,scrollbars=1,status=0,'+
            'titlebar=0,toolbar=0,location=0,directories=0,menubar=0,copyhistory=0');
    }
    helpWindowReference.document.title='Help - ' + subject;
    helpWindowReference.document.body.innerHTML = '<b>' + subject +'</b><p><div style=width:350>' + text + '</div>';
    helpWindowReference.focus();
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
    var type_1 = Ext.getCmp('f1_type_combo').getValue();
    var label_1;
    switch(type_1) {
        case('CLIN'):
            label_1 = Ext.getCmp('f1_clin_label').getValue();
            break;
        default :
            label_1 = Ext.getCmp('f1_label_field').getValue();
    }
    var type_2 = Ext.getCmp('f2_type_combo').getValue();
    var label_2;
    switch(type_2) {
        case('CLIN'):
            label_2 = Ext.getCmp('f2_clin_label').getValue();
            break;
        default :
            label_2 = Ext.getCmp('f2_label_field').getValue();
    }
    return packFilterSelections(
        type_1,
        label_1,
        Ext.getCmp('f1_chr_combo').getValue(),
        Ext.getCmp('f1_chr_start').getValue(),
        Ext.getCmp('f1_chr_stop').getValue(),

        type_2,
        label_2,
        Ext.getCmp('f2_chr_combo').getValue(),
        Ext.getCmp('f2_chr_start').getValue(),
        Ext.getCmp('f2_chr_stop').getValue(),

        Ext.getCmp('min_importance').getValue(),
        Ext.getCmp('min_correlation').getValue(),

        Ext.getCmp('order_combo').getValue(),
        Ext.getCmp('limit_combo').getValue(),

        Ext.getCmp('correlation_fn').getValue(),
        Ext.getCmp('max_pvalue').getValue(),
        Ext.getCmp('filter_type').getValue()
    );
}

function packFilterSelections() {
    return {f1_type:arguments[0],f1_label:arguments[1], f1_chr:arguments[2],
        f1_start:arguments[3],f1_stop:arguments[4],
        f2_type:arguments[5],f2_label:arguments[6], f2_chr:arguments[7],
        f2_start:arguments[8],f2_stop:arguments[9],
        importance:arguments[10],correlation:arguments[11],order:arguments[12],
        limit:arguments[13],correlation_fn:arguments[14],pvalue:arguments[15], filter_type:arguments[16]};

}


function resetFormPanel() {
    Ext.getCmp('f1_type_combo').reset(),
        Ext.getCmp('f1_label_field').reset(),
        Ext.getCmp('f1_chr_combo').reset(),
        Ext.getCmp('f1_clin_label').reset(),
        Ext.getCmp('f1_chr_start').reset(),
        Ext.getCmp('f1_chr_stop').reset(),
        Ext.getCmp('f2_type_combo').reset(),
        Ext.getCmp('f2_label_field').reset(),
        Ext.getCmp('f2_chr_combo').reset(),
        Ext.getCmp('f2_clin_label').reset(),
        Ext.getCmp('f2_chr_start').reset(),
        Ext.getCmp('f2_chr_stop').reset(),
        Ext.getCmp('min_importance').reset(),
        Ext.getCmp('max_pvalue').reset(),
        Ext.getCmp('min_correlation').reset(),
        Ext.getCmp('order_combo').reset(),
        Ext.getCmp('limit_combo').reset()
    Ext.getCmp('filter_type').reset()
}

/*
 should be called by an event listener
 */

function loadListStores(dataset_labels) {
    var label_list = dataset_labels['feature_sources'].map(function(row) {
        return {value:row.source, label: label_map[row.source] || row.source};
    });
    label_list.unshift({value:'*',label:'All'});
    Ext.StoreMgr.get('f1_type_combo_store').loadData(label_list);
    Ext.getCmp('f1_type_combo').setValue('GEXP');
    Ext.StoreMgr.get('f2_type_combo_store').loadData(label_list);
    Ext.getCmp('f2_type_combo').setValue('*');
    var clin_list = dataset_labels['clin_labels'].map(function(row) {
        return {value:row.label, label: row.label};
    });
    clin_list.unshift({value:'*',label:'All'});
    Ext.StoreMgr.get('f1_clin_list_store').loadData(clin_list);
    Ext.getCmp('f1_clin_label').setValue('*');
    Ext.StoreMgr.get('f2_clin_list_store').loadData(clin_list);
    Ext.getCmp('f2_clin_label').setValue('*');
}

function loadDataTableStore(data) {
    var mapped_data = pv.blend([data['network'],data['unlocated']]).map(function(row) {
        return {target_id: row.node1.id, target_source: row.node1.source,target_label: row.node1.label,target_chr: row.node1.chr,
            target_start: row.node1.start,target_stop:row.node1.stop,
            source_id: row.node2.id, source_source :row.node2.source,source_label: row.node2.label,source_chr: row.node2.chr,
            source_start: row.node2.start,source_stop: row.node2.stop,
            importance : row.importance, correlation:row.correlation, pvalue : row.pvalue };
    });
    Ext.StoreMgr.get('data_grid_store').loadData(mapped_data);
}

/*
 loadSelectedDataset
 should dispatch an event after validating dataset selection
 */

function loadSelectedDataset() {
    var selected_record = Ext.getCmp('dataset_grid').getSelectionModel().getSelected();
    if (selected_record != null) {
        var selected_dataset = selected_record.json.label;
        vq.events.Dispatcher.dispatch(new vq.events.Event('dataset_selected','dataset_grid',selected_dataset));
        hideDatasetWindow();
        Ext.getCmp('filters').setTitle( 'Filtering ' + selected_dataset);
//        loadDataset(selected_json);
    } else {
        Ext.MessageBox.alert('Dataset not selected','Select a dataset to load.');
    }
}

function completeLabelLookup(lookup_obj) {
    var feature = lookup_obj.feature || {};
    if (feature === {} ) { return;}
    var ui = lookup_obj.ui || 'f1';
    var label = lookup_obj.label || '';
    var chr_ui = Ext.getCmp(ui+'_chr_combo');
    var start_ui = Ext.getCmp(ui+'_chr_start');
    var end_ui = Ext.getCmp(ui+'_chr_stop');
    var chr = feature.chr.slice(3);
    var start = Math.max (feature.start - 5000, 0);
    var stop = feature.end + 5000;
    chr_ui.setValue(chr);
    start_ui.setValue(start);
    end_ui.setValue(stop);
    var label_ui = Ext.getCmp(ui+'_label_field');
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
                store.proxy.setUrl('/solr/select/?q=%2Btext%3A\"' + term1 + '\" %2Btext%3A\"' + term2 + '\"&fq=%2Bpub_date_year%3A%5B1991 TO 2011%5D&wt=json' +
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
function renderPathways(association) {
    var target_id = association.sourceNode.id;
    var predictor_id = association.targetNode.id;
    retrievePathways(target_id,predictor_id);
    Ext.StoreMgr.get('target_pathways_grid_store').load();
    Ext.StoreMgr.get('predictor_pathways_grid_store').load();
    Ext.getCmp('target_pathways_grid').setTitle('Target: ' + association.sourceNode.label);
    Ext.getCmp('predictor_pathways_grid').setTitle('Predictor: ' + association.targetNode.label);
}

function retrievePathways(target_id,predictor_id){
    var pathway_query = 'select pathway_name, pathway_type, pvalue';
    Ext.StoreMgr.get('target_pathways_grid_store').on({
        beforeload:{
            fn: function(store,options){
                store.proxy.setUrl(base_query_url + tcga_base_query_uri + pathway_uri + '?tq=' + pathway_query +
                    ' where featureid = ' + target_id+'&tqx=out:json_array');
            }
        }
    });
    Ext.StoreMgr.get('predictor_pathways_grid_store').on({
        beforeload:{
            fn: function(store,options){
                store.proxy.setUrl(base_query_url + tcga_base_query_uri + pathway_uri + '?tq=' + pathway_query +
                    ' where featureid = ' + predictor_id+'&tqx=out:json_array');
            }
        }
    });
}

/*clean divs*/

function prepareVisPanels() {
    network_mask = new Ext.LoadMask('view-region', {msg:"Loading Data..."});
    network_mask.show();
    wipeLinearPlot();
}

function wipeLinearPlot(){
    Ext.getCmp('linear-parent').setTitle('Chromosome-level View');
    document.getElementById('linear-panel').innerHTML='';
    Ext.getCmp('linear-parent').collapse(true);
}

function exposeCirclePlot(){
    Ext.getCmp('circle-parent').expand(true);
    network_mask.hide();
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
                                    {header : "Id", width:40,  hidden: true, id:'source_id', dataIndex:'source_id'},
                                    { header: "Type", width: 40,  id:'source_source', dataIndex:'source_source',groupName:'Source'},
                                    { header: "Label", width: 120, id: 'source_label',dataIndex:'source_label',groupName:'Source'},
                                    { header: "Chr", width:30 , id:'source_chr', dataIndex:'source_chr',groupName:'Source'},
                                    { header: "Start", width:100, id:'source_start',dataIndex:'source_start',groupName:'Source'},
                                    { header: "Stop", width:100, id:'source_stop',dataIndex:'source_stop',groupName:'Source'},
                                    { header: "Importance", width:50, id:'importance',dataIndex:'importance'},
                                    { header: "Correlation", width:50, id:'correlation',dataIndex:'correlation'}
                                ],
                                defaults: {
                                    sortable: true,
                                    width: 100
                                }
                            }),
                            store : new Ext.data.JsonStore({
                                autoLoad:false,
                                storeId:'data_grid_store',
                                fields : ['target_id','target_source','target_label','target_chr','target_start','target_stop',
                                    'source_id', 'source_source','source_label','source_chr','source_start','source_stop','importance','correlation']
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
                                                requestFilteredData();
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
                                        title:'Target',
                                        collapsible: true,
                                        defaults:{anchor:'100%'},
                                        labelWidth: 70,
                                        labelSeparator : '',forceSelection : true,
                                        defaultType:'textfield',
                                        autoHeight:true,
                                        items:[
                                            {
                                                xtype:'combo',
                                                name:'f1_type_combo',
                                                id:'f1_type_combo',
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
                                                value : 'GEXP',
                                                listeners : {
                                                    select : function(field,record, index) {
                                                        switch(record.id)  {
                                                            case('CLIN'):
                                                                Ext.getCmp('f1_label_comp').setVisible(false);
                                                                Ext.getCmp('f1_clin_label').setVisible(true);
                                                                break;
                                                            default:
                                                                Ext.getCmp('f1_label_comp').setVisible(true);
                                                                Ext.getCmp('f1_clin_label').setVisible(false);
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
                                                        name:'f1_label_field',
                                                        id:'f1_label_field',
                                                        emptyText : 'Input Label...',
                                                        tabIndex: 1,
                                                        width:80,
                                                        selectOnFocus:true,
                                                        fieldLabel:'Label'
                                                    },
                                                    {
                                                        xtype:'button',
                                                        text:'Lookup',
                                                        width:50,
                                                        handler:function(evt) {
                                                            var label = Ext.getCmp('f1_label_field').getValue();
                                                            if (label.length > 0) {
                                                                vq.events.Dispatcher.dispatch(new vq.events.Event('data_request','label_position',{ui:'f1',label:label}));
                                                            }
                                                        }
                                                    }
                                                ]
                                            }, {
                                                name:'f1_clin_label',
                                                mode:'local',
                                                id:'f1_clin_label',
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
                                                value:'*'
                                            },
                                            {
                                                xtype:'combo', name:'f1_chr_combo',id:'f1_chr_combo',
                                                mode:'local',
                                                allowBlank : false,
                                                store: new Ext.data.JsonStore({
                                                    autoLoad : true,
                                                    fields : ['value','label'],
                                                    idProperty:'value',
                                                    data: chrom_list,
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
                                                value : '*'
                                            },{xtype : 'numberfield',
                                                id:'f1_chr_start',
                                                name :'f1_chr_start',
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
                                                value : ''
                                            },{xtype : 'numberfield',
                                                id:'f1_chr_stop',
                                                name :'f1_chr_stop',
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
                                                value : ''
                                            }
                                        ]},
                                    {  xtype:'fieldset',
                                        title:'Predictor',
                                        collapsible: true,
                                        defaults:{anchor:'100%'},
                                        labelWidth: 70,
                                        labelSeparator : '',
                                        defaultType:'textfield',
                                        autoHeight:true,
                                        items:[
                                            {
                                                xtype:'combo',
                                                name:'f2_type_combo',
                                                id:'f2_type_combo',
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
                                                value : '*',
                                                listeners : {
                                                    select : function(field,record, index) {
                                                        switch(record.id)  {
                                                            case('CLIN'):
                                                                var label_cmp = Ext.getCmp('f2_label_field'),
                                                                    clin_cmp = Ext.getCmp('f2_clin_label');
                                                                label_cmp.setVisible(false);
                                                                clin_cmp.setVisible(true);
                                                                break;
                                                            default:
                                                                var label_cmp = Ext.getCmp('f2_label_field'),
                                                                    clin_cmp = Ext.getCmp('f2_clin_label');
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
                                                        name:'f2_label_field',
                                                        id:'f2_label_field',
                                                        emptyText : 'Input Label...',
                                                        tabIndex: 1,
                                                        width:80,
                                                        selectOnFocus:true,
                                                        fieldLabel:'Label'
                                                    },
                                                    {
                                                        xtype:'button',
                                                        text:'Lookup',
                                                        width:50,
                                                        handler:function(evt) {
                                                            var label = Ext.getCmp('f2_label_field').getValue();
                                                            if (label.length > 0) {
                                                                vq.events.Dispatcher.dispatch(new vq.events.Event('data_request','label_position',{ui:'f2',label:label}));
                                                            }
                                                        }
                                                    }
                                                ]
                                            },  {

                                                mode:'local',
                                                name:'f2_clin_label',
                                                id:'f2_clin_label',
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
                                                value:'*'
                                            },
                                            { xtype:'combo', name:'f2_chr_combo',id:'f2_chr_combo',
                                                mode:'local',
                                                allowBlank : true,
                                                store: new Ext.data.JsonStore({
                                                    autoLoad : true,
                                                    fields : ['value','label'],
                                                    idProperty:'value',
                                                    data: chrom_list,
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
                                                value : '*'
                                            },{xtype : 'numberfield',
                                                id:'f2_chr_start',
                                                name :'f2_chr_start',
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
                                                value : ''
                                            },{xtype : 'numberfield',
                                                id:'f2_chr_stop',
                                                name :'f2_chr_stop',
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
                                        items:[
                                            {xtype : 'numberfield',
                                                id:'min_importance',
                                                name :'min_importance',
                                                allowNegative: false,
                                                decimalPrecision : 2,
                                                emptyText : 'Input value...',
                                                invalidText:'This value is not valid.',
                                                minValue:0,
                                                tabIndex : 1,
                                                validateOnBlur : true,
                                                fieldLabel : 'Importance >=',
                                                value : 0
                                            },
                                            {xtype : 'numberfield',
                                                id:'max_pvalue',
                                                name :'max_pvalue',
                                                allowNegative: false,
                                                decimalPrecision : 8,
                                                emptyText : 'Input value...',
                                                invalidText:'This value is not valid.',
                                                maxValue:-0.1,
                                                minValue:-1100,
                                                tabIndex : 1,
                                                validateOnBlur : true,
                                                fieldLabel : 'log10(p) <=',
                                                value : -10
                                            },
                                            {
                                                xtype : 'compositefield',
                                                anchor: '-20',
                                                msgTarget: 'side',
                                                fieldLabel: 'Correlation',
                                                items : [
                                                    {
                                                        //the width of this field in the HBox layout is set directly
                                                        //the other 2 items are given flex: 1, so will share the rest of the space
                                                        width:          50,
                                                        id:'correlation_fn',
                                                        name :'correlation_fn',
                                                        xtype:          'combo',
                                                        mode:           'local',
                                                        value:          'Abs',
                                                        triggerAction:  'all',
                                                        forceSelection: true,
                                                        editable:       false,
                                                        fieldLabel:     'Fn',
                                                        displayField:   'name',
                                                        valueField:     'value',
                                                        store:          new Ext.data.JsonStore({
                                                            fields : ['name', 'value'],
                                                            data   : [
                                                                {name : '>=',   value: '>='},
                                                                {name : '<=',  value: '<='},
                                                                {name : 'Abs', value: 'Abs'},
                                                                {name : 'Btw', value: 'Btw'}
                                                            ]
                                                        }),
                                                        listeners: {
                                                            render: function(c) {
                                                                Ext.QuickTips.register({
                                                                    target: c,
                                                                    title: '',
                                                                    text: 'Implies if corr value (x)=.5, Abs is a filtering of (x >= .5 OR x <= -.5) <br>Btw is a filtering of (x >= -.5 AND x <= .5)'
                                                                });
                                                            }
                                                        }
                                                    },
                                                    {xtype : 'numberfield',
                                                        id:'min_correlation',
                                                        name :'min_correlation',
                                                        allowNegative: true,
                                                        decimalPrecision : 2,
                                                        emptyText : 'Input value...',
                                                        invalidText:'This value is not valid.',
                                                        minValue:-1.0,
                                                        maxValue:1.0,
                                                        width: 40,
                                                        tabIndex : 1,
                                                        validateOnBlur : true,
                                                        fieldLabel : 'Range(Corr)',
                                                        value : 0,
                                                        listeners: {
                                                            render: function(c) {
                                                                Ext.QuickTips.register({
                                                                    target: c,
                                                                    title: '',
                                                                    text: 'Numeric field with 2 decimal precision'
                                                                });
                                                            }
                                                        }
                                                    }
                                                ]},
                                            { xtype:'combo', name:'order_combo',id:'order_combo',
                                                mode:'local',
                                                allowBlank : true,
                                                store: new Ext.data.JsonStore({
                                                    autoLoad : true,
                                                    fields : ['value','label'],
                                                    idProperty:'value',
                                                    data: order_list,
                                                    storeId:'order_combo_store'
                                                }),
                                                fieldLabel:'Order By',
                                                valueField:'value',
                                                displayField:'label',
                                                tabIndex : 2,
                                                typeAhead : true,
                                                selectOnFocus:true,
                                                triggerAction : 'all',
                                                value : 'importance'
                                            },
                                            { xtype:'combo', name:'limit_combo',id:'limit_combo',
                                                mode:'local',
                                                allowBlank : true,
                                                store: new Ext.data.JsonStore({
                                                    autoLoad : true,
                                                    fields : ['value','label'],
                                                    idProperty:'value',
                                                    data: limit_list,
                                                    storeId:'limit_combo_store'
                                                }),
                                                fieldLabel:'Max Results',
                                                valueField:'value',
                                                displayField:'label',
                                                tabIndex : 2,
                                                typeAhead : true,
                                                selectOnFocus:true,
                                                triggerAction : 'all',
                                                value : 200
                                            }
                                        ]
                                    },
                                    {xtype:'combo',
                                        fieldLabel:'Filter By',
                                        displayField: 'label',
                                        valueField:'value',
                                        id:'filter_type',
                                        mode: 'local',
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
                                                {  label:'Target',  value:'target' },
                                                {  label:'Predictor',  value:'predictor' }
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
                title: 'Regulome Explorer',
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
//                            text:'Color By:',
//                            menu:[{
//                                xtype:'menucheckitem',
//                                 handler: colorHandler,
//                                checked:true,
//                                id:'feature_check',
//                                group:'color_group',
//                                text:'Feature Type'
//                                },
//                                {
//                                    xtype:'menucheckitem',
//                                    handler: colorHandler,
//                                    group:'color_group',
//                                    id:'inter_check',
//                                    text:'Interestingness'
////                                },
////                                {
////                                    text:'Association'
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

    function colorHandler(item){
        switch(item.getId()) {
            case('inter_check'):
                setStrokeStyleToInterestingness(); renderCircleData();
                break;
            case('feature_check'):
            default:
                setStrokeStyleAttribute('white'); renderCircleData();
        }
    }

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
                gbm.display_options.cytoscape.layout = 'radial';
                break;
            case('Tree'):
                gbm.display_options.cytoscape.layout = 'tree';
                break;
            case('Force Directed') :
            default:
                gbm.display_options.cytoscape.layout = 'force_directed';
                break;
        }
        vq.events.Dispatcher.dispatch(new vq.events.Event('layout_network','main_menu',{}));
    }

    export_window = new Ext.Window( {
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
    export_window.hide();

    var loadListener = function(store,records) {
        store.removeListener('load',loadListener) ;
        var e = new vq.events.Event('data_request','annotations',{});
        e.dispatch();
    };

    dataset_window =
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
                        {header : "Label", width:120, id:'label', dataIndex:'label'},
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
                        url: '/google-dsapi-svc/addama/datasources/tcga/regulome_explorer_dataset/query?' +
                            'tq=select `label`, `method`, `source`, `contact`, `comments`' +
                            ' order by default_display DESC&tqx=out:json_array'
                    }),
                    fields : ['label','method','source','contact','comments'],
                    listeners : {
                        load :  loadListener
                    }
                })
            },
            bbar:[{
                text:'Load',
                handler: loadSelectedDataset
            },
                {text:'Cancel',
                    handler: hideDatasetWindow
                }
            ]
        });
    dataset_window.hide();

    var medlineStore= new Ext.data.JsonStore({
        root: 'response.docs',
        totalProperty:'response.numFound',
        idProperty:'pmid',
        remoteSort: true,
        storeId:'dataDocument_grid_store',
        fields : ['pmid','article_title','abstract_text','pub_date_month','pub_date_year'],
        proxy: new Ext.data.HttpProxy({
            url: '/solr/select/?'
        })
    });

    var targetPathwayStore= new Ext.data.JsonStore({
        idProperty:'pathway',
        remoteSort: false,
        storeId:'target_pathways_grid_store',
        fields : ['pathway_name','pathway_type','pvalue'],
        proxy: new Ext.data.HttpProxy({
            url: '/addama/datasources/?'
        })
    });
    var predictorPathwayStore= new Ext.data.JsonStore({
        idProperty:'pathway',
        remoteSort: false,
        storeId:'predictor_pathways_grid_store',
        fields : ['pathway_name','pathway_type','pvalue'],
        proxy: new Ext.data.HttpProxy({
            url: '/addama/datasources/?'
        })
    });

    function openPathwayLink(grid,rowIndex,event) {
        var record = grid.getStore().getAt(rowIndex);
        var type = record.json.pathway_type; var title = record.json.pathway_name;
        switch (type) {
            case('WIKIPW'):
                window.open(wikipw_url + title,'_blank');
                break;
            case('BIOCARTA'):
                var position = title.indexOf('_',1);
                title_url = title.slice(1,position)+'Pathway.asp';
                window.open(biocarta_url+title_url,'_blank');
                break;
            case('KEGG'):
                window.open(kegg_url+title.replace(new RegExp('[_]', 'g'),' '),'_blank');
                break;
            case(''):
                window.open(pw_commons_url + title.replace(new RegExp('[_]', 'g'),'+'),'_blank');
                break;
        }
        return;
    }

    details_window =
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
                    },{  xtype:'panel',
                        id:'pathways_parent',
                        name:'pathways_parent',
                        title:'Pathways',
                        layout: 'anchor',
                        margins:'3 0 3 3',
                        height : 500,
                        width: 600,
                        frame : true,
                        items:[  {  id:'target_pathways-panel',
                            name : 'target_pathways-panel',
                            layout : 'fit',
                            anchor : '100% 50%',
                            collapsible : false,
                            items : [{xtype:'grid',
                                id:'target_pathways_grid',
                                autoScroll:true,
                                anchor : '100% 100%',
                                loadMask: true,
                                title :'Target',
                                store: targetPathwayStore,
                                viewConfig: {
                                    forceFit : true
                                },
                                cm : new Ext.grid.ColumnModel({
                                    columns: [
                                        {header : "Pathway", width:350,  id:'pathway', dataIndex:'pathway_name'},
                                        { header: "Type", width:75 , id:'pathway_type', dataIndex:'pathway_type'},
                                        { header: "p-value", width:75, id:'pvalue',dataIndex:'pvalue'}
                                    ],
                                    defaults: {
                                        sortable: true
                                    }
                                }),
                                listeners : {
                                    rowclick: openPathwayLink
                                }
                            }]
                        },{  id:'predictor_pathways-panel',
                            name : 'predictor_pathways-panel',
                            layout : 'fit',
                            anchor : '100% 50%',
                            collapsible : false,
                            items : [{xtype:'grid',
                                id:'predictor_pathways_grid',
                                autoScroll:true,
                                anchor : '100% 100%',
                                loadMask: true,
                                store: predictorPathwayStore,
                                title: 'Predictor',
                                viewConfig: {
                                    forceFit : true
                                },
                                cm : new Ext.grid.ColumnModel({
                                    columns: [
                                        {header : "Pathway", width:350,  id:'pathway', dataIndex:'pathway_name'},
                                        { header: "Type", width:75 , id:'pathway_type', dataIndex:'pathway_type'},
                                        { header: "p-value", width:75, id:'pvalue',dataIndex:'pvalue'}
                                    ],
                                    defaults: {
                                        sortable: true
                                    }
                                }),
                                listeners : {
                                    rowclick: openPathwayLink
                                }
                            }]
                        }]
                    }]}]
        });
    details_window.hide();

});
