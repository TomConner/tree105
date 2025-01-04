import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Pickup } from './types';

interface Location {
  lat: number;
  lng: number;
}

interface RouteLocation {
  address: string;
  pickupLocation: string;
  routeId: string;
  coordinates?: Location;
}

const RouteMap = ({ pickups }: { pickups: Pickup[] }) => {
  const [locations, setLocations] = useState<RouteLocation[]>([]);
  const [filterText, setFilterText] = useState('');

  useEffect(() => {
    // Convert pickups to route locations
    const initialLocations = pickups.map(pickup => ({
      address: `${pickup.line1}${pickup.line2 ? `, ${pickup.line2}` : ''}, ${pickup.city}, ${pickup.state}`,
      pickupLocation: '', // Default to empty, would be populated from backend in real implementation
      routeId: pickup.line1.split(' ')[1].replace(/\d+/g, '').replace(/(Rd|St|Ave|Dr)$/i, ''), // Simple default route ID
    }));
    setLocations(initialLocations);
  }, [pickups]);

  const handleRouteIdChange = (index: number, value: string) => {
    const newLocations = [...locations];
    newLocations[index].routeId = value;
    setLocations(newLocations);
  };

  const handlePickupLocationChange = (index: number, value: string) => {
    const newLocations = [...locations];
    newLocations[index].pickupLocation = value;
    setLocations(newLocations);
  };

  const filteredLocations = locations.filter(location => {
    const searchText = filterText.toLowerCase();
    return (
      location.address.toLowerCase().includes(searchText) ||
      location.pickupLocation.toLowerCase().includes(searchText) ||
      location.routeId.toLowerCase().includes(searchText)
    );
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Map Card */}
        <Card className="lg:row-span-2">
          <CardHeader>
            <CardTitle>Route Map</CardTitle>
          </CardHeader>
          <CardContent className="h-96">
            <div className="w-full h-full bg-gray-100 rounded-md flex items-center justify-center">
              {/* Google Maps would be initialized here */}
              <p className="text-gray-500">Map loading...</p>
            </div>
          </CardContent>
        </Card>

        {/* Route List Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle>Route Planning</CardTitle>
            <Input
              placeholder="Filter locations..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="max-w-xs"
            />
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Address</TableHead>
                    <TableHead>Pickup Location</TableHead>
                    <TableHead>Route ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLocations.map((location, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-sm">{location.address}</TableCell>
                      <TableCell>
                        <Input
                          value={location.pickupLocation}
                          onChange={(e) => handlePickupLocationChange(index, e.target.value)}
                          placeholder="Override pickup location..."
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={location.routeId}
                          onChange={(e) => handleRouteIdChange(index, e.target.value)}
                          placeholder="Route identifier..."
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RouteMap;
