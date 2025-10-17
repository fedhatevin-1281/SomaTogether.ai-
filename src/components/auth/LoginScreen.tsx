import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { UserRole } from '../../App';
import { useAuth } from '../../contexts/AuthContext';

interface LoginScreenProps {
  onLogin: (
    role: UserRole,
    isNewUser?: boolean,
    newStudentData?: { name: string; email: string; password: string }
  ) => void;
  currentRole?: UserRole; // 🔹 NEW: added to know if someone is already logged in
}

export function LoginScreen({ onLogin, currentRole }: LoginScreenProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const { signIn, signUp, loading } = useAuth();

  // 🔹 NEW: State for new student registration form
  const [isRegistering, setIsRegistering] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentPassword, setNewStudentPassword] = useState('');
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (email: string, password: string) => {
    try {
      setError('');
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message);
      } else {
        // Login successful, the AuthContext will handle the rest
        onLogin(selectedRole);
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    }
  };

  const handleSignUp = async (name: string, email: string, password: string, role: UserRole) => {
    try {
      setError('');
      const { error } = await signUp({
        email,
        password,
        full_name: name,
        role
      });
      if (error) {
        setError(error.message);
      } else {
        // Registration successful
        onLogin(role, true);
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
    }
  };

  const roleInfo = {
    student: {
      title: 'Student Portal',
      description: 'Access your classes, assignments, and connect with teachers',
      color: 'border-blue-500 bg-blue-50',
      buttonColor: 'bg-blue-500 hover:bg-blue-600'
    },
    teacher: {
      title: 'Teacher Portal', 
      description: 'Manage students, create assignments, and track progress',
      color: 'border-green-500 bg-green-50',
      buttonColor: 'bg-green-500 hover:bg-green-600'
    },
    parent: {
      title: 'Parent Portal',
      description: 'Monitor your child\'s progress and communicate with teachers',
      color: 'border-purple-500 bg-purple-50', 
      buttonColor: 'bg-purple-500 hover:bg-purple-600'
    },
    admin: {
      title: 'Admin Portal',
      description: 'Manage platform users, content, and system settings',
      color: 'border-red-500 bg-red-50',
      buttonColor: 'bg-red-500 hover:bg-red-600'
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">ST</span>
            </div>
            <h1 className="text-4xl font-bold text-slate-900">SomaTogether.ai</h1>
          </div>
          <p className="text-xl text-slate-600">Connecting students, teachers, and parents in one platform</p>
        </div>

        {/* Role Selection */}
        <Tabs value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)} className="mb-8">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="student" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              Student
            </TabsTrigger>

            {/* 🔹 CHANGE: Only show teacher/parent tabs if a student is NOT logged in */}
            {currentRole !== 'student' && (
              <>
                <TabsTrigger value="teacher" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
                  Teacher
                </TabsTrigger>
                <TabsTrigger value="parent" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
                  Parent
                </TabsTrigger>
              </>
            )}

            <TabsTrigger value="admin" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
              Admin
            </TabsTrigger>
          </TabsList>

          {Object.entries(roleInfo).map(([role, info]) => (
            <TabsContent key={role} value={role}>
              <div className="grid md:grid-cols-2 gap-8 items-center">
                {/* Login / Registration Form */}
                <Card className={`p-8 ${info.color}`}>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">{info.title}</h2>
                    <p className="text-slate-600">{info.description}</p>
                  </div>

                  {/* 🔹 NEW: Student Registration Form */}
                  {role === 'student' && isRegistering && (
                    <form className="space-y-4">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          type="text"
                          placeholder="Enter your full name"
                          className="bg-white"
                          value={newStudentName}
                          onChange={(e) => setNewStudentName(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email"
                          className="bg-white"
                          value={newStudentEmail}
                          onChange={(e) => setNewStudentEmail(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Enter your password"
                          className="bg-white"
                          value={newStudentPassword}
                          onChange={(e) => setNewStudentPassword(e.target.value)}
                        />
                      </div>
                      <Button
                        type="button"
                        className={`w-full text-white ${info.buttonColor}`}
                        onClick={() => handleSignUp(newStudentName, newStudentEmail, newStudentPassword, 'student')}
                        disabled={loading || !newStudentName || !newStudentEmail || !newStudentPassword}
                      >
                        {loading ? 'Registering...' : 'Register as New Student'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full mt-2"
                        onClick={() => setIsRegistering(false)}
                      >
                        Back to Login
                      </Button>
                    </form>
                  )}

                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  {/* 🔹 CHANGED: Show login form if not registering */}
                  {!isRegistering && (
                    <form className="space-y-4">
                      <div>
                        <Label htmlFor="login-email">Email</Label>
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="Enter your email"
                          className="bg-white"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="login-password">Password</Label>
                        <Input
                          id="login-password"
                          type="password"
                          placeholder="Enter your password"
                          className="bg-white"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                        />
                      </div>
                      <Button
                        type="button"
                        className={`w-full text-white ${info.buttonColor}`}
                        onClick={() => handleLogin(loginEmail, loginPassword)}
                        disabled={loading || !loginEmail || !loginPassword}
                      >
                        {loading ? 'Signing In...' : `Sign In as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
                      </Button>

                      {/* 🔹 NEW: Button to toggle student registration */}
                      {role === 'student' && (
                        <Button
                          type="button"
                          className="w-full text-white bg-blue-600 hover:bg-blue-700 mt-2"
                          onClick={() => setIsRegistering(true)}
                        >
                          Register as New Student
                        </Button>
                      )}

                      {/* 🔹 CHANGE: Only show teacher registration if NOT a logged-in student */}
                      {role === 'teacher' && currentRole !== 'student' && (
                        <Button
                          type="button"
                          className="w-full text-white bg-green-600 hover:bg-green-700 mt-2"
                          onClick={() => {
                            const name = prompt('Enter your name:');
                            const email = prompt('Enter your email:');
                            const password = prompt('Enter your password:');
                            if (name && email && password) {
                              handleSignUp(name, email, password, 'teacher');
                            }
                          }}
                          disabled={loading}
                        >
                          {loading ? 'Registering...' : 'Register as New Teacher'}
                        </Button>
                      )}

                      {/* 🔹 CHANGE: Only show parent registration if NOT a logged-in student */}
                      {role === 'parent' && currentRole !== 'student' && (
                        <Button
                          type="button"
                          className="w-full text-white bg-purple-600 hover:bg-purple-700 mt-2"
                          onClick={() => {
                            const name = prompt('Enter your name:');
                            const email = prompt('Enter your email:');
                            const password = prompt('Enter your password:');
                            if (name && email && password) {
                              handleSignUp(name, email, password, 'parent');
                            }
                          }}
                          disabled={loading}
                        >
                          {loading ? 'Registering...' : 'Register as New Parent'}
                        </Button>
                      )}
                    </form>
                  )}

                  <div className="mt-4 text-center">
                    <Button variant="link" className="text-slate-600">
                      Forgot password?
                    </Button>
                  </div>
                </Card>

                {/* Features Preview */}
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-slate-900">Platform Features</h3>
                  {role === 'student' && (
                    <div className="space-y-4">
                      <FeatureItem title="Browse Teachers" description="Find qualified teachers for any subject" />
                      <FeatureItem title="Interactive Classes" description="Join live sessions and access recordings" />
                      <FeatureItem title="AI Assistant" description="Get help with homework and concepts" />
                      <FeatureItem title="Progress Tracking" description="Monitor your learning journey" />
                    </div>
                  )}
                  {role === 'teacher' && (
                    <div className="space-y-4">
                      <FeatureItem title="Student Management" description="Manage your students and their progress" />
                      <FeatureItem title="Content Creation" description="Create and share assignments and materials" />
                      <FeatureItem title="Analytics Dashboard" description="Track student performance and engagement" />
                      <FeatureItem title="Secure Payments" description="Receive payments safely through our platform" />
                    </div>
                  )}
                  {role === 'parent' && (
                    <div className="space-y-4">
                      <FeatureItem title="Child Progress" description="Monitor your child's academic progress" />
                      <FeatureItem title="Teacher Communication" description="Stay connected with your child's teachers" />
                      <FeatureItem title="Payment Management" description="Manage tuition and payment history" />
                      <FeatureItem title="Reports & Insights" description="Detailed reports on learning activities" />
                    </div>
                  )}
                  {role === 'admin' && (
                    <div className="space-y-4">
                      <FeatureItem title="User Management" description="Manage all platform users and permissions" />
                      <FeatureItem title="Content Moderation" description="Review and moderate platform content" />
                      <FeatureItem title="Analytics & Reports" description="Platform-wide analytics and insights" />
                      <FeatureItem title="System Configuration" description="Configure platform settings and features" />
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Quick Demo Access */}
        <div className="text-center">
          <p className="text-slate-600 mb-4">Want to explore the platform?</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="outline" onClick={() => handleSignUp('Demo Student', 'demo.student@soma.ai', 'Demo123!@#', 'student')}>
              Demo as Student
            </Button>
            <Button variant="outline" onClick={() => handleSignUp('Demo Teacher', 'demo.teacher@soma.ai', 'Demo123!@#', 'teacher')}>
              Demo as Teacher
            </Button>
            <Button variant="outline" onClick={() => handleSignUp('Demo Parent', 'demo.parent@soma.ai', 'Demo123!@#', 'parent')}>
              Demo as Parent
            </Button>
            <Button variant="outline" onClick={() => handleSignUp('Demo Admin', 'demo.admin@soma.ai', 'Demo123!@#', 'admin')}>
              Demo as Admin
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex items-start space-x-3">
      <div className="w-2 h-2 bg-slate-400 rounded-full mt-3"></div>
      <div>
        <h4 className="font-medium text-slate-900">{title}</h4>
        <p className="text-sm text-slate-600">{description}</p>
      </div>
    </div>
  );
}
