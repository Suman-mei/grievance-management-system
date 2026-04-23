const express = require('express');
const router = express.Router();
const Grievance = require('../models/Grievance');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

// @route   POST /api/grievances
// @desc    Submit a grievance
// @access  Private
router.post('/', async (req, res) => {
  try {
    const { title, description, category } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ message: 'Please provide title, description, and category' });
    }

    const grievance = await Grievance.create({
      title,
      description,
      category,
      student: req.student._id
    });

    res.status(201).json({ message: 'Grievance submitted successfully', grievance });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/grievances
// @desc    Get all grievances of logged-in student
// @access  Private
router.get('/', async (req, res) => {
  try {
    const grievances = await Grievance.find({ student: req.student._id }).sort({ createdAt: -1 });
    res.json({ count: grievances.length, grievances });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/grievances/search?title=xyz
// @desc    Search grievances by title
// @access  Private
router.get('/search', async (req, res) => {
  try {
    const { title } = req.query;
    if (!title) {
      return res.status(400).json({ message: 'Please provide a search title' });
    }

    const grievances = await Grievance.find({
      student: req.student._id,
      title: { $regex: title, $options: 'i' }
    }).sort({ createdAt: -1 });

    res.json({ count: grievances.length, grievances });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/grievances/:id
// @desc    Get grievance by ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const grievance = await Grievance.findById(req.params.id);

    if (!grievance) {
      return res.status(404).json({ message: 'Grievance not found' });
    }

    // Ensure student owns this grievance
    if (grievance.student.toString() !== req.student._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this grievance' });
    }

    res.json({ grievance });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/grievances/:id
// @desc    Update grievance
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const { title, description, category, status } = req.body;

    let grievance = await Grievance.findById(req.params.id);

    if (!grievance) {
      return res.status(404).json({ message: 'Grievance not found' });
    }

    // Ensure student owns this grievance
    if (grievance.student.toString() !== req.student._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this grievance' });
    }

    grievance = await Grievance.findByIdAndUpdate(
      req.params.id,
      { title, description, category, status },
      { new: true, runValidators: true }
    );

    res.json({ message: 'Grievance updated successfully', grievance });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/grievances/:id
// @desc    Delete grievance
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const grievance = await Grievance.findById(req.params.id);

    if (!grievance) {
      return res.status(404).json({ message: 'Grievance not found' });
    }

    // Ensure student owns this grievance
    if (grievance.student.toString() !== req.student._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this grievance' });
    }

    await Grievance.findByIdAndDelete(req.params.id);
    res.json({ message: 'Grievance deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;