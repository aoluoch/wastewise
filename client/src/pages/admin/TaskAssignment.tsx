import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../context/ToastContext';
import { axiosInstance } from '../../api/axiosInstance';

interface Report {
  _id: string;
  type: string;
  description: string;
  location: {
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  county: string;
  constituency: string;
  priority: string;
  estimatedVolume: number;
  status: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    county?: string;
    constituency?: string;
  };
  assignedCollectorId?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
}

interface Collector {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  county?: string;
  constituency?: string;
}

interface AssignmentFormData {
  collectorId: string;
  scheduledDate: string;
  estimatedDuration: number;
  notes: string;
}

const TaskAssignment: React.FC = () => {
  const { showToast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [formData, setFormData] = useState<AssignmentFormData>({
    collectorId: '',
    scheduledDate: '',
    estimatedDuration: 30,
    notes: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCounty, setFilterCounty] = useState('');
  const [filterConstituency, setFilterConstituency] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  // Fetch pending reports
  const fetchPendingReports = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/admin/pending-reports', {
        params: { page: currentPage, limit: 10 },
      });
      const data = response.data;

      if (data?.success) {
        setReports(data.data?.reports || []);
        setTotalPages(data.data?.pagination?.totalPages || 1);
      } else {
        showToast({
          type: 'error',
          title: 'Error',
          message: data?.message || 'Failed to load pending reports',
        });
        setReports([]);
        setTotalPages(1);
      }
    } catch (error: unknown) {
      showToast({
        type: 'error',
        title: 'Connection Error',
        message:
          error instanceof Error
            ? error.message
            : 'Unable to connect to server. Please check your connection.',
      });
      setReports([]);
      setTotalPages(1);
    }
  }, [currentPage, showToast]);

  // Fetch active collectors
  const fetchCollectors = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/admin/collectors');
      const data = response.data;
      setCollectors(data?.data || []);
    } catch (error: unknown) {
      showToast({
        type: 'error',
        title: 'Error',
        message:
          error instanceof Error ? error.message : 'Failed to load collectors',
      });
      setCollectors([]);
    }
  }, [showToast]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchPendingReports(), fetchCollectors()]);
      setLoading(false);
    };
    loadData();
  }, [fetchPendingReports, fetchCollectors]);

  const handleAssignCollector = (report: Report) => {
    setSelectedReport(report);
    setFormData({
      collectorId: '',
      scheduledDate: '',
      estimatedDuration: 30,
      notes: '',
    });
    setShowAssignmentModal(true);
  };

  const handleSubmitAssignment = async () => {
    if (!selectedReport || !formData.collectorId || !formData.scheduledDate) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Please fill in all required fields',
      });
      return;
    }

    setAssigning(selectedReport._id);
    try {
      await axiosInstance.post('/admin/assign-collector', {
        reportId: selectedReport._id,
        collectorId: formData.collectorId,
        scheduledDate: formData.scheduledDate,
        estimatedDuration: formData.estimatedDuration,
        notes: formData.notes,
      });

      showToast({
        type: 'success',
        title: 'Success',
        message: 'Collector assigned successfully',
      });

      setShowAssignmentModal(false);
      setSelectedReport(null);
      fetchPendingReports(); // Refresh the list
    } catch (error: unknown) {
      showToast({
        type: 'error',
        title: 'Error',
        message:
          error instanceof Error ? error.message : 'Failed to assign collector',
      });
    } finally {
      setAssigning(null);
    }
  };

  // Filter reports based on search and filters
  const filteredReports = reports.filter(report => {
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        report.description.toLowerCase().includes(search) ||
        report.type.toLowerCase().includes(search) ||
        report.location.address.toLowerCase().includes(search) ||
        `${report.userId.firstName} ${report.userId.lastName}`
          .toLowerCase()
          .includes(search) ||
        report.userId.email.toLowerCase().includes(search);

      if (!matchesSearch) return false;
    }

    // County filter
    if (filterCounty && report.county !== filterCounty) {
      return false;
    }

    // Constituency filter
    if (filterConstituency && report.constituency !== filterConstituency) {
      return false;
    }

    // Priority filter
    if (filterPriority && report.priority !== filterPriority) {
      return false;
    }

    return true;
  });

  // Get unique counties and constituencies from reports
  const availableCounties = [
    ...new Set(reports.map(r => r.county).filter(Boolean)),
  ];
  const availableConstituencies = filterCounty
    ? [
        ...new Set(
          reports
            .filter(r => r.county === filterCounty)
            .map(r => r.constituency)
            .filter(Boolean)
        ),
      ]
    : [...new Set(reports.map(r => r.constituency).filter(Boolean))];

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'assigned':
        return 'bg-purple-100 text-purple-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 dark:bg-gray-900 p-6'>
        <div className='max-w-7xl mx-auto'>
          <div className='animate-pulse'>
            <div className='h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6'></div>
            <div className='space-y-4'>
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className='bg-white dark:bg-gray-800 p-6 rounded-lg shadow'
                >
                  <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2'></div>
                  <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2'></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900 p-6'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='mb-6'>
          <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>
            📋 Task Assignment
          </h1>
          <p className='text-gray-600 dark:text-gray-300 mt-2'>
            Assign collectors to waste reports for pickup
          </p>
        </div>

        {/* Search and Filters */}
        <div className='bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-100 dark:border-gray-700 p-6 mb-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4'>
            {/* Search */}
            <div className='lg:col-span-2'>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2'>
                Search Reports
              </label>
              <input
                type='text'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder='Search by description, type, location, or reporter...'
                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              />
            </div>

            {/* County Filter */}
            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2'>
                County
              </label>
              <select
                value={filterCounty}
                onChange={e => {
                  setFilterCounty(e.target.value);
                  setFilterConstituency('');
                }}
                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              >
                <option value=''>All Counties</option>
                {availableCounties.map(county => (
                  <option key={county} value={county}>
                    {county}
                  </option>
                ))}
              </select>
            </div>

            {/* Constituency Filter */}
            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2'>
                Constituency
              </label>
              <select
                value={filterConstituency}
                onChange={e => setFilterConstituency(e.target.value)}
                disabled={!filterCounty}
                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50'
              >
                <option value=''>All Constituencies</option>
                {availableConstituencies.map(constituency => (
                  <option key={constituency} value={constituency}>
                    {constituency}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2'>
                Priority
              </label>
              <select
                value={filterPriority}
                onChange={e => setFilterPriority(e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              >
                <option value=''>All Priorities</option>
                <option value='urgent'>Urgent</option>
                <option value='high'>High</option>
                <option value='medium'>Medium</option>
                <option value='low'>Low</option>
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          {(searchTerm ||
            filterCounty ||
            filterConstituency ||
            filterPriority) && (
            <div className='mt-4 flex items-center justify-between'>
              <p className='text-sm text-gray-600 dark:text-gray-300'>
                Showing {filteredReports.length} of {reports.length} reports
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterCounty('');
                  setFilterConstituency('');
                  setFilterPriority('');
                }}
                className='text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300'
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Reports List */}
        <div className='bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-100 dark:border-gray-700'>
          <div className='p-6 border-b border-gray-200 dark:border-gray-700'>
            <h2 className='text-lg font-semibold text-gray-900 dark:text-white'>
              Pending Reports ({filteredReports.length})
            </h2>
          </div>

          {filteredReports.length === 0 ? (
            <div className='p-8 text-center text-gray-500 dark:text-gray-400'>
              <span className='text-6xl mb-4 block'>📋</span>
              <h3 className='text-lg font-medium mb-2 text-gray-700 dark:text-gray-200'>
                {reports.length === 0
                  ? 'No Reports Found'
                  : 'No Matching Reports'}
              </h3>
              <p className='text-sm text-gray-600 dark:text-gray-400'>
                {reports.length === 0
                  ? 'There are currently no pending reports that need collector assignment.'
                  : 'Try adjusting your search or filter criteria.'}
              </p>
            </div>
          ) : (
            <div className='divide-y divide-gray-200 dark:divide-gray-700'>
              {filteredReports.map(report => (
                <div
                  key={report._id}
                  className='p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors'
                >
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      <div className='flex items-center space-x-3 mb-2'>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(report.priority)}`}
                        >
                          {report.priority.toUpperCase()} PRIORITY
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}
                        >
                          {report.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className='px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'>
                          {report.type.toUpperCase()}
                        </span>
                      </div>

                      <h3 className='text-lg font-medium text-gray-900 dark:text-white mb-2'>
                        {report.description}
                      </h3>

                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-300'>
                        <div>
                          <p>
                            <strong>📍 Location:</strong>{' '}
                            {report.location.address}
                          </p>
                          {(report.county || report.constituency) && (
                            <p>
                              <strong>🗺️ Waste Location:</strong>{' '}
                              {report.county}
                              {report.constituency &&
                                `, ${report.constituency}`}
                            </p>
                          )}
                          <p>
                            <strong>👤 Reporter:</strong>{' '}
                            {report.userId.firstName} {report.userId.lastName}
                          </p>
                          <p>
                            <strong>📧 Email:</strong> {report.userId.email}
                          </p>
                          {report.userId.phone && (
                            <p>
                              <strong>📞 Phone:</strong> {report.userId.phone}
                            </p>
                          )}
                        </div>
                        <div>
                          <p>
                            <strong>📦 Volume:</strong> {report.estimatedVolume}{' '}
                            kg
                          </p>
                          <p>
                            <strong>📅 Reported:</strong>{' '}
                            {new Date(report.createdAt).toLocaleDateString()}
                          </p>
                          {report.assignedCollectorId && (
                            <p>
                              <strong>👷 Assigned to:</strong>{' '}
                              {report.assignedCollectorId.firstName}{' '}
                              {report.assignedCollectorId.lastName}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className='ml-4'>
                      <button
                        onClick={() => handleAssignCollector(report)}
                        disabled={assigning === report._id}
                        className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2'
                      >
                        {assigning === report._id ? (
                          <>
                            <span className='animate-spin'>⏳</span>
                            <span>Assigning...</span>
                          </>
                        ) : (
                          <>
                            <span>👷</span>
                            <span>Assign Collector</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className='p-6 border-t border-gray-200 dark:border-gray-700'>
              <div className='flex items-center justify-between'>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className='px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  Previous
                </button>
                <span className='text-sm text-gray-600 dark:text-gray-300'>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage(prev => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                  className='px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Assignment Modal */}
        {showAssignmentModal && selectedReport && (
          <div className='fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50'>
            <div className='bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-gray-700'>
              <div className='p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                    Assign Collector
                  </h3>
                  <button
                    onClick={() => setShowAssignmentModal(false)}
                    className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                  >
                    ✕
                  </button>
                </div>

                <div className='space-y-4'>
                  {/* Report Info */}
                  <div className='bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg'>
                    <h4 className='font-medium text-gray-900 dark:text-white mb-2'>
                      Report Details
                    </h4>
                    <p className='text-sm text-gray-600 dark:text-gray-300 mb-1'>
                      <strong>Type:</strong> {selectedReport.type}
                    </p>
                    <p className='text-sm text-gray-600 dark:text-gray-300 mb-1'>
                      <strong>Description:</strong> {selectedReport.description}
                    </p>
                    <p className='text-sm text-gray-600 dark:text-gray-300 mb-1'>
                      <strong>Location:</strong>{' '}
                      {selectedReport.location.address}
                    </p>
                    <p className='text-sm text-gray-600 dark:text-gray-300'>
                      <strong>Volume:</strong> {selectedReport.estimatedVolume}{' '}
                      kg
                    </p>
                  </div>

                  {/* Collector Selection */}
                  <div>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2'>
                      Select Collector *
                    </label>
                    <select
                      value={formData.collectorId}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          collectorId: e.target.value,
                        }))
                      }
                      className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    >
                      <option value=''>Choose a collector...</option>
                      {/* Collectors from same area (prioritized) */}
                      {collectors
                        .filter(c => c.county === selectedReport.county)
                        .map(collector => (
                          <option key={collector._id} value={collector._id}>
                            ⭐ {collector.firstName} {collector.lastName} -{' '}
                            {collector.county}
                            {collector.constituency &&
                              `, ${collector.constituency}`}
                          </option>
                        ))}
                      {/* Other collectors */}
                      {collectors.filter(
                        c => c.county !== selectedReport.county
                      ).length > 0 && (
                        <option disabled>─── Other Areas ───</option>
                      )}
                      {collectors
                        .filter(c => c.county !== selectedReport.county)
                        .map(collector => (
                          <option key={collector._id} value={collector._id}>
                            {collector.firstName} {collector.lastName}
                            {collector.county && ` - ${collector.county}`}
                            {collector.constituency &&
                              `, ${collector.constituency}`}
                          </option>
                        ))}
                    </select>
                    <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                      ⭐ Collectors from {selectedReport.county} are shown first
                    </p>
                  </div>

                  {/* Scheduled Date */}
                  <div>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2'>
                      Scheduled Date *
                    </label>
                    <input
                      type='datetime-local'
                      value={formData.scheduledDate}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          scheduledDate: e.target.value,
                        }))
                      }
                      className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>

                  {/* Estimated Duration */}
                  <div>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2'>
                      Estimated Duration (minutes)
                    </label>
                    <input
                      type='number'
                      min='5'
                      max='480'
                      value={formData.estimatedDuration}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          estimatedDuration: parseInt(e.target.value) || 30,
                        }))
                      }
                      className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2'>
                      Notes (optional)
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      rows={3}
                      maxLength={200}
                      className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      placeholder='Special instructions for the collector...'
                    />
                    <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                      {formData.notes.length}/200 characters
                    </p>
                  </div>
                </div>

                <div className='flex space-x-3 mt-6'>
                  <button
                    onClick={() => setShowAssignmentModal(false)}
                    className='flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-100 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors'
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitAssignment}
                    disabled={assigning === selectedReport._id}
                    className='flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors'
                  >
                    {assigning === selectedReport._id
                      ? 'Assigning...'
                      : 'Assign Collector'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskAssignment;
