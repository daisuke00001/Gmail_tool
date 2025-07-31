import React, { useState, useEffect } from 'react'
import {
  Paper,
  Typography,
  Box,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Alert,
  Grid,
  Card,
  CardContent,
  Chip,
} from '@mui/material'
import ScheduleIcon from '@mui/icons-material/Schedule'
import NotificationsIcon from '@mui/icons-material/Notifications'
import SaveIcon from '@mui/icons-material/Save'
import { apiService } from '../services/api'
import { ScheduleSettings as ScheduleSettingsType } from '../types'

const ScheduleSettings: React.FC = () => {
  const [settings, setSettings] = useState<ScheduleSettingsType | null>(null)
  const [activeSchedules, setActiveSchedules] = useState<any[]>([])
  const [formData, setFormData] = useState({
    startTime: '09:00',
    intervalHours: 1,
    enabled: true,
    notificationEnabled: true,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const loadSettings = async () => {
    try {
      const data = await apiService.getScheduleSettings()
      setSettings(data.settings)
      setActiveSchedules(data.activeSchedules)
      
      if (data.settings) {
        setFormData({
          startTime: data.settings.start_time,
          intervalHours: data.settings.interval_hours,
          enabled: data.settings.enabled,
          notificationEnabled: data.settings.notification_enabled,
        })
      }
    } catch (err) {
      setError('設定の取得に失敗しました')
      console.error('Error loading settings:', err)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  const handleSave = async () => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      const result = await apiService.updateScheduleSettings(
        formData.startTime,
        formData.intervalHours,
        formData.enabled,
        formData.notificationEnabled
      )

      if (result.success) {
        setSuccess('設定を保存しました')
        await loadSettings()
      } else {
        setError(result.message || '設定の保存に失敗しました')
      }
    } catch (err) {
      setError('設定の保存に失敗しました')
      console.error('Error saving settings:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatNextInvocation = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP')
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        スケジュール設定
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
              <ScheduleIcon sx={{ mr: 1 }} />
              基本設定
            </Typography>

            <Box sx={{ mb: 3 }}>
              <TextField
                label="開始時刻"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
                helperText="メール監視を開始する時刻"
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <TextField
                label="間隔（時間）"
                type="number"
                value={formData.intervalHours}
                onChange={(e) => setFormData({ ...formData, intervalHours: parseInt(e.target.value) })}
                fullWidth
                inputProps={{ min: 1, max: 24 }}
                helperText="メール監視の間隔（1-24時間）"
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.enabled}
                    onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  />
                }
                label="スケジュール監視を有効にする"
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.notificationEnabled}
                    onChange={(e) => setFormData({ ...formData, notificationEnabled: e.target.checked })}
                  />
                }
                label="通知を有効にする"
              />
            </Box>

            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={loading}
              fullWidth
            >
              設定を保存
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
              <NotificationsIcon sx={{ mr: 1 }} />
              現在のステータス
            </Typography>

            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" color="textSecondary">
                  監視状態
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Chip
                    label={formData.enabled ? '有効' : '無効'}
                    color={formData.enabled ? 'success' : 'default'}
                  />
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" color="textSecondary">
                  監視間隔
                </Typography>
                <Typography variant="body1" sx={{ mt: 1 }}>
                  {formData.startTime} から {formData.intervalHours} 時間おき
                </Typography>
              </CardContent>
            </Card>

            {activeSchedules.length > 0 && (
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="textSecondary">
                    次回実行予定
                  </Typography>
                  {activeSchedules.map((schedule, index) => (
                    <Typography key={index} variant="body1" sx={{ mt: 1 }}>
                      {schedule.nextInvocation ? 
                        formatNextInvocation(schedule.nextInvocation) : 
                        '設定されていません'
                      }
                    </Typography>
                  ))}
                </CardContent>
              </Card>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

export default ScheduleSettings