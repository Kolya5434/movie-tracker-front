import { use } from 'react'
import { FilterDrawer, type FilterValues } from './FilterDrawer'

interface FilterMeta {
  genres: string[]
  yearBounds: [number, number]
}

interface FilterDrawerWrapperProps {
  isOpen: boolean
  onClose: () => void
  values: FilterValues
  onChange: (values: FilterValues) => void
  onReset: () => void
  filterMetaPromise: Promise<FilterMeta>
}

export function FilterDrawerWrapper({
  isOpen,
  onClose,
  values,
  onChange,
  onReset,
  filterMetaPromise
}: FilterDrawerWrapperProps) {
  const { genres, yearBounds } = use(filterMetaPromise)

  return (
    <FilterDrawer
      isOpen={isOpen}
      onClose={onClose}
      values={values}
      onChange={onChange}
      onReset={onReset}
      availableGenres={genres}
      yearBounds={yearBounds}
    />
  )
}
