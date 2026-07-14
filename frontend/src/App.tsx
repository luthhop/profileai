import { Routes, Route } from 'react-router-dom';
import Inicio from './pages/Inicio';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import LinkedinCoach from './pages/LinkedinCoach';
import Vagas from './pages/Vagas';
import Curriculo from './pages/Curriculo';
import Entrevista from './pages/Entrevista';
import Perfil from './pages/Perfil';
import Candidaturas from './pages/Candidaturas';
import Planos from './pages/Planos';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Inicio />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/linkedin" element={<LinkedinCoach />} />
      <Route path="/vagas" element={<Vagas />} />
      <Route path="/curriculo" element={<Curriculo />} />
      <Route path="/entrevista" element={<Entrevista />} />
      <Route path="/perfil" element={<Perfil />} />
      <Route path="/candidaturas" element={<Candidaturas />} />
      <Route path="/planos" element={<Planos />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
