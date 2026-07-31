import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Toaster } from '@/components/ui/toast'
import { useToastStore, toast } from '@/stores/toastStore'

vi.mock('framer-motion', () => {
  const passthrough = ({ children }: { children?: React.ReactNode }) => children
  return {
    AnimatePresence: passthrough,
    motion: new Proxy(
      {},
      {
        get: () => passthrough,
      }
    ),
  }
})

beforeEach(() => {
  useToastStore.setState({ toasts: [] })
})

describe('Toaster', () => {
  it('renders a success toast', () => {
    render(<Toaster />)
    act(() => {
      toast('Workout saved')
    })
    expect(screen.getByText('Workout saved')).toBeInTheDocument()
  })

  it('renders an error toast', () => {
    render(<Toaster />)
    act(() => {
      toast('Failed to save workout', 'error')
    })
    expect(screen.getByText('Failed to save workout')).toBeInTheDocument()
  })

  it('dismisses a toast on close', () => {
    render(<Toaster />)
    act(() => {
      toast('Dismiss me')
    })
    fireEvent.click(screen.getByLabelText('Dismiss'))
    expect(screen.queryByText('Dismiss me')).not.toBeInTheDocument()
  })
})
