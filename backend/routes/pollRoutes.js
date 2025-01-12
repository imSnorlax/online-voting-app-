const express = require('express');
const validatePollCreation = require('../middlewares/validatePollCreation');
const validatePollUpdate = require('../middlewares/validatePollUpdate');
const { protect } = require('../middlewares/authMiddleware');
const { 
  createPoll, 
  getPolls, 
  updatePoll, 
  deletePoll,
  getPollDetails,
  getPollsByUser
  
} = require('../controllers/pollController');

const router = express.Router();

router.post('/', protect, validatePollCreation, createPoll); // Create a new poll
router.get('/', protect, getPolls); // Fetch all polls
router.get('/user', protect, getPollsByUser);
router.get('/:pollId', protect, getPollDetails); // Fetch poll details
router.put('/:id', protect, validatePollUpdate, updatePoll); // Update a poll
router.delete('/:id', protect, deletePoll); // Delete a poll


module.exports = router;
