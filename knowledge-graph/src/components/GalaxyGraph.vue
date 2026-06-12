<template>
  <div class="galaxy-wrapper">
    <!-- Graph container (not managed by Vue) -->
    <div ref="graphMount" class="graph-mount"></div>

    <!-- Legend -->
    <div class="legend">
      <div v-for="(color, level) in levelColors" :key="level" class="legend-item">
        <span class="legend-dot" :style="{ background: color, boxShadow: `0 0 6px ${color}` }" />
        <span class="legend-label">{{ levelNames[level as unknown as number] }}</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot" :style="{ background: customColor, boxShadow: `0 0 6px ${customColor}` }" />
        <span class="legend-label">自定义模块</span>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="!graphReady" class="loading">
      <div class="loading-spinner" />
      <span>星图生成中...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useMessageBridge } from '../composables/useMessageBridge';
import { LEVEL_COLORS, CUSTOM_COLOR } from '../config/colors';
import type { ModuleData, GraphNode, GraphLink } from '../types';
import { getLevelColor, getNodeSize, LINK_COLOR, LINK_HIGHLIGHT_COLOR } from '../config/colors';
import { KNOWLEDGE_LINKS, EXCLUDED_IDS } from '../config/knowledge-links';

const levelColors = LEVEL_COLORS;
const customColor = CUSTOM_COLOR;
const levelNames: Record<number, string> = {
  1: '基础入门',
  2: '核心能力',
  3: '进阶专项',
  4: '实战综合',
};

const graphMount = ref<HTMLElement | null>(null);
const graphReady = ref(false);
const { modules, ready } = useMessageBridge();

let graph: any = null;

function buildGraphData(mods: ModuleData[]) {
  const filtered = mods.filter(m => !EXCLUDED_IDS.has(m.id));
  const nodeMap = new Set(filtered.map(m => m.id));
  const nodes = filtered.map(m => ({
    id: m.id, name: m.name, level: m.level, level_name: m.level_name,
    is_custom: !!m.is_custom, progress_percentage: m.progress_percentage,
    val: getNodeSize(m.progress_percentage), color: getLevelColor(m.level, m.is_custom),
  }));
  const linkSet = new Set<string>();
  const links: any[] = [];
  for (const m of filtered) {
    for (const pre of (m.prerequisites || [])) {
      const key = `${pre}->${m.id}`;
      if (nodeMap.has(pre) && !linkSet.has(key)) { linkSet.add(key); links.push({ source: pre, target: m.id }); }
    }
  }
  for (const kl of KNOWLEDGE_LINKS) {
    const key = `${kl.source}->${kl.target}`;
    if (nodeMap.has(kl.source) && nodeMap.has(kl.target) && !linkSet.has(key)) { linkSet.add(key); links.push({ source: kl.source, target: kl.target }); }
  }
  return { nodes, links };
}

function initGraph() {
  if (!graphMount.value || modules.value.length === 0) return;

  // Dynamically import to avoid SSR issues
  import('3d-force-graph').then(({ default: ForceGraph3D }) => {
    import('three').then((THREE) => {
      const data = buildGraphData(modules.value);

      const customNodeObject = (node: any) => {
        const group = new THREE.Group();
        const color = new THREE.Color(node.color);
        const size = node.val;
        const geometry = new THREE.SphereGeometry(size, 24, 24);
        const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 });
        group.add(new THREE.Mesh(geometry, material));

        // Glow
        const canvas = document.createElement('canvas');
        canvas.width = 128; canvas.height = 128;
        const ctx = canvas.getContext('2d')!;
        const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        gradient.addColorStop(0, node.color);
        gradient.addColorStop(0.3, node.color + '88');
        gradient.addColorStop(1, node.color + '00');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 128, 128);
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(size * 5, size * 5, 1);
        group.add(sprite);
        return group;
      };

      graph = ForceGraph3D()(graphMount.value!)
        .graphData(data)
        .backgroundColor('#0a0a1a')
        .nodeThreeObject(customNodeObject)
        .nodeThreeObjectExtend(true)
        .nodeLabel((node: any) => `${node.name} (${node.progress_percentage}%)`)
        .linkColor(() => LINK_COLOR)
        .linkWidth(0.5)
        .linkOpacity(0.3)
        .linkDirectionalArrowLength(2.5)
        .linkDirectionalArrowRelPos(1)
        .linkDirectionalArrowColor(() => 'rgba(255,255,255,0.2)')
        .nodeVal((node: any) => node.val)
        .warmupTicks(50)
        .cooldownTicks(200)
        .onNodeClick((node: any) => {
          if (!node) return;
          const href = node.is_custom ? `/skills/custom-module/${node.id}` : `/skills/module/${node.id}`;
          window.parent.postMessage({ type: 'navigate', href }, '*');
        });

      // Add level cluster force
      const d3Force = graph.d3Force;
      if (d3Force) {
        const RADII: Record<number, number> = { 1: 40, 2: 80, 3: 130, 4: 180 };
        d3Force('levelCluster', (alpha: number) => {
          const nodes = graph.graphData()?.nodes;
          if (!nodes) return;
          for (const n of nodes) {
            const targetR = RADII[n.level] || 80;
            const dist = Math.sqrt(n.x ** 2 + n.y ** 2 + (n.z || 0) ** 2);
            if (dist > 0) {
              const factor = 0.008 * alpha * (targetR - dist) / dist;
              n.vx += n.x * factor;
              n.vy += n.y * factor;
              n.vz += (n.z || 0) * factor;
            }
          }
        });
      }

      // Add star field after first render
      setTimeout(() => {
        try {
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
          const material = new THREE.PointsMaterial({ color: 0xffffff, size: 0.4, transparent: true, opacity: 0.6, sizeAttenuation: true });
          scene.add(new THREE.Points(geometry, material));
        } catch (e) { /* ignore */ }
      }, 500);

      graphReady.value = true;
    });
  });
}

watch(ready, (isReady) => {
  if (isReady && graphMount.value && !graphReady.value) {
    initGraph();
  }
}, { immediate: true });
</script>

<style scoped>
.galaxy-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  background: #0a0a1a;
  overflow: hidden;
}

.graph-mount {
  width: 100%;
  height: 100%;
}

.legend {
  position: absolute;
  bottom: 20px;
  left: 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: rgba(15, 15, 30, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 10px 14px;
  backdrop-filter: blur(8px);
  z-index: 10;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.65);
}

.loading {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
  z-index: 5;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-top-color: #00D4FF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
