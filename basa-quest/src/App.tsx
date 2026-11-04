import { useEffect } from 'react';
import { PresenterBar } from './components/PresenterBar';
import { useRoute } from './lib/router';
import { useAppState } from './lib/store';
import { LevelPlayer } from './game/LevelPlayer';
import { BarangayMap } from './screens/BarangayMap';
import { Login } from './screens/Login';
import { Teacher } from './screens/Teacher';

function Student() {
  const s = useAppState();
  if (!s.learnerId) return <Login />;
  if (s.activeLevel) return <LevelPlayer key={s.activeLevel} level={s.activeLevel} />;
  return <BarangayMap />;
}

export default function App() {
  const route = useRoute();
  const { lang } = useAppState();

  useEffect(() => {
    document.documentElement.lang = route === 'teacher' ? 'en' : lang === 'fil' ? 'fil' : 'en';
  }, [lang, route]);

  return (
    <>
      {route === 'teacher' ? <Teacher /> : <Student />}
      <PresenterBar route={route} />
    </>
  );
}
