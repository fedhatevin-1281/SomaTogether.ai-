// Zoom API Endpoints for Backend Server
// Add these endpoints to your server.js file

const express = require('express');
const { zoomService } = require('./src/services/zoomService');

// ==============================================
// ZOOM ACCOUNT MANAGEMENT
// ==============================================

// Connect teacher's Zoom account
app.post('/api/zoom/connect', async (req, res) => {
  try {
    const { teacherId, zoomUserId, email, firstName, lastName, apiKey, apiSecret } = req.body;

    if (!teacherId || !zoomUserId || !email || !apiKey || !apiSecret) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify teacher exists
    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .select('id')
      .eq('id', teacherId)
      .single();

    if (teacherError || !teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Store zoom account details
    const { data: zoomAccount, error: zoomError } = await supabase
      .from('zoom_accounts')
      .upsert({
        teacher_id: teacherId,
        zoom_user_id: zoomUserId,
        email,
        first_name: firstName,
        last_name: lastName,
        api_key: apiKey,
        api_secret: apiSecret,
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (zoomError) {
      console.error('Error connecting Zoom account:', zoomError);
      return res.status(500).json({ error: 'Failed to connect Zoom account' });
    }

    // Update teacher's zoom status
    await supabase
      .from('teachers')
      .update({
        zoom_connected: true,
        zoom_email: email,
        updated_at: new Date().toISOString()
      })
      .eq('id', teacherId);

    res.json({
      success: true,
      message: 'Zoom account connected successfully',
      zoomAccount
    });

  } catch (error) {
    console.error('Error connecting Zoom account:', error);
    res.status(500).json({ error: 'Failed to connect Zoom account' });
  }
});

// Get teacher's Zoom account status
app.get('/api/zoom/status/:teacherId', async (req, res) => {
  try {
    const { teacherId } = req.params;

    const { data: zoomAccount, error } = await supabase
      .from('zoom_accounts')
      .select('*')
      .eq('teacher_id', teacherId)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching Zoom account:', error);
      return res.status(500).json({ error: 'Failed to fetch Zoom account' });
    }

    res.json({
      connected: !!zoomAccount,
      account: zoomAccount || null
    });

  } catch (error) {
    console.error('Error fetching Zoom status:', error);
    res.status(500).json({ error: 'Failed to fetch Zoom status' });
  }
});

// ==============================================
// MEETING MANAGEMENT
// ==============================================

// Create a Zoom meeting for a class session
app.post('/api/zoom/meetings/create', async (req, res) => {
  try {
    const { sessionId, topic, startTime, duration, timezone = 'UTC' } = req.body;

    if (!sessionId || !topic || !startTime || !duration) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get session details
    const { data: session, error: sessionError } = await supabase
      .from('class_sessions')
      .select(`
        id,
        teacher_id,
        title,
        description,
        scheduled_start,
        scheduled_end,
        classes!class_sessions_class_id_fkey (
          title
        )
      `)
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({ error: 'Class session not found' });
    }

    // Get teacher's Zoom account
    const { data: zoomAccount, error: zoomError } = await supabase
      .from('zoom_accounts')
      .select('*')
      .eq('teacher_id', session.teacher_id)
      .eq('is_active', true)
      .single();

    if (zoomError || !zoomAccount) {
      return res.status(400).json({ error: 'Teacher does not have a connected Zoom account' });
    }

    // Create meeting using Zoom API
    const meetingData = {
      topic: topic,
      type: 2,
      start_time: new Date(startTime).toISOString(),
      duration: parseInt(duration),
      timezone: timezone,
      agenda: `Online class session: ${session.classes?.title || session.title}`,
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: false,
        mute_upon_entry: true,
        waiting_room: true,
        auto_recording: 'cloud'
      }
    };

    // Use Zoom API to create meeting
    const zoomMeeting = await zoomService.createMeeting(zoomAccount.zoom_user_id, meetingData);

    // Store meeting in database
    const { data: meeting, error: meetingError } = await supabase
      .from('zoom_meetings')
      .insert({
        meeting_id: zoomMeeting.id,
        teacher_id: session.teacher_id,
        class_session_id: sessionId,
        topic: zoomMeeting.topic,
        description: zoomMeeting.agenda,
        start_time: zoomMeeting.start_time,
        duration_minutes: zoomMeeting.duration,
        timezone: zoomMeeting.timezone,
        join_url: zoomMeeting.join_url,
        start_url: zoomMeeting.start_url,
        password: zoomMeeting.password,
        meeting_type: zoomMeeting.type,
        status: 'scheduled',
        settings: zoomMeeting.settings
      })
      .select()
      .single();

    if (meetingError) {
      console.error('Error storing meeting:', meetingError);
      return res.status(500).json({ error: 'Failed to store meeting details' });
    }

    // Update class session with meeting URL
    await supabase
      .from('class_sessions')
      .update({
        meeting_url: zoomMeeting.join_url,
        zoom_meeting_id: meeting.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    res.json({
      success: true,
      meeting: {
        ...meeting,
        zoom_meeting: zoomMeeting
      }
    });

  } catch (error) {
    console.error('Error creating Zoom meeting:', error);
    res.status(500).json({ error: 'Failed to create Zoom meeting' });
  }
});

// Get meetings for a teacher
app.get('/api/zoom/meetings/teacher/:teacherId', async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { status = 'upcoming', limit = 10 } = req.query;

    let query = supabase
      .from('zoom_meetings')
      .select(`
        *,
        class_sessions!zoom_meetings_class_session_id_fkey (
          id,
          title,
          description,
          scheduled_start,
          scheduled_end,
          classes!class_sessions_class_id_fkey (
            title,
            students!classes_student_id_fkey (
              profiles!students_id_fkey (
                full_name,
                avatar_url
              )
            )
          )
        )
      `)
      .eq('teacher_id', teacherId)
      .order('start_time', { ascending: true })
      .limit(parseInt(limit));

    if (status === 'upcoming') {
      query = query.gte('start_time', new Date().toISOString());
    } else if (status === 'past') {
      query = query.lt('start_time', new Date().toISOString());
    }

    const { data: meetings, error } = await query;

    if (error) {
      console.error('Error fetching meetings:', error);
      return res.status(500).json({ error: 'Failed to fetch meetings' });
    }

    res.json(meetings || []);

  } catch (error) {
    console.error('Error fetching meetings:', error);
    res.status(500).json({ error: 'Failed to fetch meetings' });
  }
});

