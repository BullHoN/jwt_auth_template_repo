const redis = require('redis')

const client = redis.createClient()

client.on('connect',()=>{
    console.log("Client Connected to redis")
})

client.connect()

client.on('error',(err)=>{
    console.log(err.message);
})

client.on('ready',()=>{
    console.log("Client Connected to redis and ready to use")
})

client.on('end',()=>{
    console.log("Client disonnected to redis")
})

process.on('SIGINT',()=>{
    client.quit()
})

module.exports = client;