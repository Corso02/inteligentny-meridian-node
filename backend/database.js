const sqlite = require("sqlite3").verbose()
const crypto = require("crypto")
const path = require("path")

class Database{
    constructor(){
        //console.log(path.resolve(__dirname, "database.sqlite"))
        this.db = new sqlite.Database(path.resolve(__dirname, "database.sqlite"), err => {
            if(err) console.log("error with db")
            else console.log("database opened")
        })
    }
    async checkCredential(name, password, res){
        let hashedPassword = crypto.createHash("sha256").update(password).digest("hex").toString()
        let statement = this.db.prepare("SELECT * FROM users WHERE user_name = :name AND user_password = :password", [name, hashedPassword], err => {
            if(err) console.error("Error for prepare statement checkCredential")
        })
        statement.get((err, row) => {
            if(err || !row){
                res.json({success: false})
            }
            else{
                res.json({success: true, is_admin: row.is_admin})
            }
        })
    }
}

module.exports = Database