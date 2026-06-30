/**
 * Classroom Service - Core business logic for virtual classroom system
 * Integrates with Zoom, Supabase, and payment systems
 */

import { supabase } from '../supabaseClient';
import { zoomOAuthService } from './zoomOAuthService';

class ClassroomService {
  /**
   * Create a new class with Zoom meeting
   */
  static async createClass(teacherId: string, classData: {
    title: string;
    description?: string;
    subject?: string;
    category?: string;
    learning_objectives?: string[];
    class_type?: 'one-on-one' | 'group';
    max_students?: number;
    price?: number;
    start_time: string;
    duration_minutes: number;
    timezone?: string;
    recurrence?: string;
  }) {
    try {
      console.log('📚 Creating class:', classData.title);

      // Create Zoom meeting
      const zoomMeeting = await zoomOAuthService.createMeeting(teacherId, {
        topic: classData.title,
        type: 2,
        start_time: new Date(classData.start_time).toISOString(),
        duration: classData.duration_minutes,
        timezone: classData.timezone || 'UTC',
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: false,
          mute_upon_entry: true,
          waiting_room: true,
          auto_recording: 'cloud'
        }
      });

      console.log('✅ Zoom meeting created:', zoomMeeting.id);

      // Create class in database
      const { data: newClass, error: classError } = await supabase
        .from('classes')
        .insert({
          teacher_id: teacherId,
          title: classData.title,
          description: classData.description,
          subject: classData.subject,
          category: classData.category,
          learning_objectives: classData.learning_objectives || [],
          class_type: classData.class_type || 'group',
          max_students: classData.max_students || 50,
          price: classData.price || 0,
          zoom_meeting_id: zoomMeeting.id,
          zoom_join_url: zoomMeeting.join_url,
          zoom_host_url: zoomMeeting.start_url,
          zoom_password: zoomMeeting.password,
          start_time: classData.start_time,
          duration_minutes: classData.duration_minutes,
          timezone: classData.timezone || 'UTC',
          recurrence: classData.recurrence || 'once',
          status: 'scheduled'
        })
        .select()
        .single();

      if (classError) throw classError;

      console.log('✅ Class created in database:', newClass.id);

      return { success: true, class: newClass };
    } catch (error) {
      console.error('❌ Failed to create class:', error);
      throw error;
    }
  }

  /**
   * Start a class meeting
   */
  static async startClass(classId: string, teacherId: string) {
    try {
      console.log('🚀 Starting class:', classId);

      // Get class details
      const { data: classData, error: fetchError } = await supabase
        .from('classes')
        .select('*')
        .eq('id', classId)
        .eq('teacher_id', teacherId)
        .single();

      if (fetchError || !classData) {
        throw new Error('Class not found or unauthorized');
      }

      // Update status to live
      const { error: updateError } = await supabase
        .from('classes')
        .update({
          status: 'live',
          updated_at: new Date().toISOString()
        })
        .eq('id', classId);

      if (updateError) throw updateError;

      // Notify all enrolled students
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
            title: '🎓 Class Started',
            message: `${classData.title} is now live! Click to join.`,
            related_id: classId
          });
      }

      console.log('✅ Class started and notifications sent');

      return {
        success: true,
        class: classData,
        host_url: classData.zoom_host_url
      };
    } catch (error) {
      console.error('❌ Failed to start class:', error);
      throw error;
    }
  }

  /**
   * End class meeting
   */
  static async endClass(classId: string) {
    try {
      console.log('⏹️ Ending class:', classId);

      // Update status to completed
      const { error } = await supabase
        .from('classes')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', classId);

      if (error) throw error;

      // Generate certificates for students with 75%+ attendance
      await this.generateCertificatesForClass(classId);

      console.log('✅ Class ended and certificates generated');

      return { success: true };
    } catch (error) {
      console.error('❌ Failed to end class:', error);
      throw error;
    }
  }

  /**
   * Enroll student in a class
   */
  static async enrollStudent(classId: string, studentId: string, paymentData?: {
    payment_intent_id?: string;
    payment_method?: string;
    amount_paid?: number;
  }) {
    try {
      console.log('📝 Enrolling student:', studentId, 'in class:', classId);

      // Get class details
      const { data: classData } = await supabase
        .from('classes')
        .select('*')
        .eq('id', classId)
        .single();

      if (!classData) throw new Error('Class not found');

      // Check if class is full
      if (classData.enrollment_count >= classData.max_students) {
        throw new Error('Class is full');
      }

      // Check if already enrolled
      const { data: existing } = await supabase
        .from('enrollments')
        .select('id')
        .eq('class_id', classId)
        .eq('student_id', studentId)
        .single();

      if (existing) throw new Error('Already enrolled in this class');

      // Create enrollment
      const { data: enrollment, error: enrollError } = await supabase
        .from('enrollments')
        .insert({
          class_id: classId,
          student_id: studentId,
          payment_status: classData.price === 0 ? 'completed' : (paymentData?.payment_intent_id ? 'completed' : 'pending'),
          payment_method: paymentData?.payment_method,
          transaction_id: paymentData?.payment_intent_id,
          amount_paid: paymentData?.amount_paid || classData.price,
          status: 'active'
        })
        .select()
        .single();

      if (enrollError) throw enrollError;

      console.log('✅ Student enrolled successfully');

      // Send notifications
      await supabase
        .from('notifications')
        .insert({
          user_id: studentId,
          type: 'enrollment_confirmation',
          title: '✅ Enrollment Confirmed',
          message: `You have successfully enrolled in "${classData.title}". Class starts at ${new Date(classData.start_time).toLocaleString()}`,
          related_id: classId
        });

      await supabase
        .from('notifications')
        .insert({
          user_id: classData.teacher_id,
          type: 'student_enrolled',
          title: '👤 New Student Enrolled',
          message: `A new student has enrolled in "${classData.title}"`,
          related_id: classId
        });

      return { success: true, enrollment };
    } catch (error) {
      console.error('❌ Failed to enroll student:', error);
      throw error;
    }
  }

  /**
   * Record student joining class
   */
  static async recordStudentJoin(classId: string, studentId: string) {
    try {
      console.log('✋ Student joining class:', classId);

      // Get class details
      const { data: classData } = await supabase
        .from('classes')
        .select('*')
        .eq('id', classId)
        .single();

      if (!classData) throw new Error('Class not found');

      // Check enrollment
      const { data: enrollment } = await supabase
        .from('enrollments')
        .select('*')
        .eq('class_id', classId)
        .eq('student_id', studentId)
        .single();

      if (!enrollment) throw new Error('Not enrolled in this class');

      // Record attendance
      const { data: attendance, error: attendError } = await supabase
        .from('attendance')
        .insert({
          class_id: classId,
          student_id: studentId,
          join_time: new Date().toISOString()
        })
        .select()
        .single();

      if (attendError) throw attendError;

      console.log('✅ Student join recorded');

      return {
        success: true,
        attendance_id: attendance.id,
        join_url: classData.zoom_join_url
      };
    } catch (error) {
      console.error('❌ Failed to record student join:', error);
      throw error;
    }
  }

  /**
   * Record student leaving class
   */
  static async recordStudentLeave(classId: string, studentId: string, attendanceId: string) {
    try {
      console.log('👋 Student leaving class:', classId);

      // Get attendance record
      const { data: record } = await supabase
        .from('attendance')
        .select('*')
        .eq('id', attendanceId)
        .single();

      if (!record) throw new Error('Attendance record not found');

      // Calculate duration
      const joinTime = new Date(record.join_time);
      const leaveTime = new Date();
      const durationMinutes = Math.floor((leaveTime.getTime() - joinTime.getTime()) / 60000);

      // Update attendance
      const { error: updateError } = await supabase
        .from('attendance')
        .update({
          leave_time: leaveTime.toISOString(),
          duration_minutes: durationMinutes
        })
        .eq('id', attendanceId);

      if (updateError) throw updateError;

      // Update enrollment attendance duration
      const { data: enrollment } = await supabase
        .from('enrollments')
        .select('attendance_duration')
        .eq('class_id', classId)
        .eq('student_id', studentId)
        .single();

      if (enrollment) {
        await supabase
          .from('enrollments')
          .update({
            attendance_duration: (enrollment.attendance_duration || 0) + durationMinutes,
            is_attended: true
          })
          .eq('class_id', classId)
          .eq('student_id', studentId);
      }

      console.log('✅ Student leave recorded -', durationMinutes, 'minutes');

      return {
        success: true,
        duration_minutes: durationMinutes
      };
    } catch (error) {
      console.error('❌ Failed to record student leave:', error);
      throw error;
    }
  }

  /**
   * Generate certificates for students with 75%+ attendance
   */
  static async generateCertificatesForClass(classId: string) {
    try {
      console.log('📜 Generating certificates for class:', classId);

      // Get class details
      const { data: classData } = await supabase
        .from('classes')
        .select('*')
        .eq('id', classId)
        .single();

      if (!classData) throw new Error('Class not found');

      // Get enrollments with attendance >= 75%
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('*')
        .eq('class_id', classId);

      const minRequired = classData.duration_minutes * 0.75;

      for (const enrollment of enrollments || []) {
        if (enrollment.attendance_duration >= minRequired) {
          // Check if certificate already exists
          const { data: existing } = await supabase
            .from('certificates')
            .select('id')
            .eq('class_id', classId)
            .eq('student_id', enrollment.student_id)
            .single();

          if (!existing) {
            // Generate certificate
            const { error: certError } = await supabase
              .from('certificates')
              .insert({
                student_id: enrollment.student_id,
                class_id: classId,
                teacher_id: classData.teacher_id,
                certificate_number: `CERT-${classId}-${enrollment.student_id}-${Date.now()}`,
                completion_date: new Date().toISOString().split('T')[0],
                hours_completed: (enrollment.attendance_duration / 60).toFixed(2)
              });

            if (!certError) {
              console.log('✅ Certificate generated for student:', enrollment.student_id);

              // Send notification
              await supabase
                .from('notifications')
                .insert({
                  user_id: enrollment.student_id,
                  type: 'certificate_awarded',
                  title: '🎖️ Certificate Earned!',
                  message: `Congratulations! You have earned a certificate for "${classData.title}"`,
                  related_id: classId
                });
            }
          }
        }
      }

      console.log('✅ Certificates generated');

      return { success: true };
    } catch (error) {
      console.error('❌ Failed to generate certificates:', error);
      throw error;
    }
  }

  /**
   * Get class attendance report
   */
  static async getAttendanceReport(classId: string) {
    try {
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

      if (error) throw error;

      // Calculate statistics
      const totalAttendees = new Set(attendance.map(a => a.student_id)).size;
      const totalMinutes = attendance.reduce((sum, a) => sum + (a.duration_minutes || 0), 0);
      const averageAttendance = totalAttendees > 0 ? (totalMinutes / totalAttendees).toFixed(1) : 0;

      return {
        success: true,
        attendance,
        statistics: {
          total_attendees: totalAttendees,
          total_minutes: totalMinutes,
          average_attendance_minutes: averageAttendance
        }
      };
    } catch (error) {
      console.error('❌ Failed to get attendance report:', error);
      throw error;
    }
  }

  /**
   * Send class reminders (scheduled task)
   */
  static async sendClassReminders() {
    try {
      console.log('🔔 Sending class reminders...');

      // Get classes starting in 24 hours
      const next24h = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const now = new Date();

      const { data: upcomingClasses } = await supabase
        .from('classes')
        .select('*')
        .eq('status', 'scheduled')
        .gte('start_time', now.toISOString())
        .lte('start_time', next24h.toISOString());

      for (const classData of upcomingClasses || []) {
        // Get enrolled students
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('student_id')
          .eq('class_id', classData.id)
          .eq('payment_status', 'completed');

        for (const enrollment of enrollments || []) {
          await supabase
            .from('notifications')
            .insert({
              user_id: enrollment.student_id,
              type: 'class_reminder_24h',
              title: '⏰ Reminder: Class Tomorrow',
              message: `"${classData.title}" starts tomorrow at ${new Date(classData.start_time).toLocaleTimeString()}`,
              related_id: classData.id
            });
        }
      }

      // Get classes starting in 30 minutes
      const next30min = new Date(Date.now() + 30 * 60 * 1000);

      const { data: startingSoon } = await supabase
        .from('classes')
        .select('*')
        .eq('status', 'scheduled')
        .gte('start_time', now.toISOString())
        .lte('start_time', next30min.toISOString());

      for (const classData of startingSoon || []) {
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('student_id')
          .eq('class_id', classData.id)
          .eq('payment_status', 'completed');

        for (const enrollment of enrollments || []) {
          await supabase
            .from('notifications')
            .insert({
              user_id: enrollment.student_id,
              type: 'class_reminder_30min',
              title: '⏰ Class Starting Soon',
              message: `"${classData.title}" starts in 30 minutes! Click to join.`,
              related_id: classData.id
            });
        }
      }

      console.log('✅ Class reminders sent');

      return { success: true };
    } catch (error) {
      console.error('❌ Failed to send class reminders:', error);
      throw error;
    }
  }
}

export default ClassroomService;
