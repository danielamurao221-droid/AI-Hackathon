import { lazy, Suspense, useEffect } from 'react';
import { PresenterBar } from './components/PresenterBar';
import { ui } from './content/ui';
import { useT } from './lib/i18n';
import { useRoute } from './lib/router';
import { useAppState } from './lib/store';
import { Login } from './screens/Login';
import { Teacher } from './screens/Teacher';

// Phaser is only downloaded when a student starts playing.
const GameHost = lazy(() => import('./adventure/GameHost'));

function Loading() {
  const { t } = useT();
  return (
    <main className="screen game-loading" role="status">
      <p>{t(ui.loading)}</p>
    </main>
  );
}

function Student() {
  const s = useAppState();
  if (!s.learnerId) return <Login />;
  return (
    <Suspense fallback={<Loading />}>
      <GameHost key={s.learnerId} />
    </Suspense>
  );
}

export default function App() {
  const route = useRoute();
  const s = useAppState();
  const { lang } = s;

  useEffect(() => {
    document.documentElement.lang = route === 'teacher' ? 'en' : lang === 'fil' ? 'fil' : 'en';
  }, [lang, route]);

  useEffect(() => {
    document.body.classList.toggle('in-game', route === 'student' && !!s.learnerId);
  }, [route, s.learnerId]);

  return (
    <>
      {route === 'teacher' ? <Teacher /> : <Student />}
      <PresenterBar route={route} />
    </>
  );
}
