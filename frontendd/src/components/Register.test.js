import { fireEvent, render, screen } from '@testing-library/react';
import Register from './Register';

jest.mock('react-router-dom', () => ({
  Link: ({ children }) => <a href="/login">{children}</a>
}), { virtual: true });

beforeEach(() => {
  window.__TRAVELNEST_API_URL__ = 'http://localhost:3001';
});

test('blocks registration when password confirmation does not match', () => {
  render(<Register />);
  fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'Password1' } });
  fireEvent.change(screen.getByPlaceholderText('Confirm password'), { target: { value: 'Password2' } });
  fireEvent.click(screen.getByRole('button', { name: 'Register' }));
  expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
});
