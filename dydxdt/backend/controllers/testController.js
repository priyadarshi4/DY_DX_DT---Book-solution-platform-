const { Test, TestSubmission, TestResult } = require('../models/testModels');

// ═══════════════════════════════════════════════════════════
// ADMIN CONTROLLERS
// ═══════════════════════════════════════════════════════════

// POST /api/tests — Create test
const createTest = async (req, res) => {
  try {
    const { title, description, duration, difficulty, category, questions } = req.body;

    const parsedQuestions = typeof questions === 'string' ? JSON.parse(questions) : (questions || []);

    const test = await Test.create({
      title,
      description,
      duration,
      difficulty: difficulty || 'Medium',
      category: category || 'General',
      questions: parsedQuestions.map((q, i) => ({ ...q, order: i })),
      createdBy: req.user._id
    });

    res.status(201).json({ test });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Failed to create test.' });
  }
};

// PUT /api/tests/:id — Update test
const updateTest = async (req, res) => {
  try {
    const { title, description, duration, difficulty, category, questions } = req.body;
    const parsedQuestions = typeof questions === 'string' ? JSON.parse(questions) : questions;

    const updateData = { title, description, duration, difficulty, category };
    if (parsedQuestions) {
      updateData.questions = parsedQuestions.map((q, i) => ({ ...q, order: i }));
    }

    const test = await Test.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    if (!test) return res.status(404).json({ error: 'Test not found.' });

    // Recompute totalMarks
    test.totalMarks = test.questions.reduce((s, q) => s + q.marks, 0);
    await test.save();

    res.json({ test });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to update test.' });
  }
};

// DELETE /api/tests/:id
const deleteTest = async (req, res) => {
  try {
    const test = await Test.findByIdAndDelete(req.params.id);
    if (!test) return res.status(404).json({ error: 'Test not found.' });

    // Cascade delete submissions and results
    await TestSubmission.deleteMany({ test: req.params.id });
    await TestResult.deleteMany({ test: req.params.id });

    res.json({ message: 'Test deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete test.' });
  }
};

