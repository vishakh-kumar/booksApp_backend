//================================
//          Dependencies
//================================
//get .env variables
require("dotenv").config();
//pull PORT from .env, give default value of 5000
//pull MONGODB_URL from .env
const { PORT, MONGODB_URL } = process.env;
//import express
const express = require("express");
//create application object
const app = express();
//import mongoose
const mongoose = require("mongoose");
//import cors and morgan
const cors = require("cors");
const morgan = require("morgan");

const bcrypt = require("bcrypt");

//================================
//      DATABASE CONNECTION
//================================
// Establish Connection
mongoose.connect(MONGODB_URL, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
});
// Connection Events
mongoose.connection
    .on("open", () => console.log("You are connected to mongoose"))
    .on("close", () => console.log("You are disconnected from mongoose"))
    .on("error", (error) => console.log(error));

//================================
//          MODELS
//================================
const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    profileImage: String,
});

const User = mongoose.model("User", UserSchema);

//================================
//          MIDDLEWARE
//================================
app.use(cors()); // to prevent cors errors, open access to all origin
app.use(morgan("dev")); //logging
app.use(express.json()); // parse json bodies

//================================
//          Routes
//================================
//create a test route
app.get("/user", (req, res) => {
    res.send("sei");
});

//================================
//      USER Sign Up ROUTE
//================================
app.post("/user/signup", (req, res) => {
    let { name, email, password, profileImage } = req.body;

    if (name == "" || email == "" || password == "" || profileImage == "") {
        res.json({
            status: "Failed",
            message: "Empty Input Fields!",
        });
    } else if (password.length < 4) {
        res.json({
            status: "Failed",
            message: "Password too short",
        });
    } else {
        User.find({ email })
            .then((result) => {
                if (result.length) {
                    res.json({
                        status: "Failed",
                        message: " User already exists!",
                    });
                } else {
                    //create new user

                    //password hashing
                    const saltRounds = 10;
                    bcrypt
                        .hash(password, saltRounds)
                        .then((hashedPassword) => {
                            const newUser = new User({
                                name,
                                email,
                                password: hashedPassword,
                                profileImage,
                            });
                            newUser
                                .save()
                                .then((result) => {
                                    res.json({
                                        status: "Success",
                                        message: "Signup Success",
                                        data: result,
                                    });
                                })
                                .catch((err) => {
                                    res.json({
                                        status: "Failed",
                                        message: "Error saving user account",
                                    });
                                });
                        })
                        .catch((err) => {
                            res.json({
                                status: "Failed",
                                message: "Error with hashing!",
                            });
                        });
                }
            })
            .catch((err) => {
                console.log(err);
                res.json({
                    status: "Failed",
                    message:
                        "An error occurred while checking for existing user!",
                });
            });
    }
});

//================================
//      USER Sign in ROUTE
//================================
app.post("/user/signin", (req, res) => {
    let { email, password } = req.body;

    if (email == "" || password == "") {
        res.json({
            status: "Failed",
            message: "Input Field Cannot Be Empty",
        });
    } else {
        //check if user exists
        User.find({ email }).then((data) => {
            if (data) {
                const hashedPassword = data[0].password;
                bcrypt.compare(password, hashedPassword).then((result) => {
                    if (result) {
                        //if pass match
                        res.json({
                            status: "Success",
                            message: "Signin Successful",
                            data: data,
                        });
                    } else {
                        res.json({
                            status: "Failed",
                            message: "Incorrect credential",
                        });
                    }
                });
            }
        });
    }
});
//================================
//          Web Listeners
//================================
app.listen(PORT, () => console.log(`Listening on PORT ${PORT}`));
