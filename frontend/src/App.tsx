import React, { useState, useRef } from 'react';
import { UploadCloud, ShieldCheck, Flame, XCircle, AlertTriangle, Loader2, Info, ThumbsUp, ThumbsDown } from 'lucide-react';

interface AnalysisResult {
  category: string;
  reason: string;
}

function App() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError(null);
      setFeedback(null);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    setFeedback(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setResult(null);
    setError(null);
    setFeedback(null);

    const formData = new FormData();
    formData.append('image', selectedImage);

    try {
      const response = await fetch('https://toastinspector-1.onrender.com/classify-toast', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to analyze the image. Is the server running?');
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setResult({
        category: data.category,
        reason: data.reason,
      });
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getCategoryConfig = (category: string) => {
    const c = category.toLowerCase();
    if (c.includes('perfectly')) {
      return { color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200', icon: <ShieldCheck className="w-8 h-8 text-amber-500" /> };
    }
    if (c.includes('lightly')) {
      return { color: 'text-orange-300', bg: 'bg-orange-50', border: 'border-orange-100', icon: <ShieldCheck className="w-8 h-8 text-orange-300" /> };
    }
    if (c.includes('heavily')) {
      return { color: 'text-orange-700', bg: 'bg-orange-100', border: 'border-orange-300', icon: <Flame className="w-8 h-8 text-orange-700" /> };
    }
    if (c.includes('burnt')) {
      return { color: 'text-neutral-800', bg: 'bg-neutral-100', border: 'border-neutral-300', icon: <XCircle className="w-8 h-8 text-neutral-800" /> };
    }
    if (c.includes('broken')) {
      return { color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200', icon: <AlertTriangle className="w-8 h-8 text-red-500" /> };
    }
    // Default
    return { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: <Info className="w-8 h-8 text-amber-600" /> };
  };

  return (
    <div className="min-h-screen font-sans bg-[var(--color-brand-bg)] flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">

      {/* Header */}
      <div className="w-full max-w-3xl text-center mb-10 space-y-3">
        <div className="inline-flex items-center justify-center p-3 bg-amber-100 rounded-2xl mb-2 text-amber-600 shadow-sm border border-amber-200">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 8.5C4.5 6.01472 6.51472 4 9 4H15C17.4853 4 19.5 6.01472 19.5 8.5V13.5C19.5 16 17 19.5 12 19.5C7 19.5 4.5 16 4.5 13.5V8.5Z" /><path d="M2.5 7.5L21.5 7.5" /><path d="M7.5 11.5L7.51 11.5" /><path d="M12.5 11.5L12.51 11.5" /><path d="M16.5 11.5L16.51 11.5" /></svg>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-[#2b2a29] tracking-tight">
          Toast Inspector
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto font-medium">
          Upload a photo of your toast and let our AI Vision expert classify its exact roasting characteristics.
        </p>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl shadow-amber-900/5 border border-amber-100 overflow-hidden transition-all duration-300">

        <div className="p-8">
          {!selectedImage ? (
            // Upload State
            <div
              className="border-2 border-dashed border-amber-200 rounded-2xl p-12 text-center hover:bg-amber-50/50 hover:border-amber-400 transition-colors cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <UploadCloud className="w-8 h-8 text-amber-600" />
              </div>
              <p className="text-lg font-semibold text-gray-700 mb-1">Click to upload your toast</p>
              <p className="text-sm text-gray-400">JPG, PNG, WEBP (max. 10MB)</p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                className="hidden"
                accept="image/*"
              />
            </div>
          ) : (
            // Preview State
            <div className="space-y-6">
              <div className="relative group rounded-xl overflow-hidden shadow-md">
                <img
                  src={previewUrl!}
                  alt="Toast preview"
                  className="w-full h-64 object-cover object-center transition-transform duration-500 group-hover:scale-105"
                />
                <button
                  onClick={clearImage}
                  className="absolute top-3 right-3 p-1.5 bg-black/50 hover:bg-black/70 rounded-full text-white backdrop-blur-sm transition-colors"
                  aria-label="Clear image"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Action Button */}
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-orange-500/20 disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-3"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Analyzing Toast...
                  </>
                ) : (
                  'Analyze Roast Level'
                )}
              </button>
            </div>
          )}
        </div>

        {/* Results Area */}
        <div className={`border-t border-gray-100 transition-all duration-500 ease-out overflow-hidden ${result || error ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
          {error && (
            <div className="p-6 bg-red-50 flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-red-800">Analysis Failed</h4>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {result && !error && (
            <div className={`p-8 ${getCategoryConfig(result.category).bg} flex items-start gap-5`}>
              <div className={`p-3 bg-white rounded-2xl shadow-sm border ${getCategoryConfig(result.category).border} shrink-0`}>
                {getCategoryConfig(result.category).icon}
              </div>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wider font-bold text-gray-400 mb-1">AI Classification</p>
                <h3 className={`text-2xl font-black mb-2 ${getCategoryConfig(result.category).color}`}>
                  {result.category}
                </h3>
                <p className="text-gray-700 leading-relaxed font-medium mb-4">
                  "{result.reason}"
                </p>

                {/* Feedback Section */}
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100 mt-4">
                  <span className="text-sm font-medium text-gray-500">Was this accurate?</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFeedback('up')}
                      className={`p-2 rounded-full transition-all duration-300 transform outline-none hover:scale-110 active:scale-95 ${feedback === 'up'
                        ? 'bg-green-100 text-green-600 scale-110 ring-2 ring-green-500 ring-offset-1'
                        : 'bg-gray-50 text-gray-400 hover:bg-gray-100 focus:ring-2 focus:ring-gray-300'
                        }`}
                      aria-label="Thumbs up"
                    >
                      <ThumbsUp className={`w-5 h-5 ${feedback === 'up' ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={() => setFeedback('down')}
                      className={`p-2 rounded-full transition-all duration-300 transform outline-none hover:scale-110 active:scale-95 ${feedback === 'down'
                        ? 'bg-red-100 text-red-600 scale-110 ring-2 ring-red-500 ring-offset-1'
                        : 'bg-gray-50 text-gray-400 hover:bg-gray-100 focus:ring-2 focus:ring-gray-300'
                        }`}
                      aria-label="Thumbs down"
                    >
                      <ThumbsDown className={`w-5 h-5 ${feedback === 'down' ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                  {feedback && (
                    <span className="text-sm font-medium text-amber-600 ml-2 animate-pulse bg-amber-50 px-3 py-1 rounded-full">
                      Thanks for the feedback!
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

export default App;
