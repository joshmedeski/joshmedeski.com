import {
  DevelopmentIcon,
  DotfilesIcon,
  PersonalDevelopmentIcon,
  ProductivityIcon,
  UsesIcon,
} from "../components/icons/index.astro";

export interface Category {
  title: string;
  icon: Function;
  desc: string;
  slug: string;
  style?: {
    title?: string;
    desc?: string;
    container?: string;
    themeColor?: string;
  };
}

export const categories: Category[] = [
  // {
  //   icon: SecondBrainIcon,
  //   title: "Second Brain",
  //   desc: "Organizing my digital life",
  //   slug: "second-brain",
  //   style: {
  //     container: "bg-pink-50 shadow-pink-100",
  //     title: "text-pink-600",
  //     desc: "text-pink-900",
  //     themeColor: "#fbf2f8",
  //   },
  // },
  {
    icon: DotfilesIcon,
    title: "Dotfiles",
    desc: "My developer environment",
    slug: "dotfiles",
    style: {
      container: "bg-orange-50 shadow-orange-100",
      title: "text-orange-600",
      desc: "text-orange-900",
      themeColor: "#fef7ee",
    },
  },
  {
    icon: DevelopmentIcon,
    title: "Development",
    desc: "How I build websites",
    slug: "development",
    style: {
      container: "bg-indigo-50 shadow-indigo-100",
      title: "text-indigo-600",
      desc: "text-indigo-900",
      themeColor: "#eff2fe",
    },
  },
  {
    icon: UsesIcon,
    title: "Uses",
    desc: "Gadgets and software I use",
    slug: "uses",
    style: {
      container: "bg-slate-50 shadow-slate-100",
      title: "text-slate-600",
      desc: "text-slate-900",
      themeColor: "#f8fafc",
    },
  },
  {
    icon: ProductivityIcon,
    title: "Productivity",
    desc: "How I get things done",
    slug: "productivity",
    style: {
      container: "bg-green-50 shadow-green-100",
      title: "text-green-500",
      desc: "text-green-900",
      themeColor: "#f2fdf5",
    },
  },
  {
    icon: PersonalDevelopmentIcon,
    title: "Personal Development",
    desc: "Creating a meaningful life",
    slug: "personal-development",
    style: {
      container: "bg-sky-50 shadow-sky-100",
      title: "text-sky-600",
      desc: "text-sky-900",
      themeColor: "#f2f9fe",
    },
  },
];
