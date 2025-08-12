import { ButtonHTMLAttributes } from "react";

export function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className, ...rest } = props;
  return (
    <button
      {...rest}
      className={
        "px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 " +
        (className ?? "")
      }
    />
  );
}
