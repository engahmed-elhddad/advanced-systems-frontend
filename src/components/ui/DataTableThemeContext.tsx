'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { dataTableTheme, type DataTableThemeTokens } from '@/lib/dataTable/dataTableTheme'

const DataTableThemeContext = createContext<DataTableThemeTokens>(dataTableTheme)

export function DataTableThemeProvider({
  children,
  value,
}: {
  children: ReactNode
  value?: Partial<DataTableThemeTokens>
}) {
  const parent = useContext(DataTableThemeContext)
  const merged = useMemo(() => ({ ...parent, ...(value ?? {}) }), [parent, value])
  return <DataTableThemeContext.Provider value={merged}>{children}</DataTableThemeContext.Provider>
}

export function useDataTableTheme(): DataTableThemeTokens {
  return useContext(DataTableThemeContext)
}

export type { DataTableThemeTokens }
