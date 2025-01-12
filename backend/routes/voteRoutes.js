const express = require('express');
const { voteOnPoll, getVotesByPoll } = require('../controllers/voteController');
const { protect } = require('../middlewares/authMiddleware');
const validateVote = require('../middlewares/validateVote');

const router = express.Router();

router.post('/', protect, validateVote, voteOnPoll);
router.get('/:pollId', protect, getVotesByPoll); // Get votes for a poll

module.exports = router;
