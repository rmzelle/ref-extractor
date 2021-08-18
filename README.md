![License](https://img.shields.io/github/license/rmzelle/ref-extractor)

# Reference Extractor

[Reference Extractor](https://rintze.zelle.me/ref-extractor/) is a free online tool to extract [Zotero](https://www.zotero.org/) and [Mendeley](https://www.mendeley.com/) references from Microsoft Word and LibreOffice documents.
References must have been inserted with the Zotero or Mendeley word processor plugins and must not have been converted to plain text.

Reference extractor allows you to:

* **Extract** Zotero and Mendeley references and save them to CSL JSON, BibTeX, or RIS format, or as a rendered bibliography in APA style.  
  
  *Scenario 1*: You lost your Zotero/Mendeley library but still have your documents.
  Extraction allows you to recover the items you cited in your documents and import them back into your reference manager. 
  Note that imported items won't be linked to the items in the document you extracted them from.  
  
  *Scenario 2*: Somebody sent you a document and you would like to get the cited items into your own reference manager library. 
* **Select** the original cited items in your existing Zotero libraries *[only available for Zotero]*.
  Once items are selected in Zotero, you can drag the items into a new collection or apply a tag.
  
  *Scenario*: You wish to create a collection for the items you've cited in a manuscript.
* **Count** the number of times each item has been cited.
* **Identify** the [Citation Style Language](https://citationstyles.org/) citation style used in the document.

## Tips for use

Once you have successfully extracted the references from a document, the output, as CSL JSON, BibTeX, RIS, or formatted APA bibliography, can be either downloaded or copied to the clipboard.

To import a downloaded CSL JSON, BibTeX, or RIS file into Zotero, open Zotero's File menu, select "Import..." and select the downloaded output file.
Or, if you used the "Copy to clipboard" button of this tool, select "Import from Clipboard".

The format with highest fidelity is CSL JSON, as this is the format used by Zotero and Mendeley to embed item metadata in word processor documents.
All other output formats involve a format conversion.
If you discover issues with the BibTeX or RIS output formats, but need a format other than CSL JSON, try importing the CSL JSON file into Zotero, and then use Zotero to convert the references to the desired output format.

## Support

I offer Reference Extractor for free as MIT-licensed open source software.
I also care about your privacy.
Reference Extractor does all its work on your own computer, and your documents are never sent across the internet.
No snooping, no tracking, no ads.

If you found this tool useful, please support this project by starring this GitHub repository, or by giving a small donation via e.g. [PayPal](https://www.paypal.me/RintzeZelle/2.50) (see also the Sponsor button at the top of this repository).

## Troubleshooting

If Reference Extractor doesn't work or find any items in your word processor document, there are several possible causes:

* Make sure your Word document has been saved in the ".docx" format, or your LibreOffice document in the ".odt" format
* Try a different browser, like Firefox or Google Chrome
* If you have JavaScript disabled (e.g. by using a browser extension like [NoScript](https://noscript.net/)), enable JavaScript for this webpage
* The citations in the document might not (or no longer) be [active field codes](https://www.zotero.org/support/kb/word_field_codes).
  Active field codes have grey shading by default, while inactive citations have white shading and look and behave like regular text.
  You can also confirm citations are active by toggling the field codes by pressing <kbd>Alt</kbd>+<kbd>F9</kbd> or <kbd>Option</kbd>+<kbd>F9</kbd> in Word.
  After pressing this shortcut, active Zotero and Mendeley field codes will expand and show the embedded citation metadata.
  Toggled Zotero fields start with "ADDIN ZOTERO_ITEM CSL_CITATION", and toggled Mendeley fields start with "ADDIN CSL_CITATION".
* The citations in the document have been inserted with a different reference manager.
* [Zotero] For documents with over 220 references, the "Select in Zotero" links may not work correctly.
  This issue appears to be limited to Windows.
  Either only about 220 items are selected in Zotero, or no items are selected at all.
  If this happens, a workaround is to split your document into multiple documents that each have a reference count under this limit.
* [Zotero] For older documents with Zotero references, note that Zotero [started](https://github.com/zotero/zotero-word-for-windows-integration/issues/30#issuecomment-285073023) offering embedded metadata in 2012 with Zotero 3.0.
  Documents last updated with earlier versions of Zotero don't contain extractable citations.
  For documents last updated with Zotero 3.x and 4.x, extraction is only possible if the option "Store references in document" was checked in the Zotero document preferences.
  Zotero 5.x always embeds item metadata.
* [Zotero] For Word documents with Zotero references, references must be stored as "Fields", not "Bookmarks". For LibreOffice documents, references must be stored as "ReferenceMarks", not "Bookmarks". This can be changed for existing documents through the [Zotero document preferences](https://www.zotero.org/support/word_processor_plugin_usage#document_preferences).

If you can't find a solution, https://www.zotero.org/support/kb/importing_formatted_bibliographies describes several alternative methods that e.g. work with plain text citations.

## Getting help

To report issues or feature requests, please [file a GitHub issue](https://github.com/rmzelle/ref-extractor/issues) or send me a [tweet](https://twitter.com/rintzezelle). 

## Developers

Examples of how Zotero and Mendeley embed cited items in Word .docx documents can be seen at <https://github.com/rmzelle/ref-extractor/wiki>.

Reference Extractor uses the [Citation.js](https://citation.js.org/) JavaScript library for reference format conversion.

## Testimonials

Reference Extractor has been recommended by the following institutions:

* [Zotero](https://twitter.com/zotero/status/1161310683109253121)
* [Berkeley Library](https://update.lib.berkeley.edu/2018/02/07/extracting-references-from-an-already-created-bibliography/)
* [Bibliothèque Universitaire Paris Nanterre](https://twitter.com/BUNanterre/status/953527431838752769)
* [Caltech Library](https://libanswers.caltech.edu/faq/204009)
* [Washington State University Libraries](https://libguides.libraries.wsu.edu/c.php?g=768677&p=5514182)

## Licensing

This repository is released under the MIT license.