// Get meetings for a student
app.get('/api/zoom/meetings/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { status = 'upcoming', limit = 10 } = req.query;

    let query = supabase
      .from('zoom_meetings')
      .select(`
        *,
        class_sessions!zoom_meetings_class_session_id_fkey (
          id,
          title,
          description,
          scheduled_start,
          scheduled_end,
          classes!class_sessions_class_id_fkey (
            title,
            teachers!classes_teacher_id_fkey (
              profiles!teachers_id_fkey (
                full_name,
                avatar_url
              )
            )
          )
        )
      `)
      .eq('class_sessions.classes.student_id', studentId)
      .order('start_time', { ascending: true })
      .limit(parseInt(limit));

    if (status === 'upcoming') {
      query = query.gte('start_time', new Date().toISOString());
    } else if (status === 'past') {
      query = query.lt('start_time', new Date().toISOString());
    }

    const { data: meetings, error } = await query;

    if (error) {
      console.error('Error fetching student meetings:', error);
      return res.status(500).json({ error: 'Failed to fetch meetings' });
    }

    res.json(meetings || []);

  } catch (error) {
    console.error('Error fetching student meetings:', error);
    res.status(500).json({ error: 'Failed to fetch meetings' });
  }
});

// Get meeting details
app.get('/api/zoom/meetings/:meetingId', async (req, res) => {
  try {
    const { meetingId } = req.params;

    const { data: meeting, error } = await supabase
      .from('zoom_meetings')
      .select(`
        *,
        meeting_participants (
          user_id,
          user_type,
          join_time,
          leave_time,
          is_host,
          profiles!meeting_participants_user_id_fkey (
            full_name,
            avatar_url
          )
        ),
        meeting_recordings (
          recording_type,
          play_url,
          download_url,
          status
        )
      `)
      .eq('id', meetingId)
      .single();

    if (error) {
      console.error('Error fetching meeting details:', error);
      return res.status(500).json({ error: 'Failed to fetch meeting details' });
    }

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    res.json(meeting);

  } catch (error) {
    console.error('Error fetching meeting details:', error);
    res.status(500).json({ error: 'Failed to fetch meeting details' });
  }
});

// Join a meeting (record participation)
app.post('/api/zoom/meetings/:meetingId/join', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { userId, userType } = req.body;

    if (!userId || !userType) {
      return res.status(400).json({ error: 'Missing user information' });
    }

    // Record participant joining
    const { data: participant, error } = await supabase
      .from('meeting_participants')
      .upsert({
        meeting_id: meetingId,
        user_id: userId,
        user_type: userType,
        join_time: new Date().toISOString(),
        is_host: userType === 'teacher'
      })
      .select()
      .single();

    if (error) {
      console.error('Error recording participant:', error);
      return res.status(500).json({ error: 'Failed to record participant' });
    }

    // Update meeting status if it's the first participant
    await supabase
      .from('zoom_meetings')
      .update({
        status: 'started',
        participants_count: supabase.sql`participants_count + 1`
      })
      .eq('id', meetingId);

    res.json({
      success: true,
      participant
    });

  } catch (error) {
    console.error('Error joining meeting:', error);
    res.status(500).json({ error: 'Failed to join meeting' });
  }
});

