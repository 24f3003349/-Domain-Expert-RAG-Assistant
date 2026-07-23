'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { motion } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Copy, Check, Database, FileText, Tag, Cpu, CheckCircle2 } from 'lucide-react';
import { SourceCard } from './SourceCard';
import { type Source } from '@/store/useChatStore';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  sources?: Source[];
}

export const MessageBubble = ({ role, content, isStreaming, sources }: MessageBubbleProps) => {
  const isUser = role === 'user';
  const [copied, setCopied] = React.useState(false);

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
          O
        </div>
      )}

      <div className={cn(
        "max-w-[92%] sm:max-w-[85%] rounded-2xl px-6 py-5 relative group transition-all duration-300",
        isUser 
          ? "bg-white text-slate-900 border border-slate-200 shadow-xs rounded-tr-none" 
          : "bg-white border border-slate-200 shadow-xs text-slate-800 rounded-tl-none"
      )}>
        <div className={cn(
          "text-[14px] leading-relaxed prose max-w-none prose-headings:text-slate-900 prose-headings:font-bold prose-headings:mt-6 prose-headings:mb-3",
          isUser ? "text-slate-900" : "text-slate-800"
        )}>
          {!isUser && isStreaming && content === '' ? (
            <div className="flex items-center gap-3 text-slate-500 font-medium text-xs my-2">
              <span className="animate-pulse">Searching active sources...</span>
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
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
                {content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Source Citation Pills */}
        {!isUser && sources && sources.length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
            <div className="flex flex-wrap gap-2">
              {sources.map((source, idx) => (
                <div 
                  key={source.id || idx}
                  className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 text-slate-700 text-xs py-1 px-3 rounded-full hover:border-slate-300 transition-colors cursor-pointer"
                >
                  <FileText size={12} className="text-slate-400" />
                  <span className="font-medium">{source.filename}</span>
                  {source.page_number && <span className="text-[10px] text-slate-400 font-mono">p.{source.page_number}</span>}
                </div>
              ))}
            </div>

            {/* Agent Trace Block */}
            <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3.5 space-y-2 mt-3">
              <div className="text-[11px] font-semibold text-slate-500">Agent trace</div>
              <ul className="text-xs text-slate-600 space-y-1.5 pl-1">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                  <span className="font-medium text-slate-900">Research agent</span>
                  <span className="text-slate-400">retrieved {sources.length} docs</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                  <span className="font-medium text-slate-900">Engineer agent</span>
                  <span className="text-slate-400">synthesized steps</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                  <span className="font-medium text-slate-900">QA agent</span>
                  <span className="text-slate-400">verified accuracy</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* User Avatar Circle */}
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs shrink-0 mt-1">
          A
        </div>
      )}
    </motion.div>
  );
};

