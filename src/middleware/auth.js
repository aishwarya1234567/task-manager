const jwt = require('jsonwebtoken')
const User = require('../model/user')

const auth = async (req,res,next)=>{
    try{
        const authToken = req.header('Authorization').replace('Bearer ', '')
        const decoded = jwt.verify(authToken, process.env.JWT_TOKEN)

        const user = await User.findOne({'_id':decoded._id, 'tokens.token':authToken})
        if(!user)
        {
            throw new Error()
        } 
        req.user = user 
        req.token = authToken
        next()
    }catch(e){
        res.status(400).send({error: 'Authentication required.'})
    }
}

module.exports = auth