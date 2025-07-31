const schedule = require('node-schedule');
const GmailService = require('./gmailService');
const Database = require('./database');

class EmailScheduler {
  constructor() {
    this.gmailService = new GmailService();
    this.database = new Database();
    this.activeJobs = new Map();
    this.notificationCallbacks = [];
  }

  async initialize() {
    await this.database.connect();
    await this.gmailService.authenticate();
    await this.setupScheduleFromDatabase();
  }

  async setupScheduleFromDatabase() {
    try {
      const settings = await this.database.getScheduleSettings();
      if (settings && settings.enabled) {
        await this.startSchedule(settings.start_time, settings.interval_hours);
      }
    } catch (error) {
      console.error('Error setting up schedule from database:', error);
    }
  }

  async startSchedule(startTime = '09:00', intervalHours = 1) {
    this.stopAllSchedules();

    const [hour, minute] = startTime.split(':').map(Number);
    
    const rule = new schedule.RecurrenceRule();
    rule.minute = minute;
    
    const hours = [];
    for (let h = hour; h < 24; h += intervalHours) {
      hours.push(h);
    }
    rule.hour = hours;

    const job = schedule.scheduleJob(rule, () => {
      this.executeEmailCheck();
    });

    this.activeJobs.set('main_schedule', job);
    console.log(`Email checking scheduled: Start ${startTime}, every ${intervalHours} hour(s)`);
  }

  async executeEmailCheck() {
    try {
      console.log('Executing scheduled email check...');
      
      const userPatterns = await this.database.getUserPatterns();
      if (userPatterns.length === 0) {
        console.log('No user patterns configured, skipping check');
        return;
      }

      const recentEmails = await this.gmailService.getRecentEmails(1);
      console.log(`Found ${recentEmails.length} emails in the last hour`);

      if (recentEmails.length === 0) {
        console.log('No new emails found, no notification needed');
        return;
      }

      const matchedEmails = this.gmailService.searchEmailsByUserNames(recentEmails, userPatterns);
      console.log(`Found ${matchedEmails.length} emails matching user patterns`);

      if (matchedEmails.length === 0) {
        console.log('No emails matching user patterns, no notification needed');
        return;
      }

      for (const email of matchedEmails) {
        const matchedPatterns = this.getMatchedPatterns(email, userPatterns);
        await this.database.logEmail(email, matchedPatterns);
      }

      const scheduleSettings = await this.database.getScheduleSettings();
      if (scheduleSettings && scheduleSettings.notification_enabled) {
        this.sendNotification({
          type: 'email_match',
          count: matchedEmails.length,
          emails: matchedEmails.slice(0, 5),
          timestamp: new Date()
        });
      }

    } catch (error) {
      console.error('Error during scheduled email check:', error);
    }
  }

  getMatchedPatterns(email, userPatterns) {
    const searchText = `${email.subject} ${email.from} ${email.body}`.toLowerCase();
    const matched = [];

    userPatterns.forEach(pattern => {
      try {
        const regex = new RegExp(pattern.pattern, 'i');
        if (regex.test(searchText)) {
          matched.push({
            id: pattern.id,
            pattern: pattern.pattern,
            description: pattern.description
          });
        }
      } catch (error) {
        console.error(`Invalid regex pattern: ${pattern.pattern}`, error);
      }
    });

    return matched;
  }

  sendNotification(data) {
    console.log('📧 Email Notification:', {
      message: `${data.count}件の新しいメールが見つかりました`,
      timestamp: data.timestamp.toLocaleString('ja-JP'),
      emails: data.emails.map(email => ({
        subject: email.subject,
        from: email.from,
        snippet: email.snippet
      }))
    });

    this.notificationCallbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in notification callback:', error);
      }
    });
  }

  onNotification(callback) {
    this.notificationCallbacks.push(callback);
  }

  removeNotificationCallback(callback) {
    const index = this.notificationCallbacks.indexOf(callback);
    if (index > -1) {
      this.notificationCallbacks.splice(index, 1);
    }
  }

  async manualCheck() {
    console.log('Manual email check triggered');
    await this.executeEmailCheck();
    return await this.database.getRecentEmailLogs(20);
  }

  stopAllSchedules() {
    this.activeJobs.forEach((job, name) => {
      if (job) {
        job.cancel();
        console.log(`Cancelled schedule: ${name}`);
      }
    });
    this.activeJobs.clear();
  }

  getActiveSchedules() {
    const schedules = [];
    this.activeJobs.forEach((job, name) => {
      if (job) {
        schedules.push({
          name,
          nextInvocation: job.nextInvocation()
        });
      }
    });
    return schedules;
  }

  async updateSchedule(startTime, intervalHours, enabled, notificationEnabled) {
    try {
      await this.database.updateScheduleSettings(startTime, intervalHours, enabled, notificationEnabled);
      
      if (enabled) {
        await this.startSchedule(startTime, intervalHours);
      } else {
        this.stopAllSchedules();
      }

      return { success: true, message: 'Schedule updated successfully' };
    } catch (error) {
      console.error('Error updating schedule:', error);
      return { success: false, message: error.message };
    }
  }

  shutdown() {
    this.stopAllSchedules();
    this.database.close();
  }
}

module.exports = EmailScheduler;