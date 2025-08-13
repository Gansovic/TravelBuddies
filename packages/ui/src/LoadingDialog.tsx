import React from 'react';

interface LoadingDialogProps {
  message?: string;
  isOpen?: boolean;
}

/**
 * LoadingDialog - Standardized loading dialog component
 * Following TravelBuddies UI patterns for consistent loading states
 */
export function LoadingDialog({ message = "Loading...", isOpen = true }: LoadingDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm mx-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-700">{message}</p>
      </div>
    </div>
  );
}