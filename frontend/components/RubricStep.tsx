'use client'

import { useEvaluationStore } from '@/lib/store'
import { RUBRIC_CATEGORIES, getRubricsByCategory } from '@/lib/rubrics'

interface RubricStepProps {
  onNext: () => void
  onBack: () => void
}

export default function RubricStep({ onNext, onBack }: RubricStepProps) {
  const { selectedRubrics, toggleRubric } = useEvaluationStore()

  const hasSelection = Object.values(selectedRubrics).some((v) => v === true)

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            평가 루브릭 선택
          </h1>
          <p className="text-gray-600">
            프로젝트 평가에 포함할 항목을 선택하세요 (최소 1개 필수)
          </p>
        </div>

        <div className="space-y-6">
          {RUBRIC_CATEGORIES.map((category) => {
            const rubrics = getRubricsByCategory(category)
            const categoryCount = rubrics.filter(
              (r) => selectedRubrics[r.id]
            ).length

            return (
              <div key={category} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {category}
                  </h2>
                  <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {categoryCount} / {rubrics.length} 선택
                  </span>
                </div>

                <div className="space-y-3">
                  {rubrics.map((rubric) => (
                    <label
                      key={rubric.id}
                      className="flex items-start p-3 border border-gray-200 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors duration-150"
                    >
                      <input
                        type="checkbox"
                        checked={selectedRubrics[rubric.id] || false}
                        onChange={() => toggleRubric(rubric.id)}
                        className="w-5 h-5 text-blue-600 rounded mt-1 cursor-pointer flex-shrink-0"
                      />
                      <div className="ml-3 flex-grow">
                        <p className="font-medium text-gray-900">
                          {rubric.label}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {rubric.description}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-8 flex gap-3 justify-between">
          <button
            onClick={onBack}
            className="px-6 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            ← 이전
          </button>
          <button
            onClick={onNext}
            disabled={!hasSelection}
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
          >
            다음 단계로 진행 →
          </button>
        </div>
      </div>
    </div>
  )
}
