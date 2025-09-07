
import React from 'react';
import { RotateCw } from 'lucide-react';

interface LoadingOverlayProps {
    label: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ label }) => {
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-white/70 backdrop-blur-sm">
      <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-xl">
        <RotateCw className="h-5 w-5 animate-spin"/>
        <div className="text-sm font-medium text-neutral-800">{label}</div>
      </div>
    </div>
  );
};
