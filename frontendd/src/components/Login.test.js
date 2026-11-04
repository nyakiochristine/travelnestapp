import { fireEvent, render, screen } from '@testing-library/react';
import { AuthContext } from './AuthContext';
import Login from './Login';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  Link: ({ children }) => <a href="/forgot-password">{children}</a>,
  useNavigate: () => mockNavigate
}), { virtual: true });

test('submits login credentials and stores the returned session', async () => {
  window.__TRAVELNEST_API_URL__ = 'http://localhost:3001';
  const login = jest.fn();
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ token: 'session-token', user: { _id: '1', name: 'Amina' } })
  });
  render(<AuthContext.Provider value={{ login }}><Login /></AuthContext.Provider>);
  fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'amina@example.com' } });
  fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'Password1' } });
  fireEvent.click(screen.getByRole('button', { name: 'Login' }));
  expect(await screen.findByText(/welcome back/i)).toBeInTheDocument();
  expect(login).toHaveBeenCalledWith({ token: 'session-token', user: { _id: '1', name: 'Amina' } });
});
