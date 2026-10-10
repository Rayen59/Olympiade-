import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import multer from 'multer';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const DB_FILE = path.join(__dirname, 'data', 'db.json');

// Ensure storage directories exist
fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
fs.mkdirSync(path.join(__dirname, 'uploads', 'exams'), { recursive: true });
fs.mkdirSync(path.join(__dirname, 'uploads', 'solutions'), { recursive: true });

// Helpers for database JSON
function readDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      return { users: [], tests: [], sessions: [] };
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading db.json:', err);
    return { users: [], tests: [], sessions: [] };
  }
}

function writeDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing db.json:', err);
  }
}

// Ensure default admin account exists
function ensureSeedData() {
  const db = readDB();
  let modified = false;

  const adminExists = db.users.find(u => u.email.toLowerCase() === 'admin12@gmail.com');
  if (!adminExists) {
    db.users.push({
      id: 'admin-' + Date.now(),
      email: 'admin12@gmail.com',
      password: 'admin12',
      name: 'Examination Directorate',
      country: 'Tunisia',
      role: 'admin',
      createdAt: new Date().toISOString(),
      bannedUntil: null,
      banReason: null
    });
    modified = true;
  }

  if (!db.tests || db.tests.length === 0) {
    db.tests = [{
      id: 'test-2026-01',
      title: 'Assil Hamdi Memorial International Mathematics Olympiad - Stage I',
      description: 'Strict 4-Hour Advanced Pure Mathematics Examination. Candidates are required to produce handwritten solutions with clear, verified geometric schemas and rigorous mathematical proofs. Zero tolerance for plagiarism or AI assistance.',
      durationMinutes: 240,
      maxScore: 42,
      totalProblems: 6,
      pdfUrl: '/uploads/exams/Assil_Hamdi_Memorial_Olympiad_Paper_2026.pdf',
      pdfFilename: 'Assil_Hamdi_Memorial_Olympiad_Paper_2026.pdf',
      isActive: true,
      createdAt: new Date().toISOString()
    }];
    modified = true;
  }

  if (!db.settings) {
    db.settings = {
      isResultsPublic: false,
      goldCutoff: 35,
      silverCutoff: 28,
      bronzeCutoff: 20
    };
    modified = true;
  }

  // Ensure sessions have messages array initialized
  if (db.sessions && Array.isArray(db.sessions)) {
    db.sessions.forEach(s => {
      if (!Array.isArray(s.messages)) {
        s.messages = [];
        if (s.feedback) {
          s.messages.push({
            id: 'msg-init-' + (s.id || '1'),
            sender: 'admin',
            authorName: s.gradedBy || 'Examination Directorate',
            text: s.feedback,
            timestamp: s.gradedAt || s.submittedAt || new Date().toISOString()
          });
        }
        modified = true;
      }
    });
  }

  if (modified) {
    writeDB(db);
  }
}

ensureSeedData();

