import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Card,
  CardContent,
  CardHeader,
  Tabs,
  Tab,
  Grid,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Edit,
  Delete,
  ArrowBack,
  CheckCircle,
  RadioButtonUnchecked,
  ThumbUp,
  ThumbDown,
  Comment,
  History,
  Close,
  Send,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`question-tabpanel-${index}`}
      aria-labelledby={`question-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const QuestionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [statusHistory, setStatusHistory] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [statusComment, setStatusComment] = useState('');
  const [availableStatuses, setAvailableStatuses] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [userVote, setUserVote] = useState(null);

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        setLoading(true);
        const [questionRes, historyRes, reviewsRes, commentsRes] = await Promise.all([
          api.get(`/api/questions/${id}`),
          api.get(`/api/questions/${id}/status-history`),
          api.get(`/api/questions/${id}/reviews`),
          api.get(`/api/questions/${id}/comments`),
        ]);

        setQuestion(questionRes.data);
        setStatusHistory(historyRes.data);
        setReviews(reviewsRes.data);
        setComments(commentsRes.data);

        // Fetch valid status transitions
        if (questionRes.data.statusId) {
          const statusesRes = await api.get(
            `/api/question-statuses/transitions/${questionRes.data.statusId}?role_id=${currentUser.role_id}`
          );
          setAvailableStatuses(statusesRes.data);
        }

        // Check if user has voted
        try {
          const voteRes = await api.get(`/api/questions/${id}/vote`);
          setUserVote(voteRes.data.voteType);
        } catch (error) {
          // User hasn't voted yet
          setUserVote(null);
        }
      } catch (error) {
        console.error('Error fetching question details:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load question details',
          severity: 'error',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchQuestion();
  }, [id, currentUser.role_id]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/questions/${id}`);
      setSnackbar({
        open: true,
        message: 'Question deleted successfully',
        severity: 'success',
      });
      navigate('/questions');
    } catch (error) {
      console.error('Error deleting question:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete question',
        severity: 'error',
      });
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const handleStatusChange = async () => {
    try {
      await api.post(`/api/questions/${id}/status`, {
        to_status_id: selectedStatus,
        comments: statusComment,
      });

      // Refresh question and history
      const [questionRes, historyRes] = await Promise.all([
        api.get(`/api/questions/${id}`),
        api.get(`/api/questions/${id}/status-history`),
      ]);

      setQuestion(questionRes.data);
      setStatusHistory(historyRes.data);
      setStatusDialogOpen(false);
      setSelectedStatus('');
      setStatusComment('');

      setSnackbar({
        open: true,
        message: 'Status updated successfully',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error updating status:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update status',
        severity: 'error',
      });
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim()) return;

    try {
      const response = await api.post(`/api/questions/${id}/comments`, {
        content: comment,
      });

      setComments([...comments, response.data]);
      setComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
      setSnackbar({
        open: true,
        message: 'Failed to add comment',
        severity: 'error',
      });
    }
  };

  const handleVote = async (voteType) => {
    try {
      if (userVote === voteType) {
        // Remove vote if clicking the same button
        await api.delete(`/api/questions/${id}/vote`);
        setUserVote(null);
        
        // Update question vote count
        setQuestion(prev => ({
          ...prev,
          upvotes: voteType === 'up' ? prev.upvotes - 1 : prev.upvotes,
          downvotes: voteType === 'down' ? prev.downvotes - 1 : prev.downvotes
        }));
      } else {
        // Add or change vote
        await api.post(`/api/questions/${id}/vote`, { voteType });
        
        // Update question vote count and user's vote
        setQuestion(prev => {
          const newUpvotes = voteType === 'up' 
            ? (userVote === 'down' ? prev.upvotes + 2 : prev.upvotes + 1)
            : (prev.upvotes - (userVote === 'up' ? 1 : 0));
            
          const newDownvotes = voteType === 'down'
            ? (userVote === 'up' ? prev.downvotes + 2 : prev.downvotes + 1)
            : (prev.downvotes - (userVote === 'down' ? 1 : 0));
            
          return {
            ...prev,
            upvotes: Math.max(0, newUpvotes),
            downvotes: Math.max(0, newDownvotes)
          };
        });
        
        setUserVote(voteType);
      }
    } catch (error) {
      console.error('Error updating vote:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update vote',
        severity: 'error',
      });
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!question) {
    return (
      <Box p={3}>
        <Typography variant="h5" color="error">
          Question not found
        </Typography>
      </Box>
    );
  }

  const difficultyColors = {
    easy: 'success',
    medium: 'warning',
    hard: 'error',
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/questions')}
          sx={{ mr: 2 }}
        >
          Back to Questions
        </Button>
        
        <Box>
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={() => navigate(`/questions/edit/${id}`)}
            sx={{ mr: 1 }}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<Delete />}
            onClick={() => setDeleteDialogOpen(true)}
          >
            Delete
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="h4" component="h1" gutterBottom>
                  {question.questionText}
                </Typography>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  <Chip
                    label={question.type.replace('_', ' ')}
                    color="primary"
                    variant="outlined"
                    size="small"
                  />
                  <Chip
                    label={question.difficulty}
                    color={difficultyColors[question.difficulty] || 'default'}
                    size="small"
                  />
                  <Chip
                    label={question.category?.name || 'Uncategorized'}
                    variant="outlined"
                    size="small"
                  />
                  <Chip
                    label={question.status?.name || 'Draft'}
                    color={question.status?.isActive ? 'primary' : 'default'}
                    variant="filled"
                    size="small"
                  />
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <IconButton 
                    color={userVote === 'up' ? 'primary' : 'default'}
                    onClick={() => handleVote('up')}
                    aria-label="Upvote"
                  >
                    <ThumbUp />
                  </IconButton>
                  <Typography variant="body1" sx={{ mx: 1 }}>
                    {question.upvotes || 0}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <IconButton 
                    color={userVote === 'down' ? 'error' : 'default'}
                    onClick={() => handleVote('down')}
                    aria-label="Downvote"
                  >
                    <ThumbDown />
                  </IconButton>
                  <Typography variant="body1" sx={{ mx: 1 }}>
                    {question.downvotes || 0}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            {question.explanation && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Explanation
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                  {question.explanation}
                </Typography>
              </Box>
            )}

            {question.options && question.options.length > 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Options
                </Typography>
                <List>
                  {question.options.map((option, index) => (
                    <Card
                      key={index}
                      variant="outlined"
                      sx={{
                        mb: 1,
                        borderLeft: option.isCorrect ? '4px solid #4caf50' : '4px solid transparent',
                      }}
                    >
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          {option.isCorrect ? (
                            <CheckCircle color="success" />
                          ) : (
                            <RadioButtonUnchecked />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={option.text}
                          secondary={option.explanation}
                          primaryTypographyProps={{
                            color: option.isCorrect ? 'text.primary' : 'text.secondary',
                            fontWeight: option.isCorrect ? 'medium' : 'regular',
                          }}
                        />
                      </ListItem>
                    </Card>
                  ))}
                </List>
              </Box>
            )}
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label="question details tabs"
              sx={{ mb: 2 }}
            >
              <Tab label="Comments" icon={<Comment />} iconPosition="start" />
              <Tab label="Status History" icon={<History />} iconPosition="start" />
              <Tab label="Reviews" icon={<ThumbUp />} iconPosition="start" />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  variant="outlined"
                  placeholder="Add a comment..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  sx={{ mb: 1 }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleAddComment}
                    disabled={!comment.trim()}
                    startIcon={<Send />}
                  >
                    Post Comment
                  </Button>
                </Box>
              </Box>

              <List>
                {comments.length > 0 ? (
                  comments.map((comment) => (
                    <Card key={comment.id} variant="outlined" sx={{ mb: 2 }}>
                      <CardHeader
                        title={comment.user?.name || 'Anonymous'}
                        subheader={format(new Date(comment.createdAt), 'PPpp')}
                        action={
                          comment.userId === currentUser.user_id && (
                            <IconButton size="small" color="error">
                              <Close fontSize="small" />
                            </IconButton>
                          )
                        }
                        sx={{ pb: 0 }}
                      />
                      <CardContent sx={{ pt: 1 }}>
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                          {comment.content}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                    No comments yet. Be the first to comment!
                  </Typography>
                )}
              </List>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <List>
                {statusHistory.length > 0 ? (
                  statusHistory.map((history, index) => (
                    <Box key={index} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>
                          {history.changed_by?.name || 'System'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                          {format(new Date(history.changed_at), 'PPpp')}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Chip
                          label={history.from_status?.name || 'Draft'}
                          size="small"
                          variant="outlined"
                          sx={{ mr: 1 }}
                        />
                        <Typography variant="body2" sx={{ mx: 1 }}>→</Typography>
                        <Chip
                          label={history.to_status?.name || 'Draft'}
                          color="primary"
                          size="small"
                        />
                      </Box>
                      {history.comments && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, ml: 1 }}>
                          {history.comments}
                        </Typography>
                      )}
                      {index < statusHistory.length - 1 && <Divider sx={{ mt: 2 }} />}
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                    No status history available
                  </Typography>
                )}
              </List>
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <List>
                {reviews.length > 0 ? (
                  reviews.map((review) => (
                    <Card key={review.id} variant="outlined" sx={{ mb: 2 }}>
                      <CardHeader
                        title={review.reviewed_by?.name || 'Anonymous'}
                        subheader={format(new Date(review.reviewed_at), 'PPpp')}
                        action={
                          <Chip
                            label={review.status}
                            color={
                              review.status === 'approved'
                                ? 'success'
                                : review.status === 'rejected'
                                ? 'error'
                                : 'default'
                            }
                            size="small"
                          />
                        }
                        sx={{ pb: 0 }}
                      />
                      <CardContent sx={{ pt: 1 }}>
                        {review.comments && (
                          <Typography variant="body2" sx={{ mb: 1, whiteSpace: 'pre-line' }}>
                            {review.comments}
                          </Typography>
                        )}
                        {review.rating !== null && (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                              Rating:
                            </Typography>
                            <Box sx={{ display: 'flex' }}>
                              {[...Array(5)].map((_, i) => (
                                <Box key={i} color={i < review.rating ? 'gold' : 'action.disabled'}>
                                  ★
                                </Box>
                              ))}
                            </Box>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                    No reviews yet
                  </Typography>
                )}
              </List>
            </TabPanel>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, position: 'sticky', top: 20 }}>
            <Typography variant="h6" gutterBottom>
              Question Details
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Created By
              </Typography>
              <Typography variant="body1">
                {question.createdBy?.name || 'Unknown'}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Created At
              </Typography>
              <Typography variant="body1">
                {format(new Date(question.createdAt), 'PPpp')}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Last Updated
              </Typography>
              <Typography variant="body1">
                {format(new Date(question.updatedAt), 'PPpp')}
              </Typography>
            </Box>

            {question.tags && question.tags.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Tags
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {question.tags.map((tag) => (
                    <Chip
                      key={tag.id}
                      label={tag.name}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            )}

            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={() => setStatusDialogOpen(true)}
              disabled={availableStatuses.length === 0}
              sx={{ mt: 2 }}
            >
              Change Status
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Question</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this question? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Change Question Status</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal" required>
            <InputLabel>New Status</InputLabel>
            <Select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              label="New Status"
            >
              {availableStatuses.map((status) => (
                <MenuItem key={status.id} value={status.id}>
                  {status.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Comments"
            placeholder="Add any comments about this status change..."
            value={statusComment}
            onChange={(e) => setStatusComment(e.target.value)}
            margin="normal"
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleStatusChange}
            color="primary"
            variant="contained"
            disabled={!selectedStatus}
          >
            Update Status
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default QuestionDetail;
