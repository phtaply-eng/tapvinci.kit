import { redirect } from 'next/navigation'

/**
 * The old student-only checkout is retired. Both products now go through the
 * same professional dashboard checkout. Keep this route as a redirect so old
 * links and printed QR codes still work.
 */
export default function StudentCardCheckoutRedirect() {
  redirect('/dashboard?package=card_digital&price=799&new=true')
}