// Multer storage configs
const examStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads', 'exams'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.pdf';
    const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${cleanName}_${Date.now()}${ext}`);
  }
});
const uploadExamPdf = multer({ storage: examStorage, limits: { fileSize: 25 * 1024 * 1024 } });

const solutionStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads', 'solutions'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const unique = crypto.randomBytes(6).toString('hex');
    cb(null, `solution_${unique}_${Date.now()}${ext}`);
  }
});
const uploadSolutionImage = multer({ storage: solutionStorage, limits: { fileSize: 20 * 1024 * 1024 } });

// Middlewares
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static project files
app.use(express.static(__dirname, {
  extensions: ['html', 'htm']
}));

// Auth helper
function getAuthenticatedUser(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;

  const db = readDB();
  const user = db.users.find(u => u.id === token);
  if (!user) return null;

  // Check ban expiry
  if (user.bannedUntil) {
    const banTime = new Date(user.bannedUntil).getTime();
    if (Date.now() >= banTime) {
      user.bannedUntil = null;
      user.banReason = null;
      writeDB(db);
    }
  }

  return user;
}

// ======================== API ROUTES ========================

// 1. Auth: Register
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, country } = req.body;
  if (!name || !email || !password || !country) {
    return res.status(400).json({ error: 'All fields (Name, Email, Password, Country) are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const db = readDB();

  if (db.users.find(u => u.email.toLowerCase() === cleanEmail)) {
    return res.status(400).json({ error: 'An account with this email address already exists.' });
  }

  const newUser = {
    id: 'user-' + crypto.randomUUID(),
    email: cleanEmail,
    password: password.trim(),
    name: name.trim(),
    country: country.trim(),
    role: cleanEmail === 'admin12@gmail.com' ? 'admin' : 'user',
    createdAt: new Date().toISOString(),
    bannedUntil: null,
    banReason: null
  };

  db.users.push(newUser);
  writeDB(db);

  const { password: _, ...userSafe } = newUser;
  res.json({ user: userSafe, token: newUser.id });
});

// 2. Auth: Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const db = readDB();
  const user = db.users.find(u => u.email.toLowerCase() === cleanEmail);

  if (!user || user.password !== password.trim()) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  // Check ban expiry
  let isBanned = false;
  if (user.bannedUntil) {
    const banTime = new Date(user.bannedUntil).getTime();
    if (Date.now() < banTime) {
      isBanned = true;
    } else {
      user.bannedUntil = null;
      user.banReason = null;
      writeDB(db);
    }
  }

  const { password: _, ...userSafe } = user;
  res.json({ user: userSafe, token: user.id, isBanned });
});

// 3. Auth: Current User
app.get('/api/auth/me', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  let isBanned = false;
  if (user.bannedUntil && Date.now() < new Date(user.bannedUntil).getTime()) {
    isBanned = true;
  }

  const { password: _, ...userSafe } = user;
  res.json({ user: userSafe, isBanned });
});

// 4. Exam: Active Exam Details & Student Session
app.get('/api/exam/active', (req, res) => {
  const db = readDB();
  const test = db.tests.find(t => t.isActive) || db.tests[0];
  if (!test) {
    return res.status(404).json({ error: 'No active Olympiad examination found.' });
  }

  const user = getAuthenticatedUser(req);
  let session = null;
  let isBanned = false;
  let banDetails = null;

  if (user) {
    if (user.bannedUntil && Date.now() < new Date(user.bannedUntil).getTime()) {
      isBanned = true;
      banDetails = {
        bannedUntil: user.bannedUntil,
        banReason: user.banReason
      };
    }

    const userSession = db.sessions.find(s => s.userId === user.id && s.testId === test.id);
    if (userSession) {
      const now = Date.now();
      const deadline = new Date(userSession.deadline).getTime();
      let remainingSeconds = Math.max(0, Math.floor((deadline - now) / 1000));

      if (userSession.status === 'in_progress' && remainingSeconds <= 0) {
        userSession.status = 'expired';
        writeDB(db);
      }

      session = {
        ...userSession,
        remainingSeconds
      };
    }
  }

  res.json({
    test,
    session,
    isBanned,
    banDetails
  });
});

// 5. Exam: Start Test (Initiates 4-Hour Countdown)
app.post('/api/exam/start', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Please log in to start the examination.' });
  }

  if (user.bannedUntil && Date.now() < new Date(user.bannedUntil).getTime()) {
    return res.status(403).json({
      error: `Your account is suspended until ${new Date(user.bannedUntil).toLocaleString()}. Reason: ${user.banReason || 'Academic integrity violation'}.`
    });
  }

  const db = readDB();
  const test = db.tests.find(t => t.isActive) || db.tests[0];
  if (!test) {
    return res.status(404).json({ error: 'No active Olympiad examination available.' });
  }

  // Check if session already exists
  let session = db.sessions.find(s => s.userId === user.id && s.testId === test.id);
  if (session) {
    if (session.status === 'submitted') {
      return res.status(400).json({ error: 'You have already submitted your examination solutions.' });
    }
    const now = Date.now();
    const deadline = new Date(session.deadline).getTime();
    const remainingSeconds = Math.max(0, Math.floor((deadline - now) / 1000));
    return res.json({ session: { ...session, remainingSeconds } });
  }

  const durationMinutes = test.durationMinutes || 240; // 4 Hours
  const startTime = new Date();
  const deadlineTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

  session = {
    id: 'session-' + crypto.randomUUID(),
    userId: user.id,
    testId: test.id,
    startedAt: startTime.toISOString(),
    deadline: deadlineTime.toISOString(),
    status: 'in_progress',
    submittedAt: null,
    images: [],
    studentNotes: '',
    score: null,
    gradedAt: null,
    feedback: null,
    gradedBy: null
  };

  db.sessions.push(session);
  writeDB(db);

  res.json({
    message: 'Examination started. You have 4 hours to solve and submit your work.',
    session: {
      ...session,
      remainingSeconds: durationMinutes * 60
    }
  });
});

// 6. Exam: Upload Solution Image
app.post('/api/exam/upload-image', uploadSolutionImage.single('image'), (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No image file uploaded.' });
  }

  const relativeUrl = `/uploads/solutions/${req.file.filename}`;
  const imageObj = {
    id: 'img-' + Date.now() + '-' + crypto.randomBytes(3).toString('hex'),
    url: relativeUrl,
    name: req.file.originalname,
    size: req.file.size,
    uploadedAt: new Date().toISOString()
  };

  res.json({ image: imageObj });
});

// 7. Exam: Submit Solutions
app.post('/api/exam/submit', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  const { images, studentNotes } = req.body;
  if (!images || !Array.isArray(images) || images.length === 0) {
    return res.status(400).json({ error: 'Please upload at least one image showing your handwritten solutions and geometric schemas.' });
  }

  const db = readDB();
  const test = db.tests.find(t => t.isActive) || db.tests[0];
  const session = db.sessions.find(s => s.userId === user.id && s.testId === test.id);

  if (!session) {
    return res.status(404).json({ error: 'No active session found. Please start the exam first.' });
  }

  if (session.status === 'submitted') {
    return res.status(400).json({ error: 'Your examination solutions have already been submitted.' });
  }

  // Grace period of 15 minutes allowed for slow photo uploads
  const deadlineMs = new Date(session.deadline).getTime() + 15 * 60 * 1000;
  if (Date.now() > deadlineMs) {
    return res.status(403).json({ error: 'The 4-hour time limit (including upload grace period) has expired.' });
  }

  session.images = images;
  session.studentNotes = studentNotes || '';
  session.status = 'submitted';
  session.submittedAt = new Date().toISOString();

  writeDB(db);

  res.json({
    message: 'Examination solutions submitted successfully! Your submission is now awaiting review by the Examination Directorate.',
    session
  });
});

// 7b. Candidate Image Management: Update Images in Session
app.post('/api/exam/update-images', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  const { images } = req.body;
  if (!Array.isArray(images)) {
    return res.status(400).json({ error: 'Images must be an array.' });
  }

  const db = readDB();
  const test = db.tests.find(t => t.isActive) || db.tests[0];
  const session = db.sessions.find(s => s.userId === user.id && s.testId === test?.id);

  if (!session) {
    return res.status(404).json({ error: 'No active session found.' });
  }

  session.images = images;
  writeDB(db);

  res.json({ message: 'Images updated successfully.', session });
});

// 7c. Candidate Image Management: Delete Single Image
app.post('/api/exam/delete-image', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  const { imageId } = req.body;
  if (!imageId) {
    return res.status(400).json({ error: 'imageId is required.' });
  }

  const db = readDB();
  const test = db.tests.find(t => t.isActive) || db.tests[0];
  const session = db.sessions.find(s => s.userId === user.id && s.testId === test?.id);

  if (!session) {
    return res.status(404).json({ error: 'No active session found.' });
  }

  session.images = (session.images || []).filter(img => img.id !== imageId);
  writeDB(db);

  res.json({ message: 'Image removed successfully.', session });
});

// 7d. Candidate Messenger: Send Message to Directorate
app.post('/api/exam/sessions/:sessionId/message', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Message text is required.' });
  }

  const db = readDB();
  const session = db.sessions.find(s => s.id === req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found.' });
  }

  if (session.userId !== user.id && user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied.' });
  }

  session.messages = session.messages || [];
  const newMsg = {
    id: 'msg-' + Date.now() + '-' + crypto.randomBytes(3).toString('hex'),
    sender: 'candidate',
    authorName: user.name,
    text: text.trim(),
    timestamp: new Date().toISOString()
  };
  session.messages.push(newMsg);
  writeDB(db);

  res.json({ message: 'Message sent.', msg: newMsg, session });
});

// 7e. Candidate Messenger: Get Messages for Session
app.get('/api/exam/sessions/:sessionId/messages', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  const db = readDB();
  const session = db.sessions.find(s => s.id === req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found.' });
  }

  if (session.userId !== user.id && user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied.' });
  }

  res.json({ messages: session.messages || [], session });
});

// ======================== ADMIN ROUTES ========================

function requireAdmin(req, res, next) {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  req.adminUser = user;
  next();
}

// 8. Admin: List All Submissions (Messenger style feed)
app.get('/api/admin/submissions', requireAdmin, (req, res) => {
  const db = readDB();
  const test = db.tests.find(t => t.isActive) || db.tests[0];

  const enrichedSubmissions = db.sessions
    .filter(s => s.status === 'submitted' || (s.images && s.images.length > 0))
    .map(session => {
      const student = db.users.find(u => u.id === session.userId);
      const isBanned = student?.bannedUntil && Date.now() < new Date(student.bannedUntil).getTime();
      return {
        ...session,
        student: student ? {
          id: student.id,
          name: student.name,
          email: student.email,
          country: student.country,
          createdAt: student.createdAt,
          isBanned,
          bannedUntil: student.bannedUntil,
          banReason: student.banReason
        } : { name: 'Unknown Candidate', country: 'Unknown', email: 'unknown' }
      };
    })
    .sort((a, b) => new Date(b.submittedAt || b.startedAt).getTime() - new Date(a.submittedAt || a.startedAt).getTime());

  res.json({ submissions: enrichedSubmissions, test });
});

// 9. Admin: Grade Single Submission
app.post('/api/admin/grade', requireAdmin, (req, res) => {
  const { sessionId, score, feedback } = req.body;
  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required.' });
  }

  const numericScore = parseFloat(score);
  if (isNaN(numericScore) || numericScore < 0) {
    return res.status(400).json({ error: 'Please provide a valid non-negative numeric score.' });
  }

  const db = readDB();
  const session = db.sessions.find(s => s.id === sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Submission not found.' });
  }

  session.score = numericScore;
  session.feedback = feedback || '';
  session.gradedAt = new Date().toISOString();
  session.gradedBy = req.adminUser.name;

  writeDB(db);

  res.json({ message: 'Grade and evaluation comments saved successfully.', session });
});

// 10. Admin: Ban / Unban User (1, 2, 7, 30 days)
app.post('/api/admin/ban', requireAdmin, (req, res) => {
  const { userId, days, reason } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'userId is required.' });
  }

  const db = readDB();
  const user = db.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const numDays = parseInt(days, 10);
  if (numDays === 0) {
    // Unban
    user.bannedUntil = null;
    user.banReason = null;
    writeDB(db);
    return res.json({ message: `Suspension lifted for candidate ${user.name}.`, user });
  }

  const validDays = [1, 2, 7, 30];
  if (!validDays.includes(numDays)) {
    return res.status(400).json({ error: 'Ban duration must be 1, 2, 7, or 30 days (or 0 to unban).' });
  }

  const bannedUntilDate = new Date(Date.now() + numDays * 24 * 60 * 60 * 1000);
  user.bannedUntil = bannedUntilDate.toISOString();
  user.banReason = reason || 'Violation of Academic Integrity / Illegible solutions or AI usage';

  // If candidate had a submission for active test and ban was for plagiarism/AI, optionally set score to 0
  const activeTest = db.tests.find(t => t.isActive);
  if (activeTest) {
    const userSession = db.sessions.find(s => s.userId === user.id && s.testId === activeTest.id);
    if (userSession) {
      userSession.score = 0;
      userSession.feedback = `Disqualified (Score: 0) - Account suspended for ${numDays} day(s). Reason: ${user.banReason}`;
      userSession.gradedAt = new Date().toISOString();
      userSession.gradedBy = req.adminUser.name;
    }
  }

  writeDB(db);

  res.json({
    message: `Candidate ${user.name} banned for ${numDays} day(s) until ${bannedUntilDate.toLocaleString()}.`,
    user
  });
});

// 10b. Admin: Send Messenger message to candidate
app.post('/api/admin/sessions/:sessionId/message', requireAdmin, (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Message text is required.' });
  }

  const db = readDB();
  const session = db.sessions.find(s => s.id === req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found.' });
  }

  session.messages = session.messages || [];
  const newMsg = {
    id: 'msg-' + Date.now() + '-' + crypto.randomBytes(3).toString('hex'),
    sender: 'admin',
    authorName: req.adminUser.name || 'Examination Directorate',
    text: text.trim(),
    timestamp: new Date().toISOString()
  };
  session.messages.push(newMsg);
  writeDB(db);

  res.json({ message: 'Message sent successfully to candidate.', msg: newMsg, session });
});

// 11. Admin: Tests Management (CRUD, Launch, Pause)
// 11a. List all Olympiad tests
app.get('/api/admin/tests', requireAdmin, (req, res) => {
  const db = readDB();
  const testsWithStats = (db.tests || []).map(t => {
    const sessions = (db.sessions || []).filter(s => s.testId === t.id);
    const submitted = sessions.filter(s => s.status === 'submitted');
    return {
      ...t,
      sessionsCount: sessions.length,
      submittedCount: submitted.length
    };
  });
  res.json({ tests: testsWithStats, activeTestId: db.tests.find(t => t.isActive)?.id });
});

// 11b. Create new Olympiad test
app.post('/api/admin/tests', requireAdmin, uploadExamPdf.single('testPdf'), (req, res) => {
  const { title, description, durationMinutes, maxScore, totalProblems, launchImmediately } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Olympiad title is required.' });
  }

  const db = readDB();
  db.tests = db.tests || [];

  const shouldLaunch = launchImmediately === 'true' || launchImmediately === true;

  if (shouldLaunch) {
    db.tests.forEach(t => { t.isActive = false; });
  }

  const newTest = {
    id: 'test-' + Date.now(),
    title: title.trim(),
    description: (description || '').trim(),
    durationMinutes: parseInt(durationMinutes, 10) || 240,
    maxScore: parseFloat(maxScore) || 42,
    totalProblems: parseInt(totalProblems, 10) || 6,
    pdfUrl: req.file ? `/uploads/exams/${req.file.filename}` : (db.tests[0]?.pdfUrl || '/uploads/exams/Assil_Hamdi_Memorial_Olympiad_Paper_2026.pdf'),
    pdfFilename: req.file ? req.file.originalname : (db.tests[0]?.pdfFilename || 'Assil_Hamdi_Memorial_Olympiad_Paper_2026.pdf'),
    isActive: shouldLaunch,
    createdAt: new Date().toISOString()
  };

  db.tests.unshift(newTest);
  writeDB(db);

  res.json({ message: shouldLaunch ? 'Olympiade créée et lancée avec succès !' : 'Olympiade enregistrée avec succès en brouillon.', test: newTest });
});

// 11c. Edit existing Olympiad test
app.put('/api/admin/tests/:id', requireAdmin, uploadExamPdf.single('testPdf'), (req, res) => {
  const { title, description, durationMinutes, maxScore, totalProblems } = req.body;
  const db = readDB();
  const test = db.tests.find(t => t.id === req.params.id);
  if (!test) {
    return res.status(404).json({ error: 'Olympiade non trouvée.' });
  }

  if (title) test.title = title.trim();
  if (description !== undefined) test.description = description.trim();
  if (durationMinutes) test.durationMinutes = parseInt(durationMinutes, 10) || 240;
  if (maxScore) test.maxScore = parseFloat(maxScore) || 42;
  if (totalProblems) test.totalProblems = parseInt(totalProblems, 10) || 6;

  if (req.file) {
    test.pdfUrl = `/uploads/exams/${req.file.filename}`;
    test.pdfFilename = req.file.originalname;
  }

  writeDB(db);
  res.json({ message: 'Olympiade mise à jour avec succès.', test });
});

// 11d. Delete Olympiad test
app.delete('/api/admin/tests/:id', requireAdmin, (req, res) => {
  const db = readDB();
  const testIndex = db.tests.findIndex(t => t.id === req.params.id);
  if (testIndex === -1) {
    return res.status(404).json({ error: 'Olympiade non trouvée.' });
  }

  const deletedTest = db.tests.splice(testIndex, 1)[0];

  if (deletedTest.isActive && db.tests.length > 0) {
    db.tests[0].isActive = true;
  }

  writeDB(db);
  res.json({ message: `Olympiade "${deletedTest.title}" supprimée avec succès.` });
});

// 11e. Launch Olympiad test
app.post('/api/admin/tests/:id/launch', requireAdmin, (req, res) => {
  const db = readDB();
  const test = db.tests.find(t => t.id === req.params.id);
  if (!test) {
    return res.status(404).json({ error: 'Olympiade non trouvée.' });
  }

  db.tests.forEach(t => { t.isActive = false; });
  test.isActive = true;
  writeDB(db);

  res.json({ message: `L'Olympiade "${test.title}" est maintenant active et lancée !`, test });
});

