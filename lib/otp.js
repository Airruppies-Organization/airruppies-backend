const otp = (digits = 5) => {
    let randomNumber = "";

    while (randomNumber.length < digits)
    {
        randomNumber += Math.floor(Math.random() * 10);
    }

    return randomNumber;
}

module.exports = otp