import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm, Controller, useWatch, FormProvider } from 'react-hook-form'
// import { DevTool as HookFormDevtools } from '@hookform/devtools'
import { useMutation } from '@tanstack/react-query'
import { Button, Text, Icon } from '@shopify/polaris'
import { AlertMinor } from '@shopify/polaris-icons'
import { zodResolver } from '$lib/zod-resolver'
import * as api from '$lib/shopify-api'
import { Select, MetafieldSelect } from '$ui/Select'
import { Input } from '$ui/Dumb'
import { toast } from '$ui/Toast'
import { TypeAhead } from '$ui/TypeAhead'
import { ConfirmButton } from '$ui/Button'
import { MetafieldValueField } from './MetafieldValueField'

import {
  MetafieldSavableType,
  MetafieldSavableTypes,
} from '$utils/mf-type-validators'
import {
  Metafield,
  ResourceItem,
  Routes,
  MetafieldType,
  ApiValidationError,
  MetafieldCreateInput,
} from '$types'
import {
  createNamespaceKeyUid,
  DEV,
  generateUid,
  getErrorMessage,
  Logger,
  MF_UTILS,
  resourceByRoute,
  sortMetafields,
} from '$utils'
import { MetafieldFormSchema } from './mf-form-schema'
import { qClient } from '$query-clients'
import { queries } from '$queries'
import { useUpdateEffect } from 'ariakit-react-utils'

const SAVE_AS_OPTIONS = MetafieldSavableTypes.map(x => ({
  label: x.title,
  value: x.type,
  disabled: x.type === '_unsupported_',
}))

const RHF_SET_VALUE_OPTS = {
  shouldDirty: true,
  shouldTouch: true,
  shouldValidate: true,
} as const

const DEFAULT_MF_TYPE: MetafieldType['any'] = 'single_line_text_field'
export const MetafieldsEditForm = React.memo(
  _MetafieldsEditForm,
  (prev, next) => {
    const prevKey = `${prev.resourceItem.id}`
    const nextKey = `${next.resourceItem.id}`

    const prevMfKeys = prev.metafields
      .map(x => `${x.id}_${x.updated_at}`)
      .join(',')
    const nextMfKeys = next.metafields
      .map(x => `${x.id}_${x.updated_at}`)
      .join(',')

    // console.log(
    //   `Props are "${
    //     prevKey === nextKey && prevMfKeys === nextMfKeys
    //       ? 'EQUAL (skip rerender)'
    //       : 'NOT EQUAL (will rerender)'
    //   }"`
    // )

    return prevKey === nextKey && prevMfKeys === nextMfKeys
  }
)

