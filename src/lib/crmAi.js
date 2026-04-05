import { supabase } from './supabase';

export async function invokeCrmAi(message) {
  const { data, error } = await supabase.functions.invoke('crm-ai', {
    body: { message },
  });
  return { data, error };
}
