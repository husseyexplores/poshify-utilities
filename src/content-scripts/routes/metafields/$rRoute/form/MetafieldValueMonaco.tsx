import { MutableRefObject, useEffect, useRef } from 'react'
import { Monaco as MonacoEditor, useMonaco } from '$ui/Monaco'
import { emmetHTML, emmetCSS } from 'emmet-monaco-es'
import type { editor } from 'monaco-editor'

import { getMonacoSchema } from '$utils/mf-type-validators'
import { MetafieldType } from '$types'

export type Editor = editor.IStandaloneCodeEditor
export type EditorRef = MutableRefObject<Editor | null | undefined>
export function MetafielValueMonaco({
  value,
  defaultValue,
  onChange,
  onBlur,
  saveAsType,
  editorRef: editorRefProp,
  lang = 'plaintext',
}: {
  value?: string
  defaultValue?: string
  onChange?: (value: string) => any
  onBlur?: () => any
  saveAsType?: MetafieldType['any']
  lang?: string
  editorRef?: EditorRef
}) {
  const monaco = useMonaco()
  const valueRef = useRef(defaultValue ?? '')
  const editorRef = useRef<editor.IStandaloneCodeEditor>()
  const defaultValueRef = useRef(defaultValue ?? '')
  defaultValueRef.current = defaultValue ?? ''

  // const onChangeStable = useEventCallback(onChangeProp)
  // const onChange = useCallback(
  //   (value: string | undefined) => {
  //     if (onChangeStable && value != null) onChangeStable(value)
  //   },
  //   [onChangeStable]
  // )

  // Monaco on mount/change
  useEffect(() => {
    if (monaco) {
      // window.monaco = monaco
      emmetHTML(monaco)
      emmetCSS(monaco)
      const schema = saveAsType ? getMonacoSchema(saveAsType) : null

      monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
        allowComments: false,
        comments: 'error',
        trailingCommas: 'error',
        enableSchemaRequest: false,
        //@ts-ignore
        schemas: schema
          ? [
              {
                fileMatch: ['*'], // [`file:///${saveAsType}`],
                schema: schema,
              },
            ]
          : [
              {
                fileMatch: ['*'], // [`file:///${saveAsType}`],
                schema: {},
              },
            ],
      })
    }
  }, [monaco, saveAsType])

  return (
    <div className="resize-y overflow-y-auto [&>section]:min-h-[220px] w-full">
      <MonacoEditor
        value={value}
        defaultValue={valueRef.current}
        height="100%"
        onChange={x => {
          if (x != null) {
            valueRef.current = x
            // onChange(x)
          }
        }}
        options={{
          minimap: {
            enabled: false,
            maxColumn: 0,
            autohide: true,
            showSlider: 'mouseover',
            size: 'proportional',
          },
          tabSize: 2,
        }}
        width="100%"
        language={lang || 'plaintext'}
        onMount={(editor, _monaco) => {
          if (defaultValueRef.current != null) {
            editor.setValue(defaultValueRef.current)
          }

          if (editorRefProp) {
            editorRefProp.current = editor
          }

          editorRef.current = editor
          editor.updateOptions({
            minimap: {
              enabled: false,
            },
          })

          const toggleWordWrap = () => {
            const prevOpts = editor.getRawOptions()
            editor.updateOptions({
              wordWrap: prevOpts.wordWrap === 'bounded' ? 'off' : 'bounded',
            })
          }
          editor.addAction({
            id: '_toggle_word_wrap',
            label: 'Toggle word wrap',
            keybindings: [_monaco.KeyMod.Alt | _monaco.KeyCode.KeyZ],
            run: toggleWordWrap,
          })
          // Enable word wrap on mount
          toggleWordWrap()

          editor.addAction({
            id: '_open_cmd_pallet',
            label: 'Toggle word wrap',
            keybindings: [_monaco.KeyMod.Alt | _monaco.KeyCode.KeyZ],
            run: () => {
              const prevOpts = editor.getRawOptions()
              editor.updateOptions({
                wordWrap: prevOpts.wordWrap === 'bounded' ? 'off' : 'bounded',
              })
            },
          })

          editor.addCommand(
            _monaco.KeyMod.CtrlCmd |
              _monaco.KeyMod.Shift |
              _monaco.KeyCode.KeyP,
            () => {
              editor.trigger('', 'editor.action.quickCommand', {})
            }
          )

          if (onBlur) {
            editor.onDidBlurEditorText(() => {
              if (valueRef.current != null && onChange) {
                onChange(valueRef.current)
              }
              onBlur()
            })
          }
        }}
      />
    </div>
  )
}
