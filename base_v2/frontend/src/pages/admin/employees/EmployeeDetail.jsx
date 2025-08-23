import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  FiArrowLeft, FiEdit2, FiTrash2, FiUser, FiMail, FiPhone, 
  FiCalendar, FiBriefcase, FiMapPin, FiGlobe, FiCheckCircle, 
  FiXCircle, FiClock, FiShield, FiUserCheck, FiUserX, FiDollarSign
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import employeeService from '../../../services/employeeService';
import { formatDate } from '../../../utils/dateUtils';
import RoleAssignment from '../../../components/employees/RoleAssignment';
import ConfirmationModal from '../../../components/common/ConfirmationModal';

const EmployeeDetail = () => {
  const { companyId, employeeId } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Fetch employee details
  const fetchEmployeeDetails = async () => {
    try {
      setLoading(true);
      const response = await employeeService.getEmployee(employeeId, companyId);
      setEmployee(response.data);
    } catch (error) {
      console.error('Error fetching employee details:', error);
      toast.error('Failed to load employee details');
      navigate(`/admin/companies/${companyId}/employees`);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (employeeId && companyId) {
      fetchEmployeeDetails();
    }
  }, [employeeId, companyId]);

  // Toggle employee status
  const toggleEmployeeStatus = async () => {
    if (!employee) return;
    
    setIsUpdatingStatus(true);
    try {
      const newStatus = !employee.is_active;
      await employeeService.updateEmployeeStatus(employeeId, companyId, newStatus);
      
      setEmployee(prev => ({
        ...prev,
        is_active: newStatus
      }));
      
      toast.success(`Employee ${newStatus ? 'activated' : 'deactivated'} successfully`);
      setShowStatusModal(false);
    } catch (error) {
      console.error('Error updating employee status:', error);
      toast.error('Failed to update employee status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handle employee deletion
  const handleDelete = async () => {
    try {
      await employeeService.removeEmployee(employeeId, companyId);
      toast.success('Employee removed successfully');
      navigate(`/admin/companies/${companyId}/employees`);
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.error('Failed to delete employee');
    } finally {
      setShowDeleteModal(false);
    }
  };

  // Handle role assignment updates
  const handleRoleAssignment = (updatedRoles) => {
    setEmployee(prev => ({
      ...prev,
      roles: updatedRoles
    }));
  };

  // Loading state
  if (loading || !employee) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with back button and actions */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center">
            <Link 
              to={`/admin/companies/${companyId}/employees`}
              className="mr-4 text-gray-500 hover:text-indigo-600"
            >
              <FiArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                {employee.first_name} {employee.last_name}
              </h2>
              <div className="mt-1 flex flex-wrap items-center text-sm text-gray-500">
                <span className="flex items-center">
                  <FiBriefcase className="mr-1.5 h-4 w-4 text-gray-400" />
                  {employee.position || 'No position specified'}
                </span>
                <span className="mx-2">•</span>
                <span className="flex items-center">
                  <FiBriefcase className="mr-1.5 h-4 w-4 text-gray-400" />
                  {employee.department || 'No department'}
                </span>
                <span className="mx-2">•</span>
                <span className="flex items-center">
                  <FiClock className="mr-1.5 h-4 w-4 text-gray-400" />
                  Member since {formatDate(employee.hire_date || employee.created_at)}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 flex space-x-3 md:mt-0
        ">
          <button
            type="button"
            onClick={() => setShowStatusModal(true)}
            className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              employee.is_active
                ? 'border-yellow-300 bg-white text-yellow-700 hover:bg-yellow-50 focus:ring-yellow-500'
                : 'border-green-300 bg-white text-green-700 hover:bg-green-50 focus:ring-green-500'
            }`}
          >
            {employee.is_active ? (
              <>
                <FiUserX className="-ml-1 mr-2 h-5 w-5" />
                Deactivate
              </>
            ) : (
              <>
                <FiUserCheck className="-ml-1 mr-2 h-5 w-5" />
                Activate
              </>
            )}
          </button>
          <Link
            to={`/admin/companies/${companyId}/employees/${employeeId}/edit`}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FiEdit2 className="-ml-1 mr-2 h-5 w-5" />
            Edit
          </Link>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <FiTrash2 className="-ml-1 mr-2 h-5 w-5" />
            Delete
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Employee Information
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Personal details and employment information
          </p>
        </div>

        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            {/* Personal Information */}
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                <div className="flex items-center">
                  <FiUser className="mr-2 h-5 w-5 text-gray-400" />
                  Personal Information
                </div>
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500">Full Name</p>
                    <p className="mt-1">{employee.first_name} {employee.last_name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">Email</p>
                    <div className="mt-1 flex items-center">
                      <FiMail className="mr-1.5 h-4 w-4 text-gray-400" />
                      <a href={`mailto:${employee.email}`} className="text-indigo-600 hover:text-indigo-900">
                        {employee.email}
                      </a>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">Phone</p>
                    <div className="mt-1 flex items-center">
                      <FiPhone className="mr-1.5 h-4 w-4 text-gray-400" />
                      {employee.phone || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">Status</p>
                    <div className="mt-1">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        employee.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {employee.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              </dd>
            </div>

            {/* Employment Information */}
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                <div className="flex items-center">
                  <FiBriefcase className="mr-2 h-5 w-5 text-gray-400" />
                  Employment
                </div>
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500">Employee ID</p>
                    <p className="mt-1">{employee.employee_id || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">Department</p>
                    <p className="mt-1">{employee.department || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">Position</p>
                    <p className="mt-1">{employee.position || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">Hire Date</p>
                    <div className="mt-1 flex items-center">
                      <FiCalendar className="mr-1.5 h-4 w-4 text-gray-400" />
                      {employee.hire_date ? formatDate(employee.hire_date) : 'N/A'}
                    </div>
                  </div>
                </div>
              </dd>
            </div>

            {/* Address */}
            {(employee.address || employee.city || employee.state || employee.postal_code || employee.country) && (
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  <div className="flex items-center">
                    <FiMapPin className="mr-2 h-5 w-5 text-gray-400" />
                    Address
                  </div>
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <div className="space-y-1">
                    {employee.address && <p>{employee.address}</p>}
                    <div className="flex flex-wrap gap-1">
                      {employee.city && <span>{employee.city},</span>}
                      {employee.state && <span>{employee.state}</span>}
                      {employee.postal_code && <span>{employee.postal_code}</span>}
                    </div>
                    {employee.country && (
                      <div className="flex items-center text-gray-500">
                        <FiGlobe className="mr-1.5 h-4 w-4" />
                        {employee.country}
                      </div>
                    )}
                  </div>
                </dd>
              </div>
            )}

            {/* Roles and Permissions */}
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                <div className="flex items-center">
                  <FiShield className="mr-2 h-5 w-5 text-gray-400" />
                  Roles & Permissions
                </div>
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <RoleAssignment 
                  employeeId={employeeId}
                  companyId={companyId}
                  currentRoles={employee.roles || []}
                  onUpdate={handleRoleAssignment}
                />
              </dd>
            </div>

            {/* Additional Information */}
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                <div className="flex items-center">
                  <FiDollarSign className="mr-2 h-5 w-5 text-gray-400" />
                  Additional Information
                </div>
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500">Created At</p>
                    <p className="mt-1">{formatDate(employee.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">Last Updated</p>
                    <p className="mt-1">{formatDate(employee.updated_at)}</p>
                  </div>
                </div>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Employee"
        message="Are you sure you want to delete this employee? This action cannot be undone."
        confirmText="Delete"
        confirmButtonStyle="bg-red-600 hover:bg-red-700 focus:ring-red-500"
        icon={FiTrash2}
        iconBackground="bg-red-100"
        iconColor="text-red-600"
      />

      {/* Status Change Confirmation Modal */}
      <ConfirmationModal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        onConfirm={toggleEmployeeStatus}
        isProcessing={isUpdatingStatus}
        title={`${employee.is_active ? 'Deactivate' : 'Activate'} Employee`}
        message={`Are you sure you want to ${employee.is_active ? 'deactivate' : 'activate'} this employee? ${
          employee.is_active 
            ? 'They will no longer be able to access the system.'
            : 'They will regain access to the system.'
        }`}
        confirmText={employee.is_active ? 'Deactivate' : 'Activate'}
        confirmButtonStyle={`${
          employee.is_active 
            ? 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
            : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
        }`}
        icon={employee.is_active ? FiUserX : FiUserCheck}
        iconBackground={employee.is_active ? 'bg-yellow-100' : 'bg-green-100'}
        iconColor={employee.is_active ? 'text-yellow-600' : 'text-green-600'}
      />
    </div>
  );
};

export default EmployeeDetail;
