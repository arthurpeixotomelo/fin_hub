import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useUploadContext } from '../context/UploadContext'

export function useUploadProgress(jobId: string | null, enabled: boolean) {
  const { dispatch } = useUploadContext()
  const { data } = useQuery({
    queryKey: ['upload-progress', jobId],
    queryFn: async () => {
      const res = await fetch(`/api/upload/progress/${jobId}`)
      if (!res.ok) throw new Error('Failed to fetch progress')
      return res.json() as Promise<{ progress: number; status: string }>
    },
    refetchInterval: enabled ? 1500 : false,
    enabled: !!jobId && enabled,
  })

  useEffect(() => {
    if (data?.progress !== undefined && data?.status) {
      dispatch({ type: 'PROGRESS', payload: { progress: data.progress, status: data.status } })
      if (data.progress >= 100 || data.status === 'done') {
        dispatch({ type: 'DONE', payload: { progress: data.progress, status: data.status } })
      }
    }
  }, [data, dispatch])
}