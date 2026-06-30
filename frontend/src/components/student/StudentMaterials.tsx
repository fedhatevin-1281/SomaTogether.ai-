import React from 'react';
import { MaterialsLibrary } from '../teacher/MaterialsLibrary';

interface StudentMaterialsProps {
  onBack: () => void;
}

export function StudentMaterials({ onBack }: StudentMaterialsProps) {
  return (
    <div className="space-y-6">
      {/* Custom Header for Student View */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-8 text-white">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Learning Materials</h1>
          <p className="text-green-100 text-lg">Resources shared by your teachers</p>
        </div>
      </div>

      {/* MaterialsLibrary in Student Mode */}
      <MaterialsLibrary mode="student" onBack={onBack} />
    </div>
  );
}
