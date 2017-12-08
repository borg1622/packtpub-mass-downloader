# packtpub-mass-downloader
This userscript allows you to mass download all eBooks from your [Packt Publishing](https://www.packtpub.com/account/my-ebooks) user account library.

It inserts a control box at the page header of the `My eBooks` page where you can choose the filetypes to download and initiate downloading all eBooks.

![Control box](https://github.com/itc-ger/packtpub-mass-downloader/raw/master/Packt%20Publishing%20mass%20downloader%20-%20control.png "Control box")

All files will be downloaded sequentially to avoid having hundreds of parallel downloads.  



## Tampermonkey configuration 

In order to use this script you must allow downloading of PDF-, Mobi- and ePub-Filetypes in Tampermonkey. \
Open Tampermonkeys settings page and add the following lines to input field `Whitelisted File Extensions:` of Section `Downloads BETA`

```
.epub
.mobi
.pdf
```

## Troubleshooting

In case of an error please have a look at chromes `Console` first. \
__Open Console:__ 
- Menu -> More Tools -> Developer Tools (and choose `Console` tab) \
_**or press:**_
- `[Ctrl]` + `[Shift]` + `[i]`
