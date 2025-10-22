import { supabase } from '../supabaseClient';
import { ClassService, Class, ClassSession } from './classService';
import { AssignmentService, Assignment, AssignmentSubmission } from './assignmentService';

export interface StudentProgress {
  studentId: string;
  studentName: string;
  overallStats: {
    totalClasses: number;
    activeClasses: number;
    completedSessions: number;
    totalStudyHours: number;
    assignmentsSubmitted: number;
    assignmentsGraded: number;
    averageGrade?: number;
  };
  subjectProgress: Array<{
    subjectId: string;
    subjectName: string;
    classesCount: number;
    sessionsCompleted: number;
    studyHours: number;
    assignmentsCount: number;
    averageGrade?: number;
    lastActivity?: string;
  }>;
  recentActivity: Array<{
    type: 'session' | 'assignment' | 'grade';
    title: string;
    date: string;
    subject: string;
    details?: string;
  }>;
  upcomingSessions: ClassSession[];
  pendingAssignments: Assignment[];
}

export interface TeacherProgress {
  teacherId: string;
  teacherName: string;
  overallStats: {
    totalStudents: number;
    activeClasses: number;
    completedSessions: number;
    totalTeachingHours: number;
    assignmentsCreated: number;
    assignmentsGraded: number;
    averageRating?: number;
    totalEarnings: number;
  };
  studentStats: Array<{
    studentId: string;
    studentName: string;
    classesCount: number;
    sessionsCompleted: number;
    studyHours: number;
    assignmentsSubmitted: number;
    averageGrade?: number;
    lastActivity?: string;
  }>;
  recentActivity: Array<{
    type: 'session' | 'assignment' | 'grade';
    title: string;
    date: string;
    student: string;
    details?: string;
  }>;
  upcomingSessions: ClassSession[];
  pendingGrading: AssignmentSubmission[];
}

export interface ClassProgress {
  classId: string;
  className: string;
  subjectName: string;
  teacherName: string;
  studentName: string;
  stats: {
    totalSessions: number;
    completedSessions: number;
    totalHours: number;
    assignmentsCount: number;
    assignmentsGraded: number;
    averageGrade?: number;
    completionRate: number;
  };
  sessions: ClassSession[];
  assignments: Assignment[];
  submissions: AssignmentSubmission[];
}

