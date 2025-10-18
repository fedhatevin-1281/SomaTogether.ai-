import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { StudentDashboard } from './components/student/StudentDashboard';
import { BrowseTeachers } from './components/student/BrowseTeachers';
import TeacherBrowse from './components/student/TeacherBrowse';
import { MyClasses } from './components/student/MyClasses';
import { Assignments } from './components/student/Assignments';
import { AIAssistant } from './components/student/AIAssistant';
import { StudentWallet } from './components/student/StudentWallet';
import { PublicProfile } from './components/shared/PublicProfile';
import { StudentSettings } from './components/student/StudentSettings';
import { StudentPublicProfile } from './components/student/StudentPublicProfile';
import { MessagesScreen } from './components/shared/MessagesScreen';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { TeacherPublicProfile } from './components/teacher/TeacherPublicProfile';
import { TeacherRequests } from './components/teacher/TeacherRequests';
import { StudentRequests } from './components/teacher/StudentRequests';
import { MyStudents } from './components/teacher/MyStudents';
import { UploadAssignment } from './components/teacher/UploadAssignment';
import { TeacherSubmissions } from './components/teacher/TeacherSubmissions';
import { MaterialsLibrary } from './components/teacher/MaterialsLibrary';
import { TeacherWallet } from './components/teacher/TeacherWallet';
import { TeacherAnalytics } from './components/teacher/TeacherAnalytics';
import { TeacherSettings } from './components/teacher/TeacherSettings';
import { BrowseStudents } from './components/teacher/BrowseStudents';
import { ParentDashboard } from './components/parent/ParentDashboard';
import { ChildProgress } from './components/parent/ChildProgress';
import { TeacherOverview } from './components/parent/TeacherOverview';
import { PaymentHistory } from './components/parent/PaymentHistory';
import { ParentReports } from './components/parent/ParentReports';
import { ParentSettings } from './components/parent/ParentSettings';
import { ParentMessages } from './components/parent/ParentMessages';
import { StudentMessages } from './components/student/StudentMessages';
import { TeacherRequestManagement } from './components/teacher/TeacherRequestManagement';
import { AdminDashboard } from './components/admin/AdminDashboard';
import AuthScreen from './components/auth/AuthScreen';
import { TeacherOnboarding } from './components/teacher/TeacherOnboarding';
import { StudentOnboarding } from './components/student/StudentOnboarding';
import { FloatingAIButton } from './components/shared/FloatingAIButton';

export type UserRole = 'student' | 'teacher' | 'parent' | 'admin';
export type AppScreen = 'landing' | 'login' | 'teacher-onboarding' | 'student-onboarding' | 'parent-onboarding' | 'dashboard' | 'browse-teachers' | 'teacher-browse' | 'my-classes' | 'assignments' | 'ai-assistant' | 'teacher-ai-assistant' | 'parent-ai-assistant' | 'messages' | 'parent-messages' | 'student-messages' | 'wallet' | 'settings' | 'student-profile' | 'teacher-profile' | 'teacher-requests' | 'student-requests' | 'my-students' | 'browse-students' | 'upload-assignment' | 'teacher-submissions' | 'materials-library' | 'analytics' | 'child-progress' | 'teacher-overview' | 'payment-history' | 'reports' | 'teacher-request-management';
export type AdminScreen = 'dashboard' | 'user-management' | 'teacher-verification' | 'payment-management' | 'analytics' | 'content-moderation' | 'system-settings';

