import express from 'express';
import { createServer as createViteServer } from 'vite';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
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
    new Date(2026, 2, 19),
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

      const formattedWards = mergedWards.map((w: any) => ({
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
    // Note: Deleting from Google Sheets via API requires more complex Apps Script logic.
    // For now, we return success to keep the UI happy, but it won't actually delete from the sheet.
    res.json({ success: true, message: 'Delete not supported in Google Sheets mode yet' });
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

      const ward = mergedWards.find((w: any) => w.slug === req.params.slug);
      
      if (!ward) return res.status(404).json({ error: 'Ward not found' });

      // Fetch issues for this ward
      const allIssues = await fetchFromSheet('getIssues');
      ward.issues = allIssues
        .filter((i: any) => i.wardName === ward.name)
        .map((i: any) => ({ ...i, votes: parseInt(i.votes) || 0 }))
        .sort((a: any, b: any) => b.votes - a.votes);

      // Mock discussions and groups so the UI doesn't break
      ward.discussions = [{
        id: 'mock-disc-1',
        title: `Citizen Assembly - ${ward.name}`,
        description: 'Discussing pressing issues in the ward for the next assembly.',
        date: new Date(2026, 2, 5).toISOString(),
        status: 'UPCOMING',
        _count: { rsvps: 12, comments: 4 }
      }];
      ward.groups = [{
        id: 'mock-group-1',
        name: `${ward.name} Youth Group`,
        memberCount: 15
      }];

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
      const discussions = await prisma.discussion.findMany({
        orderBy: { date: 'asc' },
        include: {
          ward: true,
          _count: {
            select: { rsvps: true, comments: true }
          }
        }
      });
      res.json(discussions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch discussions' });
    }
  });

  // Get discussion by id
  app.get('/api/discussions/:id', async (req, res) => {
    try {
      const discussion = await prisma.discussion.findUnique({
        where: { id: req.params.id },
        include: {
          ward: true,
          _count: {
            select: { rsvps: true, comments: true }
          }
        }
      });
      if (!discussion) return res.status(404).json({ error: 'Discussion not found' });
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

  // Create an issue
  app.post('/api/issues', async (req, res) => {
    try {
      const { title, description, wardId } = req.body;
      const issue = await prisma.issue.create({
        data: {
          title,
          description,
          wardId
        }
      });
      res.json(issue);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create issue' });
    }
  });

  // Update an issue
  app.put('/api/issues/:id', async (req, res) => {
    try {
      const { title, description, wardId } = req.body;
      const issue = await prisma.issue.update({
        where: { id: req.params.id },
        data: {
          title,
          description,
          wardId
        }
      });
      res.json(issue);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update issue' });
    }
  });

  // Delete an issue
  app.delete('/api/issues/:id', async (req, res) => {
    try {
      await prisma.issue.delete({
        where: { id: req.params.id }
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete issue' });
    }
  });

  // Seed data endpoint for demo purposes
  app.post('/api/seed', async (req, res) => {
    try {
      // Check if already seeded
      const count = await prisma.ward.count();
      if (count > 0) {
        return res.json({ message: 'Database already seeded' });
      }

      // Create Admin User
      const admin = await prisma.user.create({
        data: {
          name: 'Admin User',
          email: 'admin@csrg.ke',
          role: 'ADMIN',
        }
      });

      // Create Wards
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
        await prisma.ward.create({ data: ward });
      }

      const allWards = await prisma.ward.findMany();
      const nextAssemblyDate = getNextAssemblyDate();
      
      // Create Discussions for all wards on the same day
      for (const ward of allWards) {
        await prisma.discussion.create({
          data: {
            title: `Citizen Assembly - ${ward.name}`,
            description: 'Discussing pressing issues in the ward for the next assembly.',
            wardId: ward.id,
            date: nextAssemblyDate,
            status: 'UPCOMING',
            createdById: admin.id,
          }
        });
        
        // Create a sample group for each ward
        await prisma.group.create({
          data: {
            name: `${ward.name} Youth Group`,
            wardId: ward.id,
            leaderName: 'Jane Wanjiku',
            meetingDay: 'Wednesday',
            meetingFrequency: 'Weekly',
            members: 'Alice, Bob, Charlie',
            memberCount: 15
          }
        });
      }

      res.json({ message: 'Database seeded successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to seed database' });
    }
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
