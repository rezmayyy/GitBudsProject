import { render, screen } from "@testing-library/react";
import ForgotPassword from "../../Auth/ForgotPassword";
import { auth } from "../../Firebase"; //updated file location after moving to tests folder
jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(() => ({
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    signOut: jest.fn(),
  })),
}));

test("renders ForgotPassword component", () => {
  render(<ForgotPassword />);
  const linkElement = screen.getByText(/Reset Password/i);
  expect(linkElement).toBeInTheDocument();
});
