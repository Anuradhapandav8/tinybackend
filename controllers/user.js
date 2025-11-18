import User from '../models/User.js';
import md5 from 'md5';
import jwt from 'jsonwebtoken';

const postSignup = async (req, res) => {
    const {name, email, password} = req.body;

    const nameValidateRegex = /^[a-zA-Z\s]{3,30}$/;
    const emailValidateRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordValidateRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;

    if(!name || !email || !password) {
        return res.status(400).json({
            success: false,
            message: "All fields are required",
        });
    }  

    if(!nameValidateRegex.test(name)) {
        return res.status(400).json({
            success: false,
            message: "Name must be 3-30 characters long and contain only letters and spaces",
        });
    }
    if(!emailValidateRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: "Invalid email format",
        });
    }
    if(!passwordValidateRegex.test(password)) {
        return res.status(400).json({
            success: false,
            message: "Password must be at least 8 characters long and contain at least one letter and one number",
        });
    }
    const existingUser = await User.findOne({email});
    if(existingUser){
        return res.status(400).json({
            success: false,
            message: `User with email ${email} already exists`,
        });
    }

    const newUser = new User({name, email, password: md5(password)});
    const savedUser = await newUser.save();
    res.json({
        success: true, 
        message: "User registered succesfully",
        user: savedUser,
    })
}


const postLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const existingUser = await User.findOne({ email, password: md5(password) }).select(
      "_id name email"
    );

    if (!existingUser) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      { userId: existingUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      success: true,
      message: "User logged in successfully",
      user: existingUser,
      token,
    });
  } catch (error) {
    console.error("Error logging in:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export { postSignup, postLogin };