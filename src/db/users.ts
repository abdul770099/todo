import { eq } from 'drizzle-orm';
import { db } from './index.ts';
import { accounts } from './schema.ts';

export async function findUserByUsername(username: string) {
  try {
    const [account] = await db
      .select()
      .from(accounts)
      .where(eq(accounts.username, username))
      .limit(1);

    return account ?? null;
  } catch (error) {
    console.error('Database query failed in findUserByUsername:', error);
    throw new Error('Unable to look up account. Please try again.', { cause: error });
  }
}

export async function findUserById(id: number) {
  try {
    const [account] = await db
      .select({
        id: accounts.id,
        username: accounts.username,
        createdAt: accounts.createdAt,
      })
      .from(accounts)
      .where(eq(accounts.id, id))
      .limit(1);

    return account ?? null;
  } catch (error) {
    console.error('Database query failed in findUserById:', error);
    throw new Error('Unable to verify account. Please try again.', { cause: error });
  }
}

export async function createUser(username: string, passwordHash: string) {
  try {
    const [created] = await db
      .insert(accounts)
      .values({
        username,
        passwordHash,
      })
      .returning({
        id: accounts.id,
        username: accounts.username,
        createdAt: accounts.createdAt,
      });

    return created;
  } catch (error) {
    console.error('Database insert failed in createUser:', error);
    throw new Error('Unable to create account. Please try again.', { cause: error });
  }
}
