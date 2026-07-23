'use client';

import React from 'react';
import { Calendar, Download, TrendingUp, TrendingDown, MessageSquare, Layers, RefreshCw, PlusCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const OverviewView = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 custom-scrollbar bg-[#f8fafc]"
    >
      {/* Overview Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between pb-2">
        <h1 className="text-xl font-bold text-slate-900">Overview</h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs">
            <Calendar size={14} className="text-slate-400" />
            <span>Last 7 days</span>
          </div>
          <motion.button 
            whileTap={{ scale: 0.95 }}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 shadow-2xs hover:bg-slate-50 transition-all" 
            title="Export Analytics"
          >
            <Download size={14} />
          </motion.button>
        </div>
      </motion.div>

      {/* Top 4 Metrics Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <motion.div 
          whileHover={{ y: -2 }} 
          className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-3 transition-shadow hover:shadow-xs"
        >
          <p className="text-xs font-medium text-slate-500">Total queries</p>
          <div className="flex items-baseline justify-between">
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">1,284</p>
          </div>
          <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
            <TrendingUp size={14} /> +18% vs last week
          </p>
        </motion.div>

        {/* Metric 2 */}
        <motion.div 
          whileHover={{ y: -2 }} 
          className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-3 transition-shadow hover:shadow-xs"
        >
          <p className="text-xs font-medium text-slate-500">Avg. response time</p>
          <div className="flex items-baseline justify-between">
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">1.4s</p>
          </div>
          <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
            <TrendingDown size={14} /> -0.3s improved
          </p>
        </motion.div>

        {/* Metric 3 */}
        <motion.div 
          whileHover={{ y: -2 }} 
          className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-3 transition-shadow hover:shadow-xs"
        >
          <p className="text-xs font-medium text-slate-500">Sources queried</p>
          <div className="flex items-baseline justify-between">
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">4</p>
          </div>
          <p className="text-xs font-medium text-slate-400">of 6 connected</p>
        </motion.div>

        {/* Metric 4 */}
        <motion.div 
          whileHover={{ y: -2 }} 
          className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-3 transition-shadow hover:shadow-xs"
        >
          <p className="text-xs font-medium text-slate-500">Agent runs</p>
          <div className="flex items-baseline justify-between">
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">312</p>
          </div>
          <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
            <TrendingUp size={14} /> +42% vs last week
          </p>
        </motion.div>
      </motion.div>

      {/* Middle Section: Recent Activity & Metrics Breakdown */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Card */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-5">
          <h3 className="text-base font-bold text-slate-900">Recent activity</h3>

          <div className="space-y-3">
            {[
              { icon: MessageSquare, title: 'Deployment steps for Project X', time: '10:42 AM - Alex', color: 'bg-blue-50 text-blue-600 border-blue-100' },
              { icon: Layers, title: 'Agent crew ran: Engineer + QA + Research', time: '10:40 AM - automated', color: 'bg-purple-50 text-purple-600 border-purple-100' },
              { icon: RefreshCw, title: 'Confluence sync completed — 12 pages updated', time: '9:15 AM - system', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
              { icon: MessageSquare, title: 'Login bug Jira tickets — AUTH-203, AUTH-197', time: 'Yesterday - Preethi', color: 'bg-blue-50 text-blue-600 border-blue-100' },
              { icon: PlusCircle, title: 'New source added: Web crawler (docs.acme.io)', time: 'Yesterday - Alex', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div 
                  key={idx}
                  whileHover={{ x: 3 }}
                  className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50/80 transition-all border-b border-slate-100 last:border-none pb-3.5"
                >
                  <div className={`p-2.5 rounded-xl border ${item.color} shrink-0`}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{item.time}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right Stack: Source Usage & Token Usage */}
        <div className="space-y-6">
          {/* Source Usage Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Source usage</h3>

            <div className="space-y-3.5">
              {[
                { name: 'Confluence', queries: '541 queries', width: '85%', color: 'bg-blue-600' },
                { name: 'Jira', queries: '389 queries', width: '65%', color: 'bg-blue-600' },
                { name: 'Web crawler', queries: '212 queries', width: '45%', color: 'bg-emerald-500' },
                { name: 'PDFs', queries: '142 queries', width: '30%', color: 'bg-rose-500' },
              ].map((src, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-800">{src.name}</span>
                    <span className="text-slate-400 font-normal">{src.queries}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: src.width }}
                      transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 + i * 0.1 }}
                      className={`h-full rounded-full ${src.color}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Token Usage Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Token usage</h3>

            <div className="space-y-3.5">
              {[
                { name: 'Input', val: '842k / 2M', width: '42%', color: 'bg-blue-600' },
                { name: 'Output', val: '318k / 1M', width: '32%', color: 'bg-purple-600' },
                { name: 'Embeddings', val: '1.1M / 5M', width: '22%', color: 'bg-emerald-500' },
              ].map((token, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-600">{token.name}</span>
                    <span className="text-slate-900 font-bold">{token.val}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: token.width }}
                      transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 + i * 0.1 }}
                      className={`h-full rounded-full ${token.color}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

