import React, { useEffect, useRef, useState } from 'react';
import type {
  Map as MapboxMap,
  Marker as MapboxMarker,
  MapMouseEvent,
} from 'mapbox-gl';
import { cn } from '../utils/formatters';

interface MapViewProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: Array<{
    id: string;
    position: { lat: number; lng: number };
    title?: string;
    description?: string;
    color?: string;
  }>;
  onMarkerClick?: (marker: {
    id: string;
    position: { lat: number; lng: number };
    title?: string;
    description?: string;
    color?: string;
  }) => void;
  onMapClick?: (position: { lat: number; lng: number }) => void;
  className?: string;
  height?: string;
  interactive?: boolean;
}

const MapView: React.FC<MapViewProps> = ({
  center = { lat: 40.7128, lng: -74.006 }, // Default to NYC
  zoom = 10,
  markers = [],
  onMarkerClick,
  onMapClick,
  className,
  height = '400px',
  interactive = true,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<MapboxMap | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const lastCenterRef = useRef<{ lat: number; lng: number } | null>(null);
  const lastZoomRef = useRef<number | null>(null);
  const mapInitializedRef = useRef(false);

  const runSearch = async () => {
    setSearchError(null);
    const token = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
    if (!token) {
      setSearchError('Missing Mapbox token');
      return;
    }
    const q = query.trim();
    if (!q) return;
    try {
      setSearching(true);
      const resp = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${token}&limit=1&types=place,locality,neighborhood,address,poi&language=en`
      );
      if (!resp.ok) throw new Error('Geocoding request failed');
      const data = await resp.json();
      const feature =
        data && Array.isArray(data.features) ? data.features[0] : null;
      if (!feature || !Array.isArray(feature.center)) {
        setSearchError('No results found');
        return;
      }
      const [lng, lat] = feature.center as [number, number];
      if (mapInstanceRef.current) {
        // Respect the feature zoom if available
        const targetZoom =
          typeof feature.properties?.['mapbox:zoom'] === 'number'
            ? Math.max(feature.properties['mapbox:zoom'], 10)
            : Math.max(12, lastZoomRef.current ?? zoom);
        mapInstanceRef.current.flyTo({ center: [lng, lat], zoom: targetZoom });
        lastCenterRef.current = { lat, lng };
        lastZoomRef.current = targetZoom;
      }
      if (typeof onMapClick === 'function') {
        onMapClick({ lat, lng });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Search failed';
      setSearchError(msg);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current || mapInitializedRef.current)
      return;

    const token = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
    if (!token) {
      setLoadError('Missing VITE_MAPBOX_TOKEN');
      return;
    }

    // Ensure Mapbox CSS is loaded
    const ensureCss = () => {
      const id = 'mapbox-gl-css';
      if (document.getElementById(id)) return;
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.6.0/mapbox-gl.css';
      document.head.appendChild(link);
    };
    ensureCss();

    let cancelled = false;
    (async () => {
      try {
        const mod = (await import('mapbox-gl')) as unknown as {
          default: typeof import('mapbox-gl');
        };
        const mapbox = mod.default;
        // @ts-expect-error legacy accessToken API available at runtime
        mapbox.accessToken = token;

        if (cancelled || !mapRef.current) return;

        const map = new mapbox.Map({
          container: mapRef.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [
            lastCenterRef.current?.lng ?? center.lng,
            lastCenterRef.current?.lat ?? center.lat,
          ],
          zoom: lastZoomRef.current ?? zoom,
          interactive,
        });

        mapInstanceRef.current = map;
        mapInitializedRef.current = true;

        map.on('load', () => {
          if (cancelled) return;
          setMapReady(true);
          const c = map.getCenter();
          lastCenterRef.current = { lat: c.lat, lng: c.lng };
          lastZoomRef.current = map.getZoom();
        });

        // Click handler will be set up in a separate effect

        map.on('moveend', () => {
          const c = map.getCenter();
          lastCenterRef.current = { lat: c.lat, lng: c.lng };
          lastZoomRef.current = map.getZoom();
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to load map';
        setLoadError(message);
      }
    })();

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        mapInitializedRef.current = false;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle center changes without recreating the map
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    const currentCenter = map.getCenter();
    const newCenter = [center.lng, center.lat] as [number, number];

    // Only move if the center has actually changed
    if (
      Math.abs(currentCenter.lng - center.lng) > 0.0001 ||
      Math.abs(currentCenter.lat - center.lat) > 0.0001
    ) {
      map.setCenter(newCenter);
    }
  }, [center.lat, center.lng, mapReady]);

  // Handle zoom changes without recreating the map
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    const currentZoom = map.getZoom();

    // Only change zoom if it has actually changed
    if (Math.abs(currentZoom - zoom) > 0.1) {
      map.setZoom(zoom);
    }
  }, [zoom, mapReady]);

  // Handle interactive changes
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    if (interactive && typeof onMapClick === 'function') {
      const handleClick = (e: MapMouseEvent) => {
        onMapClick({ lat: e.lngLat.lat, lng: e.lngLat.lng });
      };
      map.on('click', handleClick);

      return () => {
        map.off('click', handleClick);
      };
    }
  }, [interactive, onMapClick, mapReady]);

  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    // Cleanup existing markers
    const registryKey = '__ww_markers__';
    const existing =
      (map as unknown as Record<string, MapboxMarker[] | undefined>)[
        registryKey
      ] || [];
    existing.forEach(m => m.remove());

    const addMarker = async (
      m: Required<Required<MapViewProps>['markers']>[number] & { color: string }
    ) => {
      const mod = (await import('mapbox-gl')) as unknown as {
        default: typeof import('mapbox-gl');
      };
      const mapbox = mod.default;
      const el = document.createElement('div');
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.borderRadius = '50%';
      el.style.background = (m.color || '#3B82F6') as string;
      el.style.border = '2px solid #fff';
      el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.3)';
      el.style.cursor = 'pointer';
      el.title = m.title || '';
      el.addEventListener('click', e => {
        e.stopPropagation();
        onMarkerClick?.(m);
      });
      const marker = new mapbox.Marker({ element: el })
        .setLngLat([m.position.lng, m.position.lat])
        .addTo(map);
      created.push(marker);
    };

    const created: MapboxMarker[] = [];
    Promise.all(
      (markers || []).map(mk =>
        addMarker({
          id: mk.id,
          position: mk.position,
          title: mk.title,
          description: mk.description,
          color: mk.color || '#3B82F6',
        })
      )
    ).then(() => {
      (map as unknown as Record<string, MapboxMarker[]>)[registryKey] = created;
    });

    return () => {
      created.forEach(m => m.remove());
    };
  }, [markers, mapReady, onMarkerClick]);

  const handleFallbackClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (mapReady || !interactive || !onMapClick) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const lat = center.lat + (y - rect.height / 2) * 0.01;
    const lng = center.lng + (x - rect.width / 2) * 0.01;
    onMapClick({ lat, lng });
  };

  return (
    <div
      ref={mapRef}
      className={cn(
        'w-full rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700',
        interactive && 'cursor-pointer',
        className
      )}
      style={{ height }}
      onClick={handleFallbackClick}
    >
      {/* Search overlay (only after map is ready) */}
      {mapReady && (
        <div
          className='absolute z-10 top-2 left-2 right-2 md:right-auto md:w-96'
          onClick={e => e.stopPropagation()}
        >
          <div className='flex items-center space-x-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-2 shadow'>
            <input
              type='text'
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  runSearch();
                }
              }}
              placeholder='Search location (e.g., Nairobi)'
              className='flex-1 px-3 py-2 bg-transparent focus:outline-none text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400'
            />
            <button
              type='button'
              disabled={searching}
              onClick={e => {
                e.preventDefault();
                runSearch();
              }}
              className='px-3 py-2 text-sm rounded-md bg-blue-600 text-white disabled:opacity-60'
              aria-label='Search'
            >
              {searching ? 'Searching…' : 'Search'}
            </button>
          </div>
          {searchError && (
            <div className='mt-1 text-xs text-red-600'>{searchError}</div>
          )}
        </div>
      )}

      {!mapReady && (
        <div className='w-full h-full bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center'>
          <div className='text-center text-gray-500 dark:text-gray-400'>
            <div className='text-4xl mb-2'>🗺️</div>
            <p>{loadError ? 'Map failed to load' : 'Loading map...'}</p>
            {loadError && <p className='text-xs mt-1'>{loadError}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;
