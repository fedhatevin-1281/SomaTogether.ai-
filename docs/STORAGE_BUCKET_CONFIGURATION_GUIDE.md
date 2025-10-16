# Storage Bucket Configuration Guide

## 🎯 **Goal**
Configure your Supabase storage buckets to be public for testing the materials upload functionality.

## 📋 **Step-by-Step Instructions**

### **Step 1: Access Supabase Dashboard**
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Select your project (SomaTogether.ai)

### **Step 2: Navigate to Storage**
1. In the left sidebar, click **"Storage"**
2. Click **"Buckets"**

### **Step 3: Configure Each Bucket**

You should see 4 buckets that need to be configured:
- `materials-videos`
- `materials-pdfs` 
- `materials-images`
- `materials-other`

**For EACH bucket, follow these steps:**

#### **3.1: Click on the bucket name**
- Click on `materials-videos` first

#### **3.2: Configure bucket settings**
1. **Public bucket**: Toggle **ON** ✅ (This is the most important setting!)
2. **File size limit**: Set to `50 MB` maximum
3. **Allowed MIME types**: **Leave EMPTY** (this allows all file types)
4. **Click "Save"**

#### **3.3: Repeat for other buckets**
- Click on `materials-pdfs` → Configure → Save
- Click on `materials-images` → Configure → Save  
- Click on `materials-other` → Configure → Save

## 🔧 **Detailed Configuration Settings**

### **For `materials-videos`:**
- ✅ **Public bucket**: ON
- ✅ **File size limit**: 50 MB maximum
- ✅ **Allowed MIME types**: (empty)
- ✅ **Save**

### **For `materials-pdfs`:**
- ✅ **Public bucket**: ON
- ✅ **File size limit**: 50 MB maximum
- ✅ **Allowed MIME types**: (empty)
- ✅ **Save**

### **For `materials-images`:**
- ✅ **Public bucket**: ON
- ✅ **File size limit**: 50 MB maximum
- ✅ **Allowed MIME types**: (empty)
- ✅ **Save**

### **For `materials-other`:**
- ✅ **Public bucket**: ON
- ✅ **File size limit**: 50 MB maximum
- ✅ **Allowed MIME types**: (empty)
- ✅ **Save**

## 🧪 **Test the Configuration**

After configuring all buckets:

1. **Refresh your browser** (important!)
2. **Go to your app**: http://localhost:3001
3. **Login as a teacher**
4. **Navigate to Materials Library**
5. **Click "Test File Upload"** in the debug section
6. **Check the console** for success/error messages

## ✅ **Expected Results**

You should see:
- ✅ **No more "RLS policy" errors**
- ✅ **Upload successful message**
- ✅ **Test file uploaded and cleaned up**
- ✅ **Upload buttons working in the UI**

## 🚨 **If You Still Get Errors**

### **Error 1: "Bucket not found"**
- Verify all 4 buckets exist in Storage → Buckets
- Check bucket names are exactly: `materials-videos`, `materials-pdfs`, `materials-images`, `materials-other`

### **Error 2: "Still getting RLS errors"**
- Double-check that **"Public bucket"** is toggled **ON** for all buckets
- Refresh your browser completely
- Try incognito/private browsing mode

### **Error 3: "MIME type not supported"**
- Ensure **"Allowed MIME types"** field is **EMPTY** for all buckets
- This allows any file type to be uploaded

## 🔒 **Security Note**

**Making buckets public means:**
- ✅ Anyone with the file URL can access the files
- ✅ Good for testing and development
- ⚠️ Not recommended for production

**For production, you should:**
1. Keep buckets private
2. Set up proper RLS policies
3. Use signed URLs for file access

## 📱 **Quick Checklist**

- [ ] Opened Supabase Dashboard
- [ ] Went to Storage → Buckets
- [ ] Configured `materials-videos` (Public: ON, MIME: empty, Size: 50MB)
- [ ] Configured `materials-pdfs` (Public: ON, MIME: empty, Size: 50MB)
- [ ] Configured `materials-images` (Public: ON, MIME: empty, Size: 50MB)
- [ ] Configured `materials-other` (Public: ON, MIME: empty, Size: 50MB)
- [ ] Refreshed browser
- [ ] Tested upload functionality

**Once all checkboxes are completed, your upload functionality should work!** 🎉
