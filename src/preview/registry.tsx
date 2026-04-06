'use client'

import type { ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'

export interface PreviewVariant {
  id: string
  label: string
  jsx: string
  node: ReactNode
}

export interface PreviewRegistryEntry {
  id: string
  name: string
  category: 'ui' | 'shared' | 'features'
  variants: PreviewVariant[]
}

export const componentRegistry: PreviewRegistryEntry[] = [
  {
    id: 'button',
    name: 'Button',
    category: 'ui',
    variants: [
      {
        id: 'primary-md',
        label: 'Primary / md',
        jsx: '<Button variant="primary" size="md">Save</Button>',
        node: (
          <Button variant="primary" size="md">
            Save
          </Button>
        ),
      },
      {
        id: 'destructive-loading',
        label: 'Destructive / loading',
        jsx: '<Button variant="destructive" loading>Delete</Button>',
        node: (
          <Button variant="destructive" loading>
            Delete
          </Button>
        ),
      },
      {
        id: 'outline-disabled',
        label: 'Outline / disabled',
        jsx: '<Button variant="outline" disabled>Disabled</Button>',
        node: (
          <Button variant="outline" disabled>
            Disabled
          </Button>
        ),
      },
    ],
  },
  {
    id: 'input',
    name: 'Input',
    category: 'ui',
    variants: [
      {
        id: 'default',
        label: 'Default',
        jsx: '<Input label="Email" name="email" placeholder="you@example.com" />',
        node: <Input label="Email" name="email" placeholder="you@example.com" />,
      },
      {
        id: 'error',
        label: 'Error',
        jsx: '<Input label="Email" name="email" error="Invalid email" />',
        node: <Input label="Email" name="email" error="Invalid email" />,
      },
    ],
  },
  {
    id: 'badge',
    name: 'Badge',
    category: 'ui',
    variants: [
      {
        id: 'success',
        label: 'Success',
        jsx: '<Badge variant="success" dot>In stock</Badge>',
        node: (
          <Badge variant="success" dot>
            In stock
          </Badge>
        ),
      },
    ],
  },
  {
    id: 'card',
    name: 'Card',
    category: 'ui',
    variants: [
      {
        id: 'elevated',
        label: 'Elevated',
        jsx: '<Card variant="elevated" header="Title">Body</Card>',
        node: (
          <Card variant="elevated" header="Title">
            Body
          </Card>
        ),
      },
    ],
  },
  {
    id: 'skeleton',
    name: 'Skeleton',
    category: 'ui',
    variants: [
      {
        id: 'line',
        label: 'Line',
        jsx: '<Skeleton variant="line" className="w-48" />',
        node: <Skeleton variant="line" className="w-48" />,
      },
    ],
  },
]
