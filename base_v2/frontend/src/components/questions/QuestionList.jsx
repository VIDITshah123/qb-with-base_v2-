import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  InputAdornment,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  Box,
  Typography,
  Chip,
} from '@mui/material';
import { Search, FilterList, Add, Edit, Delete, Visibility } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

const QuestionList = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    difficulty: '',
    category: '',
    status: ''
  });
  const [categories, setCategories] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const difficultyColors = {
    easy: 'success',
    medium: 'warning',
    hard: 'error'
  };

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await api.get('/api/questions', {
          params: { companyId: currentUser.company_id }
        });
        setQuestions(response.data);
      } catch (error) {
        console.error('Error fetching questions:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchCategories = async () => {
      try {
        const response = await api.get('/api/categories');
        setCategories(response.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    const fetchStatuses = async () => {
      try {
        const response = await api.get('/api/question-statuses');
        setStatuses(response.data);
      } catch (error) {
        console.error('Error fetching statuses:', error);
      }
    };

    fetchQuestions();
    fetchCategories();
    fetchStatuses();
  }, [currentUser.company_id]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const filteredQuestions = questions.filter(question => {
    const matchesSearch = question.questionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         question.explanation?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilters = Object.entries(filters).every(([key, value]) => {
      if (!value) return true;
      return question[key] === value;
    });

    return matchesSearch && matchesFilters;
  });

  const handleEdit = (id) => {
    navigate(`/questions/edit/${id}`);
  };

  const handleView = (id) => {
    navigate(`/questions/${id}`);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        await api.delete(`/api/questions/${id}`);
        setQuestions(questions.filter(q => q.id !== id));
      } catch (error) {
        console.error('Error deleting question:', error);
      }
    }
  };

  if (loading) {
    return <div>Loading questions...</div>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Question Bank
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => navigate('/questions/new')}
        >
          Add Question
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
          <TextField
            variant="outlined"
            placeholder="Search questions..."
            value={searchTerm}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 300 }}
          />
          
          <FormControl sx={{ minWidth: 150 }} size="small">
            <InputLabel>Type</InputLabel>
            <Select
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              label="Type"
            >
              <MenuItem value="">All Types</MenuItem>
              <MenuItem value="multiple_choice">Multiple Choice</MenuItem>
              <MenuItem value="true_false">True/False</MenuItem>
              <MenuItem value="short_answer">Short Answer</MenuItem>
              <MenuItem value="essay">Essay</MenuItem>
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 150 }} size="small">
            <InputLabel>Difficulty</InputLabel>
            <Select
              name="difficulty"
              value={filters.difficulty}
              onChange={handleFilterChange}
              label="Difficulty"
            >
              <MenuItem value="">All Levels</MenuItem>
              <MenuItem value="easy">Easy</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="hard">Hard</MenuItem>
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 150 }} size="small">
            <InputLabel>Category</InputLabel>
            <Select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              label="Category"
            >
              <MenuItem value="">All Categories</MenuItem>
              {categories.map(category => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 150 }} size="small">
            <InputLabel>Status</InputLabel>
            <Select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              label="Status"
            >
              <MenuItem value="">All Statuses</MenuItem>
              {statuses.map(status => (
                <MenuItem key={status.id} value={status.id}>
                  {status.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Question</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Difficulty</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredQuestions.length > 0 ? (
              filteredQuestions.map((question) => (
                <TableRow key={question.id} hover>
                  <TableCell>
                    <Typography variant="body2" noWrap>
                      {question.questionText?.substring(0, 100)}
                      {question.questionText?.length > 100 ? '...' : ''}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {question.type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </TableCell>
                  <TableCell>
                    {categories.find(c => c.id === question.categoryId)?.name || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={question.difficulty}
                      color={difficultyColors[question.difficulty] || 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={statuses.find(s => s.id === question.statusId)?.name || 'Draft'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(question.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleView(question.id)}>
                      <Visibility fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleEdit(question.id)}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(question.id)}>
                      <Delete fontSize="small" color="error" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No questions found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default QuestionList;
