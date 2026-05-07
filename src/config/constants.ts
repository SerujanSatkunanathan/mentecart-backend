import { env } from './env';

/** How many minutes a cart item holds a slot before auto-release */
export const SLOT_TTL_MINUTES = env.SLOT_TTL_MINUTES;

/** Maximum confirmed bookings a user can hold per calendar day */
export const MAX_BOOKINGS_PER_DAY = env.MAX_BOOKINGS_PER_DAY;

/** Number of bcrypt salt rounds for password hashing */
export const BCRYPT_SALT_ROUNDS = 10;

/** Number of days into the future to show available slots */
export const SLOT_LOOKAHEAD_DAYS = 30;

/** Free cancellation cutoff: hours before the earliest slot */
export const CANCEL_CUTOFF_HOURS = 24;
