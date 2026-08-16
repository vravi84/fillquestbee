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
    contentData.mode || 'text'
  );
  const [filePreview, setFilePreview] = useState<string | null>(contentData.imageBase64 || null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'pdf') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'image' && !file.type.startsWith('image/')) {
      alert('Please upload a valid image file (JPG, JPEG, PNG, WEBP).');
      return;
    }

    if (type === 'pdf' && file.type !== 'application/pdf') {
      alert('Please upload a valid PDF document.');
      return;
    }

    const maxSizeBytes = type === 'pdf' ? 10 * 1024 * 1024 : 7 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      alert(`Selected ${type.toUpperCase()} file size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum limit of ${type === 'pdf' ? '10MB' : '7MB'}. Please select a smaller file.`);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setFilePreview(base64);
      onChange('imageBase64', base64);
      onChange('fileName', file.name);
      onChange('mimeType', file.type || (type === 'pdf' ? 'application/pdf' : 'image/png'));
      onChange('mode', type);
    };
    reader.readAsDataURL(file);
  };

  const handleInsertSample = () => {
    onChange('text', SAMPLE_TEXT);
    onChange('mode', 'text');
    setActiveTab('text');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'text' && !contentData.text.trim()) {
      alert('Please paste or type educational lesson text.');
      return;
    }
    if ((activeTab === 'image' || activeTab === 'pdf') && !contentData.imageBase64) {
      alert('Please select and upload a file first.');
      return;
    }
    onNext();
  };

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm max-w-3xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileUp className="w-6 h-6 text-purple-600" />
            Step 2 — Provide Educational Content
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Upload or paste textbook paragraphs, handwritten notes, or worksheets. AI will extract key sentences.
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
          onClick={() => {
            setActiveTab('image');
            onChange('mode', 'image');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-sm border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'image'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          Option B — Upload Image
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('pdf');
            onChange('mode', 'pdf');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-sm border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'pdf'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileUp className="w-4 h-4" />
          Option C — Upload PDF
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('future')}
          className="flex items-center gap-2 px-4 py-2.5 font-bold text-sm border-b-2 border-transparent text-slate-400 hover:text-slate-600 whitespace-nowrap"
        >
          + More Sources (DOCX / URL)
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tab Content: Text */}
        {activeTab === 'text' && (
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Paste Lesson / Educational Content
            </label>
            <textarea
              rows={8}
              value={contentData.text}
              onChange={(e) => onChange('text', e.target.value)}
              placeholder="Paste your lesson paragraphs, chapter summary, or science notes here..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium text-slate-800 outline-none transition-all"
            />
            <div className="flex justify-between items-center text-xs text-slate-400 mt-1">
              <span>Enter at least 3 to 15 educational sentences.</span>
              <span>{contentData.text.length} characters</span>
            </div>
          </div>
        )}

        {/* Tab Content: Single Image */}
        {activeTab === 'image' && (
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Upload Textbook Page / Worksheet Image (JPG, PNG, WEBP)
            </label>

            <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-8 text-center bg-slate-50/50 transition-colors relative cursor-pointer">
              <input
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={(e) => handleFileUpload(e, 'image')}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <Upload className="w-10 h-10 text-indigo-500 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700">
                Click or drag & drop textbook image here
              </p>
              <p className="text-xs text-slate-400 mt-1">Supports JPG, PNG, WEBP</p>

              {contentData.fileName && (
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold border border-emerald-200">
                  <Check className="w-4 h-4" />
                  <span>Uploaded: {contentData.fileName}</span>
                </div>
              )}
            </div>

            {filePreview && filePreview.startsWith('data:image') && (
              <div className="mt-4 max-h-48 overflow-hidden rounded-xl border border-slate-200">
                <img src={filePreview} alt="Upload preview" className="w-full object-cover" />
              </div>
            )}
          </div>
        )}

        {/* Tab Content: PDF */}
        {activeTab === 'pdf' && (
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Upload Educational PDF Document
            </label>

            <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-8 text-center bg-slate-50/50 transition-colors relative cursor-pointer">
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => handleFileUpload(e, 'pdf')}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <FileUp className="w-10 h-10 text-purple-500 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700">Click or drag & drop PDF document here</p>
              <p className="text-xs text-slate-400 mt-1">Accepts standard PDF documents</p>

              {contentData.fileName && (
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-semibold border border-purple-200">
                  <Check className="w-4 h-4" />
                  <span>Uploaded PDF: {contentData.fileName}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab Content: Future Modular */}
        {activeTab === 'future' && (
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-center">
            <AlertCircle className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
            <h4 className="font-bold text-slate-800">Future-Ready Content Architecture</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Modular ingestion layer ready for DOCX files, web URLs, PowerPoint slides, and textbook links in future updates.
            </p>
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
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Extract Sentences with AI →
          </button>
        </div>
      </form>
    </div>
  );
}
