const { createClient } = require('@supabase/supabase-js');
const zoomServerService = require('../../src/services/zoomServerService');

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://jhzhrpwcfackqinawobg.supabase.co';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoemhycHdjZmFja3FpbmF3b2JnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMjE2MDQsImV4cCI6MjA3NTU5NzYwNH0.tOHiPVTyyMh0a3tCl3YYtgVZEMEVmHvQlJ8QEs4bb8g';

const supabase = createClient(supabaseUrl, supabaseKey);

function getPathParts(req) {
  const rawPath = req.query.path || [];
  return Array.isArray(rawPath) ? rawPath : [rawPath];
}

function sendZoomError(res, error, fallbackMessage = 'Unable to connect to Zoom. Please try again later.') {
  console.error('Zoom integration error:', error.response?.data || error.message || error);

  if (error.code === 'ZOOM_NOT_CONFIGURED') {
    return res.status(503).json({
      success: false,
      configured: false,
      error: 'Zoom is not configured by the administrator.',
      missing: error.missing || []
    });
  }

  return res.status(502).json({
    success: false,
    error: fallbackMessage
  });
}

function publicMeeting(meeting) {
  if (!meeting) return null;
  const { start_url, ...safeMeeting } = meeting;
  return safeMeeting;
}

async function saveZoomAccountForTeacher(teacherId, zoomUser) {
  const { data: zoomAccount, error } = await supabase
    .from('zoom_accounts')
    .upsert({
      teacher_id: teacherId,
      zoom_user_id: `${zoomUser.id}:${teacherId}`,
      email: zoomUser.email || `${zoomUser.id}@zoom.local`,
      first_name: zoomUser.first_name || 'Zoom',
      last_name: zoomUser.last_name || 'Host',
      personal_meeting_url: zoomUser.personal_meeting_url || zoomUser.vanity_url || null,
      is_active: true,
      updated_at: new Date().toISOString()
    }, { onConflict: 'teacher_id' })
    .select()
    .single();

  if (error) throw error;

  await supabase
    .from('teachers')
    .update({
      zoom_connected: true,
      zoom_email: zoomAccount.email,
      updated_at: new Date().toISOString()
    })
    .eq('id', teacherId);

  return zoomAccount;
}

async function createAndStoreZoomMeetingForSession(session, options = {}) {
  const duration = Number(options.duration || session.duration_minutes || 60);
  const topic = options.topic || session.title;
  const startTime = new Date(options.startTime || session.scheduled_start).toISOString();

  const zoomMeeting = await zoomServerService.createZoomMeeting({
    zoomUserId: 'me',
    topic,
    startTime,
    duration,
    timezone: options.timezone || 'UTC',
    password: options.password,
    agenda: options.agenda || session.description || `SomaTogether class session: ${topic}`
  });

  const { data: meeting, error: meetingError } = await supabase
    .from('zoom_meetings')
    .insert({
      meeting_id: String(zoomMeeting.id),
      teacher_id: session.teacher_id,
      class_session_id: session.id,
      topic: zoomMeeting.topic,
      description: zoomMeeting.agenda,
      start_time: zoomMeeting.start_time,
      duration_minutes: zoomMeeting.duration,
      timezone: zoomMeeting.timezone || options.timezone || 'UTC',
      join_url: zoomMeeting.join_url,
      start_url: zoomMeeting.start_url,
      password: zoomMeeting.password,
      meeting_type: zoomMeeting.type,
      status: 'scheduled',
      settings: zoomMeeting.settings || {}
    })
    .select()
    .single();

  if (meetingError) throw meetingError;

  const { error: sessionUpdateError } = await supabase
    .from('class_sessions')
    .update({
      meeting_url: zoomMeeting.join_url,
      meeting_id: String(zoomMeeting.id),
      zoom_meeting_id: meeting.id,
      updated_at: new Date().toISOString()
    })
    .eq('id', session.id);

  if (sessionUpdateError) throw sessionUpdateError;

  return meeting;
}

async function handleStatus(req, res, teacherId) {
  const configuration = zoomServerService.getZoomConfigurationStatus();
  const { data: zoomAccount, error } = await supabase
    .from('zoom_accounts')
    .select('id, teacher_id, zoom_user_id, email, first_name, last_name, personal_meeting_url, is_active, created_at')
    .eq('teacher_id', teacherId)
    .eq('is_active', true)
    .maybeSingle();

  if (error) throw error;

  return res.json({
    success: true,
    configured: configuration.configured,
    missing: configuration.missing,
    connected: configuration.configured && !!zoomAccount,
    account: zoomAccount || null
  });
}

