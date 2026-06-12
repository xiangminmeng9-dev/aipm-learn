import { ref, onMounted, onUnmounted } from 'vue';
import type { ModuleData, MessageIn } from '../types';

export function useMessageBridge() {
  const modules = ref<ModuleData[]>([]);
  const ready = ref(false);

  const handleMessage = (event: MessageEvent) => {
    const data = event.data as MessageIn;
    if (data?.type === 'init' && Array.isArray(data.modules)) {
      modules.value = data.modules;
      ready.value = true;
    }
  };

  onMounted(() => {
    window.addEventListener('message', handleMessage);
  });

  onUnmounted(() => {
    window.removeEventListener('message', handleMessage);
  });

  /** 通知父页面导航 */
  function navigate(href: string) {
    window.parent.postMessage({ type: 'navigate', href }, '*');
  }

  return { modules, ready, navigate };
}
