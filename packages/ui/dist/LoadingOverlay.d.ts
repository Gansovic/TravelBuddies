import React from 'react';
interface LoadingOverlayProps {
    message?: string;
    children?: React.ReactNode;
}
/**
 * LoadingOverlay - Standardized loading overlay component
 * For inline loading states without blocking the entire screen
 */
export declare function LoadingOverlay({ message, children }: LoadingOverlayProps): import("react/jsx-runtime").JSX.Element;
export {};
