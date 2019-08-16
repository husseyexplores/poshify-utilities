import React from 'react'
import PropTypes from 'prop-types'
import {
  Accordion,
  AccordionItem,
  AccordionItemHeading,
  AccordionItemButton,
  AccordionItemPanel,
  AccordionItemState,
} from 'react-accessible-accordion'
import { Icon, TextStyle } from '@shopify/polaris'
import { ChevronRightMinor } from '@shopify/polaris-icons'
import './Accordion.scss'

// ------------------------------------------------------------------

const content = `Exercitation in fugiat est ut ad ea cupidatat ut in
cupidatat occaecat ut occaecat consequat est minim minim
esse tempor laborum consequat esse adipisicing eu
reprehenderit enim.`

function PolarisAccordion({
  unmountHidden,
  allowMultipleExpanded,
  allowZeroExpanded,
  items,
}) {
  if (!Array.isArray(items)) throw new Error('Expected `items` be an array')
  if (items.length === 0) return null

  return (
    <Accordion
      className="Polaris-Accordion"
      allowMultipleExpanded={allowMultipleExpanded}
      allowZeroExpanded={allowZeroExpanded}
    >
      {items.map(({ title, content, key }, idx) => (
        <AccordionItem className="Polaris-Accordion__Item" key={key || idx}>
          <AccordionItemState className="Polaris-Accordion__Item">
            {({ expanded }) => (
              <>
                <AccordionItemHeading className="Polaris-Accordion__Item-Heading">
                  <AccordionItemButton className="Polaris-Accordion__Item-Button">
                    <Icon
                      color={expanded ? 'indigo' : 'inkLight'}
                      source={ChevronRightMinor}
                    />
                    <span className="Polaris-Accordion__Item-Button-Content ">
                      <TextStyle variation={expanded ? 'strong' : undefined}>
                        {title}
                      </TextStyle>
                    </span>
                  </AccordionItemButton>
                </AccordionItemHeading>
                <AccordionItemPanel className="Polaris-Accordion__Item-Content">
                  {unmountHidden ? expanded && content : content}
                </AccordionItemPanel>
              </>
            )}
          </AccordionItemState>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

PolarisAccordion.propTypes = {
  unmountHidden: PropTypes.bool.isRequired,
  allowMultipleExpanded: PropTypes.bool.isRequired,
  allowZeroExpanded: PropTypes.bool.isRequired,
  items: PropTypes.array.isRequired,
}

PolarisAccordion.defaultProps = {
  unmountHidden: true,
  allowMultipleExpanded: true,
  allowZeroExpanded: true,
  items: [],
}

export default PolarisAccordion
