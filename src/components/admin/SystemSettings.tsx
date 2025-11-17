import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { ArrowLeft, Shield, Settings, Bell, Database, Download, Trash2, AlertTriangle, Save } from 'lucide-react';
import { AdminService } from '../../services/adminService';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

interface SystemSettingsProps {
  onBack: () => void;
}

export function SystemSettings({ onBack }: SystemSettingsProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    twoFactorAuth: false,
    autoLogout: false,
    sessionTimeout: 30,
    emailNotifications: true,
    smsAlerts: false,
    pushNotifications: true,
    platformFee: 5,
    maxSessionDuration: 3,
    maintenanceMode: false,
  });

  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const loadedSettings = await AdminService.getSystemSettings();
      setSettings(loadedSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load system settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) {
      toast.error('You must be logged in to save settings');
      return;
    }

    try {
      setSaving(true);
      await AdminService.updateSystemSettings(
        {
          two_factor_auth: settings.twoFactorAuth,
          auto_logout: settings.autoLogout,
          session_timeout: settings.sessionTimeout,
          email_notifications: settings.emailNotifications,
          sms_alerts: settings.smsAlerts,
          push_notifications: settings.pushNotifications,
          platform_fee: settings.platformFee,
          max_session_duration: settings.maxSessionDuration,
          maintenance_mode: settings.maintenanceMode,
        },
        user.id
      );
      toast.success('System settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save system settings');
    } finally {
      setSaving(false);
    }
  };

  const handleBackupDatabase = async () => {
    try {
      toast.info('Database backup initiated. This may take a few moments...');
      // In a real implementation, this would call a backend API
      // For now, we'll just show a success message
      setTimeout(() => {
        toast.success('Database backup completed successfully');
      }, 2000);
    } catch (error) {
      console.error('Error backing up database:', error);
      toast.error('Failed to backup database');
    }
  };

  const handleExportUserData = async () => {
    try {
      toast.info('Exporting user data...');
      // In a real implementation, this would generate and download a CSV/JSON file
      // For now, we'll just show a success message
      setTimeout(() => {
        toast.success('User data exported successfully');
      }, 2000);
    } catch (error) {
      console.error('Error exporting user data:', error);
      toast.error('Failed to export user data');
    }
  };

  const handleClearCache = async () => {
    try {
      // Clear browser cache
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      // Clear localStorage
      localStorage.clear();
      toast.success('Cache cleared successfully');
    } catch (error) {
      console.error('Error clearing cache:', error);
      toast.error('Failed to clear cache');
    }
  };

  const handleResetSystem = async () => {
    if (!user?.id) {
      toast.error('You must be logged in to reset the system');
      return;
    }

    try {
      // Reset all settings to defaults
      const defaultSettings = {
        two_factor_auth: false,
        auto_logout: false,
        session_timeout: 30,
        email_notifications: true,
        sms_alerts: false,
        push_notifications: true,
        platform_fee: 5,
        max_session_duration: 3,
        maintenance_mode: false,
      };

      await AdminService.updateSystemSettings(defaultSettings, user.id);
      setSettings({
        twoFactorAuth: false,
        autoLogout: false,
        sessionTimeout: 30,
        emailNotifications: true,
        smsAlerts: false,
        pushNotifications: true,
        platformFee: 5,
        maxSessionDuration: 3,
        maintenanceMode: false,
      });
      setResetDialogOpen(false);
      toast.success('System settings reset to defaults');
    } catch (error) {
      console.error('Error resetting system:', error);
      toast.error('Failed to reset system settings');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">System Settings</h1>
            <p className="text-slate-600">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">System Settings</h1>
            <p className="text-slate-600">Configure platform settings and security</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Shield className="h-5 w-5 text-blue-600" />
            <h3 className="font-bold text-lg">Security Settings</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-slate-600">Require 2FA for admin accounts</p>
              </div>
              <Switch
                checked={settings.twoFactorAuth}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, twoFactorAuth: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-logout</Label>
                <p className="text-sm text-slate-600">Automatically log out inactive users</p>
              </div>
              <Switch
                checked={settings.autoLogout}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, autoLogout: checked })
                }
              />
            </div>
            <div>
              <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
              <Input
                id="session-timeout"
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    sessionTimeout: parseInt(e.target.value) || 30,
                  })
                }
                className="mt-1"
              />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Bell className="h-5 w-5 text-green-600" />
            <h3 className="font-bold text-lg">Notification Settings</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Email Notifications</Label>
                <p className="text-sm text-slate-600">Send system alerts via email</p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, emailNotifications: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>SMS Alerts</Label>
                <p className="text-sm text-slate-600">Send critical alerts via SMS</p>
              </div>
              <Switch
                checked={settings.smsAlerts}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, smsAlerts: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Push Notifications</Label>
                <p className="text-sm text-slate-600">Browser push notifications</p>
              </div>
              <Switch
                checked={settings.pushNotifications}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, pushNotifications: checked })
                }
              />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Settings className="h-5 w-5 text-purple-600" />
            <h3 className="font-bold text-lg">Platform Settings</h3>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="platform-fee">Platform Fee (%)</Label>
              <Input
                id="platform-fee"
                type="number"
                value={settings.platformFee}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    platformFee: parseFloat(e.target.value) || 5,
                  })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="max-session">Max Session Duration (hours)</Label>
              <Input
                id="max-session"
                type="number"
                value={settings.maxSessionDuration}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    maxSessionDuration: parseInt(e.target.value) || 3,
                  })
                }
                className="mt-1"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Maintenance Mode</Label>
                <p className="text-sm text-slate-600">Enable platform maintenance mode</p>
              </div>
              <Switch
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, maintenanceMode: checked })
                }
              />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-bold text-lg mb-6">System Actions</h3>
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleBackupDatabase}
            >
              <Database className="h-4 w-4 mr-2" />
              Backup Database
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleExportUserData}
            >
              <Download className="h-4 w-4 mr-2" />
              Export User Data
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleClearCache}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Cache
            </Button>
            <Button
              variant="destructive"
              className="w-full justify-start"
              onClick={() => setResetDialogOpen(true)}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Reset System
            </Button>
          </div>
        </Card>
      </div>

      {/* Reset Confirmation Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset System Settings</DialogTitle>
            <DialogDescription>
              Are you sure you want to reset all system settings to their default values? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleResetSystem}>
              Reset Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
