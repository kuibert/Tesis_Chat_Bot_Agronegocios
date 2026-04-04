import React, {
  useEffect,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";

type DivProps = React.ComponentProps<"div">;

interface MessageWrapperProps extends DivProps {
  propertyChange?: any | any[];
}

export interface MessageWrapperRef {
  scrollToBottom: () => void;
  getContainer: () => HTMLDivElement | null;
}

export const MessageWrapper = forwardRef<
  MessageWrapperRef,
  MessageWrapperProps
>(({ children, propertyChange, ...props }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (!containerRef.current) return;

    containerRef.current?.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: "auto",
    });
  };

  useImperativeHandle(ref, () => ({
    scrollToBottom,
    getContainer: () => containerRef.current,
  }));

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto flex flex-col"
      {...props}
    >
      {children}
    </div>
  );
});

MessageWrapper.displayName = "MessageWrapper";
