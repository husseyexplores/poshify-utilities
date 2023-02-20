import * as R from 'remeda'
import { nanoid } from 'nanoid'
import {
  Metafield,
  Resource,
  Routes,
  ResourceItem,
  MetafieldType,
  MetafieldRest,
  MetafieldsById,
  MetafieldParsedValue,
} from '$types'
import { hasProp, safeJsonParse, JsonStringify, typeOf } from './basic'
import { resourceByRoute } from './shopify'
import { MetafieldSavableType } from './mf-type-validators'
import { Logger } from './general'

const LIST_PREFIX = 'list.'
const LIST_PREX_LEN = LIST_PREFIX.length

export const MF_UTILS = {
  isListType: (type: MetafieldType['any']) => {
    return MetafieldSavableType[type]?.isList ?? type.startsWith('list.')
  },

  isMetafieldTypeJson(key: MetafieldType['any']): boolean {
    return (
      key === 'json' ||
      key === 'json_string' ||
      key.startsWith('list.') ||
      key === 'rating' ||
      key === 'dimension' ||
      key === 'volume' ||
      key === 'weight' ||
      key === 'boolean'
    )
  },

  canShowEditor(key: MetafieldType['any']): boolean {
    return true
    const savableType = MetafieldSavableType[key]
    const isJsonType = MF_UTILS.isMetafieldTypeJson(key)
    return (
      isJsonType ||
      savableType.isList ||
      key === 'multi_line_text_field' ||
      key === 'json' ||
      key === 'json_string' ||
      key === 'string'
    )
  },

  savableType: <T extends MetafieldType['any']>(
    mfType: T
  ): MetafieldSavableType<T> | MetafieldSavableType<'_unsupported_'> => {
    const savableType =
      MetafieldSavableType[mfType] || MetafieldSavableType['_unsupported_']
    return savableType
  },

  savableBaseType: <T extends MetafieldType['any']>(
    mfType: T
  ): MetafieldSavableType => {
    const savableType =
      MetafieldSavableType[mfType] || MetafieldSavableType['_unsupported_']
    const savableBaseType = MetafieldSavableType[savableType.baseType]
    return savableBaseType
  },

  savableTypeExample: (metafieldType: MetafieldSavableType) => {
    const example = metafieldType.example
    if (!example) return null
    const isList = !!metafieldType.isList
    return isList ? example.list : example.single
  },

  resourceType: (key: Routes['any']): Resource => resourceByRoute[key],

  validateResourceRoute: (key?: string): Resource | null => {
    if (typeof key !== 'string') return null

    const parsed = Routes['any'].safeParse(key)
    if (parsed.success) {
      return resourceByRoute[parsed.data]
    }

    return null
  },

  validateResource: (maybeResource: any): null | Resource => {
    if (maybeResource == null) return null

    if (typeOf(maybeResource) === 'String')
      maybeResource = safeJsonParse(null, maybeResource)

    if (typeOf(maybeResource) !== 'Object') return null

    if (!hasProp(maybeResource, 'route')) return null

    const validatedRoute = MF_UTILS.validateResourceRoute(maybeResource.route)
    return validatedRoute
    // if (!baseResouce) return null

    // const baseValid = Object.keys(baseResouce).every(key => {
    //   return R.equals(baseResouce[key], maybeResource[key])
    // })

    // return baseValid ? maybeResource : null
  },

  // validateResourceItem: <T extends Routes['any']>({
  //   route,
  //   item,
  // }: {
  //   route: T
  //   item: unknown
  // }): ResourceItem<T> | ResourceItem<'search'> | null => {
  //   if (typeOf(item) === 'Object') {
  //     const record = item as Record<string, unknown>
  //     const maybeSearchItem = record.__kind === 'search'
  //     if (maybeSearchItem) {
  //       const result = ResourceItem['search'].safeParse(item)
  //       return result.success ? result.data : null
  //     }
  //   }

  //   const validatedRoute = MF_UTILS.validateResourceRoute(route)?.route
  //   if (!validatedRoute) return null
  //   const itemValidator = ResourceItem[validatedRoute]
  //   const result = itemValidator.safeParse(item)
  //   return result.success ? (result.data as ResourceItem<T>) : null
  // },

  validateResourceItem: (item: unknown): ResourceItem | null => {
    if (typeOf(item) !== 'Object') return null

    const record = item as Record<string, unknown>
    const hasKind = typeof record.__kind === 'string'
    if (!hasKind) return null
    const kind = record.__kind as ResourceItem['__kind']

    switch (kind) {
      case 'generic': {
        const result = ResourceItem.generic.safeParse(item)
        return result.success ? result.data : null
      }
      case 'search': {
        console.log('validateResourceItem Search => ', item)
        const result = ResourceItem.search.safeParse(item)
        return result.success ? result.data : null
      }
      case 'shop': {
        const result = ResourceItem.shop.safeParse(item)
        return result.success ? result.data : null
      }
      case 'customer': {
        const result = ResourceItem.customers.safeParse(item)
        return result.success ? result.data : null
      }
      case 'draft_order': {
        const result = ResourceItem.draft_orders.safeParse(item)
        return result.success ? result.data : null
      }
      case 'order': {
        const result = ResourceItem.orders.safeParse(item)
        return result.success ? result.data : null
      }
      case 'product': {
        const result = ResourceItem.products.safeParse(item)
        return result.success ? result.data : null
      }
      case 'product_image': {
        const result = ResourceItem.product_images.safeParse(item)
        return result.success ? result.data : null
      }
      case 'variant': {
        const result = ResourceItem.variants.safeParse(item)
        return result.success ? result.data : null
      }
      case 'location': {
        const result = ResourceItem.locations.safeParse(item)
        return result.success ? result.data : null
      }

      default: {
        const _exhaustiveCase: never = kind
        return null
      }
    }
  },
}

