import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect('/login');
  return null; // redirect will handle this, but a return is needed
}
