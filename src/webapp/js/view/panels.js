if (re === undefined) { re = {};}

vq.utils.VisUtils.extend(re.ui, {
        panels : {
            east : {
                region: 'east',
                collapsible: true,
                floatable: true,
                autoHide:false,
		autoScroll: true,
                split: true,
                width: 280,
                id: 'filter_parent',
                title: 'Filtering',
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
                        xtype: 'panel', id:'associations_filter',
                        title : 'Filter Associations',
                        autoScroll : true,
                        height : 500,
                        tools: [{
                            id: 'help',
                            handler: function(event, toolEl, panel){
                                openHelpWindow('Filtering',filteringHelpString);
                            }}],
                        items :[
                            { xtype:'form',
                                id :'association_filter_panel',
                                name :'association_filter_panel',
                                bodyStyle:'padding:5px 5px 5px 5px',
                                defaults:{anchor:'100%'},
                                border : false,
                                labelAlign : 'right',
                                labelWidth: 70,
                                labelSeparator : '',
                                defaultType:'textfield',
                                monitorValid : true,
                                keys: [
                                    {
                                        key: [Ext.EventObject.ENTER],
                                        fn: function() {
                                            Ext.ComponentMgr.get('re_filter_button').fireEvent('click');
                                        }}
                                ],
                                buttons : [
                                    {
                                        text: 'Filter',
                                        id:'re_filter_button',
					disabled: false,
                                        //formBind : true,
                                        listeners : {
                                            click : function(button,e) {
						if ((Ext.getCmp("t_type").getValue() == 'GEXP' && Ext.getCmp("p_type").getValue() != 'Pathway')
						|| (Ext.getCmp("t_type").getValue() != 'Pathway' && Ext.getCmp("p_type").getValue() == 'GEXP')){
							//Ext.getCmp("pathway_member_panel").setTitle("Filtered member degrees");		
						}
						if (Ext.getCmp('t_label').getValue() != null && Ext.getCmp('t_label').getValue().indexOf(",") > -1) {
                                                	re.ui.setCurrentPathwayMembers(Ext.getCmp('t_label').getValue());
						} else if (Ext.getCmp('p_label').getValue() != null && Ext.getCmp('p_label').getValue().indexOf(",") > -1) {
                                                	re.ui.setCurrentPathwayMembers(Ext.getCmp('p_label').getValue());
						}
						var ft = Ext.getCmp("filter_type").getValue();
						if (ft != "association" && Ext.getCmp('t_label').getValue().indexOf(",") != -1)
							Ext.getCmp('pathway_member_panel').expand();
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
                                        id:re.ui.feature1.id,
                                        title:re.ui.feature1.label,
                                        collapsible: true,
                                        defaults:{anchor:'100%'},
                                        labelWidth: 70,
                                        labelSeparator : '',forceSelection : true,
                                        defaultType:'textfield',
                                        autoHeight:true,
                                        items:[
                                            { xtype:'checkbox',
                                                id:'isolate',
                                                fieldLabel:'Isolate',
                                                defaultValue:false,
                                                checked:false,
                                                listeners: { check: function(cb, checked) {
                                                    //Ext.getCmp(re.ui.feature2.id).setDisabled(checked);
                                                    //if (checked) { Ext.getCmp(re.ui.feature2.id).collapse(); }
                                                    //else { Ext.getCmp(re.ui.feature2.id).expand(); }
                                                    Ext.getCmp('t_chr').setDisabled(checked);
                                                    Ext.getCmp('t_start').setDisabled(checked);
                                                    Ext.getCmp('t_stop').setDisabled(checked);
                                                    //Ext.getCmp('t_lookup_button').setDisabled(checked);
                                                    Ext.getCmp('filter_type').setDisabled(checked);
                                                }
                                                }
                                            },
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
								Ext.getCmp('t_pathway').setVisible(false);
                                                                break;
							    case('Pathway'):
								//Ext.getCmp('f1_label_comp').setVisible(false);
                                                                Ext.getCmp('t_clin').setVisible(false);
                                                                Ext.getCmp('t_pathway').setVisible(true);	
                                                            	break;
							    default:
                                                                Ext.getCmp('f1_label_comp').setVisible(true);
                                                                Ext.getCmp('t_clin').setVisible(false);
								Ext.getCmp('t_pathway').setVisible(false);
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
                                                        value : '',
							listeners: {
								change: function(t,o,n){
									if (n.indexOf(",") != -1)
										Ext.getCmp("filter_type").setValue(re.ui.feature1.id);	
								}
							}
                                                    },
                                                    {
                                                        xtype:'button',
                                                        id:'t_lookup_button',
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
                                                valueField:'value',
                                                displayField:'value',
                                                emptyText:'Select Pathway...',
						listeners : {
                                                    select : function(field,record,index) {
                                                        Ext.getCmp("filter_type").setValue(re.ui.feature1.id);
							Ext.getCmp('f1_label_comp').setVisible(true);
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
                                        id:re.ui.feature2.id,
                                        title:re.ui.feature2.label,
                                        checkboxToggle:false,
                                        maskDisabled:true,
					collapsed: true,
                                        collapsible: true,
                                        defaults:{anchor:'100%'},
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
                                                                Ext.getCmp('f2_label_comp').setVisible(false);
                                                                Ext.getCmp('p_clin').setVisible(true);
                                                                Ext.getCmp('p_pathway').setVisible(false);
                                                                break;
                                                            case('Pathway'):
                                                                Ext.getCmp('f2_label_comp').setVisible(false);
                                                                Ext.getCmp('p_clin').setVisible(false);
                                                                Ext.getCmp('p_pathway').setVisible(true);
                                                                break;
                                                            default:
                                                                Ext.getCmp('f2_label_comp').setVisible(true);
                                                                Ext.getCmp('p_clin').setVisible(false);
                                                                Ext.getCmp('p_pathway').setVisible(false);

                                                        /*    case('CLIN'):
                                                                var label_cmp = Ext.getCmp('f2_label_comp'),
                                                                    clin_cmp = Ext.getCmp('p_clin');
                                                                label_cmp.setVisible(false);
                                                                clin_cmp.setVisible(true);
                                                                break;
                                                            default:
                                                                var label_cmp = Ext.getCmp('f2_label_comp'),
                                                                    clin_cmp = Ext.getCmp('p_clin');
                                                                label_cmp.setVisible(true);
                                                                clin_cmp.setVisible(false);*/
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
                                                        value : '',
							listeners: {
                                                                change: function(t,o,n){
                                                                        if (n.indexOf(",") != -1)
                                                                                Ext.getCmp("filter_type").setValue(re.ui.feature2.id);
                                                                }
                                                        }
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
					    {
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
                                                valueField:'value',
                                                displayField:'value',
                                                emptyText:'Select Pathway...',
                                                listeners : {
                                                    select : function(field,record,index) {
                                                        Ext.getCmp("filter_type").setValue(re.ui.feature2.id);
                                                        Ext.getCmp('f2_label_comp').setVisible(true);
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
                                            re.model.association.types.filter(function(assoc) {
                                                    return assoc.ui != undefined && assoc.ui.filter != undefined &&
                                                            assoc.ui.filter.component != undefined;
                                            }).map( function (obj) {
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
                                        valueField:'id',
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
                                            fields:['label','id'],
                                            autoLoad: true,
                                            idProperty:'id',
                                            data:[
                                                {  label:'Association', id:'association' },
                                                re.ui.feature1,
                                                re.ui.feature2
                                            ]
                                        }}]}
                        ]
                    },
/*	{xtype: 'panel', 
	id:'pathway_member_panel',
                        title : 'Pathway Gene Members',
                        autoScroll : true,
                        height : 500,
			width: 400,
			minWidth: 300,
			collapsed:true,
        		items: 
			{xtype: 'stackedbarchart',
			autoSize: true,
		//	plugins: [new Ext.ux.plugin.VisibilityMode()],
	    		boxMinHeight: 400,
			animCollapse:false, animFloat:false,hideMode: 'offsets',	
            		store: new Ext.data.JsonStore({
            			autoLoad : false,
                		data: [],
                		fields : ['pmember','display_count', 'hidden_count'],
                		storeId:'pathway_member_store'
            		}),
            		yField: 'pmember',    	
            		xAxis: new Ext.chart.NumericAxis({
                		stackingEnabled: true,
                		labelRenderer: function(dd){
					return dd;
				}
            		}),
        	    series: [{
                	xField: 'display_count',
                	displayName: 'Shown',
			style: {color:0x6238A7, size:8, spacing:8}
            		},{
                	xField: 'hidden_count',
                	displayName: 'Hidden',
			style: {color:"#C38EC7", size:8, spacing:8}
            		}],
		    extraStyle:{
				legend: {display: 'right'}
			},
			listeners: { 
                        	itemclick : function(obj) {
                                var si = obj.seriesIndex;
				if (si == 0)
					 alert("highlight " + obj.item.hidden_count  + " hidden edges for " + obj.item.pmember);
				if (si == 1)
					alert("highlight " + obj.item.hidden_count + " hidden edges for " + obj.item.pmember)
                        	}
                	}
        	}},*/
 		    {
                        xtype: 'panel', id:'pathway_member_panel',
                        title : 'Pathways/Groupings',
                        autoScroll : true,
                        collapsed: true,
                        height : 250,
                        tools: [{
                            id: 'help',
                            handler: function(event, toolEl, panel){
                                openHelpWindow('Filtering',filteringHelpString);
                            }}],//,
			items: [{
                        xtype: 'panel',
                        id: 'pathway-member-item',
                        width: 300,
			height: 800,
                        x: 20,
                        y: 20
                    }]
                    }
		]
            }

        }
    }
);
