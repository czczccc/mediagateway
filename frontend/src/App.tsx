import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Playground from './pages/Playground';
import Gallery from './pages/Gallery';
import Settings from './pages/Settings';
import Usage from './pages/Usage';
import { Button } from './components/ui/button';
import { zhCN } from './locales/zh-CN';
import { BarChart3, Clapperboard, Settings2, Sparkles } from 'lucide-react';

function Navigation() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950 text-white shadow-lg shadow-slate-950/10">
      <div className="container mx-auto px-4">
        <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 py-3 sm:flex-nowrap sm:py-0">
          <div className="flex items-center gap-6 sm:gap-8">
            <Link to="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-400 text-slate-950">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
              </span>
              MediaRouter
            </Link>
            <div className="flex gap-1 overflow-x-auto">
              <Link to="/" aria-current={isActive('/') ? 'page' : undefined}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={isActive('/') ? 'bg-white/10 text-white hover:bg-white/15 hover:text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'}
                >
                  <Clapperboard className="mr-2 h-4 w-4" aria-hidden="true" />
                  {zhCN.navigation.playground}
                </Button>
              </Link>
              <Link to="/gallery" aria-current={isActive('/gallery') ? 'page' : undefined}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={isActive('/gallery') ? 'bg-white/10 text-white hover:bg-white/15 hover:text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'}
                >
                  <Clapperboard className="mr-2 h-4 w-4" aria-hidden="true" />
                  {zhCN.navigation.gallery}
                </Button>
              </Link>
              <Link to="/usage" aria-current={isActive('/usage') ? 'page' : undefined}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={isActive('/usage') ? 'bg-white/10 text-white hover:bg-white/15 hover:text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'}
                >
                  <BarChart3 className="mr-2 h-4 w-4" aria-hidden="true" />
                  {zhCN.navigation.usage}
                </Button>
              </Link>
              <Link to="/settings" aria-current={isActive('/settings') ? 'page' : undefined}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={isActive('/settings') ? 'bg-white/10 text-white hover:bg-white/15 hover:text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'}
                >
                  <Settings2 className="mr-2 h-4 w-4" aria-hidden="true" />
                  {zhCN.navigation.settings}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Navigation />
        <Routes>
          <Route path="/" element={<Playground />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/usage" element={<Usage />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
