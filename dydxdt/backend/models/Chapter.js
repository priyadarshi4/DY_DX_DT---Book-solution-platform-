const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Chapter title is required'],
      trim: true
    },
    number: {
      type: Number,
      required: [true, 'Chapter number is required']
    },
    description: {
      type: String,
      default: ''
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual: sections
chapterSchema.virtual('sections', {
  ref: 'Section',
  localField: '_id',
  foreignField: 'chapter'
});

// Compound index for ordering
chapterSchema.index({ book: 1, number: 1 }, { unique: true });

module.exports = mongoose.model('Chapter', chapterSchema);
