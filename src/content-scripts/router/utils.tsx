import { NavigateOptions } from 'react-router-dom'
import { z } from 'zod'
import { searchParser, tryCatch } from '$utils'
import { MF_UTILS } from '$utils'
import { router } from './'
import { Routes, Resource, ResourceItem } from '$types'

const toNumArray = (input: (string | number)[]) =>
  input.reduce<number[]>((acc, x) => {
    if (typeof x === 'string') {
      const num = Number(x)
      if (!Number.isNaN(num)) {
        acc.push(num)
      }

      return acc
    }
    acc.push(x)
    return acc
  }, [])

const NumArrayForgivingSchema = z
  .array(z.number().or(z.string()))
  .default([])
  .transform(toNumArray)

export const SEARCH = {
  cursor: {
    create: (rawValue?: string | null) =>
      rawValue ? searchParser.serialize(rawValue) : null,
    schema: z
      .string()
      .optional()
      .transform(cursor => {
        if (cursor) return searchParser.parse(cursor)
        return undefined
      })
      .catch(undefined),
  },
  direction: {
    create: (dir: '-1' | '0' | '1') => dir,
    schema: z
      .enum(['-1', '0', '1'])
      .optional()
      .nullable()
      .transform(x => x || '1')
      .catch('0'),
  },
  v_id: {
    create: (id: number) => id,
    schema: NumArrayForgivingSchema,
  },
  img_id: {
    create: (id: number) => id,
    schema: NumArrayForgivingSchema,
  },
}

export const PARAMS = {
  rRoute: {
    schema: Routes['any'],
    url: (route: Routes['any']) => {
      return `/metafields/${route}`
    },
    navigate: (route: Routes['any'], opts?: NavigateOptions) => {
      router.navigate(PARAMS.rRoute.url(route), {
        replace: true,
        ...opts,
      })
    },
  },

  rItem: {
    schema: z.string().transform((value, ctx) => {
      const parsedItem = tryCatch(
        value,
        searchParser.parse,
        () => null
      ) as unknown

      const validatedItem = MF_UTILS.validateResourceItem(parsedItem)
      if (!validatedItem) {
        ctx.addIssue({
          code: 'custom',
          message: 'Resource item is not valid',
          path: ['rItem'],
        })
        return z.NEVER
      }

      return validatedItem
    }),

    url: ({ resource, item }: { resource: Resource; item: ResourceItem }) => {
      const currentSp = router.state.location.search
      return `/metafields/${resource.route}/form/${searchParser.serialize(
        item
      )}${currentSp || ''}`
    },
    navigate: (
      {
        resource,
        item,
      }: {
        resource: Resource
        item: ResourceItem
      },
      opts?: NavigateOptions
    ) => {
      router.navigate(PARAMS.rItem.url({ resource, item }), opts)
    },
  },
}

export function extractSearchParams(input: URL | URLSearchParams) {
  const sp = input instanceof URL ? input.searchParams : input
  if (!(sp instanceof URLSearchParams)) {
    throw new Error('Not search params')
  }

  const s: { [key: string]: string | string[] } = Object.create(null)
  sp.forEach((value, key) => {
    if (!s[key]) {
      s[key] = value
      return
    }
    if (!Array.isArray(s[key])) {
      s[key] = [s[key] as string, value]
      return
    }
    ;(s[key] as string[]).push(value)
  })

  return s
}
