import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/Button'

describe('Button', () => {
  it('renders primary variant', () => {
    render(<Button variant="primary">Go</Button>)
    expect(screen.getByRole('button', { name: 'Go' })).toBeInTheDocument()
  })

  it('handles click', () => {
    const onClick = jest.fn()
    render(
      <Button variant="secondary" onClick={onClick}>
        Tap
      </Button>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Tap' }))
    expect(onClick).toHaveBeenCalled()
  })

  it('shows loading state', () => {
    render(
      <Button loading aria-label="Saving">
        Save
      </Button>
    )
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true')
  })

  it('disabled prevents click', () => {
    const onClick = jest.fn()
    render(
      <Button disabled onClick={onClick}>
        Nope
      </Button>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Nope' }))
    expect(onClick).not.toHaveBeenCalled()
  })
})
