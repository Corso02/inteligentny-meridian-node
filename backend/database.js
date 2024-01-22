const sqlite = require("sqlite3").verbose()
const crypto = require("crypto")
const path = require("path")

class Database{
    constructor(logger){
        //console.log(path.resolve(__dirname, "database.sqlite"))
        this.db = new sqlite.Database(path.resolve(__dirname, "database.sqlite"), err => {
            if(err) this.logger.log("error", "Error with opening db")
            else this.logger.log("info", "DB opened")
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
                res.json({success: true, is_admin: row.is_admin, user_id: row.user_id})
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
                mqttClient.publish(`${process.env.MQTT_SEND_PREFIX}/temperature/res/set`, JSON.stringify({success: false}))
            }
            else{
                this.getUserPreferences(row.user_id, mqttClient)        
            }
        })
        statement.finalize()
    }

    getUserPreferences(userId, mqttClient, res){
        let statement = this.db.prepare("SELECT * FROM preferences where user_id = :userId", [userId], err => {
            if(err) this.logger.log("error", "Error for prepare statement getUserPreferences")
        })
        statement.get((err, row) => {
            if(err || !row){
                this.logger.log("error", "Error in statement prefs")
                if(mqttClient)
                    mqttClient.publish(`${process.env.MQTT_SEND_PREFIX}/temperature/res/set`, JSON.stringify({success: false}))
                else if(res)
                    res.status(404).json({success: false})
            }
            else{
                const { min_temp, max_temp, min_light } = row
                if(mqttClient)
                    mqttClient.publish(`${process.env.MQTT_SEND_PREFIX}/temperature/res/set`, JSON.stringify({success: true, min_temp, max_temp, min_light}))
                else if(res)
                    res.status(200).json({success: true, min_temp, max_temp, min_light})
            }
        })
        statement.finalize()
    }

    checkUserPrefsExists(userId, prefs, res){
        let statement = this.db.prepare("SELECT * FROM preferences WHERE user_id = :id", [userId], (err) => {
            if(err){
                this.logger.log("error", "error preparing statement checkUserPrefsExists")
            }
        })
        statement.get((err, row) => {
            if(err){
                console.log("err")
                this.logger.log("error", "error running statement checkUserPrefsExists")
                res.sendStatus(500)
            }
            else if(!row){
                this.saveUserPrefs(userId, prefs, res, false)
            }
            else{
                this.saveUserPrefs(userId, prefs, res, true)
            }
        })
    }

    saveUserPrefs(userId, prefs, res, found){
        let statement_str = ""
        if(!found)
            statement_str = "INSERT INTO preferences (min_temp, max_temp, min_light, send_alerts, email, send_all_alerts, user_id) VALUES (:min_temp, :max_temp, :min_light, :alerts, :email, :allAlerts, :user_id)"
        else
            statement_str = "UPDATE preferences SET min_temp = :min_temp, max_temp = :max_temp, min_light = :min_light, send_alerts = :alerts, email = :email, send_all_alerts = :allAlerts WHERE user_id = :id"
        let dependencies = [prefs.min_temp, prefs.max_temp, prefs.min_light]

        if(prefs.alerts)
            dependencies.push(1)
        else
            dependencies.push(0)

        if(prefs.email)
            dependencies.push(prefs.email)
        else
            dependencies.push("")

        if(prefs.allAlerts)
            dependencies.push(1)
        else
            dependencies.push(0)

        dependencies.push(userId)

        let statement = this.db.prepare(statement_str, dependencies, (err) => {
            if(err) {
                console.log("error savePrefs")
                console.log(err)
                this.logger.log("error", "Error for prepare statement saveUserPrefs")
                res.sendStatus(500)
                return
            }
        })
        statement.run(err => {
            if(err){
                console.log("error running statement savePrefs")
                this.logger.log("error", "Error for running statement saveUserPrefs")
                statement.finalize()
                res.sendStatus(500)
            }
            else{
                res.sendStatus(200)
                statement.finalize()
            }
        })
    }

    closeConn(){
        this.db.close()
    }
}

module.exports = Database