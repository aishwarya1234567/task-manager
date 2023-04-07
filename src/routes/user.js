const User = require('../model/user')
const express = require('express')
const auth = require('../middleware/auth')
const multer = require('multer')
const sharp = require('sharp') 
const {sendAccountCreationMail, sendAccountDeletionMail} = require('../emails/account')

const router = new express.Router()

router.post('/users', async (req,res)=>{
    const user = new User(req.body)
    try{
        await user.save()
        sendAccountCreationMail(user.email, user.name)
        const token = await user.generateAuthToken()
        res.status(201).send({user, token})
    }catch(error){
        res.status(500).send(error)
    }
})

router.post('/users/login', async (req,res)=>{
    try{
        const user = await User.findByCredentials(req.body.email, req.body.password)
        if(!user)
        {
            return res.status(404).send()
        }
        const token = await user.generateAuthToken()
        res.send({user, token})
    }catch(error){
        res.status(500).send(error)
    }

})

router.post('/users/logout', auth, async (req, res)=>{
    try{
        req.user.tokens = req.user.tokens.filter((token)=>token.token !== req.token)

        await req.user.save()
        res.send()
    }catch(error){
        res.status(500).send(error)
    }
})

router.post('/users/logoutAll', auth, async (req, res)=>{
    try{
        req.user.tokens = []

        await req.user.save()
        res.send()
    }catch(error){
        res.status(500).send(error)
    }
})

router.get('/users/me', auth, async (req,res)=>{
    try{
        const user = req.user
        res.send(user)
    }catch(error){
        res.status(500).send(error)
    }
})

router.patch('/users/me', auth, async (req, res)=>{
    const updates = Object.keys(req.body)
    const allowedFields = ["name", "email", "password", "age"]

    const isValidation = updates.every((update)=>allowedFields.includes(update))

    if(!isValidation)
    {
        return res.status(400).send({error: "Invalid updates!"})
    }

    try{
        // const user = await User.findByIdAndUpdate(id, req.body, {new : true, runValidators : true})
        updates.forEach((update)=>req.user[update]=req.body[update])
        await req.user.save()
        
        res.send(req.user)
    }catch(error){
        console.log(error)
    }
})

router.delete('/users/me', auth, async (req, res)=>{
    try{
        await User.findOneAndDelete({_id:req.user._id})
        sendAccountDeletionMail(req.user.email, req.user.name)
        res.send(req.user)
    }catch(error){
        console.log(error)
    }
})

const upload = multer({
    limits : {
        fileSize : 1000000
    },
    fileFilter(req, file, callback){
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/))
        {
            callback(new Error('Please upload image file only.'))
        }
        callback(undefined, true)
    }
})

router.post('/users/me/avatar', upload.single('avatar'), auth, async (req, res) =>{
    const buffer = await sharp(req.file.buffer).png().resize({width:250,height:250}).toBuffer()
    req.user.avatar = buffer

    await req.user.save()
    res.send()
}, (error, req, res, next)=>{
    res.status(400).send({error: error.message})
})

router.delete('/users/me/avatar', auth, async (req, res) =>{
    req.user.avatar = undefined
    await req.user.save()
    res.send()
})

router.get('/users/:id/avatar', async (req, res) =>{
    try{
        const user = await User.findById(req.params.id)
        if(!user || !user.avatar)
        {
            throw new Error('Avatar not found')
        }
        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    }catch(e){
        res.status(400).send(e)
    }
})

module.exports = router