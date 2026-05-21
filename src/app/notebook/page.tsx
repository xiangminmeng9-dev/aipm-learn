import { redirect } from 'next/navigation';

export default function NotebookRootPage() {
  redirect('/notebook/dashboard');
}