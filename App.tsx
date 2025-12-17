import React, { useState, useRef } from 'react';
import { 
  ArrowPathIcon, 
  TrashIcon, 
  LanguageIcon, 
  PhotoIcon, 
  XMarkIcon, 
  SparklesIcon,
  DocumentDuplicateIcon,
  CheckCircleIcon,
  CommandLineIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { CmsEntry } from './types';
import { mockGenerateCmsEntry, mockRefineText } from './services/mockService';

const DEFAULT_LABELS: Record<string, string> = {
  en: "English", cn: "Simplified Chinese", kh: "Khmer", id: "Indonesian", 
  vn: "Vietnamese", th: "Thai", my: "Malay"
};

const DEFAULT_GEN_LANGS = ['en', 'cn', 'kh', 'id', 'vn', 'th', 'my'];
const SQL_TEMPLATE_HEADER = "INSERT INTO [dbo].[LanguageStrings] ([Category], [ShortCode], [en], [cn], [kh], [id], [vn], [th], [my]) VALUES";

export default function App() {
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [entries, setEntries] = useState<CmsEntry[]>([]);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText && !selectedImage) return;

    setIsGenerating(true);
    try {
      const data = await mockGenerateCmsEntry(inputText);
      const newEntry: CmsEntry = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        ...data
      };

      setEntries([newEntry, ...entries]);
      setInputText('');
      setSelectedImage(null);
    } catch (err) {
      console.error("Local Generation error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefine = async (entryId: string, lang: string) => {
    const entry = entries.find(e => e.id === entryId);
    if (!entry) return;

    try {
      const refinedText = await mockRefineText(lang, entry.translations[lang]);
      updateEntry(entryId, `translations.${lang}`, refinedText);
    } catch (e) {
      console.error(e);
    }
  };

  const updateEntry = (id: string, path: string, value: string) => {
    setEntries(prev => prev.map(e => {
      if (e.id !== id) return e;
      if (path.startsWith('translations.')) {
        const lang = path.split('.')[1];
        return { ...e, translations: { ...e.translations, [lang]: value } };
      }
      return { ...e, [path]: value } as any;
    }));
  };

  const generateSql = () => {
    if (entries.length === 0) return "-- Enter an iGaming term like 'Turnover' or 'Jackpot' above.";
    const rows = entries.map(e => {
      const vals = [
        `'${e.key1}'`,
        `'${e.key2}'`,
        ...DEFAULT_GEN_LANGS.map(l => {
          const val = (e.translations[l] || "").replace(/'/g, "''");
          return l === 'en' ? `'${val}'` : `N'${val}'`;
        })
      ];
      return `(${vals.join(', ')})`;
    });
    return `${SQL_TEMPLATE_HEADER}\n${rows.join(',\n')};`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateSql());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-indigo-100">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 p-2 rounded-xl text-white">
            <CommandLineIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight text-slate-800 leading-none">iGaming SQL Localizer</h1>
            <div className="flex items-center gap-2 mt-1">
              <ShieldCheckIcon className="w-3 h-3 text-emerald-500" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Accuracy Verified Library v3.0</p>
            </div>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-4">
          <div className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-100">
            OFFLINE ENGINE READY
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          {/* Input Section */}
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-[0.15em] px-1">Source Text / Intent</label>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <textarea 
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="e.g., 'Turnover Requirement' or 'Withdrawal Processing'..."
                      className="w-full h-24 p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none shadow-inner"
                    />
                  </div>
                  {selectedImage && (
                    <div className="relative shrink-0">
                      <img src={selectedImage} className="w-24 h-24 object-cover rounded-2xl border-2 border-indigo-100 shadow-sm" />
                      <button 
                        type="button"
                        onClick={() => setSelectedImage(null)}
                        className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1.5 shadow-xl ring-4 ring-white"
                      >
                        <XMarkIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex gap-3">
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => setSelectedImage(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-all text-xs font-bold"
                  >
                    <PhotoIcon className="w-4 h-4 text-slate-400" />
                    SCREENSHOT REF
                  </button>
                </div>
                <button 
                  disabled={isGenerating || (!inputText && !selectedImage)}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-30 text-white px-10 py-3 rounded-2xl font-bold text-sm shadow-xl shadow-indigo-100 transition-all flex items-center gap-3 active:scale-95"
                >
                  {isGenerating ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <SparklesIcon className="w-4 h-4" />}
                  {isGenerating ? 'MATCHING TERMS...' : 'LOCATE & TRANSLATE'}
                </button>
              </div>
            </form>
          </section>

          {/* Cards */}
          <section className="space-y-6">
            {entries.map(entry => (
              <div key={entry.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-top-4 duration-500">
                <div className="bg-slate-50 px-8 py-4 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Entry Category</span>
                      <input 
                        value={entry.key1}
                        onChange={(e) => updateEntry(entry.id, 'key1', e.target.value.toUpperCase())}
                        className="bg-white border border-slate-200 font-bold text-indigo-600 outline-none w-28 text-xs rounded px-2 py-1 shadow-sm"
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Short Code</span>
                      <input 
                        value={entry.key2}
                        onChange={(e) => updateEntry(entry.id, 'key2', e.target.value.toUpperCase())}
                        className="bg-white border border-slate-200 font-bold text-slate-800 outline-none w-56 text-xs rounded px-2 py-1 shadow-sm"
                      />
                    </div>
                  </div>
                  <button onClick={() => setEntries(entries.filter(e => e.id !== entry.id))}
                    className="p-2 text-slate-300 hover:text-red-500 transition-all">
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                  {DEFAULT_GEN_LANGS.map(lang => (
                    <div key={lang} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                          {DEFAULT_LABELS[lang]}
                        </label>
                        <button onClick={() => handleRefine(entry.id, lang)}
                          className="text-[9px] font-bold text-slate-300 hover:text-indigo-600 uppercase transition-all">
                          Toggle Variation
                        </button>
                      </div>
                      <input 
                        value={entry.translations[lang] || ""}
                        onChange={(e) => updateEntry(entry.id, `translations.${lang}`, e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-300 transition-all outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {entries.length === 0 && (
              <div className="py-24 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-[3rem]">
                <DocumentDuplicateIcon className="w-16 h-16 opacity-10 mb-4" />
                <p className="font-bold">Enter industry terms to begin generation.</p>
                <p className="text-xs mt-1 text-slate-400">e.g. Try "Insufficient Balance" or "Turnover"</p>
              </div>
            )}
          </section>
        </div>

        {/* SQL Buffer */}
        <div className="lg:col-span-5">
          <div className="bg-[#0f172a] rounded-[2.5rem] overflow-hidden shadow-2xl sticky top-28 h-[calc(100vh-160px)] flex flex-col border border-slate-800 ring-4 ring-slate-100">
            <div className="bg-[#1e293b] px-8 py-5 flex items-center justify-between border-b border-slate-800">
              <span className="text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase">SQL Query Output</span>
              <button 
                onClick={copyToClipboard}
                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all shadow-lg ${copied ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}
              >
                {copied ? <CheckCircleIcon className="w-4 h-4" /> : <DocumentDuplicateIcon className="w-4 h-4" />}
                {copied ? 'COPIED' : 'COPY SQL'}
              </button>
            </div>
            <div className="flex-1 overflow-auto p-8 custom-scrollbar bg-slate-900/40">
              <pre className="font-mono text-[11px] text-indigo-200/90 leading-relaxed whitespace-pre-wrap">
                {generateSql()}
              </pre>
            </div>
            <div className="bg-[#1e293b] p-6 text-center">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Target Database: MS SQL / MySQL</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t px-10 py-6 text-center">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">
          iGaming CMS Localization Tool • 2024 Stable Edition
        </p>
      </footer>
    </div>
  );
}
