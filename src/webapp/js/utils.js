function errorInQuery(response) {
    return !!~response.indexOf('status:\'error\'');
}

function flex_field_query(label, value, fn) {
    var where = '';
    if (value + '' != '') {
        if (fn == 'Btw') {
            where += '(' + label + '>= -' + value + ' and ' + label + '<=' + value + ')';
        } else if (fn == '<=') {
            where += '(' + label + '<=' + value + ')';
        } else if (fn == '>=') {
            where += '(' + label + '>=' + value + ')';
        } else {
            if (parseFloat(value) != '0') {
                where += '(' + label + '>=' + value + ' or ' + label + '<= -' + value + ')';
            }
        }
    }
    return where;

}

function trim (str) {
    return str.replace(/^\s+/, '').replace(/\s+$/, '');
}
     
// Tests if s is an unsigned integer
function isUnsignedInteger (s) {
     return (s.toString().search(/^[0-9]+$/) == 0);
}
function parseLabelList(labellist) {
    return labellist.replace(new RegExp(' ', 'g'), '').split(',');
}

function querifyLabelList(field_id, labellist) {
    var labels = parseLabelList(labellist);
    var clause = '(';
    if (labels.length < 1) return '';
    labels.forEach(function(label) {
        clause += ' `' + field_id + '` ' + parseLabel(label);
        clause += ' or'
    });
    clause = clause.slice(0, -3);
    clause += ')';
    return clause;
}

function parseLabel(label) {
    var return_label = label.toUpperCase();
    if (return_label.length > 1 && (return_label.indexOf('*') >= 0 || return_label.indexOf('%') >= 0)) {
        return 'like \'' + return_label.replace(new RegExp('[*%]', 'g'), '%25') + '\'';
    } else {
        return '=\'' + return_label + '\'';
    }
}

function parseAnnotationList(feature) {
    var list = [];
    var annotations = null;
    if (feature.source == 'GNAB') {
        list = feature.label_mod.split('_');
        annotations = (list[0] == 'dom' ? 'domain ' + list[1] + '-' + list[2] : '');
        list = (annotations == '' ? list : list.slice(3));
        annotations = annotations + list.map(translateGNABAnnotation).filter(function(a) {
            return a != '';
        }).join(', ');
    }
    else if (feature.source == 'CNVR') {
        list = feature.label_mod.split('_');
        annotations = list.map(translateCNVRAnnotation).join(', ');
    }
    else {
         annotations = feature.label_mod == '' ? annotations : feature.label_mod;
    }
    return annotations;
}

function translateGNABAnnotation(annotation) {
    switch (annotation) {
    case ('mut'):
        return '';
        break;
    case ('nonsilent'):
        return 'nonsilent';
        break;
    case ('dna_bin'):
        return 'any';
        break;
    default:
        return annotation;
        break;
    }
}


function translateCNVRAnnotation(annotation) {
    switch (annotation) {
    case ('del'):
        return 'deletion';
        break;
    case ('amp'):
        return 'amplification';
        break;
    case ('ins'):
        return 'insertion';
        break;
    default:
        return annotation;
        break;
    }
}


/**
 http://www.webtoolkit.info/javascript-base64.html
 */


var Base64 = {

    // private property
    _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

    // public method for encoding
    encode: function(input) {
        var output = "";
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;

        input = Base64._utf8_encode(input);

        while (i < input.length) {

            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);

            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;

            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }

            output = output + this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) + this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);

        }

        return output;
    },
    // private method for UTF-8 encoding
    _utf8_encode: function(string) {
        string = string.replace(/\r\n/g, "\n");
        var utftext = "";

        for (var n = 0; n < string.length; n++) {

            var c = string.charCodeAt(n);

            if (c < 128) {
                utftext += String.fromCharCode(c);
            } else if ((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            } else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }

        }

        return utftext;
    }
};

/*
 Misc data/file retrieval
 */

function postData(url, data, success, fail) {
    var form = document.createElement('form');
    form.setAttribute('style', 'display:none');
    form.setAttribute('action', url);
    form.setAttribute('method', 'post');
    var params = {
        'data': Base64.encode(data)
    };
    Object.keys(params).forEach(function(key) {
        var hiddenField = document.createElement("input");
        hiddenField.setAttribute("type", "hidden");
        hiddenField.setAttribute("name", key);
        hiddenField.setAttribute("value", params[key]);
        form.appendChild(hiddenField);
    });
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);

}

function downloadData(data, filename, in_format, out_format) {

    function dataSuccess(response) {}

    function dataFail(response) {}
    var url = re.node.uri + re.node.services.data + re.rest.echo + '/' + filename.split('.')[0] + '/' + in_format;
    postData(url, data, dataSuccess, dataFail);
}

