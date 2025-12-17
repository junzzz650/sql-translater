import React, { useState, useRef, useEffect } from 'react';
import { generateCmsEntry, refineText } from './services/geminiService';
import { CmsEntry } from './types';
import { 
  CodeBracketIcon, 
  ArrowPathIcon, 
  ClipboardDocumentIcon,
  TrashIcon,
  Cog6ToothIcon,
  InformationCircleIcon,
  LanguageIcon,
  PhotoIcon,
  XMarkIcon,
  ArrowUturnLeftIcon,
  SparklesIcon,
  SwatchIcon,
  TableCellsIcon,
  Bars3BottomLeftIcon
} from '@heroicons/react/24/outline';

const DEFAULT_LABELS: Record<string, string> = {
    en: "English",
    cn: "Simplified Chinese",
    kh: "Khmer",
    id: "Indonesian",
    vn: "Vietnamese",
    th: "Thai",
    my: "Malay",
    lo: "Lao",
    hk: "Trad. Chinese (HK)",
    ar: "Arabic",
    fr: "French",
    ja: "Japanese",
    es: "Spanish",
    pt: "Portuguese",
    tr: "Turkish",
    ru: "Russian",
    kr: "Korean",
    mm: "Burmese",
    hi: "Hindi",
    mn: "Mongolian",
    ph: "Filipino",
    bd: "Bengali",
    ne: "Nepali",
    pk: "Urdu",
};

const DEFAULT_GEN_LANGS = Object.keys(DEFAULT_LABELS);
const DEFAULT_HEADER = "INSERT INTO [dbo].[BackOffice]([key1],[key2],[Translated],[en],[cn],[kh],[id],[vn],[th],[my],[lo],[hk],[ar],[fr],[ja],[es],[pt],[tr],[ru],[kr],[mm],[hi],[mn],[ph],[bd],[ne],[pk]) VALUES";
const DEFAULT_MAPPING = "key1, key2, empty, en, cn, kh, id, vnt, th, my, lo, hk, ar, fr, ja, es, pt, tr, ru, kr, mm, hi, mn, ph, bd, ne, pk";

interface EntryCardProps {
  entry: CmsEntry;
  languageLabels: Record<string, string>;
  sortOrder: string[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, field: string, value: string) => void;
}

