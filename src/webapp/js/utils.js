
function flex_field_query(label, value, fn) {
    var where = '';
    if (value != '') {
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
    if (label.length > 1  && (label.indexOf('*')>=0 || label.indexOf('%')>=0)) {
        return 'like \'' + label.replace(new RegExp('[*%]', 'g'),'%25') + '\'';
    } else {
        return '=\'' + label + '\'';
    }
}
