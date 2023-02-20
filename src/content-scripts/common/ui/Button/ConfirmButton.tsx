import { useCallback, useRef, useState } from 'react'
import { useLiveRef, useUpdateEffect } from 'ariakit-react-utils'

type Status = 'idle' | 'pending' | 'confirmed'
const NextStatus: { [key in Status]: Status } = {
  idle: 'pending',
  pending: 'confirmed',
  confirmed: 'idle',
}

export function ConfirmButton({
  children,
  countDownSeconds = 0,
  countDownInterval = 1_000,
  onStatusChange,
}: {
  onStatusChange?: (options: { status: Status; proceed: () => void }) => any
  countDownSeconds?: number
  countDownInterval?: number
  children: (options: {
    status: Status
    proceed: () => void
    cancel: null | (() => void)
    timer: number
  }) => JSX.Element
}) {
  const [status, setStatus] = useState<Status>('idle')
  const statusRef = useRef<Status>(status)
  const stableStatusChange = useLiveRef(onStatusChange)

  const [timer, setTimer] = useState(countDownSeconds)
  const timerRef = useRef(timer)

  const proceed = useCallback(() => {
    const current = statusRef.current
    const next = NextStatus[current]
    if (current !== next) {
      setStatus(next)
      statusRef.current = next

      if (stableStatusChange.current) {
        stableStatusChange.current?.({ status: next, proceed })
      }
    }
  }, [stableStatusChange])

  const cancel = useCallback(() => {
    const current = statusRef.current
    if (current === 'pending') {
      setStatus('idle')
      statusRef.current = 'idle'
      setTimer(countDownSeconds)
    }
  }, [countDownSeconds])

  useUpdateEffect(() => {
    if (countDownSeconds && countDownSeconds > 0 && status === 'pending') {
      const intervalId = setInterval(() => {
        const prev = timerRef.current
        const next = prev > 0 ? Math.max(0, prev - 1) : 0

        setTimer(next)
        timerRef.current = next

        if (next === 0) {
          setStatus('idle')
          setTimer(countDownSeconds)
          statusRef.current = 'idle'
          setTimer(countDownSeconds)
          timerRef.current = countDownSeconds
        }
      }, 1_000)
      return () => {
        clearInterval(intervalId)
      }
    }
  }, [status, countDownSeconds, countDownInterval])

  return children({
    status,
    proceed,
    timer,
    cancel: status === 'pending' ? cancel : null,
  })
}

/*
<ConfirmButton>
{({goToNextTransion}) => {

  return <button onClick={}>{idle ? `Delete` :
  pending ? 'Are you sure (5)' :
  deleting ? 'Deleting'
  } </button>
}}
</ConfirmButton>


*/
