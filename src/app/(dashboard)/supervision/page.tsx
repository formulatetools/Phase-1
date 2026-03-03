import { redirect } from 'next/navigation'

export default function SupervisionPage() {
  redirect('/clients?tab=supervisees')
}
