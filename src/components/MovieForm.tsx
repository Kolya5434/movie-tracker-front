import { useForm, type SubmitHandler } from 'react-hook-form'
import { addMovie, type MovieInsert } from '../utils/addMovie'
import { updateMovie } from '../utils/updateMovie'
import { useState, useEffect } from 'react'
import type { Movie } from '../types/movie'
import classes from './MovieForm.module.scss'

interface MovieFormProps {
  movie?: Movie | null
  onSuccess: () => void
  onCancel?: () => void
  onDelete?: (movie: Movie) => void
}

interface FormValues {
  title: string
  type: MovieInsert['type']
  status: MovieInsert['status']
  rating: number | ''
}

export function MovieForm({ movie, onSuccess, onCancel, onDelete }: MovieFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = !!movie

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues: {
      title: movie?.title ?? '',
      type: movie?.type ?? 'movie',
      status: movie?.status ?? 'planned',
      rating: movie?.rating ?? ''
    }
  })

  useEffect(() => {
    reset({
      title: movie?.title ?? '',
      type: movie?.type ?? 'movie',
      status: movie?.status ?? 'planned',
      rating: movie?.rating ?? ''
    })
  }, [movie, reset])

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsSubmitting(true)
    try {
      const movieData = {
        title: data.title,
        type: data.type,
        status: data.status,
        rating: data.rating ? Number(data.rating) : null
      }

      if (isEditing) {
        await updateMovie(movie.id, movieData)
      } else {
        await addMovie(movieData)
        reset()
      }

      onSuccess()
    } catch (error) {
      alert(`Помилка при ${isEditing ? 'оновленні' : 'додаванні'}: ` + error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={classes.form}>
      <div className={classes.header}>
        <h3>{isEditing ? 'Редагувати' : 'Додати нове'}</h3>
        {isEditing && onCancel && (
          <button type="button" onClick={onCancel} className={classes.cancelButton}>
            ✕
          </button>
        )}
      </div>

      <div className={classes.item}>
        <input
          {...register('title', { required: 'Назва обовʼязкова' })}
          placeholder="Назва фільму/серіалу"
          className={classes.input}
        />
        {errors.title && <span className={classes.error}>{errors.title.message}</span>}
      </div>

      <div className={classes.row}>
        <select {...register('type')} className={classes.input}>
          <option value="movie">Фільм</option>
          <option value="series">Серіал</option>
          <option value="anime">Аніме</option>
        </select>

        <select {...register('status')} className={classes.input}>
          <option value="planned">Планую</option>
          <option value="watching">Дивлюсь</option>
          <option value="finished">Завершено</option>
          <option value="dropped">Кинув</option>
        </select>
      </div>

      <div className={classes.item}>
        <input
          type="number"
          step="0.1"
          min="0"
          max="10"
          placeholder="Оцінка (0-10)"
          {...register('rating', { min: 0, max: 10 })}
          className={classes.input}
        />
      </div>

      <div className={classes.row}>
        {isEditing && onCancel && (
          <button type="button" onClick={onCancel} className={classes.buttonSecondary}>
            Скасувати
          </button>
        )}
        <button type="submit" disabled={isSubmitting} className={classes.button}>
          {isSubmitting ? 'Зберігаю...' : isEditing ? 'Зберегти' : 'Додати'}
        </button>
      </div>

      {isEditing && onDelete && (
        <button
          type="button"
          onClick={() => onDelete(movie)}
          className={classes.deleteButton}
        >
          Видалити
        </button>
      )}
    </form>
  )
}
