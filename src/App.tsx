import React, { Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import AppLayout from './components/layout/AppLayout'
import ProtectedRoute from './components/layout/ProtectedRoute'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'

// Auth pages
const LoginPage = React.lazy(() => import('./pages/auth/LoginPage'))
const GoogleCallbackPage = React.lazy(() => import('./pages/auth/GoogleCallbackPage'))
const RegisterPage = React.lazy(() => import('./pages/auth/RegisterPage'))
const PendingPage = React.lazy(() => import('./pages/auth/PendingPage'))
const ForgotPasswordPage = React.lazy(() => import('./pages/auth/ForgotPasswordPage'))

// Common pages
const DashboardPage = React.lazy(() => import('./pages/dashboard/DashboardPage'))
const ProfilePage = React.lazy(() => import('./pages/profile/ProfilePage'))
const ChangePasswordPage = React.lazy(() => import('./pages/profile/ChangePasswordPage'))
const AnnouncementsPage = React.lazy(() => import('./pages/announcements/AnnouncementsPage'))
const AnnouncementDetailPage = React.lazy(() => import('./pages/announcements/AnnouncementDetailPage'))

// Employee pages
const SubmitFeedbackPage = React.lazy(() => import('./pages/feedback/SubmitFeedbackPage'))
const MyFeedbacksPage = React.lazy(() => import('./pages/feedback/MyFeedbacksPage'))
const SurveysPage = React.lazy(() => import('./pages/survey/SurveysPage'))
const SurveyFillPage = React.lazy(() => import('./pages/survey/SurveyFillPage'))
const MyProposalsPage = React.lazy(() => import('./pages/proposal/MyProposalsPage'))
const SubmitProposalPage = React.lazy(() => import('./pages/proposal/SubmitProposalPage'))
const MyComplaintsPage = React.lazy(() => import('./pages/complaint/MyComplaintsPage'))
const SubmitComplaintPage = React.lazy(() => import('./pages/complaint/SubmitComplaintPage'))
const QnaPage = React.lazy(() => import('./pages/qna/QnaPage'))
const EvaluationPage = React.lazy(() => import('./pages/evaluation/EvaluationPage'))

// HR pages
const HrFeedbacksPage = React.lazy(() => import('./pages/hr/HrFeedbacksPage'))
const HrSurveysPage = React.lazy(() => import('./pages/hr/HrSurveysPage'))
const HrSurveyResultsPage = React.lazy(() => import('./pages/hr/HrSurveyResultsPage'))
const HrProposalsPage = React.lazy(() => import('./pages/hr/HrProposalsPage'))
const HrComplaintsPage = React.lazy(() => import('./pages/hr/HrComplaintsPage'))
const HrAnnouncementsPage = React.lazy(() => import('./pages/hr/HrAnnouncementsPage'))
const HrQnaPage = React.lazy(() => import('./pages/hr/HrQnaPage'))
const HrReportsPage = React.lazy(() => import('./pages/hr/HrReportsPage'))

// Admin pages
const AdminUsersPage = React.lazy(() => import('./pages/admin/AdminUsersPage'))
const AdminRolesPage = React.lazy(() => import('./pages/admin/AdminRolesPage'))
const AdminDepartmentsPage = React.lazy(() => import('./pages/admin/AdminDepartmentsPage'))
const AdminPositionsPage = React.lazy(() => import('./pages/admin/AdminPositionsPage'))
const AdminShiftsPage = React.lazy(() => import('./pages/admin/AdminShiftsPage'))
const PendingUsersPage = React.lazy(() => import('./pages/admin/PendingUsersPage'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 1000 * 60 * 5 },
  },
})

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-[hsl(var(--background))]">
    <div className="flex flex-col items-center gap-3">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-[hsl(var(--primary))] border-t-transparent" />
      <p className="text-sm text-[hsl(var(--muted-foreground))]">Đang tải...</p>
    </div>
  </div>
)

function AppInner() {
  const { theme } = useTheme()

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/google/callback" element={<GoogleCallbackPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/register/pending" element={<PendingPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/profile/change-password" element={<ChangePasswordPage />} />
              <Route path="/announcements" element={<AnnouncementsPage />} />
              <Route path="/announcements/:id" element={<AnnouncementDetailPage />} />

              <Route path="/feedback/submit" element={<SubmitFeedbackPage />} />
              <Route path="/feedback/my" element={<MyFeedbacksPage />} />
              <Route path="/surveys" element={<SurveysPage />} />
              <Route path="/surveys/:id/fill" element={<SurveyFillPage />} />
              <Route path="/proposals" element={<MyProposalsPage />} />
              <Route path="/proposals/submit" element={<SubmitProposalPage />} />
              <Route path="/complaints" element={<MyComplaintsPage />} />
              <Route path="/complaints/submit" element={<SubmitComplaintPage />} />
              <Route path="/qna" element={<QnaPage />} />
              <Route path="/evaluation" element={<EvaluationPage />} />

              <Route path="/hr/feedbacks" element={<HrFeedbacksPage />} />
              <Route path="/hr/surveys" element={<HrSurveysPage />} />
              <Route path="/hr/surveys/:id/results" element={<HrSurveyResultsPage />} />
              <Route path="/hr/proposals" element={<HrProposalsPage />} />
              <Route path="/hr/complaints" element={<HrComplaintsPage />} />
              <Route path="/hr/announcements" element={<HrAnnouncementsPage />} />
              <Route path="/hr/qna" element={<HrQnaPage />} />
              <Route path="/hr/reports" element={<HrReportsPage />} />

              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/pending-users" element={<PendingUsersPage />} />
              <Route path="/admin/roles" element={<AdminRolesPage />} />
              <Route path="/admin/departments" element={<AdminDepartmentsPage />} />
              <Route path="/admin/positions" element={<AdminPositionsPage />} />
              <Route path="/admin/shifts" element={<AdminShiftsPage />} />
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>

      <Toaster position="top-right" theme={theme} richColors />
    </BrowserRouter>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AppInner />
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
