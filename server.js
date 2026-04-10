require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const noteRoutes = require('./web/routes/noteRoutes');
const authRoutes = require('./web/routes/authRoutes');
const Note = require('./web/models/Note');
const { requireAuth, requireGuest } = require('./web/middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/notemanager')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Error:', err));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'web/views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'web/public')));

app.use(session({
  secret: 'notemanager-secret-key-2026',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/notemanager'
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24
  }
}));

app.use((req, res, next) => {
  res.locals.userId = req.session.userId;
  res.locals.userName = req.session.userName;
  next();
});

app.get('/', requireGuest, (req, res) => {
  res.render('landing', { title: 'NoteManager - Login' });
});

app.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const allNotes = await Note.find({ owner: req.session.userId }).sort({ createdAt: -1 });
    
    const stats = {
      total: allNotes.length,
      pending: allNotes.filter(n => n.status === 'pending').length,
      inProgress: allNotes.filter(n => n.status === 'in-progress').length,
      completed: allNotes.filter(n => n.status === 'completed').length
    };
    
    const filter = req.query.filter || 'all';
    const sort = req.query.sort || 'newest';
    
    let notes = allNotes;
    if (filter !== 'all') {
      notes = allNotes.filter(n => n.status === filter);
    }
    
    if (sort === 'oldest') {
      notes = notes.reverse();
    } else if (sort === 'status') {
      const statusOrder = { 'pending': 1, 'in-progress': 2, 'completed': 3 };
      notes = notes.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
    }
    
    res.render('dashboard', { 
      title: 'Dashboard',
      notes,
      stats,
      filter,
      sort
    });
  } catch (error) {
    res.status(500).send('Error loading dashboard');
  }
});

app.post('/add', requireAuth, async (req, res) => {
  try {
    const { title, body, status, priority, category } = req.body;
    
    const note = new Note({ 
      title, 
      body,
      status: status || 'pending',
      priority: priority || 'medium',
      category: category || 'general',
      owner: req.session.userId
    });
    await note.save();
    
    res.redirect('/dashboard');
  } catch (error) {
    res.status(400).send('Error adding note');
  }
});

app.get('/edit/:id', requireAuth, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, owner: req.session.userId });
    if (!note) {
      return res.status(404).send('Note not found');
    }
    res.render('edit', { title: 'Edit Note', note });
  } catch (error) {
    res.status(500).send('Error loading note');
  }
});

app.post('/update/:id', requireAuth, async (req, res) => {
  try {
    const { title, body, status, priority, category } = req.body;
    await Note.findOneAndUpdate(
      { _id: req.params.id, owner: req.session.userId },
      { title, body, status, priority, category }
    );
    res.redirect('/dashboard');
  } catch (error) {
    res.status(400).send('Error updating note');
  }
});

app.post('/delete/:id', requireAuth, async (req, res) => {
  try {
    await Note.findOneAndDelete({ _id: req.params.id, owner: req.session.userId });
    res.redirect('/dashboard');
  } catch (error) {
    res.status(400).send('Error deleting note');
  }
});

app.use('/auth', authRoutes);
app.use('/api', noteRoutes);

app.listen(PORT, () => {
  console.log(`NoteManager running on http://localhost:${PORT}`);
  console.log(`CLI: node cli/app.js --help`);
});