const JWT = require('jsonwebtoken');
const createError = require('http-errors');
const client = require('./init_redis')

module.exports = {
    signAccessToken: (userId) => {
        return new Promise((resolve,reject)=>{
            const payload = {
            }
            const secret = process.env.ACCESS_TOKEN_SECRET
            const options = {
                expiresIn: '15s',
                issuer: "vaibhav.com",
                audience: userId
            }
            JWT.sign(payload,secret,options,(err,token)=>{
                if(err){
                    console.log(err.message);
                    reject(createError.InternalServerError());
                }
                resolve(token)
            })
        })
    },

    verifyAccessToken: (req,res,next) => {
        if (!req.headers['authorization']) return next(createError.Unauthorized())
        const authHeader = req.headers['authorization']
        const bearerToken = authHeader.split(' ')
        const token = bearerToken[1]

        JWT.verify(token, process.env.ACCESS_TOKEN_SECRET,(err,payload)=>{
            if(err) {
                if(err.name == "JsonWebTokenError"){
                    return next(createError.Unauthorized())
                }else {
                    return next(createError.Unauthorized(err.message))
                }
            }
            req.payload = payload
            next()
        })

    },

    signRefreshToken: (userId) => {
        return new Promise((resolve,reject)=>{
            const payload = {
            }
            const secret = process.env.REFRESH_TOKEN_SECRET
            const options = {
                expiresIn: '1y',
                issuer: "vaibhav.com",
                audience: userId
            }
            JWT.sign(payload,secret,options,async (err,token)=>{
                if(err){
                    console.log(err.message);
                    reject(createError.InternalServerError());
                }


                try {

                    await client.SET(userId,token,{
                        EX: 365 * 24 * 60 * 60
                    })
                    
                    resolve(token)

                } catch (error) {
                    console.log(error.message)
                    reject(createError.InternalServerError());
                }
                
            })
        })
    },

    verifyRefreshToken: (refreshToken) => {
        return new Promise((resolve,reject)=>{
            JWT.verify(refreshToken,process.env.REFRESH_TOKEN_SECRET,async (err,payload)=>{
                if (err) return reject(createError.Unauthorized())
                const userId = payload.aud

                try {
                    const result = await client.get(userId);
                    
                    if(result == refreshToken) resolve(userId)
                    else reject(createError.Unauthorized())

                } catch (error) {
                    console.log(error.message)
                    reject(createError.InternalServerError())
                }

            })
        })
    }
}
