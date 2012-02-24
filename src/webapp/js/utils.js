
function flex_field_query(label, value, fn) {
    var where = '';
    if (value + '' != '') {
        if (fn == 'Btw'){
            where += '(' + label + ' >= -' +value + ' and '+ label + ' <= ' + value +')';
        }else if (fn == '<='){
            where += '('+ label + ' <= ' + value +')';
        }else if (fn == '>='){
            where += '('+ label + ' >= ' +value +')';
        }else{
            if (parseFloat(value) != '0' ) {
                where += '('+ label + ' >= ' +value + ' or '+ label + ' <= -' + value +')';
            }
        }
    }
    return where;

}


function parseLabelList(labellist) {
    return labellist.replace(new RegExp(' ','g'),'').split(',');
}

function querifyLabelList(field_id,labellist) {
    var labels = parseLabelList(labellist);
    var clause = '(';
    if (labels.length < 1) return '';
    labels.forEach( function(label) {
        clause += ' `' + field_id + '` ' + parseLabel(label);
        clause += ' or'
    });
    clause = clause.slice(0,-3);
    clause += ')';
    return clause;
}

function parseLabel(label) {
    var return_label = label.toUpperCase();
    if (return_label.length > 1  && (return_label.indexOf('*')>=0 || return_label.indexOf('%')>=0)) {
        return 'like \'' + return_label.replace(new RegExp('[*%]', 'g'),'%25') + '\'';
    } else {
        return '=\'' + return_label + '\'';
    }
}

function parseAnnotationList(feature) {
    var list =[];
    var annotations = null;
    if (feature.source == 'GNAB') {
        list = feature.label_mod.split('_');
        annotations = (list[0] == 'dom' ? 'domain '+ list[1] + '-' + list[2] : '');
        list = ( annotations == '' ? list : list.slice(3));
        annotations = annotations +  list.map(translateGNABAnnotation).filter(function(a) { return a != '';}).join(', ');
    }

    if (feature.source == 'CNVR') {
            list = feature.label_mod.split('_');
            annotations = list.map(translateCNVRAnnotation).join(', ');
        }

    return annotations;
}

function translateGNABAnnotation(annotation) {
    switch(annotation){
        case('mut'):
            return '';
            break;
        case('nonsilent'):
            return 'nonsilent';
            break;
        case('dna_bin'):
                    return 'any';
                    break;
        default:
            return annotation;
            break;
    }
}


function translateCNVRAnnotation(annotation) {
    switch(annotation){
        case('del'):
            return 'deletion';
            break;
        case('amp'):
            return 'amplification';
            break;
        case('ins') :
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
_keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

// public method for encoding
encode : function (input) {
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

        output = output +
        this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
        this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);

    }

    return output;
},
    	// private method for UTF-8 encoding
	_utf8_encode : function (string) {
		string = string.replace(/\r\n/g,"\n");
		var utftext = "";

		for (var n = 0; n < string.length; n++) {

			var c = string.charCodeAt(n);

			if (c < 128) {
				utftext += String.fromCharCode(c);
			}
			else if((c > 127) && (c < 2048)) {
				utftext += String.fromCharCode((c >> 6) | 192);
				utftext += String.fromCharCode((c & 63) | 128);
			}
			else {
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

function postData(url, data,success,fail) {
    var form = document.createElement('form');
    form.setAttribute('style','display:none');
    form.setAttribute('action',url);
    form.setAttribute('method','post');
    var params = {'data' : Base64.encode(data)};
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


function downloadData(data,filename, in_format,out_format) {

    function dataSuccess(response) {
    }

    function dataFail(response) {
    }
    var url = re.node.uri + re.node.services.data + re.rest.echo+'/'+filename.split('.')[0] +'/' + in_format;
    postData(url,data,dataSuccess, dataFail);
}

function convertData(data,filename, in_format,out_format) {
    function dataSuccess(response) {
    }

    function dataFail(response) {
    }

    var url = re.node.uri + re.node.services.data + re.rest.convert+'/'+filename.split('.')[0] +'/' + in_format + '/' + out_format;
    postData(url,data,dataSuccess, dataFail);

}

