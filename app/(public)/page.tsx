import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 bg-white shadow-sm">
        <span className="text-xl font-bold text-blue-700">NTT Academy</span>
        <div className="flex gap-3">
          <Link
            href="/auth/login"
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600"
          >
            Iniciar sesion
          </Link>
          <Link
            href="/auth/register"
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            Registrarse
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-4 py-24">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
          Capacitacion IT de calidad, <br />
          <span className="text-blue-600">oportunidades reales</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-xl mb-8">
          Aprende redes, ciberseguridad, cloud y mas desde cero.
          Los estudiantes con mejor desempeno ingresan directamente a NTT.
        </p>
        <Link
          href="/auth/register"
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 text-lg"
        >
          Empezar ahora — es gratis
        </Link>
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 px-8 pb-24 max-w-5xl mx-auto">
        {[
          { title: 'Cursos desde cero', desc: 'Contenido practico en todas las areas de servicios TI.' },
          { title: 'Evaluacion automatica', desc: 'Quizzes con correccion inmediata. Tu nota siempre actualizada.' },
          { title: 'Talento reconocido', desc: 'Promedio >= 4.5 → quedas visible para los reclutadores de NTT.' },
        ].map(f => (
          <div key={f.title} className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
            <p className="text-gray-600 text-sm">{f.desc}</p>
          </div>
        ))}
      </section>
    </main>
  )
}
