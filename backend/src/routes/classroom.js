/**
 * Virtual Classroom System - Backend API Endpoints
 * 
 * Add these endpoints to your server.js file
 * Requires: zoomOAuthService.ts, Supabase client
 */

const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL || 'https://jhzhrpwcfackqinawobg.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoemhycHdjZmFja3FpbmF3b2JnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMjE2MDQsImV4cCI6MjA3NTU5NzYwNH0.tOHiPVTyyMh0a3tCl3YYtgVZEMEVmHvQlJ8QEs4bb8g';
const supabase = createClient(supabaseUrl, supabaseKey);
const zoomOAuthService = require('../services/zoomServerService');

// ================================================
// TEACHER ENDPOINTS - CLASS CREATION & MANAGEMENT
// ================================================

/**
 * POST /api/classes/create
 * Teacher creates a new class with Zoom meeting
 */
app.post('/api/classes/create', async (req, res) => {
  try {
    const {
      title,
      description,
      subject,
      category,
      learning_objectives,
      class_type, // 'one-on-one' or 'group'
      max_students,
      price,
      start_time,
      duration_minutes,
      timezone,
      recurrence,
      recurrence_end_date
    } = req.body;

    const teacher_id = req.user.id; // From auth middleware

    // Validate required fields
    if (!title || !start_time || !duration_minutes) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create Zoom meeting
    const zoomMeeting = await zoomOAuthService.createMeeting(teacher_id, {
      topic: title,
      type: 2, // Scheduled meeting
      start_time: new Date(start_time).toISOString(),
      duration: duration_minutes,
      timezone: timezone || 'UTC',
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: false,
        mute_upon_entry: true,
        waiting_room: true,
        auto_recording: 'cloud'
      }
    });

    // Create class in database
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .insert({
        teacher_id,
        title,
        description,
        subject,
        category,
        learning_objectives: learning_objectives || [],
        class_type: class_type || 'group',
        max_students: max_students || 50,
        price: price || 0,
        zoom_meeting_id: zoomMeeting.id,
        zoom_join_url: zoomMeeting.join_url,
        zoom_host_url: zoomMeeting.start_url,
        zoom_password: zoomMeeting.password,
        start_time,
        duration_minutes,
        timezone: timezone || 'UTC',
        recurrence: recurrence || 'once',
        recurrence_end_date,
        status: 'scheduled'
      })
      .select()
      .single();

    if (classError) {
      console.error('Error creating class:', classError);
      return res.status(500).json({ error: 'Failed to create class' });
    }

    // Send notification
    await supabase
      .from('notifications')
      .insert({
        user_id: teacher_id,
        type: 'class_created',
        title: 'Class Created',
        message: `Your class "${title}" has been created successfully`,
        related_id: classData.id
      });

    res.json({
      success: true,
      message: 'Class created successfully',
      class: classData
    });

  } catch (error) {
    console.error('Error creating class:', error);
    res.status(500).json({ error: 'Failed to create class' });
  }
});

/**
 * GET /api/classes/teacher/:teacherId
 * Get all classes for a teacher
 */
app.get('/api/classes/teacher/:teacherId', async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { status, limit = 20 } = req.query;

    let query = supabase
      .from('classes')
      .select(`
        *,
        enrollments:enrollments(count),
        attendance:attendance(count)
      `)
      .eq('teacher_id', teacherId)
      .order('start_time', { ascending: false })
      .limit(parseInt(limit));

    if (status) {
      query = query.eq('status', status);
    }

    const { data: classes, error } = await query;

    if (error) {
      console.error('Error fetching classes:', error);
      return res.status(500).json({ error: 'Failed to fetch classes' });
    }

    res.json({
      success: true,
      classes: classes || []
    });

  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

/**
 * PUT /api/classes/:classId
 * Teacher updates a class
 */
app.put('/api/classes/:classId', async (req, res) => {
  try {
    const { classId } = req.params;
    const teacher_id = req.user.id;
    const updates = req.body;

    // Verify teacher owns the class
    const { data: classData, error: fetchError } = await supabase
      .from('classes')
      .select('teacher_id')
      .eq('id', classId)
      .single();

    if (fetchError || classData.teacher_id !== teacher_id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Update class
    const { data: updated, error: updateError } = await supabase
      .from('classes')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', classId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating class:', updateError);
      return res.status(500).json({ error: 'Failed to update class' });
    }

    res.json({
      success: true,
      message: 'Class updated successfully',
      class: updated
    });

  } catch (error) {
    console.error('Error updating class:', error);
    res.status(500).json({ error: 'Failed to update class' });
  }
});

