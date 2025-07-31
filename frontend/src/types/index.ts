export interface UserPattern {
  id: number;
  pattern: string;
  description: string;
  enabled: boolean;
  created_at: string;
}

export interface EmailLog {
  id: number;
  email_id: string;
  subject: string;
  sender: string;
  body_snippet: string;
  matched_patterns: MatchedPattern[];
  received_at: string;
  logged_at: string;
}

export interface MatchedPattern {
  id: number;
  pattern: string;
  description: string;
}

export interface ScheduleSettings {
  id: number;
  start_time: string;
  interval_hours: number;
  enabled: boolean;
  notification_enabled: boolean;
  updated_at: string;
}

export interface NotificationData {
  type: 'email_match';
  count: number;
  emails: EmailPreview[];
  timestamp: Date;
}

export interface EmailPreview {
  subject: string;
  from: string;
  snippet: string;
}