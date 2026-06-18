import { ResponsiveContainer } from 'recharts';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * Wrapper seguro para Recharts + React 19.
 * Remonta el chart al cambiar tema para evitar errores insertBefore del DOM.
 */
function StitchResponsiveContainer({ children, width = '100%', height = '100%', debounce = 50 }) {
  const { theme } = useTheme();

  return (
    <ResponsiveContainer width={width} height={height} debounce={debounce} key={theme}>
      {children}
    </ResponsiveContainer>
  );
}

export { StitchResponsiveContainer };
