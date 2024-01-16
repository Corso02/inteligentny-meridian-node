const MqttHandler = require("./mqtt_handler")
require("dotenv").config()

let topics = ["gw_to_express"]
topics = topics.map(topic => `${process.env.MQTT_RECIEVE_PREFIX}/${topic}`)

let mqttClient = new MqttHandler(process.env.MQTT_URL, process.env.MQTT_NAME, process.env.MQTT_PASSWORD, topics)
mqttClient.connect()
mqttClient.sendMessage(`${process.env.MQTT_SEND_PREFIX}/express`, "nehehehe")