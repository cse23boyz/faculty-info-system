// app/page.tsx
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center">
      <div className="text-center px-4">
        {/* College Name */}
        <h1 className="text-6xl sm:text-7xl font-bold tracking-wider text-white mb-3 drop-shadow-lg">
          JACSICE
        </h1>
        <p className="text-lg text-blue-100 tracking-widest uppercase mb-20 font-light">
          Faculty Information System
        </p>

        {/* Login Options */}
        <div className="flex flex-col sm:flex-row gap-5 justify-center">
          <Link
            href="/login/faculty"
            className="px-12 py-4 text-sm font-medium tracking-wider rounded-lg border-2 border-white/70 text-white hover:bg-white/10 hover:border-white transition-all backdrop-blur-sm"
          >
            Faculty Login
          </Link>
          <Link
            href="/login/admin"
            className="px-12 py-4 text-sm font-medium tracking-wider rounded-lg bg-white text-indigo-600 hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl"
          >
            Admin Login
          </Link>
        </div>
      </div>
    </main>
  );
}