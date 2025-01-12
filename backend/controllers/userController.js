const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const logger = require('../utils/logger');

const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    logger.info(`Registration attempt for email: ${email}`);

    const emailNormalized = email.toLowerCase();
    const emailExists = await User.findOne({ email: emailNormalized });
    const usernameExists = await User.findOne({ username });
    if (emailExists) {
      return res.status(400).json({ message: 'Email is already registered' });
    }
    if (usernameExists) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    const user = await User.create({
      username,
      email,
      password,
    });

    const token = generateToken(user._id);

    logger.info(`User registered successfully: ${email}`);
    res.status(201).json({
        success: true,
        data: {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            createdAt: user.createdAt,
          },
          token,
        },
        message: 'User registered successfully',
      });
  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;
  
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
  
    try {
      // Log login attempt
      logger.info(`Login attempt for email: ${email}`);
  
      // Check if user exists
      const user = await User.findOne({ email }).select('+password'); // Include password for comparison
      if (!user) {
        logger.warn(`Login failed: User with email ${email} not found`);
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }
  
      // Validate password
      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        logger.warn(`Login failed: Incorrect password for email ${email}`);
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }
  
      // Generate JWT
      const token = generateToken(user._id);
  
      // Log successful login
      logger.info(`User logged in successfully: ${email}`);
  
      // Return user data and token
      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            createdAt: user.createdAt,
          },
          token,
        },
        message: 'Login successful',
      });
    } catch (error) {
      logger.error(`Login error: ${error.message}`);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  };


  const getUserProfile = async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
  
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
  
      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            createdAt: user.createdAt,
            lastLoginAt: user.lastLoginAt,
          },
        },
        message: 'User profile fetched successfully',
      });
    } catch (error) {
      logger.error(`Error fetching profile for user ${req.user.id}: ${error.stack}`);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  };

  const updateUserProfile = async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
  
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
  
      // Update fields if provided
      user.username = req.body.username || user.username;
      user.email = req.body.email || user.email;
  
      // Handle password update
      if (req.body.password) {
        user.password = req.body.password; // Password will be hashed by the pre-save middleware
      }
  
      const updatedUser = await user.save();
  
      res.status(200).json({
        success: true,
        data: {
          user: {
            id: updatedUser._id,
            username: updatedUser.username,
            email: updatedUser.email,
            createdAt: updatedUser.createdAt,
          },
        },
        message: 'User profile updated successfully',
      });
    } catch (error) {
      logger.error(`Error updating profile: ${error.message}`);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  };
  

module.exports = { registerUser, loginUser, getUserProfile, updateUserProfile };
