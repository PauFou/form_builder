import { render } from '@testing-library/react'
import { DndContext } from '@dnd-kit/core'
import { BlockItem } from '../block-item'
import type { Block } from '@forms/contracts'

describe('BlockItem', () => {
  it('renders without crashing', () => {
    const mockBlock: Block = {
      id: 'test-block',
      type: 'text',
      title: 'Test Block',
      description: 'A test block',
      required: false,
      placeholder: '',
      properties: {},
    }

    const { container } = render(
      <DndContext>
        <BlockItem
          block={mockBlock}
          pageId="page-1"
          index={0}
        />
      </DndContext>
    )
    
    expect(container).toBeTruthy()
  })
})