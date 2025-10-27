'use client'

import { useEvaluationStore } from '@/lib/store'

interface ResultsStepProps {
  onReset: () => void
}

const getRiskColor = (risk: string) => {
  switch (risk) {
    case 'low':
      return 'bg-green-100 text-green-800 border-green-300'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    case 'high':
      return 'bg-red-100 text-red-800 border-red-300'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300'
  }
}

export default function ResultsStep({ onReset }: ResultsStepProps) {
  const { evaluationResult, studentId, courseCode } = useEvaluationStore()

  if (!evaluationResult) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">결과를 불러올 수 없습니다.</p>
        </div>
      </div>
    )
  }

  const score = evaluationResult.score || 0
  const scorePercentage = Math.round((score / 100) * 100)
  const feedback = evaluationResult.aiFeedback || {}

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            평가 결과
          </h1>
          <p className="text-gray-600">
            학번: <span className="font-semibold">{studentId}</span> | 과목:{' '}
            <span className="font-semibold">{courseCode}</span>
          </p>
        </div>

        {/* Score Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Score Visualization */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-48 h-48">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="90"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="90"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="8"
                    strokeDasharray={`${(scorePercentage / 100) * 565.48} 565.48`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-blue-600">
                    {score}
                  </span>
                  <span className="text-sm text-gray-600">/100</span>
                </div>
              </div>
              <div className="mt-4 text-center">
                <p className="text-sm font-semibold text-gray-900">
                  {scorePercentage >= 80
                    ? '우수 🌟'
                    : scorePercentage >= 60
                      ? '양호 ✅'
                      : scorePercentage >= 40
                        ? '개선 필요 ⚠️'
                        : '미흡 ❌'}
                </p>
              </div>
            </div>

            {/* Risk & Stats */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-2">
                  기술적 위험도
                </h3>
                <div
                  className={`${getRiskColor(feedback.technical_risk || 'medium')} border rounded-lg p-4 text-center font-semibold`}
                >
                  {feedback.technical_risk === 'low'
                    ? '🟢 낮음'
                    : feedback.technical_risk === 'high'
                      ? '🔴 높음'
                      : '🟡 중간'}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-2">
                  평가 요약
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="text-gray-600">강점 항목</span>
                    <span className="font-semibold text-green-600">
                      {feedback.strengths?.length || 0}개
                    </span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="text-gray-600">개선 필요</span>
                    <span className="font-semibold text-orange-600">
                      {feedback.weaknesses?.length || 0}개
                    </span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="text-gray-600">개선 단계</span>
                    <span className="font-semibold text-blue-600">
                      {feedback.improvement_steps?.length || 0}단계
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Strengths */}
        {feedback.strengths && feedback.strengths.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <span className="text-2xl mr-2">✅ 강점</span>
            </h2>
            <ul className="space-y-3">
              {feedback.strengths.map((strength: string, idx: number) => (
                <li
                  key={idx}
                  className="flex items-start p-3 bg-green-50 border border-green-200 rounded-lg"
                >
                  <span className="text-green-600 font-bold mr-3 flex-shrink-0">
                    ✓
                  </span>
                  <span className="text-gray-800">{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Weaknesses */}
        {feedback.weaknesses && feedback.weaknesses.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <span className="text-2xl mr-2">📌 개선 필요 사항</span>
            </h2>
            <ul className="space-y-3">
              {feedback.weaknesses.map((weakness: string, idx: number) => (
                <li
                  key={idx}
                  className="flex items-start p-3 bg-orange-50 border border-orange-200 rounded-lg"
                >
                  <span className="text-orange-600 font-bold mr-3 flex-shrink-0">
                    ⚠
                  </span>
                  <span className="text-gray-800">{weakness}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Improvement Steps */}
        {feedback.improvement_steps && feedback.improvement_steps.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <span className="text-2xl mr-2">🚀 개선 방안</span>
            </h2>
            <ol className="space-y-3">
              {feedback.improvement_steps.map(
                (step: string, idx: number) => (
                  <li
                    key={idx}
                    className="flex items-start p-3 bg-blue-50 border border-blue-200 rounded-lg"
                  >
                    <span className="text-blue-600 font-bold mr-3 flex-shrink-0 min-w-fit">
                      {idx + 1}.
                    </span>
                    <span className="text-gray-800">{step}</span>
                  </li>
                )
              )}
            </ol>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4 justify-center">
          <button
            onClick={onReset}
            className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            새로운 평가 시작
          </button>
          <button
            onClick={() => window.print()}
            className="px-8 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            평가 결과 인쇄
          </button>
        </div>
      </div>
    </div>
  )
}
