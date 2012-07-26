  
	// This will parse a delimited string into an array of
	// arrays. The default delimiter is the comma, but this
	// can be overriden in the second argument.
	function CSVToArray( strData, strDelimiter ){
		// Check to see if the delimiter is defined. If not,
		// then default to comma.
		strDelimiter = (strDelimiter || "\t");
 
		// Create a regular expression to parse the CSV values.
		var objPattern = new RegExp(
			(
				// Delimiters.
				"(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +
 
				// Quoted fields.
				"(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
 
				// Standard fields.
				"([^\"\\" + strDelimiter + "\\r\\n]*))"
			),
			"gi"
			);
 
 
		// Create an array to hold our data. Give the array
		// a default empty first row.
		var arrData = [];
 
		// Create an array to hold our individual pattern
		// matching groups.
		var arrMatches = null;
        var index = "";
 
	if (typeof(localStorage) == 'undefined' ) {
	    alert('Your browser does not support HTML5 localStorage. Try upgrading IE to 8');
	} 
		// Keep looping over the regular expression matches
		// until we can no longer find a match.
		while (arrMatches = objPattern.exec( strData )){
 
			// Get the delimiter that was found.
			var strMatchedDelimiter = arrMatches[ 1 ];
 
			// Check to see if the given delimiter has a length
			// (is not the start of string) and if it matches
			// field delimiter. If id does not, then we know
			// that this delimiter is a row delimiter.
			if (
				strMatchedDelimiter.length &&
				(strMatchedDelimiter != strDelimiter)
				){
 
				// Since we have reached a new row of data,
				// add an empty row to our data array.
				index = "";
			}
 
			// Now that we have our delimiter out of the way,
			// let's check to see which kind of value we
			// captured (quoted or unquoted).
			if (arrMatches[ 2 ]){
 
				// We found a quoted value. When we capture
				// this value, unescape any double quotes.
				var strMatchedValue = arrMatches[ 2 ].replace(
					new RegExp( "\"\"", "g" ),
					"\""
					);
 
			} else {
				// We found a non-quoted value.
				var strMatchedValue = arrMatches[ 3 ];
 
			}
            if (index === "")
            {
                index = strMatchedValue;
                arrData[index] = [];
                continue;
            }
			// Now that we have our value string, let's add
			// it to the data array.
			arrData[index].push( strMatchedValue );
		/*try {
			localStorage.setItem(index, strMatchedValue); //store the item in the database
		} catch (e) {
			if (e == QUOTA_EXCEEDED_ERR) {
				alert("Quota exceeded!");
			}
		}*/
		}
 
		// Return the parsed data.
		return( arrData );
	}
 

var getGeneName = (function() {

        var csvText =CSVToArray( ($.ajax({type: "GET", url: "data/integrated_hg19_refGene.tsv", async: false }).responseText));
//document.getElementById("test").innerHTML = jsonOBJ;
	//gtype = typeof gtype !== 'undefined' ? gtype : 'gene_desc';

        /*if (gtype == "entrez"){
        return getValue: function(value){
                var txt = csvText[value];

                if(typeof txt==="undefined")
                {
                    return "No Info";
                }
                else
                {
                if(txt[0] === "" || txt.size < 4){  return "None";}
                else{return txt[3;}
                }
            };
	}*/
       //if (gtype == "gene_desc"){
        return {
                getValue: function(value, gtype){
		gtype = typeof gtype !== 'undefined' ? gtype : 'gene_desc';
                var txt = csvText[value];
                
                if(typeof txt==="undefined")
                {
                    return "No Info";
                }
                else{
                if(txt[0] === ""){  
			return txt[1];
		} else{
			if (gtype == "entrez" && txt.length >= 3 ){
				return txt[2];
			}
			return txt[0];
		}
                }
            }
            };
	//}
}());