/**
 * DELETE /api/classes/:classId
 * Teacher cancels/deletes a class
 */
app.delete('/api/classes/:classId', async (req, res) => {
  try {
    const { classId } = req.params;
    const teacher_id = req.user.id;

    // Verify teacher owns the class
    const { data: classData } = await supabase
      .from('classes')
      .select('teacher_id, zoom_meeting_id')
      .eq('id', classId)
      .single();

    if (classData.teacher_id !== teacher_id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Delete Zoom meeting
    if (classData.zoom_meeting_id) {
      await zoomOAuthService.deleteMeeting(classData.zoom_meeting_id);
    }

    // Mark class as cancelled
    const { error: updateError } = await supabase
      .from('classes')
      .update({ status: 'cancelled' })
      .eq('id', classId);

    if (updateError) {
      console.error('Error cancelling class:', updateError);
      return res.status(500).json({ error: 'Failed to cancel class' });
    }

    res.json({
      success: true,
      message: 'Class cancelled successfully'
    });

  } catch (error) {
    console.error('Error cancelling class:', error);
    res.status(500).json({ error: 'Failed to cancel class' });
  }
});

/**
 * POST /api/classes/:classId/start
 * Teacher starts the class/Zoom meeting
 */
app.post('/api/classes/:classId/start', async (req, res) => {
  try {
    const { classId } = req.params;
    const teacher_id = req.user.id;

    // Get class details
    const { data: classData } = await supabase
      .from('classes')
      .select('*')
      .eq('id', classId)
      .eq('teacher_id', teacher_id)
      .single();

    if (!classData) {
      return res.status(403).json({ error: 'Unauthorized or class not found' });
    }

    // Update class status to 'live'
    await supabase
      .from('classes')
      .update({
        status: 'live',
        updated_at: new Date().toISOString()
      })
      .eq('id', classId);

    // Send notifications to enrolled students
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('student_id')
      .eq('class_id', classId)
      .eq('payment_status', 'completed');

    for (const enrollment of enrollments || []) {
      await supabase
        .from('notifications')
        .insert({
          user_id: enrollment.student_id,
          type: 'class_started',
          title: 'Class Started',
          message: `${classData.title} has started! Join now.`,
          related_id: classId
        });
    }

    res.json({
      success: true,
      message: 'Class started',
      host_url: classData.zoom_host_url
    });

  } catch (error) {
    console.error('Error starting class:', error);
    res.status(500).json({ error: 'Failed to start class' });
  }
});

/**
 * GET /api/classes/:classId/attendees
 * Get list of attendees for a class
 */
app.get('/api/classes/:classId/attendees', async (req, res) => {
  try {
    const { classId } = req.params;

    const { data: attendees, error } = await supabase
      .from('attendance')
      .select(`
        *,
        profiles:student_id (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('class_id', classId)
      .order('join_time', { ascending: false });

    if (error) {
      console.error('Error fetching attendees:', error);
      return res.status(500).json({ error: 'Failed to fetch attendees' });
    }

    res.json({
      success: true,
      attendees: attendees || []
    });

  } catch (error) {
    console.error('Error fetching attendees:', error);
    res.status(500).json({ error: 'Failed to fetch attendees' });
  }
});

// ================================================
// STUDENT ENDPOINTS - CLASS DISCOVERY & ENROLLMENT
// ================================================

/**
 * GET /api/classes
 * Get all available classes (student discovery)
 */
app.get('/api/classes', async (req, res) => {
  try {
    const { subject, search, limit = 20, offset = 0, sort = 'start_time' } = req.query;

    let query = supabase
      .from('classes')
      .select(`
        *,
        teacher:teacher_id (
          id,
          full_name,
          avatar_url,
          bio
        ),
        enrollments:enrollments(count),
        reviews:class_reviews(rating)
      `)
      .eq('status', 'scheduled')
      .gte('start_time', new Date().toISOString())
      .range(offset, offset + limit - 1);

    if (subject) {
      query = query.eq('subject', subject);
    }

    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    const { data: classes, error } = await query;

    if (error) {
      console.error('Error fetching classes:', error);
      return res.status(500).json({ error: 'Failed to fetch classes' });
    }

    // Calculate ratings
    const classesWithRatings = (classes || []).map(cls => ({
      ...cls,
      average_rating: cls.reviews?.length > 0
        ? (cls.reviews.reduce((sum, r) => sum + r.rating, 0) / cls.reviews.length).toFixed(1)
        : null,
      review_count: cls.reviews?.length || 0
    }));

    res.json({
      success: true,
      classes: classesWithRatings
    });

  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

/**
 * GET /api/classes/:classId
 * Get class details
 */
app.get('/api/classes/:classId', async (req, res) => {
  try {
    const { classId } = req.params;

    const { data: classData, error } = await supabase
      .from('classes')
      .select(`
        *,
        teacher:teacher_id (
          id,
          full_name,
          avatar_url,
          bio,
          rating
        ),
        reviews:class_reviews (
          id,
          rating,
          comment,
          created_at,
          student:student_id (
            id,
            full_name,
            avatar_url
          )
        ),
        recordings:recordings (
          id,
          play_url,
          download_url,
          status
        )
      `)
      .eq('id', classId)
      .single();

    if (error) {
      console.error('Error fetching class:', error);
      return res.status(404).json({ error: 'Class not found' });
    }

    res.json({
      success: true,
      class: classData
    });

  } catch (error) {
    console.error('Error fetching class:', error);
    res.status(500).json({ error: 'Failed to fetch class' });
  }
});

/**
 * POST /api/classes/:classId/enroll
 * Student enrolls in a class
 */
app.post('/api/classes/:classId/enroll', async (req, res) => {
  try {
    const { classId } = req.params;
    const student_id = req.user.id;
    const { payment_intent_id, payment_method } = req.body;

    // Get class details
    const { data: classData } = await supabase
      .from('classes')
      .select('*')
      .eq('id', classId)
      .single();

    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Check if already enrolled
    const { data: existing } = await supabase
      .from('enrollments')
      .select('id')
      .eq('class_id', classId)
      .eq('student_id', student_id)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'Already enrolled in this class' });
    }

    // Check if class is full
    if (classData.enrollment_count >= classData.max_students) {
      return res.status(400).json({ error: 'Class is full' });
    }

    // Create enrollment
    const { data: enrollment, error: enrollError } = await supabase
      .from('enrollments')
      .insert({
        class_id: classId,
        student_id,
        payment_status: classData.price === 0 ? 'completed' : 'pending',
        payment_method,
        transaction_id: payment_intent_id,
        amount_paid: classData.price,
        status: 'active'
      })
      .select()
      .single();

    if (enrollError) {
      console.error('Error creating enrollment:', enrollError);
      return res.status(500).json({ error: 'Failed to enroll' });
    }

    // Send confirmation notification to student
    await supabase
      .from('notifications')
      .insert({
        user_id: student_id,
        type: 'enrollment_confirmation',
        title: 'Enrollment Confirmed',
        message: `You have successfully enrolled in ${classData.title}`,
        related_id: classId
      });

    // Send enrollment notification to teacher
    await supabase
      .from('notifications')
      .insert({
        user_id: classData.teacher_id,
        type: 'student_enrolled',
        title: 'New Student Enrolled',
        message: `A new student has enrolled in ${classData.title}`,
        related_id: classId
      });

    res.json({
      success: true,
      message: 'Enrolled successfully',
      enrollment
    });

  } catch (error) {
    console.error('Error enrolling:', error);
    res.status(500).json({ error: 'Failed to enroll' });
  }
});

/**
 * POST /api/classes/:classId/join
 * Student joins a live class
 */
app.post('/api/classes/:classId/join', async (req, res) => {
  try {
    const { classId } = req.params;
    const student_id = req.user.id;

    // Get class details
    const { data: classData } = await supabase
      .from('classes')
      .select('*')
      .eq('id', classId)
      .single();

    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Verify enrollment
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('*')
      .eq('class_id', classId)
      .eq('student_id', student_id)
      .single();

    if (!enrollment) {
      return res.status(403).json({ error: 'Not enrolled in this class' });
    }

    // Check if class is live
    if (classData.status !== 'live') {
      return res.status(400).json({ error: 'Class is not live yet' });
    }

    // Record join time
    const { data: attendanceRecord } = await supabase
      .from('attendance')
      .insert({
        class_id: classId,
        student_id,
        join_time: new Date().toISOString()
      })
      .select()
      .single();

    res.json({
      success: true,
      message: 'Joined class',
      join_url: classData.zoom_join_url,
      attendance_id: attendanceRecord?.id
    });

  } catch (error) {
    console.error('Error joining class:', error);
    res.status(500).json({ error: 'Failed to join class' });
  }
});

/**
 * GET /api/classes/student/:studentId
 * Get student's enrolled classes
 */
app.get('/api/classes/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { status = 'upcoming', limit = 20 } = req.query;

    let query = supabase
      .from('enrollments')
      .select(`
        *,
        class:class_id (
          *,
          teacher:teacher_id (
            id,
            full_name,
            avatar_url
          )
        )
      `)
      .eq('student_id', studentId)
      .eq('status', 'active')
      .limit(parseInt(limit));

    if (status === 'upcoming') {
      query = query.gte('class.start_time', new Date().toISOString());
    } else if (status === 'completed') {
      query = query.lt('class.start_time', new Date().toISOString());
    }

    const { data: enrollments, error } = await query;

    if (error) {
      console.error('Error fetching enrollments:', error);
      return res.status(500).json({ error: 'Failed to fetch enrollments' });
    }

    res.json({
      success: true,
      enrollments: enrollments || []
    });

  } catch (error) {
    console.error('Error fetching enrollments:', error);
    res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
});

// ================================================
// ATTENDANCE ENDPOINTS
// ================================================

/**
 * POST /api/attendance/end
 * Record student leaving class
 */
app.post('/api/attendance/end', async (req, res) => {
  try {
    const { attendance_id } = req.body;

    // Get attendance record
    const { data: record } = await supabase
      .from('attendance')
      .select('*')
      .eq('id', attendance_id)
      .single();

    if (!record) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    // Calculate duration
    const joinTime = new Date(record.join_time);
    const leaveTime = new Date();
    const durationMinutes = Math.floor((leaveTime - joinTime) / 60000);

    // Update attendance record
    const { error: updateError } = await supabase
      .from('attendance')
      .update({
        leave_time: leaveTime.toISOString(),
        duration_minutes: durationMinutes
      })
      .eq('id', attendance_id);

    if (updateError) {
      console.error('Error updating attendance:', updateError);
      return res.status(500).json({ error: 'Failed to update attendance' });
    }

    // Update enrollment attendance duration
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('attendance_duration')
      .eq('class_id', record.class_id)
      .eq('student_id', record.student_id)
      .single();

    if (enrollment) {
      await supabase
        .from('enrollments')
        .update({
          attendance_duration: (enrollment.attendance_duration || 0) + durationMinutes,
          is_attended: true
        })
        .eq('class_id', record.class_id)
        .eq('student_id', record.student_id);
    }

    res.json({
      success: true,
      message: 'Attendance recorded',
      duration_minutes: durationMinutes
    });

  } catch (error) {
    console.error('Error recording attendance:', error);
    res.status(500).json({ error: 'Failed to record attendance' });
  }
});

/**
 * GET /api/attendance/:classId
 * Get attendance report for a class
 */
app.get('/api/attendance/:classId', async (req, res) => {
  try {
    const { classId } = req.params;

    const { data: attendance, error } = await supabase
      .from('attendance')
      .select(`
        *,
        student:student_id (
          id,
          full_name,
          email
        )
      `)
      .eq('class_id', classId)
      .order('join_time', { ascending: false });

    if (error) {
      console.error('Error fetching attendance:', error);
      return res.status(500).json({ error: 'Failed to fetch attendance' });
    }

    // Calculate statistics
    const totalAttendees = new Set(attendance.map(a => a.student_id)).size;
    const totalMinutes = attendance.reduce((sum, a) => sum + (a.duration_minutes || 0), 0);
    const averageAttendance = totalAttendees > 0 ? (totalMinutes / totalAttendees).toFixed(1) : 0;

    res.json({
      success: true,
      attendance,
      statistics: {
        total_attendees: totalAttendees,
        total_minutes: totalMinutes,
        average_attendance: averageAttendance
      }
    });

  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

// ================================================
// RECORDING & CERTIFICATE ENDPOINTS
// ================================================

/**
 * GET /api/classes/:classId/recordings
 * Get recordings for a class
 */
app.get('/api/classes/:classId/recordings', async (req, res) => {
  try {
    const { classId } = req.params;

    const { data: recordings, error } = await supabase
      .from('recordings')
      .select('*')
      .eq('class_id', classId)
      .eq('is_available', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching recordings:', error);
      return res.status(500).json({ error: 'Failed to fetch recordings' });
    }

    res.json({
      success: true,
      recordings: recordings || []
    });

  } catch (error) {
    console.error('Error fetching recordings:', error);
    res.status(500).json({ error: 'Failed to fetch recordings' });
  }
});

/**
 * POST /api/certificates/generate
 * Generate certificate for student upon class completion
 */
app.post('/api/certificates/generate', async (req, res) => {
  try {
    const { class_id, student_id } = req.body;

    // Get class and enrollment details
    const { data: classData } = await supabase
      .from('classes')
      .select('*')
      .eq('id', class_id)
      .single();

    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('attendance_duration')
      .eq('class_id', class_id)
      .eq('student_id', student_id)
      .single();

    if (!classData || !enrollment) {
      return res.status(404).json({ error: 'Class or enrollment not found' });
    }

    // Check minimum attendance (75%)
    const minRequired = classData.duration_minutes * 0.75;
    if (enrollment.attendance_duration < minRequired) {
      return res.status(400).json({ 
        error: `Minimum attendance (75%) required. You attended ${enrollment.attendance_duration}/${classData.duration_minutes} minutes` 
      });
    }

    // Generate certificate
    const { data: certificate, error: certError } = await supabase
      .from('certificates')
      .insert({
        student_id,
        class_id,
        teacher_id: classData.teacher_id,
        certificate_number: `CERT-${Date.now()}`,
        completion_date: new Date().toISOString().split('T')[0],
        hours_completed: (enrollment.attendance_duration / 60).toFixed(2)
      })
      .select()
      .single();

    if (certError) {
      console.error('Error generating certificate:', certError);
      return res.status(500).json({ error: 'Failed to generate certificate' });
    }

    res.json({
      success: true,
      message: 'Certificate generated',
      certificate
    });

  } catch (error) {
    console.error('Error generating certificate:', error);
    res.status(500).json({ error: 'Failed to generate certificate' });
  }
});

// ================================================
// REVIEW ENDPOINTS
// ================================================

/**
 * POST /api/classes/:classId/review
 * Student reviews a class
 */
app.post('/api/classes/:classId/review', async (req, res) => {
  try {
    const { classId } = req.params;
    const student_id = req.user.id;
    const { rating, comment } = req.body;

    // Verify enrollment and completion
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('*')
      .eq('class_id', classId)
      .eq('student_id', student_id)
      .single();

    if (!enrollment) {
      return res.status(403).json({ error: 'Not enrolled in this class' });
    }

    // Create review
    const { data: review, error: reviewError } = await supabase
      .from('class_reviews')
      .insert({
        class_id: classId,
        student_id,
        rating,
        comment
      })
      .select()
      .single();

    if (reviewError) {
      console.error('Error creating review:', reviewError);
      return res.status(500).json({ error: 'Failed to create review' });
    }

    res.json({
      success: true,
      message: 'Review submitted',
      review
    });

  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

module.exports = { zoomOAuthService };
