'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { motion } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Copy, Check, FileText, ChevronDown, Sparkles } from 'lucide-react';
import { type Source } from '@/store/useChatStore';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function normalizeLatex(text: string): string {
  if (!text) return '';
  return text
    // Convert display math \[ ... \] to $$ ... $$
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, formula) => `\n\n$$\n${formula.trim()}\n$$\n\n`)
    // Convert inline math \( ... \) to $ ... $
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, formula) => `$${formula.trim()}$`);
}

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  thinking?: string;
  isStreaming?: boolean;
  sources?: Source[];
}

export const MessageBubble = ({ role, content, thinking, isStreaming, sources }: MessageBubbleProps) => {
  const isUser = role === 'user';
  const [copied, setCopied] = React.useState(false);

  // Separate thinking and content (support explicit thinking prop or fallback legacy extraction)
  let displayContent = content || '';
  let displayThinking = thinking || '';

  if (!displayThinking && content && content.includes('*Thinking Process:*')) {
    const parts = content.split(/\n\n---\n\n/);
    if (parts.length > 1) {
      displayThinking = parts[0]
        .replace(/^>\s*\*Thinking Process:\*\s*/i, '')
        .replace(/^>\s?/gm, '')
        .trim();
      displayContent = parts.slice(1).join('\n\n---\n\n').trim();
    }
  }

  // Thinking dropdown state
  const [isThinkingOpen, setIsThinkingOpen] = React.useState(false);

  // Auto-expand while model is reasoning and response content has not arrived yet
  React.useEffect(() => {
    if (isStreaming && displayThinking && !displayContent) {
      setIsThinkingOpen(true);
    }
  }, [isStreaming, displayThinking, displayContent]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={cn(
        "flex w-full mb-6 gap-3",
        isUser ? "justify-end items-start" : "justify-start items-start"
      )}
    >
      {/* Assistant Logo Circle */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-xs shrink-0 mt-1 shadow-sm">
          A
        </div>
      )}

      <div className={cn(
        "max-w-[92%] sm:max-w-[85%] rounded-2xl px-6 py-5 relative group transition-all duration-300",
        isUser 
          ? "bg-white text-slate-900 border border-slate-200 shadow-xs rounded-tr-none" 
          : "bg-white border border-slate-200 shadow-xs text-slate-800 rounded-tl-none"
      )}>
        {/* Loading state before thinking or content starts */}
        {!isUser && isStreaming && !displayThinking && !displayContent && (
          <div className="flex items-center gap-3 text-slate-500 font-medium text-xs my-2">
            <span className="animate-pulse">Searching knowledge vault...</span>
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" />
            </div>
          </div>
        )}

        {/* Collapsible Thinking Process Section */}
        {!isUser && displayThinking && (
          <div className="mb-4 rounded-xl border border-slate-200/90 bg-slate-50/80 overflow-hidden text-xs transition-all">
            <button
              type="button"
              onClick={() => setIsThinkingOpen(!isThinkingOpen)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 transition-colors text-left font-sans"
            >
              <div className="flex items-center gap-2">
                <Sparkles size={14} className={cn("text-blue-600", isStreaming && !displayContent ? "animate-spin" : "")} />
                <span className="font-semibold text-slate-700">
                  {isStreaming && !displayContent ? "Reasoning & Analyzing Documents..." : "Thinking Process"}
                </span>
                {displayThinking && !isStreaming && (
                  <span className="text-[11px] text-slate-400 font-mono">
                    ({displayThinking.split(/\s+/).filter(Boolean).length} words)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-medium">
                <span>{isThinkingOpen ? "Hide" : "Show"}</span>
                <ChevronDown size={14} className={cn("transition-transform duration-200", isThinkingOpen ? "rotate-180" : "")} />
              </div>
            </button>

            {isThinkingOpen && (
              <div className="px-4 py-3 border-t border-slate-200/70 bg-white/80 max-h-72 overflow-y-auto custom-scrollbar font-sans text-xs text-slate-600 leading-relaxed border-l-2 border-l-blue-500">
                <div className="prose prose-xs max-w-none text-slate-600 prose-p:my-1.5 prose-ul:my-1.5 whitespace-pre-wrap">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {normalizeLatex(displayThinking)}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Main Response Content */}
        <div className={cn(
          "text-[14px] leading-relaxed prose max-w-none prose-headings:text-slate-900 prose-headings:font-bold prose-headings:mt-4 prose-headings:mb-2",
          isUser ? "text-slate-900" : "text-slate-800"
        )}>
          {displayContent ? (
            <div className="space-y-4">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  h2({ children }) {
                    return (
                      <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 mt-4 mb-2">
                        {children}
                      </h2>
                    );
                  },
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    const lang = match ? match[1] : '';
                    
                    return !inline ? (
                      <div className="relative my-4 rounded-xl overflow-hidden border border-slate-200 group/code">
                        <div className="flex items-center justify-between px-4 py-1.5 bg-slate-50 border-b border-slate-200">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">{lang || 'code'}</span>
                          <button
                            onClick={() => handleCopy(String(children))}
                            className="text-slate-400 hover:text-slate-700 transition-colors"
                          >
                            {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                          </button>
                        </div>
                        <SyntaxHighlighter
                          style={oneLight}
                          language={lang}
                          PreTag="div"
                          customStyle={{
                            margin: 0,
                            padding: '1rem',
                            background: '#fafafa',
                            fontSize: '0.85rem',
                            lineHeight: '1.5',
                          }}
                          {...props}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      </div>
                    ) : (
                      <code className="bg-slate-100 text-slate-900 px-1.5 py-0.5 rounded text-[0.85em] font-mono border border-slate-200" {...props}>
                        {children}
                      </code>
                    );
                  },
                  table({ children }) {
                    return (
                      <div className="my-4 overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full border-collapse text-left text-xs">
                          {children}
                        </table>
                      </div>
                    );
                  },
                  th({ children }) {
                    return <th className="bg-slate-50 p-3 font-semibold border-b border-slate-200 text-slate-700">{children}</th>;
                  },
                  td({ children }) {
                    return <td className="p-3 border-b border-slate-100 text-slate-600">{children}</td>;
                  }
                }}
              >
                {normalizeLatex(displayContent)}
              </ReactMarkdown>
            </div>
          ) : isStreaming && displayThinking ? (
            <div className="text-xs text-slate-400 italic">Synthesizing final domain response...</div>
          ) : null}
        </div>

        {/* Source Citation Pills */}
        {!isUser && sources && sources.length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="flex flex-wrap gap-2">
              {sources.map((source, idx) => (
                <div 
                  key={source.id || idx}
                  className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 text-slate-700 text-xs py-1 px-3 rounded-full"
                >
                  <FileText size={12} className="text-slate-400" />
                  <span className="font-medium">{source.filename}</span>
                  {source.page_number && source.page_number !== 'N/A' && (
                    <span className="text-[10px] text-slate-400 font-mono">p.{source.page_number}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* User Avatar Circle */}
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs shrink-0 mt-1">
          U
        </div>
      )}
    </motion.div>
  );
};