async function handleConnect(req, res) {
  const { teacherId } = req.body || {};

  if (!teacherId) {
    return res.status(400).json({ success: false, error: 'Teacher ID is required' });
  }

  await zoomServerService.getZoomAccessToken();

  const { data: teacher, error: teacherError } = await supabase
    .from('teachers')
    .select('id')
    .eq('id', teacherId)
    .single();

  if (teacherError || !teacher) {
    return res.status(404).json({ success: false, error: 'Teacher not found' });
  }

  const zoomUser = await zoomServerService.getZoomUser('me');
  const zoomAccount = await saveZoomAccountForTeacher(teacherId, zoomUser);

  return res.json({
    success: true,
    message: 'Zoom Connected',
    connected: true,
    account: zoomAccount
  });
}

async function handleCreateMeeting(req, res) {
  const { sessionId, topic, startTime, duration, timezone = 'UTC', password } = req.body || {};

  if (!sessionId) {
    return res.status(400).json({ success: false, error: 'Session ID is required' });
  }

  const { data: session, error: sessionError } = await supabase
    .from('class_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (sessionError || !session) {
    return res.status(404).json({ success: false, error: 'Class session not found' });
  }

  const meeting = await createAndStoreZoomMeetingForSession(session, {
    topic,
    startTime,
    duration,
    timezone,
    password
  });

  return res.json({ success: true, meeting });
}

async function handleTeacherMeetings(req, res, teacherId) {
  const { status = 'upcoming', limit = 10 } = req.query;

  let query = supabase
    .from('zoom_meetings')
    .select(`
      *,
      class_sessions (
        id,
        title,
        description,
        scheduled_start,
        scheduled_end
      )
    `)
    .eq('teacher_id', teacherId)
    .order('start_time', { ascending: true })
    .limit(Number(limit));

  if (status === 'upcoming') {
    query = query.gte('start_time', new Date().toISOString());
  } else if (status === 'past') {
    query = query.lt('start_time', new Date().toISOString());
  }

  const { data, error } = await query;
  if (error) throw error;

  return res.json(data || []);
}

async function handleStudentMeetings(req, res, studentId) {
  const { status = 'upcoming', limit = 10 } = req.query;

  let query = supabase
    .from('class_sessions')
    .select(`
      zoom_meetings!class_sessions_zoom_meeting_id_fkey (
        *,
        class_sessions (
          id,
          title,
          description,
          scheduled_start,
          scheduled_end
        )
      )
    `)
    .eq('student_id', studentId)
    .not('zoom_meeting_id', 'is', null)
    .order('scheduled_start', { ascending: true })
    .limit(Number(limit));

  if (status === 'upcoming') {
    query = query.gte('scheduled_start', new Date().toISOString());
  } else if (status === 'past') {
    query = query.lt('scheduled_start', new Date().toISOString());
  }

  const { data, error } = await query;
  if (error) throw error;

  return res.json((data || []).map(row => publicMeeting(row.zoom_meetings)).filter(Boolean));
}

async function handleGetMeeting(req, res, meetingId) {
  const { data: meeting, error } = await supabase
    .from('zoom_meetings')
    .select('*')
    .eq('id', meetingId)
    .single();

  if (error || !meeting) {
    return res.status(404).json({ success: false, error: 'Meeting not found' });
  }

  return res.json(meeting);
}

