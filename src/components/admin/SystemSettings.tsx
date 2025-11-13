import React from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ArrowLeft, Shield, Settings, Bell, Moon, Sun } from 'lucide-react';

interface SystemSettingsProps {
  onBack: () => void;
}

export function SystemSettings({ onBack }: SystemSettingsProps) {

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">System Settings</h1>
          <p className="text-slate-600">Configure platform settings and security</p>
        </div>
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
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-logout</Label>
                <p className="text-sm text-slate-600">Automatically log out inactive users</p>
              </div>
              <Switch />
            </div>
            <div>
              <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
              <Input id="session-timeout" type="number" placeholder="30" className="mt-1" />
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
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>SMS Alerts</Label>
                <p className="text-sm text-slate-600">Send critical alerts via SMS</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Push Notifications</Label>
                <p className="text-sm text-slate-600">Browser push notifications</p>
              </div>
              <Switch />
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
              <Input id="platform-fee" type="number" placeholder="5" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="max-session">Max Session Duration (hours)</Label>
              <Input id="max-session" type="number" placeholder="3" className="mt-1" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Maintenance Mode</Label>
                <p className="text-sm text-slate-600">Enable platform maintenance mode</p>
              </div>
              <Switch />
            </div>
          </div>
        </Card>


        <Card className="p-6">
          <h3 className="font-bold text-lg mb-6">System Actions</h3>
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              Backup Database
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Export User Data
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Clear Cache
            </Button>
            <Button variant="destructive" className="w-full justify-start">
              Reset System
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}