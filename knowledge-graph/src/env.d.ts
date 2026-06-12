/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare module '3d-force-graph' {
  import type { ForceGraph3DInstance } from '3d-force-graph';
  export default function ForceGraph3D<
    NodeObject = any,
    LinkObject = any,
  >(): ForceGraph3DInstance<NodeObject, LinkObject>;
}
