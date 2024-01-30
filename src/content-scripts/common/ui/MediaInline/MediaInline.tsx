import { forwardRef, ReactNode, useId } from 'react'
import { Text, Thumbnail, SkeletonBodyText } from '@shopify/polaris'
import { FALLBACK_IMG_SRC } from '$utils/general'
import { ClearButton } from '$ui/Dumb'
import { getShopInfo } from '$hooks/useShopInfo'
import './MediaInline.scss'

type MediaInlineProps = {
  imgSrc?: string | ReactNode
  showPlaceholderImage?: boolean
  urlPrefix?: null | string
  loading?: boolean
  url?: string | null
  onClearClick?: () => any
  onClick?: () => any
  title: string
  subtitle?: ReactNode
  children?: ReactNode
}

export function MediaInline({
  imgSrc,
  title,
  subtitle,
  url: urlProp,
  urlPrefix,
  loading = false,
  showPlaceholderImage = false,
  onClearClick,
  onClick,
  children,
}: MediaInlineProps) {
  const _imgsrc =
    imgSrc || (showPlaceholderImage ? FALLBACK_IMG_SRC.small : null)

  const isLocalUrl = urlProp && urlProp.startsWith('/')
  let url = urlProp
  if (urlPrefix && url && isLocalUrl) {
    url = `${urlPrefix}${url}`
    if (!url.startsWith('/')) url = `/${url}`
  }
  const shopInfo = getShopInfo()
  if (shopInfo && isLocalUrl) {
    url = `${shopInfo.url}${url}`
  }

  const titleAndSubtitle =
    loading || children ? null : (
      <div className="relative">
        <MediaInline.Title>{title}</MediaInline.Title>

        <div className="mt">
          {typeof subtitle === 'string' ? (
            <MediaInline.Subtitle>{subtitle}</MediaInline.Subtitle>
          ) : (
            subtitle
          )}
        </div>
      </div>
    )

  return (
    <div className="relative flex gap-4 items-center hover:bg-slate-50 p-2 focus-within:bg-slate-50">
      {_imgsrc == null ? null : typeof _imgsrc === 'string' ? (
        <Thumbnail size="small" source={_imgsrc} alt="" />
      ) : (
        imgSrc
      )}
      <div className="w-full">
        {loading ? (
          <div className="max-w-xs">
            <SkeletonBodyText lines={2} />
          </div>
        ) : (
          <div className="relative">{children ?? titleAndSubtitle}</div>
        )}
      </div>
      {!loading && onClearClick && <ClearButton onClick={onClearClick} />}

      <>
        {loading ? null : (
          <>
            {!url && onClick && (
              <button
                type="button"
                onClick={onClick}
                className="absolute inset-0 z-1"
              ></button>
            )}

            {url && !onClick && (
              <a
                className="absolute inset-0 z-1"
                href={url}
                target="_blank"
                rel="no-referrer noreferrer"
              ></a>
            )}
          </>
        )}
      </>
    </div>
  )
}

MediaInline.Title = ({ children }: { children: ReactNode }) => (
  <Text as="h3" variant="bodyMd" fontWeight="bold">
    {children}
  </Text>
)

MediaInline.Subtitle = ({ children }: { children: ReactNode }) => (
  <Text as="span" variant="bodySm" tone="subdued">
    {children}
  </Text>
)

// ----------------------------
