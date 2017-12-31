var RefExtractor = (function() {

window.savedItemsString = "";

var inputElement = document.getElementById("file_upload");
inputElement.addEventListener("change", handleFileSelect, false);

function handleFileSelect(event) {
    var extractedFields = [];
    document.getElementById("extract_count").innerHTML = "";
    document.getElementById("selected_style").innerHTML = "";

    var file = event.target.files[0];
    
    function extractFields(xmlWordFile) {
        var fields = [];
        
        var parsedDOM = new DOMParser().parseFromString(xmlWordFile, 'text/xml');
        var fieldElements = parsedDOM.getElementsByTagName("w:instrText");

        for (var i = 0; i < fieldElements.length; i++) {
            fields.push(fieldElements[i].textContent);
        }
        
        return(fields);
    }

    JSZip.loadAsync(file).then(function(zip) {
        // "word/document.xml" seems to contain "author-date" style CSL citations
        // "word/footnotes.xml" seems to contain "note" style CSL citations
        filesToExtract = ["word/document.xml", "word/footnotes.xml"];
        
        // Get file names within zip file
        filesInZip = Object.keys(zip.files);
        
        // Array intersection (per https://stackoverflow.com/a/1885569/1712389) to identify which files are present
        filesToExtract = filesInZip.filter((n) => filesToExtract.includes(n));
        
        // Relied on example at https://github.com/Stuk/jszip/issues/375#issuecomment-258969023 to extract multiple files
        zipEntries = filesToExtract.map(function (name) {
            return zip.files[name];
        });
        
        var listOfPromises = zipEntries.map(function(entry) {
            return entry.async("string").then(function (data) {
              return extractFields(data);
            });
        });
        
        var promiseOfList = Promise.all(listOfPromises);
        
        promiseOfList.then(function (list) {
            extractedFields = list.reduce(function (accumulator, current) {
                return accumulator.concat(current);
            }, []);
            
            processExtractedFields(extractedFields);
        });
        
        // Show CSL style used in document; Currently only works for Zotero documents
        zip.file("docProps/custom.xml").async("string").then(function(data) {
            var parsedDOM = new DOMParser().parseFromString(data, 'text/xml');
            var fields = parsedDOM.querySelectorAll("property[name^=ZOTERO_PREF]>*");

            var zoteroPrefs = "";
            for (var i = 0; i < fields.length; i++) {
                zoteroPrefs += fields[i].textContent;
            }
            
            if (zoteroPrefs.length > 0) {
                parsedDOM = new DOMParser().parseFromString(zoteroPrefs, 'text/xml');
                var selectedStyle = parsedDOM.querySelector("style[id]");
                if (selectedStyle) {
                    document.getElementById("selected_style").innerHTML = "CSL style ID used in document: " + selectedStyle["id"];
                }
            }
        });

    }, function(error) {
        document.getElementById("extract_count").innerHTML = "Error reading " + file.name;
        
        document.getElementById("download").setAttribute("disabled", "true");
        document.getElementById("copy_to_clipboard").setAttribute("disabled", "true");
    });
}

function processExtractedFields(fields) {
    // Isolate CSL cites
    var savedCites = [];

    for (var i = 0; i < fields.length; i++) {
      var field = fields[i].trim();
      
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
    
    var identifiedCitesCount = savedCites.length;
    savedCites = deduplicateCites(savedCites);
    var deduplicatedCitesCount = savedCites.length;
    savedItems = extractMetadata(savedCites);
    var extractedCiteCount = savedCites.length;
    
    var duplicateCount = identifiedCitesCount - deduplicatedCitesCount;
    var missingMetadataCount = deduplicatedCitesCount - extractedCiteCount;
    
    var citeCountFeedback = "";
    if (extractedCiteCount > 0) {
        savedItemsString = JSON.stringify(savedItems);
        
        document.getElementById("copy_to_clipboard").setAttribute("data-clipboard-text", savedItemsString);
        
        if (extractedCiteCount == 1) {
            citeCountFeedback = "1 reference extracted.";
        } else {
            citeCountFeedback = savedItems.length + " references extracted.";
        }
        if (duplicateCount > 0) {
            citeCountFeedback += " (" + duplicateCount + " duplicates removed)";
        }
        if (missingMetadataCount > 0) {
            citeCountFeedback += " (" + missingMetadataCount + " items without metadata)";
        }
        document.getElementById("extract_count").innerHTML = citeCountFeedback;
        
        document.getElementById("download").removeAttribute("disabled");
        document.getElementById("copy_to_clipboard").removeAttribute("disabled");
    } else {
        document.getElementById("copy_to_clipboard").setAttribute("data-clipboard-text", "");
        
        citeCountFeedback = "No references extracted.";
        if (missingMetadataCount > 0) {
            citeCountFeedback += " (" + missingMetadataCount + " items without metadata)";
        }
        document.getElementById("extract_count").innerHTML = citeCountFeedback;
        
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
      
      // Store cite count
      deduplicationArray[i].count = matchingCites.length;
      
      // Add cite count to item metadata, if pref is set
      if (addCitationCounts) {
        if (deduplicationArray[i].hasOwnProperty("item")) {
          if (!deduplicationArray[i].item.hasOwnProperty("note")) {
            deduplicationArray[i].item.note = "";
          }
          deduplicationArray[i].item.note = "Times cited: " + deduplicationArray[i].count + "\n" + deduplicationArray[i].item.note;
        }
      }
      
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
  
  // Delete duplicate items
  deduplicationArray = deduplicationArray.filter(cite => duplicateIndices.indexOf(cite.index) == -1);
  
  deduplicatedCites = [];
  for (let i = 0; i < deduplicationArray.length; i++) {
    if (deduplicationArray[i].hasOwnProperty("item")) {
      deduplicatedCites[i] = {};
      deduplicatedCites[i].itemData = deduplicationArray[i].item;
    }
  }
  
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
