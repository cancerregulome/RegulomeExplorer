

/*
 * Pathed Menu Component
 */
Ext.ns("org.cancerregulome.explorer.view");

org.cancerregulome.explorer.view.PathedMenu = Ext.extend(Ext.menu.Menu, {
    menusByPath: {},

    constructor: function(config) {
        Ext.apply(this, config);
        org.cancerregulome.explorer.view.PathedMenu.superclass.constructor.call(this);
    },

    addPathedItems: function(records) {
        var sortedRecords = [];
        Ext.each(records, function(record) {
            sortedRecords.push(record);
        });
        sortedRecords.sort(function(a, b) {
            if (a.json && b.json) {
                var apath = a.json.org_path;
                var bpath = b.json.org_path;
                if (apath == bpath) return 0;
                if (apath > bpath) return 1;
                if (apath < bpath) return -1;
            }
            return 0;
        });

        Ext.each(sortedRecords, function(record) {
            var item = record.json;
            if (item) {
                item.path = item.org_path;
                if (!item.path) item.path = "/Other";

                var label = item.label;
                var description = item.description;

                var config = {
                    id: Ext.id(),
                    text: label,
                    handler: function() {
                        window.history.pushState({ dataset: label }, '', '?' + Ext.urlEncode({ dataset: label }));
                        vq.events.Dispatcher.dispatch(new vq.events.Event('dataset_selected', 'dataset_grid', label));
                        Ext.getCmp('filter_parent').setTitle('Filtering \'' + description + '\'');
                    }
                };

                this.addPathedItem(new Ext.menu.Item(Ext.applyIf(config, item)));
            }
        }, this);
    },

    addPathedItem: function(menuItem) {
        if (menuItem && menuItem.path) {
            var parts = menuItem.path.split("/");
            var lastMenu = this;
            var currentPath = "";

            for (var i = 1; i < parts.length; i++) {
                var part = parts[i];
                currentPath += "/" + part;
                var existingMenu = this.menusByPath[currentPath];
                if (!existingMenu) {
                    existingMenu = new Ext.menu.Menu({path:currentPath});
                    this.menusByPath[currentPath] = existingMenu;
                    lastMenu.add({text:part, menu: existingMenu});
                }
                lastMenu = existingMenu;
            }

            lastMenu.addMenuItem(menuItem);
        }
    }
});

//var pathedMenu = new org.cancerregulome.explorer.view.PathedMenu({});

org.cancerregulome.explorer.view.DatasetTree = Ext.extend(Ext.tree.TreeNode, {
    constructor: function(config) {
        Ext.apply(this, config);
        org.cancerregulome.explorer.view.DatasetTree.superclass.constructor.call(this);
    },

    addNodes: function(records, keys) {
        var that = this;
//  keys = keys || ['source','method','disease','dataset_date'];
        keys = keys || ['source','disease','dataset_date'];
        var sets = records.map(function(record){return record.json;}).filter(function(json_r){return json_r;});
        var nested_sets = pv.nest(sets);

        function sortDates(a,b) {
            if (!a ^ !b) {return !a ? 1 : -1;} // one of them is null, empty, undefined
            if(!!~[a,null,b].indexOf('Final')) return [a,null,b].indexOf('Final') -1;
            try {
                var af = a.split('-').map(function(val) { return parseInt(val);}),
                    bf = b.split('-').map(function(val) { return parseInt(val);});
            }
            catch(e) {  //failed to split or parse
                return 0;
            }
            if(af.length != 3 && bf.length != 3) { return 0;} //can't parse
            return bf[2] - af[2] != 0 ? bf[2] - af[2] :
                bf[0] - af[0] != 0 ? bf[0] - af[0] :
                    bf[1] - af[1];
        }
        function sortStrings(a,b) {
            if (!a ^ !b)   // one is null, empty, undefined and the other is not
                return !a ? 1 : -1;
            else if (a.toUpperCase() > b.toUpperCase() )return 1;
            else if (b.toUpperCase() > a.toUpperCase() ) return -1;
            return 0;
        }
        Ext.each(keys,function(key){
            var key_func = function(a) { return a[key];};
            nested_sets.key.call(nested_sets,key_func);
            nested_sets.sortKeys.call(nested_sets,key === 'dataset_date' ? sortDates : sortStrings);
        });
        nested_sets = nested_sets.entries();

        Ext.each(nested_sets, function(branch) { extendBranch.call(that,branch,0);});

        function extendBranch(group,depth) {
            var node = this;
            if (depth >= keys.length) {
                var config = {
                    id: Ext.id(),
                    text: group.description,
                    leaf:true,
                    listeners: {'click' : function(node,e) {
                        var label = node.attributes.label;
                        selectDatasetByLabel(label);
                    }
                }
                };
                return node.appendChild(new Ext.tree.TreeNode(Ext.applyIf(config, group)));
            }
            else {
                var label = group.key || 'Other';
                var branch = new Ext.tree.TreeNode({text:label,node:branch,singleclickExpand:true});                
                node.appendChild(branch);
                Ext.each(group.values,function(sub_group) { extendBranch.call(branch,sub_group, depth+1);});
            }
        }  
}
});




