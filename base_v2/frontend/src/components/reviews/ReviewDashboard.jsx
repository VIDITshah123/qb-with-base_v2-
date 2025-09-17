import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  CardHeader,
  Tabs,
  Tab,
  Button,
  Chip,
  Avatar,
  Divider,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Badge
} from '@mui/material';
import { 
  ThumbUp, 
  ThumbDown, 
  Comment, 
  CheckCircle, 
  Cancel, 
  Edit, 
  Delete, 
  Search, 
  FilterList, 
  Refresh,
  PendingActions,
  TaskAlt,
  Flag
} from '@mui/icons-material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { useAuth } from '../../contexts/AuthContext';
import { useQuestions } from '../../contexts/QuestionContext';
import { formatDate, getDifficultyColor } from '../../utils/questionUtils';

const ReviewDashboard = () => {
  const { currentUser } = useAuth();
  const { 
    questions, 
    loading, 
    fetchQuestions, 
    updateQuestionStatus,
    voteQuestion,
    getQuestionStatusHistory,
    addComment,
    getComments
  } = useQuestions();

  const [tabValue, setTabValue] = useState('pending');
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [statusHistory, setStatusHistory] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    difficulty: '',
    status: 'pending_review'
  });

  // Status counts for the summary cards
  const statusCounts = {
    pending: questions.filter(q => q.status === 'pending_review').length,
    approved: questions.filter(q => q.status === 'approved').length,
    rejected: questions.filter(q => q.status === 'rejected').length,
    needs_revision: questions.filter(q => q.status === 'needs_revision').length
  };

  // Load questions on component mount and when filters change
  useEffect(() => {
    fetchQuestions({
      ...filters,
      companyId: currentUser?.company_id,
      includeDetails: true
    });
  }, [filters, currentUser]);

  // Handle status change for a question
  const handleStatusChange = async (questionId, newStatus, comment = '') => {
    try {
      await updateQuestionStatus(questionId, {
        status: newStatus,
        comment,
        updatedBy: currentUser.id
      });
      
      // Refresh the questions list
      fetchQuestions({
        ...filters,
        companyId: currentUser?.company_id
      });
      
      // If there's a selected question, update its status
      if (selectedQuestion?.id === questionId) {
        setSelectedQuestion(prev => ({
          ...prev,
          status: newStatus
        }));
      }
    } catch (error) {
      console.error('Error updating question status:', error);
    }
  };

  // Handle voting on a question
  const handleVote = async (questionId, voteType) => {
    try {
      await voteQuestion(questionId, voteType);
      
      // Refresh the questions list
      fetchQuestions({
        ...filters,
        companyId: currentUser?.company_id
      });
    } catch (error) {
      console.error('Error voting on question:', error);
    }
  };

  // Load status history for the selected question
  const loadStatusHistory = async (questionId) => {
    try {
      const history = await getQuestionStatusHistory(questionId);
      setStatusHistory(history);
    } catch (error) {
      console.error('Error loading status history:', error);
    }
  };

  // Load comments for the selected question
  const loadComments = async (questionId) => {
    try {
      const commentList = await getComments(questionId);
      setComments(commentList);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  // Handle adding a new comment
  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedQuestion) return;
    
    try {
      await addComment(selectedQuestion.id, newComment);
      setNewComment('');
      loadComments(selectedQuestion.id);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setFilters(prev => ({
      ...prev,
      status: newValue === 'pending' ? 'pending_review' : newValue
    }));
  };

  // Handle row click to show question details
  const handleRowClick = (params) => {
    setSelectedQuestion(params.row);
    loadStatusHistory(params.row.id);
    loadComments(params.row.id);
  };

  // Columns for the questions data grid
  const columns = [
    { 
      field: 'questionText', 
      headerName: 'Question', 
      flex: 1,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" noWrap>
            {params.row.questionText}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
            <Chip 
              size="small" 
              label={params.row.difficulty} 
              color={getDifficultyColor(params.row.difficulty)}
              variant="outlined"
            />
            <Chip 
              size="small" 
              label={params.row.type} 
              variant="outlined"
            />
          </Box>
        </Box>
      )
    },
    { 
      field: 'category', 
      headerName: 'Category', 
      width: 150,
      valueGetter: (params) => params.row.category?.name || 'Uncategorized'
    },
    { 
      field: 'createdBy', 
      headerName: 'Author', 
      width: 150,
      valueGetter: (params) => params.row.createdBy?.name || 'Unknown'
    },
    { 
      field: 'createdAt', 
      headerName: 'Submitted', 
      width: 120,
      valueFormatter: (params) => formatDate(params.value, true)
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Approve">
            <IconButton 
              size="small" 
              color="success"
              onClick={(e) => {
                e.stopPropagation();
                handleStatusChange(params.row.id, 'approved');
              }}
            >
              <CheckCircle fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Request Changes">
            <IconButton 
              size="small" 
              color="warning"
              onClick={(e) => {
                e.stopPropagation();
                handleStatusChange(params.row.id, 'needs_revision');
              }}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Reject">
            <IconButton 
              size="small" 
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                handleStatusChange(params.row.id, 'rejected');
              }}
            >
              <Cancel fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" component="h1">
          Question Review Dashboard
        </Typography>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<Refresh />}
            onClick={() => fetchQuestions({ ...filters, companyId: currentUser?.company_id })}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Status Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>Pending Review</Typography>
                  <Typography variant="h4">{statusCounts.pending}</Typography>
                </Box>
                <PendingActions color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>Approved</Typography>
                  <Typography variant="h4">{statusCounts.approved}</Typography>
                </Box>
                <TaskAlt color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>Needs Revision</Typography>
                  <Typography variant="h4">{statusCounts.needs_revision}</Typography>
                </Box>
                <Edit color="warning" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>Rejected</Typography>
                  <Typography variant="h4">{statusCounts.rejected}</Typography>
                </Box>
                <Flag color="error" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Questions List */}
        <Grid item xs={12} md={selectedQuestion ? 7 : 12}>
          <Paper sx={{ p: 2, height: 'calc(100vh - 300px)' }}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange} 
                textColor="primary"
                indicatorColor="primary"
              >
                <Tab 
                  value="pending" 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Badge badgeContent={statusCounts.pending} color="primary">
                        <span>Pending Review</span>
                      </Badge>
                    </Box>
                  } 
                />
                <Tab 
                  value="approved" 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Badge badgeContent={statusCounts.approved} color="success">
                        <span>Approved</span>
                      </Badge>
                    </Box>
                  } 
                />
                <Tab 
                  value="needs_revision" 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Badge badgeContent={statusCounts.needs_revision} color="warning">
                        <span>Needs Revision</span>
                      </Badge>
                    </Box>
                  } 
                />
                <Tab 
                  value="rejected" 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Badge badgeContent={statusCounts.rejected} color="error">
                        <span>Rejected</span>
                      </Badge>
                    </Box>
                  } 
                />
              </Tabs>
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  size="small"
                  placeholder="Search questions..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                />
                <Button 
                  variant="outlined" 
                  startIcon={<FilterList />}
                  onClick={() => {/* TODO: Implement advanced filters */}}
                >
                  Filters
                </Button>
              </Box>
            </Box>

            <DataGrid
              rows={questions}
              columns={columns}
              loading={loading}
              onRowClick={handleRowClick}
              components={{
                Toolbar: GridToolbar,
              }}
              disableSelectionOnClick
              rowHeight={80}
              sx={{
                '& .MuiDataGrid-row': {
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                },
                '& .MuiDataGrid-cell:focus': {
                  outline: 'none',
                },
              }}
            />
          </Paper>
        </Grid>

        {/* Question Details Panel */}
        {selectedQuestion && (
          <Grid item xs={12} md={5}>
            <Paper sx={{ p: 2, height: 'calc(100vh - 300px)', overflowY: 'auto' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Question Details</Typography>
                <Chip 
                  label={selectedQuestion.status.replace('_', ' ')}
                  color={
                    selectedQuestion.status === 'approved' ? 'success' :
                    selectedQuestion.status === 'rejected' ? 'error' :
                    selectedQuestion.status === 'needs_revision' ? 'warning' : 'default'
                  }
                  size="small"
                />
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="textSecondary">Question</Typography>
                <Typography paragraph>{selectedQuestion.questionText}</Typography>
                
                {selectedQuestion.options && selectedQuestion.options.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                      Options
                    </Typography>
                    {selectedQuestion.options.map((option, index) => (
                      <Box 
                        key={option.id || index} 
                        sx={{ 
                          p: 1, 
                          mb: 1, 
                          borderRadius: 1,
                          backgroundColor: option.isCorrect ? 'success.light' : 'background.paper',
                          border: '1px solid',
                          borderColor: 'divider'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box sx={{ mr: 1 }}>{String.fromCharCode(65 + index)}.</Box>
                          <Box sx={{ flex: 1 }}>{option.text}</Box>
                          {option.isCorrect && (
                            <CheckCircle color="success" fontSize="small" />
                          )}
                        </Box>
                        {option.explanation && (
                          <Typography variant="caption" color="textSecondary" sx={{ ml: 3, display: 'block' }}>
                            {option.explanation}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                )}
                
                {selectedQuestion.explanation && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="textSecondary">Explanation</Typography>
                    <Typography>{selectedQuestion.explanation}</Typography>
                  </Box>
                )}
                
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="textSecondary">Type</Typography>
                    <Typography>{selectedQuestion.type}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="textSecondary">Difficulty</Typography>
                    <Typography>{selectedQuestion.difficulty}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="textSecondary">Category</Typography>
                    <Typography>{selectedQuestion.category?.name || 'Uncategorized'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="textSecondary">Author</Typography>
                    <Typography>{selectedQuestion.createdBy?.name || 'Unknown'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="textSecondary">Created</Typography>
                    <Typography>{formatDate(selectedQuestion.createdAt)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="textSecondary">Last Updated</Typography>
                    <Typography>{formatDate(selectedQuestion.updatedAt)}</Typography>
                  </Grid>
                </Grid>
                
                {/* Voting */}
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle2" color="textSecondary">Votes:</Typography>
                  <Tooltip title="Upvote">
                    <IconButton 
                      size="small" 
                      color={selectedQuestion.userVote === 'up' ? 'primary' : 'default'}
                      onClick={() => handleVote(selectedQuestion.id, 'up')}
                    >
                      <ThumbUp fontSize="small" />
                      <Typography variant="body2" sx={{ ml: 0.5 }}>
                        {selectedQuestion.upvotes || 0}
                      </Typography>
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Downvote">
                    <IconButton 
                      size="small" 
                      color={selectedQuestion.userVote === 'down' ? 'error' : 'default'}
                      onClick={() => handleVote(selectedQuestion.id, 'down')}
                    >
                      <ThumbDown fontSize="small" />
                      <Typography variant="body2" sx={{ ml: 0.5 }}>
                        {selectedQuestion.downvotes || 0}
                      </Typography>
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              {/* Status Actions */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Update Status
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    color="success"
                    size="small"
                    startIcon={<CheckCircle />}
                    onClick={() => handleStatusChange(selectedQuestion.id, 'approved')}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="outlined"
                    color="warning"
                    size="small"
                    startIcon={<Edit />}
                    onClick={() => handleStatusChange(selectedQuestion.id, 'needs_revision')}
                  >
                    Request Changes
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<Cancel />}
                    onClick={() => handleStatusChange(selectedQuestion.id, 'rejected')}
                  >
                    Reject
                  </Button>
                </Box>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              {/* Comments */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Comments
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    variant="outlined"
                    size="small"
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Button 
                            size="small" 
                            variant="contained" 
                            color="primary"
                            onClick={handleAddComment}
                            disabled={!newComment.trim()}
                          >
                            Post
                          </Button>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
                
                {comments.length > 0 ? (
                  <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                    {comments.map((comment) => (
                      <Box key={comment.id} sx={{ mb: 2, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="subtitle2">
                            {comment.user?.name || 'Unknown'}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {formatDate(comment.createdAt, true)}
                          </Typography>
                        </Box>
                        <Typography variant="body2">{comment.content}</Typography>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 2 }}>
                    No comments yet. Be the first to comment!
                  </Typography>
                )}
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              {/* Status History */}
              <Box>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Status History
                </Typography>
                
                {statusHistory.length > 0 ? (
                  <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                    {statusHistory.map((history, index) => (
                      <Box 
                        key={index} 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          mb: 1,
                          p: 1,
                          bgcolor: 'background.paper',
                          borderRadius: 1
                        }}
                      >
                        <Box sx={{ 
                          width: 8, 
                          height: 8, 
                          borderRadius: '50%', 
                          bgcolor: 'primary.main',
                          mr: 1
                        }} />
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="subtitle2">
                              {history.status}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {formatDate(history.changedAt, true)}
                            </Typography>
                          </Box>
                          {history.comment && (
                            <Typography variant="body2" color="textSecondary">
                              {history.comment}
                            </Typography>
                          )}
                          <Typography variant="caption" display="block" color="textSecondary">
                            by {history.changedBy?.name || 'Unknown'}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 2 }}>
                    No status history available
                  </Typography>
                )}
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default ReviewDashboard;
