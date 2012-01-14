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
                    id:id + '_fn',
                    name :id + '_fn',
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