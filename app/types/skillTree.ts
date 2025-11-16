export interface SkillNode {
  id: string
  label: string
  parentIds?: string[] // Array of parent nodes (multiple parents allowed)
  descriptions?: string[] // List of skill descriptions
  score?: number // Score used to determine node color (0-100)
  hidden?: boolean // Whether to hide the node when rendering
}
