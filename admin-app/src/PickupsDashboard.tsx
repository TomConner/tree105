import { useState } from 'react';
import { Pickup } from './types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString.replace(' ', 'T')); // Convert to ISO format
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error parsing date:', dateString);
    return dateString;
  }
};

interface PickupsDashboardProps {
  pickups: Pickup[];
}

const PickupsDashboard = ({ pickups = [] }: PickupsDashboardProps) => {
  const [filterText, setFilterText] = useState('');
  const [sortConfig, setSortConfig] = useState<{key: keyof Pickup, direction: 'asc' | 'desc'}>({ 
    key: 'order_created', 
    direction: 'desc' 
  });

  const handleSort = (key: keyof Pickup) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedPickups = [...pickups].sort((a, b) => {
    if (sortConfig.key === 'order_created') {
      return sortConfig.direction === 'asc'
        ? new Date(a.order_created).getTime() - new Date(b.order_created).getTime()
        : new Date(b.order_created).getTime() - new Date(a.order_created).getTime();
    }
    return sortConfig.direction === 'asc'
      ? String(a[sortConfig.key]).localeCompare(String(b[sortConfig.key]))
      : String(b[sortConfig.key]).localeCompare(String(a[sortConfig.key]));
  });

  const filteredPickups = sortedPickups.filter(pickup => {
    const searchText = filterText.toLowerCase();
    return (
      pickup.code.toLowerCase().includes(searchText) ||
      pickup.name.toLowerCase().includes(searchText) ||
      pickup.email.toLowerCase().includes(searchText) ||
      pickup.city.toLowerCase().includes(searchText) ||
      pickup.line1.toLowerCase().includes(searchText)
    );
  });

  const openCsvInNewTab = () => {
    // Create CSV header
    const headers = ['Created', 'Name', 'Address', 'Code', 'Method', 'Trees', 'Extra', 'Comment'];
    
    // Convert data to CSV rows
    const rows = filteredPickups.map(pickup => [
      formatDate(pickup.order_created),
      pickup.name,
      `${pickup.line1}${pickup.line2 ? `, ${pickup.line2}` : ''}, ${pickup.city}, ${pickup.state}`,
      pickup.code,
      pickup.method || 'Pending',
      pickup.numtrees,
      pickup.extra,
      pickup.comment
    ]);

    // Combine headers and rows
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => 
        // Quote cells that contain commas
        cell.toString().includes(',') ? `"${cell}"` : cell
      ).join(','))
    ].join('\n');

    // Create data URL and open in new tab
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
    
    // Cleanup
    setTimeout(() => window.URL.revokeObjectURL(url), 100);
  };

  const totalTrees = pickups.reduce((sum, pickup) => sum + (pickup.numtrees || 0), 0);
  const totalExtra = pickups.reduce((sum, pickup) => sum + (pickup.extra || 0), 0);
  const totalPickups = pickups.length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="py-4">
            <h2 className="text-sm font-semibold text-gray-500">Total Pickups</h2>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalPickups}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-4">
            <h2 className="text-sm font-semibold text-gray-500">Total Trees</h2>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalTrees}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-4">
            <h2 className="text-sm font-semibold text-gray-500">Total Extra Amount</h2>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${totalExtra}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h2 className="text-lg font-semibold">Tree Pickups</h2>
          <div className="flex gap-2">
            <Input
              placeholder="Search pickups..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="max-w-xs"
            />
            <Button onClick={openCsvInNewTab}>
              Open as CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer" onClick={() => handleSort('order_created')}>
                  Created {sortConfig.key === 'order_created' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('code')}>
                  Code {sortConfig.key === 'code' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Trees</TableHead>
                <TableHead>Extra</TableHead>
                <TableHead>Comment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPickups.map((pickup) => (
                <TableRow key={`${pickup.code}-${pickup.order_created}`}>
                  <TableCell>{formatDate(pickup.order_created)}</TableCell>
                  <TableCell>{pickup.name}</TableCell>
                  <TableCell>
                    {pickup.line1}
                    {pickup.line2 ? `, ${pickup.line2}` : ''}
                    {`, ${pickup.city}, ${pickup.state}`}
                  </TableCell>
                  <TableCell className="font-mono">{pickup.code}</TableCell>
                  <TableCell>{pickup.method || 'Pending'}</TableCell>
                  <TableCell>{pickup.numtrees}</TableCell>
                  <TableCell>${pickup.extra}</TableCell>
                  <TableCell>{pickup.comment}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default PickupsDashboard;
