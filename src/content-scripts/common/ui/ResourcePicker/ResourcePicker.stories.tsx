import { ComponentStory, ComponentMeta } from '@storybook/react'
import { useArgs } from '@storybook/client-api'

import { ResourcePicker } from './ResourcePicker'
import { SearchResultTypes } from '$types'

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Example / ResourcePicker',
  component: ResourcePicker,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {
    initialSelected: {
      defaultValue: [],
      description: '',
    },
    searchType: {
      defaultValue: SearchResultTypes.Enum.PRODUCT,
      type: {
        name: 'enum',
        value: SearchResultTypes.options,
      },
    },
  },
} as ComponentMeta<typeof ResourcePicker>

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof ResourcePicker> = args => {
  return <ResourcePicker {...args} />
}

export const Single = Template.bind({})
Single.args = {
  initialSelected: '',
  multiple: false,
  onChange: console.log,
}

// ---------------------------

export const Multiple = Template.bind({})
Multiple.args = {
  initialSelected: [],
  multiple: true,
  onChange: console.log,
}