export class ProgressService {
  /**
   * Get comprehensive progress for a student
   */
  static async getStudentProgress(studentId: string): Promise<StudentProgress | null> {
    try {
      // Get student info
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select(`
          id,
          profiles!students_id_fkey (
            full_name
          )
        `)
        .eq('id', studentId)
        .single();

      if (studentError || !studentData) {
        console.error('Error fetching student data:', studentError);
        return null;
      }

      // Get all classes for the student
      const classes = await ClassService.getStudentClasses(studentId);
      const activeClasses = classes.filter(c => c.status === 'active');

      // Get all sessions for the student
      const allSessions: ClassSession[] = [];
      for (const classData of classes) {
        const sessions = await ClassService.getClassSessions(classData.id);
        allSessions.push(...sessions);
      }

      const completedSessions = allSessions.filter(s => s.status === 'completed');
      const totalStudyHours = completedSessions.reduce((sum, s) => {
        return sum + ((s.duration_minutes || 0) / 60);
      }, 0);

      // Get assignments and submissions
      const assignments = await AssignmentService.getStudentAssignments(studentId);
      const submissions = await AssignmentService.getStudentSubmissions(studentId);
      
      const gradedSubmissions = submissions.filter(s => s.status === 'graded' && s.points_earned !== null);
      const averageGrade = gradedSubmissions.length > 0
        ? gradedSubmissions.reduce((sum, s) => sum + (s.points_earned || 0), 0) / gradedSubmissions.length
        : undefined;

      // Get upcoming sessions
      const upcomingSessions = await ClassService.getStudentUpcomingSessions(studentId);

      // Get pending assignments (not yet submitted)
      const pendingAssignments = assignments.filter(a => {
        const submission = submissions.find(s => s.assignment_id === a.id);
        return !submission && (!a.due_date || new Date(a.due_date) > new Date());
      });

      // Calculate subject progress
      const subjectMap = new Map<string, {
        subjectId: string;
        subjectName: string;
        classesCount: number;
        sessionsCompleted: number;
        studyHours: number;
        assignmentsCount: number;
        grades: number[];
        lastActivity?: string;
      }>();

      // Process classes
      classes.forEach(classData => {
        if (classData.subject) {
          const subjectId = classData.subject.id;
          if (!subjectMap.has(subjectId)) {
            subjectMap.set(subjectId, {
              subjectId,
              subjectName: classData.subject.name,
              classesCount: 0,
              sessionsCompleted: 0,
              studyHours: 0,
              assignmentsCount: 0,
              grades: []
            });
          }
          const subject = subjectMap.get(subjectId)!;
          subject.classesCount++;
        }
      });

      // Process sessions
      allSessions.forEach(session => {
        if (session.class?.subject) {
          const subjectId = session.class.subject.id;
          if (subjectMap.has(subjectId)) {
            const subject = subjectMap.get(subjectId)!;
            if (session.status === 'completed') {
              subject.sessionsCompleted++;
              subject.studyHours += (session.duration_minutes || 0) / 60;
            }
            // Update last activity
            const activityDate = session.actual_start || session.scheduled_start;
            if (!subject.lastActivity || activityDate > subject.lastActivity) {
              subject.lastActivity = activityDate;
            }
          }
        }
      });

      // Process assignments and submissions
      assignments.forEach(assignment => {
        if (assignment.subject) {
          const subjectId = assignment.subject.id;
          if (subjectMap.has(subjectId)) {
            const subject = subjectMap.get(subjectId)!;
            subject.assignmentsCount++;
          }
        }
      });

      submissions.forEach(submission => {
        if (submission.assignment?.subject) {
          const subjectId = submission.assignment.subject.id;
          if (subjectMap.has(subjectId)) {
            const subject = subjectMap.get(subjectId)!;
            if (submission.points_earned !== null) {
              subject.grades.push(submission.points_earned);
            }
            // Update last activity
            const activityDate = submission.submitted_at || submission.created_at;
            if (!subject.lastActivity || activityDate > subject.lastActivity) {
              subject.lastActivity = activityDate;
            }
          }
        }
      });

      const subjectProgress = Array.from(subjectMap.values()).map(subject => ({
        subjectId: subject.subjectId,
        subjectName: subject.subjectName,
        classesCount: subject.classesCount,
        sessionsCompleted: subject.sessionsCompleted,
        studyHours: subject.studyHours,
        assignmentsCount: subject.assignmentsCount,
        averageGrade: subject.grades.length > 0 
          ? subject.grades.reduce((sum, grade) => sum + grade, 0) / subject.grades.length 
          : undefined,
        lastActivity: subject.lastActivity
      }));

      // Get recent activity
      const recentActivity = this.getRecentActivity(allSessions, submissions);

      return {
        studentId,
        studentName: studentData.profiles?.full_name || 'Unknown',
        overallStats: {
          totalClasses: classes.length,
          activeClasses: activeClasses.length,
          completedSessions: completedSessions.length,
          totalStudyHours: Math.round(totalStudyHours * 100) / 100,
          assignmentsSubmitted: submissions.length,
          assignmentsGraded: gradedSubmissions.length,
          averageGrade
        },
        subjectProgress,
        recentActivity,
        upcomingSessions,
        pendingAssignments
      };
    } catch (error) {
      console.error('Error getting student progress:', error);
      return null;
    }
  }

