const express = require('express');
const path = require('path');
const fs = require('fs');

const Router = express.Router();
const bcrypt = require('bcrypt');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();
const User = require('../models/User')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const checkAuth = require('../middleware/checkAuth')

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});



Router.post('/signup', async (req, res) => {
  try {
   const users = await User.find({ email: req.body.email })
   if(users.length>0){
    return res.status(500).json({
        message:"Email already exists"
    }) 
   }



    const hashCode = await bcrypt.hash(req.body.password, 10)
    const uploadedImage = await cloudinary.uploader.upload(req.files.logo.tempFilePath)
     

    const newUser = new User({
        _id:new mongoose.Types.ObjectId,
        channelName:req.body.channelName,
        email:req.body.email,
        phone:req.body.phone,
        password:hashCode,
        logoUrl:uploadedImage.secure_url,
        logoId:uploadedImage.public_id
    })

    const user = await newUser.save()
     res.status(200).json({
        newUser:user
        })
   

    // Check file exists
    if (!req.files || !req.files.logo) {
      return res.status(400).json({
        message: "No file uploaded"
      });
    }

    const logo = req.files.logo;

    // Ensure uploads folder exists
    const uploadDir = path.join(__dirname, '../uploads');

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }

    // Unique filename
    const fileName = Date.now() + '-' + logo.name;
    const uploadPath = path.join(uploadDir, fileName);

    // Move file
    await logo.mv(uploadPath);

    return res.status(200).json({
      message: "File uploaded successfully",
      fileName: fileName,
      body: req.body
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Upload failed",
      error: error.message
    });
  }
});

Router.post('/login', async (req, res) => {
    try
    {
        console.log(req.body)
       const users =  await User.find({email:req.body.email})
       console.log(users)
       if(users.length==0)
       {
        return res.status(500).json({
            message:"Email is not registered...."
        })
         }

        const isvalid = await bcrypt.compare(req.body.password, users[0].password)
        console.log(isvalid)
        if(!isvalid)
        {
            return res.status(500).json({
                message:"Invalid password"
            })
        }   
        const token = jwt.sign({
            _id:users[0]._id,
            channelName:users[0].channelName,
            email:users[0].email,
            phone:users[0].phone,
            logoId:users[0].logoId,
        },
        'sbs online classes 123',
        {
            expiresIn:'365d'
        }
    )
        res.status(200).json({
            _id:users[0]._id,
            channelName:users[0].channelName,
            email:users[0].email,
            phone:users[0].phone,
            logoId:users[0].logoId,
            logoUrl:users[0].logoUrl,
            token:token,
            subscribedChannels:users[0].subscribedChannels
            
        })

      



    }
    catch(err)
    {
        console.log(err)
        res.status(500).json({
            message:"Login failed",
            error:err.message
        })
    }
})


//subscribe api
Router.put('/subscribe/:userBId',checkAuth,async(req,res)=>{
    try
    {
    const userA = await jwt.verify(req.headers.authorization.split(" ")[1],'sbs online classes 123')
    console.log(userA)
    userB = await User.findById(req.params.userBId)
    console.log(userB)
    if(userB.subscribedBy.includes(userA._id))
    {
        return res.status(500).json({
            message:"You have already subscribed to this channel"
        })
    }
    // console.log('not subscribed') 
    userB.subscribers += 1
    userB.subscribedBy.push(userA._id)
    await userB.save()
   const userAFullInformattion = await User.findById(userA._id)
   userAFullInformattion.subscribedChannels.push(userB._id)
    await userAFullInformattion.save()
    res.status(200).json({
     message:"Subscribed successfully",
     subscribedChannels:userAFullInformattion.subscribedChannels
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

//unsubscribe api
Router.put('/unsubscribe/:userBId',checkAuth,async(req,res)=>{
    try
    {
    const userA = await jwt.verify(req.headers.authorization.split(" ")[1],'sbs online classes 123')
    const userB = await User.findById(req.params.userBId)
    console.log(userA)
    console.log(userB)
    if(userB.subscribedBy.includes(userA._id))
    {
        //unsubscribe logic
        userB.subscribers -= 1
        userB.subscribedBy = userB.subscribedBy.filter(userId => userId.toString() != userA._id.toString())
        await userB.save()
       const userAFullInformattion = await User.findById(userA._id)
       userAFullInformattion.subscribedChannels = userAFullInformattion.subscribedChannels.filter(userId => userId.toString() != userB._id.toString())
        await userAFullInformattion.save()
        res.status(200).json({
         message:"Unsubscribed successfully",
         subscribedChannels:userAFullInformattion.subscribedChannels
        })
    }
    else
    {
        return res.status(200).json({
            message:"You are not subscribed to this channel"        
           
        }) 
    } 
    

    }
    catch(err)
    {
       
        
    }
})


module.exports = Router;