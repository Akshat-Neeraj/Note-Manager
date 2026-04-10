const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Note = require('../models/Note');
const bcrypt = require('bcryptjs');

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    console.log('Signup attempt:', { name, email });
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.redirect('/?error=exists');
    }
    
    const hashedPassword = await bcrypt.hash(password, 8);
    
    const user = new User({ 
      name, 
      email, 
      password: hashedPassword 
    });
    
    await user.save();
    
    console.log('User created successfully:', user._id);
    
    req.session.userId = user._id;
    req.session.userName = user.name;
    
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
      }
      res.redirect('/dashboard');
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.redirect('/?error=signup');
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt:', { email });
    
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found');
      return res.redirect('/?error=invalid');
    }
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('Password mismatch');
      return res.redirect('/?error=invalid');
    }
    
    console.log('Login successful:', user._id);
    
    req.session.userId = user._id;
    req.session.userName = user.name;
    
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
      }
      res.redirect('/dashboard');
    });
  } catch (error) {
    console.error('Login error:', error);
    res.redirect('/?error=login');
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

router.post('/delete-account', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.redirect('/');
    }
    
    const userId = req.session.userId;
    
    console.log('Deleting account:', userId);
    
    await Note.deleteMany({ owner: userId });
    await User.findByIdAndDelete(userId);
    
    req.session.destroy();
    
    console.log('Account deleted successfully');
    
    res.send(`
      <html>
        <head>
          <style>
            body { font-family: Arial; padding: 50px; text-align: center; background: #f5f7fa; }
            .message { background: white; padding: 3rem; border-radius: 12px; max-width: 500px; margin: 0 auto; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
            h2 { color: #28a745; margin-bottom: 1rem; }
            a { color: #667eea; text-decoration: none; font-weight: bold; display: inline-block; margin-top: 1rem; padding: 0.8rem 2rem; background: #667eea; color: white; border-radius: 8px; }
            a:hover { background: #5568d3; }
          </style>
        </head>
        <body>
          <div class="message">
            <h2>Account Deleted Successfully</h2>
            <p>Your account and all notes have been permanently deleted.</p>
            <a href="/">Back to Home</a>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).send('Error deleting account');
  }
});

module.exports = router;