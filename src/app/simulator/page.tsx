import { redirect } from 'next/navigation';

export default function SimulatorRootPage() {
  redirect('/simulator/dashboard');
}