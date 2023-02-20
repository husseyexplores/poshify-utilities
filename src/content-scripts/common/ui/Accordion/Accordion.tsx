import { ReactNode } from 'react'
import * as Acc from '@radix-ui/react-accordion'
import { Icon } from '@shopify/polaris'
import { ChevronRightMinor } from '@shopify/polaris-icons'

import './Accordion.scss'

// ------------------------------------------------------------------

type IF<TCond extends boolean, TResult, TElse = never> = TCond extends true
  ? TResult
  : TElse

export function Accordion<T extends 'single' | 'multiple'>({
  type,
  defaultOpenIndexes,
  items,
  onChange,
}: {
  type: T
  defaultOpenIndexes?: T extends 'single' ? string : string[]
  items: {
    title: string
    content: ReactNode
    key: string | number
    subtitle?: string | null
    img?: string | null
  }[]
  onChange?: T extends 'multiple'
    ? (value: string[]) => void
    : (value: string) => void
}) {
  // if (type === 'single') defaultSelected = defaultSelected[0] as any
  return (
    <Acc.Root
      type={type}
      defaultValue={defaultOpenIndexes as any}
      onValueChange={x => {
        onChange?.(x)
      }}
    >
      <div className="rounded">
        {items.map(({ title, content, key, subtitle, img }, index) => (
          <Acc.Item
            key={key}
            className="mb-2 border border-[var(--p-border-shadow-subdued)]"
            value={index.toString()}
          >
            <Acc.Header className="relative pb-0 bg-[linear-gradient(180deg,#fff,#f9fafb)]">
              <Acc.Trigger className="PoshifyAccordionTrigger grid grid-cols-[minmax(0,1fr)_theme(width.14)] overflow-hidden min-h-[theme(width.14)]">
                <div>
                  <div className="grid gap-1 grid-cols-[20px_minmax(0,1fr)]">
                    <div className="rotate-when-open">
                      <Icon source={ChevronRightMinor} />
                    </div>
                    <div className="space-y-0.5">
                      <span className="title-text">
                        <span className="bold-when-open">{title}</span>
                      </span>

                      {subtitle && (
                        <div className="subtitle-text">
                          <span>{subtitle}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {img && (
                  <img
                    className="w-14 h-14 object-cover absolute right-0"
                    src={img}
                    alt=""
                  />
                )}
              </Acc.Trigger>
            </Acc.Header>
            <Acc.Content className="PoshifyAccordionContent overflow-hidden data-[state=open]:mb-4">
              <div className="p-4 border-t border-[var(--p-border-shadow-subdued)]">
                {content}
              </div>
            </Acc.Content>
          </Acc.Item>
        ))}
      </div>
    </Acc.Root>
  )
}
