import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, UploadCloud, DownloadCloud, FileSpreadsheet, CheckCircle2, AlertCircle, X, PlusCircle } from 'lucide-react';
import { uploadCSV } from '../services/api';

export default function DataManagement() {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv')) {
      setFile(droppedFile);
      setResult(null);
    } else {
      alert("Please drop a valid .csv file.");
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setResult(null);

    try {
      const res = await uploadCSV(file);
      setResult({ type: 'success', data: res.data });
      setFile(null); // Clear the uploaded file to allow another upload
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error(err);
      setResult({
        type: 'error',
        message: err.response?.data?.error || "An error occurred during upload."
      });
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = "item_id,item_name,category,unit,cost_per_unit,supplier_name,quantity,reorder_level\nITEM-001,Premium Widget,Electronics,pieces,12.50,Acme Corp,50,20\nITEM-002,Standard Gear,Hardware,sets,8.00,Beta Inc,120,50";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "DemandLens_Upload_Template.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 w-full bg-slate-50/60 min-h-full font-sans">
      {/* ── Header ── */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Database className="w-6 h-6 text-blue-600" />
            Data Management
          </h1>
          <p className="text-slate-500 mt-1 text-sm max-w-2xl">
            Import bulk inventory data via CSV. If an item already exists in the system, its quantity will be added securely.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Container */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-6 overflow-hidden relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-slate-600" />
                Bulk CSV Import
              </h3>
              <button 
                onClick={downloadTemplate}
                className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                title="Download CSV Template"
              >
                <DownloadCloud className="w-3.5 h-3.5" /> Template
              </button>
            </div>

            {/* Drop Zone */}
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all ${
                isDragging 
                  ? 'border-blue-500 bg-blue-50/50' 
                  : file 
                    ? 'border-emerald-500 bg-emerald-50/20' 
                    : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50'
              }`}
            >
              <input 
                type="file" 
                accept=".csv" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
              />
              
              <AnimatePresence mode="wait">
                {file ? (
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }} 
                    exit={{ scale: 0.9, opacity: 0 }}
                    key="file"
                    className="flex flex-col items-center"
                  >
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                      <FileSpreadsheet className="w-8 h-8" />
                    </div>
                    <p className="font-bold text-slate-800 text-lg">{file.name}</p>
                    <p className="text-slate-500 text-sm mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }} 
                    exit={{ scale: 0.9, opacity: 0 }}
                    key="empty"
                    className="flex flex-col items-center pointer-events-none"
                  >
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-sm transition-colors ${isDragging ? 'bg-blue-100 text-blue-600' : 'bg-slate-50 text-slate-400'}`}>
                      <UploadCloud className="w-8 h-8" />
                    </div>
                    <p className="font-bold text-slate-700 text-lg">Click or drag CSV here</p>
                    <p className="text-slate-400 text-sm mt-1 max-w-xs text-center">
                      Upload your inventory manifest. Supported format: CSV.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Action Bar */}
            <AnimatePresence>
              {file && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }} 
                  animate={{ height: 'auto', opacity: 1 }} 
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-6 flex gap-3 overflow-hidden"
                >
                  <button 
                    onClick={(e) => { e.stopPropagation(); setFile(null); if(fileInputRef.current) fileInputRef.current.value = ""; }}
                    className="flex-1 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors flex justify-center items-center gap-2"
                  >
                    <X className="w-4 h-4" /> Cancel
                  </button>
                  <button 
                    onClick={handleUpload}
                    disabled={uploading}
                    className="flex-[2] px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-sm hover:shadow transition-all disabled:opacity-70 flex justify-center items-center gap-2"
                  >
                    {uploading ? (
                        <>
                           <UploadCloud className="w-4 h-4 animate-bounce" />
                           Uploading...
                        </>
                    ) : (
                        <>
                            <Database className="w-4 h-4" />
                            Process Data
                        </>
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Info & Results Sidebar */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-6">
             <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
               <PlusCircle className="w-5 h-5 text-slate-600" /> How It Works
             </h3>
             <ul className="space-y-3">
               <li className="flex items-start gap-2 text-sm text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 rounded-full bg-emerald-50 shrink-0 mt-0.5" />
                  <span>Download the template to see required headers.</span>
               </li>
               <li className="flex items-start gap-2 text-sm text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 rounded-full bg-emerald-50 shrink-0 mt-0.5" />
                  <span><strong>Smart Add:</strong> If an item ID already exists, your uploaded quantity will be <strong>added</strong> to current stock.</span>
               </li>
               <li className="flex items-start gap-2 text-sm text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 rounded-full bg-emerald-50 shrink-0 mt-0.5" />
                  <span>Unknown models or suppliers will be securely generated automatically.</span>
               </li>
             </ul>
          </div>

          <AnimatePresence>
             {result && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`border rounded-xl shadow-sm p-6 ${result.type === 'success' ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}
                >
                    <div className="flex items-center gap-3 mb-3">
                        {result.type === 'success' ? (
                             <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                 <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                             </div>
                        ) : (
                             <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                 <AlertCircle className="w-5 h-5 text-red-600" />
                             </div>
                        )}
                        <h4 className={`font-bold text-lg ${result.type === 'success' ? 'text-emerald-900' : 'text-red-900'}`}>
                           {result.type === 'success' ? 'Import Successful' : 'Import Failed'}
                        </h4>
                    </div>

                    {result.type === 'success' ? (
                        <div className="space-y-2 mt-4 text-sm font-medium text-emerald-800">
                           <div className="flex justify-between bg-emerald-100/50 p-2 rounded-lg">
                               <span>Rows Processed</span>
                               <span className="font-bold">{result.data.rows_processed}</span>
                           </div>
                           <div className="flex justify-between bg-emerald-100/50 p-2 rounded-lg">
                               <span>New Items Created</span>
                               <span className="font-bold">{result.data.items_created}</span>
                           </div>
                           <div className="flex justify-between bg-emerald-100/50 p-2 rounded-lg">
                               <span>Existing Items Updated (Added)</span>
                               <span className="font-bold">{result.data.items_updated}</span>
                           </div>
                           {result.data.errors_count > 0 && (
                                <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg text-red-800 text-xs font-mono">
                                    <p className="font-bold mb-1">{result.data.errors_count} Validation Errors:</p>
                                    <ul className="list-disc pl-4 space-y-1">
                                        {result.data.errors.map((err, i) => <li key={i}>{err}</li>)}
                                    </ul>
                                </div>
                           )}
                        </div>
                    ) : (
                        <p className="text-sm font-medium text-red-700 leading-relaxed bg-red-100/50 p-3 rounded-lg">
                            {result.message}
                        </p>
                    )}
                </motion.div>
             )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
