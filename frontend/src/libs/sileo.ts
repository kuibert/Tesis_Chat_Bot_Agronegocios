import { SileoOptions } from "sileo";

export const sileoStyleToast: Partial<SileoOptions> = {
  fill: "#171717",
  position: "top-right",
  duration: 3500,
  styles: {
    title: "text-white!",
    description: "text-white/75!",
  },
};
