const validateLogin = (req, res, next) => {
    const { email, password } = req.body;
  
    // Check for missing fields
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
  
    // Validate email format
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address' });
    }
  
    next();
  };
  
  module.exports = validateLogin;
  