const MF_IDX_KEY = '_uid'
export const createNamespaceKeyUid = (mf: { namespace: string; key: string }) =>
  mf.namespace + '.' + mf.key

export const generateUid = () => nanoid(5)

export const parseMetafieldValue = (
  type: MetafieldType['any'],
  value: string | number | null | boolean
): MetafieldParsedValue => {
  const isJsonType = MF_UTILS.isMetafieldTypeJson(type)
  const isList = MF_UTILS.isListType(type)
  let masterValue =
    typeof value !== 'string' ? JSON.stringify(value, null, 2) : value

  if (isJsonType) {
    const parsed = safeJsonParse(masterValue, masterValue, isList)
    const type = typeOf(parsed)
    const prettyable = type === 'Object' || type === 'Array'
    // Make all values pretty by default
    if (prettyable) {
      masterValue = JSON.stringify(parsed, null, 2)
    }
    return { parsed, string: masterValue }
  }

  return { parsed: null, string: masterValue }
}

export const processMetafield = (mf: MetafieldRest): Metafield => {
  const type = mf.type
  const parsedValue = parseMetafieldValue(mf.type, mf.value)

  const savableBaseType = MF_UTILS.savableBaseType(type)

  let values: null | Metafield['values'] =
    null as unknown as Metafield['values']

  const isList = MF_UTILS.isListType(type)
  if (isList) {
    const baseType = savableBaseType.baseType

    const valuesList = parsedValue.parsed as (
      | string
      | number
      | null
      | boolean
    )[]

    values = valuesList.map(itemValue => {
      const parsedItemValue = parseMetafieldValue(baseType, itemValue)

      // If item type (i.e base type) is JSON..?

      return {
        id: generateUid(),
        value: parsedItemValue.string,
      }
    })
  } else {
    values = [{ id: generateUid(), value: parsedValue.string }]
  }

  return {
    ...mf,
    value: parsedValue.string,
    values: values || [],
    [MF_IDX_KEY]: createNamespaceKeyUid(mf),
  }
}

// export const sortMetafields = (mfs: MetafieldWithId[]): MetafieldWithId[] =>
//   R.sort((a, b) => a[MF_IDX_KEY].localeCompare(b[MF_IDX_KEY]), mfs)

export const sortMetafields = (mfs: Metafield[]): Metafield[] =>
  R.sort(mfs, (a, b) => a[MF_IDX_KEY].localeCompare(b[MF_IDX_KEY]))

export const validateMetafield = (mf: any): Metafield | null => {
  if (!mf) return null
  if (typeof mf?.type === 'string') {
    mf._orignalType = mf.type
  }
  const validated = MetafieldRest.safeParse(mf)
  if (validated.success) {
    return processMetafield(validated.data)
  }
  Logger('Metafield validation failed', {
    type: 'warn',
    metadata: {
      validationError: validated.error,
      metafield: mf,
    },
  })
  return null
}

export const validateMetafields = (
  metafields: (MetafieldRest | unknown)[]
): Metafield[] => {
  return R.pipe(
    metafields,
    mfs =>
      mfs.reduce<Metafield[]>((acc, mfRest) => {
        const validated = validateMetafield(mfRest)
        if (validated) {
          acc.push(validated)
        }
        return acc
      }, []),
    sortMetafields
  )
}
export const processMetafields = (metafields: MetafieldRest[]): Metafield[] => {
  return R.pipe(metafields, R.map(processMetafield), sortMetafields)
}

export const indexMetafields = (mfs: Metafield[]): MetafieldsById =>
  R.indexBy(mfs, R.prop(MF_IDX_KEY))

export const groupByNamespace: (mfs: Metafield[]) => {
  [namespace: string]: Metafield[]
} = R.groupBy(R.prop('namespace'))

// export const processMetafieldDefinition = (
//   definition: MetafieldDefinition
// ): MetafieldDefinitionWithId => ({
//   ...definition,
//   [MF_IDX_KEY]: createNamespaceKeyUid(definition),
// })

// export const sortMetafieldDefinitions = (
//   definitions: MetafieldDefinitionWithId[]
// ): MetafieldDefinitionWithId[] =>
//   R.sort(definitions, (a, b) => {
//     if (
//       typeof a.pinnedPosition === 'number' &&
//       typeof b.pinnedPosition === 'number'
//     ) {
//       return a.pinnedPosition - b.pinnedPosition
//     }

//     if (
//       typeof a.pinnedPosition === 'number' &&
//       typeof b.pinnedPosition !== 'number'
//     )
//       return -1

//     if (
//       typeof a.pinnedPosition !== 'number' &&
//       typeof b.pinnedPosition === 'number'
//     )
//       return 1

//     return a[MF_IDX_KEY].localeCompare(b[MF_IDX_KEY])
//   })

// export const processMetafieldDefinitions = (
//   metafieldDefinitions: MetafieldDefinition[]
// ) =>
//   R.pipe(
//     metafieldDefinitions,
//     R.map(processMetafieldDefinition),
//     sortMetafieldDefinitions
//   )

// export const indexMetafieldDefinitions = (
//   definitions: MetafieldDefinitionWithId[]
// ): MetafieldDefinitionIdMap => R.indexBy(definitions, R.prop(MF_IDX_KEY))

// export const isValidGraphqlId = (id: any, type?: string): boolean => {
//   if (typeof id !== 'string') return false
//   if (!type || typeof type !== 'string') {
//     type = '\\w+'
//   }

//   return new RegExp(`^gid:\\/\\/shopify\\/${type}\\/\\d+$`).test(id)
// }
