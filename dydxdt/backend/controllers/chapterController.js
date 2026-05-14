const Chapter = require('../models/Chapter');
const { Section, Question } = require('../models/index');

// ─── CHAPTERS ────────────────────────────────────────────────────────────────

const getChaptersByBook = async (req, res) => {
  try {
    const chapters = await Chapter.find({ book: req.params.bookId }).sort('number').lean();
    res.json({ chapters });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch chapters.' });
  }
};

const createChapter = async (req, res) => {
  try {
    const { title, number, description, bookId } = req.body;
    const chapter = await Chapter.create({ title, number, description, book: bookId });
    res.status(201).json({ chapter });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Chapter number already exists in this book.' });
    res.status(500).json({ error: 'Failed to create chapter.' });
  }
};

const updateChapter = async (req, res) => {
  try {
    const chapter = await Chapter.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!chapter) return res.status(404).json({ error: 'Chapter not found.' });
    res.json({ chapter });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update chapter.' });
  }
};

const deleteChapter = async (req, res) => {
  try {
    await Chapter.findByIdAndDelete(req.params.id);
    res.json({ message: 'Chapter deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete chapter.' });
  }
};

// ─── SECTIONS ────────────────────────────────────────────────────────────────

const getSectionsByChapter = async (req, res) => {
  try {
    const sections = await Section.find({ chapter: req.params.chapterId }).sort('number').lean();
    res.json({ sections });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sections.' });
  }
};

const createSection = async (req, res) => {
  try {
    const { title, number, description, chapterId, bookId } = req.body;
    const section = await Section.create({ title, number, description, chapter: chapterId, book: bookId });
    res.status(201).json({ section });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create section.' });
  }
};

const updateSection = async (req, res) => {
  try {
    const section = await Section.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!section) return res.status(404).json({ error: 'Section not found.' });
    res.json({ section });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update section.' });
  }
};

const deleteSection = async (req, res) => {
  try {
    await Section.findByIdAndDelete(req.params.id);
    res.json({ message: 'Section deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete section.' });
  }
};

// ─── QUESTIONS ───────────────────────────────────────────────────────────────

const getQuestionsBySection = async (req, res) => {
  try {
    const questions = await Question.find({ section: req.params.sectionId }).sort('number').lean();
    res.json({ questions });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch questions.' });
  }
};

const createQuestion = async (req, res) => {
  try {
    const { number, statement, difficulty, sectionId, chapterId, bookId } = req.body;
    const question = await Question.create({
      number, statement, difficulty,
      section: sectionId,
      chapter: chapterId,
      book: bookId
    });
    res.status(201).json({ question });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create question.' });
  }
};

const updateQuestion = async (req, res) => {
  try {
    const question = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!question) return res.status(404).json({ error: 'Question not found.' });
    res.json({ question });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update question.' });
  }
};

const deleteQuestion = async (req, res) => {
  try {
    await Question.findByIdAndDelete(req.params.id);
    res.json({ message: 'Question deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete question.' });
  }
};

module.exports = {
  getChaptersByBook, createChapter, updateChapter, deleteChapter,
  getSectionsByChapter, createSection, updateSection, deleteSection,
  getQuestionsBySection, createQuestion, updateQuestion, deleteQuestion
};
