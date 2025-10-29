// src/lib/auth.ts

// Define a type for a user
interface User {
  id: number;
  email: string;
  password: string;
  name: string;
}

// Define a type for the session object
interface Session {
  token: string;
  user: Omit<User, "password">;
}

// In-memory "database" of users
const users: User[] = [
  { id: 1, email: "alice@example.com", password: "password123", name: "Alice" },
  { id: 2, email: "bob@example.com", password: "hunter2", name: "Bob" },
];

// Simple in-memory session variable
let _session: Session | null = null;

/**
 * Attempts to sign in the user.
 * @param email - user's email
 * @param password - user's password
 * @returns Promise resolving to { token, user }
 */
export async function signIn(
  email: string,
  password: string
): Promise<{ token: string; user: Omit<User, "password"> }> {
  if (!email || !password) {
    throw new Error("Missing credentials");
  }

  const user = users.find((u) => u.email === email);
  if (!user || user.password !== password) {
    throw new Error("Invalid email or password");
  }

  const token = `tok_${user.id}_${Date.now()}`;

  _session = {
    token,
    user: { id: user.id, email: user.email, name: user.name },
  };

  await new Promise((r) => setTimeout(r, 0));
  return { token, user: _session.user };
}

/** Clears the current session */
export function signOut(): void {
  _session = null;
}

/** Returns the current session, or null if signed out */
export function getSession(): Session | null {
  return _session;
}
