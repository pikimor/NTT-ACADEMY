import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/ui/Navbar'

export default async function ReclutadorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  return (
    <>
      <Navbar rol="reclutador" />
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </>
  )
}
