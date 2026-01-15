import type {Database} from "../types/database.ts";
import {supabase} from "./supabaseClient.ts";

export type MovieInsert = Database['public']['Tables']['movies']['Insert']

export async function addMovie(movieData: MovieInsert) {
  const { data, error } = await supabase
    .from('movies')
    .insert(movieData)
    .select()
    .single()
  
  if (error) {
    throw new Error(error.message)
  }
  
  return data
}