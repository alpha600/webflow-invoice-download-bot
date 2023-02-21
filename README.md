# DOwnload bot for webflow invoices

The webflow invoice download bot logs into your webflow account headlessly with given credentials and downloads all invoices for a given month.
The bot is built on node.js and uses selenium web driver for automation. 
Currently the script is only working in firefox browsers but should be adjustable for use in chrome easily. 

## Installation

First you need to run:
```
npm install
```

## Initialization
In order for the bot to run properly you need to replace some placeholders in the script.

Before you continue it's highly recommended to create a new firefox profile for bots only. 
In the settings of the newly created profile you have to change the default behaviour when clicking on download links otherwise the bot won't download any invoices.

On lines 50 – 51 just replace the paths to your firefox installation path and and your new firefox profile path:
```
// other code

.setBinary("[path to firefox application directory]")
.setProfile("[path to firefox profile]")

// other code
   ...
```
On line 51 you should reference you newly created bot profile.
For more details check the mozilla docs: https://support.mozilla.org/en-US/kb/change-firefox-behavior-when-open-file

## Usage
In the main directory run:
```
npm run download [download destination path]
```
E.g.: npm run download /Users/username/Downloads

The script will start downloading matching invoices.
If an invoice is already existing in the desitnation directory the script will skip it.

