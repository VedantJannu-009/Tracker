import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/react'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from './dropdown-menu'
import { MoreVertical } from 'lucide-react'

function renderMenu(onClick?: () => void) {
  render(
    <DropdownMenu>
      <DropdownMenuTrigger aria-label="Open menu"><MoreVertical size={16} /></DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={onClick}>First</DropdownMenuItem>
        <DropdownMenuItem>Second</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
  return screen.getByRole('button', { name: 'Open menu' })
}

describe('DropdownMenu keyboard support', () => {
  it('opens with ArrowDown and focuses the first item', () => {
    const trigger = renderMenu()
    fireEvent.keyDown(trigger, { key: 'ArrowDown' })
    expect(screen.getByRole('menu')).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'First' })).toHaveFocus()
  })

  it('navigates items with arrow keys and closes on Escape', () => {
    const trigger = renderMenu()
    fireEvent.click(trigger)
    const menu = screen.getByRole('menu')
    const first = screen.getByRole('menuitem', { name: 'First' })
    const second = screen.getByRole('menuitem', { name: 'Second' })
    expect(first).toHaveFocus()

    fireEvent.keyDown(menu, { key: 'ArrowDown' })
    expect(second).toHaveFocus()

    fireEvent.keyDown(menu, { key: 'ArrowUp' })
    expect(first).toHaveFocus()

    fireEvent.keyDown(menu, { key: 'Escape' })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('activates the focused item on click', () => {
    const onClick = vi.fn()
    renderMenu(onClick)
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'First' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