// 11f. Pause Olympiad test
app.post('/api/admin/tests/:id/pause', requireAdmin, (req, res) => {
  const db = readDB();
  const test = db.tests.find(t => t.id === req.params.id);
  if (!test) {
    return res.status(404).json({ error: 'Olympiade non trouvée.' });
  }

  test.isActive = false;
  writeDB(db);

  res.json({ message: `L'Olympiade "${test.title}" est suspendue / mise en pause.`, test });
});

// 11g. Legacy Upload / Update Test Route
app.post('/api/admin/upload-test', requireAdmin, uploadExamPdf.single('testPdf'), (req, res) => {
  const { title, description, durationMinutes, maxScore, totalProblems } = req.body;
  const db = readDB();
  const test = db.tests.find(t => t.isActive) || db.tests[0];

  if (title) test.title = title.trim();
  if (description) test.description = description.trim();
  if (durationMinutes) test.durationMinutes = parseInt(durationMinutes, 10) || 240;
  if (maxScore) test.maxScore = parseFloat(maxScore) || 42;
  if (totalProblems) test.totalProblems = parseInt(totalProblems, 10) || 6;

  if (req.file) {
    test.pdfUrl = `/uploads/exams/${req.file.filename}`;
    test.pdfFilename = req.file.originalname;
  }

  writeDB(db);
  res.json({ message: 'Olympiad examination updated successfully.', test });
});

