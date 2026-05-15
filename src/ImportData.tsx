import { useState } from 'react';
import { Upload, X, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

interface ImportViewProps {
  onComplete: (data: any[]) => void;
  onCancel: () => void;
}

const API_URL = 'http://127.0.0.1:8000/api/predict/upload';

export default function ImportView({ onComplete, onCancel }: ImportViewProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsParsing(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(API_URL, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || 'Upload failed');
      }

      onComplete(result.members || []);
    } catch (err: any) {
      setError(err.message || 'ไม่สามารถเชื่อมต่อ backend ได้ กรุณารัน FastAPI ก่อน');
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-2xl border border-gray-200 shadow-sm animate-in fade-in zoom-in duration-300">
      <div className="text-center mb-8">
        <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <Upload className="text-gray-600" size={28} />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Import Member Data</h2>
        <p className="text-gray-500 text-sm mt-1">Upload CSV file to Backend for Churn Analysis</p>
      </div>

      <div className={`relative border-2 border-dashed rounded-xl p-10 transition-all text-center ${
        file ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-blue-400'
      }`}>
        <input 
          type="file" 
          accept=".csv" 
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        {!file ? (
          <div className="space-y-2">
            <p className="text-gray-700 font-medium">Click to upload or drag and drop</p>
            <p className="text-xs text-gray-400">CSV files only</p>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-3 text-green-700">
            <FileText size={24} />
            <span className="font-semibold">{file.name}</span>
            <button onClick={() => setFile(null)} className="text-gray-400 hover:text-red-500 cursor-pointer">
              <X size={18} />
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 flex gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100 text-left">
        <AlertCircle className="text-blue-500 shrink-0" size={20} />
        <p className="text-xs text-blue-700">
          <strong>Backend API:</strong> ระบบจะส่งไฟล์ไปที่ <code className="font-bold">127.0.0.1:8000</code> แล้วรับผลลัพธ์ Risk Score กลับมาแสดงบน Dashboard
        </p>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-8 flex gap-3">
        <button 
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button 
          onClick={handleUpload}
          disabled={!file || isParsing}
          className={`flex-2 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
            !file || isParsing 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-gray-900 text-white hover:bg-black cursor-pointer shadow-lg'
          }`}
        >
          {isParsing ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <CheckCircle2 size={20} />
              Send to Backend
            </>
          )}
        </button>
      </div>
    </div>
  );
}
