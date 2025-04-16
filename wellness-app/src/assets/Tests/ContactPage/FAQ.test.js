import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import FAQ from "../../FAQ"; // adjust path based on your file structur
import { getDoc, doc } from "firebase/firestore";

// ✅ MOCK Firebase Firestore functions used directly in the component
jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
}));

// ✅ MOCK your custom Firebase export (e.g., db)
jest.mock("../../Firebase", () => ({
  db: {}, // dummy db object just to satisfy the import
}));



describe("FAQ Component", () => {
  const mockFaqData = {
    Questions: ["What is Tribewell?", "How do I reset my password?"],
    Answers: ["Tribewell is a wellness platform.", "Click 'Forgot Password' on the login page."],
  };

  beforeEach(() => {
    const mockDocSnap = {
      exists: () => true,
      data: () => mockFaqData,
    };

    getDoc.mockResolvedValue(mockDocSnap);
    doc.mockImplementation((db, collection, id) => `${collection}/${id}`);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("renders FAQ heading", async () => {
    render(<FAQ />);
    expect(await screen.findByText(/Frequently Asked Questions/i)).toBeInTheDocument();
  });

  test("displays questions fetched from Firestore", async () => {
    render(<FAQ />);
    await waitFor(() => {
      expect(screen.getByText("What is Tribewell?")).toBeInTheDocument();
      expect(screen.getByText("How do I reset my password?")).toBeInTheDocument();
    });
  });

  test("toggles answer visibility on click", async () => {
    render(<FAQ />);
    const question = await screen.findByText("What is Tribewell?");
    expect(screen.queryByText("Tribewell is a wellness platform.")).not.toBeVisible();

    fireEvent.click(question);
    expect(screen.getByText("Tribewell is a wellness platform.")).toBeVisible();

    fireEvent.click(question);
    expect(screen.getByText("Tribewell is a wellness platform.")).not.toBeVisible();
  });

  test("filters questions using the search bar", async () => {
    render(<FAQ />);
    await screen.findByText("What is Tribewell?");

    const input = screen.getByPlaceholderText(/Search FAQs/i);
    fireEvent.change(input, { target: { value: "reset" } });

    expect(screen.getByText("How do I reset my password?")).toBeInTheDocument();
    expect(screen.queryByText("What is Tribewell?")).not.toBeInTheDocument();
  });

  test("shows no results message if search has no matches", async () => {
    render(<FAQ />);
    await screen.findByText("What is Tribewell?");

    fireEvent.change(screen.getByPlaceholderText(/Search FAQs/i), {
      target: { value: "nonexistent question" },
    });

    expect(screen.getByText(/No matching FAQs found/i)).toBeInTheDocument();
  });
});
