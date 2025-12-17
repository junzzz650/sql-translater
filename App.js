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

const DEFAULT_LABELS = {
  en: "English", cn: "Simplified Chinese", kh: "Khmer", id: "Indonesian", 
  vn: "Vietnamese", th: "Thai", my: "Malay", lo: "Lao", hk: "Trad. Chinese (HK)",
  ar: "Arabic", fr: "French", ja: "Japanese", es: "Spanish", pt: "Portuguese",
  tr: "Turkish", ru: "Russian", kr: "Korean", mm: "Burmese", hi: "Hindi"
};

const DEFAULT_GEN_LANGS = Object.keys(DEFAULT_LABELS);
const DEFAULT_HEADER = "INSERT INTO [dbo].[BackOffice]([key1],[key2],[en],[cn],[kh],[id],[vn]) VALUES";
const DEFAULT_MAPPING = "key1, key2, en, cn, kh, id, vn";

const EntryCard = ({ entry, languageLabels, sortOrder, onDelete, onUpdate }) => {
  const [refiningLang, setRefiningLang] = useState(null);
  const langs = Object.keys(entry.translations).sort();

  const handleRefine = async (lang) => {
    setRefiningLang(lang);
    try {
      const res = await fetch('/.netlify/functions/gemini', {
        method: 'POST',
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
      <div className="bg-slate-50 px-4 py-2 border-b flex justify-between items-center">
        <div className="flex gap-2">
          <input 
            value={entry.key1} 
            onChange={e => onUpdate(entry.id, 'key1', e.target.value.toUpperCase())}
            className="w-20 px-2 py-1 text-xs font-bold border rounded bg-white uppercase"
          />
          <input 
            value={entry.key2} 
            onChange={e => onUpdate(entry.id, 'key2', e.target.value.toUpperCase())}
            className="w-32 px-2 py-1 text-xs font-bold border rounded bg-white uppercase"
          />
        </div>
        <button onClick={() => onDelete(entry.id)} className="text-slate-400 hover:text-red-500">
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
      <div className="p-4 space-y-2">
        {langs.map(lang => (
          <div key={lang} className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase">{lang} - {languageLabels[lang]}</span>
              <button onClick={() => handleRefine(lang)} className="text-slate-300 hover:text-indigo-600">
                <SparklesIcon className={`w-3 h-3 ${refiningLang === lang ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <textarea 
              value={entry.translations[lang]} 
              onChange={e => onUpdate(entry.id, `translations.${lang}`, e.target.value)}
              className="w-full text-sm border rounded px-2 py-1 bg-slate-50/30"
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
  const [selectedImage, setSelectedImage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [entries, setEntries] = useState([]);
  const [showConfig, setShowConfig] = useState(false);
  const [sqlHeader, setSqlHeader] = useState(DEFAULT_HEADER);
  const [colMapping, setColMapping] = useState(DEFAULT_MAPPING);
  const fileInputRef = useRef(null);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!inputText && !selectedImage) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/.netlify/functions/gemini', {
        method: 'POST',
        body: JSON.stringify({ 
          action: 'generate', 
          text: inputText, 
          image: selectedImage?.split(',')[1],
          langs: DEFAULT_GEN_LANGS.slice(0, 7) // Sample slice
        })
      });
      const data = await res.json();
      setEntries([{ id: crypto.randomUUID(), ...data }, ...entries]);
      setInputText('');
      setSelectedImage(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const updateEntry = (id, field, value) => {
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
    if (entries.length === 0) return "-- No entries";
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
      <header className="bg-white border-b h-16 flex items-center px-6 justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-1.5 rounded text-white"><LanguageIcon className="w-5 h-5" /></div>
          <h1 className="font-bold text-sm tracking-tight uppercase">SQL Translator</h1>
        </div>
        <button onClick={() => setShowConfig(!showConfig)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full">
          <Cog6ToothIcon className="w-5 h-5" />
        </button>
      </header>

      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <form onSubmit={handleGenerate} className="bg-white p-4 rounded-xl shadow-sm border mb-6">
            {selectedImage && (
              <div className="mb-4 relative inline-block">
                <img src={selectedImage} className="h-20 rounded border" />
                <button onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"><XMarkIcon className="w-3 h-3"/></button>
              </div>
            )}
            <div className="flex gap-2">
              <input 
                value={inputText} 
                onChange={e => setInputText(e.target.value)} 
                placeholder="Entry description or text..." 
                className="flex-1 bg-transparent outline-none text-sm"
              />
              <input type="file" ref={fileInputRef} className="hidden" onChange={e => {
                const f = e.target.files[0];
                if(f) { const r = new FileReader(); r.onload = () => setSelectedImage(r.result); r.readAsDataURL(f); }
              }} />
              <button type="button" onClick={() => fileInputRef.current.click()} className="p-2 text-slate-400"><PhotoIcon className="w-5 h-5"/></button>
              <button disabled={isGenerating} className="bg-indigo-600 text-white px-4 py-1.5 rounded font-bold text-xs">
                {isGenerating ? <ArrowPathIcon className="w-4 h-4 animate-spin"/> : 'GENERATE'}
              </button>
            </div>
          </form>

          {entries.map(e => (
            <EntryCard 
              key={e.id} 
              entry={e} 
              languageLabels={DEFAULT_LABELS} 
              onDelete={id => setEntries(entries.filter(x => x.id !== id))}
              onUpdate={updateEntry}
            />
          ))}
        </div>

        <div className="lg:sticky lg:top-24 h-fit">
          <div className="bg-slate-900 rounded-xl overflow-hidden shadow-xl border border-slate-800">
            <div className="bg-slate-800 px-4 py-2 flex justify-between items-center">
              <span className="text-indigo-400 text-[10px] font-bold uppercase tracking-widest">SQL OUTPUT</span>
              <button onClick={() => navigator.clipboard.writeText(getSqlOutput())} className="text-white bg-indigo-600 px-3 py-1 rounded text-[10px] font-bold uppercase">Copy</button>
            </div>
            <textarea 
              readOnly 
              value={getSqlOutput()} 
              className="w-full bg-transparent text-slate-300 font-mono text-xs p-4 outline-none min-h-[400px]"
            />
          </div>
        </div>
      </main>
    </div>
  );
}