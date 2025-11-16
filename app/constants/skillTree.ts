export interface SkillNodeSizing {
  minWidth: number
  minHeight: number
  horizontalPadding: number
  verticalPadding: number
  fontSize: number
}

export interface SkillTreeSettings {
  viewport: {
    width: number
    height: number
  }
  layout: {
    verticalGap: number
    horizontalGap: number
  }
  node: SkillNodeSizing
}

export const SKILL_TREE_DEFAULT_SETTINGS: SkillTreeSettings = {
  viewport: {
    width: 800,
    height: 600,
  },
  layout: {
    verticalGap: 100,
    horizontalGap: 60,
  },
  node: {
    minWidth: 80,
    minHeight: 40,
    horizontalPadding: 24,
    verticalPadding: 16,
    fontSize: 14,
  },
} as const

export const SKILL_NODE_STYLES = {
  colors: {
    dimmedFill: 'rgb(241,245,249)',
    dimmedStroke: 'rgb(203,213,225)',
  },
  opacityClasses: {
    dimmed: 'opacity-60',
    active: 'opacity-100',
  },
} as const

export const SKILL_TREE_CONSTANTS = {
  dimmedLinkColor: 'rgba(148, 163, 184, 0.4)',
} as const
