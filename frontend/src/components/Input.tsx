import React, { useEffect, useRef } from "react";

type TextAreaProps = React.ComponentProps<"textarea">;

interface InputProps extends Omit<TextAreaProps, "onChange" | "onKeyDown"> {
  onChange?: (value: string) => void;
  onSend?: () => void;
}

export function Input({ value, onChange, onSend, ...props }: InputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [value]);

  const handleOnChange = (val: string) => {
    onChange?.(val);
  };

  return (
    <textarea
      ref={textareaRef}
      placeholder="Escribe tu consulta agrícola..."
      className="textarea w-full bg-transparent border-none focus:outline-none focus:ring-0 resize-none shadow-none min-h-10 max-h-50 py-2 leading-relaxed overflow-y-auto"
      rows={1}
      value={value}
      onChange={(e) => handleOnChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          if (props.readOnly) return;
          onSend?.();
        }
      }}
      {...props}
    />
  );
}
