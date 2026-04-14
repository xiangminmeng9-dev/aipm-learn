import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const modules = [
  {
    title: 'AI Coding 练习',
    description: '输入 AI Coding 面试题目，获取开发范式流程指导',
    href: '/coding',
    icon: '💻',
    available: false,
  },
  {
    title: 'AI PM 技能学习',
    description: '对标大厂招聘要求的技能树，细粒度学习任务',
    href: '/skills',
    icon: '📚',
    available: false,
  },
  {
    title: 'AI PM 面试助手',
    description: '面试问答、模拟面试、方法论提炼，全方位面试准备',
    href: '/interview/qa',
    icon: '🎯',
    available: true,
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 px-4">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-neutral-50">
          AI 产品经理学习平台
        </h1>
        <p className="text-lg text-neutral-400">AI Coding · 技能学习 · 面试助手</p>
      </div>

      <div className="grid w-full max-w-4xl gap-6 md:grid-cols-3">
        {modules.map((mod) => (
          <Card
            key={mod.title}
            className="border-neutral-800 bg-neutral-900 transition-colors hover:border-amber-600/50"
          >
            <CardHeader>
              <div className="mb-2 text-3xl">{mod.icon}</div>
              <CardTitle className="text-neutral-50">{mod.title}</CardTitle>
              <CardDescription className="text-neutral-400">{mod.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {mod.available ? (
                <Link href={mod.href}>
                  <Button className="w-full bg-amber-600 text-neutral-950 hover:bg-amber-500">
                    进入
                  </Button>
                </Link>
              ) : (
                <Button className="w-full" disabled variant="outline">
                  即将上线
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
