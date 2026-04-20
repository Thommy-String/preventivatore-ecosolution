import React, { useRef, useCallback, useState, useEffect } from 'react';
import { Bold, Italic, Type, Palette, List, ListOrdered, Eraser } from 'lucide-react';

const FONT_SIZES = [
  { label: 'XS', value: '1' },
  { label: 'S', value: '2' },
  { label: 'M', value: '3' },
  { label: 'L', value: '4' },
  { label: 'XL', value: '5' },
];

const COLORS = [
  '#1d1d1f', '#636366', '#86868b', '#a1a1a6',
  '#007aff', '#34c759', '#ff9500', '#ff3b30',
  '#af52de', '#5856d6', '#ff2d55', '#00c7be',
];

const ALLOWED_TAGS = {
  'b': [], 'strong': [], 'i': [], 'em': [], 'u': [],
  'br': [], 'p': [], 'div': [],
  'ul': [], 'ol': [], 'li': [],
  'span': ['style'],
  'font': ['color', 'size'],
  'h3': [], 'h4': [],
};

function sanitizeHtml(dirtyHtml) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(dirtyHtml, 'text/html');

  function cleanNode(node) {
    if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(node.textContent);
    if (node.nodeType !== Node.ELEMENT_NODE) return null;

    const tagName = node.tagName.toLowerCase();
    const allowedAttrs = ALLOWED_TAGS[tagName];
    let el;

    if (allowedAttrs !== undefined) {
      if (tagName === 'h3' || tagName === 'h4') {
        el = document.createElement('p');
        const bold = document.createElement('b');
        for (const child of Array.from(node.childNodes)) {
          const cleaned = cleanNode(child);
          if (cleaned) bold.appendChild(cleaned);
        }
        el.appendChild(bold);
        return el;
      }

      el = document.createElement(tagName);
      for (const attr of allowedAttrs) {
        if (node.hasAttribute(attr)) {
          let val = node.getAttribute(attr);
          if (attr === 'style') {
            const kept = [];
            const colorMatch = val.match(/(?:^|;)\s*color\s*:\s*([^;]+)/i);
            const sizeMatch = val.match(/(?:^|;)\s*font-size\s*:\s*([^;]+)/i);
            if (colorMatch) kept.push('color:' + colorMatch[1].trim());
            if (sizeMatch) kept.push('font-size:' + sizeMatch[1].trim());
            val = kept.join(';');
            if (!val) continue;
          }
          el.setAttribute(attr, val);
        }
      }
    } else {
      el = document.createDocumentFragment();
    }

    for (const child of Array.from(node.childNodes)) {
      const cleaned = cleanNode(child);
      if (cleaned) el.appendChild(cleaned);
    }
    return el;
  }

  const container = document.createElement('div');
  for (const child of Array.from(doc.body.childNodes)) {
    const cleaned = cleanNode(child);
    if (cleaned) container.appendChild(cleaned);
  }
  return container.innerHTML;
}

export default function RichTextEditor({ value, onChange, placeholder }) {
  const editorRef = useRef(null);
  const [showColors, setShowColors] = useState(false);
  const [showSizes, setShowSizes] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);

  const isInitialized = useRef(false);
  const lastHtml = useRef(value || '');
  useEffect(() => {
    if (!isInitialized.current && editorRef.current) {
      const clean = value ? sanitizeHtml(value) : '';
      editorRef.current.innerHTML = clean;
      lastHtml.current = clean;
      isInitialized.current = true;
    }
  }, [value]);

  const emitChange = useCallback(() => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    if (html !== lastHtml.current) {
      lastHtml.current = html;
      onChange(html);
    }
  }, [onChange]);

  const updateToolbarState = useCallback(() => {
    setIsBold(document.queryCommandState('bold'));
    setIsItalic(document.queryCommandState('italic'));
  }, []);

  const exec = useCallback((cmd, val = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    emitChange();
    updateToolbarState();
  }, [emitChange, updateToolbarState]);

  const handleInput = useCallback(() => {
    emitChange();
    updateToolbarState();
  }, [emitChange, updateToolbarState]);

  const handlePaste = useCallback((e) => {
    e.preventDefault();
    const clipHtml = e.clipboardData.getData('text/html');
    const clipText = e.clipboardData.getData('text/plain');
    let clean;
    if (clipHtml) {
      clean = sanitizeHtml(clipHtml);
    } else {
      clean = clipText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
    }
    document.execCommand('insertHTML', false, clean);
    emitChange();
  }, [emitChange]);

  const clearFormatting = useCallback(() => {
    exec('removeFormat');
    exec('formatBlock', 'div');
  }, [exec]);

  const btnClass = (active) =>
    `p-1.5 rounded-md transition-all ${active
      ? 'bg-black text-white shadow-sm'
      : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
    }`;

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-colors">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-100 bg-gray-50/50 flex-wrap">
        <button type="button" onMouseDown={(e) => { e.preventDefault(); exec('bold'); }} className={btnClass(isBold)} title="Grassetto">
          <Bold size={14} />
        </button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); exec('italic'); }} className={btnClass(isItalic)} title="Corsivo">
          <Italic size={14} />
        </button>

        <div className="w-px h-5 bg-gray-200 mx-0.5" />

        <button type="button" onMouseDown={(e) => { e.preventDefault(); exec('insertUnorderedList'); }} className={btnClass(false)} title="Elenco puntato">
          <List size={14} />
        </button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); exec('insertOrderedList'); }} className={btnClass(false)} title="Elenco numerato">
          <ListOrdered size={14} />
        </button>

        <div className="w-px h-5 bg-gray-200 mx-0.5" />

        {/* Font Size */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); setShowSizes(s => !s); setShowColors(false); }}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-[11px] font-bold transition-all ${showSizes ? 'bg-black text-white' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}
            title="Dimensione"
          >
            <Type size={13} />
          </button>
          {showSizes && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 flex overflow-hidden">
              {FONT_SIZES.map(s => (
                <button
                  key={s.value}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    exec('fontSize', s.value);
                    setShowSizes(false);
                  }}
                  className="px-2.5 py-1.5 text-[11px] font-bold text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Color */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); setShowColors(c => !c); setShowSizes(false); }}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-[11px] font-bold transition-all ${showColors ? 'bg-black text-white' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}
            title="Colore"
          >
            <Palette size={13} />
          </button>
          {showColors && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-2 grid grid-cols-4 gap-1.5 w-[130px]">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    exec('foreColor', c);
                    setShowColors(false);
                  }}
                  className="w-6 h-6 rounded-full border-2 border-white shadow-sm hover:scale-125 transition-transform"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-gray-200 mx-0.5" />

        <button type="button" onMouseDown={(e) => { e.preventDefault(); clearFormatting(); }} className={btnClass(false)} title="Rimuovi formattazione">
          <Eraser size={14} />
        </button>
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyUp={updateToolbarState}
        onMouseUp={updateToolbarState}
        onPaste={handlePaste}
        onBlur={emitChange}
        data-placeholder={placeholder || 'Descrizione...'}
        className="px-3 py-2 text-sm text-gray-900 min-h-[80px] max-h-[300px] overflow-y-auto outline-none leading-relaxed [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-gray-400 [&:empty]:before:pointer-events-none [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:my-1 [&_ol]:list-decimal [&_ol]:ml-5 [&_ol]:my-1 [&_li]:py-0.5 [&_p]:my-1 [&_b]:font-bold [&_strong]:font-bold"
        style={{ wordBreak: 'break-word' }}
      />
    </div>
  );
}