// PATCH /api/tests/:id/publish — Toggle publish
const togglePublish = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ error: 'Test not found.' });

    test.isPublished = !test.isPublished;
    await test.save();

    res.json({ test, message: `Test ${test.isPublished ? 'published' : 'unpublished'}.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle publish.' });
  }
};

// GET /api/tests/admin/all — All tests (admin view, including unpublished)
const adminGetTests = async (req, res) => {
  try {
    const tests = await Test.find()
      .sort('-createdAt')
      .populate('createdBy', 'name')
      .lean();

    // Add submission counts
    const ids = tests.map(t => t._id);
    const subCounts = await TestSubmission.aggregate([
      { $match: { test: { $in: ids } } },
      { $group: { _id: '$test', count: { $sum: 1 } } }
    ]);
    const countMap = Object.fromEntries(subCounts.map(s => [s._id.toString(), s.count]));

    const enriched = tests.map(t => ({
      ...t,
      submissionCount: countMap[t._id.toString()] || 0
    }));

    res.json({ tests: enriched });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tests.' });
  }
};

// GET /api/tests/admin/submissions — All submissions
const adminGetSubmissions = async (req, res) => {
  try {
    const { testId, status } = req.query;
    const query = {};
    if (testId) query.test = testId;
    if (status) query.status = status;

    const submissions = await TestSubmission.find(query)
      .sort('-submittedAt')
      .populate('user', 'name email avatar')
      .populate('test', 'title duration totalMarks')
      .lean();

    res.json({ submissions });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch submissions.' });
  }
};

// GET /api/tests/admin/submissions/:id — Single submission detail
const adminGetSubmission = async (req, res) => {
  try {
    const submission = await TestSubmission.findById(req.params.id)
      .populate('user', 'name email avatar')
      .populate('test')
      .lean();

    if (!submission) return res.status(404).json({ error: 'Submission not found.' });

    // Get existing result if any
    const result = await TestResult.findOne({ submission: submission._id }).lean();

    res.json({ submission, result });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch submission.' });
  }
};

// POST /api/tests/admin/evaluate/:submissionId — Evaluate & publish result
const evaluateSubmission = async (req, res) => {
  try {
    const { subjectiveScores, publishResult } = req.body;
    // subjectiveScores: [{ questionId, awarded, feedback }]

    const submission = await TestSubmission.findById(req.params.submissionId).populate('test');
    if (!submission) return res.status(404).json({ error: 'Submission not found.' });

    const test = submission.test;

    // Apply subjective scores to answers
    let subjectiveMarks = 0;
    if (subjectiveScores && Array.isArray(subjectiveScores)) {
      for (const score of subjectiveScores) {
        const answer = submission.answers.find(
          a => a.questionId.toString() === score.questionId
        );
        if (answer) {
          answer.awarded = Number(score.awarded) || 0;
          answer.feedback = score.feedback || '';
          subjectiveMarks += answer.awarded;
        }
      }
    }

    // Auto-score MCQ answers
    let mcqMarks = 0;
    let correctAnswers = 0;
    let wrongAnswers = 0;
    let skippedAnswers = 0;

    for (const answer of submission.answers) {
      const question = test.questions.id(answer.questionId);
      if (!question) continue;

      if (question.type === 'MCQ') {
        if (answer.selectedOption === null || answer.selectedOption === undefined || answer.selectedOption === '') {
          skippedAnswers++;
        } else if (answer.selectedOption === question.correctAnswer) {
          mcqMarks += question.marks;
          correctAnswers++;
        } else {
          wrongAnswers++;
        }
      } else if (question.type === 'SUBJECTIVE') {
        if (!answer.subjectiveText?.trim()) skippedAnswers++;
      }
    }

    submission.status = publishResult ? 'results_published' : 'evaluated';
    await submission.save();

    const totalMarks = mcqMarks + subjectiveMarks;
    const maxMarks = test.totalMarks;
    const percentage = maxMarks > 0 ? Math.round((totalMarks / maxMarks) * 100 * 100) / 100 : 0;

    // Upsert result
    const result = await TestResult.findOneAndUpdate(
      { submission: submission._id },
      {
        user: submission.user,
        test: test._id,
        submission: submission._id,
        mcqMarks,
        subjectiveMarks,
        totalMarks,
        maxMarks,
        percentage,
        correctAnswers,
        wrongAnswers,
        skippedAnswers,
        isPublished: !!publishResult,
        evaluatedAt: new Date(),
        evaluatedBy: req.user._id
      },
      { upsert: true, new: true }
    );

    // Recompute ranks for this test if publishing
    if (publishResult) {
      await recomputeRanks(test._id);
    }

    res.json({ result, message: 'Evaluation saved.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Failed to evaluate submission.' });
  }
};

// Helper: recompute ranks for a test
async function recomputeRanks(testId) {
  const results = await TestResult.find({ test: testId, isPublished: true })
    .sort('-totalMarks -mcqMarks')
    .select('_id');

  for (let i = 0; i < results.length; i++) {
    await TestResult.findByIdAndUpdate(results[i]._id, { rank: i + 1 });
  }
}

// ═══════════════════════════════════════════════════════════
// USER CONTROLLERS
// ═══════════════════════════════════════════════════════════

// GET /api/tests — Published tests for users
const getTests = async (req, res) => {
  try {
    const tests = await Test.find({ isPublished: true })
      .sort('-createdAt')
      .select('-questions.correctAnswer -questions.explanation')
      .lean();

    // Enrich with user's submission status if authenticated
    const userId = req.user?._id;
    let submissionMap = {};
    if (userId) {
      const subs = await TestSubmission.find({
        user: userId,
        test: { $in: tests.map(t => t._id) }
      }).select('test status').lean();
      submissionMap = Object.fromEntries(subs.map(s => [s.test.toString(), s.status]));
    }

    const enriched = tests.map(t => ({
      ...t,
      questionCount: t.questions.length,
      userStatus: submissionMap[t._id.toString()] || null
    }));

    res.json({ tests: enriched });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tests.' });
  }
};

// GET /api/tests/:id — Single test (for taking)
const getTest = async (req, res) => {
  try {
    const test = await Test.findOne({ _id: req.params.id, isPublished: true })
      .select('-questions.correctAnswer -questions.explanation')
      .lean();

    if (!test) return res.status(404).json({ error: 'Test not found.' });

    // Check if already submitted
    const existing = await TestSubmission.findOne({
      user: req.user._id,
      test: test._id
    });

    if (existing) {
      return res.status(409).json({
        error: 'You have already submitted this test.',
        submissionId: existing._id,
        status: existing.status
      });
    }

    res.json({ test });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch test.' });
  }
};

// POST /api/tests/:id/submit — Submit test
const submitTest = async (req, res) => {
  try {
    const { answers, autoSubmitted, timeSpent } = req.body;

    const test = await Test.findOne({ _id: req.params.id, isPublished: true });
    if (!test) return res.status(404).json({ error: 'Test not found.' });

    // Prevent double submission
    const existing = await TestSubmission.findOne({
      user: req.user._id,
      test: test._id
    });
    if (existing) return res.status(409).json({ error: 'Already submitted.' });

    // Build answer documents
    const parsedAnswers = (typeof answers === 'string' ? JSON.parse(answers) : answers) || [];
    const answerDocs = test.questions.map(q => {
      const userAnswer = parsedAnswers.find(a => a.questionId === q._id.toString());
      return {
        questionId: q._id,
        type: q.type,
        selectedOption: userAnswer?.selectedOption ?? null,
        subjectiveText: userAnswer?.subjectiveText ?? '',
        markedForReview: userAnswer?.markedForReview ?? false
      };
    });

    const submission = await TestSubmission.create({
      user: req.user._id,
      test: test._id,
      answers: answerDocs,
      autoSubmitted: !!autoSubmitted,
      timeSpent: timeSpent || 0
    });

    await Test.findByIdAndUpdate(test._id, { $inc: { attemptCount: 1 } });

    // Auto-evaluate MCQ-only tests immediately
    const hasSubjective = test.questions.some(q => q.type === 'SUBJECTIVE');
    if (!hasSubjective) {
      let mcqMarks = 0, correct = 0, wrong = 0, skipped = 0;
      for (const ans of submission.answers) {
        const q = test.questions.id(ans.questionId);
        if (!q) continue;
        if (ans.selectedOption === null || ans.selectedOption === '') { skipped++; continue; }
        if (ans.selectedOption === q.correctAnswer) { mcqMarks += q.marks; correct++; }
        else wrong++;
      }
      const totalMarks = mcqMarks;
      const percentage = test.totalMarks > 0 ? Math.round((totalMarks / test.totalMarks) * 10000) / 100 : 0;

      submission.status = 'results_published';
      await submission.save();

      const result = await TestResult.create({
        user: req.user._id,
        test: test._id,
        submission: submission._id,
        mcqMarks,
        subjectiveMarks: 0,
        totalMarks,
        maxMarks: test.totalMarks,
        percentage,
        correctAnswers: correct,
        wrongAnswers: wrong,
        skippedAnswers: skipped,
        isPublished: true,
        evaluatedAt: new Date(),
        evaluatedBy: null
      });

      await recomputeRanks(test._id);

      return res.status(201).json({
        submission,
        autoEvaluated: true,
        result
      });
    }

    res.status(201).json({ submission, autoEvaluated: false });
  } catch (err) {
    console.error(err);
    if (err.code === 11000) return res.status(409).json({ error: 'Already submitted.' });
    res.status(500).json({ error: err.message || 'Failed to submit test.' });
  }
};

// GET /api/tests/:id/result — Get result for current user
const getResult = async (req, res) => {
  try {
    const result = await TestResult.findOne({
      user: req.user._id,
      test: req.params.id,
      isPublished: true
    }).populate('test').lean();

    if (!result) return res.status(404).json({ error: 'Result not yet published.' });

    // Get submission with answers for review
    const submission = await TestSubmission.findOne({
      user: req.user._id,
      test: req.params.id
    }).lean();

    res.json({ result, submission });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch result.' });
  }
};

// GET /api/tests/:id/leaderboard — Top results
const getLeaderboard = async (req, res) => {
  try {
    const results = await TestResult.find({ test: req.params.id, isPublished: true })
      .sort('rank')
      .limit(20)
      .populate('user', 'name avatar')
      .select('user totalMarks maxMarks percentage rank correctAnswers')
      .lean();

    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leaderboard.' });
  }
};

module.exports = {
  createTest, updateTest, deleteTest, togglePublish,
  adminGetTests, adminGetSubmissions, adminGetSubmission, evaluateSubmission,
  getTests, getTest, submitTest, getResult, getLeaderboard
};
