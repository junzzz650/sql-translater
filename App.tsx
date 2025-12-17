import React, { useState, useRef } from 'react';
import { 
  ArrowPathIcon, 
  TrashIcon, 
  Cog6ToothIcon, 
  LanguageIcon, 
  PhotoIcon, 
  XMarkIcon, 
  SparklesIcon 
} from '@heroicons/react/24/outline';
import { CmsEntry } from './types';

const DEFAULT_LABELS: Record<string, string> = {
  en: "English", cn: "Simplified Chinese", kh: "Khmer", id: "Indonesian", 
  vn: "Vietnamese", th: "Thai", my: "Malay", lo: "Lao", hk: "Trad. Chinese (HK)",
  ar: "Arabic", fr: "French", ja: "Japanese", es: "Spanish", pt: "Portuguese",
  tr: "Turkish", ru: "Russian", kr: "Korean", mm: "Burmese", hi: "Hindi",
  mn: "Mongolian", ph: "Filipino", bd: "Bengali", ne: "Nepali", pk: "Urdu",
};

const DEFAULT_GEN_LANGS = Object.keys(DEFAULT_LABELS);
const DEFAULT_HEADER = "INSERT INTO [dbo].[BackOffice]([key1],[key2],[en],[cn],[kh],[id],[vn]) VALUES";
const DEFAULT_MAPPING = "key1, key2, en, cn, kh, id, vn";

