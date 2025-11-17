import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { ArrowLeft, Check, X, FileText, Award, ExternalLink, Download } from 'lucide-react';
import { AdminService, TeacherVerification as TeacherVerificationType } from '../../services/adminService';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

interface TeacherVerificationProps {
  onBack: () => void;
}

export function TeacherVerification({ onBack }: TeacherVerificationProps) {
  const { user } = useAuth();
  const [pendingTeachers, setPendingTeachers] = useState<TeacherVerificationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherVerificationType | null>(null);
  const [documents, setDocuments] = useState<string[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('Fetching teacher verifications...');
      const teachers = await AdminService.getTeacherVerifications();
      console.log('Teacher verifications fetched:', teachers);
      setPendingTeachers(teachers);
    } catch (error) {
      console.error('Error fetching teacher verifications:', error);
      toast.error('Failed to load teacher verifications');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewDocuments = async (teacher: TeacherVerificationType, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log('Review Documents clicked for teacher:', teacher.id);
    try {
      setSelectedTeacher(teacher);
      setLoadingDocuments(true);
      setReviewDialogOpen(true);
      const docs = await AdminService.getTeacherDocuments(teacher.id);
      console.log('Documents fetched:', docs);
      setDocuments(docs);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoadingDocuments(false);
    }
  };

  const handleApproveClick = (teacher: TeacherVerificationType, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log('Approve clicked for teacher:', teacher.id);
    setSelectedTeacher(teacher);
    setApproveDialogOpen(true);
  };

  const handleRejectClick = (teacher: TeacherVerificationType, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log('Reject clicked for teacher:', teacher.id);
    setSelectedTeacher(teacher);
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  const handleApprove = async () => {
    console.log('handleApprove called', { selectedTeacher: selectedTeacher?.id, userId: user?.id });
    
    if (!selectedTeacher || !user?.id) {
      console.error('Missing selectedTeacher or user.id');
      toast.error('Unable to approve verification - missing information');
      return;
    }

    try {
      setProcessing(true);
      console.log('Starting approval process for teacher:', selectedTeacher.id, 'by admin:', user.id);
      
      const result = await AdminService.approveTeacherVerification(selectedTeacher.id, user.id);
      console.log('Approval result from service:', result);
      
      if (result === true) {
        console.log('Approval successful, showing success message');
        const teacherName = selectedTeacher.name;
        
        // Show success message in the dialog FIRST
        setSuccessMessage(`✅ Teacher ${teacherName} has been verified successfully!`);
        
        // Show success toast immediately
        toast.success(`✅ Teacher ${teacherName} has been verified successfully!`, {
          duration: 5000,
        });
        
        // Don't close immediately - let user see the success message
        // Refresh data after showing success
        setTimeout(async () => {
          await fetchData(); // Refresh the list
        }, 500);
      } else {
        console.error('Approval returned false');
        throw new Error('Approval returned false');
      }
    } catch (error: any) {
      console.error('Error approving teacher:', error);
      const errorMessage = error?.message || error?.code || 'Failed to approve teacher verification';
      toast.error(`Failed to approve: ${errorMessage}`, {
        duration: 5000,
      });
      setProcessing(false);
    }
    // Note: Don't set processing to false here if successful - let the user see the success state
  };

  const handleReject = async () => {
    console.log('handleReject called', { selectedTeacher: selectedTeacher?.id, userId: user?.id, reason: rejectionReason });
    
    if (!selectedTeacher || !user?.id) {
      console.error('Missing selectedTeacher or user.id');
      toast.error('Unable to reject verification - missing information');
      return;
    }

    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      setProcessing(true);
      console.log('Starting rejection process for teacher:', selectedTeacher.id, 'by admin:', user.id);
      
      const result = await AdminService.rejectTeacherVerification(selectedTeacher.id, rejectionReason, user.id);
      console.log('Rejection result from service:', result);
      
      if (result === true) {
        console.log('Rejection successful, showing success message');
        const teacherName = selectedTeacher.name;
        
        // Show success message in the dialog FIRST
        setSuccessMessage(`✅ Teacher ${teacherName} verification has been rejected successfully!`);
        
        // Show success toast immediately
        toast.success(`✅ Teacher ${teacherName} verification has been rejected successfully!`, {
          duration: 5000,
        });
        
        // Don't close immediately - let user see the success message
        // Refresh data after showing success
        setTimeout(async () => {
          await fetchData(); // Refresh the list
        }, 500);
      } else {
        console.error('Rejection returned false');
        throw new Error('Rejection returned false');
      }
    } catch (error: any) {
      console.error('Error rejecting teacher:', error);
      const errorMessage = error?.message || error?.code || 'Failed to reject teacher verification';
      toast.error(`Failed to reject: ${errorMessage}`, {
        duration: 5000,
      });
      setProcessing(false);
    }
    // Note: Don't set processing to false here if successful - let the user see the success state
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Teacher Verification</h1>
          <p className="text-slate-600">Review and verify new teacher applications</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-foreground">Loading teacher verifications...</div>
      ) : pendingTeachers.length === 0 ? (
        <div className="text-center py-8 text-foreground">No pending teacher verifications</div>
      ) : (
        <div className="space-y-6">
          {pendingTeachers.map((teacher) => (
            <Card key={teacher.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  {teacher.avatar ? (
                    <img
                      src={teacher.avatar}
                      alt={teacher.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center">
                      <span className="text-slate-600 text-xl font-medium">
                        {teacher.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-lg text-foreground">{teacher.name}</h3>
                    <p className="text-slate-600">{teacher.subject} Teacher</p>
                    <p className="text-sm text-slate-500">{teacher.email}</p>
                  </div>
                </div>
                <Badge className="bg-orange-100 text-orange-800">Pending Review</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-medium mb-3 text-foreground">Qualifications</h4>
                  <div className="space-y-2">
                    {teacher.qualifications.length > 0 ? (
                      teacher.qualifications.map((qual, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Award className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-foreground">{qual}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">No qualifications listed</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3 text-foreground">Application Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Experience</span>
                      <span className="font-medium text-foreground">{teacher.experience}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Documents</span>
                      <span className="font-medium text-foreground">{teacher.documents} files</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Applied</span>
                      <span className="font-medium text-foreground">{teacher.applicationDate}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3 text-foreground">Actions</h4>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleReviewDocuments(teacher, e);
                      }}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Review Documents
                    </Button>
                    <div className="flex space-x-2">
                      <Button
                        className="flex-1 bg-green-500 hover:bg-green-600"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleApproveClick(teacher, e);
                        }}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleRejectClick(teacher, e);
                        }}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Review Documents Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Documents - {selectedTeacher?.name}</DialogTitle>
            <DialogDescription>
              Review the verification documents submitted by this teacher
            </DialogDescription>
          </DialogHeader>

          {loadingDocuments ? (
            <div className="py-8 text-center text-foreground">Loading documents...</div>
          ) : documents.length === 0 ? (
            <div className="py-8 text-center text-slate-500">
              No documents available for review
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {documents.map((doc, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border border-border rounded-lg bg-slate-50"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-slate-600" />
                    <div>
                      <p className="font-medium text-foreground">
                        Document {index + 1}
                      </p>
                      <p className="text-sm text-slate-600">
                        {typeof doc === 'string' ? doc : 'Verification Document'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {typeof doc === 'string' && (doc.startsWith('http') || doc.startsWith('/')) ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(doc, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = doc;
                            link.download = `document-${index + 1}`;
                            link.click();
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </>
                    ) : (
                      <p className="text-sm text-slate-500">Document reference: {doc}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Teacher Verification</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve {selectedTeacher?.name}'s verification? This will
              allow them to start accepting students.
            </DialogDescription>
          </DialogHeader>

          {selectedTeacher && (
            <div className="py-4">
              {successMessage ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Check className="h-5 w-5 text-green-600" />
                    <p className="font-medium text-green-800">{successMessage}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                  {selectedTeacher.avatar ? (
                    <img
                      src={selectedTeacher.avatar}
                      alt={selectedTeacher.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
                      <span className="text-slate-600 text-sm font-medium">
                        {selectedTeacher.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-foreground">{selectedTeacher.name}</p>
                    <p className="text-sm text-slate-600">{selectedTeacher.email}</p>
                    <p className="text-sm text-slate-600">{selectedTeacher.subject} Teacher</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {!successMessage && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setApproveDialogOpen(false);
                    setSelectedTeacher(null);
                    setSuccessMessage(null);
                  }}
                  disabled={processing}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-green-500 hover:bg-green-600"
                  onClick={handleApprove}
                  disabled={processing}
                >
                  {processing ? 'Processing...' : 'Approve Verification'}
                </Button>
              </>
            )}
            {successMessage && (
              <Button
                onClick={() => {
                  setApproveDialogOpen(false);
                  setSelectedTeacher(null);
                  setSuccessMessage(null);
                }}
              >
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Teacher Verification</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting {selectedTeacher?.name}'s verification. This
              will be sent to the teacher.
            </DialogDescription>
          </DialogHeader>

          {selectedTeacher && (
            <div className="py-4 space-y-4">
              {successMessage ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <X className="h-5 w-5 text-red-600" />
                    <p className="font-medium text-red-800">{successMessage}</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                    {selectedTeacher.avatar ? (
                      <img
                        src={selectedTeacher.avatar}
                        alt={selectedTeacher.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
                        <span className="text-slate-600 text-sm font-medium">
                          {selectedTeacher.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-foreground">{selectedTeacher.name}</p>
                      <p className="text-sm text-slate-600">{selectedTeacher.email}</p>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="rejection-reason">Rejection Reason *</Label>
                    <Textarea
                      id="rejection-reason"
                      placeholder="e.g., Documents are unclear, missing required certifications, etc."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="mt-1"
                      rows={4}
                      disabled={processing}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter>
            {!successMessage && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setRejectDialogOpen(false);
                    setSelectedTeacher(null);
                    setRejectionReason('');
                    setSuccessMessage(null);
                  }}
                  disabled={processing}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={processing || !rejectionReason.trim()}
                >
                  {processing ? 'Processing...' : 'Reject Verification'}
                </Button>
              </>
            )}
            {successMessage && (
              <Button
                onClick={() => {
                  setRejectDialogOpen(false);
                  setSelectedTeacher(null);
                  setRejectionReason('');
                  setSuccessMessage(null);
                }}
              >
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
