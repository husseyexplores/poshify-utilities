import { forwardRef, ComponentPropsWithoutRef, useId, ReactNode } from 'react'
import { Label } from '../Label'
import { InlineError } from '$ui/InlineError'
import './Input.scss'
import { ClearButton } from '$ui/Dumb/ClearButton'

type InputElementProps = Omit<ComponentPropsWithoutRef<'input'>, 'prefix'>
type ComponentProps = {
  label?: string | null
  error?: string | null | false
  showError?: boolean
  onClearClick?: React.MouseEventHandler<HTMLButtonElement>
  prefix?: ReactNode
  labelHidden?: boolean
}

type InputComponentProps = InputElementProps & ComponentProps
export const Input = forwardRef<HTMLInputElement, InputComponentProps>(
  function Input(
    {
      label,
      error: errorProp,
      showError = true,
      onClearClick,
      className,
      value,
      prefix,
      labelHidden,
      ...inputProps
    },
    forwardedRef
  ) {
    const uid = useId()
    const labelIid = 'poshify_label_' + uid
    const inputId = inputProps.id || 'poshify_input_' + uid
    const errorId = 'poshify_error_' + uid
    const error = showError ? errorProp : null

    return (
      <div>
        {label ? (
          <Label hidden={labelHidden} id={labelIid} htmlFor={inputId}>
            {label}
          </Label>
        ) : null}

        <div className="Polaris-Connected">
          <div className="Polaris-Connected__Item Polaris-Connected__Item--primary">
            <div className="Polaris-TextField">
              {prefix && (
                <div className="Polaris-TextField__Prefix">{prefix}</div>
              )}
              <input
                ref={forwardedRef}
                id={inputId}
                value={value}
                className={`Polaris-TextField__Input PInput ${className ?? ''}`}
                aria-labelledby={labelIid}
                aria-describedby={error ? errorId : undefined}
                {...inputProps}
              />
              {onClearClick && (value != null ? value !== '' : true) && (
                <ClearButton onClick={onClearClick} />
              )}
              <div className="Polaris-TextField__Backdrop"></div>
            </div>
          </div>
        </div>
        {error ? <InlineError id={errorId}>{error}</InlineError> : null}
      </div>
    )
  }
)

type InputNumberComponentProps = Omit<InputElementProps, 'type'> &
  ComponentProps
export const InputNumber = forwardRef<
  HTMLInputElement,
  InputNumberComponentProps
>(function InputNumber({ ...props }, forwardedRef) {
  return <Input {...props} type="number" ref={forwardedRef} />
})

type TextAreaElementProps = ComponentPropsWithoutRef<'textarea'>
type TextAreaComponentProps = TextAreaElementProps & ComponentProps
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaComponentProps>(
  function TextArea(
    {
      label,
      error: errorProp,
      showError,
      rows = 5,
      className = '',
      ...inputProps
    },
    forwardedRef
  ) {
    const uid = useId()
    const labelIid = 'poshify_label_' + uid
    const inputId = inputProps.id || 'poshify_textarea_' + uid
    const errorId = 'poshify_error_' + uid
    const error = showError ? errorProp : null

    return (
      <div className="">
        {label ? (
          <Label id={labelIid} htmlFor={inputId}>
            {label}
          </Label>
        ) : null}

        <div className="Polaris-Connected">
          <div className="Polaris-Connected__Item Polaris-Connected__Item--primary">
            <div className="Polaris-TextField Polaris-TextField--hasValue">
              <textarea
                ref={forwardedRef}
                id={inputId}
                rows={rows}
                className={`Polaris-TextField__Input PInput ${className}`}
                aria-labelledby={labelIid}
                aria-describedby={error ? errorId : undefined}
                {...inputProps}
              />
              <div className="Polaris-TextField__Backdrop"></div>
            </div>
          </div>
        </div>
        {error ? <InlineError id={errorId}>{error}</InlineError> : null}
      </div>
    )
  }
)
