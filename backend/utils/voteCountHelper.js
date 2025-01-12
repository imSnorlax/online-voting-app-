const Vote = require('../models/Vote');

async function computeOptionsVoteCount(options, pollId) {
  // Fetch all votes for this poll
  const votes = await Vote.find({ poll: pollId }).select('optionsSelected');

  // Initialize a map for counting votes per option text
  const countMap = {};
  options.forEach((opt) => {
    countMap[opt.text] = 0;
  });

  // Count how many times each option appears in votes
  votes.forEach((vote) => {
    vote.optionsSelected.forEach((selected) => {
      if (countMap[selected] !== undefined) {
        countMap[selected]++;
      }
    });
  });

  // Merge counts into the original options array
  return options.map((opt) => ({
    text: opt.text,
    voteCount: countMap[opt.text] || 0,
  }));
}

module.exports = { computeOptionsVoteCount };
