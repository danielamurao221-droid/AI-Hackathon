import { useEffect, useState } from 'react';

export type Route = 'student' | 'teacher';

function current(): Route {
  return window.location.pathname.replace(/\/+$/, '').endsWith('/teacher') ? 'teacher' : 'student';
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(current);
  useEffect(() => {
    const onPop = () => setRoute(current());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  return route;
}

export function navigate(to: Route) {
  const path = to === 'teacher' ? '/teacher' : '/';
  if (window.location.pathname !== path) window.history.pushState(null, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo(0, 0);
}
