if (re.model === undefined) re.model = {};

re.model.association =  {
	types : [		
		{ 	id : 'logged_pvalue',
			label : '-log10(p)',
			ui : {
				filter : { 
 					component: {
	 							xtype : 'numberfield',
                                id:'logged_pvalue',
                                name :'logged_pvalue',
                                allowNegative: false,
                                decimalPrecision : 8,
                                emptyText : 'Input value...',
                                invalidText:'This value is not valid.',
                                maxValue:0.9,
                                minValue:0,
                                tabIndex : 1,
                                validateOnBlur : true,
                                fieldLabel : '-log10(p) <=',
                                defaultValue : 0.5,
                                value : 0.5
                            }
				},
					grid : {
						column : { header : "logged_pvalue", width : 50 , id: 'logged_pvalue' , dataIndex : 'logged_pvalue', hidden: true},
						store_index : 'logged_pvalue'
					}
			},
			query : {
				id : 'logged_pvalue',
				clause : 'logged_pvalue <= ',
				order_direction : 'DESC'
			},
			vis : {
				network : {
					edgeSchema : {name: "logged_pvalue", type: "number" }
				},
				tooltip : {
					entry : { pvalue : 'logged_pvalue' }
				},
                scatterplot : {
                    values : {
                                               min : 0,
                                                max : 0.5
                                            },
                    color_scale : pv.Scale.linear(0.5,0).range('blue','red')
                }
			}
		},
		{ 	id : 'correlation',
			label : 'Correlation',
			ui : {
			filter : { 
				 					component:   new re.multirangeField(
                                                {   id:'correlation',
                                                    label: 'Correlation',
                                                    default_value: 0,
                                                    min_value: -1,
                                                    max_value: 1}
                                            )
			},
			grid : {
				column : { header: "Correlation", width:50, id:'correlation',dataIndex:'correlation'},
				store_index : 'correlation'
			}
			},
			query : {
				id : 'correlation',
				clause : flex_field_query,
				order_direction : 'DESC'
			},
			vis : {
				network : {
					edgeSchema : { name: "correlation", type: "number" }
				},
				tooltip : {
					entry : {  Correlation : 'correlation'}
				},
                scatterplot : {
                    scale_type :'linear',
                    values : {
                           min : -1,
                            max : 1
                        },
                    color_scale : pv.Scale.linear(-1,0,1).range('red','blue','red')
                }
			}
		}
	]
};

re.model.association_map = pv.numerate(re.model.association.types, function(obj) { return obj.id;});