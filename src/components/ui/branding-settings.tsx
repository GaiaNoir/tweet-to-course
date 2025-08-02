'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, Palette, Type } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

interface BrandingSettings {
  logo_url: string | null;
  primary_color: string;
  accent_color: string;
  footer_text: string | null;
}

export function BrandingSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<BrandingSettings>({
    logo_url: null,
    primary_color: '#4F46E5',
    accent_color: '#06B6D4',
    footer_text: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadBrandingSettings();
  }, []);

  const loadBrandingSettings = async () => {
    try {
      const response = await fetch('/api/branding/get');
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings || settings);
      }
    } catch (error) {
      console.error('Failed to load branding settings:', error);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append('logo', file);

    try {
      const response = await fetch('/api/branding/upload-logo', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(prev => ({ ...prev, logo_url: data.logo_url }));
      } else {
        alert('Failed to upload logo');
      }
    } catch (error) {
      console.error('Logo upload error:', error);
      alert('Failed to upload logo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/branding/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });

      if (response.ok) {
        alert('Branding settings saved successfully!');
      } else {
        alert('Failed to save settings');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Palette className="w-5 h-5 text-indigo-600" />
        <h2 className="text-xl font-semibold">Custom Branding</h2>
      </div>

      <div className="space-y-6">
        {/* Logo Upload */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Logo</Label>
          <div className="flex items-center gap-4">
            {settings.logo_url && (
              <img 
                src={settings.logo_url} 
                alt="Logo" 
                className="w-16 h-16 object-contain border rounded"
              />
            )}
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
                id="logo-upload"
              />
              <label
                htmlFor="logo-upload"
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50"
              >
                <Upload className="w-4 h-4" />
                {isLoading ? 'Uploading...' : 'Upload Logo'}
              </label>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Recommended: PNG or SVG, max 2MB
          </p>
        </div>

        {/* Color Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">Primary Color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.primary_color}
                onChange={(e) => setSettings(prev => ({ ...prev, primary_color: e.target.value }))}
                className="w-12 h-10 border rounded cursor-pointer"
              />
              <input
                type="text"
                value={settings.primary_color}
                onChange={(e) => setSettings(prev => ({ ...prev, primary_color: e.target.value }))}
                className="flex-1 px-3 py-2 border rounded-md"
                placeholder="#4F46E5"
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Accent Color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.accent_color}
                onChange={(e) => setSettings(prev => ({ ...prev, accent_color: e.target.value }))}
                className="w-12 h-10 border rounded cursor-pointer"
              />
              <input
                type="text"
                value={settings.accent_color}
                onChange={(e) => setSettings(prev => ({ ...prev, accent_color: e.target.value }))}
                className="flex-1 px-3 py-2 border rounded-md"
                placeholder="#06B6D4"
              />
            </div>
          </div>
        </div>

        {/* Footer Text */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Custom Footer Text</Label>
          <input
            type="text"
            value={settings.footer_text || ''}
            onChange={(e) => setSettings(prev => ({ ...prev, footer_text: e.target.value || null }))}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="e.g., Created by Your Company Name"
          />
          <p className="text-sm text-gray-500 mt-1">
            This will replace the default footer in your exports
          </p>
        </div>

        {/* Preview */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <h3 className="font-medium mb-3">Preview</h3>
          <div 
            className="p-4 rounded border bg-white"
            style={{ 
              borderColor: settings.primary_color,
              borderWidth: '2px'
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              {settings.logo_url && (
                <img 
                  src={settings.logo_url} 
                  alt="Logo" 
                  className="w-8 h-8 object-contain"
                />
              )}
              <h4 
                className="font-semibold"
                style={{ color: settings.primary_color }}
              >
                Sample Course Title
              </h4>
            </div>
            <div 
              className="w-full h-2 rounded mb-3"
              style={{ backgroundColor: settings.accent_color }}
            />
            <p className="text-sm text-gray-600">
              {settings.footer_text || 'Generated by TweetToCourse'}
            </p>
          </div>
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="w-full"
        >
          {isSaving ? 'Saving...' : 'Save Branding Settings'}
        </Button>
      </div>
    </Card>
  );
}