const fs = require('fs')
const path = require('path')
const emoji = require('node-emoji')
const {Builder, By, Key, promise, until} = require('selenium-webdriver')
const firefox = require('selenium-webdriver/firefox')
require('geckodriver');

const loginUrl = ''
const invoicesUrl = ''
const userKey = ''
const passwordKey = ''

// add file types to observe/download here
const targetFileTypes = ['image', 'pdf', 'spreadsheet']


let options = new firefox.Options()
    .headless()
    .setPreference("browser.link.open_newwindow", 1)
    .setPreference("pdfjs.enabledCache.state", false)
    .setPreference("browser.download.open_pdf_attachments_inline", true)
    .setPreference("browser.download.start_downloads_in_tmp_dir", true)
    .setPreference("browser.download.folderList", 2)
    .setPreference("browser.download.manager.showWhenStarting", false)
    .setPreference("browser.download.dir", path.join(__dirname, 'assets/downloads'))
    .setPreference("browser.helperApps.neverAsk.saveToDisk", "application/pdf")
    .setBinary("/Applications/Firefox Developer Edition.app/Contents/MacOS/firefox-bin")
    .setProfile("")

let driver = new Builder()
    .forBrowser('firefox')
    .setFirefoxOptions(options)
    .build()

console.log('\n');
console.log(emoji.get("arrow_down"), ' ',`Started crawling process for ${loginUrl}...`);
console.log('\n');

const sleep = time => new Promise(resolve => setTimeout(resolve, time))

const fileAlreadyExists = (file,directory) => {
    return fs.existsSync(path.join(__dirname, `${directory}${file}`))
}

const downloadFiles = async fileUrls => {
    for (const fileUrl of fileUrls) {
        const href = await fileUrl.getAttribute('href')
        const urlSegments = href.split('/')
        const fileName = urlSegments[urlSegments.length - 1]
        
        if (fileAlreadyExists(fileName,'assets/downloads/Webflow-')) {
            console.log(emoji.get("repeat"), ' ',`File ${fileName} already downloaded...`);
            continue
        }

        fileUrl.click()

        while (!fileAlreadyExists(fileName,'assets/downloads/Webflow-')) {
            await sleep(1)
        }

        console.log(emoji.get("white_check_mark"), ' ',`Downloaded ${fileName}!`);
    }

    return
}

const main = async () => {
    try {
        await driver.get(loginUrl);
        console.log(emoji.get("desktop_computer"), ' ',`Entered ${loginUrl}...`);
        console.log('\n');

        const userFormField = await driver.findElement(By.css("[name='username']")).sendKeys(userKey)
        const passwordFormField = await driver.findElement(By.css("[name='password']")).sendKeys(passwordKey)
        await driver.findElement(By.css("[data-automation-id='login-button']")).click()
        await driver.wait(until.titleIs(''))
        console.log(emoji.get("key"), ' ',`Login successfully for ${loginUrl}...`);
        console.log('\n');

        await driver.get(invoicesUrl)
        const fileUrls = await driver.wait(until.elementsLocated(By.css('#invoices a[ng-href]')))
        
        await downloadFiles(fileUrls)

        await sleep(1000)
    } 

    finally {
        console.log('\n');
        console.log(emoji.get("partying_face"), ' ', "\x1b[32m", 'Woohoo, all downloads completed!', ' ', emoji.get("champagne"));
        console.log('\n');
        await driver.quit();
    }
}

main()
