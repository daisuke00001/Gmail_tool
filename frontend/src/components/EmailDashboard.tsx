import React, { useState, useEffect } from 'react'
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  Box,
  Button,
  CircularProgress,
  Divider,
  Alert,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import EmailIcon from '@mui/icons-material/Email'
import { apiService } from '../services/api'
import { EmailLog } from '../types'

const EmailDashboard: React.FC = () => {
  const [emails, setEmails] = useState<EmailLog[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadEmails = async () => {
    try {
      setLoading(true)
      setError(null)
      const emailData = await apiService.getRecentEmails()
      setEmails(emailData)
    } catch (err) {
      setError('メールの取得に失敗しました')
      console.error('Error loading emails:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleManualCheck = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await apiService.manualEmailCheck()
      setEmails(result.emails)
    } catch (err) {
      setError('手動チェックに失敗しました')
      console.error('Error in manual check:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEmails()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP')
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          メール一覧
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadEmails}
            disabled={loading}
            sx={{ mr: 1 }}
          >
            更新
          </Button>
          <Button
            variant="contained"
            startIcon={<EmailIcon />}
            onClick={handleManualCheck}
            disabled={loading}
          >
            手動チェック
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ width: '100%' }}>
          {emails.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="textSecondary">
                まだキャッチしたメールがありません
              </Typography>
            </Box>
          ) : (
            <List>
              {emails.map((email, index) => (
                <React.Fragment key={email.id}>
                  <ListItem alignItems="flex-start">
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="subtitle1" component="span">
                            {email.subject || '(件名なし)'}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {formatDate(email.received_at)}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                            送信者: {email.sender}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            {email.body_snippet}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {email.matched_patterns.map((pattern) => (
                              <Chip
                                key={pattern.id}
                                label={pattern.description || pattern.pattern}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            ))}
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < emails.length - 1 && <Divider variant="inset" component="li" />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Paper>
      )}
    </Box>
  )
}

export default EmailDashboard