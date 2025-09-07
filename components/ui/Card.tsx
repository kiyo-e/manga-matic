
import React, { type ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
}

export const Card: React.FC<CardProps> = ({ children }) => {
  return <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">{children}</div>;
};

interface CardHeaderProps {
  title: string;
  subtitle?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ title, subtitle }) => {
  return (
    <div className="mb-3">
      <h2 className="text-base font-semibold leading-tight">{title}</h2>
      {subtitle && <p className="mt-0.5 text-xs text-neutral-500">{subtitle}</p>}
    </div>
  );
};
