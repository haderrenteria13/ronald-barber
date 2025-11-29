import { supabase } from "@/lib/supabase";

export async function checkRateLimit(ip: string) {
  const WINDOW_SIZE = 60 * 1000; 
  const MAX_REQUESTS = 3; 

  try {
    const now = new Date();
    
    const { data, error } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('ip', ip)
      .single();

    if (error && error.code !== 'PGRST116') {
      return { success: true };
    }

    if (!data) {
      await supabase.from('rate_limits').insert({ 
        ip, 
        count: 1, 
        last_request: now.toISOString() 
      });
      return { success: true };
    }

    const lastRequest = new Date(data.last_request);
    const timeDiff = now.getTime() - lastRequest.getTime();

    if (timeDiff > WINDOW_SIZE) {
      await supabase.from('rate_limits').update({ 
        count: 1, 
        last_request: now.toISOString() 
      }).eq('ip', ip);
      return { success: true };
    }

    if (data.count >= MAX_REQUESTS) {
      return { success: false }; 
    }
    await supabase.from('rate_limits').update({ 
      count: data.count + 1 
    }).eq('ip', ip);

    return { success: true };

  } catch {
    return { success: true };
  }
}
