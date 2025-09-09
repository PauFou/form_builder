import { render, screen } from '@testing-library/react'
import { BlockItem } from '../block-item'

describe('BlockItem', () => {
  it('renders without crashing', () => {
    render(
      <BlockItem
        id="test-block"
        type="text"
        title="Test Block"
        description="A test block"
        icon="text"
      />
    )
    
    expect(screen.getByText('Test Block')).toBeInTheDocument()
  })
})