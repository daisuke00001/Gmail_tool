const express = require('express');
const cors = require('cors');
require('dotenv').config();

const GmailService = require('./gmailService');
const Database = require('./database');
const EmailScheduler = require('./scheduler');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const gmailService = new GmailService();
const database = new Database();
const scheduler = new EmailScheduler();

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

app.get('/api/auth/url', async (req, res) => {
  try {
    const authUrl = await gmailService.generateAuthUrl();
    res.json({ authUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/token', async (req, res) => {
  try {
    const { code } = req.body;
    const tokens = await gmailService.saveToken(code);
    res.json({ success: true, tokens });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/patterns', async (req, res) => {
  try {
    await database.connect();
    const patterns = await database.getUserPatterns();
    res.json(patterns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/patterns', async (req, res) => {
  try {
    const { pattern, description } = req.body;
    if (!pattern) {
      return res.status(400).json({ error: 'Pattern is required' });
    }
    
    await database.connect();
    const result = await database.addUserPattern(pattern, description);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/patterns/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { pattern, description, enabled } = req.body;
    
    await database.connect();
    const result = await database.updateUserPattern(id, pattern, description, enabled);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/patterns/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await database.connect();
    const result = await database.deleteUserPattern(id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/emails/recent', async (req, res) => {
  try {
    await database.connect();
    const emails = await database.getRecentEmailLogs();
    res.json(emails);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/emails/check', async (req, res) => {
  try {
    const result = await scheduler.manualCheck();
    res.json({ 
      success: true, 
      message: 'Manual check completed',
      emails: result 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/schedule', async (req, res) => {
  try {
    await database.connect();
    const settings = await database.getScheduleSettings();
    const activeSchedules = scheduler.getActiveSchedules();
    
    res.json({
      settings,
      activeSchedules
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/schedule', async (req, res) => {
  try {
    const { startTime, intervalHours, enabled, notificationEnabled } = req.body;
    
    const result = await scheduler.updateSchedule(
      startTime, 
      intervalHours, 
      enabled, 
      notificationEnabled
    );
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/notifications/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  const notificationCallback = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  scheduler.onNotification(notificationCallback);

  req.on('close', () => {
    scheduler.removeNotificationCallback(notificationCallback);
  });
});

async function startServer() {
  try {
    await database.connect();
    await scheduler.initialize();
    
    app.listen(PORT, () => {
      console.log(`🚀 Gmail Catchup Tool API Server running on port ${PORT}`);
      console.log(`📧 Email monitoring system initialized`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  scheduler.shutdown();
  database.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  scheduler.shutdown();
  database.close();
  process.exit(0);
});

startServer();