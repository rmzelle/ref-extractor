var RefExtractor = (function() {

window.savedItemsString = "";

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
    // Isolate CSL items
    var savedItems = [];
    var savedItemURIs = [];

    for (var i = 0; i < extractedFields.length; i++) {
      var field = extractedFields[i].trim();
      
      // test if field is a Zotero or Mendeley field
      // Zotero fields are prefixed with "ADDIN ZOTERO_ITEM CSL_CITATION"
      // Mendeley fields are prefixed with "ADDIN CSL_CITATION"
      var cslFieldPrefix = /^ADDIN (ZOTERO_ITEM )?CSL_CITATION/;
      if (cslFieldPrefix.test(field)) {
        field = field.replace(cslFieldPrefix,"").trim();
        
        // parse rest of field content as JSON
        try {
          var fieldObject = {};
          fieldObject = JSON.parse(field);
          if (fieldObject.hasOwnProperty("citationItems")) {
            for (var j = 0; j < fieldObject.citationItems.length; j++) {
              var item = fieldObject.citationItems[j];
              if (item.hasOwnProperty("itemData")) {
                // Only save items with a set of uris we haven't yet encountered.
                // (this eliminates duplicate entries for items cited multiple times)
                // Note that Zotero seems to ensure unique ids for distinct items,
                // while Mendeley seems to restart id numbering for each citation,
                // so it seems saver to compare uris.
                itemHasUniqueURIs = true;
                if (item.hasOwnProperty("uris")) {
                  for (let k = 0; k < item.uris.length; k++) {
                    if (savedItemURIs.indexOf(item.uris[k]) == -1 ) {
                      savedItemURIs.push(item.uris[k]);
                    } else {
                      itemHasUniqueURIs = false;
                    }
                  }
                }
                
                if (itemHasUniqueURIs) {
                  savedItems.push(item.itemData);
                }
              }
            }
          }
        }
        catch (e) {}
      }
    }
    
    if (savedItems.length > 0) {
        savedItemsString = JSON.stringify(savedItems);
        
        document.getElementById("copy_to_clipboard").setAttribute("data-clipboard-text", savedItemsString);
        
        if (savedItems.length == 1) {
            document.getElementById("extract_count").innerHTML = "1 reference extracted.";
        } else {
            document.getElementById("extract_count").innerHTML = savedItems.length + " references extracted.";
        }
        
        document.getElementById("download").removeAttribute("disabled");
        document.getElementById("copy_to_clipboard").removeAttribute("disabled");
    } else {
        document.getElementById("copy_to_clipboard").setAttribute("data-clipboard-text", "");
        
        document.getElementById("extract_count").innerHTML = "No references extracted.";
        
        document.getElementById("download").setAttribute("disabled", "true");
        document.getElementById("copy_to_clipboard").setAttribute("disabled", "true");
    }
}

document.getElementById("download").addEventListener("click", function(){
    var blob = new Blob([savedItemsString], {
        type: "text/plain;charset=utf-8"
    });
    saveAs(blob, "ref-extracts.json");
});

var clipboard = new Clipboard('#copy_to_clipboard');

// Provide some feedback on button click
clipboard.on('success', function(e) {
    var copyButton = document.getElementById("copy_to_clipboard");
    var oldButtonText = copyButton.innerHTML;
    copyButton.innerHTML = "Copied!";
    window.setTimeout(function () {
        copyButton.innerHTML = oldButtonText;
    }, 2000);
});

}());
