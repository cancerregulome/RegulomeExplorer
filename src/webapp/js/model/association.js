if (re.model === undefined) re.model = {};

re.model.association =  {
	types : [
		{ 	id : 'importance',
			label : 'Importance',
			ui : {
			filter : { 
				 					component: {
					 							xtype : 'numberfield',
                                                id:'importance',
                                                name :'importance',
                                                allowNegative: false,
                                                decimalPrecision : 2,
                                                emptyText : 'Input value...',
                                                invalidText:'This value is not valid.',
                                                minValue:0,
                                                tabIndex : 1,
                                                validateOnBlur : true,
                                                fieldLabel : 'Importance >=',
                                                defaultValue : 0,
                                                value : 0
                                            }
			},
			grid : {
				column : { header: "Importance", width:50, id:'importance',dataIndex:'importance' },
				store_index : 'importance'
				}
			},
			query : {
				id : 'importance',
				clause : 'importance >= ',
				order_direction : 'DESC'
			},
			vis : {
				network : {
					edgeSchema : { name: "importance", type: "number" }
				},
				tooltip : {
					entry : { ' Importance' : 'importance'}
				},
                scatterplot : {
                    scale_type :'linear',
                    values : {
                    },
                    color_scale : pv.Scale.linear(0,1).range('blue','red')
                }
			}	
		},
		{ 	id : 'pvalue',
			label : 'Pvalue',
			ui : {
			filter : { 
				 					component: {
					 							xtype : 'numberfield',
                                                id:'pvalue',
                                                name :'pvalue',
                                                allowNegative: false,
                                                decimalPrecision : 8,
                                                emptyText : 'Input value...',
                                                invalidText:'This value is not valid.',
                                                maxValue:0.9,
                                                minValue:0,
                                                tabIndex : 1,
                                                validateOnBlur : true,
                                                fieldLabel : 'pvalue <=',
                                                defaultValue : 0.5,
                                                value : 0.5
                                            }
			},
			grid : {
				column : { header : "pvalue", width : 50 , id: 'pvalue' , dataIndex : 'pvalue', hidden: true},
				store_index : 'pvalue'
			}
			},
			query : {
				id : 'pvalue',
				clause : 'pvalue <= ',
				order_direction : 'ASC'
			},
			vis : {
				network : {
					edgeSchema : {name: "pvalue", type: "number" }
				},
				tooltip : {
					entry : { pvalue : 'pvalue' }
				},
                scatterplot : {
                    color_scale : pv.Scale.linear(0.5,0).range('blue','red')
                },

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