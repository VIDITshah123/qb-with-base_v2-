import React, { useState, useEffect } from 'react';
import { FiCheck, FiPlus, FiX, FiShield, FiUser, FiUserCheck } from 'react-icons/fi';
import { toast } from 'react-toastify';
import employeeService from '../../services/employeeService';

const RoleAssignment = ({ employeeId, companyId, currentRoles = [], onUpdate }) => {
  const [availableRoles, setAvailableRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch available roles
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await employeeService.getAvailableRoles(companyId);
        setAvailableRoles(response.data || []);
      } catch (error) {
        console.error('Error fetching roles:', error);
        toast.error('Failed to load available roles');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoles();
  }, [companyId]);

  // Handle role assignment
  const handleAssignRole = async () => {
    if (!selectedRole) return;
    
    try {
      setIsUpdating(true);
      const roleData = {
        role_id: selectedRole,
        company_id: companyId
      };
      
      await employeeService.assignRole(employeeId, companyId, roleData);
      
      // Find the assigned role details
      const assignedRole = availableRoles.find(role => role.role_id === selectedRole);
      
      // Update local state
      onUpdate([...currentRoles, {
        role_id: selectedRole,
        role_name: assignedRole?.role_name || 'Unknown Role',
        permissions: assignedRole?.permissions || []
      }]);
      
      toast.success('Role assigned successfully');
      setSelectedRole('');
      setIsAddingRole(false);
    } catch (error) {
      console.error('Error assigning role:', error);
      toast.error(error.response?.data?.message || 'Failed to assign role');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle role removal
  const handleRemoveRole = async (roleId) => {
    try {
      setIsUpdating(true);
      await employeeService.removeRole(employeeId, roleId, companyId);
      
      // Update local state
      onUpdate(currentRoles.filter(role => role.role_id !== roleId));
      
      toast.success('Role removed successfully');
    } catch (error) {
      console.error('Error removing role:', error);
      toast.error('Failed to remove role');
    } finally {
      setIsUpdating(false);
    }
  };

  // Get available roles that aren't already assigned
  const getUnassignedRoles = () => {
    const assignedRoleIds = currentRoles.map(role => role.role_id);
    return availableRoles.filter(role => !assignedRoleIds.includes(role.role_id));
  };

  if (isLoading) {
    return (
      <div className="flex items-center text-gray-500">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-2"></div>
        Loading roles...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {currentRoles.length > 0 ? (
          currentRoles.map((role) => (
            <div
              key={role.role_id}
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
            >
              <FiShield className="mr-1.5 h-3.5 w-3.5" />
              {role.role_name}
              <button
                type="button"
                onClick={() => handleRemoveRole(role.role_id)}
                disabled={isUpdating}
                className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-white bg-opacity-50 hover:bg-opacity-100 text-indigo-600 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500"
              >
                <FiX className="h-2.5 w-2.5" />
              </button>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500">No roles assigned</p>
        )}
      </div>

      {!isAddingRole ? (
        <button
          type="button"
          onClick={() => setIsAddingRole(true)}
          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <FiPlus className="-ml-0.5 mr-1.5 h-3.5 w-3.5" />
          Add Role
        </button>
      ) : (
        <div className="flex items-center space-x-2">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="block w-64 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="">Select a role</option>
            {getUnassignedRoles().map((role) => (
              <option key={role.role_id} value={role.role_id}>
                {role.role_name}
              </option>
            ))}
          </select>
          
          <button
            type="button"
            onClick={handleAssignRole}
            disabled={!selectedRole || isUpdating}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiCheck className="-ml-0.5 mr-1.5 h-4 w-4" />
            {isUpdating ? 'Assigning...' : 'Assign'}
          </button>
          
          <button
            type="button"
            onClick={() => {
              setIsAddingRole(false);
              setSelectedRole('');
            }}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FiX className="-ml-0.5 mr-1.5 h-4 w-4" />
            Cancel
          </button>
        </div>
      )}

      {/* Permissions Summary */}
      {currentRoles.length > 0 && (
        <div className="mt-4 border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Effective Permissions</h4>
          <div className="flex flex-wrap gap-2">
            {(() => {
              // Get all unique permissions from all assigned roles
              const allPermissions = [];
              currentRoles.forEach(role => {
                if (role.permissions && Array.isArray(role.permissions)) {
                  role.permissions.forEach(permission => {
                    if (!allPermissions.some(p => p.name === permission.name)) {
                      allPermissions.push(permission);
                    }
                  });
                }
              });

              return allPermissions.length > 0 ? (
                allPermissions.map((permission, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                  >
                    <FiCheck className="mr-1 h-3 w-3" />
                    {permission.name}
                  </span>
                ))
              ) : (
                <p className="text-sm text-gray-500">No specific permissions defined</p>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleAssignment;
