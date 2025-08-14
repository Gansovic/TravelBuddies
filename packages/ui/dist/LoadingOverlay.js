import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * LoadingOverlay - Standardized loading overlay component
 * For inline loading states without blocking the entire screen
 */
export function LoadingOverlay({ message = "Loading...", children }) {
    return (_jsxs("div", { className: "relative", children: [_jsx("div", { className: "flex items-center justify-center py-8", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2" }), _jsx("p", { className: "text-gray-600 text-sm", children: message })] }) }), children] }));
}
