import { useEffect, useRef } from 'react'

function useUnmountStatus() {
  const unmounted = useRef(false)
  useEffect(() => {
    const cleanup = () => (unmounted.current = true)
    return cleanup
  }, [])
  return unmounted
}

export default useUnmountStatus
