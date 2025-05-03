import { render, screen } from '@testing-library/react';
import ForgotPassword from '../../Auth/ForgotPassword';

describe('ForgotPassword', () => {
	test('page renders successfully', async () => {
		render(<ForgotPassword />);
		expect(await screen.findByText(/Forgot Password/i)).toBeInTheDocument();
	})
});
