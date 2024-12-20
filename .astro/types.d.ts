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
	type Flatten<T> = T extends { [K: string]: infer U } ? U : never;

	export type CollectionKey = keyof AnyEntryMap;
	export type CollectionEntry<C extends CollectionKey> = Flatten<AnyEntryMap[C]>;

	export type ContentCollectionKey = keyof ContentEntryMap;
	export type DataCollectionKey = keyof DataEntryMap;

	type AllValuesOf<T> = T extends any ? T[keyof T] : never;
	type ValidContentEntrySlug<C extends keyof ContentEntryMap> = AllValuesOf<
		ContentEntryMap[C]
	>['slug'];

	export function getEntryBySlug<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {}),
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
		E extends ValidContentEntrySlug<C> | (string & {}),
	>(entry: {
		collection: C;
		slug: E;
	}): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof DataEntryMap,
		E extends keyof DataEntryMap[C] | (string & {}),
	>(entry: {
		collection: C;
		id: E;
	}): E extends keyof DataEntryMap[C]
		? Promise<DataEntryMap[C][E]>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {}),
	>(
		collection: C,
		slug: E
	): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof DataEntryMap,
		E extends keyof DataEntryMap[C] | (string & {}),
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
		"areas": {
"audio.md": {
	id: "audio.md";
  slug: "audio";
  body: string;
  collection: "areas";
  data: InferEntrySchema<"areas">
} & { render(): Render[".md"] };
"hardware.md": {
	id: "hardware.md";
  slug: "hardware";
  body: string;
  collection: "areas";
  data: InferEntrySchema<"areas">
} & { render(): Render[".md"] };
"keyboards.md": {
	id: "keyboards.md";
  slug: "keyboards";
  body: string;
  collection: "areas";
  data: InferEntrySchema<"areas">
} & { render(): Render[".md"] };
};
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
"ai-in-neovim-neovimconf-2024.mdx": {
	id: "ai-in-neovim-neovimconf-2024.mdx";
  slug: "ai-in-neovim-neovimconf-2024";
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
"carlos-beckers-dev-workflow.mdx": {
	id: "carlos-beckers-dev-workflow.mdx";
  slug: "carlos-beckers-dev-workflow";
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
"dolev-hadars-dev-workflow.mdx": {
	id: "dolev-hadars-dev-workflow.mdx";
  slug: "dolev-hadars-dev-workflow";
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
"make-your-yearly-review-easier-with-ai.mdx": {
	id: "make-your-yearly-review-easier-with-ai.mdx";
  slug: "make-your-yearly-review-easier-with-ai";
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
"more-fun-in-the-terminal-with-wezterm.mdx": {
	id: "more-fun-in-the-terminal-with-wezterm.mdx";
  slug: "more-fun-in-the-terminal-with-wezterm";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"moving-from-mackup-to-stow.mdx": {
	id: "moving-from-mackup-to-stow.mdx";
  slug: "moving-from-mackup-to-stow";
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
"smart-tmux-sessions-with-sesh.mdx": {
	id: "smart-tmux-sessions-with-sesh.mdx";
  slug: "smart-tmux-sessions-with-sesh";
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
"top-4-fuzzy-clis.mdx": {
	id: "top-4-fuzzy-clis.mdx";
  slug: "top-4-fuzzy-clis";
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
"underrated-square-bracket.mdx": {
	id: "underrated-square-bracket.mdx";
  slug: "underrated-square-bracket";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"upgrading-to-astro-v3.mdx": {
	id: "upgrading-to-astro-v3.mdx";
  slug: "upgrading-to-astro-v3";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".mdx"] };
"using-bun-with-astro.mdx": {
	id: "using-bun-with-astro.mdx";
  slug: "using-bun-with-astro";
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
"projects": {
"sesh.mdx": {
	id: "sesh.mdx";
  slug: "sesh";
  body: string;
  collection: "projects";
  data: InferEntrySchema<"projects">
} & { render(): Render[".mdx"] };
"tmux-fzf-url.mdx": {
	id: "tmux-fzf-url.mdx";
  slug: "tmux-fzf-url";
  body: string;
  collection: "projects";
  data: InferEntrySchema<"projects">
} & { render(): Render[".mdx"] };
"tmux-nerd-font-window-name-thumb.mdx": {
	id: "tmux-nerd-font-window-name-thumb.mdx";
  slug: "tmux-nerd-font-window-name-thumb";
  body: string;
  collection: "projects";
  data: InferEntrySchema<"projects">
} & { render(): Render[".mdx"] };
};
"uses": {
"a2-sub.md": {
	id: "a2-sub.md";
  slug: "a2-sub";
  body: string;
  collection: "uses";
  data: InferEntrySchema<"uses">
} & { render(): Render[".md"] };
"airpods-max.md": {
	id: "airpods-max.md";
  slug: "airpods-max";
  body: string;
  collection: "uses";
  data: InferEntrySchema<"uses">
} & { render(): Render[".md"] };
"airpods.md": {
	id: "airpods.md";
  slug: "airpods";
  body: string;
  collection: "uses";
  data: InferEntrySchema<"uses">
} & { render(): Render[".md"] };
"apple-mbp.md": {
	id: "apple-mbp.md";
  slug: "apple-mbp";
  body: string;
  collection: "uses";
  data: InferEntrySchema<"uses">
} & { render(): Render[".md"] };
"audio-engine-a2.md": {
	id: "audio-engine-a2.md";
  slug: "audio-engine-a2";
  body: string;
  collection: "uses";
  data: InferEntrySchema<"uses">
} & { render(): Render[".md"] };
"grell-aoe.md": {
	id: "grell-aoe.md";
  slug: "grell-aoe";
  body: string;
  collection: "uses";
  data: InferEntrySchema<"uses">
} & { render(): Render[".md"] };
"hd-6xx.md": {
	id: "hd-6xx.md";
  slug: "hd-6xx";
  body: string;
  collection: "uses";
  data: InferEntrySchema<"uses">
} & { render(): Render[".md"] };
"iqunix-l80-cosmic-traveller.md": {
	id: "iqunix-l80-cosmic-traveller.md";
  slug: "iqunix-l80-cosmic-traveller";
  body: string;
  collection: "uses";
  data: InferEntrySchema<"uses">
} & { render(): Render[".md"] };
"kbdcraft-atom-kit.md": {
	id: "kbdcraft-atom-kit.md";
  slug: "kbdcraft-atom-kit";
  body: string;
  collection: "uses";
  data: InferEntrySchema<"uses">
} & { render(): Render[".md"] };
"nuphy-air-75.md": {
	id: "nuphy-air-75.md";
  slug: "nuphy-air-75";
  body: string;
  collection: "uses";
  data: InferEntrySchema<"uses">
} & { render(): Render[".md"] };
"o2-sdac.md": {
	id: "o2-sdac.md";
  slug: "o2-sdac";
  body: string;
  collection: "uses";
  data: InferEntrySchema<"uses">
} & { render(): Render[".md"] };
"zsa-ergodox-ez.md": {
	id: "zsa-ergodox-ez.md";
  slug: "zsa-ergodox-ez";
  body: string;
  collection: "uses";
  data: InferEntrySchema<"uses">
} & { render(): Render[".md"] };
"zsa-moonlander.md": {
	id: "zsa-moonlander.md";
  slug: "zsa-moonlander";
  body: string;
  collection: "uses";
  data: InferEntrySchema<"uses">
} & { render(): Render[".md"] };
};

	};

	type DataEntryMap = {
		
	};

	type AnyEntryMap = ContentEntryMap & DataEntryMap;

	export type ContentConfig = typeof import("../src/content/config.js");
}