function _MetafieldsEditForm({
  resourceItem,
  metafields,
  metafieldsIndexed: indexedMfs,
}: {
  resourceItem: ResourceItem
  metafields: Metafield[]
  metafieldsIndexed: { [_uid: string]: Metafield }
}) {
  const resource = resourceByRoute[resourceItem.__route]
  const rhf = useForm<MetafieldFormSchema>({
    defaultValues: {
      indexedMfs: indexedMfs,
      _uid: null,
      key: '',
      namespace: '',
      value: '',
      _code_editor: false,
      values: [{ id: 'initial', value: '' }],
      saveAsType: DEFAULT_MF_TYPE,
    },
    resolver: zodResolver(MetafieldFormSchema),
    reValidateMode: 'onBlur',
    mode: 'onSubmit',
  })

  const {
    register,
    handleSubmit,
    getValues,
    reset: resetForm,
    formState: {
      errors,
      touchedFields,
      isDirty: isDirtyForm,
      isValid: isValidForm,
    },
    control,
    trigger: rhfTrigger,
    setValue: rhfSetValue,
  } = rhf

  const saveAsType = useWatch({ control, name: 'saveAsType' })
  const savableType = MF_UTILS.savableType(saveAsType)

  const saveAsOptions = useMemo(() => {
    // un-supported ? append it to the option (disabled)
    return savableType._unsupported
      ? SAVE_AS_OPTIONS.concat([
          {
            label: `${saveAsType} (unsupported)`,
            value: saveAsType,
            disabled: true,
          },
        ])
      : SAVE_AS_OPTIONS
  }, [saveAsType, savableType])

  const resetWith = useCallback(
    (
      mf?: Metafield | null,
      _indexedMfs: { [_uid: string]: Metafield } = indexedMfs
    ) => {
      const type = (!mf
        ? DEFAULT_MF_TYPE
        : mf.type === '_unsupported_'
        ? mf._orignalType
        : mf.type) as unknown as MetafieldType['any']

      const wasUsingEditor = getValues()._code_editor
      const displayEditor = mf
        ? MF_UTILS.canShowEditor(mf.type) && wasUsingEditor
        : wasUsingEditor

      resetForm({
        indexedMfs: _indexedMfs,
        _uid: mf?._uid ?? null,
        namespace: mf?.namespace ?? '',
        key: mf?.key ?? '',
        saveAsType: type,
        values: mf?.values ?? [{ id: 'initial', value: '' }],
        value: mf?.value ?? '',
        _code_editor: displayEditor,
      })
    },
    [resetForm, indexedMfs, getValues]
  )

  // Sync/reset form whenever we CRUD
  // (`indexedMfs` gets updated when we CRUD) and this effets re-runs
  useUpdateEffect(() => {
    const { namespace, key, _uid: __uid } = getValues()
    const _uid = __uid || createNamespaceKeyUid({ namespace, key })
    const mf = indexedMfs[_uid]
    Logger('<- CRUD reset ->', {
      metadata: {
        mf,
        indexedMfs,
      },
    })

    resetWith(mf, indexedMfs)
  }, [getValues, resetForm, indexedMfs])

  const selectedUid = useWatch({ control, name: '_uid' })

  const currentMf: Metafield | null = selectedUid
    ? indexedMfs[selectedUid]
    : null

  const dupId: string | null = (errors.key as any)?.params?.duplicate_mf_uid
  const dupicateMf = dupId ? indexedMfs[dupId] : null

  const { namespaceKeyOptions, uniqNamespaces } = useMemo(() => {
    const ns = metafields.reduce<{
      list: string[]
      index: { [namespace: string]: { value: string; label: string }[] }
    }>(
      (acc, mf) => {
        if (!acc.index[mf.namespace]) {
          acc.index[mf.namespace] = []
          acc.list.push(mf.namespace)
        }

        acc.index[mf.namespace].push({ value: mf._uid, label: mf.key })
        return acc
      },
      {
        list: [],
        index: {},
      }
    )

    const selectOptions = Object.entries(ns.index).map(
      ([namespace, namespaceKeyOptions]) => ({
        title: namespace,
        options: namespaceKeyOptions,
      })
    )

    return {
      namespaceKeyOptions: [
        {
          label: 'Create new metafield',
          value: '',
        },
        ...selectOptions,
      ],
      uniqNamespaces: ns.list,
    }
  }, [metafields])

  const createMutation = useMutation({
    mutationFn: async (value: Parameters<typeof api.metafield.create>[0]) => {
      return api.metafield.create(value)
    },
    onSuccess: async (resp, value) => {
      resetWith(resp)
      toast.success(`"${resp.namespace}.${resp.key}" created`)

      //await qClient.invalidateQueries({ queryKey: [{ scope: 'metafield' }] })
      // Update cache
      {
        qClient.setQueryData<{
          metafields: Metafield[]
          metafieldsIndexed: { [_uid: string]: Metafield }
        }>(
          queries.metafield.list({
            ownerResource: resourceByRoute[resourceItem.__route].ownerResource,
            ownerResourceId: resourceItem.id,
          }).queryKey,
          data => {
            const nextIndexed = {
              ...data?.metafieldsIndexed,
              [resp._uid]: resp,
            }
            return {
              metafields: data
                ? sortMetafields([...data.metafields, resp])
                : [resp],
              metafieldsIndexed: nextIndexed,
            }
          }
        )
      }
    },
    onError: (error, value) => {
      const { namespace, key } = value.input
      const msg =
        error instanceof ApiValidationError
          ? error.message
          : `Error creating "${namespace}.${key}"`
      if (error instanceof Error) {
        Logger(msg, { type: 'error', metadata: { error, value }, log: true })
      }
      toast.error(msg)
    },
    onMutate: () => {
      updateMutation.reset()
      deleteMutation.reset()
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (
      input: Omit<Metafield, 'value'> & { value: MetafieldCreateInput['value'] }
    ) => {
      const supported = MetafieldSavableType[input.type]
      const type = supported
        ? input.type
        : (input._orignalType as MetafieldType['any'])
      return api.metafield.update({
        id: input.id,
        // Allow unsupported metafields
        type,
        value: input.value,
      })
    },
    onSuccess: async (resp, input) => {
      resetWith(resp)
      toast.success(`"${resp.namespace}.${resp.key}" updated`)
      // Update cache
      {
        qClient.setQueryData<{
          metafields: Metafield[]
          metafieldsIndexed: { [_uid: string]: Metafield }
        }>(
          queries.metafield.list({
            ownerResource: resourceByRoute[resourceItem.__route].ownerResource,
            ownerResourceId: resourceItem.id,
          }).queryKey,
          data => {
            const nextIndexed = {
              ...data?.metafieldsIndexed,
              [resp._uid]: resp,
            }
            return {
              metafields: data
                ? data.metafields.map(x => (x.id === resp.id ? resp : x))
                : [resp],
              metafieldsIndexed: nextIndexed,
            }
          }
        )
      }
    },
    onError: (error, input) => {
      const msg =
        error instanceof ApiValidationError
          ? error.message
          : `Error updating metafield`

      if (error instanceof Error) {
        Logger(msg, { type: 'error', metadata: { error, input }, log: true })
      }
      toast.error(msg)
    },
    onMutate: () => {
      createMutation.reset()
      deleteMutation.reset()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (input: Metafield) => {
      return api.metafield.delete(input.id)
    },
    onSuccess: (resp, input) => {
      resetForm()
      toast.success(`"${input.namespace}.${input.key}" deleted`)

      // Update cache
      {
        qClient.setQueryData<{
          metafields: Metafield[]
          metafieldsIndexed: { [_uid: string]: Metafield }
        }>(
          queries.metafield.list({
            ownerResource: resourceByRoute[resourceItem.__route].ownerResource,
            ownerResourceId: resourceItem.id,
          }).queryKey,
          data => {
            if (data) {
              const nextIndexed = { ...data.metafieldsIndexed }
              delete nextIndexed[input._uid]
              return {
                metafields: data.metafields.filter(x => x.id !== input.id),
                metafieldsIndexed: nextIndexed,
              }
            }
          }
        )
      }
    },
    onError: (error, value) => {
      const msg =
        error instanceof ApiValidationError
          ? error.message
          : `Error updating metafield`

      if (error instanceof Error) {
        Logger(msg, { type: 'error', metadata: { error, value }, log: true })
      }
      toast.error(msg)
    },
    onMutate: () => {
      createMutation.reset()
      updateMutation.reset()
    },
  })

  if (DEV) {
    ;(window as any).rhf = rhf
    ;(window as any).MetafieldFormSchema = MetafieldFormSchema
  }

  const editing = !!currentMf
  const deleting = deleteMutation.isLoading
  const updating = updateMutation.isLoading
  const creating = createMutation.isLoading
  const hasPendingMutation = deleting || updating || creating
  // const uniqId = `${currentMf?.id || resourceItem.id}`
  const serverErrored =
    createMutation.isError || updateMutation.isError || deleteMutation.isError

  // console.log('isDirtyForm', isDirtyForm)
  // console.log('isValidForm', isValidForm)
  // console.log('errros', errors)

  return (
    <>
      <FormProvider {...rhf}>
        <div className="grid gap-6">
          <Text as="h3" variant="headingMd" color="subdued">
            {currentMf ? `Editing ${currentMf._uid}` : 'Creating new metafield'}
          </Text>

          <form
            method="post"
            className={
              hasPendingMutation
                ? 'disabled pointer-events-none opacity-75'
                : undefined
            }
            onSubmit={handleSubmit(data => {
              // If using `code editor`
              // we track/update `value`
              // otherwise track/update `values`
              const value = data._code_editor ? data.value : data.values
              currentMf
                ? updateMutation.mutate({
                    ...currentMf,
                    type: data.saveAsType,
                    value,
                  })
                : createMutation.mutate({
                    input: {
                      key: data.key,
                      namespace: data.namespace,
                      type: data.saveAsType,
                      value,
                    },
                    item: resourceItem,
                  })
            })}
          >
            <div className="grid gap-6">
              <Controller
                name="_uid"
                control={control}
                render={({ field }) => (
                  // <Select
                  //   autoFocus
                  //   label={
                  //     metafields.length > 0
                  //       ? 'Edit existing or create new'
                  //       : 'Create new'
                  //   }
                  //   options={namespaceKeyOptions}
                  //   {...field}
                  //   value={selectedUid || ''}
                  //   onChange={selected => {
                  //     // field.onChange(selected || null)
                  //     const existing = selected ? indexedMfs[selected] : null
                  //     resetWith(existing)
                  //   }}
                  // />

                  <MetafieldSelect
                    metafields={metafields}
                    selectedMetafield={currentMf}
                    onSelect={mf => {
                      resetWith(mf)
                    }}
                    label={
                      metafields.length > 0
                        ? 'Edit existing or create new'
                        : 'Create new'
                    }
                  />
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <div className="w-full">
                  <Controller
                    name="namespace"
                    control={control}
                    render={({ field }) => (
                      <TypeAhead
                        {...field}
                        label="Namespace"
                        placeholder="Select or enter a namespace"
                        options={uniqNamespaces}
                        dropdownTitle="Existing namespace(s)"
                        disabled={editing}
                        error={
                          touchedFields.namespace && errors.namespace?.message
                        }
                      />
                    )}
                  />
                </div>

                <div className="w-full">
                  <Input
                    {...register('key')}
                    label="Key"
                    autoComplete="off"
                    placeholder="key"
                    disabled={editing}
                    showError={touchedFields.key ?? false}
                    error={errors.key?.message}
                  />
                  {touchedFields.key && errors.key?.message && dupicateMf && (
                    <p>
                      Select{' '}
                      <Button plain onClick={() => resetWith(dupicateMf)}>
                        {dupicateMf._uid}
                      </Button>
                      ?
                    </p>
                  )}
                </div>

                <div className="w-full">
                  <Controller
                    name="saveAsType"
                    control={control}
                    render={({ field }) => (
                      <Select
                        label="Save as"
                        disabled={false}
                        options={saveAsOptions}
                        {...field}
                        onChange={(nextSaveAsType: MetafieldType['any']) => {
                          field.onChange(nextSaveAsType)
                          // Revalidate `value` whenever 'saveAsType' changes

                          const nextSavableType =
                            MetafieldSavableType[nextSaveAsType] ||
                            MetafieldSavableType['_unsupported_']

                          const nextSavableBaseType =
                            MetafieldSavableType[nextSavableType.baseType]
                          const nextValue =
                            nextSavableBaseType.defaultStringValue ?? ''

                          const nextSaveAsTypeIsJson =
                            MF_UTILS.isMetafieldTypeJson(nextSaveAsType)
                          if (!nextSaveAsTypeIsJson) {
                            rhfSetValue('_code_editor', false)
                          }

                          rhfSetValue(
                            'values',
                            [
                              {
                                id: generateUid(),
                                value: nextValue,
                              },
                            ],
                            RHF_SET_VALUE_OPTS
                          )

                          rhfSetValue(
                            'value',
                            nextSavableType.defaultStringValue,
                            {
                              shouldDirty: true,
                              shouldTouch: true,
                              shouldValidate: false,
                            }
                          )
                        }}
                      />
                    )}
                  />
                  {errors.saveAsType?.message && (
                    <p>{errors.saveAsType.message}</p>
                  )}
                </div>
              </div>

              <div>
                <MetafieldValueField
                  key={saveAsType + `${currentMf?.id + ''}` + metafields.length}
                  control={control}
                  saveAsType={saveAsType}
                  currentMf={currentMf}
                  rhfTrigger={rhfTrigger}
                  rhfSetValue={rhfSetValue}
                  register={register}
                  rhfGetValues={getValues}
                />
              </div>

              {serverErrored && (
                <div>
                  {createMutation.isError && (
                    <ServerErrorMessage
                      error={createMutation.error}
                      fallbackError="Could not create metafield. Try again?"
                    />
                  )}
                  {updateMutation.isError && (
                    <ServerErrorMessage
                      error={updateMutation.error}
                      fallbackError="Could not update metafield. Try again?"
                    />
                  )}
                  {deleteMutation.isError && (
                    <ServerErrorMessage
                      error={deleteMutation.error}
                      fallbackError="Could not delete metafield. Try again?"
                    />
                  )}
                </div>
              )}

              {/* {exampleHtmlJsx && <div className="mt-2">{exampleHtmlJsx}</div>} */}
              <ExampleValue saveAsType={saveAsType} />
              {currentMf && (
                <LiquidSelector
                  route={resourceItem.__route}
                  metafield={currentMf}
                />
              )}

              <div className="flex justify-end gap-x-2">
                <Button
                  monochrome
                  onClick={() => {
                    const id = rhf.getValues('_uid')
                    const existing = id ? rhf.getValues('indexedMfs')[id] : null
                    resetWith(existing)
                  }}
                >
                  Reset form
                </Button>

                {currentMf && (
                  <ConfirmButton
                    countDownSeconds={5}
                    onStatusChange={({ status, proceed }) => {
                      if (status === 'confirmed') {
                        deleteMutation.mutateAsync(currentMf).finally(() => {
                          proceed()
                        })
                      }
                    }}
                  >
                    {({ status, proceed, timer }) => (
                      <div style={{ color: 'var(--p-interactive-critical)' }}>
                        <Button
                          outline
                          monochrome
                          disabled={false}
                          loading={false}
                          onClick={proceed}
                        >
                          {status === 'pending'
                            ? `Are you sure? (${timer})`
                            : status === 'confirmed' || deleteMutation.isLoading
                            ? 'Deleting...'
                            : `Delete`}
                        </Button>
                      </div>
                    )}
                  </ConfirmButton>
                )}

                <Button
                  submit
                  primary
                  disabled={
                    !isDirtyForm || /* !isValidForm ||*/ hasPendingMutation
                  }
                  loading={creating || updating}
                >
                  {editing
                    ? updating
                      ? 'Updating...'
                      : 'Update'
                    : creating
                    ? 'Creating...'
                    : 'Create'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </FormProvider>
      {/* <HookFormDevtools control={control} /> */}
    </>
  )
}

function ServerErrorMessage({
  prefixText = 'Server error:',
  error,
  fallbackError = 'Oops - it did not go as expected. Try again?',
}: {
  prefixText?: string
  error: unknown
  fallbackError?: string
}) {
  if (!error) return null
  const errMsg = getErrorMessage(error)
  return (
    <div className="">
      <div className="inline-flex  flex-wrap gap-1 rounded-[var(--p-border-radius-1)]">
        <div>
          <Icon source={AlertMinor} color="critical" />
        </div>

        <Text color="critical" variant="bodyMd" as="p">
          {prefixText} {errMsg ? errMsg : fallbackError}
        </Text>
      </div>
    </div>
  )
}

function ExampleValue({ saveAsType }: { saveAsType: MetafieldType['any'] }) {
  const [showing, setShowing] = useState(false)

  const savableType = MF_UTILS.savableType(saveAsType)
  const savableExample = savableType.example
    ? savableType.isList
      ? savableType.example.list
      : savableType.example.single
    : null

  return (
    <div className="grid gap-2 justify-items-start">
      <Button
        plain
        disclosure={showing ? 'up' : 'down'}
        onClick={() => {
          setShowing(!showing)
        }}
      >
        {showing ? 'Hide example value' : 'Show example value'}
      </Button>

      {showing && savableExample ? (
        <div className="text-sm bg-slate-50 p-2 divide-y">
          <div
            className="text-slate-500 mb-2 text-xs"
            dangerouslySetInnerHTML={{
              __html: savableExample.description,
            }}
          ></div>

          <div
            className="prose prose-sm w-full max-w-full"
            dangerouslySetInnerHTML={{
              __html: savableExample.value,
            }}
          ></div>
        </div>
      ) : null}
    </div>
  )
}

function LiquidSelector({
  route,
  metafield: { type: mfType, namespace: ns, key },
}: {
  route: Routes['any']
  metafield: Metafield
}) {
  const savableType = MetafieldSavableType[mfType]
  const depricated = savableType.deprecated

  // const value = `{%- assign metafield_value = ${
  //   route.endsWith('s') ? route.slice(0, -1) : route
  // }.metafields.${ns}.${key}${depricated ? '' : '.value'} -%}`

  const value = `{{ ${
    route.endsWith('s') ? route.slice(0, -1) : route
  }.metafields.${ns}.${key}${depricated ? '' : '.value'} }}`

  return (
    <div className="mt-0 ">
      <Text as="h5" variant="bodyMd" fontWeight="semibold">
        Liquid selector&thinsp;:
      </Text>
      <div className="prose prose-sm max-w-none">
        <code>{value}</code>
      </div>
    </div>
  )
}
