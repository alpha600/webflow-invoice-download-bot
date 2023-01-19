const fs = require('fs')
const path = require('path')
const https = require('https')
const HTMLParser = require('node-html-parser');
const emoji = require('node-emoji')
const {Builder, By, Key, promise, until} = require('selenium-webdriver');
const { promisify } = require('util');
const firefox = require('selenium-webdriver/firefox');

require('geckodriver');

const baseUrl = ''

// add file types to observe/download here
const targetFileTypes = ['image', 'pdf', 'spreadsheet']


let options = new firefox.Options()
    // .headless()

let driver = new Builder()
    .forBrowser('firefox')
    .setFirefoxOptions(options)
    .build();

console.log('\n');
console.log(emoji.get("arrow_down"), ' ',`Startet crawling process for ${baseUrl}...`);
console.log('\n');

async function main() {
    try {
        await driver.get(baseUrl);
        console.log(emoji.get("key"), ' ',`Entered ${baseUrl}...`);
        console.log('\n');
        const source = await driver.getPageSource();
        const screenshot = await driver.takeScreenshot();
        console.log(emoji.get("female-detective"), ' ',`Analyzing page source code for ${baseUrl}...`);
        console.log('\n');
        fs.writeFileSync('test.html', source, err => console.log(err))
        fs.writeFileSync('screenshot.png', screenshot, 'base64', err => console.log(err))
    } finally {
        await driver.quit();
        console.log(emoji.get("white_check_mark"), ' ',`Downloaded data!`);
        console.log('\n');
        console.log(emoji.get("partying_face"), ' ', "\x1b[32m", 'Woohoo, all downloads completed!', ' ', emoji.get("champagne"));
        console.log('\n');
    }
}

    

main();



// const webDriverTest = async () => {

//     let driver = await new Builder().forBrowser('firefox').build();

//     try {
//         await driver.get(baseUrl)
//         await driver.findElement(By.css('')).click()
//         await driver.wait(until.titleIs(''), 1000)
//         await driver.findElement(By.css("[name='username']")).sendKeys('')
//         await driver.findElement(By.css("[name='password']")).sendKeys('')
//         await driver.findElement(By.css("")).click()
//         await driver.wait(until.titleIs(''), 1000)

//     } finally {
//         await driver.quit()
//     }

// }



// webDriverTest()