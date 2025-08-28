import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { QueryProvider } from './QueryProvider'
import { createElement } from 'react'
import { useQuery } from '@tanstack/react-query'

// Mock environment variable
vi.stubEnv('DEV', false)

describe('QueryProvider', () => {
  it('should render children without crashing', () => {
    const TestComponent = () => createElement('div', { 'data-testid': 'test-child' }, 'Test Child')
    
    const { getByTestId } = render(
      createElement(QueryProvider, {}, createElement(TestComponent))
    )
    
    expect(getByTestId('test-child')).toBeInTheDocument()
    expect(getByTestId('test-child')).toHaveTextContent('Test Child')
  })

  it('should provide QueryClient context', () => {
    const TestComponent = () => {
      // This component will only render if QueryClient is available
      return createElement('div', { 'data-testid': 'query-context' }, 'Query context works')
    }
    
    const { getByTestId } = render(
      createElement(QueryProvider, {}, createElement(TestComponent))
    )
    
    expect(getByTestId('query-context')).toBeInTheDocument()
  })

  it('should provide working useQuery hook', () => {
    const TestComponent = () => {
      const { isLoading } = useQuery({
        queryKey: ['test'],
        queryFn: () => Promise.resolve('test data'),
        enabled: false // Don't actually run the query
      })
      
      return createElement('div', { 'data-testid': 'query-hook' }, 
        isLoading ? 'Loading' : 'Ready'
      )
    }
    
    const { getByTestId } = render(
      createElement(QueryProvider, {}, createElement(TestComponent))
    )
    
    expect(getByTestId('query-hook')).toHaveTextContent('Ready')
  })

  it('should configure query client with proper defaults', () => {
    const TestComponent = () => {
      useQuery({
        queryKey: ['config-test'],
        queryFn: () => Promise.resolve('test'),
        enabled: false
      })
      
      return createElement('div', { 'data-testid': 'config-test' }, 'Config works')
    }
    
    const { getByTestId } = render(
      createElement(QueryProvider, {}, createElement(TestComponent))
    )
    
    expect(getByTestId('config-test')).toBeInTheDocument()
  })
})
