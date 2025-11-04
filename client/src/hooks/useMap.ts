import { useState, useCallback } from 'react'
import { Coordinates } from '../types'
import { mapHelpers } from '../utils/mapHelpers'

interface UseMapOptions {
  initialCenter?: Coordinates
  initialZoom?: number
  onLocationChange?: (coordinates: Coordinates) => void
}

interface UseMapReturn {
  center: Coordinates
  zoom: number
  selectedLocation: Coordinates | null
  setCenter: (coordinates: Coordinates) => void
  setZoom: (zoom: number) => void
  setSelectedLocation: (coordinates: Coordinates | null) => void
  handleMapClick: (coordinates: Coordinates) => void
  getCurrentLocation: () => Promise<Coordinates | null>
  calculateDistance: (coord1: Coordinates, coord2: Coordinates) => number
  handleLocationSelection: (coordinates: Coordinates) => void
}

export function useMap(options: UseMapOptions = {}): UseMapReturn {
  const {
    initialCenter = { lat: 40.7128, lng: -74.0060 }, // Default to NYC
    initialZoom = 10,
    onLocationChange,
  } = options

  const [center, setCenter] = useState<Coordinates>(initialCenter)
  const [zoom, setZoom] = useState(initialZoom)
  const [selectedLocation, setSelectedLocation] = useState<Coordinates | null>(null)

  // Auto-center on selected location only when explicitly set
  const handleLocationSelection = useCallback((coordinates: Coordinates) => {
    setSelectedLocation(coordinates)
    setCenter(coordinates) // Center immediately when user selects
    onLocationChange?.(coordinates)
  }, [onLocationChange])

  const handleMapClick = useCallback((coordinates: Coordinates) => {
    handleLocationSelection(coordinates)
  }, [handleLocationSelection])

  const getCurrentLocation = useCallback((): Promise<Coordinates | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null)
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coordinates: Coordinates = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          // Set the location and center the map
          handleLocationSelection(coordinates)
          resolve(coordinates)
        },
        () => {
          resolve(null)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      )
    })
  }, [handleLocationSelection])

  const calculateDistance = useCallback((coord1: Coordinates, coord2: Coordinates) => {
    return mapHelpers.calculateDistance(coord1, coord2)
  }, [])

  return {
    center,
    zoom,
    selectedLocation,
    setCenter,
    setZoom,
    setSelectedLocation,
    handleMapClick,
    getCurrentLocation,
    calculateDistance,
    handleLocationSelection,
  }
}
