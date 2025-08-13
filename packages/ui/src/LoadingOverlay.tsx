import React from 'react';

interface LoadingOverlayProps {
  message?: string;
  children?: React.ReactNode;
}

/**
 * LoadingOverlay - Standardized loading overlay component
 * For inline loading states without blocking the entire screen
 */
export function LoadingOverlay({ message = "Loading...", children }: LoadingOverlayProps) {
  return (
    <div className="relative">
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">{message}</p>
        </div>
      </div>
      {children}
    </div>
  );
}