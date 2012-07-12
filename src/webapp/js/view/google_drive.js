Ext.ns("org.cancerregulome.explorer.utils");

org.cancerregulome.explorer.utils.GoogleDriveClient = Ext.extend(Ext.util.Observable, {
    redirectUrl:null,
    lastChange:-1,
    taskRunner:null,

    constructor:function (config) {
        Ext.apply(this, config);

        this.addEvents("logged_in", "logged_out", "make_ready");

        org.cancerregulome.explorer.utils.GoogleDriveClient.superclass.constructor.call(this);

        this.on("make_ready", this.makeReady, this);

        var me = this;
        var runFn = function () {
            console.log("run");
            me.makeReady();
        };
        this.checkLoginTask = { run:runFn, interval:2000 };
        this.taskRunner = new Ext.util.TaskRunner();
    },

    makeReady:function () {
        Ext.Ajax.request({
            url:"/google-drive-svc/",
            method:"GET",
            scope:this,
            success:function (o) {
                var json = Ext.util.JSON.decode(o.responseText);
                if (json.redirect) {
                    this.redirectUrl = json.redirect;
                    this.fireEvent("logged_out");
                } else if (json["client_id"]) {
                    this.redirectUrl = null;
                    this.fireEvent("logged_in", json);
                } else {
                    // TODO: Fire events
                }
                if (json.lastChange) {
                    if (json.lastChange != this.lastChange) {
                        console.log("stop!:" + json.lastChange + ":" + this.lastChange);
                        this.taskRunner.stopAll();
                    }
                    this.lastChange = json.lastChange;
                }
            },
            failure:function (o, e) {
                // TODO : Fire events
            }
        });
    },

    login:function () {
        if (this.redirectUrl) {
            console.log("start running");
            this.taskRunner.start(this.checkLoginTask);

            window.open(this.redirectUrl, "_blank", "");
        } else {
            alert("cannot log you in, something weird is going on");
        }
    },

    logout:function () {
        Ext.Ajax.request({
            url:"/google-drive-svc/logout",
            method:"GET",
            scope:this,
            success:function () {
                this.lastChange = -1;
                this.fireEvent("make_ready");
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
            success:function (o) {
                // TODO : Fire events
            },
            failure:function (o, e) {
                // TODO : Fire events
            }
        });
    }
});