org.cancerregulome.explorer.view.DatasetMenu = Ext.extend(Ext.menu.Menu, {
    constructor: function(config) {
        Ext.apply(this, config);
        org.cancerregulome.explorer.view.DatasetMenu.superclass.constructor.call(this);
    },

    addPathedItems: function(records, keys) {
        var that = this;
//  keys = keys || ['source','method','disease','dataset_date'];
        keys = keys || ['source','disease','dataset_date'];
        var sets = records.map(function(record){return record.json;}).filter(function(json_r){return json_r;});
        var nested_sets = pv.nest(sets);

        function sortDates(a,b) {
            if (!a ^ !b) {return !a ? 1 : -1;} // one of them is null, empty, undefined
            if(!!~[a,null,b].indexOf('Final')) return [a,null,b].indexOf('Final') -1;
            try {
                var af = a.split('-').map(function(val) { return parseInt(val);}),
                    bf = b.split('-').map(function(val) { return parseInt(val);});
            }
            catch(e) {  //failed to split or parse
                return 0;
            }
            if(af.length != 3 && bf.length != 3) { return 0;} //can't parse
            return bf[2] - af[2] != 0 ? bf[2] - af[2] :
                bf[0] - af[0] != 0 ? bf[0] - af[0] :
                    bf[1] - af[1];
        }
        function sortStrings(a,b) {
            if (!a ^ !b)   // one is null, empty, undefined and the other is not
                return !a ? 1 : -1;
            else if (a.toUpperCase() > b.toUpperCase() )return 1;
            else if (b.toUpperCase() > a.toUpperCase() ) return -1;
            return 0;
        }
        Ext.each(keys,function(key){
            var key_func = function(a) { return a[key];};
            nested_sets.key.call(nested_sets,key_func);
            nested_sets.sortKeys.call(nested_sets,key === 'dataset_date' ? sortDates : sortStrings);
        });
        nested_sets = nested_sets.entries();

        Ext.each(nested_sets, function(branch) { extendBranch.call(that,branch,0);});

        function extendBranch(group,depth) {
            var menu = this;
            if (depth >= keys.length) {
                var config = {
                    id: Ext.id(),
                    text: group.description,
                    handler: function() {
                        window.history.pushState({ dataset: group.label }, '', '?' + Ext.urlEncode({ dataset: group.label }));
                        vq.events.Dispatcher.dispatch(new vq.events.Event('dataset_selected', 'dataset_grid', group.label));
                        Ext.getCmp('filter_parent').setTitle('Filtering \'' + group.description + '\'');
                    }
                };
                return menu.addMenuItem(new Ext.menu.Item(Ext.applyIf(config, group)));
            }
            else {
                var branch = new Ext.menu.Menu();
                var label = group.key || 'Other';
                menu.add({text:label,menu:branch});
                Ext.each(group.values,function(sub_group) { extendBranch.call(branch,sub_group, depth+1);});
            }
        }
    }

});


Ext.override(Ext.LoadMask, {
        show: function() {
        this.onBeforeLoad();
        var me    = this,
            msgEl = Ext.query("div.ext-el-mask-msg",this.el.dom)[0];
            if ( me.cancelEvent != undefined && typeof me.cancelEvent == "function") {
                var btn = new Ext.Button({
                    cls : 'loadCancelButton',
                    text : 'Cancel',
                    listeners : {
                        'click': function() {  me.cancelEvent.call(this);}
                    },
                    renderTo : msgEl,
                    width : 60
                });
            }
        }
});

Ext.override(Ext.form.FieldSet, {        
        onCheckClick: function() {
        var me    = this,
            checked = this.checkbox.dom.checked;
            me.setDisabled(!checked);            
            }
});

re.multirangeField = Ext.extend(Ext.form.CompositeField, {
    constructor: function(config) {
        var default_value = config.default_value || 0;
        var min_value = config.min_value || -1;
        var max_value = config.max_value || 1;
        var label = config.label || '';
        var id = config.id || label+ 'id';

        config = Ext.apply( {
            anchor: '-20',
            msgTarget: 'side',
            fieldLabel: label,
            items : [
                {
                    //the width of this field in the HBox layout is set directly
                    //the other 2 items are given flex: 1, so will share the rest of the space
                    width:          50,
                    id: id + '_fn',
                    name :id + '_fn',
                    xtype:          'combo',
                    mode:           'local',
                    defaultValue:          'Abs',
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
                                text: 'Implies if ' + label +' value (x)=.5, Abs is a filtering of (x >= .5 OR x <= -.5) <br>Btw is a filtering of (x >= -.5 AND x <= .5)'
                            });
                        }
                    }
                },
                {xtype : 'numberfield',
                    id:id,
                    name :id,
                    allowNegative: true,
                    decimalPrecision : 2,
                    emptyText : 'Input value...',
                    invalidText:'This value is not valid.',
                    minValue:min_value,
                    maxValue:max_value,
                    width: 40,
                    tabIndex : 1,
                    validateOnBlur : true,
                    fieldLabel : 'Range('+ label + ')',
                    defaultValue : default_value,
                    value : default_value,
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

            ]}, config);

        re.multirangeField.superclass.constructor.call(this, config);
    }
});

  Ext.override(Ext.form.ComboBox, {
        setValue: function(v, fireSelect) {
            var text = v;
            if (this.valueField) {
                var r = this.findRecord(this.valueField, v);
                if (r) {
                    text = r.data[this.displayField];
                    if (fireSelect) {
                        var index = this.store.indexOf(r);
                        this.selectedIndex = index;
                        this.fireEvent('select', this, r, index);
                    }
                } else if (Ext.isDefined(this.valueNotFoundText)) {
                    text = this.valueNotFoundText;
                }
            }
            this.lastSelectionText = text;
            if (this.hiddenField) {
                this.hiddenField.value = v;
            }
            Ext.form.ComboBox.superclass.setValue.call(this, text);
            this.value = v;
            return this;
        }
    });