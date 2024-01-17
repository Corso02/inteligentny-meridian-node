const sqlite = require("sqlite3").verbose()
const crypto = require("crypto")
const path = require("path")

class Database{
    constructor(logger){
        //console.log(path.resolve(__dirname, "database.sqlite"))
        this.db = new sqlite.Database(path.resolve(__dirname, "database.sqlite"), err => {
            if(err) this.logger.log("error", "Error with opening db")
        })
        this.logger = logger
    }
    checkCredential(name, password, res){
        let hashedPassword = crypto.createHash("sha256").update(password).digest("hex").toString()
        let statement = this.db.prepare("SELECT * FROM users WHERE user_name = :name AND user_password = :password", [name, hashedPassword], err => {
            if(err) this.logger.log("error", "Error for prepare statement checkCredential")
        })
        statement.get((err, row) => {
            if(err || !row){
                res.json({success: false})
            }
            else{
                res.json({success: true, is_admin: row.is_admin})
            }
        })
        statement.finalize()
    }

    checkCardId(cardId, mqttClient){
        let statement = this.db.prepare("SELECT user_id FROM users where card_id = :cardId", [cardId], err => {
            if(err) this.logger.log("error", "Error for prepare statement checkCardId")
        })
        statement.get((err, row) => {
            if(err || !row){
                if(!row)
                    this.logger.log("error", "No user found with given card")
                else
                    this.logger.log("error", "Error in statement checkCardId")
                mqttClient.publish(`${process.env.MQTT_SEND_PREFIX}/cardId/res`, JSON.stringify({success: false}))
            }
            else{
                this.getUserPreferences(row.user_id, mqttClient)        
            }
        })
        statement.finalize()
    }

    getUserPreferences(userId, mqttClient){
        let statement = this.db.prepare("SELECT * FROM preferences where user_id = :userId", [userId], err => {
            if(err) this.logger.log("error", "Error for prepare statement getUserPreferences")
        })
        statement.get((err, row) => {
            if(err || !row){
                this.logger.log("error", "Error in statement prefs")
                mqttClient.publish(`${process.env.MQTT_SEND_PREFIX}/cardId/res`, JSON.stringify({success: false}))
            }
            else{
                const { min_temp, max_temp, min_light } = row
                mqttClient.publish(`${process.env.MQTT_SEND_PREFIX}/cardId/res`, JSON.stringify({success: true, min_temp, max_temp, min_light}))
            }
        })
        statement.finalize()
    }

    closeConn(){
        this.db.close()
    }
}

module.exports = Database