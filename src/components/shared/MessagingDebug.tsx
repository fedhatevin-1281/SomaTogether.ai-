import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { CheckCircle, XCircle, AlertCircle, Clock, MessageSquare, Users } from 'lucide-react';
import { messagingService } from '../../services/messagingService';
import { useAuth } from '../../contexts/AuthContext';

interface DebugResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message?: string;
  details?: any;
}

export function MessagingDebug() {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState<DebugResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);

  const tests: DebugResult[] = [
    { name: 'Database Connection', status: 'pending' },
    { name: 'Load Conversations', status: 'pending' },
    { name: 'Load Messages', status: 'pending' },
    { name: 'Create Conversation', status: 'pending' },
    { name: 'Send Message', status: 'pending' },
    { name: 'Real-time Subscription', status: 'pending' },
  ];

  const runTest = async (testName: string, testFn: () => Promise<any>) => {
    setTestResults(prev => prev.map(test => 
      test.name === testName ? { ...test, status: 'running' } : test
    ));

    try {
      const result = await testFn();
      setTestResults(prev => prev.map(test => 
        test.name === testName 
          ? { ...test, status: 'passed', message: 'Success', details: result }
          : test
      ));
      return result;
    } catch (error) {
      setTestResults(prev => prev.map(test => 
        test.name === testName 
          ? { ...test, status: 'failed', message: error instanceof Error ? error.message : 'Unknown error' }
          : test
      ));
      throw error;
    }
  };

  const runAllTests = async () => {
    if (!user?.id) {
      alert('Please log in to run tests');
      return;
    }

    setIsRunning(true);
    setTestResults(tests);

    try {
      // Test 1: Database Connection
      await runTest('Database Connection', async () => {
        const { supabase } = await import('../../supabaseClient');
        const { data, error } = await supabase.from('profiles').select('id').limit(1);
        if (error) throw error;
        return { connected: true, profiles: data?.length || 0 };
      });

      // Test 2: Load Conversations
      const conversationsResult = await runTest('Load Conversations', async () => {
        const result = await messagingService.getConversations(user.id);
        setConversations(result);
        return { count: result.length, conversations: result };
      });

      // Test 3: Load Messages
      await runTest('Load Messages', async () => {
        if (conversationsResult.details.conversations.length > 0) {
          const conversationId = conversationsResult.details.conversations[0].id;
          const result = await messagingService.getMessages(conversationId);
          setMessages(result);
          return { count: result.length, messages: result };
        } else {
          return { count: 0, messages: [] };
        }
      });

      // Test 4: Create Conversation (only if we have other users)
      await runTest('Create Conversation', async () => {
        const { supabase } = await import('../../supabaseClient');
        const { data: otherUsers } = await supabase
          .from('profiles')
          .select('id')
          .neq('id', user.id)
          .limit(1);
        
        if (otherUsers && otherUsers.length > 0) {
          const result = await messagingService.createConversation([user.id, otherUsers[0].id], 'direct');
          return { created: true, conversation: result };
        } else {
          return { created: false, reason: 'No other users found' };
        }
      });

      // Test 5: Send Message
      await runTest('Send Message', async () => {
        if (conversationsResult.details.conversations.length > 0) {
          const conversationId = conversationsResult.details.conversations[0].id;
          const result = await messagingService.sendMessage(
            conversationId,
            user.id,
            `Test message at ${new Date().toISOString()}`,
            'text'
          );
          return { sent: true, message: result };
        } else {
          return { sent: false, reason: 'No conversations available' };
        }
      });

      // Test 6: Real-time Subscription
      await runTest('Real-time Subscription', async () => {
        if (conversationsResult.details.conversations.length > 0) {
          const conversationId = conversationsResult.details.conversations[0].id;
          
          // Set up a temporary subscription
          const channel = messagingService.subscribeToMessages(
            conversationId,
            (message) => {
              console.log('Received real-time message:', message);
            }
          );

          // Clean up after 2 seconds
          setTimeout(() => {
            messagingService.unsubscribeFromMessages(conversationId);
          }, 2000);

          return { subscribed: true, channel: 'active' };
        } else {
          return { subscribed: false, reason: 'No conversations available' };
        }
      });

    } catch (error) {
      console.error('Test failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const passedTests = testResults.filter(test => test.status === 'passed').length;
  const totalTests = testResults.length;

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Messaging System Debug</h2>
          <div className="flex items-center space-x-2">
            {totalTests > 0 && (
              <Badge variant={passedTests === totalTests ? 'default' : 'secondary'}>
                {passedTests}/{totalTests} Tests Passed
              </Badge>
            )}
            <Button 
              onClick={runAllTests} 
              disabled={isRunning || !user}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {isRunning ? 'Running Tests...' : 'Run Tests'}
            </Button>
          </div>
        </div>

        {!user && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please log in to test the messaging functionality.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="font-medium flex items-center">
              <Users className="h-4 w-4 mr-2" />
              System Status
            </h3>
            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span>User ID:</span>
                <span className="font-mono text-xs">{user?.id ? 'Connected' : 'Not Connected'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>User Role:</span>
                <span className="capitalize">{user?.role || 'Unknown'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Conversations:</span>
                <span>{conversations.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Messages:</span>
                <span>{messages.length}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium flex items-center">
              <MessageSquare className="h-4 w-4 mr-2" />
              Test Results
            </h3>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {testResults.length === 0 ? (
                <p className="text-sm text-gray-500">Click "Run Tests" to start testing</p>
              ) : (
                testResults.map((test, index) => (
                  <div key={index} className="flex items-start space-x-2 text-sm">
                    {getStatusIcon(test.status)}
                    <div className="flex-1">
                      <div className="font-medium">{test.name}</div>
                      {test.message && (
                        <div className={`text-xs ${
                          test.status === 'passed' ? 'text-green-600' : 
                          test.status === 'failed' ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {test.message}
                        </div>
                      )}
                      {test.details && (
                        <details className="text-xs text-gray-500 mt-1">
                          <summary>Details</summary>
                          <pre className="mt-1 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                            {JSON.stringify(test.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-1">Quick Actions</h4>
          <div className="flex flex-wrap gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => console.log('Conversations:', conversations)}
            >
              Log Conversations
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => console.log('Messages:', messages)}
            >
              Log Messages
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => console.log('Test Results:', testResults)}
            >
              Log Test Results
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

