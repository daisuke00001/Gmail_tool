import React, { useState, useEffect } from 'react'
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Switch,
  Chip,
  Alert,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { apiService } from '../services/api'
import { UserPattern } from '../types'

const PatternManagement: React.FC = () => {
  const [patterns, setPatterns] = useState<UserPattern[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPattern, setEditingPattern] = useState<UserPattern | null>(null)
  const [formData, setFormData] = useState({ pattern: '', description: '', enabled: true })
  const [error, setError] = useState<string | null>(null)

  const loadPatterns = async () => {
    try {
      const data = await apiService.getPatterns()
      setPatterns(data)
    } catch (err) {
      setError('パターンの取得に失敗しました')
      console.error('Error loading patterns:', err)
    }
  }

  useEffect(() => {
    loadPatterns()
  }, [])

  const handleAddPattern = () => {
    setEditingPattern(null)
    setFormData({ pattern: '', description: '', enabled: true })
    setDialogOpen(true)
  }

  const handleEditPattern = (pattern: UserPattern) => {
    setEditingPattern(pattern)
    setFormData({
      pattern: pattern.pattern,
      description: pattern.description,
      enabled: pattern.enabled,
    })
    setDialogOpen(true)
  }

  const handleSavePattern = async () => {
    try {
      if (editingPattern) {
        await apiService.updatePattern(
          editingPattern.id,
          formData.pattern,
          formData.description,
          formData.enabled
        )
      } else {
        await apiService.addPattern(formData.pattern, formData.description)
      }
      setDialogOpen(false)
      await loadPatterns()
    } catch (err) {
      setError('パターンの保存に失敗しました')
      console.error('Error saving pattern:', err)
    }
  }

  const handleDeletePattern = async (id: number) => {
    if (window.confirm('このパターンを削除しますか？')) {
      try {
        await apiService.deletePattern(id)
        await loadPatterns()
      } catch (err) {
        setError('パターンの削除に失敗しました')
        console.error('Error deleting pattern:', err)
      }
    }
  }

  const handleTogglePattern = async (pattern: UserPattern) => {
    try {
      await apiService.updatePattern(
        pattern.id,
        pattern.pattern,
        pattern.description,
        !pattern.enabled
      )
      await loadPatterns()
    } catch (err) {
      setError('パターンの更新に失敗しました')
      console.error('Error toggling pattern:', err)
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          検索パターン設定
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddPattern}
        >
          パターン追加
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ width: '100%' }}>
        <List>
          {patterns.map((pattern) => (
            <ListItem key={pattern.id}>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1">
                      {pattern.description || '(説明なし)'}
                    </Typography>
                    <Chip
                      label={pattern.enabled ? '有効' : '無効'}
                      color={pattern.enabled ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', mt: 1 }}>
                      パターン: {pattern.pattern}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      作成日: {new Date(pattern.created_at).toLocaleString('ja-JP')}
                    </Typography>
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={pattern.enabled}
                  onChange={() => handleTogglePattern(pattern)}
                  color="primary"
                />
                <IconButton
                  edge="end"
                  aria-label="edit"
                  onClick={() => handleEditPattern(pattern)}
                  sx={{ mr: 1 }}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={() => handleDeletePattern(pattern.id)}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingPattern ? 'パターン編集' : 'パターン追加'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="正規表現パターン"
            fullWidth
            variant="outlined"
            value={formData.pattern}
            onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
            helperText="例: 田中|tanaka|Tanaka, 山田.*太郎"
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="説明"
            fullWidth
            variant="outlined"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            helperText="パターンの説明（任意）"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>キャンセル</Button>
          <Button
            onClick={handleSavePattern}
            variant="contained"
            disabled={!formData.pattern.trim()}
          >
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default PatternManagement