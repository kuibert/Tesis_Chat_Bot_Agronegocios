import { memo } from "react";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.min.css";

export const MarkdownMessage = memo(
  ({ content }: { content: string }) => {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          table: ({ children }) => (
            <div className="overflow-x-auto my-2">
              <table className="table table-xs">{children}</table>
            </div>
          ),
          code({ inline, children, ...props }: any) {
            return inline ? (
              <code className="bg-[#0c0d0e]/60 px-1.5 py-0.5 rounded text-indigo-300 text-xs border border-[#2d3139]/20 font-mono">{children}</code>
            ) : (
              <pre className="bg-[#0c0d0e] border border-[#2d3139]/40 p-4 rounded-xl overflow-x-auto text-[12px] leading-relaxed shadow-inner my-3">
                <code {...props} className="font-mono text-gray-300">{children}</code>
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
 