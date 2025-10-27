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

const getComplexityColor = (complexity: string) => {
  if (complexity.includes('Very High')) return 'text-red-600'
  if (complexity.includes('High')) return 'text-orange-600'
  if (complexity.includes('Medium')) return 'text-blue-600'
  return 'text-green-600'
}

export default function ResultsStep({ onReset }: ResultsStepProps) {
  const { evaluationResult, studentId, courseCode } = useEvaluationStore()

  if (!evaluationResult) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Unable to load results.</p>
        </div>
      </div>
    )
  }

  const score = evaluationResult.score || 0
  const scorePercentage = Math.round((score / 100) * 100)
  const feedback = evaluationResult.aiFeedback || {}
  const analysis = feedback.analysis || {}
  const metadata = analysis.metadata || {}
  const structure = analysis.structure || {}
  const quality = analysis.quality || {}
  const bimCompliance = analysis.bimCompliance || {}
  const performanceMetrics = analysis.performanceMetrics || {}
  const modelEstimates = analysis.modelEstimates || {}
  const categoryScores = feedback.categoryScores || {}

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Evaluation Results
          </h1>
          <p className="text-gray-600">
            Student ID: <span className="font-semibold">{studentId}</span> | Course:{' '}
            <span className="font-semibold">{courseCode}</span>
          </p>
          {analysis.fileName && (
            <p className="text-sm text-gray-500 mt-2">
              📄 File: <span className="font-mono">{analysis.fileName}</span>
            </p>
          )}
        </div>

        {/* Main Score Card */}
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
                    ? 'Excellent 🌟'
                    : scorePercentage >= 60
                      ? 'Good ✅'
                      : scorePercentage >= 40
                        ? 'Needs Improvement ⚠️'
                        : 'Poor ❌'}
                </p>
              </div>
            </div>

            {/* Risk & Stats */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-2">
                  Technical Risk
                </h3>
                <div
                  className={`${getRiskColor(feedback.riskLevel || 'medium')} border rounded-lg p-4 text-center font-semibold`}
                >
                  {feedback.riskLevel === 'low'
                    ? '🟢 Low'
                    : feedback.riskLevel === 'high'
                      ? '🔴 High'
                      : '🟡 Medium'}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-2">
                  Assessment Summary
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="text-gray-600">Strengths</span>
                    <span className="font-semibold text-green-600">
                      {feedback.strengths?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="text-gray-600">Areas for Improvement</span>
                    <span className="font-semibold text-orange-600">
                      {feedback.weaknesses?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="text-gray-600">Improvement Steps</span>
                    <span className="font-semibold text-blue-600">
                      {feedback.improvement_steps?.length || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Category Scores */}
        {Object.keys(categoryScores).length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              📊 Rubric Category Breakdown
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {Object.entries(categoryScores).map(([category, score]) => (
                <div key={category} className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                  <p className="text-2xl font-bold text-blue-600">{(score as number).toFixed(1)}</p>
                  <p className="text-xs font-semibold text-gray-700 mt-1">
                    {category === 'A' ? 'Accuracy' : category === 'B' ? 'BIM/LOD' : category === 'C' ? 'Documentation' : category === 'D' ? 'Constructability' : category === 'E' ? 'Design Intent' : 'Process/SRL'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* File Analysis Section */}
        {Object.keys(analysis).length > 0 && (
          <>
            {/* File Metadata */}
            {metadata && Object.keys(metadata).length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  📋 File Analysis
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {metadata.estimates?.sizeMB && (
                    <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <p className="text-xs text-gray-600">File Size</p>
                      <p className="text-lg font-semibold text-purple-600">{metadata.estimates.sizeMB} MB</p>
                    </div>
                  )}
                  {metadata.estimates?.estimatedComplexity && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-xs text-gray-600">Complexity</p>
                      <p className={`text-lg font-semibold ${getComplexityColor(metadata.estimates.estimatedComplexity)}`}>
                        {metadata.estimates.estimatedComplexity}
                      </p>
                    </div>
                  )}
                  {metadata.hasValidNaming?.score !== undefined && (
                    <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-xs text-gray-600">Naming Convention</p>
                      <p className="text-lg font-semibold text-yellow-600">{Math.round(metadata.hasValidNaming.score)}%</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Structure Analysis */}
            {structure.composition && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  🏗️ File Structure Analysis
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex justify-between p-2 bg-gray-50 rounded">
                      <span className="text-gray-600">Total Sectors</span>
                      <span className="font-semibold">{structure.composition.totalSectors}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-gray-50 rounded">
                      <span className="text-gray-600">Avg Sector Size</span>
                      <span className="font-semibold">{structure.composition.averageSectorSize} B</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between p-2 bg-gray-50 rounded">
                      <span className="text-gray-600">Data Efficiency</span>
                      <span className="font-semibold">{structure.composition.dataEfficiency}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-gray-50 rounded">
                      <span className="text-gray-600">Wasted Space</span>
                      <span className="font-semibold">{structure.composition.wastedSpace}</span>
                    </div>
                  </div>
                </div>
                {structure.fragmentationLevel && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-gray-600">Fragmentation Level</p>
                    <p className="text-lg font-semibold text-blue-600">
                      {structure.fragmentationLevel.level} ({structure.fragmentationLevel.score}/100)
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* BIM Compliance */}
            {bimCompliance && Object.keys(bimCompliance).length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  ✅ BIM Compliance Assessment
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {bimCompliance.modelingStandards !== undefined && (
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm text-gray-600">Modeling Standards</p>
                      <p className="text-2xl font-semibold text-green-600">{Math.round(bimCompliance.modelingStandards)}/25</p>
                    </div>
                  )}
                  {bimCompliance.dataStructure !== undefined && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-gray-600">Data Structure</p>
                      <p className="text-2xl font-semibold text-blue-600">{Math.round(bimCompliance.dataStructure)}/25</p>
                    </div>
                  )}
                  {bimCompliance.documentationQuality !== undefined && (
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <p className="text-sm text-gray-600">Documentation Quality</p>
                      <p className="text-2xl font-semibold text-purple-600">{Math.round(bimCompliance.documentationQuality)}/25</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Performance Metrics */}
            {performanceMetrics && Object.keys(performanceMetrics).length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  ⚡ Performance Metrics
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {performanceMetrics.estimatedLoadTime && (
                    <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <p className="text-xs text-gray-600">Estimated Load Time</p>
                      <p className="text-lg font-semibold text-orange-600">{performanceMetrics.estimatedLoadTime}</p>
                    </div>
                  )}
                  {performanceMetrics.renderingComplexity && (
                    <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-xs text-gray-600">Rendering Complexity</p>
                      <p className={`text-lg font-semibold ${getComplexityColor(performanceMetrics.renderingComplexity)}`}>
                        {performanceMetrics.renderingComplexity}
                      </p>
                    </div>
                  )}
                  {performanceMetrics.editingPerformance !== undefined && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-xs text-gray-600">Editing Performance</p>
                      <p className="text-lg font-semibold text-blue-600">{Math.round(performanceMetrics.editingPerformance)}/100</p>
                    </div>
                  )}
                  {performanceMetrics.collaborationFitness !== undefined && (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-xs text-gray-600">Collaboration Fitness</p>
                      <p className="text-lg font-semibold text-green-600">{Math.round(performanceMetrics.collaborationFitness)}/100</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Model Estimates */}
            {modelEstimates && Object.keys(modelEstimates).length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  📐 Model Estimates
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {modelEstimates.estimatedElements && (
                    <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                      <p className="text-xs text-gray-600">Elements</p>
                      <p className="text-lg font-semibold text-indigo-600">{modelEstimates.estimatedElements.toLocaleString()}</p>
                    </div>
                  )}
                  {modelEstimates.estimatedViews && (
                    <div className="p-3 bg-cyan-50 rounded-lg border border-cyan-200">
                      <p className="text-xs text-gray-600">Views</p>
                      <p className="text-lg font-semibold text-cyan-600">{modelEstimates.estimatedViews}</p>
                    </div>
                  )}
                  {modelEstimates.estimatedSheets && (
                    <div className="p-3 bg-teal-50 rounded-lg border border-teal-200">
                      <p className="text-xs text-gray-600">Sheets</p>
                      <p className="text-lg font-semibold text-teal-600">{modelEstimates.estimatedSheets}</p>
                    </div>
                  )}
                  {modelEstimates.estimatedFamilies && (
                    <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                      <p className="text-xs text-gray-600">Families</p>
                      <p className="text-lg font-semibold text-emerald-600">{modelEstimates.estimatedFamilies}</p>
                    </div>
                  )}
                </div>
                {modelEstimates.estimatedComplexity && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Model Scale</p>
                    <p className={`text-lg font-semibold ${getComplexityColor(modelEstimates.estimatedComplexity)}`}>
                      {modelEstimates.estimatedComplexity}
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Strengths */}
        {feedback.strengths && feedback.strengths.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <span className="text-2xl mr-2">✅ Strengths</span>
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
              <span className="text-2xl mr-2">📌 Areas for Improvement</span>
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
              <span className="text-2xl mr-2">🚀 Improvement Plan</span>
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
            Start New Evaluation
          </button>
          <button
            onClick={() => window.print()}
            className="px-8 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            Print Results
          </button>
        </div>
      </div>
    </div>
  )
}
