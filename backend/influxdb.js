const influx = require("@influxdata/influxdb-client")

class InfluxDbHandler{
    constructor(url, token, org, bucket){
        this.queryApi = new influx.InfluxDB({url, token}).getQueryApi(org)        
        this.bucket = bucket
    }

    testQuery(){
        const query = `from(bucket: "${this.bucket}")\
        |> range(start: -10s)\
        |> filter(fn: (r) => r["cpu"] == "cpu-total")\
        |> filter(fn: (r) => r["_field"] == "usage_system")\
        |> filter(fn: (r) => r["_measurement"] == "metrics")\
        |> yield(name: "mean")\
        `
        this.queryApi.queryRows(query, {
            next(row, tableMeta){
                const o = tableMeta.toObject(row)
                console.log(o)
            },
            complete(){
                console.log('FINISHED')
            },
            error(error){
                console.log('QUERY FAILED', error)
            }
        })
    }

    getValuesForAdminPanel(res){
        // query ktora mi vytiahne posledne merania teplomera a osvetlenia + kedy boli naposledy otvorene dvere
        let res_body = {
            values:[
                {
                    name: "temp",
                    dt: new Date(),
                    battery: "50"
                },
                {
                    name: "light",
                    dt: new Date(),
                    battery: "25"
                },
                {
                    name: "door",
                    dt: new Date(),
                    battery: "85"
                }
            ]
        }
        res.status(200).json(JSON.stringify(res_body))
    }
}

module.exports = InfluxDbHandler
