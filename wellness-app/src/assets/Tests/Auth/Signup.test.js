import { render, screen } from "@testing-library/react";
import Signup from "../../Auth/Signup";
import { auth } from "../../Firebase";
jest.mock("firebase/auth", () => ({
    getAuth: jest.fn(() => ({
        signInWithCustomToken: jest.fn(),
        sendEmailVerification: jest.fn()
    })),
}));

test("renders Signup component", () => {
    render(<Signup />);
    const tosLink = screen.getByText(/Terms and Conditions/i);
    expect(tosLink).toBeInTheDocument();
    const loginLink = screen.getByText(/Login/i);
    expect(loginLink).toBeInTheDocument();
});