const EntryCard = ({ entry, languageLabels, onDelete, onUpdate }: any) => {
  const [refiningLang, setRefiningLang] = useState<string | null>(null);
  const langs = Object.keys(entry.translations).sort();

  const handleRefine = async (lang: string) => {
    setRefiningLang(lang);
    try {
      const res = await fetch('/.netlify/functions/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'refine', 
          lang, 
          text: entry.translations[lang],
          context: entry.translations.en 
        })
      });
      const data = await res.json();
      onUpdate(entry.id, `translations.${lang}`, data.text);
    } catch (e) {
      console.error(e);
    } finally {
      setRefiningLang(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-4">
      <div className="bg-slate-50 px-4 py-3 border-b flex justify-between items-center">
        <div className="flex gap-2">
          <input 
            value={entry.key1} 
            onChange={e => onUpdate(entry.id, 'key1', e.target.value.toUpperCase())}
            className="w-24 px-2 py-1 text-xs font-bold border rounded bg-white uppercase text-indigo-600"
          />
          <input 
            value={entry.key2} 
            onChange={e => onUpdate(entry.id, 'key2', e.target.value.toUpperCase())}
            className="w-32 px-2 py-1 text-xs font-bold border rounded bg-white uppercase text-purple-600"
          />
        </div>
        <button onClick={() => onDelete(entry.id)} className="text-slate-400 hover:text-red-500">
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
      <div className="p-4 space-y-3">
        {langs.map(lang => (
          <div key={lang} className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase">{lang} - {languageLabels[lang]}</span>
              <button onClick={() => handleRefine(lang)} className="text-slate-300 hover:text-indigo-600">
                <SparklesIcon className={`w-3.5 h-3.5 ${refiningLang === lang ? 'animate-spin text-indigo-600' : ''}`} />
              </button>
            </div>
            <textarea 
              value={entry.translations[lang]} 
              onChange={e => onUpdate(entry.id, `translations.${lang}`, e.target.value)}
              className="w-full text-sm border rounded-md px-3 py-1.5 bg-slate-50/30 focus:bg-white transition-colors"
              rows={1}
            />
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
  const [showConfig, setShowConfig] = useState(false);
  const [sqlHeader, setSqlHeader] = useState(DEFAULT_HEADER);
  const [colMapping, setColMapping] = useState(DEFAULT_MAPPING);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText && !selectedImage) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/.netlify/functions/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'generate', 
          text: inputText, 
          image: selectedImage?.split(',')[1],
          langs: DEFAULT_GEN_LANGS.slice(0, 7)
        })
      });
      const data = await res.json();
      setEntries([{ id: crypto.randomUUID(), timestamp: Date.now(), ...data }, ...entries]);
      setInputText('');
      setSelectedImage(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const updateEntry = (id: string, field: string, value: string) => {
    setEntries(prev => prev.map(e => {
      if (e.id !== id) return e;
      if (field.startsWith('translations.')) {
        const lang = field.split('.')[1];
        return { ...e, translations: { ...e.translations, [lang]: value } };
      }
      return { ...e, [field as keyof CmsEntry] : value } as any;
    }));
  };

  const getSqlOutput = () => {
    if (entries.length === 0) return "-- No entries generated";
    const cols = colMapping.split(',').map(s => s.trim());
    const rows = entries.map(e => {
      const vals = cols.map(c => {
        if (c === 'key1') return `'${e.key1}'`;
        if (c === 'key2') return `'${e.key2}'`;
        const v = (e.translations[c] || '').replace(/'/g, "''");
        return c === 'en' ? `'${v}'` : `N'${v}'`;
      });
      return `(${vals.join(',')})`;
    });
    return `${sqlHeader}\n${rows.join(',\n')};`;
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white border-b h-16 flex items-center px-6 justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-1.5 rounded-lg text-white shadow-md">
            <LanguageIcon className="w-5 h-5" />
          </div>
          <h1 className="font-bold text-sm tracking-tight uppercase text-slate-800">iGaming SQL Localizer</h1>
        </div>
        <button onClick={() => setShowConfig(!showConfig)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
          <Cog6ToothIcon className="w-5 h-5" />
        </button>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5">
          <form onSubmit={handleGenerate} className="bg-white p-4 rounded-xl shadow-lg border border-slate-200 mb-8">
            {selectedImage && (
              <div className="mb-4 relative inline-block group">
                <img src={selectedImage} className="h-24 rounded border-2 border-indigo-100" />
                <button onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:scale-110 transition-transform">
                  <XMarkIcon className="w-3 h-3"/>
                </button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <input 
                value={inputText} 
                onChange={e => setInputText(e.target.value)} 
                placeholder="Paste UI text or describe entry..." 
                className="flex-1 bg-transparent outline-none text-sm px-2 py-1"
                disabled={isGenerating}
              />
              <input type="file" ref={fileInputRef} className="hidden" onChange={e => {
                const f = e.target.files?.[0];
                if(f) { const r = new FileReader(); r.onload = () => setSelectedImage(r.result as string); r.readAsDataURL(f); }
              }} />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                <PhotoIcon className="w-5 h-5"/>
              </button>
              <button disabled={isGenerating || (!inputText && !selectedImage)} className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-bold text-xs shadow-indigo-200 shadow-lg disabled:opacity-50 transition-all hover:bg-indigo-700">
                {isGenerating ? <ArrowPathIcon className="w-4 h-4 animate-spin"/> : 'GENERATE'}
              </button>
            </div>
          </form>

          <div className="space-y-4">
            {entries.length === 0 && (
              <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-sm">
                Generated entries will appear here
              </div>
            )}
            {entries.map(e => (
              <EntryCard 
                key={e.id} 
                entry={e} 
                languageLabels={DEFAULT_LABELS} 
                onDelete={(id: string) => setEntries(entries.filter(x => x.id !== id))}
                onUpdate={updateEntry}
              />
            ))}
          </div>
        </div>

        <div className="lg:col-span-7 lg:sticky lg:top-24 h-fit">
          <div className="bg-[#1e293b] rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
            <div className="bg-[#334155] px-5 py-3 flex justify-between items-center">
              <span className="text-indigo-300 text-[10px] font-bold uppercase tracking-widest">PostgreSQL / SQL Server</span>
              <button onClick={() => navigator.clipboard.writeText(getSqlOutput())} className="bg-indigo-500 hover:bg-indigo-400 text-white px-4 py-1 rounded-md text-[10px] font-bold uppercase transition-colors">Copy to Clipboard</button>
            </div>
            <textarea 
              readOnly 
              value={getSqlOutput()} 
              className="w-full bg-transparent text-slate-300 font-mono text-xs p-6 outline-none min-h-[500px] resize-none leading-relaxed"
            />
          </div>
        </div>
      </main>
    </div>
  );
}