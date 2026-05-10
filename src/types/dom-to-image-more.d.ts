declare module 'dom-to-image-more' {
  interface Options {
    width?: number;
    height?: number;
    style?: Record<string, string>;
    quality?: number;
    scale?: number;
    bgcolor?: string;
    filter?: (node: Node) => boolean;
    imagePlaceholder?: string;
    cacheBust?: boolean;
  }

  function domToImage(node: HTMLElement, options?: Options): Promise<string>;
  namespace domToImage {
    export function toPng(node: HTMLElement, options?: Options): Promise<string>;
    export function toJpeg(node: HTMLElement, options?: Options): Promise<string>;
    export function toBlob(node: HTMLElement, options?: Options): Promise<Blob>;
    export function toPixelData(node: HTMLElement, options?: Options): Promise<Uint8ClampedArray>;
    export function toSvg(node: HTMLElement, options?: Options): Promise<string>;
    export function toBlob(node: HTMLElement, options?: Options): Promise<Blob>;
    export function impl(): unknown;
  }

  export = domToImage;
}
