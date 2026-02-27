// JSONB worksheet schema types — defines the structure stored in worksheets.schema

// Field types available in the custom worksheet builder
export type CustomFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'likert'
  | 'checklist'
  | 'date'
  | 'time'
  | 'select'
  | 'table'
  | 'computed'
  | 'formulation'
  | 'record'

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'likert'
  | 'checklist'
  | 'date'
  | 'time'
  | 'select'
  | 'table'
  // Extended types for advanced clinical tools
  | 'computed'
  | 'formulation'
  | 'hierarchy'
  | 'decision_tree'
  | 'safety_plan'
  | 'record'

export interface BaseField {
  id: string
  label: string
  required?: boolean
  placeholder?: string
}

export interface TextField extends BaseField {
  type: 'text'
}

export interface TextareaField extends BaseField {
  type: 'textarea'
}

export interface NumberField extends BaseField {
  type: 'number'
  min?: number
  max?: number
  step?: number
}

export interface LikertField extends BaseField {
  type: 'likert'
  min: number
  max: number
  step?: number
  anchors?: Record<string, string>
}

export interface ChecklistField extends BaseField {
  type: 'checklist'
  options: { id: string; label: string }[]
}

export interface DateField extends BaseField {
  type: 'date'
}

export interface TimeField extends BaseField {
  type: 'time'
}

export interface SelectField extends BaseField {
  type: 'select'
  options: { id: string; label: string }[]
}

export interface TableColumn {
  id: string
  header: string
  type: 'text' | 'textarea' | 'number'
  min?: number
  max?: number
  step?: number
  suffix?: string
  width?: 'narrow' | 'normal' | 'wide'
}

export interface TableField extends BaseField {
  type: 'table'
  columns: TableColumn[]
  min_rows?: number
  max_rows?: number
  group_by?: string
}

// ============================================================================
// Extended field types for advanced clinical tools
// ============================================================================

// Computed field — auto-calculated from other fields
export interface ComputedFieldComputation {
  operation: 'difference' | 'average' | 'count' | 'sum' | 'min' | 'max' | 'percentage_change'
  field?: string           // e.g. "activity-table.pleasure"
  field_a?: string         // for difference / percentage_change: field_a - field_b
  field_b?: string
  fields?: string[]        // for sum / average / count / min / max: list of source field IDs
  format?: 'percentage_change' | 'number' | 'integer'
  group_by?: string
}

export interface ComputedField extends BaseField {
  type: 'computed'
  computation: ComputedFieldComputation
}

// Hierarchy field — ordered list with SUDS ratings and gradient bars
export interface HierarchyField extends BaseField {
  type: 'hierarchy'
  columns: TableColumn[]
  sort_by?: string
  sort_direction?: 'asc' | 'desc'
  min_rows?: number
  max_rows?: number
  visualisation?: 'gradient_bar'
  gradient?: {
    low: string
    mid: string
    high: string
  }
}

// Safety plan field — numbered sequential steps
export interface SafetyPlanStep {
  id: string
  step: number
  label: string
  hint?: string
  highlight?: 'red'
  fields: { id: string; type: 'textarea'; placeholder?: string }[]
}

export interface SafetyPlanField extends BaseField {
  type: 'safety_plan'
  steps: SafetyPlanStep[]
}

// Decision tree field — branching yes/no flow
export interface DecisionTreeBranch {
  label: string
  colour: 'green' | 'red'
  fields?: { id: string; type: 'text' | 'textarea'; label: string; placeholder?: string }[]
  outcome: string
}

export interface DecisionTreeField extends BaseField {
  type: 'decision_tree'
  question: string
  branches: {
    yes: DecisionTreeBranch
    no: DecisionTreeBranch
  }
}

// Formulation field — spatial/diagrammatic layouts

// Legacy layout names (used by curated worksheets in schema.layout)
export type FormulationLayout =
  | 'cross_sectional'     // Hot cross bun: 5-area model
  | 'vicious_flower'      // Central problem with radial petals
  | 'longitudinal'        // Vertical Beckian developmental flow

// New generalised layout patterns (used by custom formulations)
export type FormulationLayoutPattern =
  | 'cross_sectional'
  | 'radial'
  | 'vertical_flow'
  | 'cycle'
  | 'three_systems'

