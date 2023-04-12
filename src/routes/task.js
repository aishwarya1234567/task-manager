const Task = require('../model/task')
const express = require('express')
const auth = require('../middleware/auth')

const router = new express.Router()

router.post('/tasks',auth, async (req,res)=>{
    try{
        const task = new Task({
            ...req.body,
            owner: req.user._id
        })
        await task.save()
        res.status(201).send(task)
    }catch(error){
        res.status(500).send(error)
    }
})

// GET /tasks?limit=2&skip=2
// GET /tasks?completed=true
// GET /tasks?sortBy=createdAt_asc
router.get('/tasks',auth, async (req,res)=>{
    const match = {}
    const sort = {}
    if(req.query.completed)
    {
        match.completed = req.query.completed === 'true'
    }
    if(req.query.sortBy)
    {
        const parts = req.query.sortBy.split('_')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }

    try{
        const tasks = await Task.find({owner: req.user._id})
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit) || null,
                skip: parseInt(req.query.skip) || null,
                sort
            },
        })
        res.send(req.user.tasks)
    }catch(error){
        res.status(500).send(error)
    }
})

router.get('/tasks/:id', auth, async (req,res)=>{
    const _id = req.params.id

    try{
        const task = await Task.findOne({_id, owner:req.user._id})
        if(!task)
        {
            return res.status(404).send()
        }
        res.send(task)
    }catch(error){
        res.status(500).send(error)
    }
})

router.patch('/tasks/:id', auth, async (req, res)=>{
    const _id = req.params.id

    const task = await Task.findOne({_id, owner:req.user._id})
    if(!task)
    {
        return res.status(404).send()
    }

    const updates = Object.keys(req.body)
    const allowedFields = ["description", "completed"]

    const isValidation = updates.every((update)=>allowedFields.includes(update))

    if(!isValidation)
    {
        return res.status(400).send({error: "Invalid updates!"})
    }

    try{
        // const task = await Task.findByIdAndUpdate(id, req.body, {new : true, runValidators : true})
        updates.forEach((update)=>task[update] = req.body[update])
        await task.save()
        res.send(task)
    }catch(error){
        return res.status(400).send(error)
    }
})

router.delete('/tasks/:id', auth, async (req, res)=>{
    const _id = req.params.id
    try{
        const task = await Task.findOneAndDelete({_id, owner: req.user._id})
        if(!task)
        {
            return res.status(404).send()
        }

        res.send(task)
    }catch(error){
        return res.status(400).send(error)
    }
})

module.exports = router