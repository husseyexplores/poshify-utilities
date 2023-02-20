import { ComponentStory, ComponentMeta } from '@storybook/react'

import { Accordion } from './Accordion'

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Example/Accordion',
  component: Accordion,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
} as ComponentMeta<typeof Accordion>

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof Accordion> = args => (
  <Accordion {...args} />
)

export const Default = Template.bind({})
Default.args = {
  type: 'single',
  defaultOpenIndexes: ['0'],
  items: [
    {
      title: 'Item One',
      subtitle: 'Subtitle goes here',
      content: <p>Content in first</p>,
      key: '1',
      img: 'https://placekitten.com/g/200/200',
    },
    {
      title: 'Item Two',
      subtitle: 'Subtitle goes here',
      content: <p>Content in second. Any JSX element</p>,
      key: '1',
      img: 'https://placekitten.com/g/200/200',
    },
  ],
}

// }
// export const Controlled = Template.bind({})
// // More on args: https://storybook.js.org/docs/react/writing-stories/args
// Controlled.args = {
//   label: 'Switch',
//   checked: true,
// }

// export const Uncontrolled = Template.bind({})
// Uncontrolled.args = {
//   label: 'Uncontrolled',
//   initialChecked: false,
// }
