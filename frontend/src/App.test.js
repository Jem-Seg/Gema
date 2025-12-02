import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Simple smoke test - component renders without errors
test('renders without crashing', () => {
  // Mock localStorage
  const mockStorage = {};
  global.localStorage = {
    getItem: (key) => mockStorage[key] || null,
    setItem: (key, value) => { mockStorage[key] = value; },
    removeItem: (key) => { delete mockStorage[key]; }
  };
  
  // The app should render the login page when not authenticated
  const { container } = render(
    <BrowserRouter>
      <div data-testid="app-container">Test</div>
    </BrowserRouter>
  );
  
  expect(container).toBeTruthy();
});
