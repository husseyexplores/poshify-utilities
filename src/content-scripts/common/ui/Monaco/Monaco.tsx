import Editor, { useMonaco as useMonacoHook } from '@monaco-editor/react'
import { loader } from '@monaco-editor/react'

import * as monaco from 'monaco-editor'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker&inline'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker&inline'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker&inline'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker&inline'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker&inline'

self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'json') {
      return new jsonWorker()
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return new cssWorker()
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return new htmlWorker()
    }
    if (label === 'typescript' || label === 'javascript') {
      return new tsWorker()
    }
    return new editorWorker()
  },
}

loader.config({ monaco })

export const Monaco = Editor
export const useMonaco = useMonacoHook
export const editor = monaco.editor
