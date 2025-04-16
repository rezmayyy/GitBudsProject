import { render, screen } from "@testing-library/react";
import Login from "../../Auth/Login";
import { auth } from "../../Firebase";
jest.mock("firebase/auth", () => ({
    getAuth: jest.fn(() => ({
        signInWithEmailAndPassword: jest.fn()
    })),
}));

test("renders Login component", () => {
    render(<Login />);
    const signupLink = screen.getByText(/Sign Up/i);
    expect(signupLink).toBeInTheDocument();
    const forgotPWLink = screen.getByText(/Forgot password?/i);
    expect(forgotPWLink).toBeInTheDocument();
});
