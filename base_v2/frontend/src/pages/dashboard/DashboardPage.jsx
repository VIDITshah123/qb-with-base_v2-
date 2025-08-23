import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FiFileText, FiPlusCircle, FiUsers, FiClock, FiCheckCircle } from 'react-icons/fi';

const DashboardPage = () => {
  const { user } = useAuth();

  // Mock data - in a real app, this would come from an API
  const stats = [
    { name: 'Total Questions', value: '1,234', icon: FiFileText, change: '+12%', changeType: 'increase' },
    { name: 'Questions This Month', value: '128', icon: FiClock, change: '+5%', changeType: 'increase' },
    { name: 'Questions Reviewed', value: '892', icon: FiCheckCircle, change: '+8%', changeType: 'increase' },
    { name: 'Active Users', value: '42', icon: FiUsers, change: '+3%', changeType: 'increase' },
  ];

  const recentActivity = [
    { id: 1, user: 'John Doe', action: 'created a new question', time: '2 minutes ago', link: '/questions/123' },
    { id: 2, user: 'Jane Smith', action: 'updated a question', time: '15 minutes ago', link: '/questions/456' },
    { id: 3, user: 'Alex Johnson', action: 'commented on a question', time: '1 hour ago', link: '/questions/789' },
    { id: 4, user: 'Sarah Williams', action: 'reviewed a question', time: '3 hours ago', link: '/questions/101' },
    { id: 5, user: 'Michael Brown', action: 'created a new question', time: '1 day ago', link: '/questions/112' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.firstName || 'User'}!
        </h1>
        <div className="flex space-x-3">
          <Link
            to="/questions/create"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FiPlusCircle className="mr-2 h-5 w-5" />
            New Question
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white overflow-hidden shadow rounded-lg"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <stat.icon
                    className="h-6 w-6 text-gray-400"
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
                      <div
                        className={`ml-2 flex items-baseline text-sm font-semibold ${
                          stat.changeType === 'increase'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {stat.change}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Recent Activity
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Latest actions in the system
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
                to="/activity"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                View all activity
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Quick Actions
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <Link
                to="/questions/create"
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FiPlusCircle className="mr-2 h-5 w-5" />
                Create New Question
              </Link>
              <Link
                to="/questions"
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FiFileText className="mr-2 h-5 w-5" />
                Browse Questions
              </Link>
              {user?.roles?.includes('admin') && (
                <Link
                  to="/admin/users"
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FiUsers className="mr-2 h-5 w-5" />
                  Manage Users
                </Link>
              )}
            </div>
          </div>

          {/* Recent Questions */}
          <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Recent Questions
              </h3>
            </div>
            <div className="divide-y divide-gray-200">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="px-4 py-3 hover:bg-gray-50">
                  <Link
                    to={`/questions/${i}`}
                    className="block text-sm font-medium text-blue-600 hover:text-blue-900 truncate"
                  >
                    Sample Question {i} - This is a sample question title that might be long and need to be truncated
                  </Link>
                  <div className="mt-1 flex items-center text-xs text-gray-500">
                    <span>2 days ago</span>
                    <span className="mx-1">•</span>
                    <span>5 answers</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-4 bg-gray-50 text-right text-sm">
              <Link
                to="/questions"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                View all questions
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
