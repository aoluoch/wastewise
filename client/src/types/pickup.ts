export interface PickupTask {
  id: string;
  reportId: string;
  collectorId: string;
  status: PickupStatus;
  scheduledDate: string;
  estimatedDuration: number;
  actualStartTime?: string;
  actualEndTime?: string;
  notes?: string;
  completionNotes?: string;
  images?: string[];
  createdAt: string;
  updatedAt: string;
  report: {
    id: string;
    type: string;
    description: string;
    location: {
      address: string;
      coordinates: {
        lat: number;
        lng: number;
      };
    };
    priority: string;
    estimatedVolume: number;
  };
}

export type PickupStatus =
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rescheduled';

export interface PickupSchedule {
  id: string;
  collectorId: string;
  date: string;
  tasks: PickupTask[];
  totalEstimatedDuration: number;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface CreatePickupData {
  reportId: string;
  collectorId: string;
  scheduledDate: string;
  estimatedDuration: number;
  notes?: string;
}

export interface PickupFilters {
  status?: PickupStatus[];
  dateRange?: {
    start: string;
    end: string;
  };
  collectorId?: string;
}
