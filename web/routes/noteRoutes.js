const express = require('express');
const router = express.Router();
const Note = require('../models/Note');

router.get('/notes', async (req, res) => {
  try {
    const { status, priority, category } = req.query;
    
    let query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;
    
    const notes = await Note.find(query).sort({ createdAt: -1 });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/notes', async (req, res) => {
  try {
    const { title, body, status, priority, category } = req.body;
    
    const note = new Note({ title, body, status, priority, category, owner: '507f1f77bcf86cd799439011' });
    await note.save();
    
    res.status(201).json(note);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/notes/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const note = await Note.findById(id);
    
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.json(note);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/notes/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const updates = req.body;
    
    const note = await Note.findByIdAndUpdate(id, updates, { 
      new: true,
      runValidators: true 
    });
    
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.json(note);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/notes/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const note = await Note.findByIdAndDelete(id);
    
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.json({ message: 'Note deleted successfully', note });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/search', async (req, res) => {
  try {
    const searchTerm = req.query.q;
    
    if (!searchTerm) {
      return res.status(400).json({ error: 'Search term required' });
    }
    
    const notes = await Note.find({
      $or: [
        { title: { $regex: searchTerm, $options: 'i' } },
        { body: { $regex: searchTerm, $options: 'i' } }
      ]
    });
    
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;