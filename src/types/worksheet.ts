// JSONB worksheet schema types — defines the structure stored in worksheets.schema

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
}

export interface TableField extends BaseField {
  type: 'table'
  columns: TableColumn[]
  min_rows?: number
  max_rows?: number
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

export interface WorksheetSection {
  id: string
  title: string
  description?: string
  fields: WorksheetField[]
}

export interface WorksheetSchema {
  version: number
  sections: WorksheetSection[]
}
