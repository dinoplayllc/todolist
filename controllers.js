import mongoose from "mongoose";
import {UserModel, MotherModel, UniqueIdModel} from './models.js';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { connURL } from './index.js'; 
import md5 from 'md5';
import {generateUniqueId, insertDoc, updateDoc, deleteDoc} from './index.js'
const __dirname = dirname(fileURLToPath(import.meta.url));
import { generateUniqueToken } from "./index.js";
import nodemailer from 'nodemailer';
import sanitize from 'mongo-sanitize';

export const regiFailed = false;
export const regiSuc = false;
export let loggedIn = false;

export async function logout(req, res) {
    try {
        req.session.destroy(err => {
            if (err) {
                console.error('Error destroying session:', err);
            }
            // Redirect the user to the login page or another appropriate page
            res.redirect('/');
        });
    } catch (error) {
        console.log(error);
    }
 
}

export async function login(req, res){
    await mongoose.connect(`${connURL}`);
    const { userLog, passLog } = req.body;

    try {
      const email = await UserModel.findOne({ email: userLog });
      const user = await UserModel.findOne({ username: userLog });
      console.log(user);
      console.log(email);
      if (userLog && user && (user.password === md5(passLog))) {
   
        const read = await MotherModel.find({});
        req.session.userId = user._id;
        req.session.loginTimestamp = Date.now();
        loggedIn = true;
        console.log(user._id);
        res.redirect('/:userID');
      } else if (userLog && email && (email.password === md5(passLog))) {
        const read = await MotherModel.find({});
        req.session.userId = email._id;
        req.session.loginTimestamp = Date.now();
        loggedIn = true;
        console.log(email._id);
        res.redirect('/:userID');
    } else {
        // Login failed
        console.log("error");
        res.render(__dirname + '/views/index.ejs', { loggedIn: false, regiFailed:false, regiSuc:false });
      }
    } catch (error) {
      console.error('Error:', error);
      res.status(500).send('Server Error');
    }
}

export async function submit(req, res) {
    let item = req.body.note;
    let motherName = req.body.motherName;
    const userId = req.session.userId;

   if(loggedIn === false){
        res.redirect('/');
    }else {
        
    await insertDoc(userId, motherName, item); // Save the new document to the database
    res.redirect('/:userID');
    }
}

export async function register(req, res) {
    try {
        const { email, username, password, passwordVer } = req.body;

        const userId = await generateUniqueId('users');
        const md5Pass = md5(password);
        const md5PassVer = md5(passwordVer);
        const verificationToken = generateUniqueToken();
        if(md5Pass != md5PassVer){
            res.render(__dirname + '/views/status/IncorrectPass.ejs', {loggedIn:false, regiFailed:true,  regiSuc:false});
        } else {
            const newUser = new UserModel(
                {
                    _id: `user_${userId}`,
                    email,
                    username,
                    isVerified: false, 
                    verificationToken,
                    password: md5Pass
                });
    
            await newUser.save();
            
            const verificationLink = `http://localhost:3000/verify/${verificationToken}`;


           
            // Create a Nodemailer transporter with OAuth2
            const transporter = nodemailer.createTransport({
                host: 'smtp.office365.com',
                port: 587, // Use the correct port for Office 365 SMTP
                secure: false, // Use false if you're using a non-secure connection
                auth: {
                    user: 'admin@doulafocus.com',
                    pass: 'binah!1997A'
                }
            });
            const mailOptions = {
                from: 'admin@doulafocus.com',
                to: email,
                subject: 'Email Verification',
                text: `Please click on the following link to verify your email: ${verificationLink}`
            };
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Error sending email:', error);
                    res.render(__dirname + '/views/status/emailError.ejs', { loggedIn: false, regiFailed:true, regiSuc:false, error });
                } else {
                    console.log('Email sent:', info.response);
                    res.render(__dirname + '/views/status/regSuc.ejs', { loggedIn: false, regiFailed: false, regiSuc:true });
                }
            });
    
            //res.render(__dirname + '/views/status/regSuc.ejs', {loggedIn:false, regiFailed:false});
        }

    } catch (error) {
        console.error('Registration error:', error);
        res.render(__dirname + '/views/status/regFail.ejs', {loggedIn:false, regiFailed: true, regiSuc:false});
    }
}
export async function updateList(req, res) {
    let motherName = req.body.motherName;
    console.log("Received motherName:", motherName); // Debugging statement
    
    // Access the "name" property of the motherName object
    const name = motherName.name;

    console.log("Mother's name:", name); // Debugging statement

    if(loggedIn === false){
        res.redirect('/');
    }else {
    
    await deleteDoc(name);
    res.redirect('/:userID');
    }
}
  
export async function updateNotes(req, res) {
    const motherID = req.body.motherName._id;
  
    const userId = req.session.userId; // Get the userId from the session
    console.log("userId:", userId); // Debugging statement
  
    if (!loggedIn) { // Note the change here, using "!" to negate the "loggedIn" variable
      res.redirect('/');
    } else {
      await updateDoc(motherID, req.body.updateNote);
      res.redirect(`/${userId}`);
    }
}

export async function getIndexPage(req, res) {
    if (!req.session.loginTimestamp || Date.now() - req.session.loginTimestamp > 24 * 60 * 60 * 1000) {
      // User is not logged in
      res.render(__dirname + '/views/home.ejs', { loggedIn: false, regiFailed:false, regiSuc:false });
    } else {
      // User is logged in
      const userId = req.session.userId;
      // Your logic for logged-in users goes here
      // For example, fetch data for the logged-in user and render the page accordingly
      res.redirect(`/${userId}`);
    }
  }
  
  export async function getUserPage(req, res) {
    const read = await MotherModel.find({});
    // Your logic for logged-in users goes here
    // You can use req.session.userId to access the logged-in user's ID
    const userId = req.session.userId;
  
    // Check if the logged-in user's ID matches the requested userID
    if (userId === req.params.userID) {
      res.render(__dirname + '/views/index.ejs', { motherName: read, loggedIn: true, regiFailed:false,  regiSuc:false });
      //res.redirect(`/${userId}`);
    } else {
      // Redirect to a different URL for unauthorized access
      res.redirect(`/`);
    }
  }

  export async function verify(req, res){
    const verificationToken = req.params.token;

    try {
        // Find the user by verification token
        const user = await UserModel.findOne({ verificationToken });

        if (!user) {
            res.render(__dirname + '/views/status/invalidToken.ejs', {loggedIn:false,regiFailed:true,  regiSuc:false} );
        }

        // Update user's verification status
        user.isVerified = true;
        user.verificationToken = undefined; // Clear the token
        await user.save();

        res.redirect('/');
        //res.render(__dirname + '/views/index.ejs', {loggedIn:false, regiFailed:false,  regiSuc:false});
    } catch (error) {
        res.render(__dirname+ '/views/status/verFail.ejs', {error:error, loggedIn:false, regiFailed:false,  regiSuc:false});
    }

  }

  export async function home(req, res) {

        res.render(__dirname + '/views/home.ejs', { loggedIn: loggedIn, regiFailed: false, regiSuc: false });

}