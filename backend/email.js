require("dotenv").config()
const nodeMailer = require("nodemailer")

class mailSender{
    constructor(){
        this.transport = nodeMailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
                user: process.env.MAIL_NAME,
                pass: process.env.MAIL_PASSWORD
            }
        })
    }

    sendTestMail(){
        this.transport.sendMail({
            from: process.env.MAIL_SENDER,
            to: "corso21102@gmail.com",
            subject: "TEST EMAIL",
            text: "TEST EMAIL VIS JAKO",
            html: "<p>TEST EMAIL VIS JAKO<p/>"
        }).finally(() => console.log("mail sent"))
    }
    sendWarningEmail(sendTo, time, date){
        this.transport.sendMail({
            from: process.env.MAIL_SENDER,
            to: sendTo,
            subject: "DVERE BOLI OTVORENÉ",
            text: `Dvere do labáku meridian boli otovrené ${date}, o ${time}.`,
            replyTo: null,
            
        })
    }
}

module.exports = mailSender