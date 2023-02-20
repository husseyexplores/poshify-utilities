import { useMemo } from 'react'
import { SelectWithFilter } from './SelectWithFilter'
import { Metafield } from '$types'
import './MetafieldSelect.scss'

type MetafieldOption =
  | {
      title: string
      value: null
      metafield?: null
    }
  | {
      title: string
      value: string
      metafield: Metafield
    }

type SectionItem<TOpt> =
  | {
      type: 'SECTION'
      title: string
      options: TOpt[]
    }
  | {
      type: 'OPTION'
      option: TOpt
    }

type MetafieldSectionItems = SectionItem<MetafieldOption>
type MetafieldSectionsInfo = {
  namespaces: string[]
  index: { [namespace: string]: Metafield[] }
  sections: MetafieldSectionItems[]
}

// -----------------------------

const metafieldsToOption = (mf: Metafield): MetafieldOption => ({
  title: mf.key,
  value: mf._uid,
  metafield: mf,
})
const metafieldsToOptions = (mfs: Metafield[]): MetafieldOption[] =>
  mfs.map(x => metafieldsToOption(x))

const getMetafieldSections = (
  mfs: Metafield[],
  withCreateNew = false
): MetafieldSectionsInfo =>
  mfs.reduce<MetafieldSectionsInfo>(
    (acc, mf, index, list) => {
      if (!acc.index[mf.namespace]) {
        acc.index[mf.namespace] = []
        acc.namespaces.push(mf.namespace)
      }

      acc.index[mf.namespace].push(mf)

      const isLast = index === list.length - 1
      if (isLast) {
        const sections: MetafieldSectionsInfo['sections'] = acc.namespaces.map(
          ns => ({
            type: 'SECTION',
            title: ns,
            options: metafieldsToOptions(acc.index[ns]),
          })
        )

        acc.sections.push(...sections)
      }
      return acc
    },
    {
      namespaces: [],
      index: {},
      sections: withCreateNew
        ? [
            {
              type: 'OPTION',
              option: {
                title: 'Create new metafield',
                value: null,
              },
            },
          ]
        : [],
    }
  )

function fitlerMetafields(
  inputValue: string,
  sections: MetafieldSectionItems[]
) {
  const lowerCasedInputValue = inputValue.toLowerCase()
  if (!inputValue) return sections

  return sections
    .map(section => {
      if (section.type === 'OPTION') return section
      return {
        ...section,
        options: section.options.filter(option =>
          (option.value ?? option.title)
            .toLowerCase()
            .includes(lowerCasedInputValue)
        ),
      }
    })
    .filter(section => {
      if (section.type === 'OPTION') {
        return (section.option.value ?? section.option.title)
          .toLowerCase()
          .includes(lowerCasedInputValue)
      }
      return section.options.length > 0
    })
}

export function MetafieldSelect({
  metafields,
  onSelect,
  label,
  selectedMetafield,
}: {
  metafields: Metafield[]
  label?: React.ReactNode
  selectedMetafield?: Metafield | null
  onSelect?: (selected?: Metafield | null) => void
}) {
  const { sections, defaultItem } = useMemo(() => {
    const sectionsInfo = getMetafieldSections(metafields, true)
    const defaultSection = sectionsInfo.sections.find(
      s => s.type === 'OPTION' && s.option.value === null
    )
    const defaultItem = defaultSection
      ? defaultSection.type === 'OPTION'
        ? defaultSection.option
        : undefined
      : undefined
    return { sections: sectionsInfo.sections, defaultItem }
  }, [metafields])

  const selectedItem = useMemo(() => {
    return selectedMetafield
      ? metafieldsToOption(selectedMetafield)
      : defaultItem
  }, [selectedMetafield, defaultItem])

  return (
    <SelectWithFilter
      key={metafields.length}
      items={sections}
      label={label}
      itemToDisplayValue={(x: unknown) => {
        const opt = x as MetafieldOption
        //console.log('itemToDisplayValue', opt)
        if (!opt) return 'Create metafield'
        return opt.title
      }}
      defaultSelectedItem={defaultItem}
      selectedItem={selectedItem}
      filterItems={fitlerMetafields}
      itemToString={x => (x ? JSON.stringify(x) : '')}
      onSelect={(selected: MetafieldOption) => {
        if (!onSelect) return
        onSelect(selected?.metafield ?? null)
      }}
      filterInputProps={{
        placeholder: 'Filter metafields',
      }}
      renderItems={({ items, getItemProps, highlightedIndex }) => (
        <div className="PoshCombobox_Optiongroups max-h-[500px] overflow-y-auto shadow-lg border">
          {
            items.reduce<{
              sections: JSX.Element[]
              itemIndex: number
            }>(
              (result, section) => {
                const sect = section.type === 'SECTION'

                result.sections.push(
                  <div
                    className="border-t"
                    key={
                      sect
                        ? section.title
                        : section.option.value ?? section.option.title
                    }
                  >
                    {sect && (
                      <h5 className="px-4 py-1 font-bold text-base uppercase font-mono PoshCombobox_Optiongroup--header">
                        {section.title}
                      </h5>
                    )}

                    {(sect ? section.options : [section.option]).map(item => {
                      const index = result.itemIndex++
                      return (
                        <SelectWithFilter.DropdownItem
                          className={`px-4 ${sect ? 'py-0.5' : 'py-2'}`}
                          key={item.metafield?._uid ?? item.value}
                          highlighted={highlightedIndex === index}
                          {...getItemProps({
                            //disabled: item.value === null,
                            item: item as any,
                            index,
                          })}
                        >
                          <span className="block">
                            <span className="block">{item.title}</span>

                            {item.metafield && (
                              <span className="block text-[var(--p-text-subdued)] text-xs font-mono">
                                {item.metafield._uid}
                              </span>
                            )}
                          </span>
                        </SelectWithFilter.DropdownItem>
                      )
                    })}
                  </div>
                )

                return result
              },
              { sections: [], itemIndex: 0 }
            ).sections
          }

          {items.length === 0 && (
            <SelectWithFilter.DropdownItem className="py-2 px-4">
              <p className="text-red-700 font-bold">No metafields found</p>
            </SelectWithFilter.DropdownItem>
          )}
        </div>
      )}
    />
  )
}
