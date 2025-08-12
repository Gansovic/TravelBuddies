import { jsx as _jsx } from "react/jsx-runtime";
export function Button(props) {
    const { className, ...rest } = props;
    return (_jsx("button", { ...rest, className: "px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 " +
            (className ?? "") }));
}
