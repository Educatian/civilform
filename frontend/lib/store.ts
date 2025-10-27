import { create } from 'zustand'

export interface EvaluationState {
  studentId: string
  courseCode: string
  selfDescription: string
  selectedRubrics: Record<string, boolean>
  uploadedImages: File[]
  evaluationResult: any
  isLoading: boolean
  error: string | null

  setStudentId: (id: string) => void
  setCourseCode: (code: string) => void
  setSelfDescription: (desc: string) => void
  toggleRubric: (rubricId: string) => void
  setUploadedImages: (images: File[]) => void
  setEvaluationResult: (result: any) => void
  setIsLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

export const useEvaluationStore = create<EvaluationState>((set) => ({
  studentId: '',
  courseCode: '',
  selfDescription: '',
  selectedRubrics: {},
  uploadedImages: [],
  evaluationResult: null,
  isLoading: false,
  error: null,

  setStudentId: (id) => set({ studentId: id }),
  setCourseCode: (code) => set({ courseCode: code }),
  setSelfDescription: (desc) => set({ selfDescription: desc }),
  toggleRubric: (rubricId) =>
    set((state) => ({
      selectedRubrics: {
        ...state.selectedRubrics,
        [rubricId]: !state.selectedRubrics[rubricId],
      },
    })),
  setUploadedImages: (images) => set({ uploadedImages: images }),
  setEvaluationResult: (result) => set({ evaluationResult: result }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  reset: () =>
    set({
      studentId: '',
      courseCode: '',
      selfDescription: '',
      selectedRubrics: {},
      uploadedImages: [],
      evaluationResult: null,
      isLoading: false,
      error: null,
    }),
}))
