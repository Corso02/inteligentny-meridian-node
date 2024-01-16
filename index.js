const MqttHandler = require("./mqtt_handler")
require("dotenv").config()

let mqttClient = new MqttHandler(process.env.MQTT_URL, process.env.MQTT_NAME, process.env.MQTT_PASSWORD)
mqttClient.connect()
mqttClient.sendMessage("express", "nehehehe")