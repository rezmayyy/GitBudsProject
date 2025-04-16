import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Support from "../../Support";

// Helper to wrap component in <BrowserRouter> for Link usage
const renderWithRouter = (ui) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe("Support Component", () => {
  test("renders the Support title", () => {
    renderWithRouter(<Support />);
    const headings = screen.getAllByRole("heading", { name: /support/i });
    expect(headings.length).toBeGreaterThan(0);
  });

  test("renders FAQ link", () => {
    renderWithRouter(<Support />);
    const faqLink = screen.getByRole('link', { name: /Frequently Asked Questions \(FAQ\)/i });
    expect(faqLink).toBeInTheDocument();
    expect(faqLink.closest("a")).toHaveAttribute("href", "#faq-section");
  });

  test("renders support ticket link", () => {
    renderWithRouter(<Support />);
    const ticketLink = screen.getByRole("link", { name: /here/i });
    expect(ticketLink).toHaveAttribute("href", "/ticket");
  });

  test("renders contact email", () => {
    renderWithRouter(<Support />);
    const emailLink = screen.getByText(/support@tribewell.com/i);
    expect(emailLink).toBeInTheDocument();
    expect(emailLink.closest("a")).toHaveAttribute("href", "mailto:support@tribewell.com");
  });
});
