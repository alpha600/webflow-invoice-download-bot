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

module.exports = validateInput