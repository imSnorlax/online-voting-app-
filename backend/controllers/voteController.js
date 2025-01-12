const Poll = require('../models/Poll');
const Vote = require('../models/Vote');
const User = require('../models/User');
const logger = require('../utils/logger');

// Vote on a Poll
const voteOnPoll = async (req, res) => {
  const { pollId, optionsSelected } = req.body;

  try {
    // Validate poll existence
    const poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json({ success: false, message: 'Poll not found' });
    }

    // Validate poll is still active
    if (new Date(poll.endTime) <= new Date()) {
      return res.status(400).json({ success: false, message: 'This poll has ended' });
    }

    // Check if user has already voted
    const existingVote = await Vote.findOne({ poll: pollId, user: req.user.id });
    if (existingVote) {
      return res.status(400).json({ success: false, message: 'You have already voted on this poll' });
    }

    // Validate selected options
    if (!optionsSelected || !Array.isArray(optionsSelected) || optionsSelected.length === 0) {
      return res.status(400).json({ success: false, message: 'You must select at least one option' });
    }

    if (optionsSelected.length > poll.allowedSelections) {
      return res.status(400).json({
        success: false,
        message: `You can only select up to ${poll.allowedSelections} options`,
      });
    }

    const invalidOptions = optionsSelected.filter(
      (option) => !poll.options.some((opt) => opt.text === option)
    );

    if (invalidOptions.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid options selected: ${invalidOptions.join(', ')}`,
      });
    }

    // Record the vote
    const vote = await Vote.create({
      poll: pollId,
      user: req.user.id,
      optionsSelected,
    });

    await poll.save();

    res.status(200).json({ success: true, message: 'Vote recorded successfully', data: vote });
  } catch (error) {
    logger.error(`Error voting on poll: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getVotesByPoll = async (req, res) => {
  const { pollId } = req.params;

  try {
    const votes = await Vote.find({ poll: pollId }).populate('user', 'username email');

    res.status(200).json({
      success: true,
      data: votes,
      message: 'Votes fetched successfully',
    });
  } catch (error) {
    logger.error(`Error fetching votes for poll ${pollId}: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { voteOnPoll, getVotesByPoll };
