import { render, screen } from '@testing-library/react'
import Home from '../page'

describe('Home Page', () => {
  it('renders without crashing', () => {
    render(<Home />)
    
    // Check for some expected content on the home page
    expect(screen.getByRole('main')).toBeInTheDocument()
  })
})