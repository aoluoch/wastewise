export interface WasteReport {
  id: string;
  _id: string; // For MongoDB compatibility
  userId: string;
  type: WasteType;
  description: string;
  location: {
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  images: string[];
  status: ReportStatus;
  priority: Priority;
  estimatedVolume: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  assignedCollectorId?: string;
  scheduledPickupDate?: string;
  completedAt?: string;
}

export type WasteType =
  | 'household'
  | 'electronic'
  | 'hazardous'
  | 'organic'
  | 'recyclable'
  | 'construction'
  | 'other';

export type ReportStatus =
  | 'pending'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface CreateReportData {
  type: WasteType;
  description: string;
  location: {
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  images: File[];
  estimatedVolume: number;
  notes?: string;
}

export interface ReportFilters {
  status?: ReportStatus[];
  type?: WasteType[];
  priority?: Priority[];
  dateRange?: {
    start: string;
    end: string;
  };
}
