# Reference Extractor

[Reference Extractor](http://rintze.zelle.me/ref-extractor/) is an online tool to extract Zotero and Mendeley references from Microsoft Word documents.
This can be useful if, for instance, somebody sent you a Word document with Zotero or Mendeley references, and you'd like to add the cited items to your own reference manager.
Or maybe you lost access to your original Zotero or Mendeley library and wish to retrieve the items you cited in your own Word documents.

## Usage

The tool only works with Word files in the .docx format, to which references have been added through the Zotero or Mendeley word processor plugins.
For Zotero references, the option "Store references in document" must have been checked in the Zotero document preferences, and references must be stored as "Fields", not "Bookmarks".

![image](https://cloud.githubusercontent.com/assets/77951/19630377/a01b9a4e-9957-11e6-8113-9e36b11724db.png)

Once you have successfully extracted the references from a document, the output, in the CSL JSON format, can be either downloaded or copied to the clipboard.
Currently, only Zotero seems to be capable of importing CSL JSON.
Open Zotero's gear menu, and either select "Import..." and select the downloaded output file, or, if you first copied the CSL JSON to the clipboard, select "Import from Clipboard".

## Developers

Examples of how Zotero and Mendeley embed cited items in Word .docx documents can be seen at <https://github.com/rmzelle/ref-extractor/wiki>.

## Licensing

This repository is released under the MIT license.
