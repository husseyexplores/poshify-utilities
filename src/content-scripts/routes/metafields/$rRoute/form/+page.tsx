import { useMemo } from 'react'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { Button, Card, BlockStack, InlineStack, Text } from '@shopify/polaris'
import { XSmallIcon } from '@shopify/polaris-icons'
import { FocusScope } from '@radix-ui/react-focus-scope'
import {
  useLoaderData,
  useBackNavigate,
  useActionData,
  RouteObject,
} from '$router'
import { PARAMS, SEARCH, extractSearchParams } from '$router/utils'
import { queries, qClient } from '$queries'
import { Logger, resourceByRoute, resizeShopifyImage } from '$utils'

import {
  RouteValidationError,
  getOwnerResourceFromRoute,
  ProductWithVariantAndImgs,
  ResourceItem,
} from '$types'

import { MetafieldsEditForm } from './MetafieldsEditForm'
import { Accordion } from '$ui/Accordion'
import { Spinner } from '$ui/Spinners'

const validateParams = z.object({
  rRoute: PARAMS.rRoute.schema,
  rItem: PARAMS.rItem.schema,
})

const validateSearch = z
  .object({
    v_id: SEARCH.v_id.schema,
    img_id: SEARCH.img_id.schema,
  })
  .default({
    v_id: [],
    img_id: [],
  })

export const route = {
  id: 'MF_EDIT_FORM',
  path: 'form/:rItem',
  element: <MetafieldsEditorFormRoute />,
  loader: async ({ params: paramsRaw, request }) => {
    const paramsResult = validateParams.safeParse(paramsRaw)
    if (!paramsResult.success) {
      Logger('Invalid params', { type: 'error', metadata: paramsResult })

      throw new RouteValidationError('Route params validation failed', {
        messages: paramsResult.error.issues.map(x => x.message),
        status: 400,
      })
    }

    const url = new URL(request.url)
    const searchResult = validateSearch.safeParse(extractSearchParams(url))
    if (!searchResult.success) {
      Logger('Invalid search', { type: 'error', metadata: searchResult })

      throw new RouteValidationError('Route search params validation failed', {
        messages: searchResult.error.issues.map(x => x.message),
        status: 400,
      })
    }
    const search = searchResult.data

    const params = paramsResult.data
    const route = params.rItem.__route
    const resource = resourceByRoute[route]

    const metafieldsQueryArg = queries.metafield.list({
      ownerResource: getOwnerResourceFromRoute(params.rItem.__route),
      ownerResourceId: params.rItem.id,
    })

    // Paralell promises
    const promises: Promise<any>[] = []

    // const metafields =
    //   qClient.getQueryData(metafieldsQueryArg.queryKey) ??
    //   (await qClient.fetchQuery(metafieldsQueryArg))

    // Prefetch metafields (primary)
    if (!qClient.getQueryData(metafieldsQueryArg.queryKey)) {
      promises.push(qClient.fetchQuery(metafieldsQueryArg))
    }

    // If item is `product`, then fetch variants and images
    if (params.rItem.__route === 'products') {
      // Prefetch product (contains variant & images)
      const productQuery = queries.resource.product({
        id: params.rItem.id,
      })
      if (!qClient.getQueryData(productQuery.queryKey)) {
        qClient.fetchQuery(productQuery)
        // promises.push(qClient.fetchQuery(productQuery))
      }

      // Prefetch images
    }

    // Prefetch opened variant metafields (for each variant id)
    search.v_id.forEach(id => {
      const variantQuery = queries.metafield.list({
        ownerResource: 'variant',
        ownerResourceId: id,
      })
      const cached = qClient.getQueryData(metafieldsQueryArg.queryKey)
      if (!cached) {
        promises.push(qClient.fetchQuery(variantQuery))
      }
    })

    // Prefetch opened image metafields (for each image id)
    search.img_id.forEach(id => {
      const imgQuery = queries.metafield.list({
        ownerResource: 'product_image',
        ownerResourceId: id,
      })
      const cached = qClient.getQueryData(metafieldsQueryArg.queryKey)
      if (!cached) {
        promises.push(qClient.fetchQuery(imgQuery))
      }
    })

    if (promises.length) {
      await Promise.all(promises)
    }

    return {
      params,
      openedIds: {
        variant: search.v_id,
        img: search.img_id,
      },
      route: params.rRoute,
      resourceItem: params.rItem,
      metafieldsQueryArg,
      metafieldDefinitionsQueryArg: queries.metafield.definitions({
        ownerType: resource.metafieldOwnerType,
        first: 100,
      }),
    }
  },
} as const satisfies RouteObject

type LoaderReturnType = Awaited<ReturnType<typeof route.loader>>

// -----------------------------------------------

