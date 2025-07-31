const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

class GmailService {
  constructor() {
    this.auth = null;
    this.gmail = null;
    this.credentialsPath = path.join(__dirname, '../config/credentials.json');
    this.tokenPath = path.join(__dirname, '../config/token.json');
  }

  async authenticate() {
    try {
      const credentials = JSON.parse(fs.readFileSync(this.credentialsPath));
      const { client_secret, client_id, redirect_uris } = credentials.web;
      
      this.auth = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
      
      if (fs.existsSync(this.tokenPath)) {
        const token = JSON.parse(fs.readFileSync(this.tokenPath));
        this.auth.setCredentials(token);
      } else {
        throw new Error('Token file not found. Please run authentication first.');
      }
      
      this.gmail = google.gmail({ version: 'v1', auth: this.auth });
      console.log('Gmail API authentication successful');
      
    } catch (error) {
      console.error('Authentication failed:', error.message);
      throw error;
    }
  }

  async getRecentEmails(hoursBack = 1) {
    try {
      if (!this.gmail) {
        await this.authenticate();
      }

      const oneHourAgo = new Date(Date.now() - (hoursBack * 60 * 60 * 1000));
      const query = `after:${Math.floor(oneHourAgo.getTime() / 1000)}`;

      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: 100
      });

      if (!response.data.messages) {
        return [];
      }

      const emails = await Promise.all(
        response.data.messages.map(async (message) => {
          const detail = await this.gmail.users.messages.get({
            userId: 'me',
            id: message.id,
            format: 'full'
          });
          return this.parseEmailData(detail.data);
        })
      );

      return emails;
    } catch (error) {
      console.error('Error fetching emails:', error.message);
      throw error;
    }
  }

  parseEmailData(emailData) {
    const headers = emailData.payload.headers;
    const getHeader = (name) => {
      const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
      return header ? header.value : '';
    };

    let body = '';
    if (emailData.payload.body && emailData.payload.body.data) {
      body = Buffer.from(emailData.payload.body.data, 'base64').toString();
    } else if (emailData.payload.parts) {
      const textPart = emailData.payload.parts.find(part => 
        part.mimeType === 'text/plain' || part.mimeType === 'text/html'
      );
      if (textPart && textPart.body && textPart.body.data) {
        body = Buffer.from(textPart.body.data, 'base64').toString();
      }
    }

    return {
      id: emailData.id,
      threadId: emailData.threadId,
      subject: getHeader('Subject'),
      from: getHeader('From'),
      to: getHeader('To'),
      date: getHeader('Date'),
      body: body.replace(/<[^>]*>/g, '').substring(0, 1000),
      snippet: emailData.snippet || '',
      timestamp: new Date(parseInt(emailData.internalDate))
    };
  }

  searchEmailsByUserNames(emails, userNamePatterns) {
    return emails.filter(email => {
      const searchText = `${email.subject} ${email.from} ${email.body}`.toLowerCase();
      
      return userNamePatterns.some(pattern => {
        try {
          const regex = new RegExp(pattern.pattern, 'i');
          return regex.test(searchText);
        } catch (error) {
          console.error(`Invalid regex pattern: ${pattern.pattern}`, error);
          return false;
        }
      });
    });
  }

  async generateAuthUrl() {
    if (!this.auth) {
      const credentials = JSON.parse(fs.readFileSync(this.credentialsPath));
      const { client_secret, client_id, redirect_uris } = credentials.web;
      this.auth = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    }

    const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
    
    return this.auth.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });
  }

  async saveToken(code) {
    try {
      const { tokens } = await this.auth.getToken(code);
      this.auth.setCredentials(tokens);
      
      fs.writeFileSync(this.tokenPath, JSON.stringify(tokens));
      console.log('Token saved successfully');
      
      return tokens;
    } catch (error) {
      console.error('Error saving token:', error.message);
      throw error;
    }
  }
}

module.exports = GmailService;