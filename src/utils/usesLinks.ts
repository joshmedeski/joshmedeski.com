import { defineHastPlugin, type PluginFactoryContext } from 'satteri'

const BUTTON_CLASS =
  'inline-block rounded-full bg-white px-6 py-3 text-lg font-bold text-black no-underline shadow-lg transition-colors hover:bg-neutral-200'

const isBlank = (child: { type: string; value?: string }) =>
  child.type === 'text' && !child.value?.trim()

const usesLinkPlugin = defineHastPlugin({
  name: 'uses-links',
  element: {
    filter: ['a'],
    visit(node, ctx) {
      ctx.setProperty(node, 'target', '_blank')
      ctx.setProperty(node, 'rel', ['noopener', 'noreferrer'])

      const parent = ctx.parent(node)
      const standalone =
        parent.type === 'element' &&
        parent.tagName === 'p' &&
        parent.children.filter((child) => !isBlank(child)).length === 1
      if (standalone)
        ctx.setProperty(node, 'className', BUTTON_CLASS.split(' '))
    },
  },
})

const usesLinks = ({ fileURL }: PluginFactoryContext) =>
  fileURL?.pathname.includes('/content/uses/') && usesLinkPlugin

export default usesLinks
