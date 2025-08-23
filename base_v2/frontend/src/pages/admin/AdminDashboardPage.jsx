import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FiUsers, 
  FiBriefcase, 
  FiShield, 
  FiBarChart2, 
  FiSettings, 
  FiAlertCircle,
  FiClock,
  FiCheckCircle,
  FiTrendingUp,
  FiRefreshCw
} from 'react-icons/fi';
import adminService from '../../services/adminService';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AdminDashboardPage = () => {
  const [stats, setStats] = useState([
    { name: 'Total Users', value: 'Loading...', icon: FiUsers, link: '/admin/users' },
    { name: 'Active Companies', value: 'Loading...', icon: FiBriefcase, link: '/admin/companies' },
    { name: 'Pending Approvals', value: 'Loading...', icon: FiClock, link: '/admin/approvals', alert: true },
    { name: 'System Health', value: 'Checking...', icon: FiCheckCircle, link: '/admin/system' },
  ]);
  
  const [recentActivity, setRecentActivity] = useState([]);
  const [quickLinks, setQuickLinks] = useState([]);
  const [systemAlert, setSystemAlert] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();

  const fetchDashboardData = async (isRefresh = false) => {
    try {
      if (!isRefresh) setIsLoading(true);
      else setIsRefreshing(true);

      // Fetch all data in parallel
      const [statsData, activityData, linksData, alertsData] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getRecentActivity(),
        adminService.getQuickLinks(),
        adminService.getSystemAlerts()
      ]);

      // Update stats
      setStats([
        { 
          ...stats[0], 
          value: statsData.totalUsers?.toLocaleString() || '0',
          change: statsData.userGrowth ? `+${statsData.userGrowth}%` : null,
          changeType: 'increase'
        },
        { 
          ...stats[1], 
          value: statsData.activeCompanies?.toLocaleString() || '0',
          change: statsData.companyGrowth ? `+${statsData.companyGrowth}%` : null,
          changeType: 'increase'
        },
        { 
          ...stats[2], 
          value: statsData.pendingApprovals?.toString() || '0',
          change: statsData.newApprovals ? `+${statsData.newApprovals}` : null,
          changeType: statsData.newApprovals > 0 ? 'increase' : 'decrease',
          alert: statsData.pendingApprovals > 0
        },
        { 
          ...stats[3], 
          value: statsData.systemStatus || 'Unknown',
          status: statsData.systemStatus === 'Operational' ? 'good' : 'bad'
        }
      ]);

      // Update recent activity
      if (activityData && activityData.length > 0) {
        setRecentActivity(activityData.map(activity => ({
          id: activity.id,
          user: activity.userName,
          action: activity.action,
          time: formatTimeAgo(activity.timestamp),
          link: activity.link
        })));
      }

      // Update quick links
      if (linksData && linksData.length > 0) {
        setQuickLinks(linksData.map(link => {
          const iconMap = {
            'users': FiUsers,
            'briefcase': FiBriefcase,
            'settings': FiSettings,
            'file-text': FiBarChart2,
            'shield': FiShield,
            'activity': FiTrendingUp
          };
          
          const colorMap = {
            'users': 'bg-blue-100 text-blue-600',
            'briefcase': 'bg-green-100 text-green-600',
            'settings': 'bg-purple-100 text-purple-600',
            'file-text': 'bg-yellow-100 text-yellow-600',
            'shield': 'bg-red-100 text-red-600',
            'activity': 'bg-indigo-100 text-indigo-600'
          };

          return {
            name: link.name,
            description: link.description || '',
            icon: iconMap[link.icon] || FiSettings,
            link: link.path || link.link,
            color: colorMap[link.icon] || 'bg-gray-100 text-gray-600'
          };
        }));
      }

      // Update system alert
      if (alertsData && alertsData.length > 0) {
        setSystemAlert(alertsData[0]); // Show the most critical alert
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRunBackup = async () => {
    try {
      await adminService.runBackup();
      toast.success('Backup started successfully');
      // Refresh data after backup
      fetchDashboardData(true);
    } catch (error) {
      console.error('Error running backup:', error);
      toast.error('Failed to start backup');
    }
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Just now';
    
    const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
    
    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
      second: 1
    };
    
    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        return interval === 1 ? `${interval} ${unit} ago` : `${interval} ${unit}s ago`;
      }
    }
    
    return 'Just now';
  };

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
    
    // Set up auto-refresh every 5 minutes
    const refreshInterval = setInterval(() => {
      fetchDashboardData(true);
    }, 5 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <button
              onClick={() => fetchDashboardData(true)}
              disabled={isRefreshing}
              className="ml-3 p-1 text-gray-500 hover:text-gray-700 focus:outline-none"
              title="Refresh data"
            >
              <FiRefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Overview of your application's administration
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={() => navigate('/admin/settings')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FiSettings className="mr-2 h-5 w-5 text-gray-500" />
            Settings
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.name}
            to={stat.link}
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200"
          >
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <stat.icon
                    className={`h-8 w-8 ${stat.alert ? 'text-yellow-500' : 'text-gray-400'}`}
                    aria-hidden="true"
                  />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stat.value}
                      </div>
                      {stat.change && (
                        <div
                          className={`ml-2 flex items-baseline text-sm font-semibold ${
                            stat.changeType === 'increase'
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {stat.change}
                        </div>
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Links */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Links</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {quickLinks.map((link) => (
              <Link
                key={link.name}
                to={link.link}
                className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200"
              >
                <div className="p-5">
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-md ${link.color} bg-opacity-50`}>
                      <link.icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        {link.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {link.description}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Recent Activity
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                System and user activities
              </p>
            </div>
            <div className="bg-white overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {recentActivity.map((activity) => (
                  <li key={activity.id} className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="min-w-0 flex-1">
                        <Link
                          to={activity.link}
                          className="text-sm font-medium text-blue-600 hover:text-blue-900 truncate"
                        >
                          {activity.user}{' '}
                          <span className="text-gray-500 font-normal">
                            {activity.action}
                          </span>
                        </Link>
                        <p className="text-sm text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="px-4 py-4 bg-gray-50 text-right text-sm">
              <Link
                to="/admin/activity"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                View all activity
              </Link>
            </div>
          </div>

          {/* System Alerts */}
          <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                System Alerts
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Important system notifications
              </p>
            </div>
            <div className="p-4">
              {systemAlert ? (
                <div className="rounded-md bg-yellow-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <FiAlertCircle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        {systemAlert.title || 'System Alert'}
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>{systemAlert.message}</p>
                      </div>
                      {systemAlert.action === 'backup' && (
                        <div className="mt-4">
                          <div className="-mx-2 -my-1.5 flex">
                            <button
                              type="button"
                              onClick={handleRunBackup}
                              disabled={isRefreshing}
                              className="bg-yellow-50 px-2 py-1.5 rounded-md text-sm font-medium text-yellow-800 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-600"
                            >
                              {isRefreshing ? 'Processing...' : 'Run Backup Now'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No active alerts</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
