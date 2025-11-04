import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { reportsApi } from '../../api/reportsApi'
import Button from '../../components/Button'
import { useAuth } from '../../hooks/useAuth'

interface ReportFeedItem {
  _id: string
  type: string
  description: string
  images: string[]
  location: {
    address: string
    coordinates: {
      lat: number
      lng: number
    }
  }
  status: string
  priority: string
  estimatedVolume: number
  notes?: string
  userId: { 
    _id: string
    firstName: string
    lastName: string
    email: string 
  }
  createdAt: string
  updatedAt: string
}

const Feed: React.FC = () => {
	const qc = useQueryClient()
	const { user } = useAuth()
	const { data: reports = [], isLoading, error } = useQuery({ 
		queryKey: ['reports','feed'], 
		queryFn: async () => {
			return await reportsApi.getFeed()
		},
		refetchOnWindowFocus: false,
		staleTime: 0 // Always consider data stale to ensure fresh data
	})
	const deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			return await reportsApi.delete(id)
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['reports','feed'] })
			// Also try to refetch immediately
			qc.refetchQueries({ queryKey: ['reports','feed'] })
		}
	})

	if (isLoading) return <div>Loading feed...</div>
	
	if (error) {
		return <div>Error loading feed: {error.message}</div>
	}

	return (
		<div className="max-w-5xl mx-auto space-y-4">
			<h1 className="text-2xl font-bold">Community Waste Reports</h1>
			{reports.length === 0 ? (
				<div className="text-center py-8">
					<p className="text-gray-500">No reports found. Be the first to report waste in your community!</p>
				</div>
			) : (
				<div className="grid gap-4">
					{reports.map((r: ReportFeedItem) => (
						<div key={r._id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
							<div className="flex items-start justify-between">
								<div className="flex-1">
									<div className="flex items-center gap-2 mb-2">
										<Link to={`/reports/${r._id}`} className="text-lg font-semibold hover:underline capitalize">
											{r.type} Waste Report
										</Link>
										<span className={`px-2 py-1 text-xs rounded-full ${
											r.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
											r.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
											r.status === 'in_progress' ? 'bg-orange-100 text-orange-800' :
											r.status === 'completed' ? 'bg-green-100 text-green-800' :
											'bg-red-100 text-red-800'
										}`}>
											{r.status.replace('_', ' ')}
										</span>
										<span className={`px-2 py-1 text-xs rounded-full ${
											r.priority === 'low' ? 'bg-gray-100 text-gray-800' :
											r.priority === 'medium' ? 'bg-blue-100 text-blue-800' :
											r.priority === 'high' ? 'bg-orange-100 text-orange-800' :
											'bg-red-100 text-red-800'
										}`}>
											{r.priority}
										</span>
									</div>
									<p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{r.description}</p>
									<div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
										<span>📍 {r.location?.address || 'Location not available'}</span>
										<span>📦 {r.estimatedVolume} m³</span>
										<span>👤 {r.userId?.firstName} {r.userId?.lastName}</span>
										<span>🕒 {new Date(r.createdAt).toLocaleString()}</span>
									</div>
									{r.images && r.images.length > 0 && (
										<div className="mt-2 flex gap-2">
											{r.images.slice(0, 3).map((img: string, idx: number) => (
												<img key={idx} src={img} alt={`Report ${idx}`} className="w-16 h-16 object-cover rounded" />
											))}
											{r.images.length > 3 && (
												<div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-xs">
													+{r.images.length - 3}
												</div>
											)}
										</div>
									)}
								</div>
								<div className="flex flex-col space-y-2 ml-4">
									<Link to={`/reports/${r._id}`}>
										<Button type="button" variant="outline" size="sm">View Details</Button>
									</Link>
									{/* Only show edit and delete buttons to the report owner */}
									{user && r.userId?._id && (user.id === r.userId._id || user._id === r.userId._id) && (
										<>
											<Link to={`/reports/${r._id}/edit`}>
												<Button type="button" variant="outline" size="sm">Edit</Button>
											</Link>
											<Button 
												type="button" 
												variant="ghost" 
												size="sm"
												onClick={() => {
													if (window.confirm('Are you sure you want to delete this report?')) {
														deleteMutation.mutate(r._id)
													}
												}}
											>
												Delete
											</Button>
										</>
									)}
								</div>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	)
}

export default Feed


