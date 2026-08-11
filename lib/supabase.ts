type Session = {
  access_token: string;
  refresh_token?: string;
  user: { id: string };
};

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://xhpzkxtybshnzznbpcbu.supabase.co";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhocHpreHR5YnNobnp6bmJwY2J1IiwiaWF0IjoxNzg2NDE5MDMxLCJleHAiOjIxMDE5OTUwMzF9.0Jme4UbcAebSSfw_PyoAUOGXBYqVNAICblsoXvXdZLk";
const sessionKey = "lunch-menu-supabase-session";

const headers = (session?: Session) => ({
  apikey: key,
  Authorization: `Bearer ${session?.access_token ?? key}`,
  "Content-Type": "application/json",
});

async function getSession(): Promise<Session | null> {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(sessionKey);
  return stored ? JSON.parse(stored) as Session : null;
}

async function signInAnonymously() {
  const response = await fetch(`${url}/auth/v1/signup`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({}),
  });
  if (!response.ok) return { data: { session: null }, error: new Error(await response.text()) };
  const data = await response.json() as { access_token: string; refresh_token?: string; user: { id: string } };
  const session: Session = { access_token: data.access_token, refresh_token: data.refresh_token, user: data.user };
  window.localStorage.setItem(sessionKey, JSON.stringify(session));
  return { data: { session }, error: null };
}

const auth = { getSession, signInAnonymously };

function from(table: string) {
  const endpoint = `${url}/rest/v1/${table}`;
  return {
    select: (_columns: string) => ({
      eq: async (column: string, value: string) => {
        const session = await getSession();
        const response = await fetch(`${endpoint}?${column}=eq.${encodeURIComponent(value)}`, { headers: headers(session ?? undefined) });
        return { data: response.ok ? await response.json() : null, error: response.ok ? null : new Error(await response.text()) };
      },
    }),
    insert: async (payload: Record<string, string>) => {
      const session = await getSession();
      const response = await fetch(endpoint, { method: "POST", headers: { ...headers(session ?? undefined), Prefer: "return=minimal" }, body: JSON.stringify(payload) });
      return { error: response.ok ? null : new Error(await response.text()) };
    },
    delete: () => ({
      eq: (column: string, value: string) => ({
        eq: async (secondColumn: string, secondValue: string) => {
          const session = await getSession();
          const query = `${column}=eq.${encodeURIComponent(value)}&${secondColumn}=eq.${encodeURIComponent(secondValue)}`;
          const response = await fetch(`${endpoint}?${query}`, { method: "DELETE", headers: headers(session ?? undefined) });
          return { error: response.ok ? null : new Error(await response.text()) };
        },
      }),
    }),
  };
}

export const supabase = { auth, from };
