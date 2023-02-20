import * as z from 'zod'
import { MetafieldSavableType } from '$utils/mf-type-validators'
import { Metafield, MetafieldType } from '$types'
import { createNamespaceKeyUid, typeOf } from '$utils'

const namespaceKeySchema = z
  .string()
  .min(3, { message: 'Must contain at least 3 chars' })
  .max(20, {
    message: 'Max char limit is 20',
  })

const SCHEMAS = {
  namespace: namespaceKeySchema,
  key: namespaceKeySchema,
  mf: Metafield,
}

export const MetafieldFormSchema = z
  .object({
    namespace: SCHEMAS.namespace,
    key: SCHEMAS.key,
    saveAsType: MetafieldType['any'],

    _code_editor: z.boolean(),
    value: z.string(),
    values: Metafield.shape.values,

    // selectedMfUid: z.string().nullable(),
    // mf: SCHEMAS.mf.nullable(),
    // mfs: z.array(SCHEMAS.mf),
    _uid: z
      .string()
      .nullable()
      .refine(x => (x == null ? true : x.split('.').length === 2), {
        message: 'Invalid _uid (selected metafield is incorrect)',
      }),
    indexedMfs: z.custom<z.RecordType<string, Metafield>>(x => {
      return typeOf(x) === 'Object'
    }),
  })

  .superRefine((data, ctx) => {
    // console.log('Superrefine => ', data)
    if (data._uid) {
      let existingMf = data.indexedMfs?.[data._uid]
      if (!existingMf) {
        ctx.addIssue({
          code: 'custom',
          message: `Metafield "${data._uid}" does not exist`,
          path: ['_uid'],
        })
      }
    }

    let isCreatingNew = data._uid === null
    if (isCreatingNew) {
      let nsParsed = SCHEMAS.namespace.safeParse(data.namespace)
      let keyParsed = SCHEMAS.key.safeParse(data.key)

      // No duplicate key
      if (nsParsed.success && keyParsed.success) {
        let nextUid = createNamespaceKeyUid({
          namespace: data.namespace,
          key: data.key,
        })
        let duplicateUid = !!data.indexedMfs?.[nextUid]
        if (duplicateUid) {
          ctx.addIssue({
            code: 'custom',
            message: `"${nextUid}" metafield already exists`,
            path: ['key'],
            params: {
              DUPLICATE_MF: true,
              duplicate_mf_uid: nextUid,
            },
          })
        }
      }
    }

    const savableType =
      MetafieldSavableType[data.saveAsType] ||
      MetafieldSavableType['_unsupported_']
    const type = MetafieldSavableType[savableType.baseType]

    if (type) {
      if (data._code_editor) {
        // validate master
        const masterValueError = savableType.validate(data.value)
        if (masterValueError) {
          ctx.addIssue({
            code: 'custom',
            message: masterValueError,
            path: ['value'],
          })
        }
      } else {
        // Validate each item in `values`
        data.values.forEach((valueItem, index) => {
          const validationError = type.validate(valueItem.value)
          if (validationError) {
            ctx.addIssue({
              code: 'custom',
              message: validationError,
              path: [`values.${index}.value`],
            })
          }
        })
      }
    } else {
      // ctx.addIssue({
      //   code: 'custom',
      //   message: `type "${data.saveAsType}" not supported`,
      //   path: ['saveAsType'],
      // })
    }
  })
export type MetafieldFormSchema = z.infer<typeof MetafieldFormSchema>
