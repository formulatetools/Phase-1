import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TextField } from '@/components/worksheets/fields/text-field'

const baseField = {
  id: 'thought',
  type: 'text' as const,
  label: 'Automatic Thought',
  required: false,
}

describe('TextField', () => {
  it('renders with a label', () => {
    render(<TextField field={baseField} value="" onChange={() => {}} />)
    expect(screen.getByLabelText('Automatic Thought')).toBeInTheDocument()
  })

  it('displays the current value', () => {
    render(<TextField field={baseField} value="I am a failure" onChange={() => {}} />)
    expect(screen.getByDisplayValue('I am a failure')).toBeInTheDocument()
  })

  it('calls onChange when user types', () => {
    const onChange = vi.fn()
    render(<TextField field={baseField} value="" onChange={onChange} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'New thought' } })
    expect(onChange).toHaveBeenCalledWith('New thought')
  })

  it('shows a required indicator when field.required is true', () => {
    const requiredField = { ...baseField, required: true }
    render(<TextField field={requiredField} value="" onChange={() => {}} />)
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('does not show required indicator when field.required is false', () => {
    render(<TextField field={baseField} value="" onChange={() => {}} />)
    expect(screen.queryByText('*')).not.toBeInTheDocument()
  })

  it('renders placeholder text', () => {
    const fieldWithPlaceholder = { ...baseField, placeholder: 'Enter your thought...' }
    render(<TextField field={fieldWithPlaceholder} value="" onChange={() => {}} />)
    expect(screen.getByPlaceholderText('Enter your thought...')).toBeInTheDocument()
  })

  // ── Error state ──
  describe('error state', () => {
    it('shows error message when showError is true', () => {
      render(<TextField field={baseField} value="" onChange={() => {}} showError />)
      expect(screen.getByRole('alert')).toHaveTextContent('This field is required')
    })

    it('sets aria-invalid when showError is true', () => {
      render(<TextField field={baseField} value="" onChange={() => {}} showError />)
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
    })

    it('sets aria-describedby pointing to error message', () => {
      render(<TextField field={baseField} value="" onChange={() => {}} showError />)
      const input = screen.getByRole('textbox')
      const errorId = input.getAttribute('aria-describedby')
      expect(errorId).toBe('thought-error')
      expect(document.getElementById(errorId!)).toHaveTextContent('This field is required')
    })

    it('does not show error when showError is false', () => {
      render(<TextField field={baseField} value="" onChange={() => {}} showError={false} />)
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('does not set aria-invalid when showError is false', () => {
      render(<TextField field={baseField} value="" onChange={() => {}} />)
      expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-invalid')
    })
  })
})
