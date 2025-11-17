import { supabase } from '../supabaseClient';
import { ClassService, ClassSession } from './classService';
import { AssignmentService, Assignment, AssignmentSubmission } from './assignmentService';

export interface LearningJourneyStats {
  questionsAsked: number;
  problemsCracked: number;
  studyTimeHours: number;
  favoriteSubject: string;
  xpEarned: number;
  currentLevel: number;
}

export class LearningJourneyService {
  /**
   * Calculate XP based on activities
   */
  private static calculateXP(
    completedSessions: number,
    gradedAssignments: number,
    studyHours: number
  ): number {
    // XP calculation:
    // - 10 XP per completed session
    // - 25 XP per graded assignment
    // - 5 XP per study hour
    return (completedSessions * 10) + (gradedAssignments * 25) + (Math.floor(studyHours) * 5);
  }

  /**
   * Calculate level from XP
   */
  private static calculateLevel(xp: number): number {
    // Level calculation: Level = floor(XP / 250) + 1
    // Each level requires 250 XP
    return Math.floor(xp / 250) + 1;
  }

  /**
   * Get learning journey statistics for a student
   */
  static async getLearningJourneyStats(studentId: string): Promise<LearningJourneyStats> {
    try {
      // Get all classes for the student
      const classes = await ClassService.getStudentClasses(studentId);

      // Get all sessions for the student
      const allSessions: ClassSession[] = [];
      for (const classData of classes) {
        const sessions = await ClassService.getClassSessions(classData.id);
        allSessions.push(...sessions);
      }

      // Calculate study time from sessions
      const completedSessions = allSessions.filter(s => s.status === 'completed');
      let totalStudyHours = 0;

      // Get study time from session_time_tracker (batch query for performance)
      if (completedSessions.length > 0) {
        const sessionIds = completedSessions.map(s => s.id);
        const { data: timeTrackers } = await supabase
          .from('session_time_tracker')
          .select('session_id, total_active_seconds')
          .in('session_id', sessionIds);

        // Create a map of session_id to total_active_seconds
        const timeTrackerMap = new Map<string, number>();
        if (timeTrackers) {
          timeTrackers.forEach(tracker => {
            if (tracker.total_active_seconds) {
              timeTrackerMap.set(tracker.session_id, tracker.total_active_seconds);
            }
          });
        }

        // Calculate total study hours
        for (const session of completedSessions) {
          const activeSeconds = timeTrackerMap.get(session.id);
          if (activeSeconds) {
            totalStudyHours += activeSeconds / 3600;
          } else if (session.duration_minutes) {
            // Fallback to duration_minutes if time tracker doesn't exist
            totalStudyHours += session.duration_minutes / 60;
          }
        }
      }

      // Get assignments and submissions
      const assignments = await AssignmentService.getStudentAssignments(studentId);
      const submissions = await AssignmentService.getStudentSubmissions(studentId);
      
      // Count problems cracked (graded assignments with points earned)
      const gradedSubmissions = submissions.filter(
        s => s.status === 'graded' && s.points_earned !== null && s.points_earned > 0
      );
      const problemsCracked = gradedSubmissions.length;

      // Get favorite subject (subject with most classes and assignments)
      const subjectCount = new Map<string, number>();
      
      // Count subjects from classes
      for (const classData of classes) {
        if (classData.subject) {
          const subjectName = typeof classData.subject === 'string' 
            ? classData.subject 
            : (classData.subject as any).name || 'Unknown';
          if (subjectName !== 'Unknown') {
            subjectCount.set(subjectName, (subjectCount.get(subjectName) || 0) + 1);
          }
        }
      }
      
      // Also count from assignments
      for (const assignment of assignments) {
        if (assignment.subject) {
          const subjectName = typeof assignment.subject === 'string'
            ? assignment.subject
            : (assignment.subject as any).name || 'Unknown';
          if (subjectName !== 'Unknown') {
            subjectCount.set(subjectName, (subjectCount.get(subjectName) || 0) + 1);
          }
        }
      }
      
      // Find favorite subject (most common)
      let favoriteSubject = 'Not Set';
      let maxCount = 0;
      for (const [subject, count] of subjectCount.entries()) {
        if (count > maxCount) {
          maxCount = count;
          favoriteSubject = subject;
        }
      }

      // Count questions asked (AI assistant interactions)
      // For now, estimate based on completed sessions and assignments
      // In the future, this can be tracked in a dedicated table
      let questionsAsked = 0;
      try {
        // Estimate: 2 questions per completed session + 1 question per completed assignment
        questionsAsked = (completedSessions.length * 2) + (problemsCracked * 1);
        
        // If there's a way to track actual AI interactions, use that instead
        // For example, if there's an ai_interactions table:
        // const { count } = await supabase
        //   .from('ai_interactions')
        //   .select('*', { count: 'exact', head: true })
        //   .eq('student_id', studentId);
        // questionsAsked = count || 0;
      } catch (error) {
        console.error('Error counting questions asked:', error);
        // Fallback estimate
        questionsAsked = completedSessions.length * 2;
      }

      // Calculate XP and Level
      const xpEarned = this.calculateXP(
        completedSessions.length,
        problemsCracked,
        totalStudyHours
      );
      const currentLevel = this.calculateLevel(xpEarned);

      return {
        questionsAsked,
        problemsCracked,
        studyTimeHours: Math.round(totalStudyHours * 10) / 10, // Round to 1 decimal
        favoriteSubject: favoriteSubject !== 'Unknown' ? favoriteSubject : 'Not Set',
        xpEarned,
        currentLevel,
      };
    } catch (error) {
      console.error('Error fetching learning journey stats:', error);
      // Return default values if error
      return {
        questionsAsked: 0,
        problemsCracked: 0,
        studyTimeHours: 0,
        favoriteSubject: 'Not Set',
        xpEarned: 0,
        currentLevel: 1,
      };
    }
  }
}

export default LearningJourneyService;

