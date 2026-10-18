import { Outlet } from 'react-router-dom'
import { Crown } from 'lucide-react'

export function AuthLayout() {
  return (
    <div className="relative min-h-svh overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(212,175,55,0.18),_transparent_40%),radial-gradient(circle_at_bottom_right,_rgba(30,58,95,0.45),_transparent_45%),linear-gradient(160deg,#0f1724_0%,#1a2332_45%,#243447_100%)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <div className="relative mx-auto grid min-h-svh w-full max-w-6xl items-center gap-10 px-4 py-10 lg:grid-cols-2 lg:px-8">
        <div className="hidden text-white lg:block">
          <div className="mb-6 inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
            <Crown className="size-5 text-[#d4af37]" aria-hidden />
            <span className="font-heading text-sm tracking-[0.2em] uppercase">
              Kingdom of Chess
            </span>
          </div>
          <h1 className="font-heading max-w-md text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
            Compete. Coach. Conquer the board.
          </h1>
          <p className="mt-4 max-w-md text-base text-white/70">
            Real-time tournament chess for coaches and students — clocks,
            matchmaking, and ranked standings in one arena.
          </p>
        </div>
        <div className="mx-auto w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
