import { render, type RenderOptions } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { type ReactElement, type ReactNode } from 'react';
import { darkTheme } from '../theme/darkTheme';

// Custom render function that includes theme provider
const AllTheProviders = ({ children }: { children: ReactNode }) => {
  return (
    <ThemeProvider theme={darkTheme}>
      {children}
    </ThemeProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };
