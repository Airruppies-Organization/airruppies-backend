require("dotenv").config();

const nodemailer = require('nodemailer');


class Mailer {
    constructor() {
        this.transporter = nodemailer.createTransport({
            service : "gmail",
            auth : {
                user : process.env.MAIL_USER,
                pass : process.env.MAIL_PWD
            }
        });
    }

    sendEmail(from, to, text, subject)
    {
        const options = {from, to, subject, text};

        this.transporter.sendMail(options, (err, data) => {
            if (err) throw new Error("Email not sent");
        });

        return true;
    }
}

const mailer = new Mailer();

module.exports = mailer;