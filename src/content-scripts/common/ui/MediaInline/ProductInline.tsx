import { useQuery } from '@tanstack/react-query'
import { MediaInline } from './MediaInline'
import { queries } from '$queries'
import {
  MetafieldSavableType,
  getRestId,
  getErrorMessage,
  mayHaveImage,
} from '$utils'
import { InlineError } from '$ui/InlineError'
import { getShopInfo } from '$hooks/useShopInfo'

export function ProductInline({ id: idProp }: { id?: number | string }) {
  const id = idProp ? getRestId(idProp) : null
  const productQuery = useQuery(
    queries.resource.one({
      route: 'products',
      parentId: null,
      itemId: id!,
    })
  )

  const data = productQuery.data
  const productImgSrc = data?.image_thumb || data?.image?.src

  const handle = data?.handle
  const previewUrl = handle ? `/products/${handle}` : null

  if (productQuery.error) {
    const msg = getErrorMessage(
      productQuery.error,
      `Unable to fetch product (${id})`
    )
    return <InlineError>{msg}</InlineError>
  }

  return (
    <MediaInline
      showPlaceholderImage={true}
      loading={productQuery.isLoading || !handle}
      title={productQuery.data?.title || id?.toString() || ''}
      subtitle={handle || ''}
      url={previewUrl}
      imgSrc={productImgSrc}
    />
  )
}

export function VariantInline({ id: idProp }: { id: number | string }) {
  const id = getRestId(idProp)
  const variantsQuery = useQuery(
    queries.resource.variant({
      id: id!,
    })
  )

  const data = variantsQuery.data

  const title = data?.title

  const previewUrl = !data
    ? null
    : `/products/${data.__parent.handle}?variant=${data.id}`

  if (variantsQuery.error) {
    const msg = getErrorMessage(
      variantsQuery.error,
      `Unable to fetch variant (${id})`
    )
    return <InlineError>{msg}</InlineError>
  }

  return (
    <MediaInline
      showPlaceholderImage={true}
      loading={variantsQuery.isLoading || !data}
      title={title || id?.toString() || ''}
      subtitle={data?.__parent.title}
      url={previewUrl}
      imgSrc={data?.image_thumb}
    />
  )
}

export function CollectionInline({ id: idProp }: { id?: number | string }) {
  const id = idProp ? getRestId(idProp) : null
  const collectionQuery = useQuery(
    queries.resource.one({
      route: 'collections',
      parentId: null,
      itemId: id!,
    })
  )

  const data = collectionQuery.data
  const productImgSrc = data?.image_thumb || data?.image?.src

  const handle = data?.handle
  const previewUrl = handle ? `/collections/${handle}` : null

  if (collectionQuery.error) {
    const msg = getErrorMessage(
      collectionQuery.error,
      `Unable to fetch collection (${id})`
    )
    return <InlineError>{msg}</InlineError>
  }

  return (
    <MediaInline
      showPlaceholderImage={true}
      loading={collectionQuery.isLoading || !handle}
      title={collectionQuery.data?.title || id?.toString() || ''}
      subtitle={handle || ''}
      url={previewUrl}
      imgSrc={productImgSrc}
    />
  )
}

export function PageInline({ id: idProp }: { id: number | string }) {
  const id = idProp ? getRestId(idProp) : null
  const pageQuery = useQuery(
    queries.resource.one({
      route: 'pages',
      parentId: null,
      itemId: id!,
    })
  )

  const data = pageQuery.data
  const handle = data?.handle
  const previewUrl = handle ? `/pages/${handle}` : null

  if (pageQuery.error) {
    const msg = getErrorMessage(pageQuery.error, `Unable to fetch page (${id})`)
    return <InlineError>{msg}</InlineError>
  }

  return (
    <MediaInline
      showPlaceholderImage={false}
      loading={pageQuery.isLoading || !handle}
      title={pageQuery.data?.title || id?.toString() || ''}
      subtitle={handle || ''}
      url={previewUrl}
    />
  )
}

export function PreviewableMediaInline({ id }: { id: string }) {
  const pageQuery = useQuery(
    queries.resource.preview({
      id,
    })
  )

  const data = pageQuery.data

  if (pageQuery.error) {
    const msg = getErrorMessage(pageQuery.error, `Unable to fetch page (${id})`)
    return <InlineError>{msg}</InlineError>
  }

  return (
    <MediaInline
      imgSrc={data?._image_thumb}
      showPlaceholderImage={data ? mayHaveImage(data) : false}
      loading={pageQuery.isLoading}
      title={data?._displayName || ''}
      subtitle={data?._subtitle || null}
    />
  )
}
