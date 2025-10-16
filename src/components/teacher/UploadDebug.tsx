import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';

export function UploadDebug() {
  const { user } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    const runDebug = async () => {
      const info: any = {
        userAuthenticated: !!user,
        userId: user?.id,
        userRole: user?.role,
        supabaseConnected: false,
        bucketsExist: [],
        tablesExist: [],
        errors: []
      };

      try {
        // Test Supabase connection
        const { data: testData, error: testError } = await supabase
          .from('profiles')
          .select('id')
          .limit(1);
        
        if (!testError) {
          info.supabaseConnected = true;
        } else {
          info.errors.push(`Supabase connection error: ${testError.message}`);
        }

        // Test buckets
        const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
        if (!bucketError) {
          const requiredBuckets = ['materials-videos', 'materials-pdfs', 'materials-images', 'materials-other'];
          info.bucketsExist = requiredBuckets.map(bucketName => ({
            name: bucketName,
            exists: buckets.some(b => b.name === bucketName)
          }));
        } else {
          info.errors.push(`Bucket listing error: ${bucketError.message}`);
        }

        // Test tables
        const tables = ['materials_library', 'material_categories', 'subjects'];
        for (const table of tables) {
          try {
            const { error } = await supabase.from(table).select('id').limit(1);
            info.tablesExist.push({
              name: table,
              exists: !error
            });
            if (error) {
              info.errors.push(`Table ${table} error: ${error.message}`);
            }
          } catch (err) {
            info.tablesExist.push({
              name: table,
              exists: false
            });
            info.errors.push(`Table ${table} error: ${err}`);
          }
        }

      } catch (err) {
        info.errors.push(`General error: ${err}`);
      }

      setDebugInfo(info);
    };

    runDebug();
  }, [user]);

  const testUpload = async () => {
    setTesting(true);
    try {
      // Create a simple test image file (1x1 pixel PNG)
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 1, 1);
      
      canvas.toBlob(async (blob) => {
        if (!blob) {
          alert('Failed to create test file');
          setTesting(false);
          return;
        }
        
        const testFile = new File([blob], 'test.png', { type: 'image/png' });
        
        console.log('Testing upload with file:', testFile.name, testFile.size, 'bytes');
        console.log('Current user:', user?.id, user?.role);
        
        const { data, error } = await supabase.storage
          .from('materials-images')
          .upload(`test/test-${Date.now()}.png`, testFile);
        
        if (error) {
          console.error('Upload error details:', error);
          alert(`Upload failed: ${error.message}\nError code: ${error.statusCode}\nCheck console for details.`);
        } else {
          console.log('Upload successful:', data);
          alert(`Upload successful! File path: ${data.path}`);
          
          // Clean up
          await supabase.storage
            .from('materials-images')
            .remove([data.path]);
        }
        
        setTesting(false);
      }, 'image/png');
    } catch (err) {
      console.error('Upload test failed:', err);
      alert(`Upload test failed: ${err}`);
      setTesting(false);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold mb-4">Upload Debug Information</h3>
      
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold">Authentication</h4>
          <p>User Authenticated: {debugInfo.userAuthenticated ? '✅ Yes' : '❌ No'}</p>
          <p>User ID: {debugInfo.userId || 'None'}</p>
          <p>User Role: {debugInfo.userRole || 'None'}</p>
        </div>

        <div>
          <h4 className="font-semibold">Supabase Connection</h4>
          <p>Connected: {debugInfo.supabaseConnected ? '✅ Yes' : '❌ No'}</p>
        </div>

        <div>
          <h4 className="font-semibold">Storage Buckets</h4>
          {debugInfo.bucketsExist?.map((bucket: any) => (
            <p key={bucket.name}>
              {bucket.name}: {bucket.exists ? '✅ Exists' : '❌ Missing'}
            </p>
          ))}
        </div>

        <div>
          <h4 className="font-semibold">Database Tables</h4>
          {debugInfo.tablesExist?.map((table: any) => (
            <p key={table.name}>
              {table.name}: {table.exists ? '✅ Exists' : '❌ Missing'}
            </p>
          ))}
        </div>

        {debugInfo.errors?.length > 0 && (
          <div>
            <h4 className="font-semibold text-red-600">Errors</h4>
            {debugInfo.errors.map((error: string, index: number) => (
              <p key={index} className="text-red-600 text-sm">{error}</p>
            ))}
          </div>
        )}

        <Button 
          onClick={testUpload} 
          disabled={testing}
          className="w-full"
        >
          {testing ? 'Testing...' : 'Test File Upload'}
        </Button>
      </div>
    </Card>
  );
}
