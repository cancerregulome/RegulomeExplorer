Ext.ns("org.cancerregulome.explorer.utils");

org.cancerregulome.explorer.utils.DriveClientWindow = Ext.extend(Object, {
    uploaders:[],

    constructor:function (config) {
        Ext.apply(this, config);

        org.cancerregulome.explorer.utils.DriveClientWindow.superclass.constructor.call(this);
    },

    makeReady: function(callback) {
        Ext.Ajax.request({
            url:"/google-drive-svc/",
            method:"GET",
            scope:this,
            success:function (o) {
                var json = Ext.util.JSON.decode(o.responseText);
                if (json.redirect) {
                    new Ext.Window({
                        html: '<a target="_blank" onclick="" href="' + json.redirect + '">Authorize access to your Google Drive</a>'
                    }).show();
                } else if (json["client_id"]) {
                    callback();
                } else {
                    // TODO: Fire events
                }
            },
            failure:function (o, e) {
                // TODO : Fire events
            }
        });
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
            },
            failure:function (o, e) {
                // TODO : Fire events
            }
        });
    }
});


