'use client'

import { useState } from 'react'
import { useEvaluationStore } from '@/lib/store'

interface UploadStepProps {
  onNext: () => void
  onBack: () => void
}

export default function UploadStep({ onNext, onBack }: UploadStepProps) {
  const {
    uploadedImages,
    selfDescription,
    uploadMode,
    setSelfDescription,
    setUploadedImages,
    setUploadMode,
  } = useEvaluationStore()

  const [dragActive, setDragActive] = useState(false)

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    
    let allowedExtensions: string[] = []
    if (uploadMode === 'analysis') {
      // RVT file analysis mode
      allowedExtensions = ['.rvt', '.rfa', '.adt']
    } else {
      // Image evaluation mode
      allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
    }
    
    const newFiles = Array.from(files)
      .filter((f) => {
        const ext = f.name.split('.').pop()?.toLowerCase()
        return ext && allowedExtensions.includes(`.${ext}`)
      })
      .slice(0, 3)
    
    setUploadedImages([
      ...uploadedImages.slice(0, Math.max(0, 3 - newFiles.length)),
      ...newFiles,
    ])
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleFiles(e.dataTransfer.files)
  }

  const removeFile = (index: number) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index))
  }

  const isValid =
    uploadedImages.length > 0 && selfDescription.trim().length > 20

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Revit Project Evaluation
          </h1>
          <p className="text-gray-600">
            Choose your evaluation method and upload materials
          </p>
        </div>

        {/* Mode Selection */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => {
              setUploadMode('evaluation')
              setUploadedImages([])
            }}
            className={`p-6 rounded-lg border-2 transition-all ${
              uploadMode === 'evaluation'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 bg-white hover:border-gray-400'
            }`}
          >
            <div className="text-3xl mb-2">📸</div>
            <h3 className="font-bold text-gray-900">AI Evaluation</h3>
            <p className="text-sm text-gray-600 mt-2">
              Upload screenshots/images of your Revit design for AI analysis
            </p>
            <ul className="text-xs text-gray-500 mt-3 space-y-1">
              <li>✓ Plan/Section/3D views</li>
              <li>✓ Detail drawings</li>
              <li>✓ Revit screenshots</li>
            </ul>
          </button>

          <button
            onClick={() => {
              setUploadMode('analysis')
              setUploadedImages([])
            }}
            className={`p-6 rounded-lg border-2 transition-all ${
              uploadMode === 'analysis'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 bg-white hover:border-gray-400'
            }`}
          >
            <div className="text-3xl mb-2">📁</div>
            <h3 className="font-bold text-gray-900">File Analysis</h3>
            <p className="text-sm text-gray-600 mt-2">
              Upload Revit files for technical analysis & BIM compliance check
            </p>
            <ul className="text-xs text-gray-500 mt-3 space-y-1">
              <li>✓ RVT/RFA/ADT files</li>
              <li>✓ File structure analysis</li>
              <li>✓ BIM metrics</li>
            </ul>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* File Upload Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {uploadMode === 'evaluation' ? '📸 Upload Screenshots' : '📄 Upload Revit Files'} (Max 3)
            </h2>

            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-200 ${
                dragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 bg-white'
              }`}
            >
              <input
                type="file"
                multiple
                accept={uploadMode === 'evaluation' 
                  ? '.jpg,.jpeg,.png,.webp,.gif' 
                  : '.rvt,.rfa,.adt'}
                onChange={(e) => handleFiles(e.target.files)}
                className="hidden"
                id="fileInput"
              />
              <label
                htmlFor="fileInput"
                className="cursor-pointer block"
              >
                <div className="text-4xl mb-2">
                  {uploadMode === 'evaluation' ? '📸' : '🏗️'}
                </div>
                <p className="font-semibold text-gray-900">
                  {uploadMode === 'evaluation'
                    ? 'Drag screenshots here or click to select'
                    : 'Drag Revit files here or click to select'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {uploadMode === 'evaluation'
                    ? '.JPG, .PNG, .WEBP, .GIF (max 50MB each)'
                    : '.RVT (Project), .RFA (Family), .ADT (max 100MB each)'}
                </p>
              </label>
            </div>

            {/* File List */}
            {uploadedImages.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 mb-3">
                  📋 Files ({uploadedImages.length}/3)
                </h3>
                <div className="space-y-2">
                  {uploadedImages.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-gray-100 p-3 rounded-lg"
                    >
                      <div className="flex items-center flex-1">
                        <span className="text-lg mr-2">
                          {uploadMode === 'evaluation' ? '📸' : '📦'}
                        </span>
                        <span className="text-sm text-gray-700 truncate">
                          {file.name}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          ({(file.size / (1024 * 1024)).toFixed(1)} MB)
                        </span>
                      </div>
                      <button
                        onClick={() => removeFile(idx)}
                        className="text-red-600 hover:text-red-700 font-semibold text-sm ml-2"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Description Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              ✍️ Project Description
            </h2>
            <textarea
              value={selfDescription}
              onChange={(e) => setSelfDescription(e.target.value)}
              placeholder={uploadMode === 'evaluation'
                ? "Describe your design: intent, key features, BIM standards, challenges. (Min 20 chars)"
                : "Describe your project and modeling approach. (Min 20 chars)"}
              className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <div className="mt-2 flex justify-between items-center">
              <p className="text-xs text-gray-500">
                {selfDescription.length} characters written
              </p>
              {selfDescription.length >= 20 ? (
                <span className="text-xs text-green-600 font-semibold">
                  ✓ Requirement met
                </span>
              ) : (
                <span className="text-xs text-orange-600">
                  {20 - selfDescription.length} more characters needed
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="mt-8 flex gap-3 justify-between">
          <button
            onClick={onBack}
            className="px-6 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            ← Back
          </button>
          <button
            onClick={onNext}
            disabled={!isValid}
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {uploadMode === 'evaluation' ? 'Get AI Feedback →' : 'Analyze File →'}
          </button>
        </div>

        {!isValid && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⚠️{' '}
              {uploadedImages.length === 0
                ? `Please upload at least 1 ${uploadMode === 'evaluation' ? 'screenshot' : 'Revit file'}.`
                : 'Please write a description of at least 20 characters.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
