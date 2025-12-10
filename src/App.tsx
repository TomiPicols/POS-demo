import FestivePOS from './pages/FestivePOS';
import AuthGate from './components/auth/AuthGate';

function App() {
  return (
    <AuthGate>
      <FestivePOS />
    </AuthGate>
  );
}

export default App;
