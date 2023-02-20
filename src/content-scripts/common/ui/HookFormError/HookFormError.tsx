import * as React from 'react'
import {
  useFormContext,
  FieldName,
  Message,
  MultipleFieldErrors,
  FieldErrors,
} from 'react-hook-form'

type Assign<T extends object, U extends object> = T & Omit<U, keyof T>

export type FieldValuesFromFieldErrors<TFieldErrors> =
  TFieldErrors extends FieldErrors<infer TFieldValues> ? TFieldValues : never

type AsProps<TAs> = TAs extends undefined
  ? {}
  : TAs extends React.ReactElement
  ? Record<string, any>
  : TAs extends React.ComponentType<infer P>
  ? Omit<P, 'children'>
  : TAs extends keyof JSX.IntrinsicElements
  ? JSX.IntrinsicElements[TAs]
  : never

export type Props<
  TFieldErrors extends FieldErrors,
  TAs extends
    | undefined
    | React.ReactElement
    | React.ComponentType<any>
    | keyof JSX.IntrinsicElements
> = Assign<
  {
    as?: TAs
    errors?: TFieldErrors
    name: FieldName<FieldValuesFromFieldErrors<TFieldErrors>>
    message?: Message
    index?: number
    fieldArrayValueProp?: string
    render?: (data: {
      message: Message
      messages?: MultipleFieldErrors
    }) => React.ReactNode
  },
  AsProps<TAs>
>

export const HookFormError = <
  TFieldErrors extends FieldErrors,
  TAs extends
    | undefined
    | React.ReactElement
    | React.ComponentType<any>
    | keyof JSX.IntrinsicElements = undefined
>({
  as,
  // errors,
  name,
  message,
  index,
  render,
  fieldArrayValueProp = 'value',
  ...rest
}: Props<TFieldErrors, TAs>) => {
  const methods = useFormContext()

  if (!methods) return null
  const error =
    index == null
      ? methods.formState?.errors?.[name]
      : methods.formState?.errors?.[name]?.[index]?.[fieldArrayValueProp]

  if (!error || !error.message) {
    return null
  }

  const { message: messageFromRegister, types } = error
  if (!messageFromRegister) {
    return null
  }

  const props = Object.assign({}, rest, {
    children: messageFromRegister || message,
  })

  return React.isValidElement(as)
    ? React.cloneElement(as, props)
    : render
    ? (render({
        message: (messageFromRegister || message) as string,
        messages: types as MultipleFieldErrors,
      }) as React.ReactElement)
    : React.createElement((as as string) || React.Fragment, props as any)
}
