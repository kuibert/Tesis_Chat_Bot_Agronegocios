import { memo } from "react";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
// import rehypeHighlight from "rehype-highlight";

export const MarkdownMessage = memo(
  ({ content }: { content: string }) => {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        // rehypePlugins={[rehypeHighlight]}
        components={{
          table: ({ children }) => (
            <div className="overflow-x-auto my-2">
              <table className="table table-xs">{children}</table>
            </div>
          ),
          code({ inline, children, ...props }: any) {
            return inline ? (
              <code className="bg-base-300 px-1 rounded">{children}</code>
            ) : (
              <pre className="bg-base-300 p-2 rounded overflow-x-auto">
                <code {...props}>{children}</code>
              </pre>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    );
  },
  (prevProps, nextProps) => { 
    return prevProps.content === nextProps.content;
  },
);
 