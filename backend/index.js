require("dotenv").config()
const MqttHandler = require("./mqtt_handler")
const express = require("express")
const bodyParser = require("body-parser")
const cors = require("cors")
const Database = require("./database")
const winston = require("winston")

const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
    ),
    transports: [
        new winston.transports.File({ filename: "logs/app.log" })
    ]
})

const app = express()

const db = new Database(logger)



app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
app.use(cors())

let topics = ["gw_to_express", "current_values", "check_card"]
topics = topics.map(topic => `${process.env.MQTT_RECIEVE_PREFIX}/${topic}`)

let mqttClient = new MqttHandler(process.env.MQTT_URL, process.env.MQTT_NAME, process.env.MQTT_PASSWORD, topics, logger)
mqttClient.connect()

app.get("/", (req,res) => {
    res.status(200).send("Pripojeny")
})

app.post("/mqtt_test", (req, res) => {
    logger.info("Recieved request on /mqtt_test")
    mqttClient.sendMessage(`${process.env.MQTT_SEND_PREFIX}/test`, "test z frontendu")
    res.status(200).send("Message sent")
})

app.get("/current_values", (req, res) => {
    logger.info("Recieved request on /current_values")
    mqttClient.sendMessage(`${process.env.MQTT_SEND_PREFIX}/meassure_current_values`, "")
    mqttClient.setResponseObj(res)
})

app.post("/user/login", async (req, res) => {
    logger.info("Recieved request on /user/login")
    let { name, password } = req.body
    db.checkCredential(name, password, res)
})


let server = app.listen(process.env.EXPRESS_PORT, () => console.log(`Backend running on port ${process.env.EXPRESS_PORT}`))