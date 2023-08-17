declare module 'astro:content' {
	interface Render {
		'.mdx': Promise<{
			Content: import('astro').MarkdownInstance<{}>['Content'];
			headings: import('astro').MarkdownHeading[];
			remarkPluginFrontmatter: Record<string, any>;
		}>;
	}
}

declare module 'astro:content' {
	interface Render {
		'.md': Promise<{
			Content: import('astro').MarkdownInstance<{}>['Content'];
			headings: import('astro').MarkdownHeading[];
			remarkPluginFrontmatter: Record<string, any>;
		}>;
	}
}

declare module 'astro:content' {
	export { z } from 'astro/zod';

	type Flatten<T> = T extends { [K: string]: infer U } ? U : never;
	export type CollectionEntry<C extends keyof AnyEntryMap> = Flatten<AnyEntryMap[C]>;

	// TODO: Remove this when having this fallback is no longer relevant. 2.3? 3.0? - erika, 2023-04-04
	/**
	 * @deprecated
	 * `astro:content` no longer provide `image()`.
	 *
	 * Please use it through `schema`, like such:
	 * ```ts
	 * import { defineCollection, z } from "astro:content";
	 *
	 * defineCollection({
	 *   schema: ({ image }) =>
	 *     z.object({
	 *       image: image(),
	 *     }),
	 * });
	 * ```
	 */
	export const image: never;

	// This needs to be in sync with ImageMetadata
	export type ImageFunction = () => import('astro/zod').ZodObject<{
		src: import('astro/zod').ZodString;
		width: import('astro/zod').ZodNumber;
		height: import('astro/zod').ZodNumber;
		format: import('astro/zod').ZodUnion<
			[
				import('astro/zod').ZodLiteral<'png'>,
				import('astro/zod').ZodLiteral<'jpg'>,
				import('astro/zod').ZodLiteral<'jpeg'>,
				import('astro/zod').ZodLiteral<'tiff'>,
				import('astro/zod').ZodLiteral<'webp'>,
				import('astro/zod').ZodLiteral<'gif'>,
				import('astro/zod').ZodLiteral<'svg'>
			]
		>;
	}>;

	type BaseSchemaWithoutEffects =
		| import('astro/zod').AnyZodObject
		| import('astro/zod').ZodUnion<import('astro/zod').AnyZodObject[]>
		| import('astro/zod').ZodDiscriminatedUnion<string, import('astro/zod').AnyZodObject[]>
		| import('astro/zod').ZodIntersection<
				import('astro/zod').AnyZodObject,
				import('astro/zod').AnyZodObject
		  >;

	type BaseSchema =
		| BaseSchemaWithoutEffects
		| import('astro/zod').ZodEffects<BaseSchemaWithoutEffects>;

	export type SchemaContext = { image: ImageFunction };

	type DataCollectionConfig<S extends BaseSchema> = {
		type: 'data';
		schema?: S | ((context: SchemaContext) => S);
	};

	type ContentCollectionConfig<S extends BaseSchema> = {
		type?: 'content';
		schema?: S | ((context: SchemaContext) => S);
	};

	type CollectionConfig<S> = ContentCollectionConfig<S> | DataCollectionConfig<S>;

	export function defineCollection<S extends BaseSchema>(
		input: CollectionConfig<S>
	): CollectionConfig<S>;

	type AllValuesOf<T> = T extends any ? T[keyof T] : never;
	type ValidContentEntrySlug<C extends keyof ContentEntryMap> = AllValuesOf<
		ContentEntryMap[C]
	>['slug'];

