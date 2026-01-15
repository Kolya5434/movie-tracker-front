import { supabase } from './supabaseClient.ts'

export async function deleteMovie(id: number) {
  const { error } = await supabase
    .from('movies')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }
}
