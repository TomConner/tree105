import React, { useState } from 'react';
import { Pickup } from './types';

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatPhone = (phone: string) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(1|)?(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return '(' + match[2] + ') ' + match[3] + '-' + match[4];
  }
  return phone;
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

  const totalTrees = pickups.reduce((sum, pickup) => sum + (pickup.numtrees || 0), 0);
  const totalExtra = pickups.reduce((sum, pickup) => sum + (pickup.extra || 0), 0);
  const totalPickups = pickups.length;

  if (!pickups) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl">Tree Pickups Dashboard</h2>
        <input
          type="text"
          placeholder="Search pickups..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="p-2 border rounded"
        />
      </div>

      <div className="mb-4 grid grid-cols-3 gap-4">
        <div className="p-4 border rounded">
          <div className="text-gray-600">Total Pickups</div>
          <div className="text-2xl">{totalPickups}</div>
        </div>
        <div className="p-4 border rounded">
          <div className="text-gray-600">Total Trees</div>
          <div className="text-2xl">{totalTrees}</div>
        </div>
        <div className="p-4 border rounded">
          <div className="text-gray-600">Total Extra Amount</div>
          <div className="text-2xl">${totalExtra}</div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border">
          <thead>
            <tr className="bg-gray-50">
              <th 
                className="border p-2 text-left cursor-pointer"
                onClick={() => handleSort('order_created')}
              >
                Created {sortConfig.key === 'order_created' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th className="border p-2 text-left">Customer</th>
              <th 
                className="border p-2 text-left cursor-pointer"
                onClick={() => handleSort('code')}
              >
                Code {sortConfig.key === 'code' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th className="border p-2 text-left">Method</th>
              <th className="border p-2 text-left">Trees</th>
              <th className="border p-2 text-left">Extra</th>
              <th className="border p-2 text-left">Comment</th>
            </tr>
          </thead>
          <tbody>
            {filteredPickups.map((pickup) => (
              <tr 
                key={`${pickup.code}-${pickup.order_created}`}
                className="hover:bg-gray-50"
              >
                <td className="border p-2">{formatDate(pickup.order_created)}</td>
                <td className="border p-2">
                  <div>{pickup.name}</div>
                  <div className="text-sm text-gray-500">{pickup.line1}</div>
                  {pickup.city !== 'Pembroke' && (
                    <div className="text-sm text-gray-500">{pickup.city}</div>
                  )}
                </td>
                <td className="border p-2 font-mono">{pickup.code}</td>
                <td className="border p-2">{pickup.method || 'Pending'}</td>
                <td className="border p-2">{pickup.numtrees}</td>
                <td className="border p-2">${pickup.extra}</td>
                <td className="border p-2">{pickup.comment}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PickupsDashboard;
