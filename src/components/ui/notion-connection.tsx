'use client';

import { useState, useEffect } from 'react';
import { Button } from './button';
import { Card } from './card';

interface NotionConnectionProps {
  onConnectionChange?: (connected: boolean) => void;
}

interface NotionStatus {
  connected: boolean;
  workspace_name?: string;
  connected_at?: string;
}

export function NotionConnection({ onConnectionChange }: NotionConnectionProps) {
  const [status, setStatus] = useState<NotionStatus>({ connected: false });
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    checkNotionStatus();
  }, []);

  const checkNotionStatus = async () => {
    try {
      const response = await fetch('/api/auth/notion/status');
      const data = await response.json();
      
      if (data.success) {
        setStatus({
          connected: data.connected,
          workspace_name: data.workspace_name,
          connected_at: data.connected_at
        });
        onConnectionChange?.(data.connected);
      }
    } catch (error) {
      console.error('Failed to check Notion status:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectNotion = async () => {
    setConnecting(true);
    try {
      const response = await fetch('/api/auth/notion/connect');
      const data = await response.json();
      
      if (data.success && data.authUrl) {
        // Redirect to Notion OAuth
        window.location.href = data.authUrl;
      } else {
        throw new Error('Failed to get auth URL');
      }
    } catch (error) {
      console.error('Failed to connect Notion:', error);
      setConnecting(false);
    }
  };

  const disconnectNotion = async () => {
    setDisconnecting(true);
    try {
      const response = await fetch('/api/auth/notion/status', {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStatus({ connected: false });
        onConnectionChange?.(false);
      } else {
        throw new Error('Failed to disconnect');
      }
    } catch (error) {
      console.error('Failed to disconnect Notion:', error);
    } finally {
      setDisconnecting(false);
    }
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
            {status.connected ? (
              <div className="text-sm text-gray-600">
                <p className="text-green-600">✓ Connected to {status.workspace_name}</p>
                {status.connected_at && (
                  <p className="text-xs text-gray-500">
                    Connected {new Date(status.connected_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                Connect your Notion account to export courses directly
              </p>
            )}
          </div>
        </div>
        
        <div>
          {status.connected ? (
            <Button
              variant="outline"
              size="sm"
              onClick={disconnectNotion}
              disabled={disconnecting}
            >
              {disconnecting ? 'Disconnecting...' : 'Disconnect'}
            </Button>
          ) : (
            <Button
              onClick={connectNotion}
              disabled={connecting}
              size="sm"
            >
              {connecting ? 'Connecting...' : 'Connect Notion'}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}