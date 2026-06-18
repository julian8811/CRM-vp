import { useState, useEffect } from 'react';
import { ResponsiveContainer } from 'recharts';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * Wrapper seguro para Recharts + React 19.
 * Espera al layout del navegador antes de montar ResponsiveContainer
 * y remonta al cambiar tema para evitar errores insertBefore del DOM.
 */
function StitchResponsiveContainer({ children, width = '100%', height = '100%', debounce = 50 }) {
  const { theme } = useTheme();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let outerFrame = 0;
    let innerFrame = 0;

    outerFrame = requestAnimationFrame(() => {
      innerFrame = requestAnimationFrame(() => {
        if (!cancelled) setReady(true);
      });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(outerFrame);
      cancelAnimationFrame(innerFrame);
    };
  }, []);

  if (!ready) {
    return <div className="h-full w-full min-h-[1px] min-w-0" aria-hidden />;
  }

  return (
    <ResponsiveContainer width={width} height={height} debounce={debounce} key={theme}>
      {children}
    </ResponsiveContainer>
  );
}

export { StitchResponsiveContainer };
