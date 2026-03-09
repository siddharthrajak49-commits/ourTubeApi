const express = require('express');
const Router = express.Router();
const comment = require('../models/comment')
const checkAuth = require('../middleware/checkAuth')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')

Router.post('/new-comment/:videoId',checkAuth,async(req,res)=>{ 
    try
     {
        const verifiedUser = await jwt.verify(req.headers.authorization.split(" ")[1],'sbs online classes 123')
        console.log(verifiedUser)
        const newComment = new comment({
            _id: new mongoose.Types.ObjectId(),
            user_id: verifiedUser._id,
            videoId:req.params.videoId,
            commentText:req.body.commentText
        })
        const savedComment =await newComment.save()
        res.status(200).json({
            message:"Comment added successfully",
            comment:savedComment
        })
       
     }
        catch(err)
        {   
            console.log(err);
            res.status(500).json({
                error:"err" 
            })
        }
       
})

//get all comments of a video
Router.get('/:videoId',async(req,res)=>{
    try
    {
        const comments = await comment.find({videoId:req.params.videoId}).populate('user_id','channelName logoUrl')
        res.status(200).json({
            commentlist:comments
        })
    }
    catch(err)
    {
        console.log(err);
        res.status(500).json({
            error:"err"
        })
    }
})

//update comment
Router.put('/:commentId',checkAuth,async(req,res)=>{
    try
    {
        const verifiedUser = await jwt.verify(
            req.headers.authorization.split(" ")[1],
            'sbs online classes 123'
        )

        const commentData = await comment.findById(req.params.commentId)
        console.log(commentData)

        if(!commentData){
            return res.status(404).json({
                error:"Comment not found"
            })
        }

        if(commentData.user_id.toString() !== verifiedUser._id.toString()){
            return res.status(403).json({
                error:"You are not the owner of this comment"
            })
        }

        commentData.commentText = req.body.commentText

        const updatedComment = await commentData.save()

        res.status(200).json({
            message:"Comment updated successfully",
            comment:updatedComment
        })

    }  
    catch(err)
    {
        console.log(err)
        res.status(500).json({
            error:"Server error"
        })
    }
})


//delete comment
Router.delete('/:commentId',checkAuth,async(req,res)=>{
    try
    {
        const verifiedUser = await jwt.verify(
            req.headers.authorization.split(" ")[1],
            'sbs online classes 123'
        )

        const commentData = await comment.findById(req.params.commentId)
        console.log(commentData)

        if(!commentData){
            return res.status(404).json({
                error:"Comment not found"
            })
        }

        if(commentData.user_id.toString() !== verifiedUser._id.toString()){
            return res.status(403).json({
                error:"You are not the owner of this comment"
            })
        }

        await comment.findByIdAndDelete(req.params.commentId)
        res.status(200).json({
            message:"Comment deleted successfully"
        })

    }  
    catch(err)
    {
        console.log(err)
        res.status(500).json({
            error:"Server error"
        })
    }
})

    
 

module.exports = Router;