import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Divider,
  IconButton,
  Chip,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  Card,
  CardContent,
  CardHeader,
  Collapse,
  Alert,
} from '@mui/material';
import { Save, Cancel, Add as AddIcon, Delete as DeleteIcon, ExpandMore, ExpandLess } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

const questionSchema = Yup.object().shape({
  questionText: Yup.string().required('Question text is required'),
  type: Yup.string().required('Question type is required'),
  difficulty: Yup.string().required('Difficulty level is required'),
  categoryId: Yup.string().required('Category is required'),
  explanation: Yup.string(),
  options: Yup.array().of(
    Yup.object().shape({
      text: Yup.string().required('Option text is required'),
      isCorrect: Yup.boolean(),
      explanation: Yup.string(),
    })
  ).when('type', {
    is: (type) => ['multiple_choice', 'true_false'].includes(type),
    then: (schema) => schema.min(2, 'At least two options are required')
      .test('has-correct', 'At least one correct answer is required', (options) => {
        return options && options.some(option => option.isCorrect);
      })
  }),
  tags: Yup.array().of(Yup.string()),
  statusId: Yup.string().required('Status is required'),
});

const QuestionForm = () => {
  const { id } = useParams();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [tags, setTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [error, setError] = useState('');
  const [expandedOptions, setExpandedOptions] = useState({});

  const formik = useFormik({
    initialValues: {
      questionText: '',
      type: 'multiple_choice',
      difficulty: 'medium',
      categoryId: '',
      explanation: '',
      options: [
        { text: '', isCorrect: false, explanation: '' },
        { text: '', isCorrect: false, explanation: '' },
      ],
      tags: [],
      statusId: '',
    },
    validationSchema: questionSchema,
    onSubmit: async (values) => {
      try {
        setSubmitting(true);
        const questionData = {
          ...values,
          companyId: currentUser.company_id,
          tagIds: values.tags.map(tag => typeof tag === 'string' ? tag : tag.id)
        };

        if (isEditMode) {
          await api.put(`/api/questions/${id}`, questionData);
        } else {
          await api.post('/api/questions', questionData);
        }
        
        navigate('/questions');
      } catch (error) {
        console.error('Error saving question:', error);
        setError(error.response?.data?.message || 'Failed to save question');
      } finally {
        setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories
        const categoriesRes = await api.get('/api/categories');
        setCategories(categoriesRes.data);

        // Fetch statuses
        const statusesRes = await api.get('/api/question-statuses');
        setStatuses(statusesRes.data);

        // Fetch tags
        const tagsRes = await api.get('/api/tags');
        setAvailableTags(tagsRes.data);

        // If in edit mode, fetch question data
        if (isEditMode) {
          const questionRes = await api.get(`/api/questions/${id}`);
          const question = questionRes.data;
          
          // Set form values
          formik.setValues({
            questionText: question.questionText,
            type: question.type,
            difficulty: question.difficulty,
            categoryId: question.categoryId,
            explanation: question.explanation || '',
            options: question.options || [],
            tags: question.tags || [],
            statusId: question.statusId || '',
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load required data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isEditMode]);

  const handleAddOption = () => {
    formik.setFieldValue('options', [
      ...formik.values.options,
      { text: '', isCorrect: false, explanation: '' },
    ]);
  };

  const handleRemoveOption = (index) => {
    const options = [...formik.values.options];
    options.splice(index, 1);
    formik.setFieldValue('options', options);
  };

  const handleOptionChange = (index, field, value) => {
    const options = [...formik.values.options];
    options[index] = { ...options[index], [field]: value };
    formik.setFieldValue('options', options);
  };

  const handleToggleCorrect = (index) => {
    const options = [...formik.values.options];
    options[index] = { ...options[index], isCorrect: !options[index].isCorrect };
    formik.setFieldValue('options', options);
  };

  const handleAddTag = (event) => {
    const selectedTag = event.target.value;
    if (selectedTag && !formik.values.tags.some(tag => tag.id === selectedTag.id || tag === selectedTag.id)) {
      formik.setFieldValue('tags', [...formik.values.tags, selectedTag]);
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    formik.setFieldValue(
      'tags',
      formik.values.tags.filter(tag => 
        (typeof tag === 'string' ? tag : tag.id) !== (typeof tagToRemove === 'string' ? tagToRemove : tagToRemove.id)
      )
    );
  };

  const toggleOptionExpanded = (index) => {
    setExpandedOptions(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {isEditMode ? 'Edit Question' : 'Create New Question'}
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={formik.handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Question Details
              </Typography>
              
              <TextField
                fullWidth
                id="questionText"
                name="questionText"
                label="Question Text"
                multiline
                rows={3}
                value={formik.values.questionText}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.questionText && Boolean(formik.errors.questionText)}
                helperText={formik.touched.questionText && formik.errors.questionText}
                margin="normal"
                variant="outlined"
                required
              />

              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth margin="normal" required>
                    <InputLabel>Question Type</InputLabel>
                    <Select
                      name="type"
                      value={formik.values.type}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.type && Boolean(formik.errors.type)}
                      label="Question Type"
                    >
                      <MenuItem value="multiple_choice">Multiple Choice</MenuItem>
                      <MenuItem value="true_false">True/False</MenuItem>
                      <MenuItem value="short_answer">Short Answer</MenuItem>
                      <MenuItem value="essay">Essay</MenuItem>
                    </Select>
                    {formik.touched.type && formik.errors.type && (
                      <FormHelperText error>{formik.errors.type}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth margin="normal" required>
                    <InputLabel>Difficulty</InputLabel>
                    <Select
                      name="difficulty"
                      value={formik.values.difficulty}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.difficulty && Boolean(formik.errors.difficulty)}
                      label="Difficulty"
                    >
                      <MenuItem value="easy">Easy</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="hard">Hard</MenuItem>
                    </Select>
                    {formik.touched.difficulty && formik.errors.difficulty && (
                      <FormHelperText error>{formik.errors.difficulty}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth margin="normal" required>
                    <InputLabel>Category</InputLabel>
                    <Select
                      name="categoryId"
                      value={formik.values.categoryId}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.categoryId && Boolean(formik.errors.categoryId)}
                      label="Category"
                    >
                      {categories.map((category) => (
                        <MenuItem key={category.id} value={category.id}>
                          {category.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {formik.touched.categoryId && formik.errors.categoryId && (
                      <FormHelperText error>{formik.errors.categoryId}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
              </Grid>

              <TextField
                fullWidth
                id="explanation"
                name="explanation"
                label="Explanation (Optional)"
                multiline
                rows={3}
                value={formik.values.explanation}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                margin="normal"
                variant="outlined"
                helperText="Provide a detailed explanation of the correct answer"
              />
            </Paper>

            {['multiple_choice', 'true_false'].includes(formik.values.type) && (
              <Paper sx={{ p: 3, mb: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Answer Options</Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={handleAddOption}
                    disabled={formik.values.options.length >= 10}
                  >
                    Add Option
                  </Button>
                </Box>

                {formik.touched.options && formik.errors.options && (
                  <FormHelperText error sx={{ mb: 2 }}>
                    {typeof formik.errors.options === 'string' 
                      ? formik.errors.options 
                      : 'Please correct the errors in the options'}
                  </FormHelperText>
                )}

                {formik.values.options.map((option, index) => (
                  <Card key={index} variant="outlined" sx={{ mb: 2, overflow: 'visible' }}>
                    <CardHeader
                      title={
                        <Box display="flex" alignItems="center">
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={option.isCorrect || false}
                                onChange={() => handleToggleCorrect(index)}
                                color="primary"
                              />
                            }
                            label="Correct Answer"
                            sx={{ mr: 2 }}
                          />
                          <Box flexGrow={1} />
                          <IconButton 
                            size="small" 
                            onClick={() => toggleOptionExpanded(index)}
                            aria-label={expandedOptions[index] ? 'Collapse' : 'Expand'}
                          >
                            {expandedOptions[index] ? <ExpandLess /> : <ExpandMore />}
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={() => handleRemoveOption(index)}
                            color="error"
                            disabled={formik.values.options.length <= 2}
                            aria-label="Remove option"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      }
                      sx={{ 
                        p: 1,
                        backgroundColor: option.isCorrect ? 'action.selected' : 'background.paper',
                        '& .MuiCardHeader-content': { minWidth: 0 },
                      }}
                    />
                    
                    <Collapse in={expandedOptions[index] !== false}>
                      <CardContent sx={{ pt: 0 }}>
                        <TextField
                          fullWidth
                          label={`Option ${index + 1} Text`}
                          value={option.text}
                          onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                          onBlur={formik.handleBlur}
                          error={
                            formik.touched.options && 
                            formik.touched.options[index]?.text && 
                            Boolean(formik.errors.options?.[index]?.text)
                          }
                          helperText={
                            formik.touched.options && 
                            formik.touched.options[index]?.text && 
                            formik.errors.options?.[index]?.text
                          }
                          margin="normal"
                          variant="outlined"
                          required
                        />
                        
                        <TextField
                          fullWidth
                          label="Explanation (Optional)"
                          value={option.explanation || ''}
                          onChange={(e) => handleOptionChange(index, 'explanation', e.target.value)}
                          margin="normal"
                          variant="outlined"
                          multiline
                          rows={2}
                        />
                      </CardContent>
                    </Collapse>
                  </Card>
                ))}
              </Paper>
            )}
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, mb: 3, position: 'sticky', top: 20 }}>
              <Typography variant="h6" gutterBottom>
                Metadata
              </Typography>

              <FormControl fullWidth margin="normal" required>
                <InputLabel>Status</InputLabel>
                <Select
                  name="statusId"
                  value={formik.values.statusId}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.statusId && Boolean(formik.errors.statusId)}
                  label="Status"
                >
                  {statuses.map((status) => (
                    <MenuItem key={status.id} value={status.id}>
                      {status.name}
                    </MenuItem>
                  ))}
                </Select>
                {formik.touched.statusId && formik.errors.statusId && (
                  <FormHelperText error>{formik.errors.statusId}</FormHelperText>
                )}
              </FormControl>

              <FormControl fullWidth margin="normal">
                <InputLabel>Tags</InputLabel>
                <Select
                  multiple
                  value={[]}
                  onChange={handleAddTag}
                  renderValue={() => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {formik.values.tags.map((tag) => (
                        <Chip
                          key={typeof tag === 'string' ? tag : tag.id}
                          label={typeof tag === 'string' ? tag : tag.name}
                          onDelete={() => handleRemoveTag(tag)}
                          size="small"
                        />
                      ))}
                    </Box>
                  )}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 200,
                      },
                    },
                  }}
                >
                  {availableTags
                    .filter(tag => !formik.values.tags.some(t => 
                      (typeof t === 'string' ? t : t.id) === tag.id
                    ))
                    .map((tag) => (
                      <MenuItem key={tag.id} value={tag}>
                        {tag.name}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/questions')}
                  disabled={submitting}
                  startIcon={<Cancel />}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={!formik.isValid || submitting}
                  startIcon={submitting ? <CircularProgress size={20} /> : <Save />}
                >
                  {submitting ? 'Saving...' : 'Save Question'}
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default QuestionForm;
