export interface DataTableColumn {
  key: string
  label: string
  align?: 'left' | 'right' | 'center'
  class?: string
  /** Hidden below the `lg` breakpoint inside the desktop table. */
  hideBelowLg?: boolean
}
