const fs = require('fs')
const path = require('path')
const {Builder, By, Key, promise, until} = require('selenium-webdriver')
const firefox = require('selenium-webdriver/firefox')
const prompt = require('prompt-sync')();
require('geckodriver');

const validateInput = require('./helpers/validateInput')
const sleep = require('./helpers/sleep')


if (!process.argv[2]) {
    console.log('\n')
    console.error('\x1b[31m', 'Please enter a path to a download directory:')
    console.log('\n')
    console.log('\x1b[0m', 'npm run download <absolute destination path>')
    console.log('\x1b[0m', 'E.g.: npm run download /Users/user/Downloads')
    console.log('\n')

    process.exit()
}

let downloadDirectory = process.argv[2]
downloadDirectory = downloadDirectory.endsWith('/') ? downloadDirectory : `${downloadDirectory}/`

const validInputValues = {
    dashboardType: ['w','workspace','t','team'],
    months: ['1','2','3','4','5','6','7','8','9','10','11','12','jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec','january','february','march','april','may','june','july','august','september','october','november','december'],
}

// user input data
const dashboardType = validateInput(prompt("Do you want to enter a Workspace or a Team Dashboard? (w/t) "), validInputValues['dashboardType'])
const accountName = validateInput(prompt("Enter your account's name url parameter: "))
const userKey = validateInput(prompt('Enter you Webflow user name: '))
const passwordKey = validateInput(prompt.hide('Enter you Webflow password: '))
const month = validateInput(prompt("Which month's invoices should be downloaded? "), validInputValues['months'])

const loginUrl = 'https://webflow.com/dashboard/login'
const invoicesUrl = dashboardType.toLowerCase() === 'w' || dashboardType.toLowerCase() === 'workspace' ? `https://webflow.com/dashboard/workspace/${accountName}/billing?ref=billing_tab` : `https://webflow.com/dashboard/team/${accountName}/billing?org=${accountName}`

// selectors and data for dom interaction
const userInputSelector = "[name='email']"
const passwordInputSelector = "[name='password']"
const loginButtonSelector = "button[type='submit']"
const tableWrapperSelector = "section"
const tableHeadingSelector = "h2"
const tableHeading = "All invoices"
const tableRowSelector = "tbody tr"
const downloadLinkSelector = "a"
const loadMoreButtonSelector = "button"

// firefox browser options
let options = new firefox.Options()
    .headless()
    .setPreference("browser.link.open_newwindow", 1)
    .setPreference("pdfjs.enabledCache.state", false)
    .setPreference("browser.download.open_pdf_attachments_inline", true)
    .setPreference("browser.download.start_downloads_in_tmp_dir", true)
    .setPreference("browser.download.folderList", 2)
    .setPreference("browser.download.manager.showWhenStarting", false)
    .setPreference("browser.download.dir", downloadDirectory)
    .setPreference("browser.helperApps.neverAsk.saveToDisk", "application/pdf")
    .setBinary("[path_to_firefox_binary]")

let profile = '[path_to_firefox_profile]'
options.setProfile(profile)

// driver init
let driver = new Builder()
    .forBrowser('firefox')
    .setFirefoxOptions(options)
    .build()

console.log('\n');
console.log(`⬇️   Started crawling process for ${loginUrl}...`);
console.log('\n');


const rowMatchesDate = async (element,month,year) => {
    const textContent = (await element.findElement(By.css('td')).getText()).toLowerCase()
    
    return textContent.includes(month) && textContent.includes(year)
}

const filterRows = async (rows,month,year) => {
    const filteredRows = await rows.reduce(async (acc,val) => {
        if(!await rowMatchesDate(val,month,year)) return acc
        return [...await acc, val]
    }, [])

    return filteredRows
}