const defaultActionResponse = { error: null } as const
function MetafieldsEditorFormRoute() {
  const {
    resourceItem,
    openedIds,
    metafieldsQueryArg,
    metafieldDefinitionsQueryArg,
  } = useLoaderData() as LoaderReturnType
  const { error: serverError = null } = (useActionData() ||
    defaultActionResponse) as { error: null | string }

  const metafieldsQuery = useQuery(metafieldsQueryArg)

  const definitionsQuery = useQuery(metafieldDefinitionsQueryArg)

  const { goBack } = useBackNavigate(true)
  let subtitle = ''
  if ('handle' in resourceItem && typeof resourceItem.handle === 'string') {
    subtitle = resourceItem.handle
  }

  return (
    <FocusScope trapped={false} loop>
      <Card>
        <BlockStack gap="600">
          <div>
            <InlineStack align="space-between">
              <div>
                <div className="grid gap-1 mb-2">
                  <Text as="h2" variant="headingLg">
                    {resourceItem.title}
                  </Text>
                  {subtitle && (
                    <Text as="p" variant="bodySm" tone="subdued">
                      {subtitle}
                    </Text>
                  )}
                </div>
              </div>

              <div>
                <div className="PoshUtils_DullButton">
                  <Button
                    icon={XSmallIcon}
                    onClick={() => {
                      goBack()
                    }}
                    variant="tertiary"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </InlineStack>

            {serverError && (
              <BlockStack gap="400">
                <Text tone="critical" variant="bodyMd" as="p">
                  {serverError}
                </Text>
              </BlockStack>
            )}

            {metafieldsQuery.data && (
              <MetafieldsEditForm
                resourceItem={resourceItem}
                metafields={metafieldsQuery.data.metafields}
                metafieldsIndexed={metafieldsQuery.data.metafieldsIndexed}
              />
            )}
          </div>

          {resourceItem.__route === 'products' && (
            <div>
              <div className="pt-10 pb-4 border-t border-slate-200 grid gap-8">
                <WithProduct id={resourceItem.id}>
                  {({ product }) => (
                    <>
                      <VariantMetafieldsAccordions
                        product={product}
                        openedIds={openedIds.variant}
                      />
                      <ImageMetafieldsAccordions
                        product={product}
                        openedIds={openedIds.img}
                      />
                    </>
                  )}
                </WithProduct>
              </div>
            </div>
          )}
        </BlockStack>
      </Card>
    </FocusScope>
  )
}

export function WithProduct({
  id,
  children,
}: {
  id: number
  children: (opts: { product: ProductWithVariantAndImgs }) => JSX.Element | null
}) {
  const productsQuery = useQuery(
    queries.resource.product({
      id,
    })
  )

  if (productsQuery.isLoading) {
    return <Spinner size="large" />
  }

  if (productsQuery.error) {
    const msg =
      productsQuery.error instanceof Error
        ? productsQuery.error.message
        : 'Unable to fetch product'
    return (
      <Text as="p" tone="critical" variant="bodyMd">
        {msg}
      </Text>
    )
  }

  if (!productsQuery.data) return null
  return children({ product: productsQuery.data })
}

const THUMB_SIZE = '150x150_crop_center'
function VariantMetafieldsAccordions({
  product,
  openedIds,
}: {
  product: ProductWithVariantAndImgs
  openedIds: number[]
}) {
  const { variants, images } = product
  const variantAccord = useMemo(() => {
    const items = variants.map(v => {
      let thumb =
        v.image_src ||
        (v.image_id ? images.find(img => img.id === v.image_id)?.src : null)
      if (thumb) {
        thumb = resizeShopifyImage(thumb, THUMB_SIZE)
      }

      return {
        title: v.title,
        subtitle: v.sku ? `SKU: ${v.sku}` : null,
        key: v.id.toString(),
        img: thumb,
        content: <ItemMetafields resourceItem={v} />,
      }
    })

    const defaultOpenedIndexes = variants.reduce<string[]>((acc, v, index) => {
      if (openedIds.includes(v.id)) {
        acc.push(index.toString())
      }
      return acc
    }, [])
    return { defaultOpenedIndexes, items }
  }, [])

  return (
    <>
      {variantAccord.items.length > 0 && (
        <div className="grid gap-4">
          <Text as="h3" variant="headingMd">
            Variants ({variants.length})
          </Text>
          <Accordion
            type="multiple"
            items={variantAccord.items}
            defaultOpenIndexes={variantAccord.defaultOpenedIndexes}
            // onChange={x => {
            //   console.log('Accordion changed => ', x)
            // }}
          />
        </div>
      )}
    </>
  )
}

function ImageMetafieldsAccordions({
  product,
  openedIds,
}: {
  product: ProductWithVariantAndImgs
  openedIds: number[]
}) {
  const { images } = product

  const accord = useMemo(() => {
    const items = images.map(img => {
      const thumb = img.src ? resizeShopifyImage(img.src, THUMB_SIZE) : null

      return {
        title: `${img.id}`,
        subtitle: img.alt,
        key: img.id.toString(),
        img: thumb,
        content: <ItemMetafields resourceItem={img} />,
      }
    })

    const defaultOpenedIndexes = images.reduce<string[]>((acc, img, index) => {
      if (openedIds.includes(img.id)) {
        acc.push(index.toString())
      }
      return acc
    }, [])
    return { defaultOpenedIndexes, items }
  }, [])

  return (
    <>
      {accord.items.length > 0 && (
        <div className="grid gap-4">
          <Text as="h3" variant="headingMd">
            Images ({images.length})
          </Text>

          <Accordion
            type="multiple"
            items={accord.items}
            defaultOpenIndexes={accord.defaultOpenedIndexes}
            // onChange={x => {
            //   console.log('Accordion changed => ', x)
            // }}
          />
        </div>
      )}
    </>
  )
}

function ItemMetafields({ resourceItem }: { resourceItem: ResourceItem }) {
  const resource = resourceByRoute[resourceItem.__route]
  const variantMfQuery = useQuery(
    queries.metafield.list({
      ownerResource: resource.ownerResource,
      ownerResourceId: resourceItem.id,
    })
  )

  if (variantMfQuery.isLoading) {
    return <Spinner size="large" />
  }

  if (variantMfQuery.error) {
    const msg =
      variantMfQuery.error instanceof Error
        ? variantMfQuery.error.message
        : 'Unable to fetch metafields'
    return (
      <Text as="p" tone="critical" variant="bodyMd">
        {msg}
      </Text>
    )
  }

  if (variantMfQuery.data) {
    return (
      <MetafieldsEditForm
        resourceItem={resourceItem}
        metafields={variantMfQuery.data.metafields}
        metafieldsIndexed={variantMfQuery.data.metafieldsIndexed}
      />
    )
  }

  return null
}
