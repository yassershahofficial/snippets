import {
  Actor,
  IM_Fell_French_Canon,
  Kosugi_Maru,
  Playfair_Display,
  Port_Lligat_Slab,
  Spline_Sans,
  Zen_Antique,
  Zen_Kaku_Gothic_Antique,
} from "next/font/google";

export const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-logo",
  display: "swap",
});

export const splineSans = Spline_Sans({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-nav",
  display: "swap",
});

export const imFell = IM_Fell_French_Canon({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-intro-headline",
  display: "swap",
});

export const actor = Actor({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-body-sans",
  display: "swap",
});

export const zenKaku = Zen_Kaku_Gothic_Antique({
  subsets: ["latin"],
  weight: "700",
  variable: "--font-featured-label",
  display: "swap",
});

export const zenAntique = Zen_Antique({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-featured-title",
  display: "swap",
});

export const kosugiMaru = Kosugi_Maru({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-rail-label",
  display: "swap",
});

export const portLligat = Port_Lligat_Slab({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-rail-title",
  display: "swap",
});

export const homeFontVariables = [
  playfair.variable,
  splineSans.variable,
  imFell.variable,
  actor.variable,
  zenKaku.variable,
  zenAntique.variable,
  kosugiMaru.variable,
  portLligat.variable,
].join(" ");
