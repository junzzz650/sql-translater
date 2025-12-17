
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
  Bars3BottomLeftIcon,
  KeyIcon
} from '@heroicons/react/24/outline';

// Full Language Set from user requirements
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

// Default: Generate ALL of them
const DEFAULT_GEN_LANGS = Object.keys(DEFAULT_LABELS);

// Updated Defaults to match user's wide table format
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

  const renderLangRow = (lang: string) => (
    <div key={lang} className="grid grid-cols-[100px_1fr] gap-3 items-start group border-b border-slate-50 last:border-0 pb-3 last:pb-0">
        <div className="flex flex-col items-start pt-2.5">
            <span className={`text-xs font-bold uppercase tracking-wider ${lang === 'en' ? 'text-indigo-600' : 'text-slate-600'}`}>
                {lang}
            </span>
            <span className="text-[10px] text-slate-400 font-medium leading-tight truncate w-full pr-2" title={getLangName(lang)}>
                {getLangName(lang)}
            </span>
        </div>
        <div className="relative flex gap-2">
            <textarea 
              value={entry.translations[lang] || ''}
              onChange={(e) => onUpdate(entry.id, `translations.${lang}`, e.target.value)}
              className={`w-full text-sm font-medium border rounded-md px-3 py-2 focus:ring-2 transition-shadow min-h-[42px] resize-y placeholder:text-slate-300 ${
                lang === 'en' 
                ? 'text-slate-900 border-indigo-200 bg-indigo-50/10 focus:ring-indigo-500/20 focus:border-indigo-500' 
                : 'text-slate-900 border-slate-200 bg-white focus:border-indigo-400 focus:ring-indigo-100'
              }`}
              rows={Math.max(1, Math.ceil((entry.translations[lang] || '').length / 50))}
              placeholder={lang === 'en' ? "English text..." : `Empty (${getLangName(lang)})`}
            />
            <button 
              onClick={() => handleRefine(lang)}
              disabled={!!refiningLang}
              className={`absolute right-2 top-2 p-1 rounded transition-colors disabled:opacity-50 ${
                lang === 'en' ? 'text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50' : 'text-slate-300 hover:text-indigo-600 hover:bg-white'
              }`}
              title={lang === 'en' ? "Polish English" : `Translate/Refine ${lang.toUpperCase()} using AI`}
            >
              <SparklesIcon className={`w-4 h-4 ${refiningLang === lang ? 'animate-pulse text-indigo-600' : ''}`} />
            </button>
        </div>
    </div>
  );

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
                  className="w-20 px-2 py-1 text-xs font-bold text-indigo-700 bg-white border border-indigo-100 rounded focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 uppercase text-center placeholder-indigo-200"
                  placeholder="CAT"
                />
             </div>
             <div className="flex flex-col">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5 ml-1">Key 2</label>
                <input 
                  value={entry.key2}
                  onChange={(e) => onUpdate(entry.id, 'key2', e.target.value.toUpperCase())}
                  className="w-32 px-2 py-1 text-xs font-bold text-purple-700 bg-white border border-purple-100 rounded focus:border-purple-500 focus:ring-1 focus:ring-purple-500 uppercase text-center placeholder-purple-200"
                  placeholder="SUB_CODE"
                />
             </div>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4">
            <button 
              onClick={() => onDelete(entry.id)}
              className="text-slate-400 hover:text-red-600 p-1.5 rounded-full hover:bg-red-50 transition-colors"
              title="Delete Entry"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
          {sortedLangs.map(lang => renderLangRow(lang))}
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
  const mappingColsCount = colMapping.split(',').filter(s => s.trim()).length;
  const headerColsCount = (sqlHeader.match(/\[.*?\]/g) || []).length;

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setSelectedImage(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !selectedImage) return;

    setIsGenerating(true);
    setError(null);

    try {
      const base64Data = selectedImage ? selectedImage.split(',')[1] : undefined;
      const result = await generateCmsEntry(inputText, genLanguages, base64Data);
      
      const newEntry: CmsEntry = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        ...result
      };

      setEntries(prev => [newEntry, ...prev]); 
      setInputText(''); 
      removeImage();
    } catch (err) {
      setError("Generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const updateEntry = (id: string, field: string, value: string) => {
    setEntries(prev => prev.map(e => {
      if (e.id !== id) return e;
      if (field.startsWith('translations.')) {
        const lang = field.split('.')[1];
        return {
          ...e,
          translations: { ...e.translations, [lang]: value }
        };
      }
      return { ...e, [field]: value };
    }));
  };

  const toggleGenLanguage = (code: string) => {
    setGenLanguages(prev => 
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const toggleAllLanguages = (enable: boolean) => {
      if (enable) setGenLanguages(Object.keys(languageLabels));
      else setGenLanguages(['en']);
  };

  const addCustomLanguageDefinition = () => {
      if (!newLangCode || !newLangLabel) return;
      const code = newLangCode.toLowerCase().trim();
      setCustomLabels(prev => ({ ...prev, [code]: newLangLabel }));
      if (!genLanguages.includes(code)) setGenLanguages(prev => [...prev, code]);
      setColMapping(prev => {
          const parts = prev.split(',').map(s => s.trim());
          return !parts.includes(code) ? prev.trim() + `, ${code}` : prev;
      });
      setSqlHeader(prev => {
        if (prev.toLowerCase().includes(`[${code}]`)) return prev;
        const regex = /\)(\s*VALUES)/i;
        return regex.test(prev) ? prev.replace(regex, `,[${code}])$1`) : prev;
      });
      setNewLangCode('');
      setNewLangLabel('');
  };

  const restoreDefaults = () => {
    if(confirm("Reset SQL Template and Languages to default?")) {
        setSqlHeader(DEFAULT_HEADER);
        setColMapping(DEFAULT_MAPPING);
        setGenLanguages(Object.keys(DEFAULT_LABELS));
    }
  };

  const deleteEntry = (id: string) => setEntries(prev => prev.filter(e => e.id !== id));
  const clearAll = () => { if (window.confirm("Clear all generated entries?")) setEntries([]); };
  const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);

  const getSqlOutput = () => {
    if (entries.length === 0) return "-- Enter text or upload an image to generate SQL INSERT statements.";
    const columns = colMapping.split(',').map(s => s.trim());
    const getRowValues = (entry: CmsEntry) => {
        return columns.map(col => {
            if (col === 'key1') return `'${entry.key1}'`;
            if (col === 'key2') return `'${entry.key2}'`;
            if (col === 'empty') return `''`; 
            if (col === 'guid') return `'${entry.id}'`;
            const val = entry.translations[col] || '';
            const safeVal = val.replace(/'/g, "''");
            const prefix = (col === 'en' || col === 'key1' || col === 'key2') ? '' : 'N'; 
            return `${prefix}'${safeVal}'`;
        });
    };

    if (sqlViewMode === 'compact') {
        const rows = entries.map(entry => {
          const values = getRowValues(entry);
          return `(${values.join(',')})`;
        });
        return `${sqlHeader}\n${rows.join(',\n')}`;
    }

    let output = `-- --------------------------------------------------------------------------------\n`;
    output += `-- SQL Generated by SQL Translator & Localizer\n`;
    output += `-- Generated: ${new Date().toLocaleString()}\n`;
    output += `-- --------------------------------------------------------------------------------\n`;
    output += `-- MAPPING: ${columns.join(', ')}\n`;
    output += `-- --------------------------------------------------------------------------------\n\n`;
    output += `${sqlHeader}\n`;
    const rows = entries.map((entry, index) => {
      const values = getRowValues(entry);
      const isLast = index === entries.length - 1;
      const commentLine = `\t-- Row ${index + 1}: [${entry.key1}][${entry.key2}] "${entry.translations.en?.substring(0, 50).replace(/\n/g, ' ')}..."`;
      const valuesLine = `\t(${values.join(', ')})`;
      return `${commentLine}\n${valuesLine}${isLast ? ';' : ','}`;
    });
    return output + rows.join('\n\n');
  };

  const mappingKeys = [...new Set([...Object.keys(languageLabels), 'key1', 'key2', 'empty', 'guid'])].sort();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-sm">
                  <LanguageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-sm font-bold text-slate-900 uppercase tracking-wide">SQL Translator & Localizer</h1>
                  <p className="text-[10px] text-slate-500 font-medium">Auto Key Generation & Localized SQL</p>
                </div>
            </div>
            <button 
                onClick={() => setShowConfig(!showConfig)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${showConfig ? 'bg-indigo-100 text-indigo-700 shadow-inner' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
                <Cog6ToothIcon className="w-4 h-4" />
                {showConfig ? 'Close Config' : 'Configure SQL'}
            </button>
        </div>
        
        {showConfig && (
            <div className="border-t border-slate-100 bg-slate-50/95 backdrop-blur-sm shadow-inner max-h-[80vh] overflow-y-auto">
                <div className="max-w-7xl mx-auto px-4 py-6 animate-in slide-in-from-top-2">
                    <div className="flex gap-4 border-b border-slate-200 mb-6">
                        <button onClick={() => setActiveTab('sql')} className={`pb-2 text-xs font-bold uppercase tracking-wide px-2 border-b-2 transition-colors ${activeTab === 'sql' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>SQL Structure</button>
                        <button onClick={() => setActiveTab('lang')} className={`pb-2 text-xs font-bold uppercase tracking-wide px-2 border-b-2 transition-colors ${activeTab === 'lang' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Languages</button>
                    </div>

                    {activeTab === 'sql' && (
                         <div className="space-y-6">
                            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                                <div className="flex">
                                    <InformationCircleIcon className="h-5 w-5 text-blue-400" />
                                    <div className="ml-3">
                                        <p className="text-xs text-blue-700 leading-relaxed">
                                            The <strong>Header</strong> sets the INSERT statement. <br/>
                                            The <strong>Mapping Order</strong> defines the variables that populate the <code>VALUES()</code> list.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">1. SQL Insert Header</label>
                                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-full border border-slate-200">Columns Detected: {headerColsCount}</span>
                                </div>
                                <textarea 
                                    value={sqlHeader}
                                    onChange={(e) => setSqlHeader(e.target.value)}
                                    className="w-full text-xs border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono bg-white p-3 min-h-[80px]"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">2. Variable Mapping Order</label>
                                    <span className={`text-[10px] px-2 py-1 rounded-full font-bold border ${mappingColsCount === 0 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-700 border-green-100'}`}>Mapped Values: {mappingColsCount}</span>
                                </div>
                                <textarea 
                                    value={colMapping}
                                    onChange={(e) => setColMapping(e.target.value)}
                                    className="w-full text-xs border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono bg-white p-3 min-h-[100px]"
                                />
                            </div>
                            
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                                <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Click to Add Variables to Mapping</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {mappingKeys.map(key => (
                                        <button key={key} onClick={() => setColMapping(prev => prev.trim() ? `${prev.trim()}, ${key}` : key)} className="px-2 py-1 bg-white hover:bg-indigo-50 hover:border-indigo-200 text-slate-600 rounded text-[10px] font-mono border border-slate-200 shadow-sm transition-colors">{key}</button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                 <button onClick={restoreDefaults} className="text-xs flex items-center gap-1 text-red-400 hover:text-red-600 font-medium">
                                    <ArrowUturnLeftIcon className="w-3 h-3" /> Reset to Defaults
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'lang' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                             <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2"><SwatchIcon className="w-4 h-4" /> Generation Target</label>
                                    <div className="flex gap-2">
                                        <button onClick={() => toggleAllLanguages(true)} className="text-[10px] bg-slate-100 px-2 py-1 rounded">All</button>
                                        <button onClick={() => toggleAllLanguages(false)} className="text-[10px] bg-slate-100 px-2 py-1 rounded">Min</button>
                                    </div>
                                </div>
                                <div className="bg-white border border-slate-200 rounded-lg p-4 h-64 overflow-y-auto grid grid-cols-2 gap-x-4 gap-y-2">
                                    {Object.entries(languageLabels).map(([code, label]) => (
                                        <label key={code} className="flex items-center gap-2 cursor-pointer group hover:bg-slate-50 rounded p-1">
                                            <input type="checkbox" checked={genLanguages.includes(code)} onChange={() => toggleGenLanguage(code)} disabled={code === 'en'} className="rounded border-slate-300 text-indigo-600" />
                                            <span className="text-xs font-mono font-bold uppercase w-6 text-slate-400">{code}</span>
                                            <span className="text-xs text-slate-600 truncate">{label}</span>
                                        </label>
                                    ))}
                                </div>
                             </div>

                             <div className="space-y-4">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2"><CodeBracketIcon className="w-4 h-4" /> Define Extra Language</label>
                                <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="col-span-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Code</label>
                                            <input value={newLangCode} onChange={e => setNewLangCode(e.target.value)} placeholder="de" className="w-full text-xs border-slate-200 rounded p-2" maxLength={5} />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Label</label>
                                            <input value={newLangLabel} onChange={e => setNewLangLabel(e.target.value)} placeholder="German" className="w-full text-xs border-slate-200 rounded p-2" />
                                        </div>
                                    </div>
                                    <button onClick={addCustomLanguageDefinition} disabled={!newLangCode || !newLangLabel} className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold py-2 rounded disabled:opacity-50">+ Add Custom Column</button>
                                </div>
                             </div>
                        </div>
                    )}
                </div>
            </div>
        )}
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 flex flex-col gap-8">
        <div className="max-w-3xl mx-auto w-full space-y-4">
            <form onSubmit={handleGenerate} className="relative group">
                <div className={`absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500 ${isGenerating ? 'opacity-50' : ''}`}></div>
                <div className="relative bg-white rounded-xl shadow-xl ring-1 ring-slate-900/5 overflow-hidden flex flex-col">
                  {selectedImage && (
                    <div className="px-6 pt-4 pb-2 border-b border-slate-100 bg-slate-50/50 flex items-start gap-4">
                        <div className="relative">
                            <img src={selectedImage} className="h-16 rounded border border-slate-200" />
                            <button onClick={removeImage} className="absolute -top-2 -right-2 bg-red-500 text-white p-0.5 rounded-full shadow hover:bg-red-600"><XMarkIcon className="w-3 h-3" /></button>
                        </div>
                        <div className="flex-1">
                            <p className="text-xs font-bold text-slate-700">Image Attached</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">AI will extract content and auto-assign Key 1 / Key 2.</p>
                        </div>
                    </div>
                  )}
                  <div className="flex items-center p-2">
                      <input
                          type="text"
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          placeholder={selectedImage ? "Describe context..." : "Enter text to localize (Any language)..."}
                          className="flex-1 border-0 text-slate-900 placeholder:text-slate-400 focus:ring-0 text-lg py-3 px-4 bg-transparent"
                          disabled={isGenerating}
                          autoFocus
                      />
                      <div className="flex items-center gap-2 pr-2">
                          <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                          <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 hover:text-indigo-600 rounded-full" disabled={isGenerating}><PhotoIcon className="w-6 h-6" /></button>
                          <div className="h-6 w-px bg-slate-200 mx-1"></div>
                          <button type="submit" disabled={isGenerating || (!inputText.trim() && !selectedImage)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium text-sm disabled:opacity-50 flex items-center gap-2">
                              {isGenerating ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : 'Generate SQL'}
                          </button>
                      </div>
                  </div>
                </div>
            </form>
            {error && <p className="text-center text-sm text-red-500 bg-red-50 py-2 rounded-lg border border-red-100">{error}</p>}
        </div>

        <div className="flex-1 flex flex-col lg:flex-row gap-8 min-h-0 items-start">
            <div className="w-full lg:w-5/12 xl:w-1/3 flex flex-col gap-4">
                <div className="flex justify-between items-end pb-2 border-b border-slate-200">
                    <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">Entries <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{entries.length}</span></h2>
                    {entries.length > 0 && <button onClick={clearAll} className="text-xs text-red-600 font-medium hover:bg-red-50 px-2 py-1 rounded">Clear All</button>}
                </div>
                <div className="flex flex-col gap-4">
                    {entries.length === 0 && (
                        <div className="py-16 px-6 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-200 flex items-center justify-center mb-4 mx-auto"><ArrowPathIcon className="w-6 h-6" /></div>
                            <p className="text-sm font-bold text-slate-700 uppercase tracking-wide">SQL Translator Ready</p>
                            <p className="text-xs text-slate-500 mt-1">Automatic Key 1 & Key 2 Generation</p>
                        </div>
                    )}
                    {entries.map((entry) => (
                      <EntryCard key={entry.id} entry={entry} languageLabels={languageLabels} sortOrder={mappingSortOrder} onDelete={deleteEntry} onUpdate={updateEntry} />
                    ))}
                </div>
            </div>

            <div className="w-full lg:w-7/12 xl:w-2/3 sticky top-24">
                <div className="bg-[#0f172a] rounded-xl shadow-2xl overflow-hidden flex flex-col h-[calc(100vh-140px)] min-h-[500px] border border-slate-800">
                    <div className="bg-[#1e293b] px-4 py-3 flex justify-between items-center border-b border-slate-700">
                        <div className="flex items-center gap-2 text-indigo-400 font-bold uppercase tracking-widest text-[10px]"><CodeBracketIcon className="w-4 h-4" /> Ready SQL Script</div>
                        <div className="flex items-center gap-2">
                             <div className="bg-slate-700 p-0.5 rounded-lg flex items-center">
                                <button onClick={() => setSqlViewMode('pretty')} className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all flex items-center gap-1 ${sqlViewMode === 'pretty' ? 'bg-indigo-500 text-white' : 'text-slate-400'}`}><Bars3BottomLeftIcon className="w-3 h-3" /> Annotated</button>
                                <button onClick={() => setSqlViewMode('compact')} className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all flex items-center gap-1 ${sqlViewMode === 'compact' ? 'bg-indigo-500 text-white' : 'text-slate-400'}`}><TableCellsIcon className="w-3 h-3" /> Compact</button>
                             </div>
                             <button onClick={() => copyToClipboard(getSqlOutput())} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded shadow-lg transition-all active:scale-95"><ClipboardDocumentIcon className="w-3.5 h-3.5" /> Copy SQL</button>
                        </div>
                    </div>
                    <div className="flex-1 relative">
                        <textarea ref={textareaRef} readOnly value={getSqlOutput()} className="w-full h-full bg-[#0f172a] text-slate-300 font-mono text-[11px] p-5 resize-none outline-none leading-relaxed" spellCheck={false} />
                    </div>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}
