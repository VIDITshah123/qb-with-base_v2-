# Question Management Module

This module provides a comprehensive solution for managing questions in the application. It includes components for creating, viewing, editing, and deleting questions, as well as features for filtering, sorting, and searching questions.

## Features

- **Question List**: View all questions with filtering and sorting options
- **Question Detail**: View detailed information about a specific question
- **Question Form**: Create or edit questions with a rich text editor
- **Question Status**: Track and update the status of questions (Draft, Review, Approved, etc.)
- **Comments & Reviews**: Add comments and reviews to questions
- **Voting**: Upvote or downvote questions
- **Import/Export**: Import questions from CSV/Excel or export to various formats

## Components

### QuestionList
Displays a paginated list of questions with filtering and sorting capabilities.

**Props:**
- `questions`: Array of question objects
- `loading`: Boolean indicating if data is being loaded
- `onDelete`: Function to handle question deletion
- `onStatusChange`: Function to handle status changes
- `filters`: Current filter values
- `onFilterChange`: Function to handle filter changes
- `pagination`: Pagination information
- `onPageChange`: Function to handle page changes
- `onRowsPerPageChange`: Function to handle rows per page changes
- `onSort`: Function to handle sorting

### QuestionDetail
Displays detailed information about a specific question.

**Props:**
- `question`: The question object to display
- `loading`: Boolean indicating if data is being loaded
- `onStatusChange`: Function to handle status changes
- `onVote`: Function to handle voting
- `onComment`: Function to handle adding comments
- `onEdit`: Function to handle editing the question
- `onDelete`: Function to handle deleting the question

### QuestionForm
A form for creating or editing questions.

**Props:**
- `initialValues`: Initial form values
- `onSubmit`: Function to handle form submission
- `onCancel`: Function to handle form cancellation
- `loading`: Boolean indicating if the form is being submitted
- `categories`: Array of available categories
- `statuses`: Array of available statuses
- `tags`: Array of available tags

## Context

The `QuestionContext` provides global state management for questions. It handles data fetching, filtering, sorting, and pagination.

**Usage:**

```jsx
import { useQuestions } from '../../contexts/QuestionContext';

function MyComponent() {
  const {
    questions,
    loading,
    error,
    pagination,
    fetchQuestions,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    // ... other methods
  } = useQuestions();
  
  // Use the context values and methods
}
```

## Services

The `questionService` provides methods for interacting with the question API.

**Available Methods:**
- `getQuestions(filters)`: Fetch questions with optional filters
- `getQuestion(id)`: Fetch a single question by ID
- `createQuestion(data)`: Create a new question
- `updateQuestion(id, data)`: Update an existing question
- `deleteQuestion(id)`: Delete a question
- `updateQuestionStatus(id, statusData)`: Update a question's status
- `getQuestionStatusHistory(id)`: Get status history for a question
- `addComment(questionId, comment)`: Add a comment to a question
- `voteQuestion(questionId, voteType)`: Vote on a question
- `exportQuestions(filters)`: Export questions to a file
- `importQuestions(file, options)`: Import questions from a file

## Utils

The `questionUtils` module provides helper functions for working with questions.

**Key Functions:**
- `formatQuestionType(type)`: Format a question type for display
- `getDifficultyColor(difficulty)`: Get the color for a difficulty level
- `formatDate(date)`: Format a date for display
- `truncateText(text, maxLength, addEllipsis)`: Truncate text to a specified length
- `validateQuestion(questionData)`: Validate question data
- `filterQuestions(questions, filters)`: Filter questions based on criteria
- `sortQuestions(questions, sortBy, sortOrder)`: Sort questions
- `calculateQuestionStats(questions)`: Calculate statistics for questions

## API Endpoints

The following API endpoints are used by this module:

- `GET /api/questions`: Get all questions
- `GET /api/questions/:id`: Get a single question
- `POST /api/questions`: Create a new question
- `PUT /api/questions/:id`: Update a question
- `DELETE /api/questions/:id`: Delete a question
- `POST /api/questions/:id/status`: Update a question's status
- `GET /api/questions/:id/status-history`: Get status history for a question
- `POST /api/questions/:id/comments`: Add a comment to a question
- `GET /api/questions/:id/comments`: Get comments for a question
- `POST /api/questions/:id/vote`: Vote on a question
- `GET /api/questions/export`: Export questions
- `POST /api/questions/import`: Import questions

## Permissions

The following permissions are used by this module:

- `view_questions`: View questions
- `create_questions`: Create new questions
- `edit_questions`: Edit existing questions
- `delete_questions`: Delete questions
- `review_questions`: Review and approve/reject questions
- `import_questions`: Import questions from files
- `export_questions`: Export questions to files

## Styling

This module uses Material-UI components and follows the application's design system. Custom styles are defined in the component files using the `sx` prop or the `styled` utility from Material-UI.

## Dependencies

- React
- React Router
- Material-UI
- date-fns (for date formatting)
- react-hook-form (for form handling)
- yup (for form validation)
- react-quill (for rich text editing)
