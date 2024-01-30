import {
  useState,
  useEffect,
  useCallback,
  ReactNode,
  memo,
  Suspense,
  useRef,
} from 'react'
import {
  Control,
  useFieldArray,
  UseFormSetValue,
  UseFormGetValues,
  UseFormTrigger,
  UseFormRegister,
  useWatch,
  Controller,
  useFormContext,
} from 'react-hook-form'
import { Button, ButtonGroup } from '@shopify/polaris'
import { PlusIcon } from '@shopify/polaris-icons'
import { Select } from '$ui/Select'
import { ToggleSwitch } from '$ui/ToggleSwitch'
import {
  // CollectionInline,
  PageInline,
  // ProductInline,
  // VariantInline,
  PreviewableMediaInline,
} from '$ui/MediaInline'
import { InlineError, Input, InputNumber, Label, TextArea } from '$ui/Dumb'
import { HookFormError } from '$ui/HookFormError'
import { ColorPicker } from '$ui/ColorPicker'
import { MetafielValueMonaco } from './MetafieldValueMonaco'
import type { EditorRef } from './MetafieldValueMonaco'
import { Reorder } from '$ui/Reorder'
import { useLiveRef, useUpdateEffect } from '$hooks'

import { generateUid, MF_UTILS } from '$utils'
import { Metafield, MetafieldType } from '$types'
import { JsonStringify, safeJsonParse } from '$utils'
import { MetafieldFormSchema } from './mf-form-schema'
import { ResourcePicker } from '$common/ui/ResourcePicker'

// const MetafielValueMonacoLazy = lazy(() =>
//   import('./MetafieldValueMonaco').then(mod => ({
//     default: mod.MetafielValueMonaco,
//   }))
// )

const monacoSupportedLangs = [
  { label: 'HTML', value: 'html' },
  { label: 'CSS', value: 'css' },
  { label: 'javascript', value: 'javascript' },
  { label: 'JSON', value: 'json' },
  { label: 'Plain text', value: 'plaintext' },
] as const

const RHF_SET_VALUE_OPTS = {
  true: {
    shouldDirty: true,
    shouldTouch: true,
    shouldValidate: true,
  },

  false: {
    shouldDirty: false,
    shouldTouch: false,
    shouldValidate: false,
  },
} as const

