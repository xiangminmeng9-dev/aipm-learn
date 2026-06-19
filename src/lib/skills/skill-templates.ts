export const SKILL_TEMPLATES = {
  basic: {
    name: '基础技能',
    description: '最简单的 Skill 模板，适合快速上手',
    content: `---
name: my-skill
description: Describe what this skill does and when to use it.
---

# My Skill

## Instructions

1. Step one: describe what to do
2. Step two: describe how to do it
3. Step three: describe the expected output

## Examples

Input: example input
Output: example output

## Notes

- Keep instructions clear and specific
- Use numbered steps for sequential tasks
- Include examples for complex operations
`,
  },

  agent: {
    name: 'Agent 工作流',
    description: '带工具定义的多步骤 Agent 技能',
    content: `---
name: my-agent-skill
description: An agent skill that orchestrates multi-step workflows with tool usage.
allowed-tools: Read Write Edit Bash
---

# My Agent Skill

## When to Use

Use this skill when the user asks to [describe trigger condition].

## Workflow

### Step 1: Understand the Request
- Read the user request carefully
- Identify key requirements and constraints
- Clarify any ambiguities before proceeding

### Step 2: Plan the Approach
- Break down the task into sub-tasks
- Identify which tools are needed for each sub-task
- Consider edge cases and error handling

### Step 3: Execute
- Execute each sub-task in order
- Validate results after each step
- Adjust approach if intermediate results differ from expectations

### Step 4: Verify and Report
- Verify the final output meets all requirements
- Summarize what was done and why
- Suggest next steps or improvements

## Error Handling

- If a tool call fails, explain the error and suggest alternatives
- If the task is ambiguous, ask the user for clarification
- If the task exceeds scope, explain limitations and offer what is possible
`,
  },

  workflow: {
    name: '结构化工作流',
    description: '带上下文管理和步骤化指令的工作流技能',
    content: `---
name: my-workflow-skill
description: A structured workflow skill with context management and effort levels.
metadata:
  author: your-name
  version: "1.0"
  category: workflow
effort: high
---

# My Workflow Skill

## Overview

This skill provides a structured workflow for [describe purpose].

## Context Management

Before starting, gather the following context:
- **Required**: [list required inputs]
- **Optional**: [list optional inputs with defaults]
- **Output format**: [describe expected output format]

## Process

### Phase 1: Analysis (effort: medium)
1. Analyze the input data
2. Identify patterns and key insights
3. Document findings

### Phase 2: Design (effort: high)
1. Design the solution based on analysis
2. Consider multiple approaches
3. Select the optimal approach with rationale

### Phase 3: Implementation (effort: high)
1. Implement the chosen approach
2. Follow best practices
3. Include error handling and validation

### Phase 4: Review (effort: medium)
1. Review the implementation
2. Test edge cases
3. Optimize if needed

## Output Format

Provide the result in the following format:
\`\`\`
[describe output format]
\`\`\`

## Tips

- Start with analysis before jumping to implementation
- Validate assumptions at each phase
- Document decisions and rationale
`,
  },

  'pm-specialist': {
    name: '产品经理专项',
    description: '专为产品经理设计的技能模板，体现 PM 思维和方法论',
    content: `---
name: pm-skill-name
description: A product manager skill for [specific PM task]. Use when the user needs to [trigger condition].
metadata:
  author: your-name
  version: "1.0"
  category: product-management
  role: product-manager
allowed-tools: Read Write Edit Bash WebFetch
---

# PM Skill: [Skill Name]

## 适用场景

当用户需要 [具体场景描述] 时使用此技能。

## 核心方法论

### 1. 需求定义
- **用户是谁**: 定义目标用户画像
- **用户痛点**: 描述用户当前遇到的问题
- **期望结果**: 明确用户想要达成的目标
- **成功标准**: 定义可衡量的成功指标

### 2. 方案设计
- **方案选项**: 列出 2-3 个可选方案
- **方案对比**: 从成本/效果/风险三个维度对比
- **推荐方案**: 选择最优方案并说明理由
- **MVP 定义**: 定义最小可行方案的范围

### 3. 执行验证
- **实施步骤**: 分步骤描述执行计划
- **数据验证**: 定义验证假设的数据指标
- **A/B 测试**: 如需要，设计 A/B 测试方案
- **迭代节奏**: 定义优化迭代周期

### 4. 结果评估
- **效果指标**: 对比 before/after 数据
- **用户反馈**: 收集和分析用户反馈
- **下一步**: 基于数据决定继续/调整/放弃

## 输出格式

请按以下结构输出结果：

### 需求分析
[用户需求 + 痛点 + 成功标准]

### 方案
[推荐方案 + 理由 + MVP 范围]

### 执行计划
[步骤 + 时间线 + 负责人]

### 验证方案
[指标 + A/B 设计 + 迭代节奏]

## PM 思维要点

- **数据驱动**: 每个决策都要有数据支撑
- **用户导向**: 从用户需求出发，不是技术驱动
- **ROI 意识**: 考虑投入产出比，优先高 ROI 方案
- **风险意识**: 识别风险并准备降级方案
- **可衡量**: 所有目标必须可量化
`,
  },
} as const;

export type SkillTemplateKey = keyof typeof SKILL_TEMPLATES;
