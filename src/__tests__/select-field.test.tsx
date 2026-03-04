import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SelectField } from '@/components/worksheets/fields/select-field'

const baseField = {
  id: 'severity',
  type: 'select' as const,
  label: 'Severity',
  required: false,
  options: [
    { id: 'mild', label: 'Mild' },
    { id: 'moderate', label: 'Moderate' },
    { id: 'severe', label: 'Severe' },
  ],
}

describe('SelectField', () => {
  it('renders with a label', () => {
    render(<SelectField field={baseField} value="" onChange={() => {}} />)
    expect(screen.getByLabelText('Severity')).toBeInTheDocument()
  })

  it('renders all options plus a default placeholder', () => {
    render(<SelectField field={baseField} value="" onChange={() => {}} />)
    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(4) // "Select..." + 3 options
    expect(options[0]).toHaveTextContent('Select...')
  })

  it('uses custom placeholder', () => {
    const field = { ...baseField, placeholder: 'Pick one...' }
    render(<SelectField field={field} value="" onChange={() => {}} />)
    expect(screen.getAllByRole('option')[0]).toHaveTextContent('Pick one...')
  })

  it('displays the selected value', () => {
    render(<SelectField field={baseField} value="moderate" onChange={() => {}} />)
    expect(screen.getByDisplayValue('Moderate')).toBeInTheDocument()
  })

  it('calls onChange when user selects an option', () => {
    const onChange = vi.fn()
    render(<SelectField field={baseField} value="" onChange={onChange} />)
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'severe' } })
    expect(onChange).toHaveBeenCalledWith('severe')
  })

  it('shows required indicator when field.required is true', () => {
    const required = { ...baseField, required: true }
    render(<SelectField field={required} value="" onChange={() => {}} />)
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  // ── Error state ──
  describe('error state', () => {
    it('shows error message when showError is true', () => {
      render(<SelectField field={baseField} value="" onChange={() => {}} showError />)
      expect(screen.getByRole('alert')).toHaveTextContent('Please select an option')
    })

    it('sets aria-invalid when showError is true', () => {
      render(<SelectField field={baseField} value="" onChange={() => {}} showError />)
      expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true')
    })

    it('does not show error when showError is false', () => {
      render(<SelectField field={baseField} value="" onChange={() => {}} />)
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })
})
