'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useMutation } from '@tanstack/react-query'
import {
    Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertTriangle,
    Download, X, ArrowLeft, Info,
} from 'lucide-react'
import toast from 'react-hot-toast'

import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'

interface UploadResult {
    created_count: number
    error_count: number
    errors: { row: number; error: string }[]
}

export default function BulkProductUploadPage() {
    const [file, setFile] = useState<File | null>(null)
    const [dragActive, setDragActive] = useState(false)
    const [result, setResult] = useState<UploadResult | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const uploadMutation = useMutation({
        mutationFn: async (csvFile: File) => {
            const formData = new FormData()
            formData.append('file', csvFile)
            const res = await api.post('/seller/products/bulk-upload/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
            return res.data?.data as UploadResult
        },
        onSuccess: (data) => {
            setResult(data)
            if (data.created_count > 0) {
                toast.success(`${data.created_count} products created!`)
            }
            if (data.error_count > 0) {
                toast.error(`${data.error_count} rows had errors`)
            }
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'Upload failed')
        },
    })

    const handleUpload = () => {
        if (!file) return
        setResult(null)
        uploadMutation.mutate(file)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setDragActive(false)
        const dropped = e.dataTransfer.files[0]
        if (dropped && dropped.name.endsWith('.csv')) {
            setFile(dropped)
            setResult(null)
        } else {
            toast.error('Only .csv files are accepted')
        }
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0]
        if (selected) {
            setFile(selected)
            setResult(null)
        }
    }

    const downloadTemplate = () => {
        window.open(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/seller/products/bulk-upload/`,
            '_blank'
        )
    }

    return (
        <div className="space-y-6 max-w-3xl">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Link href="/seller/products" className="text-gray-400 hover:text-gray-600 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Upload className="w-5 h-5 text-[#4C3B8A]" />
                        Bulk Product Upload
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Upload a CSV file to add multiple products at once
                    </p>
                </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-4">
                <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                    <div className="text-xs text-blue-700 space-y-1">
                        <p className="font-semibold text-sm text-blue-800">CSV Format Requirements</p>
                        <ul className="list-disc list-inside space-y-0.5 text-blue-600">
                            <li><strong>Required columns:</strong> name, description, base_price, stock_quantity</li>
                            <li><strong>Optional columns:</strong> discount_price, sku, category_slug, tags</li>
                            <li>Tags should be comma-separated within quotes (e.g., &quot;laptop,gaming&quot;)</li>
                            <li>Maximum 200 products per upload, file size limit 5MB</li>
                            <li>UTF-8 encoding required</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Download Template */}
            <Button
                variant="outline"
                size="sm"
                onClick={downloadTemplate}
                className="gap-2 border-gray-200"
            >
                <Download className="w-4 h-4" />
                Download CSV Template
            </Button>

            {/* Upload Zone */}
            <div
                onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                    dragActive
                        ? 'border-[#4C3B8A] bg-purple-50/50'
                        : file
                            ? 'border-emerald-300 bg-emerald-50/30'
                            : 'border-gray-200 bg-gray-50/50 hover:border-gray-300 hover:bg-gray-50'
                }`}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleFileSelect}
                />

                {file ? (
                    <div className="space-y-2">
                        <FileSpreadsheet className="w-10 h-10 text-emerald-500 mx-auto" />
                        <p className="text-sm font-medium text-gray-900">{file.name}</p>
                        <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                        <button
                            onClick={(e) => { e.stopPropagation(); setFile(null); setResult(null) }}
                            className="text-xs text-red-500 hover:text-red-700 underline"
                        >
                            Remove file
                        </button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <Upload className={`w-10 h-10 mx-auto ${dragActive ? 'text-[#4C3B8A]' : 'text-gray-300'}`} />
                        <p className="text-sm font-medium text-gray-600">
                            Drag & drop your CSV file here
                        </p>
                        <p className="text-xs text-gray-400">or click to browse files</p>
                    </div>
                )}
            </div>

            {/* Upload Button */}
            {file && !result && (
                <Button
                    onClick={handleUpload}
                    disabled={uploadMutation.isPending}
                    className="w-full bg-[#4C3B8A] hover:bg-[#3d2f6e] text-white gap-2"
                >
                    {uploadMutation.isPending ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Processing CSV...
                        </>
                    ) : (
                        <>
                            <Upload className="w-4 h-4" />
                            Upload & Create Products
                        </>
                    )}
                </Button>
            )}

            {/* Results */}
            {result && (
                <div className="space-y-4">
                    {/* Success summary */}
                    <div className={`rounded-xl border p-4 flex items-center gap-3 ${
                        result.created_count > 0
                            ? 'bg-emerald-50 border-emerald-200'
                            : 'bg-amber-50 border-amber-200'
                    }`}>
                        {result.created_count > 0 ? (
                            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                        ) : (
                            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
                        )}
                        <div>
                            <p className="font-semibold text-gray-900">
                                {result.created_count} product{result.created_count !== 1 ? 's' : ''} created successfully
                            </p>
                            {result.error_count > 0 && (
                                <p className="text-sm text-gray-600">
                                    {result.error_count} row{result.error_count !== 1 ? 's' : ''} had errors
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Error details */}
                    {result.errors.length > 0 && (
                        <div className="bg-white rounded-xl border border-red-100 overflow-hidden">
                            <div className="px-4 py-3 border-b border-red-100 bg-red-50/50 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-red-500" />
                                <span className="text-sm font-semibold text-red-700">Row Errors</span>
                            </div>
                            <div className="divide-y divide-gray-50 max-h-60 overflow-y-auto">
                                {result.errors.map((err, idx) => (
                                    <div key={idx} className="px-4 py-2 flex items-center gap-3 text-sm">
                                        <span className="text-xs font-mono text-gray-400 shrink-0">
                                            Row {err.row}
                                        </span>
                                        <span className="text-red-600">{err.error}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => { setFile(null); setResult(null) }}
                            className="gap-2 border-gray-200"
                        >
                            <Upload className="w-4 h-4" />
                            Upload Another
                        </Button>
                        <Link href="/seller/products">
                            <Button className="gap-2 bg-[#4C3B8A] hover:bg-[#3d2f6e] text-white">
                                View Products
                            </Button>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    )
}
