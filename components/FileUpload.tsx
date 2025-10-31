'use client'

import { useState } from 'react'
import { Upload, X, FileCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface FileUploadProps {
  bucketName: string
  folderPath: string
  onFileUploaded: (fileName: string, filePath: string) => void
  maxFileSize?: number // bytes
  acceptedFormats?: string[]
}

export function FileUpload({
  bucketName,
  folderPath,
  onFileUploaded,
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  acceptedFormats = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg'],
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; path: string }[]>([])
  const supabase = createClient()

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setError(null)
    setUploading(true)

    try {
      for (const file of Array.from(files)) {
        // Validate file size
        if (file.size > maxFileSize) {
          throw new Error(`Arquivo ${file.name} excede o tamanho máximo de ${maxFileSize / 1024 / 1024}MB`)
        }

        // Validate file format
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
        if (!acceptedFormats.includes(fileExtension)) {
          throw new Error(`Formato ${fileExtension} não permitido`)
        }

        // Upload to Supabase
        const timestamp = Date.now()
        const fileName = `${timestamp}_${file.name}`
        const filePath = `${folderPath}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(filePath, file)

        if (uploadError) throw uploadError

        setUploadedFiles((prev) => [...prev, { name: file.name, path: filePath }])
        onFileUploaded(file.name, filePath)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao fazer upload'
      setError(message)
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  const handleRemoveFile = async (filePath: string, index: number) => {
    try {
      const { error: deleteError } = await supabase.storage
        .from(bucketName)
        .remove([filePath])

      if (deleteError) throw deleteError

      setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao remover arquivo'
      setError(message)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block text-slate-300 text-sm font-medium">
          <div className="flex items-center gap-2 mb-2">
            <Upload size={16} />
            <span>Upload de Arquivos</span>
          </div>
        </label>

        <div className="relative">
          <input
            type="file"
            multiple
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
            id="file-upload"
            accept={acceptedFormats.join(',')}
          />

          <label
            htmlFor="file-upload"
            className={`block p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
              uploading
                ? 'border-slate-600 bg-slate-800 opacity-50'
                : 'border-blue-500 bg-slate-800 hover:bg-slate-700'
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <Upload size={24} className="text-blue-400" />
              <span className="text-slate-300 text-sm">
                {uploading ? 'Enviando...' : 'Clique ou arraste arquivos aqui'}
              </span>
              <span className="text-slate-500 text-xs">
                Máximo {maxFileSize / 1024 / 1024}MB - {acceptedFormats.join(', ')}
              </span>
            </div>
          </label>
        </div>

        {error && (
          <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}
      </div>

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-slate-300 text-sm font-medium">Arquivos Enviados</h4>
          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-slate-800 p-3 rounded-lg border border-slate-700"
              >
                <div className="flex items-center gap-2">
                  <FileCheck size={16} className="text-green-400" />
                  <span className="text-slate-300 text-sm truncate">{file.name}</span>
                </div>
                <button
                  onClick={() => handleRemoveFile(file.path, index)}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
