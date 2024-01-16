require("dotenv").config()
const MqttHandler = require("./mqtt_handler")
const express = require("express")
const bodyParser = require("body-parser")
const cors = require("cors")

const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
app.use(cors())



let topics = ["gw_to_express", "current_values"]
topics = topics.map(topic => `${process.env.MQTT_RECIEVE_PREFIX}/${topic}`)

let mqttClient = new MqttHandler(process.env.MQTT_URL, process.env.MQTT_NAME, process.env.MQTT_PASSWORD, topics)
mqttClient.connect()

app.get("/", (req,res) => res.status(200).send("Pripojeny"))

app.post("/mqtt_test", (req, res) => {
    mqttClient.sendMessage(`${process.env.MQTT_SEND_PREFIX}/test`, "test z frontendu")
    res.status(200).send("Message sent")
})

app.get("/current_values", (req, res) => {
    mqttClient.sendMessage(`${process.env.MQTT_SEND_PREFIX}/meassure_current_values`, "")
    mqttClient.setResponseObj(res)
})


let server = app.listen(process.env.EXPRESS_PORT, () => console.log(`Backend running on port ${process.env.EXPRESS_PORT}`))