async function handleUpdateMeeting(req, res, meetingId) {
  const { data: storedMeeting, error: fetchError } = await supabase
    .from('zoom_meetings')
    .select('*')
    .eq('id', meetingId)
    .single();

  if (fetchError || !storedMeeting) {
    return res.status(404).json({ success: false, error: 'Meeting not found' });
  }

  const updates = {
    topic: req.body.topic,
    start_time: req.body.startTime || req.body.start_time,
    duration: req.body.duration || req.body.duration_minutes,
    timezone: req.body.timezone,
    password: req.body.password,
    agenda: req.body.description || req.body.agenda
  };

  Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);

  const zoomMeeting = await zoomServerService.updateZoomMeeting(storedMeeting.meeting_id, updates);

  const { data: updatedMeeting, error: updateError } = await supabase
    .from('zoom_meetings')
    .update({
      topic: zoomMeeting.topic,
      description: zoomMeeting.agenda,
      start_time: zoomMeeting.start_time,
      duration_minutes: zoomMeeting.duration,
      timezone: zoomMeeting.timezone || storedMeeting.timezone,
      join_url: zoomMeeting.join_url,
      start_url: zoomMeeting.start_url || storedMeeting.start_url,
      password: zoomMeeting.password,
      settings: zoomMeeting.settings || storedMeeting.settings,
      updated_at: new Date().toISOString()
    })
    .eq('id', meetingId)
    .select()
    .single();

  if (updateError) throw updateError;

  if (storedMeeting.class_session_id) {
    await supabase
      .from('class_sessions')
      .update({
        meeting_url: updatedMeeting.join_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', storedMeeting.class_session_id);
  }

  return res.json({ success: true, meeting: updatedMeeting });
}

async function handleDeleteMeeting(req, res, meetingId) {
  const { data: meeting, error: fetchError } = await supabase
    .from('zoom_meetings')
    .select('*')
    .eq('id', meetingId)
    .single();

  if (fetchError || !meeting) {
    return res.status(404).json({ success: false, error: 'Meeting not found' });
  }

  await zoomServerService.deleteZoomMeeting(meeting.meeting_id);

  if (meeting.class_session_id) {
    await supabase
      .from('class_sessions')
      .update({
        meeting_url: null,
        meeting_id: null,
        zoom_meeting_id: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', meeting.class_session_id);
  }

  const { error: deleteError } = await supabase
    .from('zoom_meetings')
    .delete()
    .eq('id', meetingId);

  if (deleteError) throw deleteError;

  return res.json({ success: true, message: 'Meeting deleted successfully' });
}

async function handleJoinMeeting(req, res, meetingId) {
  const { userId, userType } = req.body || {};

  if (!userId || !userType) {
    return res.status(400).json({ success: false, error: 'Missing user information' });
  }

  const { data: meeting, error: meetingError } = await supabase
    .from('zoom_meetings')
    .select('*, class_sessions(student_id, teacher_id)')
    .eq('id', meetingId)
    .single();

  if (meetingError || !meeting) {
    return res.status(404).json({ success: false, error: 'Meeting not found' });
  }

  const enrolledStudent = userType === 'student' && meeting.class_sessions?.student_id === userId;
  const owningTeacher = userType === 'teacher' && meeting.teacher_id === userId;

  if (!enrolledStudent && !owningTeacher) {
    return res.status(403).json({ success: false, error: 'You are not enrolled in this Zoom class.' });
  }

  const { data: participant, error: participantError } = await supabase
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

  if (participantError) throw participantError;

  await supabase
    .from('zoom_meetings')
    .update({
      status: 'started',
      participants_count: (meeting.participants_count || 0) + 1,
      updated_at: new Date().toISOString()
    })
    .eq('id', meetingId);

  return res.json({
    success: true,
    joinUrl: meeting.join_url,
    participant
  });
}

module.exports = async function handler(req, res) {
  try {
    const [resource, action, id, subAction] = getPathParts(req);

    if (req.method === 'GET' && resource === 'configuration') {
      return res.json(zoomServerService.getZoomConfigurationStatus());
    }

    if (req.method === 'GET' && resource === 'status' && action) {
      return await handleStatus(req, res, action);
    }

    if (req.method === 'POST' && resource === 'connect') {
      return await handleConnect(req, res);
    }

    if (resource === 'meetings' && action === 'create' && req.method === 'POST') {
      return await handleCreateMeeting(req, res);
    }

    if (resource === 'meetings' && action === 'teacher' && id && req.method === 'GET') {
      return await handleTeacherMeetings(req, res, id);
    }

    if (resource === 'meetings' && action === 'student' && id && req.method === 'GET') {
      return await handleStudentMeetings(req, res, id);
    }

    if (resource === 'meetings' && action && subAction === 'join' && req.method === 'POST') {
      return await handleJoinMeeting(req, res, action);
    }

    if (resource === 'meetings' && action && req.method === 'GET') {
      return await handleGetMeeting(req, res, action);
    }

    if (resource === 'meetings' && action && req.method === 'PUT') {
      return await handleUpdateMeeting(req, res, action);
    }

    if (resource === 'meetings' && action && req.method === 'DELETE') {
      return await handleDeleteMeeting(req, res, action);
    }

    return res.status(404).json({ success: false, error: 'Zoom endpoint not found' });
  } catch (error) {
    return sendZoomError(res, error);
  }
};
