import { lazy, Suspense } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { LoadingState } from '@/components/shared/LoadingState'
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute'
import { PublicOnlyRoute } from '@/features/auth/components/PublicOnlyRoute'
import { RoleRoute } from '@/features/auth/components/RoleRoute'
import { MatchmakingEventHandler } from '@/features/matchmaking/components/MatchmakingEventHandler'
import { createQueryClient } from '@/app/query-client'
import './App.css'

const AppLayout = lazy(() => import('@/components/layout/AppLayout').then((module) => ({ default: module.AppLayout })))
const AuthLayout = lazy(() => import('@/components/layout/AuthLayout').then((module) => ({ default: module.AuthLayout })))
const DashboardLayout = lazy(() => import('@/components/layout/DashboardLayout').then((module) => ({ default: module.DashboardLayout })))
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage').then((module) => ({ default: module.LoginPage })))
const UnauthorizedPage = lazy(() => import('@/features/auth/pages/UnauthorizedPage').then((module) => ({ default: module.UnauthorizedPage })))
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage').then((module) => ({ default: module.DashboardPage })))
const MatchmakingPage = lazy(() => import('@/features/matchmaking/pages/MatchmakingPage').then((module) => ({ default: module.MatchmakingPage })))
const MatchPage = lazy(() => import('@/features/matches/pages/MatchPage').then((module) => ({ default: module.MatchPage })))
const LeaderboardPage = lazy(() => import('@/features/leaderboard/pages/LeaderboardPage').then((module) => ({ default: module.LeaderboardPage })))
const CreateTournamentPage = lazy(() => import('@/features/tournaments/pages/CreateTournamentPage').then((module) => ({ default: module.CreateTournamentPage })))
const TournamentDetailPage = lazy(() => import('@/features/tournaments/pages/TournamentDetailPage').then((module) => ({ default: module.TournamentDetailPage })))
const TournamentsPage = lazy(() => import('@/features/tournaments/pages/TournamentsPage').then((module) => ({ default: module.TournamentsPage })))

const queryClient = createQueryClient()

function AuthenticatedLayout() {
  return (
    <>
      <MatchmakingEventHandler />
      <DashboardLayout />
    </>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <BrowserRouter>
          <Suspense fallback={<LoadingState label="Loading page…" fullPage />}>
            <Routes>
              <Route element={<AppLayout />}>
                <Route element={<PublicOnlyRoute />}>
                  <Route element={<AuthLayout />}>
                    <Route path="/login" element={<LoginPage />} />
                  </Route>
                </Route>

                <Route path="/unauthorized" element={<UnauthorizedPage />} />

                <Route element={<ProtectedRoute />}>
                  <Route element={<AuthenticatedLayout />}>
                    <Route element={<RoleRoute roles={['COACH']} />}>
                      <Route path="/coach/dashboard" element={<DashboardPage />} />
                      <Route path="/coach/tournaments/new" element={<CreateTournamentPage />} />
                    </Route>
                    <Route element={<RoleRoute roles={['STUDENT']} />}>
                      <Route path="/student/dashboard" element={<DashboardPage />} />
                      <Route path="/matchmaking" element={<MatchmakingPage />} />
                    </Route>
                    <Route path="/tournaments" element={<TournamentsPage />} />
                    <Route path="/tournaments/:tournamentId" element={<TournamentDetailPage />} />
                    <Route path="/tournaments/:tournamentId/leaderboard" element={<LeaderboardPage />} />
                    <Route path="/matches/:matchId" element={<MatchPage />} />
                  </Route>
                </Route>

                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </Suspense>
          <Toaster />
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
