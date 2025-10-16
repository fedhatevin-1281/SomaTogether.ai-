import { OnboardingForm } from '../onboarding/OnboardingForm';
import { TEACHER_SUBJECTS, TEACHER_GRADES, TEACHING_LANGUAGES, TEACHING_MODES } from './teacherOnboardingData';

export function TeacherOnboarding({ onNext, onSaveAndContinue }) {
  return (
    <OnboardingForm
      title="Teacher Onboarding"
      description="Complete your profile to start teaching"
      step={4}
      totalSteps={7}
      subjects={TEACHER_SUBJECTS}
      gradeLevels={TEACHER_GRADES}
      languages={TEACHING_LANGUAGES}
      teachingModes={TEACHING_MODES}
      onNext={onNext}
      onSaveAndContinue={onSaveAndContinue}
    />
  );
}
