if (re.model === undefined) re.model = {};

re.model.association =  {
    types : [
     {   id : 'logged_pvalue_bonf',
            label : 'Adjusted -log10(p)',
            ui : {
                grid : {
                    column : { header : "Adjusted -log10(p)", width : 50 , id: 'adj_logged_pvalue' , dataIndex : 'adj_logged_pvalue', hidden: false},
                    store_index : 'adj_logged_pvalue'
                }
            },
            query : {
                id : 'logged_pvalue_bonf',
                clause : '',
                order_direction : 'desc'
            },
            vis : {
                network : {
                    edgeSchema : {name: "logged_pvalue_bonf", type: "number" }
                },
                tooltip : {
                    entry : { 'Adjusted -log10(p)' : 'logged_pvalue_bonf' }
                },
                scatterplot: {
                    values: {
                        min:0,
                        floor : 0,
                        ceil: 300
                    },
                    color_scale : pv.Scale.linear(0,50).range('blue','red')
                }
            }
    },
       {   id : 'logged_pvalue',
            label : '-log10(p)',
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
                        maxValue:300,
                        minValue:0.0,
                        tabIndex : 1,
                        validateOnBlur : true,
                        fieldLabel : '-log10(p) &GreaterEqual;',
                        defaultValue: 6,
                        value : 6
                    }
                },
                grid : {
                    column : { header : "-log10(p)", width : 50 , id: 'logged_pvalue' , dataIndex : 'logged_pvalue', hidden: false},
                    store_index : 'logged_pvalue'
                }
            },
            query : {
                id : 'logged_pvalue',
                clause : 'logged_pvalue >= ',
                order_direction : 'DESC'
            },
            vis : {
                network : {
                    edgeSchema : {name: "logged_pvalue", type: "number" }
                },
                tooltip : {
                    entry : { '-log10(p)' : 'logged_pvalue' }
                },
                scatterplot: {
                    values: {
                        min:0,
                        floor : 0,
                        ceil: 300
                    },
                    color_scale : pv.Scale.linear(0,50).range('blue','red')
                }
            }
    },
        {   id : 'correlation',
            label : 'Correlation',
            ui : {
                filter : {
                    component:   new re.multirangeField(
                        {   id:'correlation',
                            label: 'Correlation',
                            decimalPrecision : 3,
                            emptyText : 'Input value...',
                            invalidText:'This value is not valid.',
                            validateOnBlur : true,
                            default_value: 0,
                            min_value: -1,
                            max_value: 1,
                            defaultValue: 0,
                            value : 0
                        }
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
                        min:-1,
                        max:1
                    },
                    color_scale : pv.Scale.linear(-1,1).range('blue','red')
                }
            }
        },
        {   id : 'num_nonna',
            label : '# of samples',
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
                        fieldLabel : '# of samples &GreaterEqual;',
                        defaultValue: 0,
                        value : 0
                    }
                },
                grid : {
                    column : { header: "# of samples", width:50, id:'num_nonna',dataIndex:'num_nonna' },
                    store_index : 'num_nonna'
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
                    entry : { ' # of samples' : 'num_nonna'}
                },
                scatterplot : {
                    scale_type :'linear',
                    values : {
                    },
                    color_scale : pv.Scale.linear(0,400).range('blue','red')
                }
            }
        }
    ]
};

re.model.association_map = pv.numerate(re.model.association.types, function(obj) { return obj.id;});