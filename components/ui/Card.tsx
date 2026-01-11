import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  id?: string;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, id, noPadding = false }) => {
  return (
    <div id={id} className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${className}`}>
      {title && (
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-lg font-medium text-slate-800">{title}</h3>
        </div>
      )}
      <div className={noPadding ? "h-full flex flex-col" : "p-6"}>
        {children}
      </div>
    </div>
  );
};