  /**
   * Get comprehensive progress for a teacher
   */
  static async getTeacherProgress(teacherId: string): Promise<TeacherProgress | null> {
    try {
      // Get teacher info
      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .select(`
          id,
          profiles!teachers_id_fkey (
            full_name
          )
        `)
        .eq('id', teacherId)
        .single();

      if (teacherError || !teacherData) {
        console.error('Error fetching teacher data:', teacherError);
        return null;
      }

      // Get all classes for the teacher
      const classes = await ClassService.getTeacherClasses(teacherId);
      const activeClasses = classes.filter(c => c.status === 'active');

      // Get unique students
      const uniqueStudents = new Map<string, { studentId: string; studentName: string }>();
      classes.forEach(classData => {
        if (classData.student) {
          uniqueStudents.set(classData.student.id, {
            studentId: classData.student.id,
            studentName: classData.student.full_name
          });
        }
      });

      // Get all sessions for the teacher
      const allSessions: ClassSession[] = [];
      for (const classData of classes) {
        const sessions = await ClassService.getClassSessions(classData.id);
        allSessions.push(...sessions);
      }

      const completedSessions = allSessions.filter(s => s.status === 'completed');
      const totalTeachingHours = completedSessions.reduce((sum, s) => {
        return sum + ((s.duration_minutes || 0) / 60);
      }, 0);

      const totalEarnings = completedSessions.reduce((sum, s) => {
        return sum + (s.teacher_earning_usd || 0);
      }, 0);

      // Get assignments and submissions
      const assignments = await AssignmentService.getTeacherAssignments(teacherId);
      const allSubmissions: AssignmentSubmission[] = [];
      
      for (const assignment of assignments) {
        const submissions = await AssignmentService.getAssignmentSubmissions(assignment.id);
        allSubmissions.push(...submissions);
      }

      const assignmentsGraded = allSubmissions.filter(s => s.status === 'graded');
      const pendingGrading = allSubmissions.filter(s => s.status === 'submitted');

      // Get upcoming sessions
      const upcomingSessions = await ClassService.getTeacherUpcomingSessions(teacherId);

      // Calculate student stats
      const studentStats = Array.from(uniqueStudents.values()).map(student => {
        const studentClasses = classes.filter(c => c.student_id === student.studentId);
        const studentSessions = allSessions.filter(s => s.student_id === student.studentId);
        const completedStudentSessions = studentSessions.filter(s => s.status === 'completed');
        const studentStudyHours = completedStudentSessions.reduce((sum, s) => {
          return sum + ((s.duration_minutes || 0) / 60);
        }, 0);
        
        const studentSubmissions = allSubmissions.filter(s => s.student_id === student.studentId);
        const gradedStudentSubmissions = studentSubmissions.filter(s => s.status === 'graded' && s.points_earned !== null);
        const averageGrade = gradedStudentSubmissions.length > 0
          ? gradedStudentSubmissions.reduce((sum, s) => sum + (s.points_earned || 0), 0) / gradedStudentSubmissions.length
          : undefined;

        // Get last activity
        const lastSession = studentSessions.sort((a, b) => 
          new Date(b.actual_start || b.scheduled_start).getTime() - 
          new Date(a.actual_start || a.scheduled_start).getTime()
        )[0];
        
        const lastSubmission = studentSubmissions.sort((a, b) => 
          new Date(b.submitted_at || b.created_at).getTime() - 
          new Date(a.submitted_at || a.created_at).getTime()
        )[0];

        let lastActivity: string | undefined;
        if (lastSession && lastSubmission) {
          const sessionDate = lastSession.actual_start || lastSession.scheduled_start;
          const submissionDate = lastSubmission.submitted_at || lastSubmission.created_at;
          lastActivity = sessionDate > submissionDate ? sessionDate : submissionDate;
        } else if (lastSession) {
          lastActivity = lastSession.actual_start || lastSession.scheduled_start;
        } else if (lastSubmission) {
          lastActivity = lastSubmission.submitted_at || lastSubmission.created_at;
        }

        return {
          studentId: student.studentId,
          studentName: student.studentName,
          classesCount: studentClasses.length,
          sessionsCompleted: completedStudentSessions.length,
          studyHours: Math.round(studentStudyHours * 100) / 100,
          assignmentsSubmitted: studentSubmissions.length,
          averageGrade,
          lastActivity
        };
      });

      // Get recent activity
      const recentActivity = this.getTeacherRecentActivity(allSessions, allSubmissions, uniqueStudents);

      return {
        teacherId,
        teacherName: teacherData.profiles?.full_name || 'Unknown',
        overallStats: {
          totalStudents: uniqueStudents.size,
          activeClasses: activeClasses.length,
          completedSessions: completedSessions.length,
          totalTeachingHours: Math.round(totalTeachingHours * 100) / 100,
          assignmentsCreated: assignments.length,
          assignmentsGraded: assignmentsGraded.length,
          totalEarnings: Math.round(totalEarnings * 100) / 100
        },
        studentStats,
        recentActivity,
        upcomingSessions,
        pendingGrading
      };
    } catch (error) {
      console.error('Error getting teacher progress:', error);
      return null;
    }
  }

