'use server';

import { z } from 'zod';
import { sql } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db/drizzle';
import { updateProfileName } from '@/lib/db/queries';
import { createClient } from '@/lib/supabase/server';
import {
  validatedAction,
  validatedActionWithUser,
} from '@/lib/auth/middleware';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@/lib/auth/constants';
import { ROUTES } from '@/config/routes';

const signInSchema = z.object({
  email: z.email(),
  password: z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH),
});

export const signIn = validatedAction(signInSchema, async (data) => {
  const { email, password } = data;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return {
      error: 'Invalid email or password. Please try again.',
      email,
      password,
    };
  }

  redirect(ROUTES.dashboard);
});

const signUpSchema = z.object({
  email: z.email(),
  password: z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH),
});

export const signUp = validatedAction(signUpSchema, async (data) => {
  const { email, password } = data;
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({ email, password });
  if (error) {
    return { error: error.message, email, password };
  }

  // 若 Supabase 後台開了 email 確認，這裡不會有 session；
  // proxy 會把未登入者從 /dashboard 導回 /sign-in。
  redirect(ROUTES.dashboard);
});

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH),
  newPassword: z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH),
  confirmPassword: z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH),
});

export const updatePassword = validatedActionWithUser(
  updatePasswordSchema,
  async (data, _, user) => {
    const { currentPassword, newPassword, confirmPassword } = data;
    const supabase = await createClient();

    // Supabase updateUser 不驗舊密碼，這裡以重新登入驗證目前密碼。
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    if (reauthError) {
      return {
        currentPassword,
        newPassword,
        confirmPassword,
        error: 'Current password is incorrect.',
      };
    }

    if (currentPassword === newPassword) {
      return {
        currentPassword,
        newPassword,
        confirmPassword,
        error: 'New password must be different from the current password.',
      };
    }

    if (confirmPassword !== newPassword) {
      return {
        currentPassword,
        newPassword,
        confirmPassword,
        error: 'New password and confirmation password do not match.',
      };
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      return {
        currentPassword,
        newPassword,
        confirmPassword,
        error: error.message,
      };
    }

    return { success: 'Password updated successfully.' };
  }
);

const updateAccountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.email('Invalid email address'),
});

export const updateAccount = validatedActionWithUser(
  updateAccountSchema,
  async (data, _, user) => {
    const { name, email } = data;
    const supabase = await createClient();

    await updateProfileName(user.id, name);

    if (email !== user.email) {
      const { error } = await supabase.auth.updateUser({ email });
      if (error) {
        return { name, error: error.message };
      }
    }

    return { name, success: 'Account updated successfully.' };
  }
);

const deleteAccountSchema = z.object({
  password: z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH),
});

export const deleteAccount = validatedActionWithUser(
  deleteAccountSchema,
  async (data, _, user) => {
    const { password } = data;
    const supabase = await createClient();

    // 以重新登入驗證密碼。
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    });
    if (reauthError) {
      return { password, error: 'Incorrect password. Account deletion failed.' };
    }

    // 以資料庫連線直接刪除 auth.users（會 cascade 掉 profiles）。
    await db.execute(sql`delete from auth.users where id = ${user.id}`);
    await supabase.auth.signOut();

    redirect(ROUTES.signIn);
  }
);
