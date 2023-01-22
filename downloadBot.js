const fs = require('fs')
const path = require('path')
const emoji = require('node-emoji')
const {Builder, By, Key, promise, until} = require('selenium-webdriver')
const firefox = require('selenium-webdriver/firefox')
require('geckodriver');
const prompt = require('prompt-sync')();


const validateInput = (input,possibleOptions = false) => {
    if(!input.trim()) {
        console.log('\n')
        console.error('\x1b[31m', `Please enter a valid input.`)
        process.exit()
    } 

    if(!possibleOptions) {
        return input
    }

    if(!possibleOptions.includes(input.trim().toLowerCase())) {
        console.log('\n')
        console.error('\x1b[31m', `${input} is not a valid input.`)
        process.exit()
    }

    return input
}

const validInputValues = {
    dashboardType: ['w','workspace','t','team'],
    months: ['1','2','3','4','5','6','7','8','9','10','11','12','jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'],
}

const dashboardType = validateInput(prompt("Do you want to enter a Workspace or a Team Dashboard? (w/t) "), validInputValues['dashboardType'])
const accountName = validateInput(prompt("Enter your account's name url parameter: "))
const userKey = validateInput(prompt('Enter you Webflow user name: '))
const passwordKey = validateInput(prompt.hide('Enter you Webflow password: '))
const months = validateInput(prompt("Which month's invoices should be downloaded? "), validInputValues['months'])

const loginUrl = 'https://webflow.com/dashboard/login'
const invoicesUrl = dashboardType.toLowerCase() === 'w' || dashboardType.toLowerCase() === 'workspace' ? `https://webflow.com/dashboard/workspace/${accountName}/billing?ref=billing_tab` : `https://webflow.com/dashboard/team/${accountName}/billing?org=${accountName}`

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
    // path to firefox application directory
    .setBinary("/Applications/Firefox Developer Edition.app/Contents/MacOS/firefox-bin")
    // path to firefox profile
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

const fetchInvoicesFromWebflow = async () => {
    try {
        await driver.get(loginUrl);
        console.log(emoji.get("desktop_computer"), ' ',`Entered ${loginUrl}...`);
        console.log('\n');

        const userFormField = await driver.findElement(By.css("[name='username']")).sendKeys(userKey)
        const passwordFormField = await driver.findElement(By.css("[name='password']")).sendKeys(passwordKey)
        await driver.findElement(By.css("[data-automation-id='login-button']")).click()
        await driver.wait(until.titleIs(`${accountName} Sites - Webflow`))
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

fetchInvoicesFromWebflow()