const getFileUrls = async (rows,section) => {
    const fileUrls = []

    let filteredRows = await filterRows((await rows), month, new Date().getFullYear())

    let checkForMissingInvoices = false
    let checkForPrecedingYear = false
    let loadMoreInvoices = false
    let filterAgain = false

    let lastInvoiceRow = await rows[rows.length - 1]

    if(await rowMatchesDate(lastInvoiceRow,month,new Date().getFullYear())) checkForMissingInvoices = true
    if(!filteredRows.length) checkForPrecedingYear = true

    if (checkForMissingInvoices === true || checkForPrecedingYear === true) {
        loadMoreInvoices = true
        filterAgain = true
    }
    
    while(loadMoreInvoices === true) {
        await section.findElement(By.css(loadMoreButtonSelector)).click()
        
        const invoices = await section.findElements(By.css(tableRowSelector))
        const lastInvoice = invoices[invoices.length - 1]
        
        if(!(await lastInvoice.getText()).toLowerCase().includes(month) && checkForMissingInvoices) {
            loadMoreInvoices = false
        }

        if( (await lastInvoice.getText()).toLowerCase().includes(new Date().getFullYear() - 2)  ) {
            loadMoreInvoices = false
        }
    }
    
    if (filterAgain === true && checkForMissingInvoices === true) {
        filteredRows = await filterRows((await section.findElements(By.css(tableRowSelector))),month,new Date().getFullYear())
    }

    if (filterAgain === true && checkForPrecedingYear === true) {
        filteredRows = await filterRows((await section.findElements(By.css(tableRowSelector))),month,new Date().getFullYear() - 1)
    }

    filteredRows.forEach(async row => fileUrls.push(row.findElement(By.css(downloadLinkSelector))))

    return fileUrls
}

const fileAlreadyExists = (file,path) => {
    return fs.existsSync(`${path}${file}`)
}

const downloadFiles = async fileUrls => {
    for (const fileUrl of fileUrls) {
        const href = await fileUrl.getAttribute('href')
        const urlSegments = href.split('/')
        const fileName = urlSegments[urlSegments.length - 1]

        if (fileAlreadyExists(fileName,`${downloadDirectory}Webflow-`)) {
            console.log(`🔁  File ${fileName} already downloaded...`);
            continue
        }

        fileUrl.click()

        while (!fileAlreadyExists(fileName,`${downloadDirectory}Webflow-`)) {
            await sleep(1)
        }

        console.log(`✅  Downloaded ${fileName}!`);
    }

    return
}

const fetchInvoicesFromWebflow = async () => {
    let invoicesSection

    try {
        await driver.get(loginUrl);
        console.log(`🖥️   Entered ${loginUrl}...`);
        console.log('\n');

        const userFormField = await driver.findElement(By.css(userInputSelector)).sendKeys(userKey)
        const passwordFormField = await driver.findElement(By.css(passwordInputSelector)).sendKeys(passwordKey)
        await driver.findElement(By.css(loginButtonSelector)).click()
        await driver.wait(until.urlContains(`workspace` || `team`))
        console.log(`🔑  Login successfully for ${loginUrl}...`);
        console.log('\n');

        await driver.get(invoicesUrl)

        await driver.wait(until.elementsLocated(By.css(tableWrapperSelector)))
        const sections = await driver.findElements(By.css(tableWrapperSelector))

        for (const section of sections) {
            await driver.wait(until.elementsLocated(By.css(tableHeadingSelector)))
            let sectionHeading = await section.findElement(By.css(tableHeadingSelector)) 

            if (await sectionHeading.getText() === tableHeading) {
                invoicesSection = section
            }
        }

        const fileUrls = await getFileUrls(await invoicesSection.findElements(By.css(tableRowSelector)), invoicesSection)

        await downloadFiles(fileUrls)

        await sleep(1000)
    } 

    finally {
        console.log('\n');
        console.log('🥳 ', "\x1b[32m", 'Woohoo, all downloads completed!', ' 🍾');
        console.log('\n');
        await driver.quit();
    }
}

fetchInvoicesFromWebflow()