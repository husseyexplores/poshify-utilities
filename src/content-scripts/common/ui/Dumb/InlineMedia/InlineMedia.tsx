import { ReactNode } from 'react'

type Children = { children: ReactNode }

type MediaThumbSrcProps = { src: string | null }
type MediaThumbMediaProps = { media: ReactNode | null }
type MediaThumbProps = Partial<MediaThumbSrcProps & MediaThumbMediaProps>
function MediaThumb(props: MediaThumbSrcProps): JSX.Element
function MediaThumb(props: MediaThumbMediaProps): JSX.Element
function MediaThumb(props: MediaThumbProps) {
  return (
    <div className="h-14 w-14 flex-shrink-0">
      {props.src ? (
        <img
          className="h-14 w-14 rounded-sm border object-contain"
          src={props.src}
          alt=""
        />
      ) : null}
      {props.media ?? null}
    </div>
  )
}

const MediaContentTitle = ({ children }: Children) => (
  <div className="font-medium text-gray-900 break-all">{children}</div>
)
const MediaContentBody = ({ children }: Children) => (
  <div className="text-gray-500 text-sm">{children}</div>
)

type MediaContentProps = {
  title: ReactNode
  subtitle?: ReactNode
}
function MediaContent({ children }: Children) {
  return <div>{children}</div>
}

type MediaSingletonProps = MediaThumbProps & MediaContentProps
function MediaSingleton(props: MediaSingletonProps) {
  return (
    <InlineMedia>
      {props.src ? (
        <MediaThumb src={props.src} />
      ) : props.media ? (
        <MediaThumb media={props.media} />
      ) : null}

      <MediaContent>
        <MediaContentTitle>{props.title}</MediaContentTitle>
        {props.subtitle ? (
          <MediaContentBody>{props.subtitle}</MediaContentBody>
        ) : null}
      </MediaContent>
    </InlineMedia>
  )
}
export function InlineMedia({ children }: Children) {
  return <div className="flex items-center gap-4">{children}</div>
}

InlineMedia.Thumb = MediaThumb
InlineMedia.Content = MediaContent
InlineMedia.Title = MediaContentTitle
InlineMedia.Body = MediaContentBody
InlineMedia.Singleton = MediaSingleton
