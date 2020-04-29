# Reference Extractor

![License](https://img.shields.io/github/license/rmzelle/ref-extractor)

[Reference Extractor](https://rintze.zelle.me/ref-extractor/) is a free online tool to extract [Zotero](https://www.zotero.org/) and [Mendeley](https://www.mendeley.com/) references from Microsoft Word .docx documents.
It only works with *active* citations that have been inserted through the Zotero or Mendeley word processor plugins, and that haven't been converted to plain text.

Reference extractor allows you to:

* **Extract** Zotero and Mendeley references and save them to CSL JSON, BibTeX, or RIS format, or as a rendered bibliography in APA style.  
  
  *Scenario 1*: You lost your Zotero/Mendeley library but still have your Word documents.
  Extraction allows you to recover the items you cited in your Word documents and import them back into your reference manager. 
  Note that imported items won't be linked to the items in the Word document you extracted them from.  
  
  *Scenario 2*: Somebody sent you a Word document and you would like to get the cited items into your own reference manager library. 
* **Select** the original cited items in your existing Zotero libraries *[only available for Zotero]*.
  Once items are selected in Zotero, you can drag the items into a new collection or apply a tag.
  
  *Scenario*: You wish to create a collection for the items you've cited in a manuscript.
* **Count** the number of times each item has been cited.
* **Identify** the [Citation Style Language](https://citationstyles.org/) citation style used in the Word document.

## Tips for use

Once you have successfully extracted the references from a document, the output, as CSL JSON, BibTeX, RIS or formatted APA bibliography, can be either downloaded or copied to the clipboard.

The format with highest fidelity is CSL JSON, however, currently only Zotero seems capable of importing CSL JSON.

To import CSL JSON into Zotero, open Zotero's File menu, and either select "Import..." and select the downloaded output file, or, if you first copied the CSL JSON to the clipboard, select "Import from Clipboard".

## Support

I offer Reference Extractor for free as MIT-licensed open source software.
I also care about your privacy.
Reference Extractor does all its work on your own computer, and your documents are never sent across the internet.
No snooping, no tracking, no ads.

If you found this tool useful, please support this project by starring this GitHub repository, or by giving a small donation via e.g. [PayPal](https://www.paypal.me/RintzeZelle/2.50) (see also the Sponsor button at the top of this repository).

## Troubleshooting

* If Reference Extractor doesn't find any items in your Word document, there are several possible causes:
  * The citations in the Word document might not (or no longer) be [active field codes](https://www.zotero.org/support/kb/word_field_codes).
  Active field codes have grey shading by default.
  You can also confirm citations are active by toggling the field codes by pressing <kbd>Alt</kbd>+<kbd>F9</kbd> or <kbd>Option</kbd>+<kbd>F9</kbd> Alt/Option-F9 (or Option-Fn-F9) in Word.
  After pressing this shortcut, active Zotero and Mendeley field codes will expand and show the embedded citation metadata.
  Toggled Zotero fields start with "ADDIN ZOTERO_ITEM CSL_CITATION", and toggled Mendeley fields start with "ADDIN CSL_CITATION".
  * The citations in the Word document have been inserted with a different reference manager.
* For older Word documents with Zotero references, note that Zotero [started](https://github.com/zotero/zotero-word-for-windows-integration/issues/30#issuecomment-285073023) offering embedded metadata in 2012 with Zotero 3.0.
  For Zotero 3.x and 4.x, extraction is only possible if the option "Store references in document" was checked in the Zotero document preferences.
  Zotero 5.x always embeds item metadata.
* For Word documents with Zotero references, references must be stored as "Fields", not "Bookmarks".
* https://www.zotero.org/support/kb/importing_formatted_bibliographies describes several alternative methods that work with e.g. plain text citations.

## Getting help

To report issues or feature requests, please [file a GitHub issue](https://github.com/rmzelle/ref-extractor/issues) or send me a [tweet](https://twitter.com/rintzezelle). 

## Developers

Examples of how Zotero and Mendeley embed cited items in Word .docx documents can be seen at <https://github.com/rmzelle/ref-extractor/wiki>.

Reference Extractor uses the [Citation.js](https://citation.js.org/) JavaScript library for reference format conversion.

## Licensing

This repository is released under the MIT license.
