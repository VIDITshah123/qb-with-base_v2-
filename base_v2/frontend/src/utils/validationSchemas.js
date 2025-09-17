import * as Yup from 'yup';

// Common validation messages
const validationMessages = {
  required: 'This field is required',
  email: 'Must be a valid email',
  min: (min) => `Must be at least ${min} characters`,
  max: (max) `Must be ${max} characters or less`,
  minNumber: (min) => `Must be at least ${min}`,
  maxNumber: (max) `Must be ${max} or less`,
  url: 'Must be a valid URL',
};

// Common validation schemas
export const schemas = {
  // Authentication
  login: Yup.object({
    email: Yup.string()
      .email(validationMessages.email)
      .required(validationMessages.required),
    password: Yup.string()
      .min(6, validationMessages.min(6))
      .required(validationMessages.required),
    rememberMe: Yup.boolean(),
  }),

  // User profile
  profile: Yup.object({
    firstName: Yup.string()
      .max(50, validationMessages.max(50))
      .required(validationMessages.required),
    lastName: Yup.string()
      .max(50, validationMessages.max(50))
      .required(validationMessages.required),
    email: Yup.string()
      .email(validationMessages.email)
      .required(validationMessages.required),
    phone: Yup.string()
      .matches(
        /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,3}[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,4}$/,
        'Invalid phone number'
      )
      .nullable(),
    bio: Yup.string()
      .max(500, validationMessages.max(500)),
  }),

  // Question form
  question: Yup.object({
    questionText: Yup.string()
      .required(validationMessages.required)
      .max(1000, validationMessages.max(1000)),
    type: Yup.string()
      .required(validationMessages.required),
    difficulty: Yup.string()
      .required(validationMessages.required),
    categoryId: Yup.string()
      .required(validationMessages.required),
    explanation: Yup.string()
      .max(2000, validationMessages.max(2000)),
    options: Yup.array()
      .when('type', {
        is: (type) => ['multiple_choice', 'true_false'].includes(type),
        then: Yup.array()
          .of(
            Yup.object({
              text: Yup.string().required('Option text is required'),
              isCorrect: Yup.boolean(),
              explanation: Yup.string().max(500, validationMessages.max(500)),
            })
          )
          .min(2, 'At least 2 options are required')
          .test(
            'has-correct-answer',
            'At least one correct answer is required',
            (options) => options.some(option => option.isCorrect)
          ),
      }),
    tags: Yup.array()
      .of(Yup.string())
      .max(10, 'Maximum 10 tags allowed'),
  }),

  // Comment form
  comment: Yup.object({
    content: Yup.string()
      .required(validationMessages.required)
      .max(1000, validationMessages.max(1000)),
  }),

  // Search and filter
  search: Yup.object({
    query: Yup.string()
      .max(100, validationMessages.max(100)),
    category: Yup.string(),
    difficulty: Yup.string(),
    status: Yup.string(),
    sortBy: Yup.string(),
    sortOrder: Yup.string(),
  }),
};

// Helper function to create a custom validation schema
export const createSchema = (fields) => {
  const schema = {};
  
  Object.entries(fields).forEach(([field, config]) => {
    let validator;
    
    switch (config.type) {
      case 'string':
        validator = Yup.string();
        if (config.required) validator = validator.required(validationMessages.required);
        if (config.min) validator = validator.min(config.min, validationMessages.min(config.min));
        if (config.max) validator = validator.max(config.max, validationMessages.max(config.max));
        if (config.email) validator = validator.email(validationMessages.email);
        if (config.url) validator = validator.url(validationMessages.url);
        if (config.matches) validator = validator.matches(config.matches.pattern, config.matches.message);
        break;
        
      case 'number':
        validator = Yup.number().typeError('Must be a number');
        if (config.required) validator = validator.required(validationMessages.required);
        if (config.min) validator = validator.min(config.min, validationMessages.minNumber(config.min));
        if (config.max) validator = validator.max(config.max, validationMessages.maxNumber(config.max));
        if (config.positive) validator = validator.positive('Must be a positive number');
        if (config.integer) validator = validator.integer('Must be an integer');
        break;
        
      case 'array':
        validator = Yup.array();
        if (config.required) validator = validator.required(validationMessages.required);
        if (config.min) validator = validator.min(config.min, `At least ${config.min} items required`);
        if (config.max) validator = validator.max(config.max, `Maximum ${config.max} items allowed`);
        if (config.of) {
          validator = validator.of(createSchema({ item: config.of }).item);
        }
        break;
        
      case 'boolean':
        validator = Yup.boolean();
        if (config.required) {
          validator = validator.oneOf([true], 'This field must be checked');
        }
        break;
        
      case 'date':
        validator = Yup.date();
        if (config.required) validator = validator.required(validationMessages.required);
        if (config.min) validator = validator.min(config.min, `Date must be after ${config.min}`);
        if (config.max) validator = validator.max(config.max, `Date must be before ${config.max}`);
        break;
        
      default:
        validator = Yup.mixed();
    }
    
    schema[field] = validator;
  });
  
  return Yup.object().shape(schema);
};

export default schemas;
