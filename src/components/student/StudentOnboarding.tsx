import { OnboardingForm, OnboardingData } from '../onboarding/OnboardingForm';
import { STUDENT_SUBJECTS, STUDENT_GRADES, STUDENT_LANGUAGES } from './studentOnboardingData';

interface StudentOnboardingProps {
  onNext: () => void;
  onSaveAndContinue: () => void;
  studentId: string;
}

export function StudentOnboarding({ onNext, onSaveAndContinue, studentId }: StudentOnboardingProps) {
  const handleDataSaved = (data: OnboardingData) => {
    console.log('Student onboarding data saved:', data);
  };

  return (
    <OnboardingForm
      title="Student Onboarding"
      description="Complete your profile to start learning"
      step={3}
      totalSteps={7}
      subjects={STUDENT_SUBJECTS}
      gradeLevels={STUDENT_GRADES}
      languages={STUDENT_LANGUAGES}
      onNext={onNext}
      onSaveAndContinue={onSaveAndContinue}
      onDataSaved={handleDataSaved}
    />
  );
}