export const MetafieldValueField = memo(
  function MetafieldValueField({
    control,
    saveAsType,
    currentMf,
    rhfTrigger,
    rhfSetValue,
    register,
    rhfGetValues,
  }: {
    control: Control<MetafieldFormSchema>
    saveAsType: MetafieldType['any']
    currentMf: Metafield | null
    rhfTrigger: UseFormTrigger<MetafieldFormSchema>
    rhfSetValue: UseFormSetValue<MetafieldFormSchema>
    register: UseFormRegister<MetafieldFormSchema>
    rhfGetValues: UseFormGetValues<MetafieldFormSchema>
  }) {
    const savableType = MF_UTILS.savableType(saveAsType)
    const savableBaseType = MF_UTILS.savableBaseType(saveAsType)
    const isListType = MF_UTILS.isListType(saveAsType)

    const fieldArray = useFieldArray({
      control,
      name: 'values',
      keyName: '_id',
    })
    const editorRef: EditorRef = useRef(null)

    const { isDirty, submitCount, isSubmitted } = useFormContext().formState

    // Reset Monaco value when form resets
    // https://github.com/react-hook-form/react-hook-form/discussions/2993
    useUpdateEffect(() => {
      // this is a way to listen for the form reset() function call
      if (!isSubmitted && submitCount != null && !isDirty) {
        // reset when form is reset
        // const value = rhfGetValues('value')
        const value = currentMf?.value ?? ''
        editorRef.current?.setValue(value)
      }
      // eslint-disable-next-line
    }, [isDirty, currentMf, submitCount, isSubmitted])

    const isCodeEditor = useWatch({
      control,
      name: '_code_editor',
    })

    const setIsCodeEditor = useCallback(
      (bool: boolean) => {
        rhfSetValue('_code_editor', bool)
      },
      [rhfSetValue]
    )

    const [lang, setLang] =
      useState<typeof monacoSupportedLangs[number]['value']>('plaintext')
    const saveAsTypeRef = useLiveRef(saveAsType)

    // Sync Language/editor
    useEffect(() => {
      const isJsonType = MF_UTILS.isMetafieldTypeJson(saveAsType)
      if (isJsonType) {
        setLang('json')
      } else if (
        saveAsType === 'multi_line_text_field' ||
        saveAsType === 'string'
      ) {
        setLang('plaintext')
      }
    }, [saveAsType])

    // Sync `values` <-> `value` when changing from `code editor` to `UI fields`
    const onToggleCodeEditor = useCallback(
      (nextIsCodeEditor: boolean) => {
        setIsCodeEditor(nextIsCodeEditor)

        if (nextIsCodeEditor) {
          const saveableBaseType = MF_UTILS.savableBaseType(
            saveAsTypeRef.current
          )

          // We're showing code editor
          // Convert `values` to `value` string list (JSON stringify)
          const valuesArray = rhfGetValues('values')
            .map(x => {
              // validate each value
              const validationError = saveableBaseType.validate(x.value)
              const invalidValue = validationError != null
              if (invalidValue) {
                return savableType.isList
                  ? safeJsonParse(
                      saveableBaseType.defaultStringValue,
                      saveableBaseType.defaultStringValue
                    )
                  : saveableBaseType.defaultStringValue
              }

              // if valid - use it
              // otherwise - use defualt value
              return savableType.isList
                ? safeJsonParse(x.value, x.value).toString()
                : x.value
            })
            .filter(x => x !== '')

          const value = savableType.isList
            ? JSON.stringify(valuesArray, null, 2)
            : valuesArray[0] || savableType.defaultStringValue
          console.log(savableType.isList, valuesArray, { value })
          rhfSetValue('value', value)
        } else {
          // We're showing UI fields
          // Convert (parse) `value` to `values`
          // `value` could be a string list
          const value = rhfGetValues('value')
          let values = safeJsonParse(value, value, savableType.isList) as
            | string[]
            | string

          if (Array.isArray(values)) {
            if (!savableType.isList) {
              values = [JSON.stringify(values, null, 2)]
            }
          }

          // must be in array
          if (!Array.isArray(values)) values = [values as any]

          rhfSetValue(
            'values',
            values.map(v => ({
              id: generateUid(),
              value: typeof v !== 'string' ? JSON.stringify(v, null, 2) : v,
            })),
            RHF_SET_VALUE_OPTS.true
          )
        }
      },
      [rhfGetValues, rhfSetValue, saveAsTypeRef, setIsCodeEditor, savableType]
    )

    // useUpdateEffect(() => {

    // }, [isCodeEditor])

    const isJsonType = saveAsType
      ? MF_UTILS.isMetafieldTypeJson(saveAsType)
      : false

    const showCodeEditorToggle = MF_UTILS.canShowEditor(saveAsType)

    // eslint-disable-next-line
    const Component = COMPONENT_MAP[savableType.baseType]
    const isValidJson = true

    return (
      <div className="grid gap-1">
        <div className="relative flex gap-4 items-center">
          <Label>Set metafield value</Label>

          {showCodeEditorToggle && (
            <>
              <div className="border-l h-2/4" role="presentation">
                <span className="invisible" aria-hidden="true">
                  a
                </span>
              </div>

              <Button
                variant="plain"
                onClick={() => {
                  onToggleCodeEditor(!isCodeEditor)
                }}
              >
                {isCodeEditor ? `Hide code editor` : 'Show code editor'}
              </Button>
            </>
          )}

          {/* Never show language selector on `json types` - because the language must be json in that case */}
          {isCodeEditor &&
            !isJsonType &&
            (saveAsType === 'multi_line_text_field' ||
              saveAsType === 'string') && (
              <>
                <div className="border-l h-2/4" role="presentation">
                  <span className="invisible" aria-hidden="true">
                    a
                  </span>
                </div>

                <Select
                  label=""
                  value={lang}
                  options={monacoSupportedLangs as any}
                  onChange={newLang => setLang(newLang as any)}
                  disabled={isJsonType}
                />
              </>
            )}
        </div>

        {!isCodeEditor && (
          <div className="grid gap-4">
            <Reorder.Group
              key={fieldArray.fields.length}
              axis="y"
              className="space-y-4"
              values={fieldArray.fields}
              onReorder={reorderedFields => {
                if (Array.isArray(reorderedFields)) {
                  rhfSetValue('values', reorderedFields as any, {
                    shouldDirty: true,
                    shouldTouch: true,
                  })
                }
              }}
            >
              {fieldArray.fields.map((item, index) => {
                const name = `values.${index}.value` as const
                const latestValue = rhfGetValues(name)
                item.value = latestValue
                const registered = register(name)

                let componentJsx: ReactNode = null
                const componentKey = item.id

                if (Component === Input) {
                  componentJsx = (
                    <Input
                      key={item.id}
                      {...registered}
                      defaultValue={item.value}
                    />
                  )
                } else if (Component === InputNumber) {
                  componentJsx = (
                    <InputNumber
                      key={item.id}
                      defaultValue={item.value}
                      {...registered}
                    />
                  )
                } else if (Component === ToggleSwitch) {
                  componentJsx = (
                    <ToggleSwitch
                      key={item.id}
                      {...registered}
                      defaultChecked={
                        typeof item.value === 'string'
                          ? safeJsonParse(false, item.value)
                          : item.value
                      }
                      onChange={nextChecked => {
                        const next = nextChecked.toString()
                        rhfSetValue(name, next, RHF_SET_VALUE_OPTS.true)
                      }}
                    />
                  )
                } else if (Component === ColorPicker) {
                  componentJsx = (
                    <ColorPicker
                      key={item.id}
                      {...registered}
                      // color={item.value}
                      defaultColor={item.value}
                      onChange={newColor => {
                        rhfSetValue(name, newColor, RHF_SET_VALUE_OPTS.true)
                      }}
                    />
                  )
                  // } else if (Component === ProductInline) {
                  //   componentJsx = (
                  //     <ProductInline key={item.id} id={latestValue} />
                  //   )
                  // } else if (Component === VariantInline) {
                  //   componentJsx = (
                  //     <VariantInline key={item.id} id={latestValue} />
                  //   )
                } else if (Component === PageInline) {
                  componentJsx = <PageInline key={item.id} id={latestValue} />
                  // } else if (Component === CollectionInline) {
                  //   componentJsx = (
                  //     <CollectionInline key={item.id} id={latestValue} />
                  //   )
                } else if (Component === PreviewableMediaInline) {
                  componentJsx = (
                    <PreviewableMediaInline key={item.id} id={latestValue} />
                  )
                } else if (!Component || Component === TextArea) {
                  componentJsx = (
                    <TextArea
                      key={item.id}
                      defaultValue={item.value}
                      {...registered}
                    />
                  )
                }

                return (
                  <Reorder.Item
                    drag={savableType.isList ?? false}
                    value={item}
                    key={item.id}
                    onRemove={
                      savableType.isList
                        ? () => {
                            fieldArray.remove(index)
                          }
                        : undefined
                    }
                  >
                    <div>{componentJsx}</div>
                    <HookFormError
                      name={'values'}
                      index={index}
                      render={({ message, messages }) => (
                        <div className="mt-2">
                          <InlineError>{message}</InlineError>
                        </div>
                      )}
                    ></HookFormError>
                  </Reorder.Item>
                )
              })}
            </Reorder.Group>

            {savableBaseType.searchResultType && (
              <ResourcePicker
                key={`${saveAsType}_${savableBaseType.searchResultType}`}
                searchType={savableBaseType.searchResultType}
                initialSelected={fieldArray.fields.map(x => x.value)}
                multiple={isListType}
                onChange={selectedIds => {
                  rhfSetValue(
                    'values',
                    selectedIds.map(id => ({
                      id: generateUid(),
                      value: id,
                    })),
                    {
                      shouldTouch: true,
                      shouldDirty: true,
                      shouldValidate: true,
                    }
                  )
                }}
              />
            )}

            {/* Hide if we can show resource picker */}
            {savableType.isList && !savableBaseType.searchResultType && (
              <div>
                <Button
                  icon={PlusIcon}
                  onClick={() => {
                    fieldArray.append({
                      id: generateUid(),
                      value: savableBaseType.defaultStringValue,
                    })
                  }}
                >
                  Add more
                </Button>
              </div>
            )}
          </div>
        )}

        {isCodeEditor && (
          <Controller
            name="value"
            control={control}
            defaultValue={rhfGetValues('value')}
            render={({ field }) => {
              return (
                <MetafielValueMonaco
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  lang={isJsonType ? 'json' : lang}
                  saveAsType={saveAsType}
                  defaultValue={field.value}
                  editorRef={editorRef}
                />
                //   <Suspense
                //   fallback={
                //     <div className="px-2 py-4">
                //       <SkeletonBodyText lines={7} />
                //     </div>
                //   }
                // >
                // </Suspense>
              )
            }}
          />
        )}

        {isJsonType &&
          showCodeEditorToggle &&
          (!savableType.isList || isCodeEditor) &&
          isCodeEditor && (
            <div className="mt-3">
              <ButtonGroup>
                <Button
                  disabled={!isValidJson}
                  onClick={() => {
                    try {
                      const minified = JsonStringify(
                        JSON.parse(rhfGetValues('value')),
                        0
                      )

                      rhfSetValue('value', minified)
                      editorRef.current?.setValue(minified)
                      if (fieldArray.fields[0]) {
                        fieldArray.fields[0].value = minified
                      }
                    } catch (error) {
                      alert('Invalid JSON - Unable to minify')
                    }
                  }}
                  size="slim"
                >
                  Minify JSON
                </Button>
                <Button
                  disabled={!isValidJson}
                  onClick={() => {
                    try {
                      const prettified = JsonStringify(
                        JSON.parse(rhfGetValues('value')),
                        2
                      )

                      rhfSetValue('value', prettified)
                      if (fieldArray.fields[0]) {
                        fieldArray.fields[0].value = prettified
                      }
                      editorRef.current?.setValue(prettified)
                    } catch (error) {
                      alert('Invalid JSON - Unable to prettify')
                    }
                  }}
                  size="slim"
                >
                  Prettify JSON
                </Button>
              </ButtonGroup>
            </div>
          )}

        <HookFormError
          name="value"
          render={({ message, messages }) => (
            <div className="MfValueError">
              <InlineError>{message}</InlineError>
            </div>
          )}
        ></HookFormError>
      </div>
    )
  },
  function areEqual(prev, next) {
    // control,
    // saveAsType,
    // rhfTrigger,
    // rhfSetValue,
    // register,
    // rhfGetValues,
    return false
    return (
      prev.saveAsType === next.saveAsType && prev.currentMf === next.currentMf
    )
  }
)

// const NullComponent = () => null
const COMPONENT_MAP: Record<
  MetafieldType['single'],
  React.FC<any> //|  React.ForwardRefExoticComponent<{ onChange?: any }> |
> = {
  boolean: ToggleSwitch,
  collection_reference: PreviewableMediaInline, // TextArea,
  color: ColorPicker,
  date: Input,
  date_time: Input,
  dimension: TextArea,
  file_reference: PreviewableMediaInline, // TextArea,
  json: TextArea,
  money: TextArea,
  multi_line_text_field: TextArea,
  metaobject_reference: Input,
  mixed_reference: Input,
  number_decimal: InputNumber,
  number_integer: InputNumber,
  page_reference: PageInline, // TextArea,
  product_reference: PreviewableMediaInline, // TextArea,
  rating: TextArea,
  single_line_text_field: Input,
  url: Input,
  variant_reference: PreviewableMediaInline, // TextArea,
  volume: TextArea,
  weight: TextArea,

  /** depricated */
  json_string: TextArea,
  string: TextArea,
  integer: InputNumber,

  /** custom */
  _unsupported_: TextArea,
}
