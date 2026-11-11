import { defineHastPlugin, type PluginFactoryContext } from 'satteri'

const newTabLinks = defineHastPlugin({
  name: 'uses-links-new-tab',
  element: {
    filter: ['a'],
    visit(node, ctx) {
      ctx.setProperty(node, 'target', '_blank')
      ctx.setProperty(node, 'rel', ['noopener', 'noreferrer'])
    },
  },
})

const usesLinksNewTab = ({ fileURL }: PluginFactoryContext) =>
  fileURL?.pathname.includes('/content/uses/') && newTabLinks

export default usesLinksNewTab
