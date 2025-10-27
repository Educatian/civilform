'use client'

import { useState } from 'react'
import LoginStep from '@/components/LoginStep'
import RubricStep from '@/components/RubricStep'
import UploadStep from '@/components/UploadStep'
import ResultsStep from '@/components/ResultsStep'
import { useEvaluationStore } from '@/lib/store'
import { evaluateRevitModel } from '@/lib/api'

export default function Home() {
  const [currentStep, setCurrentStep] = useState<
    'login' | 'rubric' | 'upload' | 'evaluating' | 'results'
  >('login')

  const {
    studentId,
    courseCode,
    selfDescription,
    selectedRubrics,
    uploadedImages,
    isLoading,
    error,
    setIsLoading,
    setError,
    setEvaluationResult,
    reset,
  } = useEvaluationStore()

  const handleStartEvaluation = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await evaluateRevitModel({
        studentId,
        courseCode,
        selfDescription,
        checklist: selectedRubrics,
        images: uploadedImages,
      })

      setEvaluationResult(result)
      setCurrentStep('results')
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '평가 중 오류가 발생했습니다.'
      setError(errorMsg)
      console.error('Evaluation error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    reset()
    setCurrentStep('login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Indicator */}
      {currentStep !== 'results' && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              {[
                { step: 'login', label: '로그인', icon: '👤' },
                { step: 'rubric', label: '루브릭 선택', icon: '✓' },
                { step: 'upload', label: '자료 업로드', icon: '📁' },
                { step: 'evaluating', label: '평가 진행중', icon: '⚙️' },
              ].map((item, idx, arr) => (
                <div key={item.step} className="flex items-center flex-1">
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-full text-lg font-semibold ${
                      currentStep === item.step
                        ? 'bg-blue-600 text-white ring-4 ring-blue-200'
                        : ['login', 'rubric', 'upload'].includes(currentStep) &&
                            ['login', 'rubric', 'upload'].indexOf(currentStep) >
                              ['login', 'rubric', 'upload'].indexOf(
                                item.step as string
                              )
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {item.icon}
                  </div>
                  <p className="ml-2 text-sm font-medium text-gray-700 hidden sm:block">
                    {item.label}
                  </p>
                  {idx < arr.length - 1 && (
                    <div
                      className={`h-1 flex-1 mx-4 rounded-full ${
                        ['login', 'rubric', 'upload'].indexOf(currentStep) >
                        ['login', 'rubric', 'upload'].indexOf(item.step as string)
                          ? 'bg-green-600'
                          : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step Content */}
      <div className="min-h-[calc(100vh-200px)]">
        {currentStep === 'login' && (
          <LoginStep onNext={() => setCurrentStep('rubric')} />
        )}

        {currentStep === 'rubric' && (
          <RubricStep
            onNext={() => setCurrentStep('upload')}
            onBack={() => setCurrentStep('login')}
          />
        )}

        {currentStep === 'upload' && (
          <UploadStep
            onNext={() => {
              setCurrentStep('evaluating')
              handleStartEvaluation()
            }}
            onBack={() => setCurrentStep('rubric')}
          />
        )}

        {currentStep === 'evaluating' && (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4 animate-pulse">
                <span className="text-3xl">⚙️</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                AI 평가 진행 중...
              </h2>
              <p className="text-gray-600">
                Gemini가 프로젝트를 분석하고 있습니다. 잠시만 기다려주세요.
              </p>
            </div>
          </div>
        )}

        {currentStep === 'results' && (
          <ResultsStep onReset={handleReset} />
        )}
      </div>

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg max-w-md">
          <p className="font-semibold">오류 발생</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && currentStep !== 'evaluating' && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4 animate-spin">
              <span>⚙️</span>
            </div>
            <p className="text-gray-900 font-semibold">처리 중...</p>
          </div>
        </div>
      )}
    </div>
  )
}
