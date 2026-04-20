import type { Plugin } from 'unified'
import type { Root } from 'mdast'
import {
  resolveAttachment,
  resolveWikiPage,
  slugifyWiki,
} from './wikiLinkIndex'

const WIKI_LINK_RE = /(!)?\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g
const IMAGE_EXT = /\.(png|jpe?g|gif|svg|webp|avif)$/i

type MdastNode = { type: string; children?: MdastNode[]; value?: string }

function escapeAttr(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildLinkNode(
  target: string,
  alias: string | undefined,
  isEmbed: boolean,
): MdastNode {
  const trimmed = target.trim()
  const display = (alias ?? trimmed).trim()

  if (isEmbed && IMAGE_EXT.test(trimmed)) {
    const att = resolveAttachment(trimmed)
    const url = att ? att.url : `#broken-${trimmed}`
    return {
      type: 'html',
      value: `<img src="${escapeAttr(url)}" alt="${escapeAttr(display)}" class="${att ? 'internal-embed' : 'broken-embed'}" />`,
    }
  }

  const page = resolveWikiPage(trimmed)
  if (page) {
    return {
      type: 'link',
      url: page.url,
      data: { hProperties: { className: 'internal-link' } },
      children: [{ type: 'text', value: display }],
    } as MdastNode
  }

  return {
    type: 'link',
    url: `#broken-${slugifyWiki(trimmed)}`,
    data: { hProperties: { className: 'broken-link' } },
    children: [{ type: 'text', value: display }],
  } as MdastNode
}

function splitTextNode(node: MdastNode): MdastNode[] {
  const value = node.value ?? ''
  const results: MdastNode[] = []
  let lastIndex = 0
  WIKI_LINK_RE.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = WIKI_LINK_RE.exec(value)) !== null) {
    if (match.index > lastIndex) {
      results.push({ type: 'text', value: value.slice(lastIndex, match.index) })
    }
    const [, bang, target, alias] = match
    results.push(buildLinkNode(target, alias, bang === '!'))
    lastIndex = match.index + match[0].length
  }
  if (results.length === 0) return [node]
  if (lastIndex < value.length) {
    results.push({ type: 'text', value: value.slice(lastIndex) })
  }
  return results
}

function walk(node: MdastNode) {
  if (!node.children || node.children.length === 0) return
  const next: MdastNode[] = []
  for (const child of node.children) {
    if (child.type === 'text' && child.value && /\[\[/.test(child.value)) {
      next.push(...splitTextNode(child))
    } else {
      walk(child)
      next.push(child)
    }
  }
  node.children = next
}

const remarkWikiLink: Plugin<[], Root> = () => {
  return (tree) => {
    walk(tree as unknown as MdastNode)
  }
}

export default remarkWikiLink
