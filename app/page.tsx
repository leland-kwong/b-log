import { Logo } from './LogoIcon'

export default function Home() {
  return (
    <main className="min-h-screen flex items-center px-8 py-16 md:px-16 lg:px-24">
      <div className="max-w-2xl">
        <Logo size={48} className="mb-8" />

        <h1 className="text-5xl md:text-6xl font-bold mb-8">
          Leland Kwong
        </h1>

        <p className="text-xl md:text-2xl mb-16 leading-relaxed">
          Frontend & Design Engineer focused on UX patterns
          for complex enterprise systems.
        </p>

        <section className="mb-16">
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-6">
            Current work
          </h2>
          <a
            href="https://enterprise-ux-patterns.com"
            className="text-2xl md:text-3xl font-semibold underline decoration-2 underline-offset-4 hover:decoration-4 transition-all"
          >
            Enterprise UX Patterns
          </a>
          <p className="text-base mt-3">
            Practical UX patterns for data-heavy enterprise
            applications.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-6">
            Contact
          </h2>
          <a
            href="mailto:leland.kwong@gmail.com"
            className="text-xl underline decoration-2 underline-offset-4 hover:decoration-4 transition-all"
          >
            leland.kwong@gmail.com
          </a>
        </section>
      </div>
    </main>
  )
}
