import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FiPlus, FiSearch, FiFilter, FiEdit2, FiTrash2, 
  FiChevronLeft, FiChevronRight, FiCheckCircle, FiXCircle 
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import companyService from '../../../services/companyService';

const CompaniesPage = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    sortBy: 'name',
    sortOrder: 'asc'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 1
  });
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState(null);
  
  const navigate = useNavigate();

  // Fetch companies
  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const { page, pageSize } = pagination;
      const response = await companyService.getCompanies({
        page,
        pageSize,
        search: searchTerm,
        ...filters
      });
      
      setCompanies(response.data);
      setPagination(prev => ({
        ...prev,
        totalItems: response.total,
        totalPages: Math.ceil(response.total / pageSize)
      }));
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast.error('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchCompanies();
  }, [pagination.page, pagination.pageSize, filters, searchTerm]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchCompanies();
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle company selection
  const toggleCompanySelection = (companyId) => {
    setSelectedCompanies(prev =>
      prev.includes(companyId)
        ? prev.filter(id => id !== companyId)
        : [...prev, companyId]
    );
  };

  // Handle delete confirmation
  const confirmDelete = (company) => {
    setCompanyToDelete(company);
    setShowDeleteModal(true);
  };

  // Handle company deletion
  const handleDelete = async () => {
    if (!companyToDelete) return;
    
    try {
      await companyService.deleteCompany(companyToDelete.id);
      toast.success('Company deleted successfully');
      setShowDeleteModal(false);
      fetchCompanies();
    } catch (error) {
      console.error('Error deleting company:', error);
      toast.error('Failed to delete company');
    }
  };

  // Handle bulk actions
  const handleBulkAction = async (action) => {
    if (selectedCompanies.length === 0) {
      toast.warning('Please select at least one company');
      return;
    }

    try {
      if (action === 'delete') {
        await Promise.all(selectedCompanies.map(id => companyService.deleteCompany(id)));
        toast.success('Selected companies deleted successfully');
      } else if (action === 'activate') {
        await Promise.all(selectedCompanies.map(id => companyService.updateCompanyStatus(id, true)));
        toast.success('Selected companies activated successfully');
      } else if (action === 'deactivate') {
        await Promise.all(selectedCompanies.map(id => companyService.updateCompanyStatus(id, false)));
        toast.success('Selected companies deactivated successfully');
      }
      
      setSelectedCompanies([]);
      fetchCompanies();
    } catch (error) {
      console.error(`Error performing ${action} on companies:`, error);
      toast.error(`Failed to ${action} selected companies`);
    }
  };

  // Render status badge
  const renderStatusBadge = (isActive) => (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
      isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
    }`}>
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Company Management
          </h2>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Link
            to="/admin/companies/new"
            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FiPlus className="-ml-1 mr-2 h-5 w-5" />
            Add Company
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CompaniesPage;
