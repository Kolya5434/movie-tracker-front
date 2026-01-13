import type { Movie } from '../types/movie'
import {supabase} from "./supabaseClient.ts";

export const fetchMovies = async (): Promise<Movie[]> => {
  const { data, error } = await supabase
    .from('movies')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    throw new Error(error.message);
  }
  
  return (data || []) as Movie[];
}