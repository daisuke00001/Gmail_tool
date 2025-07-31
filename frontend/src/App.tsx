import React, { useState, useEffect } from 'react'
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Tabs,
  Tab,
  Box,
  Alert,
  Snackbar,
} from '@mui/material'
import EmailIcon from '@mui/icons-material/Email'
import PatternManagement from './components/PatternManagement'
import EmailDashboard from './components/EmailDashboard'
import ScheduleSettings from './components/ScheduleSettings'
import { apiService } from './services/api'
import { NotificationData } from './types'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

function App() {
  const [tabValue, setTabValue] = useState(0)
  const [notification, setNotification] = useState<NotificationData | null>(null)
  const [snackbarOpen, setSnackbarOpen] = useState(false)

  useEffect(() => {
    const eventSource = apiService.getNotificationStream()

    eventSource.onmessage = (event) => {
      try {
        const data: NotificationData = JSON.parse(event.data)
        setNotification(data)
        setSnackbarOpen(true)
      } catch (error) {
        console.error('Error parsing notification:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('EventSource error:', error)
    }

    return () => {
      eventSource.close()
    }
  }, [])

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handleSnackbarClose = () => {
    setSnackbarOpen(false)
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <EmailIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Gmail キャッチアップツール
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg">
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="basic tabs">
            <Tab label="メール一覧" />
            <Tab label="検索パターン設定" />
            <Tab label="スケジュール設定" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <EmailDashboard />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <PatternManagement />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <ScheduleSettings />
        </TabPanel>
      </Container>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity="info"
          sx={{ width: '100%' }}
        >
          {notification && (
            <>
              <Typography variant="subtitle2">
                新しいメールが{notification.count}件見つかりました
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                {notification.timestamp.toLocaleString('ja-JP')}
              </Typography>
            </>
          )}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default App