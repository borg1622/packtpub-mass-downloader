// ==UserScript==
// @name         PacktPub Downloader
// @namespace    https://www.packtpub.com/
// @version      1.0
// @description  add link to download all ebooks from personal packpub library automaticly.
// @author       Dirk Osburg
// @match        https://www.packtpub.com/account/my-ebooks*
// @grant        GM_download
// @run-at       document-idle
// ==/UserScript==


/*
todo:
- hint: setup settings
*/

(function() {
    'use strict';

    const ERROR_NONE            = 0x0;
    const ERROR_NOT_ENABLED     = 0x1;
    const ERROR_NOT_WHITELISTED = 0x2;
    const ERROR_NOT_PERMITTED   = 0x4;
    const ERROR_USER_ABORT      = 0x8;
    const ERROR_YIELD_ABORT     = 0xF;

    const TYPE_MASK_NONE = 0x0;
    const TYPE_MASK_PDF  = 0x1;
    const TYPE_MASK_MOBI = 0x2;
    const TYPE_MASK_EPUB = 0x4;
    const TYPE_MASK_CODE = 0x8;
    const TYPE_MASK_ALL = ~TYPE_MASK_NONE;

    var error = ERROR_NONE;
    var warning = ERROR_NONE;
    var typeFilter = {"pdf":TYPE_MASK_PDF ,"mobi": TYPE_MASK_MOBI, "epub": TYPE_MASK_EPUB, "code":TYPE_MASK_CODE};

    var bookContainer = document.getElementById("product-account-list").children;
    console.debug("found " + bookContainer.length + " books");

    var bookIterator = null;

    injectDownloadLink();


    // ##############################################
    // ######## FUNCTIONS DEFINITION - BEGIN ########
    // ##############################################

    /* Insert Style-Element with CSS-Class into page */
    function injectCssClasses() {
        var style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = '.dlLink { color:#FFF; background-color:#F00;float:right;font-size:x-large; padding:0px 10px; } ' +
            '.dlLink:visited { color:#FFF; } ' +
            '.dlLink:hover { color:#F00; background-color:#FFF; border-style: solid; border-width:1px; border-color: #F00; } ' +
            '.fileTypeChooser { float:right; font-size:small; border-style:solid; border-color:#F00; } ';
        document.getElementsByTagName('head')[0].appendChild(style);
    }

    /* Insert download link next to "My ebooks" title and add event listener */
    function injectDownloadLink() {
        injectCssClasses();

        var titleContainer = document.getElementById("account-right-content").firstElementChild;
        titleContainer.innerHTML += '<div class="fileTypeChooser">' +
            '<a id="downloadAllLink" href="#" class="dlLink">[download all eBooks]</a><br/>' +
            '<form id="dlFileTypes">' +
            '<input type="checkbox" id="dlFileType_pdf" name="fileTypeFilter" value="pdf" checked><label for="dlFileType_pdf">PDF</label> &nbsp;&nbsp; ' +
            '<input type="checkbox" id="dlFileType_epub" name="fileTypeFilter" value="epub" checked><label for="dlFileType_epub">ePub</label> &nbsp;&nbsp; ' +
            '<input type="checkbox" id="dlFileType_mobi" name="fileTypeFilter" value="mobi" checked><label for="dlFileType_mobi">mobi</label> &nbsp;&nbsp; ' +
            '<input type="checkbox" id="dlFileType_code" name="fileTypeFilter" value="code" checked><label for="dlFileType_code">code files</label>' +
            '</form>' +
            '</div>';

        var downloadAllLink = document.getElementById("downloadAllLink");
        downloadAllLink.addEventListener ("click", startDownloading, false);
    }

    function evalFileFilter() {
        typeFilter.pdf = (document.getElementById("dlFileType_pdf").checked) ? TYPE_MASK_PDF : TYPE_MASK_NONE;
        typeFilter.epub = (document.getElementById("dlFileType_epub").checked) ? TYPE_MASK_MOBI : TYPE_MASK_NONE;
        typeFilter.mobi = (document.getElementById("dlFileType_mobi").checked) ? TYPE_MASK_EPUB : TYPE_MASK_NONE;
        typeFilter.code = (document.getElementById("dlFileType_code").checked) ? TYPE_MASK_CODE : TYPE_MASK_NONE;
    }

    /* Event listener action */
    function startDownloading() {
        bookIterator = iterateBooks(bookContainer);
        error = ERROR_NONE; // reset errors
        if (confirm("Start downloading all books automaticly?") === false) {
            error |= errorUserAbort;
            return;
        }
        evalFileFilter();

        console.debug("[startDownloading]bookIterator->next");
        bookIterator.next();

    }

    /* Download callback function to handle errors */
    function downloadErrorHandler(e) {
        var abort = true;
        switch(e.error) {
            case "not_enabled":
                error |= ERROR_NOT_ENABLED;
            case "not_permitted":
                error |= ERROR_NOT_PERMITTED;
                console.debug("download error: file downloading not enabled/permitted in Tampermonkey's settings");
                break;
            case "not_whitelisted":
                warning |= ERROR_NOT_WHITELISTED;
                abort = false;
                console.debug("download error: file extension not whitelistet in Tampermonkey's settings");
                break;
            default:
                console.debug("unknown download error: (" + e.error + ") " + e.details);
        }

        console.debug("[downloadErrorHandler]bookLinks->next");
        bookIterator.next(abort);
    }

    /* Download callback function to start next download if last one was finished */
    function downloadFinishHandler() {
        console.debug("download finished...");
        console.debug("[downloadFinishHandler]bookLinks->next");
        bookIterator.next();
    }

    /* wrapper for Tampermonkeys download function */
    function downloadBook(filename, href) {
        console.debug("downloading: " + filename + "...");
        var retVal = GM_download({url:href, name:filename, saveAs:false, onload:downloadFinishHandler, onerror:downloadErrorHandler});
    }


    function getBook(elm) {
        var title = elm.title;
        var downloadLinkContainer;

        try {
            downloadLinkContainer = elm.lastElementChild.lastElementChild;
        } catch (e) {
            if (e instanceof TypeError) {
                console.debug("unexpected html element, skip element...");
                return null;
            } else {
                console.debug("unexpected error, skip element...");
                return null;
            }
        }

        if (title.length === 0 || downloadLinkContainer === null) {
            console.debug("no book: " + elm);
            return null;
        }

        console.debug("processing book '" + title + "'");

        return downloadLinkContainer.children;
    }

    function* iterateDownloadLinks(bookHrefArray, title) {
        var i = 0;
        var abort = false;
        while (error === ERROR_NONE && i < bookHrefArray.length) {

            var linkElement = bookHrefArray[i];
            var linkType = linkElement.firstElementChild.lastElementChild.innerText.toLowerCase();
            var linkHref = linkElement.href;

            if(linkType in typeFilter && typeFilter[linkType] !== TYPE_MASK_NONE){
                console.debug("typeFilter ("+linkType+"): " + typeFilter[linkType].toString(16));
                downloadBook(title + "." + linkType, linkHref);
                console.debug("[iterateDownloadLinks]yield");
                abort = yield i++;
            } else if (linkType == "code files" && typeFilter.code !== TYPE_MASK_NONE) {
                console.debug("typeFilter ("+linkType+"): " + typeFilter.code.toString(16));
                downloadBook(title + ".zip", linkHref);
                abort = yield i++;
            } else {
                console.debug("skipping fileType: " + linkType);
                i++;
            }

            console.debug("link iterator yield: " + i);

            if (abort === true) {
                error |= ERROR_YIELD_ABORT;
            }
        }
        console.debug("[iterateDownloadLinks]bookIterator->next");
    }

    function* iterateBooks(booksArray) {
        var i = 0;
        console.debug("entering iterator");
        while (error === ERROR_NONE && i < booksArray.length) {
            var bookLinks = getBook(bookContainer[i]);
            var title = bookContainer[i].title;
            i++;

            if (bookLinks === null) {
                continue;
            }
            var abort = yield* iterateDownloadLinks(bookLinks, title);

            if (abort === true) {
                error |= ERROR_YIELD_ABORT;
            } /*else if (confirm("download next book?") === false) {
                error |= ERROR_USER_ABORT;
            }*/
        }

    }

    // ##############################################
    // ######## FUNCTIONS DEFINITION - END   ########
    // ##############################################



})();