  /**
   * Get progress for a specific class
   */
  static async getClassProgress(classId: string): Promise<ClassProgress | null> {
    try {
      const classData = await ClassService.getClassById(classId);
      if (!classData) {
        return null;
      }

      const sessions = await ClassService.getClassSessions(classId);
      const completedSessions = sessions.filter(s => s.status === 'completed');
      const totalHours = completedSessions.reduce((sum, s) => {
        return sum + ((s.duration_minutes || 0) / 60);
      }, 0);

      const assignments = await AssignmentService.getTeacherAssignments(classData.teacher_id)
        .then(assignments => assignments.filter(a => a.class_id === classId));

      const allSubmissions: AssignmentSubmission[] = [];
      for (const assignment of assignments) {
        const submissions = await AssignmentService.getAssignmentSubmissions(assignment.id);
        allSubmissions.push(...submissions.filter(s => s.class_id === classId));
      }

      const gradedSubmissions = allSubmissions.filter(s => s.status === 'graded' && s.points_earned !== null);
      const averageGrade = gradedSubmissions.length > 0
        ? gradedSubmissions.reduce((sum, s) => sum + (s.points_earned || 0), 0) / gradedSubmissions.length
        : undefined;

      const completionRate = sessions.length > 0 ? (completedSessions.length / sessions.length) * 100 : 0;

      return {
        classId,
        className: classData.title,
        subjectName: classData.subject?.name || 'Unknown',
        teacherName: classData.teacher?.full_name || 'Unknown',
        studentName: classData.student?.full_name || 'Unknown',
        stats: {
          totalSessions: sessions.length,
          completedSessions: completedSessions.length,
          totalHours: Math.round(totalHours * 100) / 100,
          assignmentsCount: assignments.length,
          assignmentsGraded: gradedSubmissions.length,
          averageGrade,
          completionRate: Math.round(completionRate * 100) / 100
        },
        sessions,
        assignments,
        submissions: allSubmissions
      };
    } catch (error) {
      console.error('Error getting class progress:', error);
      return null;
    }
  }

  /**
   * Get recent activity for student
   */
  private static getRecentActivity(
    sessions: ClassSession[],
    submissions: AssignmentSubmission[]
  ): Array<{
    type: 'session' | 'assignment' | 'grade';
    title: string;
    date: string;
    subject: string;
    details?: string;
  }> {
    const activities: Array<{
      type: 'session' | 'assignment' | 'grade';
      title: string;
      date: string;
      subject: string;
      details?: string;
    }> = [];

    // Add session activities
    sessions.forEach(session => {
      if (session.status === 'completed') {
        activities.push({
          type: 'session',
          title: session.title,
          date: session.actual_end || session.actual_start || session.scheduled_start,
          subject: session.class?.subject?.name || 'Unknown',
          details: `${Math.round((session.duration_minutes || 0) / 60 * 100) / 100} hours`
        });
      }
    });

    // Add assignment activities
    submissions.forEach(submission => {
      activities.push({
        type: submission.status === 'graded' ? 'grade' : 'assignment',
        title: submission.assignment?.title || 'Assignment',
        date: submission.submitted_at || submission.created_at,
        subject: submission.assignment?.subject?.name || 'Unknown',
        details: submission.status === 'graded' && submission.points_earned !== null
          ? `Grade: ${submission.points_earned}/${submission.max_points}`
          : 'Submitted'
      });
    });

    // Sort by date and return last 10
    return activities
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }

  /**
   * Get recent activity for teacher
   */
  private static getTeacherRecentActivity(
    sessions: ClassSession[],
    submissions: AssignmentSubmission[],
    students: Map<string, { studentId: string; studentName: string }>
  ): Array<{
    type: 'session' | 'assignment' | 'grade';
    title: string;
    date: string;
    student: string;
    details?: string;
  }> {
    const activities: Array<{
      type: 'session' | 'assignment' | 'grade';
      title: string;
      date: string;
      student: string;
      details?: string;
    }> = [];

    // Add session activities
    sessions.forEach(session => {
      if (session.status === 'completed') {
        const student = students.get(session.student_id);
        activities.push({
          type: 'session',
          title: session.title,
          date: session.actual_end || session.actual_start || session.scheduled_start,
          student: student?.studentName || 'Unknown',
          details: `${Math.round((session.duration_minutes || 0) / 60 * 100) / 100} hours`
        });
      }
    });

    // Add assignment activities
    submissions.forEach(submission => {
      const student = students.get(submission.student_id);
      activities.push({
        type: submission.status === 'graded' ? 'grade' : 'assignment',
        title: submission.assignment?.title || 'Assignment',
        date: submission.submitted_at || submission.created_at,
        student: student?.studentName || 'Unknown',
        details: submission.status === 'graded' && submission.points_earned !== null
          ? `Graded: ${submission.points_earned}/${submission.max_points}`
          : 'Submitted'
      });
    });

    // Sort by date and return last 10
    return activities
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }
}







