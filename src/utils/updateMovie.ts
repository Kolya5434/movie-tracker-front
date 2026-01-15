import type { Database } from '../types/database.ts'
import { supabase } from './supabaseClient.ts'

export type MovieUpdate = Database['public']['Tables']['movies']['Update']

export async function updateMovie(id: number, movieData: MovieUpdate) {
  const { data, error } = await supabase
    .from('movies')
    .update(movieData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}
