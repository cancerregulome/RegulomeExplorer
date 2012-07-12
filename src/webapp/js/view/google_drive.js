Ext.ns("org.cancerregulome.explorer.utils");

org.cancerregulome.explorer.utils.DriveClientWindow = Ext.extend(Object, {
    uploaders:[],

    constructor:function (config) {
        Ext.apply(this, config);

        org.cancerregulome.explorer.utils.DriveClientWindow.superclass.constructor.call(this);

        this.makeReady();
    },

    makeReady:function () {
        Ext.Ajax.request({
            url:"/google-drive-svc/",
            method:"GET",
            scope:this,
            success:function (o) {
                var json = Ext.util.JSON.decode(o.responseText);
                if (json.redirect) {
                    var win = new Ext.Window({
                        id:'win-google-drive-oauth',
                        renderTo:'view-region',
                        modal:true,
                        closeAction:'hide',
                        layout:'anchor',
                        width:400,
                        height:200,
                        title:"Google Drive",
                        closable:true,
                        layoutConfig:{
                            animate:true
                        },
                        maximizable:false,
                        items:[{
                            html: '<a target="_blank" href="' + json.redirect + '">Allow Regulome Explorer to access Google Drive</a>'
                        }]
                    });
                    win.show();
                } else if (json["client_id"]) {
                    this.showUploadWindow();
                } else {
                    // TODO: Fire events
                }
            },
            failure:function (o, e) {
                // TODO : Fire events
            }
        });
    },

    showUploadWindow: function() {
        this.dataview = new Ext.DataView({
            store: new Ext.data.JsonStore({ fields: ['text', 'filename', 'getContent'], data: this.uploaders }),
            tpl: new Ext.XTemplate(
                '<ul id="c_uploaders">',
                '<tpl for="."><li id="{text}">{text}</li></tpl>',
                '</ul>'
            ),
            region: "center",
            width: 240,
            margins: "5 5 5 5",
            itemSelector: "li",
            listeners: {
                scope: this,
                click: this.selectUploader
            }
        });

        this.uploadWindow = new Ext.Window({
            id:'win-google-drive',
            renderTo:'view-region',
            modal:true,
            closeAction:'hide',
            layout:'border',
            width:600,
            height:500,
            title:"Google Drive",
            closable:true,
            layoutConfig:{
                animate:true
            },
            maximizable:false,
            items:[
                { html: '<a href="http://drive.google.com" target="_blank">Open Google Drive</a>', region: "north", height: 30 },
                this.dataview
            ]
        });
        this.uploadWindow.show();
    },

    selectUploader: function(a, b, item) {
        var json = this.dataview.getRecord(item).json;
        this.writeFile(json.filename, json.getContent());
    },

    writeFile:function (title, contents) {
        Ext.Ajax.request({
            url:"/google-drive-svc/",
            method:"POST",
            params:{
                meta:Ext.util.JSON.encode({title:title}), content:contents
            },
            scope:this,
            success: function (o) {
                // TODO : Fire events
                this.uploadWindow.close();
            },
            failure:function (o, e) {
                // TODO : Fire events
            }
        });
    }
});