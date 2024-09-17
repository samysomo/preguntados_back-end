import { response } from "express";
import User from "../models/UserModel.js";
import jwt from "jsonwebtoken";
import { compare } from "bcrypt";

const maxAge = 3 * 24 * 60 * 1000;

const createToken = (email, userId) => {
    return jwt.sign({email, userId}, process.env.JWT_KEY, {expiresIn: maxAge})
}

export const signup = async (req, res, next) => {
    try {
        const {email, password, username} = req.body;
        if(!email || !password || !username) {
            return res.status(400).send("Email, Password and Username are required");
        }
        const user = await User.create({email, password, username});
        res.cookie("jwt", createToken(email, user.id), {
            maxAge,
            secure: true,
            sameSize: "None",
        });
        return res.status(201).json({user: {
            id: user.id,
            email: user.email,
            username: user.username,
            profileSetup: user.profileSetup
        }});

    } catch (error) {
        return res.status(500).send("Internal Server Error");
    }
}

export const login = async (req, res, next) => {
    try {
        const {email, password} = req.body;
        if(!email || !password) {
            return res.status(400).send("Email and Password are required");
        }
        const user = await User.findOne({email});
        if(!user){
            return res.status(404).send("User not found");
        }

        const auth = await compare(password, user.password);
        if(!auth){
            return res.status(404).send("Incorrect Password");
        }

        res.cookie("jwt", createToken(email, user.id), {
            maxAge,
            secure: true,
            sameSize: "None",
        });
        return res.status(200).json({user: {
            id: user.id,
            email: user.email,
            username: user.username,
            profileSetup: user.profileSetup
        }});

    } catch (error) {
        return res.status(500).send("Internal Server Error");
    }
}

export const getUserInfo = async (req, res, next) => {
    try {
        const userData = await User.findById(req.userId);
        if (!userData) {
            return res.status(404).send("User with given id not found")
        }
        
        return res.status(200).json({
            id: userData.id,
            email: userData.email,
            username: userData.username,
            profileSetup: userData.profileSetup
        });

    } catch (error) {
        return res.status(500).send("Internal Server Error");
    }
}