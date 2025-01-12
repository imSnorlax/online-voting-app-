const validateProfileUpdate = (req, res, next) => {
    const { email, password } = req.body;
  
    // Validate email format if provided
    if (email) {
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, message: 'Please enter a valid email address' });
      }
    }
  
    // Validate password strength if provided
    if (password) {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(password)) {
        return res.status(400).json({
          success: false,
          message:
            'Password must include at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character',
        });
      }
    }
  
    next();
  };
  
  module.exports = validateProfileUpdate;
  