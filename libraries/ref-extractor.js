var RefExtractor = (function() {

window.savedItemsString = "";
window.savedZoteroLibrarySelectors = {};

var Cite = require('citation-js');

var citationCountCheckboxElement = document.getElementById("add_citation_counts_toggle");
citationCountCheckboxElement.addEventListener("change", function(){
  document.getElementById("file_upload").value = null;
  pageReset();
  }, false);

var inputElement = document.getElementById("file_upload");
inputElement.addEventListener("change", handleFileSelect, false);

var outputElement = document.getElementById("output_format");
outputElement.addEventListener("change", handleFormatSelect, false);

function pageReset() {
    document.getElementById("extract_count").setAttribute("value", "0");
    document.getElementById("selected_style").setAttribute("value", "-");
    
    document.getElementById("download").setAttribute("disabled", "true");
    document.getElementById("copy_to_clipboard").setAttribute("data-clipboard-text", "");
    document.getElementById("copy_to_clipboard").setAttribute("disabled", "true");
    document.getElementById("zotero_item_selection_button").setAttribute("disabled", "true");
    document.getElementById("textArea").setAttribute("rows", "3");
    document.getElementById("textArea").value = "";
}

function handleFormatSelect(event) {
    document.getElementById("textArea").value = convertOutput();
}

function handleFileSelect(event) {
    var extractedFields = [];
    pageReset();
    
    var file = event.target.files[0];
    
    function extractFields(xmlOpenDocumentFile) {
        var fields = [];
        
        var parsedDOM = new DOMParser().parseFromString(xmlOpenDocumentFile, 'text/xml');
        
        var referenceMarks = parsedDOM.querySelectorAll("*|reference-mark-start[*|name]");
        
        for (var i = 0; i < referenceMarks.length; i++) {
            fields.push(referenceMarks[i].getAttribute('text:name'));
        }
        
        return(fields);
    }

    JSZip.loadAsync(file).then(function(zip) {
        filesToExtract = ["content.xml"];
        
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
        
        // Show CSL style used in document
        zip.file("content.xml").async("string").then(function(data) {
            var parsedDOM = new DOMParser().parseFromString(data, 'text/xml');
            var selectedCSLStyle = "";
            
            var selectedMendeleyCSLStyle = extractMendeleyCSLStyle(parsedDOM);
            var selectedZoteroCSLStyle = extractZoteroCSLStyle(parsedDOM);
            
            // Only use delimiter if both strings have non-zero lengths; https://stackoverflow.com/a/19903533/1712389
            selectedCSLStyle = [selectedMendeleyCSLStyle, selectedZoteroCSLStyle].filter(val => val).join(', ');
            
            function extractMendeleyCSLStyle(customXmlDOM) {
              var selectedStyle = "";
              var field = customXmlDOM.querySelector("property[name='Mendeley Recent Style Id 0_1']");
              
              if (field) {
                  selectedStyle = field.firstElementChild.textContent;
              }
              return selectedStyle;
            }
            
            function extractZoteroCSLStyle(customXmlDOM) {
              var selectedStyle = "";
              var fields = customXmlDOM.querySelectorAll("property[name^=ZOTERO_PREF]>*");

              var zoteroPrefs = "";
              for (var i = 0; i < fields.length; i++) {
                  zoteroPrefs += fields[i].textContent;
              }
              
              if (zoteroPrefs.length > 0) {
                  var lpwstrDOM = new DOMParser().parseFromString(zoteroPrefs, 'text/xml');
                  var selectedStyleNode = lpwstrDOM.querySelector("style[id]");
                  if (selectedStyleNode) {
                      selectedStyle = selectedStyleNode["id"];
                  }
              }
              return selectedStyle;
            }
            
            document.getElementById("selected_style").setAttribute("value", selectedCSLStyle.replace("http://www.zotero.org/styles/",""));

        });

    }, function(error) {
        document.getElementById("extract_count").setAttribute("value", "Error reading " + file.name);
    });
}

function processExtractedFields(fields) {
    // Isolate CSL cites
    var savedCites = [];

    for (var i = 0; i < fields.length; i++) {
      var field = fields[i].trim();
      
      // Test if field is a Zotero field
      // Zotero fields are prefixed with "ZOTERO_ITEM CSL_CITATION"
      var cslFieldPrefix = /^ZOTERO_ITEM CSL_CITATION/;
      if (cslFieldPrefix.test(field)) {
        field = field.replace(cslFieldPrefix,"").trim();
        // there is some kind of hash after the JSON, keep only the JSON
        field = field.replace(/(\{.+\}) [0-9A-Za-z]+$/, '$1');
        
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
    savedCites = extractMetadata(savedCites);
    var extractedCiteCount = savedCites.length;
    
    var duplicateCount = identifiedCitesCount - deduplicatedCitesCount;
    var missingMetadataCount = deduplicatedCitesCount - extractedCiteCount;
    
    var citeCountFeedback = "";
    if (extractedCiteCount > 0) {
        savedItemsString = JSON.stringify(savedCites, null, 2);
        
        document.getElementById("textArea").setAttribute("rows", "15");
        document.getElementById("textArea").value = convertOutput();
        
        if (extractedCiteCount == 1) {
            citeCountFeedback = "1 reference extracted";
        } else {
            citeCountFeedback = savedCites.length + " references extracted";
        }
        if (duplicateCount > 0) {
            citeCountFeedback += " (" + duplicateCount + " duplicates removed)";
        }
        if (missingMetadataCount > 0) {
            citeCountFeedback += " (" + missingMetadataCount + " items without metadata)";
        }
        document.getElementById("extract_count").setAttribute("value", citeCountFeedback);
        
        document.getElementById("download").removeAttribute("disabled");
        document.getElementById("copy_to_clipboard").removeAttribute("disabled");
    } else {
        citeCountFeedback = "No references extracted.";
        if (missingMetadataCount > 0) {
            citeCountFeedback += " (" + missingMetadataCount + " items without metadata)";
        }
        document.getElementById("extract_count").setAttribute("value", citeCountFeedback);
    }
    
    let linkList = document.getElementById("zotero_item_selection_link_list");
    while (linkList.firstChild) {
      linkList.removeChild(linkList.firstChild);
    }
    if (Object.keys(savedZoteroLibrarySelectors).length > 0) {
      for (var selector in savedZoteroLibrarySelectors) {
        var selectorText = "Select " + savedZoteroLibrarySelectors[selector].items.length + " item(s) for " + savedZoteroLibrarySelectors[selector].type.slice(0, -1) + " library " + savedZoteroLibrarySelectors[selector].subID;
        linkList.insertAdjacentHTML("beforeend", "<li><a href='" + savedZoteroLibrarySelectors[selector].selectionString + "'>" + selectorText + "</a></li>");
      }
      document.getElementById("zotero_item_selection_button").removeAttribute("disabled");
      savedZoteroLibrarySelectors = {};
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
      deduplicatedCites[i].uris = deduplicationArray[i].uris;
    }
  }
  
  return deduplicatedCites;
}

function extractMetadata(items) {
  metadataOnlyItems = [];
  zoteroItemKeys = [];
  
  for (let i = 0; i < items.length; i++) {
    let item = items[i];
    if (item.hasOwnProperty("itemData")) {
      metadataOnlyItems.push(item.itemData);
    }
    
    if (item.hasOwnProperty("uris")) {
      for (let j = 0; j < item.uris.length; j++) {
        if (item.uris[j].includes("http://zotero.org/")) {
          zoteroItemKeys.push(item.uris[j]);
        }
      }
    }
  }
  
  if (zoteroItemKeys.length > 0) {    
    var libraries = {};
    
    // Split keys over libraries (user library, group library/libraries)
    for (let i = 0; i < zoteroItemKeys.length; i++) {
      if (zoteroItemKeys[i].includes("zotero.org")) {
        var itemSelectorFields = [];
        var itemSelectionInfo = {};
        itemSelectorFields = zoteroItemKeys[i].replace("http://zotero.org/users/local/","http://zotero.org/users/").split("/");
        
        // Examples of split item URIs
        // [ "http:", "", "zotero.org", "users", "1386342", "items", "TANS5GUE" ]
        // [ "http:", "", "zotero.org", "groups", "227594", "items", "2TK9HDKD" ]
        if (itemSelectorFields.length == 7) {
          itemSelectionInfo.libraryType = itemSelectorFields[3];
          itemSelectionInfo.librarySubID = itemSelectorFields[4];
          itemSelectionInfo.itemKey = itemSelectorFields[6];
          
          var libraryURL = ["https://www.zotero.org", itemSelectionInfo.libraryType, itemSelectionInfo.librarySubID].join("/");
          
          // store item info within library collection
          if (libraries.hasOwnProperty(libraryURL)) {
            libraries[libraryURL].items.push(itemSelectionInfo.itemKey);
          } else {
            libraries[libraryURL] = {};
            libraries[libraryURL].items = [itemSelectionInfo.itemKey];
            libraries[libraryURL].type = itemSelectionInfo.libraryType;
            libraries[libraryURL].subID = itemSelectionInfo.librarySubID;          
          }
        }
      }
    }
    
    for (var library in libraries) {
      switch (libraries[library].type) {
        case "users":
          // Example of Zotero user library item selection string: zotero://select/library/items?itemKey=ABCD2345,BCDE9876
          libraries[library].selectionString = "zotero://select/library/items?itemKey=" + libraries[library].items.join(",");
          break;
        case "groups":
          // Example of Zotero group library item selection string: zotero://select/groups/227594/items?itemKey=2TK9HDKD
          libraries[library].selectionString = "zotero://select/groups/" + libraries[library].subID + "/items?itemKey=" + libraries[library].items.join(",");
          break;
      }
    }
    
    savedZoteroLibrarySelectors = libraries;
  }
  
  return metadataOnlyItems;
}

document.getElementById("download").addEventListener("click", function(){
    var blob = new Blob([convertOutput()], {
        type: "text/plain;charset=utf-8"
    });
    
    var outputExtension = "";
    
    switch (outputElement.options[outputElement.selectedIndex].value) {
        case 'bibtex':
          outputExtension = ".bib";
          break;
        case 'ris':
          outputExtension = ".ris";
          break;
        case 'bibliography':
          outputExtension = ".txt";
          break;
        default:
          outputExtension = ".json";
    }
    
    saveAs(blob, "ref-extracts" + outputExtension);
});

var clipboard = new ClipboardJS('#copy_to_clipboard', {
    text: function() {
        return convertOutput();
    }
});

function convertOutput() {
  var csl_json = savedItemsString;
  var outputFormat = outputElement.options[outputElement.selectedIndex].value;
  
  let citationRender = new Cite(csl_json);
  
  return citationRender.format(outputFormat);
}

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
