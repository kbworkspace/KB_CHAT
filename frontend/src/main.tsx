import React from 'react'
import ReactDOM from 'react-dom/client'
import * as Sentry from '@sentry/react'
import App from './App'
// Bootstrap grid only (no Reboot): responsive multi-device shell for the
// desktop chat layout. Imported BEFORE index.css so the app's own design
// tokens win any ties and the mobile view stays pixel-identical.
import 'bootstrap/dist/css/bootstrap-grid.min.css'
import './index.css'
import { registerAppSW } from './utils/pwa'
import { initSentry } from './lib/sentry'

initSentry()

// App-shell worker makes repeat loads instant and keeps installed tabs
// openable offline. Production only: in dev it would cache unhashed modules.
if (import.meta.env.PROD) {
  registerAppSW()
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
          <div className="max-w-sm text-center space-y-3">
            <h1 className="text-lg font-semibold">Something went wrong</h1>
            <p className="text-sm text-muted-foreground">
              The error was reported. Reload to continue.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold min-h-[44px]"
            >
              Reload
            </button>
          </div>
        </div>
      }
    >
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>
)
