
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
    var annotations = '';
    if (feature.source == 'GNAB') {
        list = feature.label_mod.split('_');
        annotations = (list[0] == 'dom' ? list[1] + '-' + list[2] : '');
        list = ( annotations == '' ? list : list.slice(3));
//        annotations = annotations + (list.length > 0 ? list.join(', ') :'any');
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