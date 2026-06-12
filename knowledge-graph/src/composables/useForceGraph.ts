import { ref, watch, onUnmounted, type Ref } from 'vue';
import ForceGraph3D from '3d-force-graph';
import * as THREE from 'three';
import type { ModuleData, GraphNode, GraphLink } from '../types';
import { getLevelColor, getNodeSize, LINK_COLOR, LINK_HIGHLIGHT_COLOR } from '../config/colors';
import { KNOWLEDGE_LINKS, EXCLUDED_IDS } from '../config/knowledge-links';

export function useForceGraph(containerRef: Ref<HTMLElement | null>, modules: Ref<ModuleData[]>) {
  let graph: any = null;
  const hoveredNode = ref<GraphNode | null>(null);

  /** 将 modules 数据转为 graph 数据 */
  function buildGraphData(mods: ModuleData[]) {
    const filtered = mods.filter(m => !EXCLUDED_IDS.has(m.id));
    const nodeMap = new Set(filtered.map(m => m.id));

    // Nodes
    const nodes: GraphNode[] = filtered.map(m => ({
      id: m.id,
      name: m.name,
      level: m.level,
      level_name: m.level_name,
      is_custom: !!m.is_custom,
      progress_percentage: m.progress_percentage,
      val: getNodeSize(m.progress_percentage),
      color: getLevelColor(m.level, m.is_custom),
    }));

    // Links: prerequisites + knowledge links
    const linkSet = new Set<string>();
    const links: GraphLink[] = [];

    // Prerequisite links
    for (const m of filtered) {
      for (const pre of (m.prerequisites || [])) {
        const key = `${pre}->${m.id}`;
        if (nodeMap.has(pre) && !linkSet.has(key)) {
          linkSet.add(key);
          links.push({ source: pre, target: m.id, color: LINK_COLOR });
        }
      }
    }

    // Conceptual knowledge links
    for (const kl of KNOWLEDGE_LINKS) {
      const key = `${kl.source}->${kl.target}`;
      if (nodeMap.has(kl.source) && nodeMap.has(kl.target) && !linkSet.has(key)) {
        linkSet.add(key);
        links.push({ source: kl.source, target: kl.target, color: LINK_COLOR });
      }
    }

    return { nodes, links };
  }

  /** Create a glowing sphere for each node */
  function customNodeObject(node: GraphNode, group: THREE.Group) {
    const color = new THREE.Color(node.color);
    const size = node.val;

    // Main sphere
    const geometry = new THREE.SphereGeometry(size, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.9,
    });
    const sphere = new THREE.Mesh(geometry, material);
    group.add(sphere);

    // Glow sprite
    const spriteMaterial = new THREE.SpriteMaterial({
      map: generateGlowTexture(node.color),
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(size * 5, size * 5, 1);
    group.add(sprite);
  }

  /** Generate a radial gradient glow texture */
  function generateGlowTexture(hexColor: string): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, hexColor);
    gradient.addColorStop(0.3, hexColor + '88');
    gradient.addColorStop(1, hexColor + '00');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  function init() {
    if (!containerRef.value) return;

    const data = buildGraphData(modules.value);

    graph = ForceGraph3D()(containerRef.value)
      .graphData(data)
      .backgroundColor('#0a0a1a')
      .nodeThreeObject(customNodeObject)
      .nodeThreeObjectExtend(true)
      .nodeLabel((node: any) => `${node.name} (${node.progress_percentage}%)`)
      .linkColor(() => LINK_COLOR)
      .linkWidth(0.5)
      .linkOpacity(0.3)
      .linkDirectionalArrowLength(2)
      .linkDirectionalArrowRelPos(1)
      .linkDirectionalArrowColor(() => 'rgba(255,255,255,0.15)')
      .nodeVal((node: any) => node.val)
      .warmupTicks(50)
      .cooldownTicks(200)
      .onNodeHover((node: any) => {
        hoveredNode.value = node || null;
        // Highlight links
        if (graph) {
          graph
            .linkColor((link: any) => {
              if (!node) return LINK_COLOR;
              return (link.source.id === node.id || link.target.id === node.id)
                ? LINK_HIGHLIGHT_COLOR
                : LINK_COLOR;
            })
            .linkWidth((link: any) => {
              if (!node) return 0.5;
              return (link.source.id === node.id || link.target.id === node.id)
                ? 2
                : 0.5;
            })
            .linkOpacity((link: any) => {
              if (!node) return 0.3;
              return (link.source.id === node.id || link.target.id === node.id)
                ? 0.8
                : 0.08;
            });
        }
        // Cursor style
        containerRef.value!.style.cursor = node ? 'pointer' : 'default';
      })
      .onNodeClick((node: any) => {
        if (!node) return;
        const href = node.is_custom
          ? `/skills/custom-module/${node.id}`
          : `/skills/module/${node.id}`;
        window.parent.postMessage({ type: 'navigate', href }, '*');
      });

    // Add level cluster force via d3Force
    const forceFn = graph.d3Force;
    if (forceFn) {
      forceFn('levelCluster', levelClusterForce());
    }

    // Add star field after engine settles
    graph.onEngineStop(() => {
      addStarField();
    });
    // Also try adding immediately (scene may already be ready)
    setTimeout(() => addStarField(), 100);
  }

  /** Custom d3 force: attract nodes toward their level's concentric shell */
  function levelClusterForce() {
    const RADII: Record<number, number> = { 1: 40, 2: 80, 3: 130, 4: 180 };
    const STRENGTH = 0.008;
    return function force(alpha: number) {
      if (!graph) return;
      const nodes = graph.graphData()?.nodes as GraphNode[] | undefined;
      if (!nodes) return;
      for (const node of nodes) {
        const targetR = RADII[node.level] || 80;
        const dist = Math.sqrt((node as any).x ** 2 + (node as any).y ** 2 + ((node as any).z || 0) ** 2);
        if (dist > 0) {
          const factor = STRENGTH * alpha * (targetR - dist) / dist;
          (node as any).vx += (node as any).x * factor;
          (node as any).vy += (node as any).y * factor;
          (node as any).vz += ((node as any).z || 0) * factor;
        }
      }
    };
  }

  /** Add background star particles */
  function addStarField() {
    if (!graph) return;
    const scene = graph.scene();
    if (!scene) return;
    const starCount = 2000;
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 800;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 800;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 800;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.4,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
    });
    const stars = new THREE.Points(geometry, material);
    scene.add(stars);
  }

  function dispose() {
    if (graph) {
      graph._destructor();
      graph = null;
    }
  }

  watch(modules, (newMods) => {
    if (graph && newMods.length > 0) {
      const data = buildGraphData(newMods);
      graph.graphData(data);
    } else if (!graph && newMods.length > 0) {
      init();
    }
  }, { deep: true });

  onUnmounted(dispose);

  return { hoveredNode, init, dispose };
}
