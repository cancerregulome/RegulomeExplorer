if (re === undefined) {
    re = {};
}
vq.utils.VisUtils.extend(re, {
    ui: {}
});
re.ui.panels = {
    east: {
        region: 'east',
        collapsible: true,
        floatable: true,
        autoHide:false,
        autoScroll: true,
        split: true,
        width: 290,
        id: 'filter_parent',
        title: 'Filtering',
        layout: {
            type: 'accordion'
        },
        tools: [{
            id: 'help',
            handler: function(event, toolEl, panel){
                openHelpWindow('Tools',toolsHelpString);
            }
        }],
        items: [{
            xtype: 'panel',
            id:'associations_filter',
            title: 'Filter Associations',
            autoScroll: true,
            height: 500,
            tools: [{
                id: 'help',
                handler: function(event, toolEl, panel){
                    openHelpWindow('Filtering',filteringHelpString);
                }
            }],
            items: [{
                xtype:'form',
                id: 'association_filter_panel',
                name: 'association_filter_panel',
                bodyStyle:'padding:5px 5px 5px 5px',
                defaults:{
                    anchor:'100%'
                },
                border: false,
                labelAlign: 'right',
                labelWidth: 70,
                labelSeparator: '',
                defaultType:'textfield',
                monitorValid: true,
                keys: [{
                    key: [Ext.EventObject.ENTER],
                    fn: function(key,e) {
                        var cmp = Ext.getCmp(e.browserEvent.target.id);
                        if (cmp.assertValue) cmp.assertValue();
                        else cmp.setValue(cmp.getRawValue());
                        Ext.ComponentMgr.get('re_filter_button').fireEvent('click');
                    }
                }],
                buttons: [{
                    text: 'Filter',
                    id:'re_filter_button',
                    disabled: false,
                    listeners: {
                        click: function(button, e) {
                            manualFilterRequest();
                        }
                    }
                }, {
                    text: 'Reset',
                    listeners : {
                        click : function(button,e) {
                            resetFormPanel();
                        }
                    }
                }],
                items: [{
                    xtype:'fieldset',
                    id:re.ui.feature1.id,
                    title:re.ui.feature1.label,
                    collapsible: true,
                    defaults: {
                        anchor:'100%'
                    },
                    labelWidth: 70,
                    labelSeparator: '',
                    forceSelection: true,
                    defaultType:'textfield',
                    autoHeight:true,
                    items: [{
                        xtype:'checkbox',
                        id:'isolate',
                        fieldLabel:'Isolate',
                        defaultValue:false,
                        checked:false,
                        listeners: {
                            check: function(cb, checked) {
                                Ext.getCmp('t_chr').setDisabled(checked);
                                Ext.getCmp('t_start').setDisabled(checked);
                                Ext.getCmp('t_stop').setDisabled(checked);
                                Ext.getCmp('filter_type').setDisabled(checked);
                            }
                        }
                    }, {
                        xtype:'combo',
                        name:'t_type',
                        id:'t_type',
                        mode:'local',
                        allowBlank : true,
                        store: new Ext.data.JsonStore({
                            autoLoad : false,
                            fields : ['value','label'],
                            idProperty:'value',
                            data: [{
                                source: '*',
                                value: '*',
                                label:'All'
                            }],
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
                        value: 'GEXP',
                        listeners: {
                            select : function(field,record, index) {
                                if (re.ui.categorical_sources_map[record.id]) {
                                    var filter_regexp = new RegExp('\\*|' + record.id,'g');
                                    Ext.StoreMgr.get('f1_clin_list_store').clearFilter();
                                    Ext.StoreMgr.get('f1_clin_list_store').filter('source',filter_regexp);
                                    Ext.getCmp('t_clin').setValue('*');
                                    
                                    Ext.getCmp('t_label').setVisible(false);
                                    Ext.getCmp('t_clin').setVisible(true);
                                    Ext.getCmp('t_pathway').setVisible(false);
                                } else if (record.id === 'Pathway') {
                                    Ext.getCmp('t_label').setVisible(false);
                                    Ext.getCmp('t_clin').setVisible(false);
                                    Ext.getCmp('t_pathway').setVisible(true);
                                } else {
                                    Ext.getCmp('t_label').setVisible(true);
                                    Ext.getCmp('t_clin').setVisible(false);
                                    Ext.getCmp('t_pathway').setVisible(false);
                                }
                            }
                        }
                    }, {
                        name:'t_pathway',
                        mode:'local',
                        id:'t_pathway',
                        xtype:'combo',
                        allowBlank : false,
                        hidden:true,
                        store: new Ext.data.JsonStore({
                            autoLoad : false,
                            data: [],
                            fields : ['value','label', "url"],
                            idProperty:'value',
                            storeId:'f1_pathway_list_store'
                        }),
                        listWidth:300,
                        fieldLabel:'Pathway',
                        selectOnFocus:true,
                        forceSelection : true,
                        triggerAction : 'all',
                        defaultValue:'',
                        value:'',
                        valueField:'value',
                        displayField:'value',
                        emptyText:'Select Pathway...',
                        listeners : {
                            select : function(field,record,index) {
                                Ext.getCmp("filter_type").setValue(re.ui.feature1.id);
                                record.json.label = record.json.label.replace('\\r', '');
                                Ext.getCmp('t_label').setValue(record.json.label);
                                Ext.getCmp('limit').setValue('25');
                                                            re.ui.setCurrentPathwayMembers(record.json.label);
                                                            var memberDataArray = [];
                                var memberTokens = (record.json.label).split(",").sort();
                                for (var tk = 0; tk<memberTokens.length; tk++){
                                    var mjson = {};
                                    var member = memberTokens[tk];
                                    if (member == null || member == "")
                                        continue;
                                    mjson["pmember"] = member;
                                    mjson["display_count"] = Math.floor(5*Math.random());
                                    mjson["hidden_count"] = Math.floor(10*Math.random());
                                    memberDataArray.push(mjson);
                                    loadFeaturesInAFM(member);
                                }
                                renderPathwayMembers('below-top-right');
                                var url = record.json.value;
                                if (record.json.url != null && record.json.url.length > 1)
                                    url = "<a href='" + record.json.url + "' target='_blank'>" + record.json.value  + "</a> ";
                                Ext.getCmp("pathway_member_panel").setTitle(url + " " + memberDataArray.length + " Genes");
                            }
                        }
                 },{
                            xtype:'textfield',
                            name:'t_label',
                            id:'t_label',
                            emptyText : 'Input Label...',
                            tabIndex: 1,
                            selectOnFocus:true,
                            fieldLabel:'Label',
                            defaultValue : '',
                            value : '',
                            listeners: {
                                change: function(t,o,n){
                                    if (n.indexOf(",") != -1)
                                        Ext.getCmp("filter_type").setValue(re.ui.feature1.id);
                                }
                            }
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
                            fields : ['value','label','source'],
                            idProperty:'value',
                            storeId:'f1_clin_list_store'
                        }),
                        listWidth:200,
                        fieldLabel:'Features',
                        selectOnFocus:true,
                        forceSelection : true,
                        triggerAction : 'all',
                        valueField:'value',
                        displayField:'label',
                        emptyText:'CLIN Feature...',
                        defaultValue:'*',
                        value:'*'
                    }, {
                        xtype:'combo',
                        name:'t_chr',
                        id:'t_chr',
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
                        //forceSelection : true,
                        triggerAction : 'all',
                        emptyText : 'Select Chr...',
                        defaultValue:'*',
                        value : '*'
                     }, {
                        xtype:'compositefield',
                        fieldLabel:'Position',
                        defaults:{labelWidth:0,width:80,anchor:'100%'},
                        items:[{ 
                            xtype : 'numberfield',
                            id:'t_start',
                            name :'t_start',
                            allowNegative: false,
                            decimalPrecision : 0,
                            emptyText : 'Start >=',
                            invalidText:'This value is not valid.',
                            maxValue: 250999999,
                            minValue:1,
                            tabIndex : 3,
                            validateOnBlur : true,
                            allowDecimals : false,
                            defaultValue : '',
                        },{
                            xtype : 'numberfield',
                            id:'t_stop',
                            name :'t_stop',
                            allowNegative: false,
                            decimalPrecision : 0,
                            emptyText : 'Stop <=',
                            invalidText:'This value is not valid.',
                            maxValue: 250999999,
                            minValue:1,
                        tabIndex : 4,
                        validateOnBlur : true,
                            allowDecimals : false,
                            defaultValue : '',
                            value : ''
                        }]
                    }]
                }, {
                    xtype:'fieldset',
                    id:re.ui.feature2.id,
                    title:re.ui.feature2.label,
                    checkboxToggle:false,
                    maskDisabled:true,
                    collapsed: false,
                    collapsible: true,
                    defaults: {
                        anchor:'100%'
                    },
                    labelWidth: 70,
                    labelSeparator : '',
                    defaultType:'textfield',
                    autoHeight:true,
                    listeners: {
                        disabled : function(){
                            var me = this;
                            Ext.getCmp('filter_type').setDisabled(me.disabled);
                        }
                    },
                    items: [{
                        xtype:'combo',
                        name:'p_type',
                        id:'p_type',
                        mode:'local',
                        allowBlank : true,
                        store: new Ext.data.JsonStore({
                            autoLoad : false,
                            fields : ['value','label','source'],
                            idProperty:'value',
                            data: [{
                                source: '*',
                                value: '*',
                                label:'All'
                            }],
                            storeId:'f2_type_combo_store'
                        }),
                        fieldLabel:'Type',
                        valueField:'value',
                        displayField:'label',
                        tabIndex : 5,
                        typeAhead : true,
                        selectOnFocus:true,
                        triggerAction : 'all',
                        forceSelection : true,
                        emptyText : 'Select a Type...',
                        defaultValue : '*',
                        value : '*',
                        listeners : {
                            select : function(field,record, index) {
                                if (re.ui.categorical_sources_map[record.id]) {
                                    var filter_regexp = new RegExp('\\*|' + record.id,'g');
                                    Ext.StoreMgr.get('f2_clin_list_store').clearFilter();
                                    Ext.StoreMgr.get('f2_clin_list_store').filter('source',filter_regexp);
                                    Ext.getCmp('p_clin').setValue('*');
                                    
                                    Ext.getCmp('p_label').setVisible(false);
                                    Ext.getCmp('p_clin').setVisible(true);
                                    Ext.getCmp('p_pathway').setVisible(false);
                                } else if (record.id === 'Pathway') {
                                    Ext.getCmp('p_label').setVisible(false);
                                    Ext.getCmp('p_clin').setVisible(false);
                                    Ext.getCmp('p_pathway').setVisible(true);
                                } else {
                                    Ext.getCmp('p_label').setVisible(true);
                                    Ext.getCmp('p_clin').setVisible(false);
                                    Ext.getCmp('p_pathway').setVisible(false);
                                }
                            }
                        }
                    },{
                        name:'p_pathway',
                        mode:'local',
                        id:'p_pathway',
                        xtype:'combo',
                        allowBlank : false,
                        hidden:true,
                        store: new Ext.data.JsonStore({
                            autoLoad : false,
                            data: [],
                            fields : ['value','label', "url"],
                            idProperty:'value',
                            storeId:'f2_pathway_list_store'
                        }),
                        listWidth:300,
                        fieldLabel:'Pathway',
                        selectOnFocus:true,
                        forceSelection : true,
                        triggerAction : 'all',
                        defaultValue:'',
                        value:'',
                        valueField:'value',
                        displayField:'value',
                        emptyText:'Select Pathway...',
                        listeners : {
                            select : function(field,record,index) {
                                Ext.getCmp("filter_type").setValue(re.ui.feature2.id);
                                Ext.getCmp('p_label').setValue(record.json.label);
                                Ext.getCmp('limit').setValue('25');
                                re.ui.setCurrentPathwayMembers(record.json.label);
                                var memberDataArray = [];
                                var memberTokens = (record.json.label).split(",");
                                for (var tk = 0; tk<memberTokens.length; tk++){
                                    var mjson = {};
                                    var member = memberTokens[tk];
                                    if (member == null || member == "")
                                            continue;
                                    mjson["pmember"] = member;
                                    mjson["display_count"] = Math.floor(5*Math.random());
                                    mjson["hidden_count"] = Math.floor(10*Math.random());
                                    memberDataArray.push(mjson);
                                    loadFeaturesInAFM(member);
                                }
                                renderPathwayMembers('below-top-right');
                                var url = record.json.value;
                                if (record.json.url != null && record.json.url.length > 1)
                                        url = "<a href='" + record.json.url + "' target='_blank'>" + record.json.value  + "</a> ";
                                Ext.getCmp("pathway_member_panel").setTitle(url + memberDataArray.length + " Genes");
                            }
                        }
                    }, {                      
                            xtype:'textfield',
                            name:'p_label',
                            id:'p_label',
                            emptyText : 'Input Label...',
                            tabIndex: 6,
                            selectOnFocus:true,
                            fieldLabel:'Label',
                            defaultValue : '',
                            value: '',
                            listeners: {
                                change: function(t,o,n){
                                    if (n.indexOf(",") != -1)
                                        Ext.getCmp("filter_type").setValue(re.ui.feature2.id);
                                }
                            }
                    }, {
                        mode:'local',
                        name:'p_clin',
                        id:'p_clin',
                        xtype:'combo',
                        allowBlank : false,
                        hidden:true,
                        store: new Ext.data.JsonStore({
                            autoLoad : false,
                            data: [],
                            fields : ['value','label','source'],
                            idProperty:'value',
                            storeId:'f2_clin_list_store'
                        }),
                        listWidth:200,
                        fieldLabel:'Features',
                        selectOnFocus:true,
                        forceSelection : true,
                        triggerAction : 'all',
                        valueField:'value',
                        displayField:'label',
                        emptyText:'CLIN Feature...',
                        defaultValue:'*',
                        value:'*'
                    },  {
                        xtype:'combo',
                        name:'p_chr',
                        id:'p_chr',
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
                        tabIndex : 7,
                        selectOnFocus:true,
                        //forceSelection : true,
                        triggerAction : 'all',
                        emptyText : 'Select Chr...',
                        defaultValue : '*',
                        value : '*'
                    }, {
                        xtype:'compositefield',
                        fieldLabel:'Position',
                        defaults:{labelWidth:0,width:80,anchor:'100%'},
                        items:[{ 
                            xtype : 'numberfield',
                            id:'p_start',
                            name :'p_start',
                            allowNegative: false,
                            decimalPrecision : 0,
                            emptyText : 'Start >=',
                            invalidText:'This value is not valid.',
                            maxValue: 250999999,
                            minValue:1,
                            tabIndex : 8,
                            validateOnBlur : true,
                            allowDecimals : false,
                            defaultValue : '',
                        },{
                            xtype : 'numberfield',
                            id:'p_stop',
                            name :'p_stop',
                            allowNegative: false,
                            decimalPrecision : 0,
                            emptyText : 'Stop <=',
                            invalidText:'This value is not valid.',
                            maxValue: 250999999,
                            minValue:1,
                        tabIndex : 9,
                        validateOnBlur : true,
                            allowDecimals : false,
                            defaultValue : '',
                            value : ''
                        }]
                    }
                    ]
                }, {
                    xtype:'fieldset',
                    defaults:{
                        anchor:'100%'
                    },
                    labelWidth: 110,
                    labelSeparator : '',
                    title:'Association',
                    collapsible: true,
                    autoHeight:true,
                    items: 
                    re.model.association.types.filter(function(assoc) {
                        return assoc.ui != undefined && assoc.ui.filter != undefined && assoc.ui.filter.component != undefined;
                    }).map( function (obj) {
                        return obj.ui.filter.component;
                    }).concat([{
                        xtype: 'combo',
                        name: 'order',
                        id: 'order',
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
                        tabIndex : 10,
                        typeAhead : true,
                        selectOnFocus:true,
                        triggerAction : 'all',
                        defaultValue : re.ui.order_list[0]['value'],
                        value : re.ui.order_list[0]['value']
                    }, {
                        xtype: 'combo',
                        name: 'limit',
                        id: 'limit',
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
                        tabIndex : 11,
                        typeAhead : true,
                        selectOnFocus:true,
                        triggerAction : 'all',
                        defaultValue : 200,
                        value : 200
                    }]).concat([{
                        xtype: 'fieldset',
                          defaults: { anchor:'90%'},
                        labelWidth:60,
                        collapsible: true,
                        collapsed: true,
                        autoHeight: true,
                        labelSeparator: '',
                        title: 'Distance',
                        items: [
                            {
                            fieldLabel: 'Inter-Chromosomal',
                            xtype:'compositefield',
                            items: [{
                                xtype: 'checkbox',
                                name: 'cis',
                                id: 'cis',
                                boxLabel: 'Cis',
                                inputValue: 'false',
                                defaultValue:false,
                                 listeners: {
                                     check: function(cb, checked) {
                                        Ext.getCmp('trans').setDisabled(checked);
                                        Ext.getCmp('cis_distance').setDisabled(!checked);
                                        }
                                    }
                                }, {
                                xtype: 'checkbox',
                                id:'trans',
                                name: 'trans',
                                boxLabel: 'Trans',
                                defaultValue:false,
                                listeners: {
                                     check: function(cb, checked) {
                                        Ext.getCmp('cis').setDisabled(checked);
                                        }
                                    }
                                }]
                            }, 
                        new re.simplerangeField({
                                id: 'cis_distance',
                                name: 'cis_distance',
                                label:'Distance',
                                disabled: true,
                                max_value: 3e8,
                                min_value: 0,
                                tabIndex: 12,
                                validateOnBlur: true,
                                allowDecimals: false,
                                default_value: '50000'
                            })
                        ]
                    }])
                }, {
                    xtype:'combo',
                    fieldLabel:'Filter By',
                    displayField: 'label',
                    valueField:'id',
                    anchor:'90%',
                    id:'filter_type',
                    mode: 'local',
                    defaultValue: 'association',
                    value: 'association',
                    typeAhead : true,
                    forceSelection : true,
                    selectOnFocus: true,
                    tabIndex: 13,
                    triggerAction : 'all',
                    allowBlank : false,
                    store: {
                        xtype: 'jsonstore',
                        fields:['label','id'],
                        autoLoad: true,
                        idProperty:'id',
                        data: [{
                            label:'Association',
                            id:'association'
                        },
                        re.ui.feature1, re.ui.feature2]
                    },
                    listeners: {
                        render: function(c) {
                            Ext.QuickTips.register({
                                target: c,
                                title: '',
                                text: '<b>Association</b>: Top X Results matching ' + 'any of the specified labels<br><b>' + re.ui.feature1.label + '</b>: Top X ' + 'Results for <b>each</b> of the specified labels in that fieldset<br><b>' + re.ui.feature2.label + '</b>: Top X Results for <b>each</b> of the specified ' + 'labels in that fieldset'
                            });
                        }
                    }
                }]
            }]
        }, {
            xtype: 'panel',
            id:'pathway_member_panel',
            title : 'Pathways/Groupings',
            autoScroll : true,
            collapsed: true,
            height : 250,
            tools: [{
                id: 'help',
                handler: function(event, toolEl, panel){
                    openHelpWindow('Filtering',filteringHelpString);
                }
            }],
            items: [{
                xtype: 'panel',
                id: 'pathway-member-item',
                width: 300,
                height: 800,
                x: 20,
                y: 20
            }]
        }]
    }
};