	export function getEntryBySlug<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {})
	>(
		collection: C,
		// Note that this has to accept a regular string too, for SSR
		entrySlug: E
	): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;

	export function getDataEntryById<C extends keyof DataEntryMap, E extends keyof DataEntryMap[C]>(
		collection: C,
		entryId: E
	): Promise<CollectionEntry<C>>;

	export function getCollection<C extends keyof AnyEntryMap, E extends CollectionEntry<C>>(
		collection: C,
		filter?: (entry: CollectionEntry<C>) => entry is E
	): Promise<E[]>;
	export function getCollection<C extends keyof AnyEntryMap>(
		collection: C,
		filter?: (entry: CollectionEntry<C>) => unknown
	): Promise<CollectionEntry<C>[]>;

	export function getEntry<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {})
	>(entry: {
		collection: C;
		slug: E;
	}): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof DataEntryMap,
		E extends keyof DataEntryMap[C] | (string & {})
	>(entry: {
		collection: C;
		id: E;
	}): E extends keyof DataEntryMap[C]
		? Promise<DataEntryMap[C][E]>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {})
	>(
		collection: C,
		slug: E
	): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof DataEntryMap,
		E extends keyof DataEntryMap[C] | (string & {})
	>(
		collection: C,
		id: E
	): E extends keyof DataEntryMap[C]
		? Promise<DataEntryMap[C][E]>
		: Promise<CollectionEntry<C> | undefined>;

	/** Resolve an array of entry references from the same collection */
	export function getEntries<C extends keyof ContentEntryMap>(
		entries: {
			collection: C;
			slug: ValidContentEntrySlug<C>;
		}[]
	): Promise<CollectionEntry<C>[]>;
	export function getEntries<C extends keyof DataEntryMap>(
		entries: {
			collection: C;
			id: keyof DataEntryMap[C];
		}[]
	): Promise<CollectionEntry<C>[]>;

	export function reference<C extends keyof AnyEntryMap>(
		collection: C
	): import('astro/zod').ZodEffects<
		import('astro/zod').ZodString,
		C extends keyof ContentEntryMap
			? {
					collection: C;
					slug: ValidContentEntrySlug<C>;
			  }
			: {
					collection: C;
					id: keyof DataEntryMap[C];
			  }
	>;
	// Allow generic `string` to avoid excessive type errors in the config
	// if `dev` is not running to update as you edit.
	// Invalid collection names will be caught at build time.
	export function reference<C extends string>(
		collection: C
	): import('astro/zod').ZodEffects<import('astro/zod').ZodString, never>;

	type ReturnTypeOrOriginal<T> = T extends (...args: any[]) => infer R ? R : T;
	type InferEntrySchema<C extends keyof AnyEntryMap> = import('astro/zod').infer<
		ReturnTypeOrOriginal<Required<ContentConfig['collections'][C]>['schema']>
	>;

	type ContentEntryMap = {
		"categories": {
"conversations.mdx": {
	id: "conversations.mdx";
  slug: "conversations";
  body: string;
  collection: "categories";
  data: InferEntrySchema<"categories">
} & { render(): Render[".mdx"] };
"development.mdx": {
	id: "development.mdx";
  slug: "development";
  body: string;
  collection: "categories";
  data: InferEntrySchema<"categories">
} & { render(): Render[".mdx"] };
"dotfiles.mdx": {
	id: "dotfiles.mdx";
  slug: "dotfiles";
  body: string;
  collection: "categories";
  data: InferEntrySchema<"categories">
} & { render(): Render[".mdx"] };
"personal-development.mdx": {
	id: "personal-development.mdx";
  slug: "personal-development";
  body: string;
  collection: "categories";
  data: InferEntrySchema<"categories">
} & { render(): Render[".mdx"] };
"productivity.mdx": {
	id: "productivity.mdx";
  slug: "productivity";
  body: string;
  collection: "categories";
  data: InferEntrySchema<"categories">
} & { render(): Render[".mdx"] };
"tech.mdx": {
	id: "tech.mdx";
  slug: "tech";
  body: string;
  collection: "categories";
  data: InferEntrySchema<"categories">
} & { render(): Render[".mdx"] };
};
"guides": {
"dev-workflow-intro.mdx": {
	id: "dev-workflow-intro.mdx";
  slug: "dev-workflow-intro";
  body: string;
  collection: "guides";
  data: InferEntrySchema<"guides">
} & { render(): Render[".mdx"] };
};
"posts": {
"a-pretty-terminal-in-5-minutes.mdx": {
	id: "a-pretty-terminal-in-5-minutes.mdx";
  slug: "a-pretty-terminal-in-5-minutes";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"abbreviate-everything.mdx": {
	id: "abbreviate-everything.mdx";
  slug: "abbreviate-everything";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"abhishek-keshris-dev-workflow.mdx": {
	id: "abhishek-keshris-dev-workflow.mdx";
  slug: "abhishek-keshris-dev-workflow";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"blazing-fast-window-management-on-macos.mdx": {
	id: "blazing-fast-window-management-on-macos.mdx";
  slug: "blazing-fast-window-management-on-macos";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"building-mdx-github-embeds-with-astro.mdx": {
	id: "building-mdx-github-embeds-with-astro.mdx";
  slug: "building-mdx-github-embeds-with-astro";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"bullet-journal-didnt-work.mdx": {
	id: "bullet-journal-didnt-work.mdx";
  slug: "bullet-journal-didnt-work";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"clutter-free-macos.mdx": {
	id: "clutter-free-macos.mdx";
  slug: "clutter-free-macos";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"create-a-neovim-ide-with-lazyvim.mdx": {
	id: "create-a-neovim-ide-with-lazyvim.mdx";
  slug: "create-a-neovim-ide-with-lazyvim";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"customizing-yabai-with-lua.mdx": {
	id: "customizing-yabai-with-lua.mdx";
  slug: "customizing-yabai-with-lua";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"deleting-mac-apps.mdx": {
	id: "deleting-mac-apps.mdx";
  slug: "deleting-mac-apps";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"eisenhower-matrix-todoist.mdx": {
	id: "eisenhower-matrix-todoist.mdx";
  slug: "eisenhower-matrix-todoist";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"four-letter-word-kills-productivity.mdx": {
	id: "four-letter-word-kills-productivity.mdx";
  slug: "four-letter-word-kills-productivity";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"github-in-the-terminal.mdx": {
	id: "github-in-the-terminal.mdx";
  slug: "github-in-the-terminal";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"how-i-set-up-prettier.mdx": {
	id: "how-i-set-up-prettier.mdx";
  slug: "how-i-set-up-prettier";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"how-to-make-an-ikea-hack-standing-desk.mdx": {
	id: "how-to-make-an-ikea-hack-standing-desk.mdx";
  slug: "how-to-make-an-ikea-hack-standing-desk";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"macos-keyboard-shortcuts-for-tmux.mdx": {
	id: "macos-keyboard-shortcuts-for-tmux.mdx";
  slug: "macos-keyboard-shortcuts-for-tmux";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"manage-files-with-lf.mdx": {
	id: "manage-files-with-lf.mdx";
  slug: "manage-files-with-lf";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"manage-macos-packages-with-homebrew.mdx": {
	id: "manage-macos-packages-with-homebrew.mdx";
  slug: "manage-macos-packages-with-homebrew";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"manage-terminal-sessions-with-tmux.mdx": {
	id: "manage-terminal-sessions-with-tmux.mdx";
  slug: "manage-terminal-sessions-with-tmux";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"mark-huggins-dev-workflow.mdx": {
	id: "mark-huggins-dev-workflow.mdx";
  slug: "mark-huggins-dev-workflow";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"navigate-the-web-with-vim.mdx": {
	id: "navigate-the-web-with-vim.mdx";
  slug: "navigate-the-web-with-vim";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"optimizing-obsidian-for-content-creation.mdx": {
	id: "optimizing-obsidian-for-content-creation.mdx";
  slug: "optimizing-obsidian-for-content-creation";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"overcome-perfectionism.mdx": {
	id: "overcome-perfectionism.mdx";
  slug: "overcome-perfectionism";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"popup-history-with-tmux-and-fzf.mdx": {
	id: "popup-history-with-tmux-and-fzf.mdx";
  slug: "popup-history-with-tmux-and-fzf";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"quick-git-management-with-lazygit.mdx": {
	id: "quick-git-management-with-lazygit.mdx";
  slug: "quick-git-management-with-lazygit";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"set-up-fish-the-user-friendly-interactive-shell.mdx": {
	id: "set-up-fish-the-user-friendly-interactive-shell.mdx";
  slug: "set-up-fish-the-user-friendly-interactive-shell";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"setting-up-alacritty-for-a-fast-minimal-terminal-emulator.mdx": {
	id: "setting-up-alacritty-for-a-fast-minimal-terminal-emulator.mdx";
  slug: "setting-up-alacritty-for-a-fast-minimal-terminal-emulator";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"setup-prisma-on-astro.mdx": {
	id: "setup-prisma-on-astro.mdx";
  slug: "setup-prisma-on-astro";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"shell-customization-with-starship.mdx": {
	id: "shell-customization-with-starship.mdx";
  slug: "shell-customization-with-starship";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"smart-tmux-sessions-with-zoxide-and-fzf.mdx": {
	id: "smart-tmux-sessions-with-zoxide-and-fzf.mdx";
  slug: "smart-tmux-sessions-with-zoxide-and-fzf";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"tmux-nerd-font-window-name-plugin.mdx": {
	id: "tmux-nerd-font-window-name-plugin.mdx";
  slug: "tmux-nerd-font-window-name-plugin";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"track-git-in-tmux-with-gitmux.mdx": {
	id: "track-git-in-tmux-with-gitmux.mdx";
  slug: "track-git-in-tmux-with-gitmux";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"vim-tmux-with-nick-nisi.mdx": {
	id: "vim-tmux-with-nick-nisi.mdx";
  slug: "vim-tmux-with-nick-nisi";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"waiting-for.mdx": {
	id: "waiting-for.mdx";
  slug: "waiting-for";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"weekly-review.mdx": {
	id: "weekly-review.mdx";
  slug: "weekly-review";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"what-is-the-terminal.mdx": {
	id: "what-is-the-terminal.mdx";
  slug: "what-is-the-terminal";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"why-i-switched-from-zsh-to-fish.mdx": {
	id: "why-i-switched-from-zsh-to-fish.mdx";
  slug: "why-i-switched-from-zsh-to-fish";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
};

	};

	type DataEntryMap = {
		
	};

	type AnyEntryMap = ContentEntryMap & DataEntryMap;

	type ContentConfig = typeof import("../src/content/config");
}
