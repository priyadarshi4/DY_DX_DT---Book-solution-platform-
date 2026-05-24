const mongoose = require('mongoose');

// ─── Section ────────────────────────────────────────────────────────────────
const sectionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    number: { type: Number, required: true },
    description: { type: String, default: '' },
    chapter: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter', required: true },
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true }
  },
  { timestamps: true }
);

sectionSchema.index({ chapter: 1, number: 1 }, { unique: true });

// ─── Question ───────────────────────────────────────────────────────────────
const questionSchema = new mongoose.Schema(
  {
    number: { type: String, required: true, trim: true },
    statement: { type: String, required: true },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Medium'
    },
    section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true },
    chapter: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter', required: true },
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true }
  },
  { timestamps: true }
);

// ─── Solution ───────────────────────────────────────────────────────────────
const solutionSchema = new mongoose.Schema(
  {
    content: { type: String, required: [true, 'Solution content is required'] },
    latexFormulas: [{ type: String }],
    steps: [
      {
        stepNumber: Number,
        title: String,
        content: String,
        formula: String
      }
    ],
    pdfLink: { type: String, default: '' },
    images: [{ url: String, publicId: String }],
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
      unique: true
    },
    section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true },
    chapter: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter', required: true },
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    views: { type: Number, default: 0 }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

solutionSchema.virtual('likeCount', {
  ref: 'Like',
  localField: '_id',
  foreignField: 'solution',
  count: true
});

solutionSchema.virtual('commentCount', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'solution',
  count: true
});

// ─── Comment ─────────────────────────────────────────────────────────────────
const commentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: [true, 'Comment cannot be empty'],
      maxlength: [500, 'Comment cannot exceed 500 characters'],
      trim: true
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    solution: { type: mongoose.Schema.Types.ObjectId, ref: 'Solution', required: true }
  },
  { timestamps: true }
);

commentSchema.index({ solution: 1, createdAt: -1 });

// ─── Like ─────────────────────────────────────────────────────────────────────
const likeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    solution: { type: mongoose.Schema.Types.ObjectId, ref: 'Solution', required: true }
  },
  { timestamps: true }
);

likeSchema.index({ user: 1, solution: 1 }, { unique: true });

module.exports = {
  Section: mongoose.model('Section', sectionSchema),
  Question: mongoose.model('Question', questionSchema),
  Solution: mongoose.model('Solution', solutionSchema),
  Comment: mongoose.model('Comment', commentSchema),
  Like: mongoose.model('Like', likeSchema)
};
