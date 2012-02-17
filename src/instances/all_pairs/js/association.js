if (re.model === undefined) re.model = {};

re.model.association =  {
	types : [
		{ 	id : 'logged_pvalue',
			label : 'log10(p)',
			ui : {
			filter : {
				 					component: {
					 							xtype : 'numberfield',
                                                id:'logged_pvalue',
                                                name :'logged_pvalue',
                                                allowNegative: true,
                                                decimalPrecision : 0,
                                                emptyText : 'Input value...',
                                                invalidText:'This value is not valid.',
                                                maxValue:0,
                                                minValue:-300.0,
                                                tabIndex : 1,
                                                validateOnBlur : true,
                                                fieldLabel : 'log10(p) <=',
                                                defaultValue: -2,
                                                value : -2
                                            }
			},
			grid : {
				column : { header : "log10(p)", width : 50 , id: 'logged_pvalue' , dataIndex : 'logged_pvalue', hidden: true},
				store_index : 'logged_pvalue'
			}
			},
            filter : {
            				 					component: {
            					 							xtype : 'numberfield',
                                                            id:'logged_pvalue',
                                                            name :'logged_pvalue',
                                                            allowNegative: true,
                                                            decimalPrecision : 0,
                                                            emptyText : 'Input value...',
                                                            invalidText:'This value is not valid.',
                                                            maxValue:0,
                                                            minValue:-300.0,
                                                            tabIndex : 1,
                                                            validateOnBlur : true,
                                                            fieldLabel : 'log10(p) <=',
                                                            defaultValue: -2,
                                                            value : -2
                                                        }
            			},
			query : {
				id : 'logged_pvalue',
				clause : 'logged_pvalue <= ',
				order_direction : 'ASC'
			},
			vis : {
				network : {
					edgeSchema : {name: "logged_pvalue", type: "number" }
				},
				tooltip : {
					entry : { 'log(p)' : 'logged_pvalue' }
				},
                scatterplot: {
                    values: {
                        min:-300,
                        floor : -50,
                        ceil: 0
                    },
                     color_scale : pv.Scale.linear(-100,0).range('blue','red')
                 }
            }
	},
		{ 	id : 'num_nonna',
			label : '# of non-NA',
			ui : {
			filter : {
				 					component: {
					 							xtype : 'numberfield',
                                                id:'num_nonna',
                                                name :'num_nonna',
                                                allowNegative: false,
                                                decimalPrecision : 2,
                                                emptyText : 'Input value...',
                                                invalidText:'This value is not valid.',
                                                minValue:0,
                                                tabIndex : 1,
                                                validateOnBlur : true,
                                                fieldLabel : '# of non-NA >=',
                                                defaultValue: 0,
                                                value : 0
                                           }
			},
			grid : {
				column : { header: "# of non-NA", width:50, id:'num_nonna',dataIndex:'num_nonna' },
				store_index : 'num_nonna'
				}
			},
            filter : {
            				 					component: {
            					 							xtype : 'numberfield',
                                                            id:'num_nonna',
                                                            name :'num_nonna',
                                                            allowNegative: false,
                                                            decimalPrecision : 2,
                                                            emptyText : 'Input value...',
                                                            invalidText:'This value is not valid.',
                                                            minValue:0,
                                                            tabIndex : 1,
                                                            validateOnBlur : true,
                                                            fieldLabel : '# of non-NA >=',
                                                            defaultValue: 0,
                                                            value : 0
                                                       }
            			},
			query : {
				id : 'num_nonna',
				clause : 'num_nonna >= ',
				order_direction : 'DESC'
			},
			vis : {
				network : {
					edgeSchema : { name: "num_nonna", type: "number" }
				},
				tooltip : {
					entry : { ' # of non-NA' : 'num_nonna'}
				},
                scatterplot : {
                                    scale_type :'linear',
                                    values : {
                                    },
                                    color_scale : pv.Scale.linear(0,400).range('blue','red')
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
            filter : {
            				 					component:   new re.multirangeField(
                                                            {   id:'correlation',
                                                                label: 'Correlation',
                                                                default_value: 0,
                                                                min_value: -1,
                                                                max_value: 1}
                                                        )
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
                                        min:-1,
                                        max:1
                                    },
                                    color_scale : pv.Scale.linear(-1,0,1).range('red','blue','red')
                                }
            }
//		},
//        { 	id : 'logged_pvalue_bonf',
//        			label : 'log10(bonf)',
//        			ui : {
//        			filter : {
//
//        			},
//        			grid : {
//        				column : { header: 'log10(bonf)', width:50, id:'logged_pvalue_bonf',dataIndex:'logged_pvalue_bonf'},
//        				store_index : 'logged_pvalue_bonf'
//        				}
//        			},
//        			query : {
//        				id : 'logged_pvalue_bonf'
////        				clause : flex_field_query,
////        				order_direction : 'DESC'
//        			},
//        			vis : {
//        				network : {
//        					edgeSchema : { name: "logged_pvalue_bonf", type: "number" }
//        				},
//        				tooltip : {
//        					entry : {  'log10(bonf)' : 'logged_pvalue_bonf'}
//        				},
//                        scatterplot : {
//                                            scale_type :'linear',
//                                            values : {
//                                            },
//                                            color_scale : pv.Scale.linear(-100,0).range('blue','red')
//                                        }
//                    }
//        		},
//        { 	id : 'num_nonna_f1',
//        			label : '# of non-NA (f1)',
//        			ui : {
//        			filter : {
//
//        			},
//        			grid : {
//        				column : { header: '# of non-NA (f1)', width:50, id:'num_nonna_f1',dataIndex:'num_nonna_f1'},
//        				store_index : 'num_nonna_f1'
//        				}
//        			},
//        			query : {
//        				id : 'num_nonna_f1'
////        				clause : flex_field_query,
////        				order_direction : 'DESC'
//        			},
//        			vis : {
//        				network : {
//        					edgeSchema : { name: "num_nonna_f1", type: "number" }
//        				},
//        				tooltip : {
//        					entry : {  '# of non-NA' : 'num_nonna_f1'}
//        				},
//                        scatterplot : {
//                                            scale_type :'linear',
//                                            values : {
//                                            },
//                                            color_scale : pv.Scale.linear(0,500).range('blue','red')
//                                        }
//                    }
//        		},
//        { 	id : 'rho_score',
//                			label : 'Score',
//                			ui : {
//                			filter : {
//
//                			},
//                			grid : {
//                				column : { header: 'Score', width:50, id:'rho_score',dataIndex:'rho_score'},
//                				store_index : 'rho_score'
//                				}
//                			},
//                			query : {
//                				id : 'rho_score'
//        //        				clause : flex_field_query,
//        //        				order_direction : 'DESC'
//                			},
//                			vis : {
//                				network : {
//                					edgeSchema : { name: "rho_score", type: "number" }
//                				},
//                				tooltip : {
//                					entry : {  'Score' : 'rho_score'}
//                				},
//                                scatterplot : {
//                                                    scale_type :'linear',
//                                                    values : {
//                                                    },
//                                                    color_scale : pv.Scale.linear(-1,1).range('red','blue','red')
//                                                }
//                            }
                		}
	]
};

re.model.association_map = pv.numerate(re.model.association.types, function(obj) { return obj.id;});