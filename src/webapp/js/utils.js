
vq.utils.VisUtils.extend(re, {
    functions: {

        parseFeatureLabel : function(alias) {
            var feature = alias.split(':');
            return {type:feature[0],source:feature[1],label:feature[2],chr:feature[3],
                start:feature[4],stop:feature[5],strand:feature[6],modifier:feature[7]};
        },
        getValueToLabelFunction: function(alias) {
            var feature = re.functions.parseFeatureLabel(alias);
            var value_map = {'NA' : 'NA'};
            if (!!~feature.label.indexOf('I(')) {
                var values = feature.label.slice(2,-1);
                var conditions = values.split('|');
                if (conditions.length > 1) {
                    var alternatives = conditions[0].split(',');
                    if (alternatives.length > 1) {
                        value_map['0'] = 'Yes for ' + alternatives[1]; value_map['1'] = 'Yes for ' + alternatives[0];
                    } else {
                        value_map['0'] = 'Not ' + alternatives[0]; value_map['1'] = 'Yes ' + alternatives[0];
                    }
                } else{
                    value_map['0'] = 'False'; value_map['1'] = 'True';
                }
            } else if (feature.type === 'B' && feature.source === 'GNAB') {
                value_map['0'] = 'Non-mutated';
                value_map['1'] = 'Mutated';
            }
            if (Object.keys(value_map).length > 1) {
                return function(value) {
                        return value_map[value] ? value_map[value] : value;
                };
            } else {
                return null;
            }
        },

        assignValueColors : function(value_array) {
            var uniq_values = pv.uniq(value_array);
            
            var plot_obj = re.plot;
            var color_obj = plot_obj.colors;
            var color_map = {'NA':color_obj.categorical_values['NA']};
            var num_colors = color_obj.category_colors.length
            if (uniq_values.length > num_colors +1) { return pv.Colors.category10(uniq_values); }
            var index = 0;
            uniq_values.forEach(function(val) { 
                if (color_obj.categorical_values[val]){
                    color_map[val] = color_obj.categorical_values[val];
                }else if (plot_obj.category_equivalents[val]){
                    color_map[val] = color_obj.categorical_values[plot_obj.category_equivalents[val]];
                } else {
                    color_map[val] = color_obj.category_colors[index];
                    index = index + 1;
                    if (index >= num_colors) { return color_map;}
                }
            });
            return color_map;
        },

        convertChrListToQueryClause: function(list_str, column_name) {
            var tokens = list_str.split(',').map(trim).map(unescapeComma);            
            var and_tokens = new Array();
            var or_tokens = new Array();
            //split the list into inclusions/or's and exclusions/!(and)'s
            tokens.forEach(function(a){
                if (a.charAt(0) == '!') {
                    and_tokens.push(a.slice(1));
                }
                else  //take all characters after the !
                    or_tokens.push(a);
            }); 
            var clause = '';
            if (and_tokens.length) {
                clause = '(';
                var u;
                while ((u=and_tokens.pop()) != null) {
                   clause += column_name + '!=\'' + u + '\' and '; 
                }
                clause = clause.slice(0,-5) + ')';
            }
            else {
            var t;
                if (or_tokens.length){
                    clause = '(';
                    while ((t = or_tokens.pop()) != null) {              
                        clause += column_name + '=\'' + t + '\' or ';
                    }
                    clause =  clause.slice(0,-4) + ')';
                }
            }
            return clause;
        },
    
        parseLabelList: function(list_str) {
            return list_str.trim().split(',').map(trim).filter(function(s) { return s !== ''; }).map(unescapeComma);
        },

        parseSolrLabel: function(label) {
            return !~label.indexOf('*') ? '"' + label + '"' : label;
        },

      convertListToSolrQueryClause: function(list_str, column_name) {
                   var tokens = re.functions.parseLabelList(list_str);     
                   var and_tokens = new Array();
                   var or_tokens = new Array();
                   //split the list into inclusions/or's and exclusions/!(and)'s
                   tokens.forEach(function(a){
                    var b = a.replace(new RegExp('[*%]', 'g'), '*');
                       if (a.charAt(0) == '!') {
                           and_tokens.push(b.slice(1));
                       }
                       else  //take all characters after the !
                           or_tokens.push(b);
                   });
                   var clause = '';
                   if (and_tokens.length) {
                       clause +='-' + column_name + ':(';
                       var u;
                       while ((u=and_tokens.pop()) != null) {
                          clause +=  re.functions.parseSolrLabel(u); //don't add quotes for wildcard
                       }
                       clause += ')';
                   }
                       if (or_tokens.length){
                           var t;
                           clause += '+' + column_name + ':(';
                           while ((t = or_tokens.pop()) != null) {
                                 clause +=  re.functions.parseSolrLabel(t);
                           }
                           clause += ')';
                   }
                   return clause;
               }
    }
});

var isFunction = function(obj) {
      return typeof obj === 'function';
    };

var has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };


 // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] == a) return bStack[length] == b;
    }
    // Objects with different constructors are not equivalent, but `Object`s
    // from different frames are.
    var aCtor = a.constructor, bCtor = b.constructor;
    if (aCtor !== bCtor && !(isFunction(aCtor) && (aCtor instanceof aCtor) &&
                             isFunction(bCtor) && (bCtor instanceof bCtor))) {
      return false;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Deep compare objects.
      for (var key in a) {
        if (has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  function isEqual(a, b) {
    return eq(a, b, [], []);
  };


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

function solr_flex_field_query(label, value, fn) {
    var qparam = '';
    if (value + '' != '') {
        if (fn == 'Btw') {
            qparam += '+' + label + ':[-' + value + ' TO ' + value + ']';
        } else if (fn == '<=') {
            qparam += '+' + label +':[* TO ' + value + ']';
        } else if (fn == '>=') {
            qparam += '+' + label +':[' + value + ' TO *]';
        } else {
            if (parseFloat(value) != '0') {
                qparam += '-' + label + ':[-'+value+' TO ' + value + ']';
            }
        }
    }
    return qparam;
}

function escapeComma(string) {
    return string.replace(",","%2C");
}

function unescapeComma(string) {
    return string.replace("%2C",",");
}

function trim (str) {
    return str.replace(/^\s+/, '').replace(/\s+$/, '');
}
     
// Tests if s is an unsigned integer
function isUnsignedInteger (s) {
     return (s.toString().search(/^[0-9]+$/) == 0);
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