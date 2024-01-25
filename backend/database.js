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
                const { min_temp, max_temp, min_light, email, send_alerts, send_all_alerts } = row
                if(mqttClient)
                    mqttClient.publish(`${process.env.MQTT_SEND_PREFIX}/temperature/res/set`, JSON.stringify({success: true, min_temp, max_temp, min_light}))
                else if(res)
                    res.status(200).json({success: true, min_temp, max_temp, min_light, email, send_alerts, send_all_alerts})
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
                res.status(200).json({success: true})
                statement.finalize()
            }
        })
    }

    checkIfUserExists(name, password, card_id, res){
        let statement = this.db.prepare("SELECT * FROM users WHERE user_name = :name", [name], (err) => {
            if(err){
                this.logger.log("error", "error preparing statement checkIfUserExists")
            }
        })
        statement.get((err, row) => {
            if(err || row){
                res.status(200).json({success: false, reason: "already exists"})
            }
            else this.registerUser(name, password, card_id, res)
        })

    }

    registerUser(name, password, card_id, res){
        let hashedPassword = crypto.createHash("sha256").update(password).digest("hex").toString()
        let statement = this.db.prepare("INSERT into users (user_name, user_password, is_admin, card_id) VALUES (:name, :password, :admin, :card_id)", [name, hashedPassword, 0, card_id], (err) => {
            if(err){
                this.logger.log("error", "error preparing statement registerUser")
                console.log(err)
                res.status(200).json({success: false, reason: "server error"})
            }
        })
        statement.run((err) => {
            if(err){
                this.logger.log("error", "error inserting new user")
                res.status(200).json({success: false, reason: "server error"})
            }
            else{
                this.createPrefsForNewUser(name, res)
            }
        })
    }

    createPrefsForNewUser(name, res){
        let statement = this.db.prepare("SELECT user_id FROM users where user_name = :name", [name], (err) => {
            if(err){
                this.logger.log("error", "error preparing statement createPrefsForNewUser")
                res.status(200).json({success: false, reason: "prefs error"})
            }
        })
        statement.get((err, row) => {
            if(err || !row){
                this.logger.log("error", "error running statement to get user_id in createPrefsForNewUser")
                res.status(200).json({success: false, reason: "prefs error"})
            }
            else{
                const { user_id } = row
                this.saveUserPrefs(user_id, {min_light: 50, min_temp: 21, max_temp: 25, email: "", alerts: false, allAlerts: false}, res, false)
            }
        })
    }

    getAllUsers(res){
        this.db.all("SELECT user_name, user_id FROM users where is_admin = 0", (err, row) => {
            if(err){
                this.logger.log("error", "error running getAllUsers")
                res.status(200).json({success: false})
            }
            else{
                res.status(200).json({success: true, row})
            }
        })
    }

    deleteUser(user_id, res){
        let statement = this.db.prepare("DELETE FROM users WHERE user_id = :id", [user_id], (err) => {
            if(err){
                this.logger.log("error", "error prepare statement deleteUser")
                res.status(200).json({success: false})
            }
        })
        statement.run(err => {
            if(err){
                this.logger.log("error", "error deleting user")
                res.status(200).json({success: false})
            }
            else
                res.status(200).json({success: true})
        })
    }

    changeUserCard(user_id, card_num, res){
        let statement = this.db.prepare("UPDATE users SET card_id = :card WHERE user_id = :id", [card_num, user_id], (err) => {
            if(err){ 
                this.logger.log("error", "error preparing statement changeUserCard")
                res.status(200).json({success: false})
            }
        })
        statement.run(err => {
            if(err){
                this.logger.log("error", "error running statement changeUserCard")
                res.status(200).json({success: false})
            }
            else
                res.status(200).json({success: true})
        })
    }

    closeConn(){
        this.db.close()
    }
}

module.exports = Database