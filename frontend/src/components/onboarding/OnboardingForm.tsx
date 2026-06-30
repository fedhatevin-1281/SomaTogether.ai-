import React, { useState } from 'react';
import { ChevronDown, X, Check, BookOpen, Monitor } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Checkbox } from '../ui/checkbox';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';

export interface Subject {
  id: string;
  name: string;
  category: string;
}

export interface GradeLevel {
  id: string;
  label: string;
}

interface OnboardingFormProps {
  title: string;
  description: string;
  step: number;
  totalSteps: number;
  subjects?: Subject[];
  gradeLevels?: GradeLevel[];
  languages?: string[];
  teachingModes?: string[];
  onNext?: () => void;
  onSaveAndContinue?: () => void;
  onDataSaved?: (data: OnboardingData) => void;
}

export interface OnboardingData {
  subjects: string[];
  gradeLevels: string[];
  languages: string[];
  teachingMode?: string;
  studentId: string;
}

export function OnboardingForm({
  title,
  description,
  step,
  totalSteps,
  subjects = [],
  gradeLevels = [],
  languages = [],
  teachingModes = [],
  onNext,
  onSaveAndContinue,
  onDataSaved,
}: OnboardingFormProps) {
  const { user } = useAuth();
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedGradeLevels, setSelectedGradeLevels] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedTeachingMode, setSelectedTeachingMode] = useState<string>('');
  const [isSubjectsOpen, setIsSubjectsOpen] = useState(false);
  const [isLanguagesOpen, setIsLanguagesOpen] = useState(false);
  const [isTeachingModeOpen, setIsTeachingModeOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const progressPercentage = (step / totalSteps) * 100;

  const handleToggle = (array: string[], setArray: any, value: string) => {
    setArray(array.includes(value) ? array.filter(v => v !== value) : [...array, value]);
  };

  const removeItem = (array: string[], setArray: any, value: string) => {
    setArray(array.filter(v => v !== value));
  };

  const subjectsByCategory = subjects.reduce((acc, subject) => {
    if (!acc[subject.category]) acc[subject.category] = [];
    acc[subject.category].push(subject);
    return acc;
  }, {} as Record<string, Subject[]>);

  const getSelectedSubjectNames = () =>
    selectedSubjects.map(id => subjects.find(s => s.id === id)?.name || '').filter(Boolean);

  const saveOnboardingData = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      // Prepare the data to save
      const onboardingData: OnboardingData = {
        subjects: selectedSubjects,
        gradeLevels: selectedGradeLevels,
        languages: selectedLanguages,
        teachingMode: selectedTeachingMode,
        studentId: user.id,
      };

      // Save to students table
      const { error: studentError } = await supabase
        .from('students')
        .update({
          learning_goals: selectedSubjects.map(id => subjects.find(s => s.id === id)?.name || '').filter(Boolean),
          interests: selectedLanguages,
          grade_level: selectedGradeLevels.length > 0 ? gradeLevels.find(g => g.id === selectedGradeLevels[0])?.label : null,
          learning_style: selectedTeachingMode,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (studentError) {
        console.error('Error updating student data:', studentError);
        throw studentError;
      }

      // Also save to profiles table for public visibility
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          bio: `Interested in: ${selectedSubjects.map(id => subjects.find(s => s.id === id)?.name || '').filter(Boolean).join(', ')}. Learning ${selectedLanguages.join(', ')}.`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (profileError) {
        console.error('Error updating profile data:', profileError);
        throw profileError;
      }

      // Call the callback if provided
      if (onDataSaved) {
        onDataSaved(onboardingData);
      }

      console.log('Onboarding data saved successfully');
    } catch (error) {
      console.error('Error saving onboarding data:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = async () => {
    await saveOnboardingData();
    if (onNext) onNext();
  };

  const handleSaveAndContinue = async () => {
    await saveOnboardingData();
    if (onSaveAndContinue) onSaveAndContinue();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
              <p className="text-slate-600">{description}</p>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">
                Step {step} of {totalSteps}
              </span>
              <span className="text-sm text-slate-500">{Math.round(progressPercentage)}% Complete</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {subjects.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Subjects</h3>
                <p className="text-sm text-slate-600 mb-3">Select all subjects relevant to you</p>

                <div className="relative">
                  <button
                    onClick={() => setIsSubjectsOpen(!isSubjectsOpen)}
                    className="w-full p-3 border border-slate-300 rounded-lg bg-white flex items-center justify-between hover:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  >
                    <span className="text-slate-700">
                      {selectedSubjects.length === 0
                        ? 'Select subjects...'
                        : `${selectedSubjects.length} selected`}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 transition-transform ${
                        isSubjectsOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isSubjectsOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-300 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                      {Object.entries(subjectsByCategory).map(([category, subjects]) => (
                        <div key={category} className="p-3 border-b border-slate-100 last:border-b-0">
                          <div className="text-sm font-semibold text-green-700 mb-2">{category}</div>
                          <div className="space-y-2">
                            {subjects.map(subject => (
                              <label
                                key={subject.id}
                                className="flex items-start gap-3 cursor-pointer hover:bg-slate-50 p-2 rounded"
                              >
                                <div className="flex items-center justify-center w-4 h-4 mt-0.5">
                                  <input
                                    type="checkbox"
                                    checked={selectedSubjects.includes(subject.id)}
                                    onChange={() =>
                                      handleToggle(selectedSubjects, setSelectedSubjects, subject.id)
                                    }
                                    className="sr-only"
                                  />
                                  <div
                                    className={`w-4 h-4 border-2 rounded flex items-center justify-center transition-colors ${
                                      selectedSubjects.includes(subject.id)
                                        ? 'bg-green-500 border-green-500'
                                        : 'border-slate-300 hover:border-green-400'
                                    }`}
                                  >
                                    {selectedSubjects.includes(subject.id) && <Check className="w-3 h-3 text-white" />}
                                  </div>
                                </div>
                                <span className="text-sm text-slate-700 leading-tight">{subject.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            )}

            {gradeLevels.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Grade Levels</h3>
                <div className="space-y-3">
                  {gradeLevels.map(grade => (
                    <label key={grade.id} className="flex items-center gap-3 cursor-pointer">
                      <Checkbox
                        checked={selectedGradeLevels.includes(grade.id)}
                        onCheckedChange={() => handleToggle(selectedGradeLevels, setSelectedGradeLevels, grade.id)}
                      />
                      <span className="text-slate-700">{grade.label}</span>
                    </label>
                  ))}
                </div>
              </Card>
            )}

            {languages.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Languages</h3>
                <div className="relative">
                  <button
                    onClick={() => setIsLanguagesOpen(!isLanguagesOpen)}
                    className="w-full p-3 border border-slate-300 rounded-lg bg-white flex items-center justify-between hover:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  >
                    <span className="text-slate-700">
                      {selectedLanguages.length === 0 ? 'Select languages...' : `${selectedLanguages.length} selected`}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 transition-transform ${
                        isLanguagesOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isLanguagesOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-300 rounded-lg shadow-lg z-40">
                      {languages.map(language => (
                        <label key={language} className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50">
                          <div className="flex items-center justify-center w-4 h-4">
                            <input
                              type="checkbox"
                              checked={selectedLanguages.includes(language)}
                              onChange={() => handleToggle(selectedLanguages, setSelectedLanguages, language)}
                              className="sr-only"
                            />
                            <div
                              className={`w-4 h-4 border-2 rounded flex items-center justify-center transition-colors ${
                                selectedLanguages.includes(language)
                                  ? 'bg-green-500 border-green-500'
                                  : 'border-slate-300 hover:border-green-400'
                              }`}
                            >
                              {selectedLanguages.includes(language) && <Check className="w-3 h-3 text-white" />}
                            </div>
                          </div>
                          <span className="text-sm text-slate-700">{language}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            )}

            {teachingModes && teachingModes.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Teaching Mode</h3>
                <div className="relative">
                  <button
                    onClick={() => setIsTeachingModeOpen(!isTeachingModeOpen)}
                    className="w-full p-3 border border-slate-300 rounded-lg bg-white flex items-center justify-between hover:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  >
                    <span className="text-slate-700">
                      {selectedTeachingMode || 'Select teaching mode...'}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 transition-transform ${
                        isTeachingModeOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isTeachingModeOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-300 rounded-lg shadow-lg z-30">
                      {teachingModes.map(mode => (
                        <button
                          key={mode}
                          onClick={() => {
                            setSelectedTeachingMode(mode);
                            setIsTeachingModeOpen(false);
                          }}
                          className="w-full p-3 text-left hover:bg-slate-50 flex items-center gap-3"
                        >
                          <Monitor className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-700">{mode}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-6 space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">Summary</h3>

              {/* Subjects */}
              {subjects.length > 0 && (
                <div>
                  <span className="text-sm font-medium text-slate-700">Subjects ({selectedSubjects.length})</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {getSelectedSubjectNames().map((subject, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer"
                        onClick={() => removeItem(selectedSubjects, setSelectedSubjects, selectedSubjects[index])}
                      >
                        {subject.length > 20 ? `${subject.substring(0, 20)}...` : subject}
                        <X className="w-3 h-3 ml-1" />
                      </Badge>
                    ))}
                    {selectedSubjects.length === 0 && <p className="text-sm text-slate-500 mt-1">None</p>}
                  </div>
                </div>
              )}

              {/* Languages */}
              {languages.length > 0 && (
                <div>
                  <span className="text-sm font-medium text-slate-700">Languages ({selectedLanguages.length})</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedLanguages.map(language => (
                      <Badge
                        key={language}
                        variant="secondary"
                        className="bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer"
                        onClick={() => removeItem(selectedLanguages, setSelectedLanguages, language)}
                      >
                        {language}
                        <X className="w-3 h-3 ml-1" />
                      </Badge>
                    ))}
                    {selectedLanguages.length === 0 && <p className="text-sm text-slate-500 mt-1">None</p>}
                  </div>
                </div>
              )}

              {/* Grade Levels */}
              {gradeLevels.length > 0 && (
                <div>
                  <span className="text-sm font-medium text-slate-700">
                    Grade Levels ({selectedGradeLevels.length})
                  </span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedGradeLevels.map(level => {
                      const label = gradeLevels.find(g => g.id === level)?.label || level;
                      return (
                        <Badge
                          key={level}
                          variant="secondary"
                          className="bg-purple-100 text-purple-800 hover:bg-purple-200 cursor-pointer"
                          onClick={() => removeItem(selectedGradeLevels, setSelectedGradeLevels, level)}
                        >
                          {label}
                          <X className="w-3 h-3 ml-1" />
                        </Badge>
                      );
                    })}
                    {selectedGradeLevels.length === 0 && <p className="text-sm text-slate-500 mt-1">None</p>}
                  </div>
                </div>
              )}

              {/* Teaching Mode */}
              {teachingModes && teachingModes.length > 0 && (
                <div>
                  <span className="text-sm font-medium text-slate-700">Teaching Mode</span>
                  <div className="mt-2">
                    {selectedTeachingMode ? (
                      <Badge className="bg-yellow-100 text-yellow-800">{selectedTeachingMode}</Badge>
                    ) : (
                      <p className="text-sm text-slate-500">None</p>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-3 mt-4">
                <Button 
                  variant="outline" 
                  onClick={handleSaveAndContinue}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save & Continue Later'}
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={
                    isSaving ||
                    (subjects.length > 0 && selectedSubjects.length === 0) ||
                    (gradeLevels.length > 0 && selectedGradeLevels.length === 0) ||
                    (languages.length > 0 && selectedLanguages.length === 0) ||
                    (teachingModes && teachingModes.length > 0 && !selectedTeachingMode)
                  }
                >
                  {isSaving ? 'Saving...' : 'Next Step'}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
