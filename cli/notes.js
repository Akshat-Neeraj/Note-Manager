const fs = require('fs');
const path = require('path');

const notesFile = path.join(__dirname, 'notes-data.json');

const loadNotes = () => {
  try {
    const dataBuffer = fs.readFileSync(notesFile);
    const dataJSON = dataBuffer.toString();
    return JSON.parse(dataJSON);
  } catch (e) {
    return [];
  }
};

const saveNotes = (notes) => {
  const dataJSON = JSON.stringify(notes, null, 2);
  fs.writeFileSync(notesFile, dataJSON);
};

const addNote = (title, body) => {
  const notes = loadNotes();
  const duplicateNote = notes.find((note) => note.title === title);

  if (!duplicateNote) {
    notes.push({ title, body });
    saveNotes(notes);
    console.log('New note added successfully!');
  } else {
    console.log('Note title already exists!');
  }
};

const removeNote = (title) => {
  const notes = loadNotes();
  const notesToKeep = notes.filter((note) => note.title !== title);

  if (notes.length > notesToKeep.length) {
    saveNotes(notesToKeep);
    console.log('Note removed successfully!');
  } else {
    console.log('No note found with that title!');
  }
};

const listNotes = () => {
  const notes = loadNotes();
  console.log('\nYour notes:\n');
  notes.forEach((note) => {
    console.log(`  - ${note.title}`);
  });
};

const readNote = (title) => {
  const notes = loadNotes();
  const note = notes.find((note) => note.title === title);

  if (note) {
    console.log(`\nTitle: ${note.title}`);
    console.log(`Body: ${note.body}\n`);
  } else {
    console.log('Note not found!');
  }
};

module.exports = {
  addNote,
  removeNote,
  listNotes,
  readNote
};