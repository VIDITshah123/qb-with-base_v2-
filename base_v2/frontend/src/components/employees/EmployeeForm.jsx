import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FiUser, FiMail, FiPhone, FiCalendar, FiBriefcase, FiX, FiSave, FiUserPlus, FiUserCheck } from 'react-icons/fi';
import { toast } from 'react-toastify';
import employeeService from '../../services/employeeService';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const EmployeeForm = ({ isEdit = false }) => {
  const { companyId, employeeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors }, 
    control,
    reset,
    setValue,
    watch
  } = useForm({
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      hire_date: new Date(),
      department: '',
      position: '',
      address: '',
      city: '',
      state: '',
      postal_code: '',
      country: '',
      is_active: true
    }
  });

  // Fetch employee data if in edit mode
  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (isEdit && employeeId) {
        setLoading(true);
        try {
          const response = await employeeService.getEmployee(employeeId, companyId);
          const employeeData = response.data;
          
          // Set form values
          Object.keys(employeeData).forEach(key => {
            if (key === 'hire_date' && employeeData[key]) {
              setValue(key, new Date(employeeData[key]));
            } else if (key === 'roles' && Array.isArray(employeeData[key])) {
              setSelectedRoles(employeeData[key].map(role => role.role_id));
            } else if (employeeData[key] !== null && employeeData[key] !== undefined) {
              setValue(key, employeeData[key]);
            }
          });
          
        } catch (error) {
          console.error('Error fetching employee data:', error);
          toast.error('Failed to load employee data');
          navigate(`/admin/companies/${companyId}/employees`);
        } finally {
          setLoading(false);
        }
      }
    };

    const fetchRoles = async () => {
      try {
        const response = await employeeService.getAvailableRoles(companyId);
        setAvailableRoles(response.data || []);
      } catch (error) {
        console.error('Error fetching roles:', error);
        toast.error('Failed to load available roles');
      }
    };

    fetchEmployeeData();
    fetchRoles();
  }, [isEdit, employeeId, companyId, navigate, setValue]);

  // Handle role selection
  const handleRoleToggle = (roleId) => {
    setSelectedRoles(prev => 
      prev.includes(roleId)
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };

  // Form submission handler
  const onSubmit = async (data) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const employeeData = {
        ...data,
        roles: selectedRoles,
        company_id: companyId
      };

      if (isEdit && employeeId) {
        // Update existing employee
        await employeeService.updateEmployee(employeeId, companyId, employeeData);
        toast.success('Employee updated successfully');
      } else {
        // Create new employee
        await employeeService.addEmployee(companyId, employeeData);
        toast.success('Employee added successfully');
      }
      
      // Navigate back to employees list
      navigate(`/admin/companies/${companyId}/employees`);
      
    } catch (error) {
      console.error('Error saving employee:', error);
      toast.error(error.response?.data?.message || 'Failed to save employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate(`/admin/companies/${companyId}/employees`);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          {isEdit ? 'Edit Employee' : 'Add New Employee'}
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          {isEdit 
            ? "Update the employee's details below." 
            : "Fill in the employee's details to add them to your company."}
        </p>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
        {/* Personal Information */}
        <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
          <div className="md:grid md:grid-cols-3 md:gap-6">
            <div className="md:col-span-1">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Personal Information</h3>
              <p className="mt-1 text-sm text-gray-500">
                Basic information about the employee.
              </p>
            </div>
            <div className="mt-5 md:mt-0 md:col-span-2">
              <div className="grid grid-cols-6 gap-6">
                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                    First name *
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiUser className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="first_name"
                      {...register('first_name', { required: 'First name is required' })}
                      className={`mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border ${
                        errors.first_name ? 'border-red-300' : 'border-gray-300'
                      } rounded-md`}
                      placeholder="John"
                    />
                  </div>
                  {errors.first_name && (
                    <p className="mt-2 text-sm text-red-600">{errors.first_name.message}</p>
                  )}
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                    Last name *
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      type="text"
                      id="last_name"
                      {...register('last_name', { required: 'Last name is required' })}
                      className={`mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-3 sm:text-sm border ${
                        errors.last_name ? 'border-red-300' : 'border-gray-300'
                      } rounded-md`}
                      placeholder="Doe"
                    />
                  </div>
                  {errors.last_name && (
                    <p className="mt-2 text-sm text-red-600">{errors.last_name.message}</p>
                  )}
                </div>

                <div className="col-span-6 sm:col-span-4">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email address *
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiMail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      {...register('email', { 
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address'
                        }
                      })}
                      className={`mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border ${
                        errors.email ? 'border-red-300' : 'border-gray-300'
                      } rounded-md`}
                      placeholder="john.doe@example.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div className="col-span-6 sm:col-span-4">
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone number
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiPhone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      id="phone"
                      {...register('phone')}
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                      placeholder="+1 (555) 987-6543"
                    />
                  </div>
                </div>

                <div className="col-span-6 sm:col-span-4">
                  <label htmlFor="hire_date" className="block text-sm font-medium text-gray-700">
                    Hire Date
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiCalendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <Controller
                      control={control}
                      name="hire_date"
                      render={({ field: { onChange, value } }) => (
                        <DatePicker
                          selected={value}
                          onChange={onChange}
                          dateFormat="MMMM d, yyyy"
                          className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                          wrapperClassName="w-full"
                        />
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Job Information */}
        <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
          <div className="md:grid md:grid-cols-3 md:gap-6">
            <div className="md:col-span-1">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Job Information</h3>
              <p className="mt-1 text-sm text-gray-500">
                Details about the employee's role in the company.
              </p>
            </div>
            <div className="mt-5 md:mt-0 md:col-span-2">
              <div className="grid grid-cols-6 gap-6">
                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                    Department
                  </label>
                  <input
                    type="text"
                    id="department"
                    {...register('department')}
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    placeholder="e.g., Engineering, Marketing"
                  />
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="position" className="block text-sm font-medium text-gray-700">
                    Position
                  </label>
                  <input
                    type="text"
                    id="position"
                    {...register('position')}
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    placeholder="e.g., Software Engineer, Marketing Manager"
                  />
                </div>

                <div className="col-span-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Roles & Permissions
                  </label>
                  <div className="space-y-2">
                    {availableRoles.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {availableRoles.map((role) => (
                          <button
                            key={role.role_id}
                            type="button"
                            onClick={() => handleRoleToggle(role.role_id)}
                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${
                              selectedRoles.includes(role.role_id)
                                ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                : 'bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200'
                            }`}
                          >
                            {role.role_name}
                            {selectedRoles.includes(role.role_id) ? (
                              <FiUserCheck className="ml-1.5 h-3.5 w-3.5" />
                            ) : (
                              <FiUserPlus className="ml-1.5 h-3.5 w-3.5" />
                            )}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No roles available. Please create roles first.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
          <div className="md:grid md:grid-cols-3 md:gap-6">
            <div className="md:col-span-1">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Address</h3>
              <p className="mt-1 text-sm text-gray-500">
                The employee's contact address.
              </p>
            </div>
            <div className="mt-5 md:mt-0 md:col-span-2">
              <div className="grid grid-cols-6 gap-6">
                <div className="col-span-6">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Street address
                  </label>
                  <input
                    type="text"
                    id="address"
                    {...register('address')}
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    placeholder="123 Main St"
                  />
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                    City
                  </label>
                  <input
                    type="text"
                    id="city"
                    {...register('city')}
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    placeholder="New York"
                  />
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                    State / Province
                  </label>
                  <input
                    type="text"
                    id="state"
                    {...register('state')}
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    placeholder="NY"
                  />
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700">
                    ZIP / Postal code
                  </label>
                  <input
                    type="text"
                    id="postal_code"
                    {...register('postal_code')}
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    placeholder="10001"
                  />
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                    Country
                  </label>
                  <select
                    id="country"
                    {...register('country')}
                    className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="">Select a country</option>
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="UK">United Kingdom</option>
                    <option value="AU">Australia</option>
                    <option value="IN">India</option>
                    <option value="JP">Japan</option>
                    <option value="DE">Germany</option>
                    <option value="FR">France</option>
                    <option value="BR">Brazil</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
          <div className="md:grid md:grid-cols-3 md:gap-6">
            <div className="md:col-span-1">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Status</h3>
              <p className="mt-1 text-sm text-gray-500">
                Set the employee's active status.
              </p>
            </div>
            <div className="mt-5 md:mt-0 md:col-span-2">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="is_active"
                    type="checkbox"
                    {...register('is_active')}
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="is_active" className="font-medium text-gray-700">
                    Active Employee
                  </label>
                  <p className="text-gray-500">
                    {watch('is_active')
                      ? 'This employee is currently active and can access the system.'
                      : 'This employee is inactive and cannot access the system.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleCancel}
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isEdit ? 'Updating...' : 'Creating...'}
              </>
            ) : isEdit ? (
              <>
                <FiSave className="-ml-1 mr-2 h-4 w-4" />
                Update Employee
              </>
            ) : (
              <>
                <FiUserPlus className="-ml-1 mr-2 h-4 w-4" />
                Add Employee
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmployeeForm;
