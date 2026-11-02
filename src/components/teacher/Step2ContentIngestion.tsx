'use client';

import React, { useState } from 'react';
import { FileText, Image as ImageIcon, FileUp, Sparkles, AlertCircle, Upload, Check } from 'lucide-react';

interface Step2Props {
  contentData: {
    mode: 'text' | 'image' | 'pdf' | 'multi-image';
    text: string;
    imageBase64?: string;
    fileName?: string;
    mimeType?: string;
  };
  onChange: (field: string, value: any) => void;
  onNext: () => void;
  onBack: () => void;
}

const SAMPLE_TEXT = `Force is a push or pull acting on an object. The SI unit of force is Newton. Pressure is defined as force applied per unit area. Friction always opposes relative motion between two surfaces. Atmospheric pressure decreases as altitude increases. Gravitational force is an attractive force between two masses. The instrument used to measure atmospheric pressure is a barometer. Electrostatic force is exerted by a charged body on another. The unit of pressure is Pascal which equals one Newton per square meter. Force can change the shape and speed of an object in motion.`;

export default function Step2ContentIngestion({
  contentData,
  onChange,
  onNext,
  onBack,
}: Step2Props) {
  const [activeTab, setActiveTab] = useState<'text' | 'image' | 'pdf' | 'multi-image' | 'future'>(
    'text'
  );
  const [filePreview, setFilePreview] = useState<string | null>(contentData.imageBase64 || null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'pdf') => {
    // Disabled in current production workflow
    alert('PDF/Image import will be available in a future version. Please use Option A — Paste Text.');
  };

  const handleInsertSample = () => {
    onChange('text', SAMPLE_TEXT);
    onChange('mode', 'text');
    setActiveTab('text');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedText = (contentData.text || '').trim();

    if (!trimmedText) {
      alert('Please enter some lesson text before continuing.');
      return;
    }

    if (trimmedText.length < 50) {
      alert('Please enter at least 50 characters of lesson text before continuing.');
      return;
    }

    if (trimmedText.length > 20000) {
      alert('Content size exceeds the maximum limit of 20,000 characters. Please shorten your text.');
      return;
    }

    // Ensure mode is text
    onChange('mode', 'text');
    onNext();
  };

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm max-w-3xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            Step 2 — Paste or Enter Your Lesson Text
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Enter your textbook paragraphs, chapter summary, or lesson notes. AI will extract factual sentences.
          </p>
        </div>

        <button
          type="button"
          onClick={handleInsertSample}
          className="text-xs font-semibold px-3 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors flex items-center gap-1.5 shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Insert Sample Lesson
        </button>
      </div>

      {/* Tabs Header */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-px mb-6 scrollbar-none">
        <button
          type="button"
          onClick={() => {
            setActiveTab('text');
            onChange('mode', 'text');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-sm border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'text'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          Option A — Paste Text
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('image')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-sm border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'image'
              ? 'border-slate-400 text-slate-400'
              : 'border-transparent text-slate-400 hover:text-slate-500'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          Option B — Upload Image
          <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-normal">Future</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pdf')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-sm border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'pdf'
              ? 'border-slate-400 text-slate-400'
              : 'border-transparent text-slate-400 hover:text-slate-500'
          }`}
        >
          <FileUp className="w-4 h-4" />
          Option C — Upload PDF
          <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-normal">Future</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tab Content: Text (Active Primary Workflow) */}
        {activeTab === 'text' && (
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Paste or enter your lesson text
            </label>
            <textarea
              rows={9}
              value={contentData.text}
              onChange={(e) => onChange('text', e.target.value)}
              placeholder="Paste the lesson, paragraph, notes, or textbook content here..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium text-slate-800 outline-none transition-all"
            />
            <div className="flex justify-between items-center text-xs text-slate-500 mt-1">
              <span>Minimum 50 characters required for AI processing.</span>
              <span className={contentData.text.length < 50 ? 'text-amber-600 font-semibold' : 'text-slate-500'}>
                {contentData.text.length} / 20,000 characters
              </span>
            </div>
          </div>
        )}

        {/* Tab Content: Image (Disabled/Future Notice) */}
        {activeTab === 'image' && (
          <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200 text-center space-y-3">
            <ImageIcon className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="font-bold text-slate-700 text-base">Image Import Coming Soon</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              PDF/Image import will be available in a future version. Please use <strong className="text-slate-700">Option A — Paste Text</strong> to process your educational materials in the current version.
            </p>
            <button
              type="button"
              onClick={() => setActiveTab('text')}
              className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" /> Switch to Paste Text
            </button>
          </div>
        )}

        {/* Tab Content: PDF (Disabled/Future Notice) */}
        {activeTab === 'pdf' && (
          <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200 text-center space-y-3">
            <FileUp className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="font-bold text-slate-700 text-base">PDF Import Coming Soon</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              PDF/Image import will be available in a future version. Please use <strong className="text-slate-700">Option A — Paste Text</strong> to process your educational materials in the current version.
            </p>
            <button
              type="button"
              onClick={() => setActiveTab('text')}
              className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" /> Switch to Paste Text
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-2.5 text-slate-600 hover:text-slate-900 font-bold transition-colors"
          >
            ← Back
          </button>
          <button
            type="submit"
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 transform active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            Process Text →
          </button>
        </div>
      </form>
    </div>
  );
}

