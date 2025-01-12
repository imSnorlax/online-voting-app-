const mongoose = require('mongoose');

const PollSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, 'Poll question is required'],
    },
    options: [
      {
        text: {
          type: String,
          required: true,
        },
      },
    ],
    allowedSelections: {
      type: Number,
      required: true,
      min: [1, 'At least one selection is required'],
    },
    selectionType: {
      type: String,
      enum: ['strict', 'soft'],
      required: true,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

PollSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  try {
    await mongoose.model('Vote').deleteMany({ poll: this._id });
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Poll', PollSchema);
