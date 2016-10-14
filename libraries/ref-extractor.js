var RefExtractor = (function() {

window.extractedFieldsString = "";

// On successful file selection, extract fields with (customized) mammoth.
// (extracted fields are stored in global "extractedFields" variable)
var inputElement = document.getElementById("file_upload");
inputElement.addEventListener("change", handleFileSelect, false);

function handleFileSelect(event) {
    window.extractedFields = [];
    
    readFileInputEventAsArrayBuffer(event, function(arrayBuffer) {
        mammoth.convertToHtml({arrayBuffer: arrayBuffer})
            .then(processExtractedFields)
            .done();
    });
}

function readFileInputEventAsArrayBuffer(event, callback) {
    var file = event.target.files[0];

    var reader = new FileReader();
    
    reader.onload = function(loadEvent) {
        var arrayBuffer = loadEvent.target.result;
        callback(arrayBuffer);
    };
    
    reader.readAsArrayBuffer(file);
}

function processExtractedFields(result) {
    // Isolate Zotero fields
    var zoteroFields = [];
    var zoteroFieldIDs = [];

    for (var i = 0; i < extractedFields.length; i++) {
      var field = extractedFields[i].trim();
      
      // test if field starts with "ADDIN ZOTERO_ITEM CSL_CITATION"
      var zoteroFieldPrefix = "ADDIN ZOTERO_ITEM CSL_CITATION";
      if (field.startsWith(zoteroFieldPrefix)) {
        field = field.replace(zoteroFieldPrefix,"").trim();
        
        // parse rest of field content as JSON
        try {
          var fieldObject = {};
          fieldObject = JSON.parse(field);
          if (fieldObject.hasOwnProperty("citationItems")) {
            for (var j = 0; j < fieldObject.citationItems.length; j++) {
              var zoteroItem = fieldObject.citationItems[j];
              if (zoteroItem.hasOwnProperty("itemData")) {
                // Only save items with an id we haven't yet encountered.
                // (this eliminates duplicate entries for items cited multiple times)
                if (zoteroItem.itemData.hasOwnProperty("id") && zoteroFieldIDs.indexOf(zoteroItem.itemData.id) == -1 ) {
                    zoteroFieldIDs.push(zoteroItem.itemData.id);
                    zoteroFields.push(zoteroItem.itemData);
                }
              }
            }
          }
        }
        catch (e) {}
      }
    }
    
    if (zoteroFields.length > 0) {
        extractedFieldsString = JSON.stringify(zoteroFields);
        
        if (zoteroFields.length == 1) {
            document.getElementById("extract_count").innerHTML = "1 reference extracted.";
        } else {
            document.getElementById("extract_count").innerHTML = zoteroFields.length + " references extracted.";
        }
        
        document.getElementById("download").removeAttribute("disabled");
        //document.getElementById("copy_to_clipboard").removeAttribute("disabled");
    } else {
        document.getElementById("extract_count").innerHTML = "No references extracted.";
        
        document.getElementById("download").setAttribute("disabled", "disabled");
        //document.getElementById("copy_to_clipboard").setAttribute("disabled");
    }
}

document.getElementById("download").addEventListener("click", function(){
    var blob = new Blob([extractedFieldsString], {
        type: "text/plain;charset=utf-8"
    });
    saveAs(blob, "ref-extracts.json");
});

}());
