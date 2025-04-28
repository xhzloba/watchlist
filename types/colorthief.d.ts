declare module "colorthief" {
  export default class ColorThief {
    getColor: (img: HTMLImageElement | null) => [number, number, number] | null;
    getPalette: (
      img: HTMLImageElement | null,
      colorCount?: number
    ) => [number, number, number][] | null;
  }
}
