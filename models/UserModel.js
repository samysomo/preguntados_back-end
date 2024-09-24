import { genSalt, hash } from "bcrypt";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        unique: true
    },
    username: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: false,
    },
    profileSetup: {
        type: String,
        default: false
    },
    friends: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users'
    }],
    matchHistory: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Match'
    }]
});

userSchema.pre("save", async function(next){
    const salt = await genSalt();
    this.password = await hash(this.password, salt)
});

const User = mongoose.model("Users", userSchema);

export default User;