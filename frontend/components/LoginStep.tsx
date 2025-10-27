'use client'

import { useEvaluationStore } from '@/lib/store'

interface LoginStepProps {
  onNext: () => void
}

export default function LoginStep({ onNext }: LoginStepProps) {
  const { studentId, courseCode, setStudentId, setCourseCode } =
    useEvaluationStore()

  const isValid = studentId.trim().length > 0 && courseCode.trim().length > 0

  const handleNext = () => {
    if (isValid) {
      onNext()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">CivilForm</h1>
          <p className="text-gray-600">Revit 프로젝트 평가 시스템</p>
          <p className="text-sm text-gray-500 mt-2">
            AI 기반 형성평가 및 피드백 제공
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleNext()
          }}
          className="space-y-6"
        >
          <div>
            <label
              htmlFor="studentId"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              학번 (Student ID)
            </label>
            <input
              id="studentId"
              type="text"
              placeholder="예: 20201234"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">학번을 정확히 입력해주세요</p>
          </div>

          <div>
            <label
              htmlFor="courseCode"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              과목 코드 (Course Code)
            </label>
            <select
              id="courseCode"
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">과목을 선택하세요</option>
              <option value="CE301">CE 301 - BIM 설계</option>
              <option value="CE302">CE 302 - 고급 BIM</option>
              <option value="CE401">CE 401 - 토목설계 프로젝트</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={!isValid}
            className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
          >
            다음 단계로 진행
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-600 text-center">
            🔒 개인 정보는 안전하게 관리되며, 평가 목적으로만 사용됩니다.
          </p>
        </div>
      </div>
    </div>
  )
}
