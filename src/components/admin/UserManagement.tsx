import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { ArrowLeft, Search, Filter, MoreVertical, Ban, CheckCircle, X, User, Mail, Calendar, Clock, Activity } from 'lucide-react';
import { AdminService, AdminUser } from '../../services/adminService';
import { toast } from 'sonner';

interface UserManagementProps {
  onBack: () => void;
}

export function UserManagement({ onBack }: UserManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    parents: 0,
    suspended: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [userToSuspend, setUserToSuspend] = useState<AdminUser | null>(null);
  const [suspending, setSuspending] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersData, adminStats] = await Promise.all([
        AdminService.getUsers({
          searchTerm: searchTerm || undefined,
          userType: userTypeFilter !== 'all' ? userTypeFilter : undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        }),
        AdminService.getAdminStats(),
      ]);

      setUsers(usersData);
      setStats({
        students: adminStats.students,
        teachers: adminStats.teachers,
        parents: adminStats.parents,
        suspended: adminStats.suspended,
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchTerm, userTypeFilter, statusFilter]);

  const handleViewUser = async (userId: string) => {
    console.log('View button clicked for user:', userId);
    try {
      const userDetails = await AdminService.getUserDetails(userId);
      console.log('User details fetched:', userDetails);
      if (userDetails) {
        setSelectedUser(userDetails);
        setViewDialogOpen(true);
      } else {
        console.error('No user details returned');
        toast.error('Failed to load user details');
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      toast.error('Failed to load user details');
    }
  };

  const handleSuspendClick = (user: AdminUser, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log('Suspend button clicked for user:', user);
    setUserToSuspend(user);
    setSuspendDialogOpen(true);
  };

  const handleConfirmSuspend = async () => {
    if (!userToSuspend) {
      console.error('No user to suspend');
      return;
    }

    console.log('Confirming suspend for user:', userToSuspend);
    try {
      setSuspending(true);
      const isCurrentlyActive = userToSuspend.status === 'active';
      console.log('Toggling suspension. Currently active:', isCurrentlyActive);
      
      const result = await AdminService.toggleUserSuspension(userToSuspend.id, isCurrentlyActive);
      console.log('Suspension result:', result);
      
      if (result) {
        toast.success(
          isCurrentlyActive
            ? `User ${userToSuspend.name} has been suspended`
            : `User ${userToSuspend.name} has been reactivated`
        );
        
        setSuspendDialogOpen(false);
        setUserToSuspend(null);
        await fetchData(); // Refresh the user list
      } else {
        throw new Error('Suspension operation returned false');
      }
    } catch (error: any) {
      console.error('Error suspending user:', error);
      const errorMessage = error?.message || 'Failed to update user status';
      toast.error(errorMessage);
    } finally {
      setSuspending(false);
    }
  };

  const getUserTypeColor = (type: string) => {
    switch (type) {
      case 'student': return 'bg-blue-100 text-blue-800';
      case 'teacher': return 'bg-green-100 text-green-800';
      case 'parent': return 'bg-purple-100 text-purple-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-slate-600">Manage all platform users and their activities</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.students.toLocaleString()}</p>
            <p className="text-sm text-slate-600">Students</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{stats.teachers.toLocaleString()}</p>
            <p className="text-sm text-slate-600">Teachers</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{stats.parents.toLocaleString()}</p>
            <p className="text-sm text-slate-600">Parents</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{stats.suspended.toLocaleString()}</p>
            <p className="text-sm text-slate-600">Suspended</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="User Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="student">Students</SelectItem>
              <SelectItem value="teacher">Teachers</SelectItem>
              <SelectItem value="parent">Parents</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            More Filters
          </Button>
        </div>
      </Card>

      {/* Users Table */}
      <Card className="p-0">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-8 text-foreground">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-foreground">No users found</div>
          ) : (
            <table className="w-full">
              <thead className="border-b border-border bg-slate-50">
                <tr>
                  <th className="text-left p-4 font-medium text-foreground">User</th>
                  <th className="text-left p-4 font-medium text-foreground">Type</th>
                  <th className="text-left p-4 font-medium text-foreground">Status</th>
                  <th className="text-left p-4 font-medium text-foreground">Join Date</th>
                  <th className="text-left p-4 font-medium text-foreground">Last Activity</th>
                  <th className="text-left p-4 font-medium text-foreground">Stats</th>
                  <th className="text-left p-4 font-medium text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-border hover:bg-slate-50">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                            <span className="text-slate-600 text-sm font-medium">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-foreground">{user.name}</p>
                          <p className="text-sm text-slate-600">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge className={getUserTypeColor(user.type)}>
                        {user.type}
                      </Badge>
                      {user.type === 'teacher' && user.verified && (
                        <Badge className="bg-blue-100 text-blue-800 ml-1">Verified</Badge>
                      )}
                    </td>
                    <td className="p-4">
                      <Badge className={getStatusColor(user.status)}>
                        {user.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-foreground">{user.joinDate}</td>
                    <td className="p-4 text-sm text-foreground">{user.lastActivity}</td>
                    <td className="p-4 text-sm text-foreground">
                      {user.type === 'student' && `${user.sessionsCount || 0} sessions`}
                      {user.type === 'teacher' && `${user.sessionsCount || 0} sessions taught`}
                      {user.type === 'parent' && `${user.children || 0} child${(user.children || 0) !== 1 ? 'ren' : ''}`}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleViewUser(user.id);
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSuspendClick(user, e);
                          }}
                        >
                          <Ban className="h-4 w-4 mr-1" />
                          {user.status === 'active' ? 'Suspend' : 'Reactivate'}
                        </Button>
                        <Button variant="outline" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* View User Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              View detailed information about this user
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-6 py-4">
              {/* User Header */}
              <div className="flex items-center space-x-4">
                {selectedUser.avatar ? (
                  <img
                    src={selectedUser.avatar}
                    alt={selectedUser.name}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center">
                    <span className="text-slate-600 text-2xl font-medium">
                      {selectedUser.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-foreground">{selectedUser.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={getUserTypeColor(selectedUser.type)}>
                      {selectedUser.type}
                    </Badge>
                    <Badge className={getStatusColor(selectedUser.status)}>
                      {selectedUser.status}
                    </Badge>
                    {selectedUser.type === 'teacher' && selectedUser.verified && (
                      <Badge className="bg-blue-100 text-blue-800">Verified</Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* User Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                  <Mail className="h-5 w-5 text-slate-600" />
                  <div>
                    <p className="text-sm text-slate-600">Email</p>
                    <p className="font-medium text-foreground">{selectedUser.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-slate-600" />
                  <div>
                    <p className="text-sm text-slate-600">Join Date</p>
                    <p className="font-medium text-foreground">
                      {new Date(selectedUser.joinDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                  <Clock className="h-5 w-5 text-slate-600" />
                  <div>
                    <p className="text-sm text-slate-600">Last Activity</p>
                    <p className="font-medium text-foreground">{selectedUser.lastActivity}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                  <Activity className="h-5 w-5 text-slate-600" />
                  <div>
                    <p className="text-sm text-slate-600">Statistics</p>
                    <p className="font-medium text-foreground">
                      {selectedUser.type === 'student' && `${selectedUser.sessionsCount || 0} sessions`}
                      {selectedUser.type === 'teacher' && `${selectedUser.sessionsCount || 0} sessions taught`}
                      {selectedUser.type === 'parent' && `${selectedUser.children || 0} child${(selectedUser.children || 0) !== 1 ? 'ren' : ''}`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend User Confirmation Dialog */}
      <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {userToSuspend?.status === 'active' ? 'Suspend User' : 'Reactivate User'}
            </DialogTitle>
            <DialogDescription>
              {userToSuspend?.status === 'active' 
                ? `Are you sure you want to suspend ${userToSuspend?.name}? They will not be able to access the platform until reactivated.`
                : `Are you sure you want to reactivate ${userToSuspend?.name}? They will be able to access the platform again.`
              }
            </DialogDescription>
          </DialogHeader>
          
          {userToSuspend && (
            <div className="py-4">
              <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                {userToSuspend.avatar ? (
                  <img
                    src={userToSuspend.avatar}
                    alt={userToSuspend.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
                    <span className="text-slate-600 text-sm font-medium">
                      {userToSuspend.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-medium text-foreground">{userToSuspend.name}</p>
                  <p className="text-sm text-slate-600">{userToSuspend.email}</p>
                  <Badge className={`mt-1 ${getStatusColor(userToSuspend.status)}`}>
                    {userToSuspend.status}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setSuspendDialogOpen(false);
                setUserToSuspend(null);
              }}
              disabled={suspending}
            >
              Cancel
            </Button>
            <Button 
              variant={userToSuspend?.status === 'active' ? 'destructive' : 'default'}
              onClick={handleConfirmSuspend}
              disabled={suspending}
            >
              {suspending ? 'Processing...' : userToSuspend?.status === 'active' ? 'Suspend User' : 'Reactivate User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}