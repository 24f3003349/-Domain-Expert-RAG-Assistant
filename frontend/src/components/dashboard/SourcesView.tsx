'use client';

import React, { useState } from 'react';
import { FileText, Globe, Database, CheckCircle2, ChevronRight, RefreshCw, X, ShieldCheck, Zap } from 'lucide-react';
import { useDocumentStore } from '@/store/useDocumentStore';
import { motion, AnimatePresence } from 'framer-motion';

export const SourcesView = () => {
  const [activeStep, setActiveStep] = useState<'config' | 'test'>('config');
  const [activeSource, setActiveSource] = useState('Confluence');
  const [reranking, setReranking] = useState(true);
  const [permissions, setPermissions] = useState(true);
  const { openModal } = useDocumentStore();

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8fafc] overflow-hidden select-none">
      {/* Top Breadcrumb Bar */}
      <div className="h-14 px-6 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span>Sources</span>
          <ChevronRight size={14} className="text-slate-400" />
          <span className="text-slate-900 font-bold">{activeSource}</span>
          <ChevronRight size={14} className="text-slate-400" />
          <span className="text-slate-500">{activeStep === 'config' ? 'Add source' : 'Test & save'}</span>
        </div>
        <motion.button 
          whileTap={{ scale: 0.9 }}
          className="text-slate-400 hover:text-slate-700 transition-colors p-1"
        >
          <X size={18} />
        </motion.button>
      </div>

      {/* Main Content Split View */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Integration Types Rail */}
        <div className="w-64 border-r border-slate-200 bg-white p-4 overflow-y-auto custom-scrollbar space-y-6 shrink-0">
          {/* Section 1 */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">Docs & Wikis</p>
            <div className="space-y-1">
              <button
                onClick={() => { setActiveSource('Confluence'); setActiveStep('config'); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all border ${activeSource === 'Confluence' ? 'bg-white border-blue-600 shadow-2xs font-semibold text-slate-900' : 'border-transparent text-slate-600 hover:bg-slate-50'}`}
              >
                <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                  <FileText size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold">Confluence</p>
                  <p className="text-[10px] text-slate-400">Atlassian</p>
                </div>
              </button>

              <button
                onClick={() => { setActiveSource('Notion'); setActiveStep('config'); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all border ${activeSource === 'Notion' ? 'bg-white border-blue-600 shadow-2xs font-semibold text-slate-900' : 'border-transparent text-slate-600 hover:bg-slate-50'}`}
              >
                <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
                  <FileText size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold">Notion</p>
                  <p className="text-[10px] text-slate-400">Pages & databases</p>
                </div>
              </button>
            </div>
          </div>

          {/* Section 2 */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">Files & Web</p>
            <div className="space-y-1">
              <button
                onClick={openModal}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all border border-transparent text-slate-600 hover:bg-slate-50"
              >
                <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                  <FileText size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold">PDF Upload</p>
                  <p className="text-[10px] text-slate-400">Upload documents</p>
                </div>
              </button>

              <button
                onClick={() => { setActiveSource('Web Crawler'); setActiveStep('config'); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all border ${activeSource === 'Web Crawler' ? 'bg-white border-blue-600 shadow-2xs font-semibold text-slate-900' : 'border-transparent text-slate-600 hover:bg-slate-50'}`}
              >
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <Globe size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold">Web Crawler</p>
                  <p className="text-[10px] text-slate-400">Any public URL</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Form / Test Panel with Fade Transitions */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[#f8fafc]">
          <div className="max-w-2xl mx-auto space-y-6">
            <AnimatePresence mode="wait">
              {activeStep === 'config' ? (
                /* Config Step */
                <motion.div
                  key="config-step"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {/* Source Header */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                      <FileText size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">{activeSource}</h2>
                      <p className="text-xs text-slate-500">Atlassian wiki & docs integration</p>
                    </div>
                  </div>

                  {/* Form Card */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Base URL</label>
                      <input
                        type="text"
                        defaultValue="https://acme.atlassian.net"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs transition-all"
                      />
                      <p className="text-[11px] text-slate-400">The root URL of your Confluence instance</p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">API Token</label>
                      <input
                        type="password"
                        defaultValue="••••••••••••••••••••••••"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs transition-all"
                      />
                      <p className="text-[11px] text-blue-600 font-medium">Generate from Atlassian account settings → Security</p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Spaces to Index</label>
                      <input
                        type="text"
                        defaultValue="ENG, INFRA, PRODUCT"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Sync Frequency</label>
                      <select className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs">
                        <option>Every 6 hours</option>
                        <option>Every 1 hour</option>
                        <option>Daily</option>
                      </select>
                    </div>

                    {/* Toggle Controls with Smooth Knob Animation */}
                    <div className="pt-3 space-y-4 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-slate-900">Enable reranking</p>
                          <p className="text-[11px] text-slate-400">Improves retrieval relevance using Cohere rerank</p>
                        </div>
                        <button
                          onClick={() => setReranking(!reranking)}
                          className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${reranking ? 'bg-blue-600' : 'bg-slate-200'}`}
                        >
                          <motion.span
                            animate={{ x: reranking ? 20 : 0 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            className="block w-5 h-5 rounded-full bg-white shadow-xs"
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-slate-900">Respect page permissions</p>
                          <p className="text-[11px] text-slate-400">Only return content the user has access to</p>
                        </div>
                        <button
                          onClick={() => setPermissions(!permissions)}
                          className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${permissions ? 'bg-blue-600' : 'bg-slate-200'}`}
                        >
                          <motion.span
                            animate={{ x: permissions ? 20 : 0 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            className="block w-5 h-5 rounded-full bg-white shadow-xs"
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Bar */}
                  <div className="flex items-center justify-between pt-2">
                    <motion.button 
                      whileTap={{ scale: 0.96 }}
                      className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all"
                    >
                      Back
                    </motion.button>
                    <div className="flex items-center gap-3">
                      <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={() => setActiveStep('test')}
                        className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-all"
                      >
                        Test connection
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={() => setActiveStep('test')}
                        className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 shadow-2xs transition-all"
                      >
                        Save source
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                /* Test & Save Step (Screenshot 5) */
                <motion.div
                  key="test-step"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {/* Status Box Card */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                          <FileText size={20} />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">Confluence</h3>
                          <p className="text-xs text-slate-400">https://acme.atlassian.net/wiki</p>
                        </div>
                      </div>
                      <motion.button 
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all"
                      >
                        <RefreshCw size={12} />
                        <span>Re-run</span>
                      </motion.button>
                    </div>

                    <div className="space-y-3 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2 font-medium text-slate-900">
                          <CheckCircle2 size={16} className="text-emerald-500" /> Authentication
                        </span>
                        <span className="text-slate-400 font-mono text-[11px]">API token valid</span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2 font-medium text-slate-900">
                          <CheckCircle2 size={16} className="text-emerald-500" /> Connectivity
                        </span>
                        <span className="text-slate-400 font-mono text-[11px]">Responded in 142ms</span>
                      </div>

                      <div className="pt-2 text-xs font-semibold text-emerald-600 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> All checks passed
                      </div>
                    </div>
                  </div>

                  {/* Sample Retrieval Preview Card */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sample Retrieval Preview</p>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                      <p className="text-[11px] font-medium text-slate-400">Test query</p>
                      <p className="text-xs font-bold text-slate-900">"What is the deployment process for production?"</p>
                    </div>

                    <div className="space-y-2.5">
                      {[
                        { score: '0.94', title: 'Production Deploy Runbook - ENG', date: 'Updated 2 days ago' },
                        { score: '0.87', title: 'CI/CD Pipeline Overview - INFRA', date: 'Updated 5 days ago' },
                        { score: '0.81', title: 'Release Checklist v2 - ENG', date: 'Updated 1 week ago' },
                      ].map((item, idx) => (
                        <motion.div 
                          key={idx}
                          whileHover={{ y: -1 }}
                          className="p-3.5 rounded-xl border border-slate-200/80 bg-white flex items-center gap-3 transition-shadow hover:shadow-2xs"
                        >
                          <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{item.score}</span>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{item.title}</p>
                            <p className="text-[10px] text-slate-400">{item.date}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Action Bar */}
                  <div className="flex items-center justify-between pt-2">
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setActiveStep('config')}
                      className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all"
                    >
                      Back to config
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setActiveStep('config')}
                      className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 shadow-2xs transition-all"
                    >
                      Save & connect
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