function AppContent() {
  const { user, profile, signOut, loading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('landing');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [studentTokens, setStudentTokens] = useState<number>(200); // example default

  // Determine if user is logged in and get role from profile
  const isLoggedIn = !!user;
  const currentRole = profile?.role || 'student';
  const currentUserId = user?.id || null;

  const handleTokenChange = (amount: number) => {
    setStudentTokens(prev => Math.max(prev + amount, 0));
  };

  const handleLogout = async () => {
    const { error } = await signOut();
    if (!error) {
      setCurrentScreen('login');
    }
  };

  // Handle navigation after login based on role and onboarding status
  useEffect(() => {
    if (user && profile) {
      // Since onboarding is now completed during sign-up, we can skip onboarding check
      // and go directly to dashboard for all logged-in users
      setCurrentScreen('dashboard');
    } else if (!user && !loading) {
      setCurrentScreen('landing');
    }
  }, [user, profile, loading]);

  const [currentClassInfo, setCurrentClassInfo] = useState<any>(null);
  const handleScreenChange = (screen: AppScreen | AdminScreen, classInfo?: any) => {
    setCurrentScreen(screen as AppScreen);
    if (classInfo) setCurrentClassInfo(classInfo);
  };

  const renderContent = () => {
    // Landing removed: show login screen for unauthenticated users
    if (!isLoggedIn && currentScreen === 'landing') {
      return <AuthScreen />;
    }

    // Teacher onboarding
    if (currentScreen === 'teacher-onboarding') {
      return (
        <TeacherOnboarding
          onNext={() => handleScreenChange('dashboard')}
          onSaveAndContinue={() => handleScreenChange('login')}
        />
      );
    }

    // Show login screen if not logged in
    if (!isLoggedIn && currentScreen === 'login') {
      return <AuthScreen />;
    }

    // Student onboarding for new students
    if (currentScreen === 'student-onboarding') {
      return (
        <StudentOnboarding
          studentId={currentUserId || 'unknown'} // pass the logged-in student's id
          onNext={() => handleScreenChange('dashboard')}
          onSaveAndContinue={() => handleScreenChange('dashboard')}
        />
      );
    }

    // Prevent accessing teacher/parent onboarding after logging in as student
    if (isLoggedIn && currentRole === 'student') {
      if (currentScreen === 'teacher-onboarding' || currentScreen === 'parent-onboarding') {
        return (
          <div className="text-center p-6">
            <h2>You are already logged in as a student.</h2>
            <p>Please logout first to register as another role.</p>
          </div>
        );
      }
    }

    // Student-specific screens
    if (currentRole === 'student') {
      switch (currentScreen) {
        case 'dashboard':
          return <StudentDashboard currentScreen={currentScreen} onScreenChange={handleScreenChange} />;
        case 'browse-teachers':
          return <BrowseTeachers onBack={() => handleScreenChange('dashboard')} />;
        case 'teacher-browse':
          return <TeacherBrowse />;
        case 'my-classes':
          return <MyClasses onScreenChange={handleScreenChange} />;
        case 'assignments':
          return <Assignments onBack={() => handleScreenChange('dashboard')} />;
        case 'ai-assistant':
          return <AIAssistant onBack={() => setCurrentScreen('dashboard')} />;
        case 'messages':
        case 'student-messages':
          return <StudentMessages onBack={() => handleScreenChange('dashboard')} />;
        case 'wallet':
          return <StudentWallet />;
        case 'settings':
          return <StudentSettings />;
        case 'student-profile':
          return <PublicProfile />;
        default:
          return <StudentDashboard currentScreen={currentScreen} onScreenChange={handleScreenChange} />;
      }
    }

    // Teacher-specific screens
    if (currentRole === 'teacher') {
      switch (currentScreen) {
        case 'dashboard':
          return <TeacherDashboard onScreenChange={handleScreenChange} />;
        case 'teacher-profile':
          return <TeacherPublicProfile />;
        case 'teacher-requests':
          return <TeacherRequests onBack={() => handleScreenChange('dashboard')} />;
        case 'student-requests':
          return <StudentRequests />;
        case 'my-students':
          return <MyStudents />;
        case 'browse-students':
          return <BrowseStudents onBack={() => handleScreenChange('dashboard')} teacherId={user?.id || ''} />;
        case 'upload-assignment':
          return <UploadAssignment onBack={() => handleScreenChange('dashboard')} />;
        case 'teacher-submissions':
          return <TeacherSubmissions onBack={() => handleScreenChange('dashboard')} />;
        case 'materials-library':
          return <MaterialsLibrary onBack={() => handleScreenChange('dashboard')} />;
        case 'teacher-ai-assistant':
          return <AIAssistant onBack={() => handleScreenChange('dashboard')} />;
        case 'messages':
          return <MessagesScreen userRole={currentRole} onBack={() => handleScreenChange('dashboard')} />;
        case 'wallet':
          return <TeacherWallet />;
        case 'analytics':
          return <TeacherAnalytics onBack={() => handleScreenChange('dashboard')} />;
        case 'settings':
          return <TeacherSettings />;
        case 'teacher-request-management':
          return <TeacherRequestManagement onBack={() => handleScreenChange('dashboard')} />;
        default:
          return <TeacherDashboard onScreenChange={handleScreenChange} />;
      }
    }

    // Parent-specific screens
    if (currentRole === 'parent') {
      switch (currentScreen) {
        case 'dashboard':
          return <ParentDashboard onScreenChange={handleScreenChange} />;
        case 'child-progress':
          return <ChildProgress />;
        case 'teacher-overview':
          return <TeacherOverview />;
        case 'payment-history':
          return <PaymentHistory />;
        case 'reports':
          return <ParentReports />;
        case 'parent-ai-assistant':
          return <AIAssistant onBack={() => handleScreenChange('dashboard')} />;
        case 'messages':
        case 'parent-messages':
          return <ParentMessages onBack={() => handleScreenChange('dashboard')} />;
        case 'settings':
          return <ParentSettings />;
        default:
          return <ParentDashboard onScreenChange={handleScreenChange} />;
      }
    }

    // Admin dashboard
    switch (currentRole) {
      case 'admin':
        return (
          <AdminDashboard
            currentScreen={currentScreen as AdminScreen}
            onScreenChange={handleScreenChange}
          />
        );
        default:
          return <StudentDashboard currentScreen={currentScreen} onScreenChange={handleScreenChange} />;
    }
  };

  if (
    !isLoggedIn ||
    currentScreen === 'teacher-onboarding' ||
    currentScreen === 'student-onboarding'
  ) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200">
        {renderContent()}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200">
      <Header
        onLogout={handleLogout}
        onScreenChange={handleScreenChange}
        currentScreen={currentScreen}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      <div className="flex">
        <Sidebar
          currentRole={currentRole}
          onScreenChange={handleScreenChange}
          currentScreen={currentScreen}
          isCollapsed={isSidebarCollapsed}
        />
        <main className={`flex-1 p-6 transition-all duration-300 ${isSidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
          {renderContent()}
        </main>
      </div>
      {/* Global Floating AI Button for Teachers and Parents - DISCONNECTED FOR NOW */}
      {/* {(currentRole === 'teacher' || currentRole === 'parent') && <FloatingAIButton />} */}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