function binData(values){
        var quartiles = pv.Scale.quantile(values).quantiles(4).quantiles();
        //Freedman-Diaconis' choice for bin size
        var setSize = 2 * (quartiles[3] - quartiles[1]) / Math.pow(values.length,0.33);
        var max =pv.max(values), min = pv.min(values);
        //max # of bins is 10
        setSize = (max - min)/setSize >= 9 ? (max - min) / 10 : setSize;
        var firstBin = min+setSize/2;
        var bins = pv.range(firstBin,max-setSize/2+setSize/10,setSize);
            return function(val) {
                return bins[Math.min(Math.max(Math.floor((val-firstBin) / setSize),0),bins.length-1)];
                };
}

function convertData(data, filename, in_format, out_format) {
    function dataSuccess(response) {}

    function dataFail(response) {}

    var url = re.node.uri + re.node.services.data + re.rest.convert + '/' + filename.split('.')[0] + '/' + in_format + '/' + out_format;
    postData(url, data, dataSuccess, dataFail);

}

var serializeSVG = function(elem) {
    var out = "",
        indent = 0;

    SvgToString = function(elem) {
        if (elem) {
            var attrs = elem.attributes;
            var attr;
            var i;
            var childs = elem.childNodes;

            for (i = 0; i < indent; i++) out += "  ";
            out += "<" + elem.nodeName;
            for (i = attrs.length - 1; i >= 0; i--) {
                attr = attrs.item(i);
                out += " " + attr.nodeName + "=\"" + attr.nodeValue + "\"";
            }

            if (elem.hasChildNodes()) {
                out += ">\n";
                indent++;
                for (i = 0; i < childs.length; i++) {
                    if (childs.item(i).nodeType == 1) // element node ..
                    SvgToString(childs.item(i));
                    else if (childs.item(i).nodeType == 3) // text node ..
                    {
                        for (j = 0; j < indent; j++) out += "  ";
                        out += childs.item(i).nodeValue + "\n";
                    }
                }
                indent--;
                for (i = 0; i < indent; i++) out += "  ";
                out += "</" + elem.nodeName + ">\n";
            } else {
                out += " />\n";
            }

        }
        return out;
    };

    return SvgToString(elem);
};

re.setRingHidden = function(ring, value) {
    re.display_options.circvis.rings[ring].hidden = value;
};

re.isRingHidden = function(ring) {
    return re.display_options.circvis.rings[ring]['hidden'];
};


re.build_tooltips = function() {

    re.display_options.circvis.tooltips.karyotype_feature = {
           'Cytogenetic Band' : function(feature) { return  vq.utils.VisUtils.options_map(feature)['label'];},
           Location :  function(feature) { return 'Chr' + feature.chr + ' ' + feature.start + '-' + feature.end;}
       };
    re.display_options.circvis.tooltips.unlocated_feature[re.ui.feature1.label] =  function(feature) { return feature.sourceNode.source + ' ' + feature.sourceNode.label +
           (feature.sourceNode.chr ? ' Chr'+ feature.sourceNode.chr : '') +
           (feature.sourceNode.start > -1 ? ' '+ feature.sourceNode.start : '') +
           (!isNaN(feature.sourceNode.end) ? '-'+ feature.sourceNode.end : '')  + ' '+
           feature.sourceNode.label_mod;};
    re.display_options.circvis.tooltips.unlocated_feature[re.ui.feature2.label] = function(feature) { return feature.targetNode.source + ' ' + feature.targetNode.label +
           (feature.targetNode.chr ? ' Chr'+ feature.targetNode.chr : '') +
           (feature.targetNode.start > -1 ? ' '+ feature.targetNode.start : '') +
           (!isNaN(feature.targetNode.end) ? '-'+ feature.targetNode.end : '')  + ' ' +
           feature.targetNode.label_mod;};

    re.model.association.types.forEach( function(assoc) {
           vq.utils.VisUtils.extend(re.display_options.circvis.tooltips.unlocated_feature, assoc.vis.tooltip.entry);
       });

   re.display_options.circvis.tooltips.edge[re.ui.feature1.label] = function(link) { return link.sourceNode.label+ ' ' + link.sourceNode.source + ' Chr' + link.sourceNode.chr + ' ' + link.sourceNode.start +
       '-' + link.sourceNode.end + ' ' +link.sourceNode.label_mod;};

   re.display_options.circvis.tooltips.edge[re.ui.feature2.label] = function(link) { return link.targetNode.label+ ' ' + link.targetNode.source + ' Chr' + link.targetNode.chr + ' ' + link.targetNode.start +
       '-' + link.targetNode.end + ' ' + link.targetNode.label_mod;};

   re.model.association.types.forEach(function(assoc) {
            vq.utils.VisUtils.extend(re.display_options.circvis.tooltips.edge, assoc.vis.tooltip.entry);
       });

   re.display_options.circvis.tooltips.link_objects.forEach(function(link) {
       re.display_options.circvis.tooltips.feature_links[link.label] = link.config_object;
   });

};

