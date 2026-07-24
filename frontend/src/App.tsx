// D365 Architect OS — Main App
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { TopBar } from './components/TopBar/TopBar';
import { ConsolePage } from './pages/ConsolePage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ArtifactsPage } from './pages/ArtifactsPage';
import { KnowledgePage } from './pages/KnowledgePage';
import { ErrorBoundary } from './components/ErrorBoundary';

export function App() {
  return (
    <ErrorBoundary label="App">
    <BrowserRouter>
      <div className="flex flex-col h-screen bg-surface-950 bg-grid-pattern overflow-hidden">
        {/* Global top bar */}
        <TopBar />

        {/* Page content */}
        <main className="flex-1 min-h-0 overflow-hidden">
          <Routes>
            <Route path="/" element={<ConsolePage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/artifacts" element={<ArtifactsPage />} />
            <Route path="/knowledge" element={<KnowledgePage />} />
          </Routes>
        </main>
      </div>

      {/* Toast notifications */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1a2540',
            color: '#e2e8f0',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            fontSize: '13px',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
          },
        }}
      />
    </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
