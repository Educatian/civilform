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
    setSelfDescription,
    setUploadedImages,
  } = useEvaluationStore()

  const [dragActive, setDragActive] = useState(false)

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    const newFiles = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
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

  const removeImage = (index: number) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index))
  }

  const isValid =
    uploadedImages.length > 0 && selfDescription.trim().length > 20

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            설계 자료 업로드 및 자기평가
          </h1>
          <p className="text-gray-600">
            Revit 설계 캡처 이미지 (최대 3장)와 자기평가를 작성해주세요
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Image Upload Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              📸 이미지 업로드 (최대 3장)
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
                accept="image/*"
                onChange={(e) => handleFiles(e.target.files)}
                className="hidden"
                id="fileInput"
              />
              <label
                htmlFor="fileInput"
                className="cursor-pointer block"
              >
                <div className="text-4xl mb-2">📁</div>
                <p className="font-semibold text-gray-900">
                  이미지를 드래그하거나 클릭
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  PNG, JPG, GIF (최대 3개)
                </p>
              </label>
            </div>

            {/* Image Preview */}
            {uploadedImages.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 mb-3">
                  📋 업로드된 이미지 ({uploadedImages.length}/3)
                </h3>
                <div className="space-y-2">
                  {uploadedImages.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-gray-100 p-3 rounded-lg"
                    >
                      <span className="text-sm text-gray-700 truncate">
                        {idx + 1}. {file.name}
                      </span>
                      <button
                        onClick={() => removeImage(idx)}
                        className="text-red-600 hover:text-red-700 font-semibold text-sm"
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Self-Evaluation Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              ✍️ 자기평가 서술
            </h2>
            <textarea
              value={selfDescription}
              onChange={(e) => setSelfDescription(e.target.value)}
              placeholder="프로젝트의 설계 의도, 주요 특징, 기술적 구현, 어려웠던 점, 개선 희망 사항 등을 자유롭게 작성해주세요. (최소 20자)"
              className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <div className="mt-2 flex justify-between items-center">
              <p className="text-xs text-gray-500">
                {selfDescription.length}자 작성됨
              </p>
              {selfDescription.length >= 20 ? (
                <span className="text-xs text-green-600 font-semibold">
                  ✓ 조건 충족
                </span>
              ) : (
                <span className="text-xs text-orange-600">
                  최소 {20 - selfDescription.length}자 필요
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
            ← 이전
          </button>
          <button
            onClick={onNext}
            disabled={!isValid}
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
          >
            평가 시작 →
          </button>
        </div>

        {!isValid && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⚠️{' '}
              {uploadedImages.length === 0
                ? '최소 1개의 이미지를 업로드해주세요.'
                : '자기평가를 최소 20자 이상 작성해주세요.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
