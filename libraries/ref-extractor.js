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
    // Isolate CSL cites
    var savedCites = [];

    for (var i = 0; i < extractedFields.length; i++) {
      var field = extractedFields[i].trim();
      
      // Test if field is a Zotero or Mendeley field
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
              let cite = fieldObject.citationItems[j];
              savedCites.push(cite);
            }
          }
        }
        catch (e) {}
      }
    }
    
    savedCites = deduplicateCites(savedCites);
    
    savedItems = extractMetadata(savedCites);
    
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

function deduplicateCites(cites) {
  addCitationCounts = false;
  if (add_citation_counts_toggle.checked) {
      addCitationCounts = true;
  }
  
  // create a nested array with items, their extracted uris, and their citation counts
  var deduplicationArray = [];
  for (let i = 0; i < cites.length; i++) {
    let cite = cites[i];
    deduplicationArray[i] = {};
    if (cite.hasOwnProperty("itemData")) {
      deduplicationArray[i].item = cite.itemData;
    }
    if (cite.hasOwnProperty("uris")) {
      deduplicationArray[i].uris = cite.uris;
    }
    deduplicationArray[i].count = 1;
    deduplicationArray[i].index = i;
  }
  
  //DEBUG window.testje = deduplicationArray;
  
  // first, use Array.prototype.filter() to find loop over all items,
  // and for each item find the items with one or more matching URIs. Then add
  // all the URIs of those matching items to the query item to complete its URI pool
  
  // First pass normalizes cite URIs. It's not uncommon for cites to have more
  // than one URI, which can e.g. happen if two items with unique URIs were
  // merged into a single item.
  //
  // The normalization addresses the (hypothetical) case where:
  // cite 1 has URIs: ["A"]
  // cite 2 has URIs: ["A", "C"]
  // cite 3 has URIs: ["C"]
  // cite 4 has URIs: ["B"]
  // I'm not sure this ever occurs, but here cites 1-3 should be considered
  // to be the same item. The purpose of the first pass is to assign ["A", "C"] to
  // cites 1-3 in the example above.
  for (let i = 0; i < deduplicationArray.length; i++) {
    for (let j = 0; j < deduplicationArray[i].uris.length; j++) {
      // for each URI in each cite, find cites with matching URIs
      let uri = deduplicationArray[i].uris[j];
      let matchingCites = [];
      matchingCites = deduplicationArray.filter(cite => cite.uris.indexOf(uri) != -1);
       
      for (let k = 0; k < matchingCites.length; k++) {
        let newUris = [];
        newUris = matchingCites[k].uris.filter(matchUri => deduplicationArray[i].uris.indexOf(matchUri) == -1);
        if (newUris.length > 0) {
          // Extends URIs array we're looping over!
          deduplicationArray[i].uris.concat(newUris);
        }
      }
    }
  }

  // Second pass
  // Only keep first occurrence of each item, and keep track of duplicate count.
  var duplicateIndices = [];
  for (let i = 0; i < deduplicationArray.length; i++) {
    // Only have to check one URI per cite now at most
    if (deduplicationArray[i].uris.length > 0) {
      let uri = deduplicationArray[i].uris[0];
      
      // Find matching cites
      let matchingCites = [];
      matchingCites = deduplicationArray.filter(cite => cite.uris.indexOf(uri) != -1);
      
      // Store match count
      deduplicationArray[i].count = matchingCites.length;
      
      // Mark other cites for deletion (via index property)
      for (let j = 0; j < matchingCites.length; j++) {
        matchingCiteIndex = matchingCites[j].index;
        if (matchingCiteIndex > deduplicationArray[i].index) {
          if (duplicateIndices.indexOf(matchingCiteIndex) == -1) {
            duplicateIndices.push(matchingCites[j].index);
          }
        }
      }
    }
  }
  
  console.log(duplicateIndices);
  console.log(duplicateIndices.length);
  
  // Actually delete items (dunn, dunn, dunnnnn)
  console.log(cites.length);
  deduplicationArray = deduplicationArray.filter(cite => duplicateIndices.indexOf(cite.index) == -1);
  
  deduplicatedCites = [];
  for (let i = 0; i < deduplicationArray.length; i++) {
    if (deduplicationArray[i].hasOwnProperty("item")) {
      deduplicatedCites[i] = {};
      deduplicatedCites[i].itemData = deduplicationArray[i].item;
      console.log(deduplicationArray[i].count);
    }
  }
  console.log(deduplicatedCites.length);
  
  // Still need to add citation counts to items (if pref is set)!!
  
        // if (uniqueURIs.indexOf(itemSet.uris[j]) == -1 ) {
        //   uniqueURIs.push(itemSet.uris[j]);
        // } else {
        //   itemHasUniqueURIs = false;
        // }
  
    
    

  
  // var itemURIs = [];
  // 
  // // Only save items with a set of uris we haven't yet encountered.
  // // (this eliminates duplicate entries for items cited multiple times)
  // // Note that Zotero seems to ensure unique ids for distinct items,
  // // while Mendeley seems to restart id numbering for each citation,
  // // so it seems saver to compare uris.
  // itemHasUniqueURIs = true;
  // if (item.hasOwnProperty("uris")) {
  //   for (let k = 0; k < item.uris.length; k++) {
  //     if (savedItemURIs.indexOf(item.uris[k]) == -1 ) {
  //       savedItemURIs.push(item.uris[k]);
  //     } else {
  //       itemHasUniqueURIs = false;
  //     }
  //   }
  // }
  
  // if (itemHasUniqueURIs) {
  //   savedItems.push(item.itemData);
  // }
  
  return deduplicatedCites;
}

function extractMetadata(items) {
  metadataOnlyItems = [];
  
  for (let i = 0; i < items.length; i++) {
    let item = items[i];
    if (item.hasOwnProperty("itemData")) {
      metadataOnlyItems.push(item.itemData);
    }
  }
  
  return metadataOnlyItems;
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
