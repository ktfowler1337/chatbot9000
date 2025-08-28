import { describe, it, expect } from 'vitest'
import { render, screen } from '../test/test-utils'
import { LoadingDots } from './LoadingDots'

describe('LoadingDots', () => {
  it('renders loading dots animation', () => {
    render(<LoadingDots />)
    
    // Check that the loading container is present
    const loadingContainer = screen.getByRole('status')
    expect(loadingContainer).toBeInTheDocument()
  })

  it('has correct accessibility attributes', () => {
    render(<LoadingDots />)
    
    const loadingContainer = screen.getByRole('status')
    expect(loadingContainer).toHaveAttribute('aria-label', 'AI is generating response')
  })

  it('contains three dots', () => {
    render(<LoadingDots />)
    
    // Check for the bullet characters
    const dots = screen.getAllByText('•')
    expect(dots).toHaveLength(3)
  })

  it('applies correct styling for animation', () => {
    render(<LoadingDots />)
    
    const loadingContainer = screen.getByRole('status')
    expect(loadingContainer).toHaveStyle({
      display: 'inline-flex',
      gap: '4px',
      alignItems: 'center',
    })
  })
})
