import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
})

export interface EvaluatePayload {
  studentId: string
  courseCode: string
  selfDescription: string
  checklist: Record<string, boolean>
  rubric?: string
  images?: File[]
}

export interface EvaluateResponse {
  ok: boolean
  score: number | null
  strengths: string[]
  weaknesses: string[]
  aiFeedback: {
    score: number
    strengths: string[]
    weaknesses: string[]
    improvement_steps: string[]
    technical_risk: 'low' | 'medium' | 'high'
  }
  modelImages: string[]
  docId: string
  error?: string
}

export const evaluateRevitModel = async (
  payload: EvaluatePayload
): Promise<EvaluateResponse> => {
  const formData = new FormData()
  formData.append('studentId', payload.studentId)
  formData.append('courseCode', payload.courseCode)
  formData.append('selfDescription', payload.selfDescription)
  formData.append('checklist', JSON.stringify(payload.checklist))

  if (payload.images && payload.images.length > 0) {
    payload.images.forEach((file) => {
      formData.append('images', file)
    })
  }

  try {
    const response = await apiClient.post<EvaluateResponse>('/evaluate', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.error || error.message)
    }
    throw error
  }
}
