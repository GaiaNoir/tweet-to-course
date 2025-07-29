'use client';

import { useState, useEffect } from 'react';
import { Button } from './button';
import { Card } from './card';
import { hasNotionConnection, getNotionConnection, simulateNotionConnection, removeNotionConnection, loadNotionConnection, type NotionConnection } from '@/lib/notion-integration';

export function NotionConnectionManager() {
  const [connection, setConnection] = useState<NotionConnection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load connection on mount
    const loadConnection = () => {
      const stored = loadNotionConnection();
      setConnection(stored);
      setLoading(false);
    };

    loadConnection();
  }, []);

  const handleConnect = () => {
    const newConnection = simulateNotionConnection();
    setConnection(newConnection);
  };

  const handleDisconnect = () => {
    removeNotionConnection();
    setConnection(null);
  };

  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Checking Notion connection...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-black rounded flex items-center justify-center">
            <span className="text-white text-sm font-bold">N</span>
          </div>
          <div>
            <h3 className="font-medium">Notion Integration</h3>
            {connection ? (
              <div className="text-sm text-gray-600">
                <p className="text-green-600">✓ Connected to {connection.workspaceName}</p>
                <p className="text-xs text-gray-500">
                  Connected {new Date(connection.connectedAt).toLocaleDateString()}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                Connect your Notion account to export courses directly
              </p>
            )}
          </div>
        </div>
        
        <div>
          {connection ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
            >
              Disconnect
            </Button>
          ) : (
            <Button
              onClick={handleConnect}
              size="sm"
            >
              Connect Notion
            </Button>
          )}
        </div>
      </div>
      
      {!connection && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm">
          <p className="font-medium text-blue-900">Demo Mode</p>
          <p className="text-blue-700">
            This is a demo connection. In production, this would redirect to Notion's OAuth flow.
          </p>
        </div>
      )}
    </Card>
  );
}