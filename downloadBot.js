const fs = require('fs')
const path = require('path')
const https = require('https')
const HTMLParser = require('node-html-parser');
const emoji = require('node-emoji')
const {Builder, By, Key, until} = require('selenium-webdriver');

const baseUrl = ''

// add file types to observe/download here
const targetFileTypes = ['image', 'pdf', 'spreadsheet']


const webDriverTest = async () => {

    let driver = await new Builder().forBrowser('firefox').build();

    try {
        await driver.get(baseUrl)
        await driver.findElement(By.css('')).click()
        await driver.wait(until.titleIs(''), 1000)
        await driver.findElement(By.css("[name='username']")).sendKeys('')
        await driver.findElement(By.css("[name='password']")).sendKeys('')
        await driver.findElement(By.css("")).click()
        await driver.wait(until.titleIs(''), 1000)

    } finally {
        await driver.quit()
    }

}



webDriverTest()