export type DomainType =
  | 'situation' | 'thoughts' | 'emotions' | 'physical'
  | 'behaviour' | 'reassurance' | 'attention'

// Field types allowed inside formulation nodes (subset — no table, formulation, etc.)
export type FormulationNodeFieldType = 'text' | 'textarea' | 'number' | 'likert' | 'checklist' | 'select'

export interface FormulationNodeField {
  id: string
  type: FormulationNodeFieldType
  label?: string
  placeholder?: string
  min?: number
  max?: number
  step?: number
  suffix?: string
  options?: { id: string; label: string }[]
  anchors?: Record<string, string>
}

export interface FormulationNode {
  id: string
  slot: string              // Position hint for layout engine (e.g. 'top', 'left', 'centre', 'petal-0')
  label: string
  domain_colour: string     // Hex colour — therapist picks from palette or custom
  description?: string      // Tooltip/subtitle shown to client
  fields: FormulationNodeField[]
}

export interface FormulationConnection {
  from: string              // Node ID
  to: string                // Node ID
  style: 'arrow' | 'arrow_dashed' | 'line' | 'line_dashed' | 'inhibitory'
  direction: 'one_way' | 'both' | 'none'
  label?: string            // Optional text rendered at midpoint
}

export interface FormulationConfig {
  title?: string
  show_title?: boolean
  background?: string
}

export interface FormulationField extends BaseField {
  type: 'formulation'
  // New generalised format (custom formulations)
  layout: FormulationLayoutPattern | FormulationLayout
  formulation_config?: FormulationConfig
  nodes?: FormulationNode[]
  connections?: FormulationConnection[]
  // Legacy fields (curated worksheets — backward compat)
  dynamic?: boolean
  min_items?: number
  max_items?: number
  item_template?: {
    fields: { id: string; type: 'text' | 'textarea'; label: string; placeholder?: string }[]
  }
  default_items?: { petal_label: string; domain: DomainType }[]
  highlight?: 'amber' | 'red_dashed'
  domain?: DomainType
}

// Record field — paginated multi-column records (e.g. 5-column thought record)
export type RecordSubFieldType = 'text' | 'textarea' | 'number' | 'likert' | 'checklist' | 'select'

export interface RecordSubField {
  id: string
  type: RecordSubFieldType
  label?: string
  placeholder?: string
  min?: number
  max?: number
  step?: number
  suffix?: string
  anchors?: Record<string, string>
  options?: { id: string; label: string }[]
}

export interface RecordGroup {
  id: string
  header: string
  width?: 'narrow' | 'normal' | 'wide'
  fields: RecordSubField[]
}

export interface RecordField extends BaseField {
  type: 'record'
  groups: RecordGroup[]
  min_records?: number   // default 1
  max_records?: number   // default 20
}

export type WorksheetField =
  | TextField
  | TextareaField
  | NumberField
  | LikertField
  | ChecklistField
  | DateField
  | TimeField
  | SelectField
  | TableField
  | ComputedField
  | HierarchyField
  | SafetyPlanField
  | DecisionTreeField
  | FormulationField
  | RecordField

export interface WorksheetSection {
  id: string
  title?: string
  label?: string            // Used by safety plan sections
  description?: string
  domain?: DomainType
  highlight?: 'amber' | 'red_dashed' | 'red'
  layout?: 'four_quadrant'
  step?: number
  hint?: string
  dynamic?: boolean
  type?: 'branch'
  question?: string
  branches?: {
    yes: DecisionTreeBranch
    no: DecisionTreeBranch
  }
  // For vicious flower dynamic petals
  min_items?: number
  max_items?: number
  item_template?: {
    fields: { id: string; type: string; label: string; placeholder?: string }[]
  }
  default_items?: { petal_label: string; domain: DomainType }[]
  fields: WorksheetField[]
}

export type SchemaLayout =
  | 'formulation_cross_sectional'
  | 'formulation_vicious_flower'
  | 'formulation_longitudinal'
  | 'decision_tree'
  | 'safety_plan'

export interface WorksheetSchema {
  version: number
  layout?: SchemaLayout
  sections: WorksheetSection[]
}
