const mongoose = require('mongoose');

// ─── Test ─────────────────────────────────────────────────────────────────────
const testQuestionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['MCQ', 'SUBJECTIVE'],
    required: true
  },
  question: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true
  },
  // MCQ fields
  options: [{ type: String, trim: true }],
  correctAnswer: { type: String, default: '' }, // index "0"–"3" for MCQ
  explanation: { type: String, default: '' },
  // Marks
  marks: { type: Number, required: true, default: 1, min: 0 },
  // Ordering
  order: { type: Number, default: 0 }
});

const testSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Test title is required'],
      trim: true,
      maxlength: 200
    },
    description: { type: String, default: '', maxlength: 2000 },
    duration: {
      type: Number,
      required: [true, 'Duration in minutes is required'],
      min: 1,
      max: 480
    },
    totalMarks: { type: Number, default: 0 },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Medium'
    },
    category: { type: String, default: 'General' },
    isPublished: { type: Boolean, default: false },
    questions: [testQuestionSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    // Stats
    attemptCount: { type: Number, default: 0 }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Recompute totalMarks before save
testSchema.pre('save', function (next) {
  if (this.questions && this.questions.length > 0) {
    this.totalMarks = this.questions.reduce((sum, q) => sum + (q.marks || 0), 0);
  }
  next();
});

testSchema.index({ isPublished: 1, createdAt: -1 });

// ─── Submission ───────────────────────────────────────────────────────────────
const answerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
  type: { type: String, enum: ['MCQ', 'SUBJECTIVE'] },
  selectedOption: { type: String, default: null }, // "0"–"3" for MCQ
  subjectiveText: { type: String, default: '' },
  markedForReview: { type: Boolean, default: false },
  // Admin evaluation (for SUBJECTIVE)
  awarded: { type: Number, default: null },
  feedback: { type: String, default: '' }
});

const testSubmissionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    test: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test',
      required: true
    },
    answers: [answerSchema],
    submittedAt: { type: Date, default: Date.now },
    autoSubmitted: { type: Boolean, default: false },
    timeSpent: { type: Number, default: 0 }, // seconds
    status: {
      type: String,
      enum: ['submitted', 'evaluated', 'results_published'],
      default: 'submitted'
    }
  },
  { timestamps: true }
);

// Prevent duplicate submission
testSubmissionSchema.index({ user: 1, test: 1 }, { unique: true });

// ─── Result ───────────────────────────────────────────────────────────────────
const testResultSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    test: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
    submission: { type: mongoose.Schema.Types.ObjectId, ref: 'TestSubmission', required: true },
    mcqMarks: { type: Number, default: 0 },
    subjectiveMarks: { type: Number, default: 0 },
    totalMarks: { type: Number, default: 0 },
    maxMarks: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    correctAnswers: { type: Number, default: 0 },
    wrongAnswers: { type: Number, default: 0 },
    skippedAnswers: { type: Number, default: 0 },
    rank: { type: Number, default: null },
    isPublished: { type: Boolean, default: false },
    evaluatedAt: { type: Date, default: null },
    evaluatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { timestamps: true }
);

testResultSchema.index({ test: 1, totalMarks: -1 });
testResultSchema.index({ user: 1, test: 1 }, { unique: true });

const Test = mongoose.model('Test', testSchema);
const TestSubmission = mongoose.model('TestSubmission', testSubmissionSchema);
const TestResult = mongoose.model('TestResult', testResultSchema);

module.exports = { Test, TestSubmission, TestResult };
