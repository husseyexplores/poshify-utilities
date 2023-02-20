import _toast, {
  ToastOptions,
  Renderable,
  ValueOrFunction,
  Toaster,
} from 'react-hot-toast'
import { Toast } from './Toast'
import { createPortal } from 'react-dom'

export const ToasterProvider = () => (
  <Toaster position="bottom-center" reverseOrder={true} />
)

const toastStyleOverrides = {
  padding: 0,
  margin: 0,
  backgroundColor: 'transparent',
  boxShadow: 'none',
}

export function toast(
  msg: Renderable,
  {
    duration = 40000,
    style = toastStyleOverrides,
    position = 'bottom-center',
    ...opts
  }: ToastOptions = {}
) {
  return _toast(
    t => <Toast message={msg} onClose={_toast.dismiss.bind(null, t.id)} />,
    {
      duration,
      style,
      position,
      ...opts,
    }
  )
}

toast.error = function toastError(
  msg: Renderable | Error,
  {
    duration = 4000,
    style = toastStyleOverrides,
    position = 'bottom-center',
    ...opts
  }: ToastOptions = {}
) {
  return _toast(
    t => (
      <Toast
        message={msg instanceof Error ? msg.message : msg}
        type="error"
        onClose={_toast.dismiss.bind(null, t.id)}
      />
    ),
    {
      duration,
      style,
      position,
      ...opts,
    }
  )
}

toast.success = function toastSuccess(
  msg: Renderable,
  {
    duration = 4000,
    style = toastStyleOverrides,
    position = 'bottom-center',
    ...opts
  }: ToastOptions = {}
) {
  return _toast(
    t => (
      <Toast
        message={msg}
        type="success"
        onClose={_toast.dismiss.bind(null, t.id)}
      />
    ),
    {
      duration,
      style,
      position,
      ...opts,
    }
  )
}

toast.loading = function toastLoading(
  msg: Renderable,
  {
    duration = 4000,
    style = toastStyleOverrides,
    position = 'bottom-center',
    ...opts
  }: ToastOptions = {}
) {
  return _toast(
    t => (
      <Toast
        message={msg}
        type="loading"
        onClose={_toast.dismiss.bind(null, t.id)}
      />
    ),
    {
      duration,
      style,
      position,
      ...opts,
    }
  )
}

const resolveValue = function resolveValue(valOrFunction, arg) {
  return typeof valOrFunction === 'function'
    ? valOrFunction(arg)
    : valOrFunction
}

type ToastOptionsPromise = ToastOptions & {
  loading?: ToastOptions
  success?: ToastOptions
  error?: ToastOptions
}

toast.promise = function toastPromise<T>(
  promise: Promise<T>,
  msgs: {
    loading: Renderable
    success: ValueOrFunction<Renderable, T>
    error: ValueOrFunction<Renderable, any>
  },
  {
    duration = 4000,
    style = toastStyleOverrides,
    position = 'bottom-center',
    ...opts
  }: ToastOptionsPromise = {}
) {
  const id = toast.loading(msgs.loading, {
    duration,
    style,
    position,
    ...opts,
    ...opts?.loading,
  })

  promise
    .then(p => {
      toast.success(resolveValue(msgs.success, p), {
        id,
        duration,
        style,
        position,
        ...opts,
        ...opts?.success,
      })
      return p
    })
    .catch(e => {
      toast.error(resolveValue(msgs.error, e), {
        id,
        duration,
        style,
        position,
        ...opts,
        ...opts?.error,
      })
    })

  return promise
}