// 11h. Leaderboard Settings & Cutoffs
app.get('/api/leaderboard/settings', (req, res) => {
  const db = readDB();
  res.json({ settings: db.settings || { isResultsPublic: false, goldCutoff: 35, silverCutoff: 28, bronzeCutoff: 20 } });
});

app.post('/api/admin/leaderboard/settings', requireAdmin, (req, res) => {
  const { isResultsPublic, goldCutoff, silverCutoff, bronzeCutoff } = req.body;
  const db = readDB();

  db.settings = db.settings || {};
  if (isResultsPublic !== undefined) db.settings.isResultsPublic = Boolean(isResultsPublic);
  if (goldCutoff !== undefined) db.settings.goldCutoff = parseFloat(goldCutoff) || 35;
  if (silverCutoff !== undefined) db.settings.silverCutoff = parseFloat(silverCutoff) || 28;
  if (bronzeCutoff !== undefined) db.settings.bronzeCutoff = parseFloat(bronzeCutoff) || 20;

  writeDB(db);
  res.json({ message: 'Paramètres du classement et seuils des médailles enregistrés avec succès.', settings: db.settings });
});

// ======================== PUBLIC LEADERBOARD & STATS ========================

// 12. Leaderboard with Public Access Lock & Dynamic Medal Awards
app.get('/api/leaderboard', (req, res) => {
  const db = readDB();
  const test = db.tests.find(t => t.isActive) || db.tests[0];

  const caller = getAuthenticatedUser(req);
  const isAdmin = caller && caller.role === 'admin';

  const settings = db.settings || { isResultsPublic: false, goldCutoff: 35, silverCutoff: 28, bronzeCutoff: 20 };

  if (!settings.isResultsPublic && !isAdmin) {
    return res.json({
      isResultsPublic: false,
      message: "Les délibérations du Jury sont en cours. La Direction des Examens n'a pas encore ouvert l'accès public aux résultats.",
      settings,
      test,
      rankings: []
    });
  }

  const goldCutoff = settings.goldCutoff ?? 35;
  const silverCutoff = settings.silverCutoff ?? 28;
  const bronzeCutoff = settings.bronzeCutoff ?? 20;

  const rankings = db.sessions
    .filter(s => s.status === 'submitted' && s.score !== null)
    .map(s => {
      const student = db.users.find(u => u.id === s.userId);
      let medal = 'none';
      let medalLabel = 'Certificat de Participation';
      let medalBadge = '📜';

      if (s.score >= goldCutoff) {
        medal = 'gold';
        medalLabel = "Médaille d'Or";
        medalBadge = '🥇';
      } else if (s.score >= silverCutoff) {
        medal = 'silver';
        medalLabel = "Médaille d'Argent";
        medalBadge = '🥈';
      } else if (s.score >= bronzeCutoff) {
        medal = 'bronze';
        medalLabel = "Mention Honorable";
        medalBadge = '🥉';
      }

      return {
        sessionId: s.id,
        candidateName: student?.name || 'Anonymous Candidate',
        country: student?.country || 'International',
        score: s.score,
        maxScore: test?.maxScore || 42,
        submittedAt: s.submittedAt,
        feedback: s.feedback || '',
        medal,
        medalLabel,
        medalBadge
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
    })
    .map((item, index) => ({
      rank: index + 1,
      ...item
    }));

  res.json({
    isResultsPublic: true,
    isAdmin,
    settings,
    test,
    rankings
  });
});

// 13. Statistics
app.get('/api/statistics', (req, res) => {
  const db = readDB();
  const test = db.tests.find(t => t.isActive) || db.tests[0];

  const registeredCandidates = db.users.filter(u => u.role !== 'admin');
  const submissions = db.sessions.filter(s => s.status === 'submitted');
  const gradedSubmissions = submissions.filter(s => s.score !== null);

  const scores = gradedSubmissions.map(s => s.score);
  const avgScore = scores.length > 0
    ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
    : '0';

  const countryCounts = {};
  registeredCandidates.forEach(u => {
    countryCounts[u.country] = (countryCounts[u.country] || 0) + 1;
  });

  const topCountries = Object.entries(countryCounts)
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count);

  res.json({
    totalRegistered: registeredCandidates.length,
    totalSubmissions: submissions.length,
    totalGraded: gradedSubmissions.length,
    averageScore: avgScore,
    maxScore: test?.maxScore || 42,
    topCountries,
    activeTest: test
  });
});

// Fallback for HTML subpages and clean routing
app.get('*', (req, res, next) => {
  try {
    const decodedPath = decodeURIComponent(req.path);
    const normalizedPath = decodedPath.replace(/^\/+/, '');

    if (!normalizedPath) {
      return res.sendFile(path.join(__dirname, 'index.html'));
    }

    const possiblePaths = [
      path.join(__dirname, normalizedPath),
      path.join(__dirname, `${normalizedPath}.html`),
      path.join(__dirname, `${normalizedPath}.htm`)
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p) && fs.statSync(p).isFile()) {
        return res.sendFile(p);
      }
    }

    const indexPath = path.join(__dirname, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }

    res.status(404).send('Page not found');
  } catch (err) {
    next(err);
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});

export default app;
