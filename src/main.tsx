import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router'
import { AppShell } from './components/AppShell'
import { ToastProvider } from './components/Toast'
import { UpdatePrompt } from './components/UpdatePrompt'
import { HistoryPage } from './pages/HistoryPage'
import { HomePage } from './pages/HomePage'
import { SettingsPage } from './pages/SettingsPage'
import { ThemeProvider } from './theme/theme'
import './index.css'

// Ask the browser not to evict IndexedDB under storage pressure.
void navigator.storage?.persist?.()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<HomePage />} />
              <Route path="history" element={<HistoryPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<HomePage />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <UpdatePrompt />
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>,
)
