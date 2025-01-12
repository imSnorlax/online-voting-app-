const validateVote = (req, res, next) => {
    const { pollId, optionsSelected } = req.body;
  
    if (!pollId || !optionsSelected) {
      return res.status(400).json({ success: false, message: 'Poll ID and selected options are required' });
    }
  
    if (!Array.isArray(optionsSelected) || optionsSelected.length === 0) {
      return res.status(400).json({ success: false, message: 'Selected options must be a non-empty array' });
    }
  
    next();
  };
  
  module.exports = validateVote;
  