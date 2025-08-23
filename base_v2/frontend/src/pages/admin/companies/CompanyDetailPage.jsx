import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  FiArrowLeft, FiEdit, FiSave, FiX, 
  FiTrash2, FiUser, FiMail, FiPhone, 
  FiMapPin, FiGlobe, FiDollarSign, FiCalendar,
  FiCheckCircle, FiXCircle, FiClock, FiUsers
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import companyService from '../../../services/companyService';

const CompanyDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    gstNumber: '',
    address: '',
    city: '',
    state: '',
    country: '',
    pincode: '',
    isActive: true
  });
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Fetch company details
  useEffect(() => {
    const fetchCompany = async () => {
      try {
        setLoading(true);
        const data = await companyService.getCompanyById(id);
        setCompany(data);
        setFormData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          gstNumber: data.gstNumber || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          country: data.country || '',
          pincode: data.pincode || '',
          isActive: data.isActive !== undefined ? data.isActive : true
        });
      } catch (error) {
        console.error('Error fetching company:', error);
        toast.error('Failed to load company details');
        navigate('/admin/companies');
      } finally {
        setLoading(false);
      }
    };

    if (id !== 'new') {
      fetchCompany();
    } else {
      setLoading(false);
      setEditing(true);
    }
  }, [id, navigate]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      if (id === 'new') {
        // Create new company
        const newCompany = await companyService.createCompany(formData);
        toast.success('Company created successfully');
        navigate(`/admin/companies/${newCompany.id}`, { replace: true });
      } else {
        // Update existing company
        await companyService.updateCompany(id, formData);
        setCompany(prev => ({ ...prev, ...formData }));
        toast.success('Company updated successfully');
      }
      
      setEditing(false);
    } catch (error) {
      console.error('Error saving company:', error);
      toast.error(`Failed to ${id === 'new' ? 'create' : 'update'} company`);
    } finally {
      setSaving(false);
    }
  };

  // Handle company deletion
  const handleDelete = async () => {
    try {
      await companyService.deleteCompany(id);
      toast.success('Company deleted successfully');
      navigate('/admin/companies');
    } catch (error) {
      console.error('Error deleting company:', error);
      toast.error('Failed to delete company');
    } finally {
      setShowDeleteModal(false);
    }
  };

  // Toggle company status
  const toggleStatus = async () => {
    try {
      const newStatus = !formData.isActive;
      await companyService.updateCompanyStatus(id, newStatus);
      setFormData(prev => ({ ...prev, isActive: newStatus }));
      setCompany(prev => ({ ...prev, isActive: newStatus }));
      toast.success(`Company ${newStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error updating company status:', error);
      toast.error('Failed to update company status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center">
            <Link
              to="/admin/companies"
              className="mr-4 text-gray-500 hover:text-gray-700"
            >
              <FiArrowLeft className="h-5 w-5" />
            </Link>
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              {id === 'new' ? 'Add New Company' : company?.name || 'Company Details'}
            </h2>
            {company && (
              <span className={`ml-4 px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                company.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {company.isActive ? 'Active' : 'Inactive'}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {id === 'new' 
              ? 'Fill in the details to create a new company' 
              : `Created on ${new Date(company.createdAt).toLocaleDateString()}`}
          </p>
        </div>
        
        <div className="mt-4 flex space-x-3 md:mt-0">
          {editing ? (
            <>
              <button
                type="button"
                onClick={() => {
                  if (id === 'new') {
                    navigate('/admin/companies');
                  } else {
                    setEditing(false);
                    // Reset form data
                    setFormData({
                      name: company.name || '',
                      email: company.email || '',
                      phone: company.phone || '',
                      gstNumber: company.gstNumber || '',
                      address: company.address || '',
                      city: company.city || '',
                      state: company.state || '',
                      country: company.country || '',
                      pincode: company.pincode || '',
                      isActive: company.isActive
                    });
                  }
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FiX className="mr-2 h-4 w-4" />
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FiSave className={`mr-2 h-4 w-4 ${saving ? 'animate-spin' : ''}`} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <>
              {id !== 'new' && (
                <>
                  <button
                    type="button"
                    onClick={toggleStatus}
                    className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                      company.isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
                  >
                    {company.isActive ? (
                      <>
                        <FiXCircle className="mr-2 h-4 w-4" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <FiCheckCircle className="mr-2 h-4 w-4" />
                        Activate
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <FiTrash2 className="mr-2 h-4 w-4" />
                    Delete
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FiEdit className="mr-2 h-4 w-4" />
                Edit
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Company Information
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            {editing 
              ? 'Update the company details below.' 
              : 'View and manage company information.'}
          </p>
        </div>
        
        <div className="border-t border-gray-200">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <div className="sm:col-span-1">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Company Name
                </label>
                {editing ? (
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    required
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{company?.name || '-'}</p>
                )}
              </div>
              
              <div className="sm:col-span-1">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                {editing ? (
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    required
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900 flex items-center">
                    <FiMail className="mr-2 h-4 w-4 text-gray-400" />
                    {company?.email || '-'}
                  </p>
                )}
              </div>
              
              <div className="sm:col-span-1">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone
                </label>
                {editing ? (
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900 flex items-center">
                    <FiPhone className="mr-2 h-4 w-4 text-gray-400" />
                    {company?.phone || '-'}
                  </p>
                )}
              </div>
              
              <div className="sm:col-span-1 mt-4">
                <label htmlFor="gstNumber" className="block text-sm font-medium text-gray-700">
                  GST Number
                </label>
                {editing ? (
                  <input
                    type="text"
                    name="gstNumber"
                    id="gstNumber"
                    value={formData.gstNumber}
                    onChange={handleChange}
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{company?.gstNumber || '-'}</p>
                )}
              </div>
              
              <div className="sm:col-span-3 mt-4">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Address
                </label>
                {editing ? (
                  <input
                    type="text"
                    name="address"
                    id="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900 flex items-center">
                    <FiMapPin className="mr-2 h-4 w-4 text-gray-400 flex-shrink-0" />
                    {company?.address || 'No address provided'}
                  </p>
                )}
              </div>
              
              <div className="sm:col-span-1 mt-4">
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                  City
                </label>
                {editing ? (
                  <input
                    type="text"
                    name="city"
                    id="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{company?.city || '-'}</p>
                )}
              </div>
              
              <div className="sm:col-span-1 mt-4">
                <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                  State/Province
                </label>
                {editing ? (
                  <input
                    type="text"
                    name="state"
                    id="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{company?.state || '-'}</p>
                )}
              </div>
              
              <div className="sm:col-span-1 mt-4">
                <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                  Country
                </label>
                {editing ? (
                  <input
                    type="text"
                    name="country"
                    id="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{company?.country || '-'}</p>
                )}
              </div>
              
              <div className="sm:col-span-1 mt-4">
                <label htmlFor="pincode" className="block text-sm font-medium text-gray-700">
                  ZIP/Postal Code
                </label>
                {editing ? (
                  <input
                    type="text"
                    name="pincode"
                    id="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{company?.pincode || '-'}</p>
                )}
              </div>
              
              {editing && id !== 'new' && (
                <div className="sm:col-span-3 mt-4 flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                    Active Company
                  </label>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Stats & Additional Info */}
      {id !== 'new' && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                  <FiUsers className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Employees
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {company?.employeeCount || 0}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-4 sm:px-6">
              <div className="text-sm">
                <a
                  href={`/admin/companies/${id}/employees`}
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  View all employees
                </a>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                  <FiCheckCircle className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Employees
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {company?.activeEmployeeCount || 0}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-4 sm:px-6">
              <div className="text-sm">
                <span className="text-gray-500">
                  Last updated {new Date(company.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <FiTrash2 className="h-6 w-6 text-red-600" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Delete Company
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to delete {company?.name}? This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyDetailPage;
