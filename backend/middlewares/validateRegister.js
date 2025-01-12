const validateRegister = (req, res, next) => {
    const { username, email, password } = req.body;

    // Check for missing fields
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate username
    if (username.length < 3) {
        return res.status(400).json({ message: 'Username must be at least 3 characters long' });
    }

    // Validate email format
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
        return res.status(400).json({
            success: false,
            message:
                'Password must include at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character',
        });
    }

    // If all validations pass, proceed to the controller
    next();
};

module.exports = validateRegister;
