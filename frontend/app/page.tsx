'use client'

import { useState } from 'react'
import LoginStep from '@/components/LoginStep'
import UploadStep from '@/components/UploadStep'
import ResultsStep from '@/components/ResultsStep'
import { useEvaluationStore } from '@/lib/store'
import { evaluateRevitModel, analyzeRevitFiles } from '@/lib/api'

export default function Home() {
  const [currentStep, setCurrentStep] = useState<
    'login' | 'upload' | 'evaluating' | 'results'
  >('login')

  const {
    studentId,
    courseCode,
    selfDescription,
    uploadedImages,
    uploadMode,
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
      let result: any
      
      if (uploadMode === 'analysis') {
        // RVT file analysis mode
        result = await analyzeRevitFiles(
          uploadedImages,
          studentId,
          courseCode,
          selfDescription
        )
        
        // Convert analysis format to match evaluation response format
        result = {
          ok: true,
          score: null,
          strengths: [],
          weaknesses: [],
          aiFeedback: result,
          modelImages: [],
          docId: `analysis_${studentId}_${Date.now()}`,
          timestamp: new Date().toISOString()
        }
      } else {
        // Image evaluation mode
        result = await evaluateRevitModel({
          studentId,
          courseCode,
          selfDescription,
          checklist: {}, // Empty checklist - rubric step removed
          images: uploadedImages,
        })
      }

      setEvaluationResult(result)
      setCurrentStep('results')
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred during evaluation.'
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
                { step: 'login', label: 'Login', icon: '👤' },
                { step: 'upload', label: 'Upload Revit', icon: '📄' },
                { step: 'evaluating', label: 'Analyzing', icon: '⚙️' },
              ].map((item, idx, arr) => (
                <div key={item.step} className="flex items-center flex-1">
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-full text-lg font-semibold ${
                      currentStep === item.step
                        ? 'bg-blue-600 text-white ring-4 ring-blue-200'
                        : ['login', 'upload'].includes(currentStep) &&
                            ['login', 'upload'].indexOf(currentStep) >
                              ['login', 'upload'].indexOf(
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
                        ['login', 'upload'].indexOf(currentStep) >
                        ['login', 'upload'].indexOf(item.step as string)
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
          <LoginStep onNext={() => setCurrentStep('upload')} />
        )}

        {currentStep === 'upload' && (
          <UploadStep
            onNext={() => {
              setCurrentStep('evaluating')
              handleStartEvaluation()
            }}
            onBack={() => setCurrentStep('login')}
          />
        )}

        {currentStep === 'evaluating' && (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4 animate-pulse">
                <span className="text-3xl">⚙️</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                AI Analysis in Progress...
              </h2>
              <p className="text-gray-600">
                Gemini is analyzing your Revit model. Please wait.
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
          <p className="font-semibold">Error</p>
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
            <p className="text-gray-900 font-semibold">Processing...</p>
          </div>
        </div>
      )}
    </div>
  )
}
