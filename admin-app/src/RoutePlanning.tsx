import { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import type { Pickup } from './types';

declare global {
  interface Window {
    google: typeof google;
    initMap: () => void;
  }
}

const generateRouteId = (address: string) => {
  const match = address.match(/\d+\s+(.+?)(?:\s+(?:Street|St|Road|Rd|Avenue|Ave|Drive|Dr|Lane|Ln|Circle|Cir|Court|Ct|Way|Place|Pl|Boulevard|Blvd)\.?)?(?:,|$)/i);
  if (match && match[1]) {
    return match[1].trim().replace(/\s+/g, '').toLowerCase();
  }
  return 'unmatched';
};

export function RoutePlanning({ pickups }: { pickups: Pickup[] }) {
  const [locations, setLocations] = useState<Array<{
    address: string;
    pickupLocation: string;
    routeId: string;
  }>>([]);
  const [filterText, setFilterText] = useState('');
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;
    
    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: 42.3601, lng: -71.0589 }, // Boston coordinates
      zoom: 12,
    });
    
    setMap(map);
    setGeocoder(new window.google.maps.Geocoder());
  }, [mapRef]);

  // Initialize locations from pickups
  useEffect(() => {
    if (!pickups || !map || !geocoder) return;
    
    const newLocations = pickups.map(pickup => ({
      address: `${pickup.line1}${pickup.line2 ? `, ${pickup.line2}` : ''}, ${pickup.city}, ${pickup.state}`,
      pickupLocation: '',
      routeId: generateRouteId(pickup.line1)
    }));
    
    setLocations(newLocations);

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    const newMarkers: google.maps.Marker[] = [];

    // Add markers for each location
    newLocations.forEach((location, index) => {
      geocoder.geocode({ address: location.address }, (results, status) => {
        if (status === 'OK' && results?.[0]?.geometry?.location) {
          const marker = new google.maps.Marker({
            map,
            position: results[0].geometry.location,
            label: location.routeId.substring(0, 1).toUpperCase(),
            title: location.address
          });
          newMarkers.push(marker);
        }
      });
    });

    setMarkers(newMarkers);
  }, [pickups, map, geocoder]);

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left pane - Future Map */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Map Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[500px] bg-muted rounded-lg" ref={mapRef}>
            </div>
          </CardContent>
        </Card>

        {/* Right pane - Route Planning */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Route Planning ({locations.length} locations)</CardTitle>
              <Input
                placeholder="Filter locations..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="w-[200px]"
              />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Address</TableHead>
                  <TableHead>Pickup Location</TableHead>
                  <TableHead>Route ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locations
                  .filter(loc => 
                    loc.address.toLowerCase().includes(filterText.toLowerCase()) ||
                    loc.pickupLocation.toLowerCase().includes(filterText.toLowerCase()) ||
                    loc.routeId.toLowerCase().includes(filterText.toLowerCase())
                  )
                  .map((location, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-sm">
                        {location.address}
                      </TableCell>
                      <TableCell>
                        <Input 
                          value={location.pickupLocation}
                          onChange={(e) => {
                            const newLocations = [...locations];
                            newLocations[index].pickupLocation = e.target.value;
                            setLocations(newLocations);
                          }}
                          placeholder="Override pickup location"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={location.routeId}
                          onChange={(e) => {
                            const newLocations = [...locations];
                            newLocations[index].routeId = e.target.value.toLowerCase();
                            setLocations(newLocations);
                          }}
                          placeholder="Route ID"
                          className="font-mono"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
