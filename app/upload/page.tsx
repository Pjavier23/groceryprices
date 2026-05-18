"use client"

import { useState, useRef } from "react"
import { extractReceiptText, extractPDFText } from "@/lib/ocr"
import type { ReceiptParseResult } from "@/lib/ocr"
import { CameraIcon, UploadIcon, ReceiptIcon, StoreIcon, CalendarIcon, DollarIcon, SearchIcon, ZapIcon } from "@/lib/icons"

export default function UploadPage() {
  const [dragging, setDragging] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<ReceiptParseResult | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    const reader = new FileReader()
    reader.onload = e => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)
    
    setProcessing(true)
    setResult(null)
    setSaved(false)
    
    try {
      const buffer = await file.arrayBuffer()
      const isPDF = file.type === 'application/pdf' || file.name.endsWith('.pdf')
      
      let parsed: ReceiptParseResult
      if (isPDF) {
        parsed = await extractPDFText(Buffer.from(buffer))
      } else {
        parsed = await extractReceiptText(Buffer.from(buffer))
      }
      
      setResult(parsed)
    } catch (err) {
      console.error('OCR failed:', err)
      setResult({
        store: undefined,
        date: undefined,
        total: undefined,
        items: [],
        raw_text: 'Failed to process receipt. Try a clearer photo.',
      })
    }
    
    setProcessing(false)
  }

  const saveToDatabase = async () => {
    if (!result || !result.store || result.items.length === 0) return
    setSaving(true)
    try {
      const res = await fetch('/api/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store: result.store,
          date: result.date,
          total: result.total,
          items: result.items,
          raw_text: result.raw_text,
        }),
      })
      if (res.ok) setSaved(true)
    } catch (err) {
      console.error('Save failed:', err)
    }
    setSaving(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/15 flex items-center justify-center">
          <CameraIcon size={22} className="text-cyan-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Scan a Receipt</h1>
          <p className="text-slate-400 text-sm mt-0.5">Upload a receipt photo or PDF — OCR extracts items & prices automatically</p>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        className={`upload-zone mb-8 ${dragging ? 'dragover' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        
        {processing ? (
          <div className="py-12">
            <div className="w-14 h-14 mx-auto mb-5 relative">
              <div className="absolute inset-0 rounded-full border-2 border-cyan-400/30" />
              <div className="absolute inset-0 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
              <div className="absolute inset-2 rounded-full bg-cyan-500/5 flex items-center justify-center">
                <ZapIcon size={18} className="text-cyan-400" />
              </div>
            </div>
            <p className="text-slate-400 text-sm font-medium">Extracting items from your receipt...</p>
            <p className="text-slate-600 text-xs mt-1">This takes a few seconds</p>
          </div>
        ) : preview ? (
          <div className="relative group">
            <img src={preview} alt="Receipt preview" className="max-h-72 mx-auto rounded-xl shadow-2xl" />
            <button
              onClick={e => { e.stopPropagation(); setPreview(null); setResult(null); setSaved(false) }}
              className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-sm text-white p-2 rounded-xl text-sm hover:bg-slate-800 transition-all opacity-0 group-hover:opacity-100"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="py-12">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/5 border border-cyan-500/10 mx-auto mb-5 flex items-center justify-center">
              <UploadIcon size={28} className="text-cyan-400" />
            </div>
            <p className="text-lg font-medium text-white mb-1">Drop your receipt here</p>
            <p className="text-slate-500 text-sm">or click to browse files</p>
            <div className="flex items-center justify-center gap-4 mt-4 text-xs text-slate-600">
              <span className="flex items-center gap-1.5"><CameraIcon size={12} /> JPG</span>
              <span className="flex items-center gap-1.5"><CameraIcon size={12} /> PNG</span>
              <span className="flex items-center gap-1.5"><ReceiptIcon size={12} /> PDF</span>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-5 animate-fade-in">
          {/* Summary */}
          <div className="gradient-card p-6">
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/15 mx-auto mb-2 flex items-center justify-center">
                  <StoreIcon size={16} className="text-cyan-400" />
                </div>
                <div className="text-xs text-slate-500 mb-1">Store</div>
                <div className="font-semibold text-white text-sm">{result.store || 'Unknown'}</div>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/15 mx-auto mb-2 flex items-center justify-center">
                  <CalendarIcon size={16} className="text-blue-400" />
                </div>
                <div className="text-xs text-slate-500 mb-1">Date</div>
                <div className="font-semibold text-white text-sm">{result.date || 'Unknown'}</div>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/15 mx-auto mb-2 flex items-center justify-center">
                  <DollarIcon size={16} className="text-green-400" />
                </div>
                <div className="text-xs text-slate-500 mb-1">Total</div>
                <div className="font-semibold text-cyan-400 text-lg">
                  {result.total ? `$${result.total.toFixed(2)}` : 'Unknown'}
                </div>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="gradient-card overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ReceiptIcon size={16} className="text-cyan-400" />
                <h3 className="font-semibold text-white">Items ({result.items.length})</h3>
              </div>
              {result.store && !saved && (
                <button
                  onClick={saveToDatabase}
                  disabled={saving}
                  className="text-xs px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/20 transition-all disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save to DB'}
                </button>
              )}
              {saved && (
                <span className="text-xs text-green-400 flex items-center gap-1">
                  ✓ Saved to database
                </span>
              )}
            </div>
            {result.items.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                <div className="w-12 h-12 rounded-xl bg-slate-800/50 mx-auto mb-3 flex items-center justify-center">
                  <SearchIcon size={20} className="text-slate-600" />
                </div>
                No items could be extracted. Try a clearer photo.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/20">
                {result.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between px-6 py-3 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-800/50 text-xs text-slate-500 flex items-center justify-center font-mono">
                        {i + 1}
                      </span>
                      <span className="text-white text-sm">{item.name}</span>
                    </div>
                    <span className="text-cyan-400 font-semibold text-sm font-mono">${item.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Raw Text */}
          <details className="gradient-card p-5 group">
            <summary className="text-sm text-slate-400 cursor-pointer hover:text-white transition-colors flex items-center gap-2">
              <ReceiptIcon size={14} />
              Raw OCR Text
            </summary>
            <pre className="mt-4 text-xs text-slate-500 whitespace-pre-wrap font-mono max-h-48 overflow-y-auto p-4 rounded-xl bg-slate-900/50 border border-slate-800/30">
              {result.raw_text}
            </pre>
          </details>

          {/* Add to comparison CTA */}
          {result.items.length > 0 && result.store && (
            <button className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-green-500/10 border border-cyan-500/20 text-white font-semibold hover:from-cyan-500/20 hover:to-green-500/20 transition-all text-sm flex items-center justify-center gap-2">
              <DollarIcon size={16} className="text-cyan-400" />
              Compare These Prices Across Stores
            </button>
          )}
        </div>
      )}
    </div>
  )
}
