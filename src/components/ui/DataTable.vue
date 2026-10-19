<script setup lang="ts" generic="T extends Record<string, unknown> | object">
/**
 * DataTable pattern: sticky header, row hover, skeleton rows, empty state slot,
 * responsive card list on mobile (`#mobile` slot), pagination footer (`#footer` slot).
 *
 * Cell slots: `#cell-<key>="{ row }"`. Defaults to `row[key]`.
 */
import type { DataTableColumn } from '@/types/table'

const props = withDefaults(
  defineProps<{
    columns: DataTableColumn[]
    rows: T[]
    rowKey: (row: T) => string | number
    loading?: boolean
    skeletonRows?: number
    caption?: string
  }>(),
  { skeletonRows: 5 },
)

defineSlots<
  {
    [K in `cell-${string}`]?: (props: { row: T }) => unknown
  } & {
    mobile?: (props: { row: T }) => unknown
    toolbar?: () => unknown
    empty?: () => unknown
    footer?: () => unknown
  }
>()

const cell = (row: T, key: string) => {
  const v = (row as Record<string, unknown>)[key]
  return v === null || v === undefined || v === '' ? '—' : String(v)
}
const alignClass = (a?: string) => (a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left')
const showSkeleton = () => props.loading && props.rows.length === 0
</script>

<template>
  <div class="card overflow-hidden">
    <slot name="toolbar" />

    <!-- Desktop / tablet table -->
    <div class="scrollbar-thin relative hidden max-h-[calc(100dvh-18rem)] overflow-auto md:block">
      <table class="w-full border-separate border-spacing-0 text-sm">
        <caption v-if="caption" class="sr-only">{{ caption }}</caption>
        <thead>
          <tr>
            <th
              v-for="c in columns"
              :key="c.key"
              scope="col"
              class="sticky top-0 z-10 border-b border-zinc-200 bg-zinc-50/95 px-4 py-2.5 text-xs font-medium tracking-wide text-zinc-500 uppercase backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95 dark:text-zinc-400"
              :class="[alignClass(c.align), c.hideBelowLg && 'hidden lg:table-cell', c.class]"
            >
              {{ c.label }}
            </th>
          </tr>
        </thead>
        <tbody :aria-busy="loading || undefined" :class="loading && rows.length > 0 && 'opacity-60 transition-opacity'">
          <template v-if="showSkeleton()">
            <tr v-for="i in skeletonRows" :key="`sk-${i}`">
              <td
                v-for="c in columns"
                :key="c.key"
                class="border-b border-zinc-100 px-4 py-3.5 dark:border-zinc-800/70"
                :class="c.hideBelowLg && 'hidden lg:table-cell'"
              >
                <div class="skeleton h-4" :class="c.align === 'right' ? 'ml-auto w-16' : 'w-3/4'" />
              </td>
            </tr>
          </template>
          <template v-else>
            <tr
              v-for="row in rows"
              :key="rowKey(row)"
              class="group transition-colors duration-100 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40"
            >
              <td
                v-for="c in columns"
                :key="c.key"
                class="border-b border-zinc-100 px-4 py-3 align-middle text-zinc-700 group-last:border-b-0 dark:border-zinc-800/70 dark:text-zinc-300"
                :class="[alignClass(c.align), c.hideBelowLg && 'hidden lg:table-cell', c.class]"
              >
                <slot :name="`cell-${c.key}`" :row="row">{{ cell(row, c.key) }}</slot>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Mobile card list -->
    <ul class="divide-y divide-zinc-100 md:hidden dark:divide-zinc-800" :aria-busy="loading || undefined">
      <template v-if="showSkeleton()">
        <li v-for="i in skeletonRows" :key="`msk-${i}`" class="space-y-2 p-4">
          <div class="skeleton h-4 w-2/3" />
          <div class="skeleton h-3 w-1/3" />
        </li>
      </template>
      <template v-else>
        <li v-for="row in rows" :key="rowKey(row)" class="p-4">
          <slot name="mobile" :row="row" />
        </li>
      </template>
    </ul>

    <div v-if="!loading && rows.length === 0">
      <slot name="empty" />
    </div>

    <slot name="footer" />
  </div>
</template>