const EntryCard: React.FC<EntryCardProps> = ({ entry, languageLabels, sortOrder, onDelete, onUpdate }) => {
  const [refiningLang, setRefiningLang] = useState<string | null>(null);
  const allKeys = Array.from(new Set([...Object.keys(languageLabels), ...Object.keys(entry.translations)]));

  const sortedLangs = allKeys.sort((a, b) => {
      if (a === 'en') return -1;
      if (b === 'en') return 1;
      const idxA = sortOrder.indexOf(a);
      const idxB = sortOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
  });

  const handleRefine = async (lang: string) => {
    setRefiningLang(lang);
    try {
      const currentVal = entry.translations[lang] || "";
      const englishContext = entry.translations.en || "";
      const refined = await refineText(lang, currentVal, englishContext);
      onUpdate(entry.id, `translations.${lang}`, refined);
    } catch (e) {
      console.error("Failed to refine text", e);
    } finally {
      setRefiningLang(null);
    }
  };

  const getLangName = (code: string) => languageLabels[code] || languageLabels[code.toLowerCase()] || code.toUpperCase();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex justify-between items-center gap-3">
        <div className="flex-1 flex gap-4 items-center">
          <div className="flex gap-4">
             <div className="flex flex-col">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5 ml-1">Key 1</label>
                <input 
                  value={entry.key1}
                  onChange={(e) => onUpdate(entry.id, 'key1', e.target.value.toUpperCase())}
                  className="w-20 px-2 py-1 text-xs font-bold text-indigo-700 bg-white border border-indigo-100 rounded focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 uppercase text-center"
                />
             </div>
             <div className="flex flex-col">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5 ml-1">Key 2</label>
                <input 
                  value={entry.key2}
                  onChange={(e) => onUpdate(entry.id, 'key2', e.target.value.toUpperCase())}
                  className="w-32 px-2 py-1 text-xs font-bold text-purple-700 bg-white border border-purple-100 rounded focus:border-purple-500 focus:ring-1 focus:ring-purple-500 uppercase text-center"
                />
             </div>
          </div>
        </div>
        <button onClick={() => onDelete(entry.id)} className="text-slate-400 hover:text-red-600 p-1.5 rounded-full hover:bg-red-50 transition-colors">
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-3">
          {sortedLangs.map(lang => (
            <div key={lang} className="grid grid-cols-[80px_1fr] gap-3 items-start group border-b border-slate-50 last:border-0 pb-2 last:pb-0">
                <div className="flex flex-col pt-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${lang === 'en' ? 'text-indigo-600' : 'text-slate-500'}`}>{lang}</span>
                    <span className="text-[9px] text-slate-400 font-medium truncate" title={getLangName(lang)}>{getLangName(lang)}</span>
                </div>
                <div className="relative flex gap-2">
                    <textarea 
                      value={entry.translations[lang] || ''}
                      onChange={(e) => onUpdate(entry.id, `translations.${lang}`, e.target.value)}
                      className={`w-full text-sm border rounded-md px-3 py-1.5 focus:ring-2 transition-shadow min-h-[36px] resize-y ${
                        lang === 'en' ? 'border-indigo-100 bg-indigo-50/10 focus:ring-indigo-500/10 focus:border-indigo-400' : 'border-slate-200 bg-white focus:border-indigo-300 focus:ring-indigo-100'
                      }`}
                      rows={1}
                    />
                    <button onClick={() => handleRefine(lang)} disabled={!!refiningLang} className="text-slate-300 hover:text-indigo-600 p-1">
                      <SparklesIcon className={`w-3.5 h-3.5 ${refiningLang === lang ? 'animate-pulse text-indigo-600' : ''}`} />
                    </button>
                </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default function App() {
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [entries, setEntries] = useState<CmsEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [activeTab, setActiveTab] = useState<'sql' | 'lang'>('sql');
  const [sqlHeader, setSqlHeader] = useState(DEFAULT_HEADER);
  const [colMapping, setColMapping] = useState(DEFAULT_MAPPING);
  const [sqlViewMode, setSqlViewMode] = useState<'compact' | 'pretty'>('compact');
  const [genLanguages, setGenLanguages] = useState<string[]>(DEFAULT_GEN_LANGS);
  const [customLabels, setCustomLabels] = useState<Record<string, string>>({});
  const [newLangCode, setNewLangCode] = useState('');
  const [newLangLabel, setNewLangLabel] = useState('');

  const languageLabels = { ...DEFAULT_LABELS, ...customLabels };
  const mappingSortOrder = colMapping.split(',').map(s => s.trim().toLowerCase());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !selectedImage) return;
    setIsGenerating(true);
    setError(null);
    try {
      const base64Data = selectedImage ? selectedImage.split(',')[1] : undefined;
      const result = await generateCmsEntry(inputText, genLanguages, base64Data);
      setEntries(prev => [{ id: crypto.randomUUID(), timestamp: Date.now(), ...result }, ...prev]); 
      setInputText(''); 
      setSelectedImage(null);
    } catch (err) { setError("Generation failed."); } finally { setIsGenerating(false); }
  };

  const updateEntry = (id: string, field: string, value: string) => {
    setEntries(prev => prev.map(e => {
      if (e.id !== id) return e;
      if (field.startsWith('translations.')) {
        const lang = field.split('.')[1];
        return { ...e, translations: { ...e.translations, [lang]: value } };
      }
      return { ...e, [field]: value };
    }));
  };

  const getSqlOutput = () => {
    if (entries.length === 0) return "-- No entries generated yet.";
    const columns = colMapping.split(',').map(s => s.trim());
    const getRowValues = (entry: CmsEntry) => columns.map(col => {
        if (col === 'key1') return `'${entry.key1}'`;
        if (col === 'key2') return `'${entry.key2}'`;
        if (col === 'empty') return `''`; 
        const val = (entry.translations[col] || '').replace(/'/g, "''");
        return (col === 'en' || col === 'key1' || col === 'key2') ? `'${val}'` : `N'${val}'`;
    });

    if (sqlViewMode === 'compact') {
        const rows = entries.map(e => `(${getRowValues(e).join(',')})`);
        return `${sqlHeader}\n${rows.join(',\n')};`;
    }
    const rows = entries.map((e, idx) => `\t-- Row ${idx+1}: [${e.key1}][${e.key2}]\n\t(${getRowValues(e).join(', ')})`);
    return `${sqlHeader}\n${rows.join(',\n\n')};`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-sm">
                  <LanguageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-sm font-bold text-slate-900 uppercase tracking-wide">SQL Translator</h1>
                  <p className="text-[10px] text-slate-500 font-medium">Auto Key Generation & Localized SQL</p>
                </div>
            </div>
            <button onClick={() => setShowConfig(!showConfig)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${showConfig ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                <Cog6ToothIcon className="w-4 h-4" /> Config
            </button>
        </div>
        {showConfig && (
            <div className="border-t border-slate-100 bg-white shadow-xl animate-in slide-in-from-top-2 p-6 max-h-[80vh] overflow-y-auto">
              <div className="max-w-7xl mx-auto">
                <div className="flex gap-4 border-b border-slate-200 mb-6">
                  <button onClick={() => setActiveTab('sql')} className={`pb-2 text-xs font-bold uppercase ${activeTab === 'sql' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500'}`}>SQL Structure</button>
                  <button onClick={() => setActiveTab('lang')} className={`pb-2 text-xs font-bold uppercase ${activeTab === 'lang' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500'}`}>Languages</button>
                </div>
                {activeTab === 'sql' ? (
                  <div className="space-y-4">
                    <textarea value={sqlHeader} onChange={(e) => setSqlHeader(e.target.value)} className="w-full text-xs border rounded-lg font-mono p-3 h-24" placeholder="SQL Header..." />
                    <textarea value={colMapping} onChange={(e) => setColMapping(e.target.value)} className="w-full text-xs border rounded-lg font-mono p-3 h-24" placeholder="Column Mapping..." />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {Object.entries(languageLabels).map(([code, label]) => (
                      <label key={code} className="flex items-center gap-2 p-2 border rounded hover:bg-slate-50 cursor-pointer">
                        <input type="checkbox" checked={genLanguages.includes(code)} onChange={() => setGenLanguages(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code])} className="rounded" />
                        <span className="text-[10px] font-bold uppercase">{code}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
        )}
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 flex flex-col gap-8">
        <div className="max-w-3xl mx-auto w-full">
            <form onSubmit={handleGenerate} className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                {selectedImage && <div className="p-4 bg-slate-50 border-b relative"><img src={selectedImage} className="h-20 rounded shadow-sm" /><button onClick={() => setSelectedImage(null)} className="absolute top-2 left-[90px] bg-red-500 text-white rounded-full p-1"><XMarkIcon className="w-3 h-3"/></button></div>}
                <div className="flex items-center p-2">
                    <input value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Enter text to localize..." className="flex-1 border-0 focus:ring-0 text-lg py-3 px-4" disabled={isGenerating} />
                    <div className="flex items-center gap-2 pr-2">
                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 hover:text-indigo-600"><PhotoIcon className="w-6 h-6" /></button>
                        <button type="submit" disabled={isGenerating || (!inputText.trim() && !selectedImage)} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold text-sm disabled:opacity-50">
                            {isGenerating ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : 'GENERATE'}
                        </button>
                    </div>
                </div>
            </form>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 flex flex-col gap-4">
                <div className="flex justify-between items-center px-1"><h2 className="text-sm font-bold uppercase text-slate-500 tracking-wider">Entries</h2>{entries.length > 0 && <button onClick={() => setEntries([])} className="text-[10px] font-bold text-red-500 uppercase">Clear All</button>}</div>
                <div className="flex flex-col gap-4">
                    {entries.map(e => <EntryCard key={e.id} entry={e} languageLabels={languageLabels} sortOrder={mappingSortOrder} onDelete={id => setEntries(prev => prev.filter(x => x.id !== id))} onUpdate={updateEntry} />)}
                </div>
            </div>
            <div className="lg:col-span-7 sticky top-24">
                <div className="bg-[#0f172a] rounded-xl shadow-2xl overflow-hidden flex flex-col h-[calc(100vh-160px)] border border-slate-800">
                    <div className="bg-[#1e293b] px-4 py-2.5 flex justify-between items-center">
                        <span className="text-indigo-400 font-bold uppercase text-[10px]">Ready SQL Script</span>
                        <div className="flex gap-2">
                            <button onClick={() => setSqlViewMode(v => v === 'pretty' ? 'compact' : 'pretty')} className="text-[10px] text-slate-400 font-bold uppercase hover:text-white">{sqlViewMode}</button>
                            <button onClick={() => navigator.clipboard.writeText(getSqlOutput())} className="bg-indigo-600 text-white text-[10px] px-3 py-1 rounded font-bold uppercase">Copy SQL</button>
                        </div>
                    </div>
                    <textarea readOnly value={getSqlOutput()} className="flex-1 bg-transparent text-slate-300 font-mono text-[11px] p-5 outline-none resize-none" spellCheck={false} />
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}