// Update meeting status
app.put('/api/zoom/meetings/:meetingId/status', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { status } = req.body;

    if (!status || !['scheduled', 'started', 'ended', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const { data: meeting, error } = await supabase
      .from('zoom_meetings')
      .update({
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', meetingId)
      .select()
      .single();

    if (error) {
      console.error('Error updating meeting status:', error);
      return res.status(500).json({ error: 'Failed to update meeting status' });
    }

    res.json({
      success: true,
      meeting
    });

  } catch (error) {
    console.error('Error updating meeting status:', error);
    res.status(500).json({ error: 'Failed to update meeting status' });
  }
});

// Delete a meeting
app.delete('/api/zoom/meetings/:meetingId', async (req, res) => {
  try {
    const { meetingId } = req.params;

    // Get meeting details
    const { data: meeting, error: fetchError } = await supabase
      .from('zoom_meetings')
      .select('meeting_id, teacher_id')
      .eq('id', meetingId)
      .single();

    if (fetchError || !meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    // Delete from Zoom (if meeting exists)
    if (meeting.meeting_id && meeting.meeting_id !== 'pending') {
      try {
        await zoomService.deleteMeeting(meeting.meeting_id);
      } catch (zoomError) {
        console.warn('Failed to delete meeting from Zoom:', zoomError);
      }
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('zoom_meetings')
      .delete()
      .eq('id', meetingId);

    if (deleteError) {
      console.error('Error deleting meeting:', deleteError);
      return res.status(500).json({ error: 'Failed to delete meeting' });
    }

    res.json({
      success: true,
      message: 'Meeting deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting meeting:', error);
    res.status(500).json({ error: 'Failed to delete meeting' });
  }
});

// ==============================================
// WEBHOOK HANDLERS
// ==============================================

// Handle Zoom webhooks
app.post('/api/zoom/webhooks', async (req, res) => {
  try {
    const { event, payload } = req.body;

    switch (event) {
      case 'meeting.started':
        await handleMeetingStarted(payload);
        break;
      case 'meeting.ended':
        await handleMeetingEnded(payload);
        break;
      case 'meeting.participant.joined':
        await handleParticipantJoined(payload);
        break;
      case 'meeting.participant.left':
        await handleParticipantLeft(payload);
        break;
      case 'recording.completed':
        await handleRecordingCompleted(payload);
        break;
      default:
        console.log('Unhandled Zoom webhook event:', event);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error handling Zoom webhook:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

// Helper functions for webhook handling
async function handleMeetingStarted(payload) {
  const { object } = payload;
  
  await supabase
    .from('zoom_meetings')
    .update({
      status: 'started',
      updated_at: new Date().toISOString()
    })
    .eq('meeting_id', object.id);
}

async function handleMeetingEnded(payload) {
  const { object } = payload;
  
  await supabase
    .from('zoom_meetings')
    .update({
      status: 'ended',
      updated_at: new Date().toISOString()
    })
    .eq('meeting_id', object.id);
}

async function handleParticipantJoined(payload) {
  const { object } = payload;
  
  // Update participants count
  await supabase
    .from('zoom_meetings')
    .update({
      participants_count: supabase.sql`participants_count + 1`
    })
    .eq('meeting_id', object.id);
}

async function handleParticipantLeft(payload) {
  const { object } = payload;
  
  // Update participants count
  await supabase
    .from('zoom_meetings')
    .update({
      participants_count: supabase.sql`GREATEST(participants_count - 1, 0)`
    })
    .eq('meeting_id', object.id);
}

async function handleRecordingCompleted(payload) {
  const { object } = payload;
  
  // Store recording information
  for (const recording of object.recording_files) {
    await supabase
      .from('meeting_recordings')
      .insert({
        meeting_id: object.id,
        recording_id: recording.id,
        recording_type: recording.recording_type,
        file_size: recording.file_size,
        play_url: recording.play_url,
        download_url: recording.download_url,
        status: 'completed'
      });
  }
  
  // Update meeting with recording availability
  await supabase
    .from('zoom_meetings')
    .update({
      recording_available: true,
      updated_at: new Date().toISOString()
    })
    .eq('meeting_id', object.id);
}

