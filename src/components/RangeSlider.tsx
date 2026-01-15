import { useRef, useCallback, useEffect, useState } from 'react'
import classes from './RangeSlider.module.scss'

interface RangeSliderProps {
  min: number
  max: number
  step?: number
  value: [number, number]
  onChange: (value: [number, number]) => void
}

export function RangeSlider({ min, max, step = 1, value, onChange }: RangeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState<'min' | 'max' | null>(null)

  const getPercent = useCallback((val: number) => {
    return ((val - min) / (max - min)) * 100
  }, [min, max])

  const getValueFromPosition = useCallback((clientX: number) => {
    if (!trackRef.current) return min
    const rect = trackRef.current.getBoundingClientRect()
    const percent = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100))
    const rawValue = (percent / 100) * (max - min) + min
    const steppedValue = Math.round(rawValue / step) * step
    return Math.max(min, Math.min(max, steppedValue))
  }, [min, max, step])

  const handleMouseDown = (thumb: 'min' | 'max') => (e: React.MouseEvent) => {
    e.preventDefault()
    setDragging(thumb)
  }

  const handleTouchStart = (thumb: 'min' | 'max') => (_e: React.TouchEvent) => {
    setDragging(thumb)
  }

  useEffect(() => {
    if (!dragging) return

    const handleMove = (clientX: number) => {
      const newValue = getValueFromPosition(clientX)
      if (dragging === 'min') {
        onChange([Math.min(newValue, value[1] - step), value[1]])
      } else {
        onChange([value[0], Math.max(newValue, value[0] + step)])
      }
    }

    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX)
    const handleTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientX)

    const handleEnd = () => setDragging(null)

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleEnd)
    document.addEventListener('touchmove', handleTouchMove)
    document.addEventListener('touchend', handleEnd)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleEnd)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleEnd)
    }
  }, [dragging, value, onChange, getValueFromPosition, step])

  const minPercent = getPercent(value[0])
  const maxPercent = getPercent(value[1])

  return (
    <div className={classes.slider}>
      <div className={classes.track} ref={trackRef}>
        <div
          className={classes.range}
          style={{ left: `${minPercent}%`, width: `${maxPercent - minPercent}%` }}
        />
        <div
          className={`${classes.thumb} ${dragging === 'min' ? classes.active : ''}`}
          style={{ left: `${minPercent}%` }}
          onMouseDown={handleMouseDown('min')}
          onTouchStart={handleTouchStart('min')}
        />
        <div
          className={`${classes.thumb} ${dragging === 'max' ? classes.active : ''}`}
          style={{ left: `${maxPercent}%` }}
          onMouseDown={handleMouseDown('max')}
          onTouchStart={handleTouchStart('max')}
        />
      </div>
      <div className={classes.labels}>
        <span>{value[0]}</span>
        <span>{value[1]}</span>
      </div>
    </div>
  )
}
