import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/react'
import { ConfirmDialog } from './confirm-dialog'

describe('ConfirmDialog', () => {
  it('renders title, description and buttons when open', () => {
    render(
      <ConfirmDialog
        open
        title="Delete Exercise?"
        description="This will permanently remove Bench Press"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    )
    expect(screen.getByRole('dialog', { name: 'Delete Exercise?' })).toBeInTheDocument()
    expect(screen.getByText('This will permanently remove Bench Press')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
  })

  it('renders nothing when closed', () => {
    const { container } = render(
      <ConfirmDialog open={false} title="Delete Exercise?" onConfirm={() => {}} onCancel={() => {}} />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('calls onConfirm when confirm is clicked', () => {
    const onConfirm = vi.fn()
    render(<ConfirmDialog open title="Delete Exercise?" onConfirm={onConfirm} onCancel={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('calls onCancel when Cancel is clicked', () => {
    const onCancel = vi.fn()
    render(<ConfirmDialog open title="Delete Exercise?" onConfirm={() => {}} onCancel={onCancel} />)
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('calls onCancel on Escape', () => {
    const onCancel = vi.fn()
    render(<ConfirmDialog open title="Delete Exercise?" onConfirm={() => {}} onCancel={onCancel} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('focuses the Cancel button when opened', () => {
    render(<ConfirmDialog open title="Delete Exercise?" onConfirm={() => {}} onCancel={() => {}} />)
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()
  })
})
