'use client'

import { useEvaluationStore } from '@/lib/store'

interface ResultsStepProps {
  onReset: () => void
}

const getRiskColor = (risk: string) => {
  switch (risk) {
    case 'low':
      return 'text-green-700 bg-green-50 border-green-200'
    case 'medium':
      return 'text-amber-700 bg-amber-50 border-amber-200'
    case 'high':
      return 'text-red-700 bg-red-50 border-red-200'
    default:
      return 'text-slate-700 bg-slate-50 border-slate-200'
  }
}

export default function ResultsStep({ onReset }: ResultsStepProps) {
  const { evaluationResult, studentId, courseCode, uploadMode } = useEvaluationStore()

  if (!evaluationResult) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">Unable to load results.</p>
          <button
            onClick={onReset}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Start New Evaluation
          </button>
        </div>
      </div>
    )
  }

  const isAnalysisMode = uploadMode === 'analysis'
  const score = evaluationResult.score || 0
  const scorePercentage = Math.round((score / 100) * 100)
  const feedback = evaluationResult.aiFeedback || {}
  const analyses = isAnalysisMode ? feedback.analyses || [] : []
  const analysis = !isAnalysisMode ? feedback.analysis || {} : (analyses[0] || {})
  const metadata = analysis.metadata || {}
  const structure = analysis.structure || {}
  const bimCompliance = analysis.bimCompliance || {}
  const performanceMetrics = analysis.performanceMetrics || {}
  const modelEstimates = analysis.modelEstimates || {}
  const categoryScores = feedback.categoryScores || {}

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-light text-slate-900 mb-2">
            {isAnalysisMode ? 'Revit File Analysis' : 'Evaluation Results'}
          </h1>
          <p className="text-slate-500 text-lg">
            <span className="font-medium">{studentId}</span> • <span className="font-medium">{courseCode}</span>
          </p>
          {analysis.fileName && (
            <p className="text-slate-400 text-sm mt-3">
              📄 {analysis.fileName}
            </p>
          )}
        </div>

        {/* Main Score Card */}
        {!isAnalysisMode && (
        <div className="mb-12 bg-slate-50 rounded-2xl p-8 border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Score Circle */}
            <div className="flex flex-col items-center justify-center md:col-span-1">
              <div className="relative w-40 h-40">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="75"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="3"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="75"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3"
                    strokeDasharray={`${(scorePercentage / 100) * 471.24} 471.24`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-light text-slate-900">
                    {score}
                  </span>
                  <span className="text-sm text-slate-400 mt-1">/100</span>
                </div>
              </div>
            </div>

            {/* Score Details */}
            <div className="md:col-span-2 space-y-6">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Overall Assessment</p>
                <p className="text-2xl font-light text-slate-900">
                  {scorePercentage >= 80
                    ? 'Excellent'
                    : scorePercentage >= 60
                      ? 'Good'
                      : scorePercentage >= 40
                        ? 'Needs Improvement'
                        : 'Needs Significant Work'}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Technical Risk</p>
                <div className={`inline-block px-4 py-2 rounded-lg border ${getRiskColor(feedback.riskLevel || 'medium')} text-sm font-medium`}>
                  {feedback.riskLevel === 'low'
                    ? '✓ Low Risk'
                    : feedback.riskLevel === 'high'
                      ? '⚠ High Risk'
                      : '⚡ Medium Risk'}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Strengths</p>
                  <p className="text-2xl font-light text-slate-900">{feedback.strengths?.length || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Improvements</p>
                  <p className="text-2xl font-light text-slate-900">{feedback.weaknesses?.length || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Recommendations</p>
                  <p className="text-2xl font-light text-slate-900">{feedback.recommendations?.length || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Category Scores */}
        {Object.keys(categoryScores).length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-light text-slate-900 mb-6">
              Rubric Assessment
            </h2>
            <div className="space-y-3">
              {[
                { key: 'A', label: 'Modeling Accuracy', max: 25 },
                { key: 'B', label: 'BIM Standards & LOD', max: 20 },
                { key: 'C', label: 'Documentation', max: 15 },
                { key: 'D', label: 'Constructability', max: 15 },
                { key: 'E', label: 'Design Intent', max: 15 },
                { key: 'F', label: 'Process & Learning', max: 10 }
              ].map(cat => (
                <details key={cat.key} className="group">
                  <summary className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer transition-colors">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-medium">{cat.key}</span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{cat.label}</p>
                        <p className="text-sm text-slate-500">Max: {cat.max} points</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-2xl font-light text-slate-900">{(categoryScores[cat.key as keyof typeof categoryScores] as number)?.toFixed(1) || '0'}</p>
                      </div>
                      <span className="text-slate-400 group-open:rotate-180 transition-transform ml-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      </span>
                    </div>
                  </summary>
                  <div className="bg-white border-l-4 border-blue-200 ml-4 pl-4 pr-4 py-4 mt-2 space-y-3">
                    {cat.key === 'A' && (
                      <>
                        <div>
                          <p className="text-sm font-medium text-slate-900 mb-2">Dimensional Consistency</p>
                          <p className="text-sm text-slate-600">Element dimensions match design specifications with ±5% tolerance</p>
                          {metadata.estimates?.estimatedElements && (
                            <p className="text-xs text-slate-500 mt-2">Model contains ~{metadata.estimates.estimatedElements.toLocaleString()} elements</p>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 mb-2">Structural Connectivity</p>
                          <p className="text-sm text-slate-600">Walls, doors, windows, and MEP elements properly connected and coordinated</p>
                        </div>
                      </>
                    )}
                    {cat.key === 'B' && (
                      <>
                        <div>
                          <p className="text-sm font-medium text-slate-900 mb-2">Naming Convention</p>
                          <p className="text-sm text-slate-600">Elements follow standard naming patterns for identification</p>
                          {metadata.hasValidNaming?.score && (
                            <p className="text-xs text-slate-500 mt-2">Current compliance: {Math.round(metadata.hasValidNaming.score)}%</p>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 mb-2">Parameter Management</p>
                          <p className="text-sm text-slate-600">Critical parameters populated consistently across all families</p>
                          {modelEstimates.estimatedParameters && (
                            <p className="text-xs text-slate-500 mt-2">Estimated parameters: {modelEstimates.estimatedParameters.toLocaleString()}</p>
                          )}
                        </div>
                      </>
                    )}
                    {cat.key === 'C' && (
                      <>
                        <div>
                          <p className="text-sm font-medium text-slate-900 mb-2">View Organization</p>
                          <p className="text-sm text-slate-600">Views logically structured with plans, sections, and 3D representations</p>
                          {modelEstimates.estimatedViews && (
                            <p className="text-xs text-slate-500 mt-2">Total views: {modelEstimates.estimatedViews}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 mb-2">Drawing Quality</p>
                          <p className="text-sm text-slate-600">Professional layout with clear dimensions, notes, and annotations</p>
                          {modelEstimates.estimatedSheets && (
                            <p className="text-xs text-slate-500 mt-2">Design sheets: {modelEstimates.estimatedSheets}</p>
                          )}
                        </div>
                      </>
                    )}
                    {cat.key === 'D' && (
                      <>
                        <div>
                          <p className="text-sm font-medium text-slate-900 mb-2">Clash Detection</p>
                          <p className="text-sm text-slate-600">Structural-MEP conflicts identified and resolved for constructability</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 mb-2">Construction Sequence</p>
                          <p className="text-sm text-slate-600">Assembly sequence logically feasible from foundation to completion</p>
                        </div>
                      </>
                    )}
                    {cat.key === 'E' && (
                      <>
                        <div>
                          <p className="text-sm font-medium text-slate-900 mb-2">Spatial Efficiency</p>
                          <p className="text-sm text-slate-600">Space utilization optimized with efficient circulation patterns</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 mb-2">Design Justification</p>
                          <p className="text-sm text-slate-600">Design decisions supported by structural and functional reasoning</p>
                        </div>
                      </>
                    )}
                    {cat.key === 'F' && (
                      <>
                        <div>
                          <p className="text-sm font-medium text-slate-900 mb-2">Error Detection</p>
                          <p className="text-sm text-slate-600">Systematic quality checks and model validation demonstrated</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 mb-2">Self-Correction</p>
                          <p className="text-sm text-slate-600">Evidence of iterative improvements and design refinements</p>
                        </div>
                      </>
                    )}
                  </div>
                </details>
              ))}
            </div>
          </div>
        )}

        {/* File Analysis Section */}
        {Object.keys(analysis).length > 0 && (
          <>
            {/* File Metadata */}
            {metadata && Object.keys(metadata).length > 0 && (
              <div className="mb-12">
                <h2 className="text-3xl font-light text-slate-900 mb-6">
                  File Analysis
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {metadata.estimates?.sizeMB && (
                    <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">File Size</p>
                      <p className="text-3xl font-light text-slate-900">{metadata.estimates.sizeMB}</p>
                      <p className="text-xs text-slate-500 mt-2">MB</p>
                    </div>
                  )}
                  {metadata.estimates?.estimatedComplexity && (
                    <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Complexity</p>
                      <p className="text-2xl font-light text-slate-900">{metadata.estimates.estimatedComplexity}</p>
                    </div>
                  )}
                  {metadata.hasValidNaming?.score !== undefined && (
                    <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Naming Score</p>
                      <p className="text-3xl font-light text-slate-900">{Math.round(metadata.hasValidNaming.score)}</p>
                      <p className="text-xs text-slate-500 mt-2">%</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* BIM Compliance */}
            {bimCompliance && Object.keys(bimCompliance).length > 0 && (
              <div className="mb-12">
                <h2 className="text-3xl font-light text-slate-900 mb-6">
                  BIM Compliance
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {bimCompliance.modelingStandards !== undefined && (
                    <div className="p-6 bg-blue-50 rounded-xl border border-blue-200">
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Modeling Standards</p>
                      <p className="text-3xl font-light text-blue-600">{Math.round(bimCompliance.modelingStandards)}</p>
                      <p className="text-xs text-slate-500 mt-2">/25</p>
                    </div>
                  )}
                  {bimCompliance.dataStructure !== undefined && (
                    <div className="p-6 bg-blue-50 rounded-xl border border-blue-200">
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Data Structure</p>
                      <p className="text-3xl font-light text-blue-600">{Math.round(bimCompliance.dataStructure)}</p>
                      <p className="text-xs text-slate-500 mt-2">/25</p>
                    </div>
                  )}
                  {bimCompliance.documentationQuality !== undefined && (
                    <div className="p-6 bg-blue-50 rounded-xl border border-blue-200">
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Documentation</p>
                      <p className="text-3xl font-light text-blue-600">{Math.round(bimCompliance.documentationQuality)}</p>
                      <p className="text-xs text-slate-500 mt-2">/25</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Performance Metrics */}
            {performanceMetrics && Object.keys(performanceMetrics).length > 0 && (
              <div className="mb-12">
                <h2 className="text-3xl font-light text-slate-900 mb-6">
                  Performance Metrics
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {performanceMetrics.estimatedLoadTime && (
                    <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Load Time</p>
                      <p className="text-2xl font-light text-slate-900">{performanceMetrics.estimatedLoadTime}</p>
                    </div>
                  )}
                  {performanceMetrics.renderingComplexity && (
                    <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Rendering</p>
                      <p className="text-2xl font-light text-slate-900">{performanceMetrics.renderingComplexity}</p>
                    </div>
                  )}
                  {performanceMetrics.editingPerformance !== undefined && (
                    <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Editing Performance</p>
                      <p className="text-3xl font-light text-slate-900">{Math.round(performanceMetrics.editingPerformance)}</p>
                      <p className="text-xs text-slate-500 mt-2">/100</p>
                    </div>
                  )}
                  {performanceMetrics.collaborationFitness !== undefined && (
                    <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Collaboration</p>
                      <p className="text-3xl font-light text-slate-900">{Math.round(performanceMetrics.collaborationFitness)}</p>
                      <p className="text-xs text-slate-500 mt-2">/100</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Model Estimates */}
            {modelEstimates && Object.keys(modelEstimates).length > 0 && (
              <div className="mb-12">
                <h2 className="text-3xl font-light text-slate-900 mb-6">
                  Model Overview
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {modelEstimates.estimatedElements && (
                    <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Elements</p>
                      <p className="text-2xl font-light text-slate-900">{(modelEstimates.estimatedElements / 1000).toFixed(1)}k</p>
                    </div>
                  )}
                  {modelEstimates.estimatedViews && (
                    <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Views</p>
                      <p className="text-3xl font-light text-slate-900">{modelEstimates.estimatedViews}</p>
                    </div>
                  )}
                  {modelEstimates.estimatedSheets && (
                    <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Sheets</p>
                      <p className="text-3xl font-light text-slate-900">{modelEstimates.estimatedSheets}</p>
                    </div>
                  )}
                  {modelEstimates.estimatedFamilies && (
                    <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Families</p>
                      <p className="text-3xl font-light text-slate-900">{modelEstimates.estimatedFamilies}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Strengths */}
        {feedback.strengths && feedback.strengths.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-light text-slate-900 mb-6">
              Strengths
            </h2>
            <ul className="space-y-3">
              {feedback.strengths.map((strength: string, idx: number) => (
                <li
                  key={idx}
                  className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200"
                >
                  <span className="text-blue-600 font-light text-xl flex-shrink-0 mt-1">✓</span>
                  <span className="text-slate-700">{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Weaknesses */}
        {feedback.weaknesses && feedback.weaknesses.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-light text-slate-900 mb-6">
              Areas for Improvement
            </h2>
            <ul className="space-y-3">
              {feedback.weaknesses.map((weakness: string, idx: number) => (
                <li
                  key={idx}
                  className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200"
                >
                  <span className="text-slate-400 font-light text-xl flex-shrink-0 mt-1">→</span>
                  <span className="text-slate-700">{weakness}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {feedback.recommendations && feedback.recommendations.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-light text-slate-900 mb-6">
              Recommendations
            </h2>
            <ol className="space-y-3">
              {feedback.recommendations.map((rec: string, idx: number) => (
                <li
                  key={idx}
                  className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200"
                >
                  <span className="text-blue-600 font-light text-lg flex-shrink-0 min-w-fit">{idx + 1}.</span>
                  <span className="text-slate-700">{rec}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-16 flex gap-4 justify-center pb-12">
          <button
            onClick={onReset}
            className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            New Evaluation
          </button>
          <button
            onClick={() => window.print()}
            className="px-8 py-3 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors duration-200"
          >
            Print
          </button>
        </div>
      </div>
    </div>
  )
}
