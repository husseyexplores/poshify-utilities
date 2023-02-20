import { ComponentStory, ComponentMeta } from '@storybook/react'

import { Checkbox } from './Checkbox'

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Example/Checkbox',
  component: Checkbox,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
} as ComponentMeta<typeof Checkbox>

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof Checkbox> = args => <Checkbox {...args} />

export const Default = Template.bind({})
Default.args = {
  checked: false,
  label: 'My label',
  error: '',
  disabled: false,
  labelHidden: false,
  value: 'apple',
  name: 'my_checkbox',
  helpText: 'Need help?',
  color: '',
  title: 'Title can be customized',
}
export const Indeterminate = Template.bind({})
Indeterminate.args = {
  ...Default.args,
  checked: 'indeterminate',
  label: 'Partially selected',
  helpText: '`checked` prop can be a boolean or set to string `indeterminate`',
}
