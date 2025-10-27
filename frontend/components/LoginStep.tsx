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
          <p className="text-gray-600">Revit Project Evaluation System</p>
          <p className="text-sm text-gray-500 mt-2">
            AI-Powered Formative Assessment & Feedback
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
              Student ID
            </label>
            <input
              id="studentId"
              type="text"
              placeholder="e.g., 20201234"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              suppressHydrationWarning
            />
            <p className="text-xs text-gray-500 mt-1">Please enter your correct student ID</p>
          </div>

          <div>
            <label
              htmlFor="courseCode"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Course Code
            </label>
            <div suppressHydrationWarning>
              <select
                id="courseCode"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                suppressHydrationWarning
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a course</option>
                <option value="CE301">CE 301 - BIM Design</option>
                <option value="CE302">CE 302 - Advanced BIM</option>
                <option value="CE401">CE 401 - Civil Design Project</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={!isValid}
            className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
          >
            Next Step
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-600 text-center">
            🔒 Your personal information is securely managed and used only for evaluation purposes.
          </p>
        </div>
      </div>
    </div>
  )
}
