"use client"

import { useState, useRef } from "react"
import { extractReceiptText, extractPDFText } from "@/lib/ocr"
import type { ReceiptItem, ReceiptParseResult } from "@/lib/ocr"

export default function UploadPage() {
  const [dragging, setDragging] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<ReceiptParseResult | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    // Preview
    const reader = new FileReader()
    reader.onload = e => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)
    
    setProcessing(true)
    setResult(null)
    
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-1">Scan a Receipt</h1>
      <p className="text-slate-400 text-sm mb-6">
        Upload a receipt photo or PDF and we&apos;ll extract items &amp; prices automatically.
      </p>

      {/* Upload zone */}
      <div
        className={`upload-zone mb-6 ${dragging ? 'dragover' : ''}`}
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
          <div className="py-8">
            <div className="w-12 h-12 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Extracting items from your receipt...</p>
          </div>
        ) : preview ? (
          <div className="relative">
            <img src={preview} alt="Receipt preview" className="max-h-64 mx-auto rounded-lg" />
            <button
              onClick={e => { e.stopPropagation(); setPreview(null); setResult(null) }}
              className="absolute top-2 right-2 bg-slate-900/80 text-white p-1.5 rounded-lg text-sm hover:bg-slate-800"
            >
              ✕
            </button>
          </div>
        ) : (
          <>
            <div className="text-5xl mb-3">🧾</div>
            <p className="text-white font-medium mb-1">Drop your receipt here</p>
            <p className="text-slate-500 text-sm">or click to browse</p>
            <p className="text-slate-600 text-xs mt-2">Supports JPG, PNG, PDF</p>
          </>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4 animate-fade-in">
          {/* Store + Date + Total */}
          <div className="gradient-card p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xs text-slate-500 mb-1">Store</div>
                <div className="font-semibold text-white">{result.store || 'Unknown'}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Date</div>
                <div className="font-semibold text-white">{result.date || 'Unknown'}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Total</div>
                <div className="font-semibold text-cyan-400">{result.total ? `$${result.total.toFixed(2)}` : 'Unknown'}</div>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="gradient-card overflow-hidden">
            <div className="p-4 border-b border-slate-800/50">
              <h3 className="font-semibold text-white">Items ({result.items.length})</h3>
            </div>
            {result.items.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm">
                No items could be extracted. Try a clearer photo.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/30">
                {result.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-800/30 transition-colors">
                    <span className="text-white text-sm">{item.name}</span>
                    <span className="text-cyan-400 font-semibold text-sm">${item.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Raw text */}
          <details className="gradient-card p-4">
            <summary className="text-sm text-slate-400 cursor-pointer hover:text-white transition-colors">
              Raw OCR Text
            </summary>
            <pre className="mt-3 text-xs text-slate-500 whitespace-pre-wrap font-mono max-h-60 overflow-y-auto">
              {result.raw_text}
            </pre>
          </details>

          {/* Add to comparison */}
          {result.items.length > 0 && result.store && (
            <button className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-semibold hover:from-cyan-400 hover:to-cyan-500 transition-all">
              + Add to Price Database
            </button>
          )}
        </div>
      )}
    </div>
  )
}
