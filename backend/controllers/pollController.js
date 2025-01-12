const Poll = require('../models/Poll');
const User = require('../models/User');
const Vote = require('../models/Vote');
const logger = require('../utils/logger');
const { computeOptionsVoteCount } = require('../utils/voteCountHelper');

// Create Poll
const createPoll = async (req, res) => {
  const { question, options, allowedSelections, selectionType, endTime } = req.body;

  // Validate input
  if (!question || !options || options.length < 2) {
    return res.status(400).json({ success: false, message: 'Question and at least two options are required' });
  }

  if (!allowedSelections || allowedSelections < 1) {
    return res.status(400).json({
      success: false,
      message: 'Allowed selections must be at least 1',
    });
  }

  if (allowedSelections > options.length) {
    return res.status(400).json({
      success: false,
      message: 'Allowed selections cannot exceed the number of options',
    });
  }

  if (!['strict', 'soft'].includes(selectionType)) {
    return res.status(400).json({ success: false, message: 'Selection type must be either "strict" or "soft"' });
  }


  try {
    let poll = await Poll.create({
      question,
      options: options.map((opt) => ({ text: opt })),
      allowedSelections,
      selectionType,
      creator: req.user.id,
      endTime,
    });

    // Populate creator (to get username)
    poll = await poll.populate('creator', 'username');

    // Convert poll to object to modify data
    poll = poll.toObject();

    // Compute vote counts (initially all zero)
    poll.options = await computeOptionsVoteCount(poll.options, poll._id);

    // Attach creator username
    poll.creatorUsername = poll.creator.username;

    res.status(201).json({
      success: true,
      data: poll,
      message: 'Poll created successfully',
    });
  } catch (error) {
    logger.error(`Error creating poll: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getPolls = async (req, res) => {
  const { limit = 10, page = 1, q } = req.query;

  try {
    const parsedLimit = parseInt(limit, 10);
    const parsedPage = parseInt(page, 10);

    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid limit parameter',
      });
    }

    if (isNaN(parsedPage) || parsedPage <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid page parameter',
      });
    }

    let filter = {};
    if (q && typeof q === 'string') {
      filter = {
        $or: [
          { question: { $regex: q, $options: 'i' } },
          { 'options.text': { $regex: q, $options: 'i' } },
        ],
      };
    }

    const polls = await Poll.find(filter)
      .sort({ createdAt: -1 })
      .limit(parsedLimit)
      .skip((parsedPage - 1) * parsedLimit)
      .populate('creator', 'username');

    const pollsWithCounts = [];
    for (const pollDoc of polls) {
      const pollObj = pollDoc.toObject();
      pollObj.options = await computeOptionsVoteCount(pollObj.options, pollObj._id);
      pollObj.creatorUsername = pollObj.creator?.username || 'Unknown';
      pollsWithCounts.push(pollObj);
    }

    res.status(200).json({
      success: true,
      data: pollsWithCounts,
      message: 'Polls fetched successfully',
    });
  } catch (error) {
    logger.error(`Error fetching polls: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getPollDetails = async (req, res) => {
  const { pollId } = req.params;

  try {
    let poll = await Poll.findById(pollId).populate('creator', 'username');

    if (!poll) {
      return res.status(404).json({ success: false, message: 'Poll not found' });
    }

    // Convert to object
    poll = poll.toObject();

    // Compute vote counts
    poll.options = await computeOptionsVoteCount(poll.options, poll._id);
    poll.creatorUsername = poll.creator.username;

    res.status(200).json({
      success: true,
      data: poll,
      message: 'Poll details fetched successfully',
    });
  } catch (error) {
    logger.error(`Error fetching poll details: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get Polls by User
const getPollsByUser = async (req, res) => {
  console.log(req.user.id);
  const { type, limit = 10, page = 1 } = req.query;

  try {
    // Validate `type` parameter
    if (!['created', 'voted'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid type parameter. Use "created" or "voted"' });
    }

    // Parse limit and page
    const parsedLimit = parseInt(limit);
    const parsedPage = parseInt(page);

    if (isNaN(parsedLimit) || parsedLimit <= 0 || isNaN(parsedPage) || parsedPage <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid limit or page parameters' });
    }

    let filter = {};
    let message = '';

    if (type === 'created') {
      // Fetch polls created by the user
      filter = { creator: req.user.id };
      message = 'Polls created by user fetched successfully';
    } else if (type === 'voted') {
      // Fetch polls the user has voted on
      const votes = await Vote.find({ user: req.user.id }).select('poll');
      const votedPollIds = votes.map((vote) => vote.poll);

      filter = { _id: { $in: votedPollIds } };
      message = 'Polls voted by user fetched successfully';
    }

    // Fetch polls based on filter
    let polls = await Poll.find(filter)
      .sort({ createdAt: -1 })
      .limit(parsedLimit)
      .skip((parsedPage - 1) * parsedLimit)
      .populate('creator', 'username');
    
    // Convert and attach counts
    const pollsWithCounts = [];
    for (const poll of polls) {
      const pollObj = poll.toObject();
      pollObj.options = await computeOptionsVoteCount(pollObj.options, pollObj._id);
      pollObj.creatorUsername = pollObj.creator.username;
      pollsWithCounts.push(pollObj);
    }

    res.status(200).json({
      success: true,
      data: pollsWithCounts,
      message,
    });
  } catch (error) {
    logger.error(`Error fetching polls by user ${req.user.id}: ${error.message}. Stack: ${error.stack}`);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update Poll
const updatePoll = async (req, res) => {
  const { id } = req.params;
  const { question, options, allowedSelections, selectionType, endTime } = req.body;

  try {
    let poll = await Poll.findById(id).populate('creator', 'username');

    if (!poll) {
      return res.status(404).json({ success: false, message: 'Poll not found' });
    }

    if (allowedSelections !== undefined && allowedSelections > poll.options.length) {
      return res.status(400).json({
        success: false,
        message: 'Allowed selections cannot exceed the number of options',
      });
    }

    // Check if the user is the creator of the poll
    if (poll.creator._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You are not authorized to update this poll' });
    }

    // Update poll fields
    if (question) poll.question = question;
    if (options) {
      if (options.length < 2) {
        return res.status(400).json({ success: false, message: 'A poll must have at least two options' });
      }
      poll.options = options.map((opt) => ({ text: opt }));
    }
    if (allowedSelections !== undefined) poll.allowedSelections = allowedSelections;
    if (selectionType) poll.selectionType = selectionType;
    if (endTime) poll.endTime = endTime;

    await poll.save();
     // Convert to object
     poll = poll.toObject();

     // Compute new vote counts
     poll.options = await computeOptionsVoteCount(poll.options, poll._id);
     poll.creatorUsername = poll.creator.username;

    res.status(200).json({
      success: true,
      data: poll,
      message: 'Poll updated successfully',
    });
  } catch (error) {
    logger.error(`Error updating poll: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete Poll
const deletePoll = async (req, res) => {
  const { id } = req.params;

  try {
    const poll = await Poll.findById(id);

    if (!poll) {
      return res.status(404).json({ success: false, message: 'Poll not found' });
    }

    // Check if the user is the creator of the poll
    if (poll.creator.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You are not authorized to delete this poll' });
    }

    
    await poll.deleteOne();

    res.status(200).json({ success: true, message: 'Poll deleted successfully' });
  } catch (error) {
    logger.error(`Error deleting poll: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { createPoll, getPolls, updatePoll, deletePoll, getPollsByUser, getPollDetails };
/*

eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3NzljZTkxNzZhMmFkMzczYjRlMzU4NCIsImlhdCI6MTczNjAzNTk4NSwiZXhwIjoxNzM2MDM5NTg1fQ.nSZT5ZCTaAwtnyuu_9QnO6oh0YvTEy2_w-3m70iNXVg

here is the project now, we developped the polling section , and uodates some stuff , what i need you to do is to analyze the whole project , spot any logic errors , or leaks , and make the connection between polling and the user seamless and maintain reusablity

find more logic errors also find some implementation that are not nedded or we can somehow not reinvint the wheel and maintain a good reusability 


*/