import { useEffect, useState } from 'react';

export type Route = 'student' | 'teacher';

// Normal builds use real paths ("/teacher"). The single-file preview build sets
// VITE_HASH_ROUTES=1 and uses "#teacher" instead, for hosts without URL rewrites.
const HASH_ROUTES = import.meta.env.VITE_HASH_ROUTES === '1';

function current(): Route {
  if (window.location.hash === '#teacher') return 'teacher';
  return window.location.pathname.replace(/\/+$/, '').endsWith('/teacher') ? 'teacher' : 'student';
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(current);
  useEffect(() => {
    const onChange = () => setRoute(current());
    window.addEventListener('popstate', onChange);
    window.addEventListener('hashchange', onChange);
    return () => {
      window.removeEventListener('popstate', onChange);
      window.removeEventListener('hashchange', onChange);
    };
  }, []);
  return route;
}

export function navigate(to: Route) {
  if (HASH_ROUTES) {
    window.location.hash = to === 'teacher' ? 'teacher' : '';
  } else {
    const path = to === 'teacher' ? '/teacher' : '/';
    if (window.location.pathname !== path || window.location.hash) window.history.pushState(null, '', path + window.location.search);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
  window.scrollTo(0, 0);
}
