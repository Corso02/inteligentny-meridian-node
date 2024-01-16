const mqtt = require('mqtt');

class MqttHandler {
	constructor(host, username, password, topics) {
		this.mqttClient = "styriaPlusPes";
		this.host = host;
		this.username = username; // mqtt credentials if these are needed to connect
		this.password = password;
		this.topics = topics
		this.curr_values_arr = new Array()
	/*    this.temp_meassured = false
		this.light_meassured = false
		this.door_checked = false */
		this.sensor_count = 3
		this.http_response = null
	}
  
	connect() {
		// Connect mqtt with credentials (in case of needed, otherwise we can omit 2nd param)
		this.mqttClient = mqtt.connect(this.host, { username: this.username, password: this.password });

		// Mqtt error calback
		this.mqttClient.on('error', (err) => {
			console.log(err);
			this.mqttClient.end();
		});

		// Connection callback
		this.mqttClient.on('connect', () => {
			console.log(`mqtt client connected`);
		});

		// mqtt subscriptions
		if(this.topics){
			for(let i = 0; i < this.topics.length; i++){
				this.mqttClient.subscribe(this.topics[i], {qos: 0})
			}
		}

		// When a message arrives, console.log it
		this.mqttClient.on('message', (topic, message) => {
			if(topic.toString() === `${process.env.MQTT_RECIEVE_PREFIX}/current_values`){
				this.handleCurrValues(message)
			}
			//console.log(message.toString())
		});

		this.mqttClient.on('close', () => {
			console.log(`mqtt client disconnected`);
		});
	}

  // Sends a mqtt message to topic: mytopic
  	sendMessage(topic, message) {
		this.mqttClient.publish(topic, message);
  	}

  	handleCurrValues(message){
		let msg = JSON.parse(message.toString())
		this.curr_values_arr.push(msg)
		if(this.curr_values_arr.length === this.sensor_count){
			this.http_response.status(200).send(JSON.stringify(this.curr_values_arr))
			this.curr_values_arr = new Array()
			this.http_response = null
		}
	}

  	setResponseObj(obj){
    	if(this.http_response == null)
      		this.http_response = obj
  	}
}

module.exports = MqttHandler;