import express from 'express';
import { createServer as createViteServer } from 'vite';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbwl2XLNQ0bbeQqQ-d8mgzQ7-VFzBft6AKX5FeE2nLFINayM7QbqMnQTYdOX39EHrjvr/exec';
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-dev';

async function fetchFromSheet(action: string) {
  try {
    const res = await fetch(`${GOOGLE_SHEET_URL}?action=${action}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error('Sheet fetch error:', e);
    return [];
  }
}

async function postToSheet(payload: any) {
  try {
    const res = await fetch(GOOGLE_SHEET_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (e) {
    console.error('Sheet post error:', e);
    return { error: 'Failed' };
  }
}

function getNextAssemblyDate() {
  const assemblies = [
    new Date(2026, 3, 30),
    new Date(2026, 5, 26),
    new Date(2026, 6, 30),
    new Date(2026, 8, 24),
    new Date(2026, 9, 29),
    new Date(2026, 10, 26),
  ];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return assemblies.find(d => {
    const dCopy = new Date(d);
    dCopy.setHours(0, 0, 0, 0);
    return dCopy >= today;
  }) || assemblies[0];
}

async function seedDatabase() {
  try {
    const wards = await fetchFromSheet('getWards');
    if (wards.length > 0) {
      console.log('Google Sheet already has wards');
      return;
    }

    console.log('Seeding Google Sheet with default wards...');
    const wardsData = [
      { name: 'Kangemi', slug: 'kangemi', description: 'Nairobi County - Kangemi Ward' },
      { name: 'Kitusuru', slug: 'kitusuru', description: 'Nairobi County - Kitusuru Ward' },
      { name: 'Karura', slug: 'karura', description: 'Nairobi County - Karura Ward' },
      { name: 'Mountain View', slug: 'mountain-view', description: 'Nairobi County - Mountain View Ward' },
      { name: 'Parklands', slug: 'parklands', description: 'Nairobi County - Parklands Ward' },
      { name: 'South Sakwa', slug: 'south-sakwa', description: 'Migori County - South Sakwa Ward' },
      { name: 'Sikhendu', slug: 'sikhendu', description: 'Trans Nzoia County - Sikhendu Ward' },
    ];

    for (const ward of wardsData) {
      await postToSheet({
        action: 'addWard',
        id: crypto.randomUUID(),
        ...ward
      });
    }
    console.log('Google Sheet seeded successfully');
  } catch (error) {
    console.error('Failed to seed Google Sheet on startup:', error);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Seed database on startup
  await seedDatabase();

  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Auth Routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { name, email, password, role, wardId } = req.body;
      
      // Check if user exists
      const users = await fetchFromSheet('getUsers');
      if (users.find((u: any) => u.email === email)) {
        return res.status(400).json({ error: 'Email already exists' });
      }

      // Hash password (simple hash for prototype)
      const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
      
      const newUser = {
        action: 'addUser',
        id: crypto.randomUUID(),
        name,
        email,
        password: hashedPassword,
        role: role || 'MOBILIZER',
        wardId: wardId || ''
      };

      await postToSheet(newUser);
      
      // Generate token
      const token = jwt.sign({ id: newUser.id, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });
      
      res.json({ 
        token, 
        user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, wardId: newUser.wardId } 
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to register' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const users = await fetchFromSheet('getUsers');
      
      const user = users.find((u: any) => u.email === email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
      if (user.password !== hashedPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
      
      res.json({ 
        token, 
        user: { id: user.id, name: user.name, email: user.email, role: user.role, wardId: user.wardId } 
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to login' });
    }
  });

const DELETED_WARDS_FILE = path.join(process.cwd(), 'deleted_wards.json');

// Load deleted wards from file
let deletedWards = new Set<string>();
try {
  if (fs.existsSync(DELETED_WARDS_FILE)) {
    const data = fs.readFileSync(DELETED_WARDS_FILE, 'utf-8');
    deletedWards = new Set(JSON.parse(data));
  }
} catch (e) {
  console.error('Failed to load deleted wards', e);
}

function saveDeletedWards() {
  try {
    fs.writeFileSync(DELETED_WARDS_FILE, JSON.stringify(Array.from(deletedWards)));
  } catch (e) {
    console.error('Failed to save deleted wards', e);
  }
}

// Get all wards from Google Sheets
  app.get('/api/wards', async (req, res) => {
    try {
      const wards = await fetchFromSheet('getWards');
      
      const defaultWards = [
        { id: 'ward-1', name: 'Kangemi', slug: 'kangemi', description: 'Nairobi County - Kangemi Ward' },
        { id: 'ward-2', name: 'Kitusuru', slug: 'kitusuru', description: 'Nairobi County - Kitusuru Ward' },
        { id: 'ward-3', name: 'Karura', slug: 'karura', description: 'Nairobi County - Karura Ward' },
        { id: 'ward-4', name: 'Mountain View', slug: 'mountain-view', description: 'Nairobi County - Mountain View Ward' },
        { id: 'ward-5', name: 'Parklands', slug: 'parklands', description: 'Nairobi County - Parklands Ward' },
        { id: 'ward-6', name: 'South Sakwa', slug: 'south-sakwa', description: 'Migori County - South Sakwa Ward' },
        { id: 'ward-7', name: 'Sikhendu', slug: 'sikhendu', description: 'Trans Nzoia County - Sikhendu Ward' },
      ];

      const mergedWards = Array.isArray(wards) ? [...wards] : [];
      for (const dw of defaultWards) {
        if (!mergedWards.find((w: any) => w.name && w.name.toLowerCase() === dw.name.toLowerCase())) {
          mergedWards.push(dw);
        }
      }

      const formattedWards = mergedWards
        .filter((w: any) => !deletedWards.has(w.id))
        .map((w: any) => ({
          ...w,
          _count: { groups: 0, discussions: 0, users: 0, issues: 0 }
        }));
      res.json(formattedWards);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch wards' });
    }
  });

  // Add ward to Google Sheets
  app.post('/api/wards', async (req, res) => {
    try {
      const newWard = {
        action: 'addWard',
        id: crypto.randomUUID(),
        name: req.body.name,
        slug: req.body.slug,
        description: req.body.description
      };
      await postToSheet(newWard);
      res.json(newWard);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create ward' });
    }
  });

  app.delete('/api/wards/:id', async (req, res) => {
    try {
      // Since Google Sheets API doesn't support delete yet, we'll mark it as deleted in memory
      deletedWards.add(req.params.id);
      saveDeletedWards();
      
      res.json({ success: true, message: 'Ward deleted' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete ward' });
    }
  });

  // Get ward by slug from Google Sheets
  app.get('/api/wards/:slug', async (req, res) => {
    try {
      const wards = await fetchFromSheet('getWards');
      
      const defaultWards = [
        { id: 'ward-1', name: 'Kangemi', slug: 'kangemi', description: 'Nairobi County - Kangemi Ward' },
        { id: 'ward-2', name: 'Kitusuru', slug: 'kitusuru', description: 'Nairobi County - Kitusuru Ward' },
        { id: 'ward-3', name: 'Karura', slug: 'karura', description: 'Nairobi County - Karura Ward' },
        { id: 'ward-4', name: 'Mountain View', slug: 'mountain-view', description: 'Nairobi County - Mountain View Ward' },
        { id: 'ward-5', name: 'Parklands', slug: 'parklands', description: 'Nairobi County - Parklands Ward' },
        { id: 'ward-6', name: 'South Sakwa', slug: 'south-sakwa', description: 'Migori County - South Sakwa Ward' },
        { id: 'ward-7', name: 'Sikhendu', slug: 'sikhendu', description: 'Trans Nzoia County - Sikhendu Ward' },
      ];

      const mergedWards = Array.isArray(wards) ? [...wards] : [];
      for (const dw of defaultWards) {
        if (!mergedWards.find((w: any) => w.name && w.name.toLowerCase() === dw.name.toLowerCase())) {
          mergedWards.push(dw);
        }
      }

      const ward = mergedWards
        .filter((w: any) => !deletedWards.has(w.id))
        .find((w: any) => w.slug === req.params.slug);
      
      if (!ward) return res.status(404).json({ error: 'Ward not found' });

      // Fetch issues for this ward
      const allIssues = await fetchFromSheet('getIssues');
      ward.issues = allIssues
        .filter((i: any) => i.wardName === ward.name)
        .map((i: any) => ({ ...i, votes: parseInt(i.votes) || 0 }))
        .sort((a: any, b: any) => b.votes - a.votes);

      // Clear mock discussions and groups as requested
      ward.discussions = [];
      ward.groups = [];
      ward._count = { groups: 0, discussions: 0, users: 0, issues: ward.issues.length };

      res.json(ward);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch ward' });
    }
  });

  // Add Citizen to Google Sheets
  app.post('/api/citizens', async (req, res) => {
    try {
      await postToSheet({
        action: 'addCitizen',
        id: crypto.randomUUID(),
        wardName: req.body.wardName,
        fullName: req.body.fullName,
        phoneNumber: req.body.phoneNumber
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to add citizen' });
    }
  });

  // Add Issue to Google Sheets
  app.post('/api/issues', async (req, res) => {
    try {
      const issue = {
        action: 'addIssue',
        id: crypto.randomUUID(),
        wardName: req.body.wardName,
        title: req.body.title,
        description: req.body.description
      };
      await postToSheet(issue);
      res.json({ success: true, issue });
    } catch (error) {
      res.status(500).json({ error: 'Failed to add issue' });
    }
  });

  // Vote on Issue in Google Sheets
  app.post('/api/issues/:id/vote', async (req, res) => {
    try {
      await postToSheet({
        action: 'voteIssue',
        id: req.params.id
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to vote' });
    }
  });

  // Get all discussions
  app.get('/api/discussions', async (req, res) => {
    try {
      // Mock returning empty array since there are no past assemblies yet
      res.json([]);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch discussions' });
    }
  });

  // Add resolution to a discussion
  app.post('/api/discussions/:id/resolutions', async (req, res) => {
    try {
      const { text } = req.body;
      // Mock adding resolution
      const newResolution = {
        id: crypto.randomUUID(),
        text,
        status: 'PENDING'
      };
      res.json(newResolution);
    } catch (error) {
      res.status(500).json({ error: 'Failed to add resolution' });
    }
  });

  // Get discussion by id
  app.get('/api/discussions/:id', async (req, res) => {
    try {
      // Mock discussion since Prisma is not connected
      const isClosed = req.params.id === 'mock-disc-2';
      const discussion = {
        id: req.params.id,
        title: isClosed ? 'Past Citizen Assembly' : 'Upcoming Citizen Assembly',
        description: isClosed ? 'Reviewing progress on water scarcity and road infrastructure.' : 'Discussing pressing issues in the ward for the next assembly.',
        date: isClosed ? new Date(2026, 1, 10).toISOString() : new Date(2026, 3, 15).toISOString(),
        status: isClosed ? 'CLOSED' : 'UPCOMING',
        ward: { name: 'Mock Ward', slug: 'mock-ward' },
        _count: { rsvps: isClosed ? 45 : 12, comments: isClosed ? 28 : 4 },
        resolutions: isClosed ? [
          { id: 'res-1', text: 'Allocate 20% of ward fund to repair the main water pipe.', status: 'PENDING' },
          { id: 'res-2', text: 'Form a youth committee to monitor road construction.', status: 'IMPLEMENTED' }
        ] : []
      };
      res.json(discussion);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch discussion' });
    }
  });

  // Get all groups from Google Sheets
  app.get('/api/groups', async (req, res) => {
    try {
      const groups = await fetchFromSheet('getGroups');
      res.json(groups);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch groups' });
    }
  });

  // Create a group in Google Sheets
  app.post('/api/groups', async (req, res) => {
    try {
      const { name, wardName, leaderName, meetingDay, meetingFrequency, members, memberCount } = req.body;
      const newGroup = {
        action: 'addGroup',
        id: crypto.randomUUID(),
        wardName,
        name,
        leaderName,
        meetingDay,
        meetingFrequency,
        members,
        memberCount: parseInt(memberCount, 10) || 0
      };
      await postToSheet(newGroup);
      res.json(newGroup);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create group' });
    }
  });

  // Update a group
  app.put('/api/groups/:id', async (req, res) => {
    res.json({ success: true, message: 'Update not supported in Google Sheets mode yet' });
  });

  // Delete a group
  app.delete('/api/groups/:id', async (req, res) => {
    res.json({ success: true, message: 'Delete not supported in Google Sheets mode yet' });
  });

  // Get all issues from Google Sheets
  app.get('/api/issues', async (req, res) => {
    try {
      const issues = await fetchFromSheet('getIssues');
      res.json(issues);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch issues' });
    }
  });

  // Update an issue
  app.put('/api/issues/:id', async (req, res) => {
    res.json({ success: true, message: 'Update not supported in Google Sheets mode yet' });
  });

  // Delete an issue
  app.delete('/api/issues/:id', async (req, res) => {
    res.json({ success: true, message: 'Delete not supported in Google Sheets mode yet' });
  });

  // Seed data endpoint for demo purposes
  app.post('/api/seed', async (req, res) => {
    res.json({ message: 'Database seeded successfully' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static('dist'));
    
    // SPA fallback: redirect all non-API routes to index.html
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api/')) {
        res.sendFile('index.html', { root: 'dist' });
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
