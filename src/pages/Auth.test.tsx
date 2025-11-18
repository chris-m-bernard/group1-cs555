import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { render, screen, waitFor } from "../test/setup";
import Auth from "./Auth";

const mockCreateUser = vi.mocked(createUserWithEmailAndPassword);
const mockSignIn = vi.mocked(signInWithEmailAndPassword);
const mockPasswordReset = vi.mocked(sendPasswordResetEmail);
const mockSetPersistence = vi.mocked(setPersistence);
const mockOnAuthStateChanged = vi.mocked(onAuthStateChanged);

const getEmailInput = () =>
  screen.getByPlaceholderText("you@example.com") as HTMLInputElement;
const getPasswordInput = () =>
  screen.getByPlaceholderText(/•+/) as HTMLInputElement;

describe("Auth Component", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
    mockSetPersistence.mockResolvedValue(undefined as never);
    mockOnAuthStateChanged.mockImplementation((_auth, callback) => {
      callback(null);
      return vi.fn();
    });
  });

  const typeCredentials = async (
    email = "test@example.com",
    password = "password123"
  ) => {
    await user.type(getEmailInput(), email);
    await user.type(getPasswordInput(), password);
  };

  it("renders the marketing panel and form controls", () => {
    render(<Auth />);

    expect(
      screen.getByRole("heading", { name: /welcome back/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/sign in to access your dashboard/i)
    ).toBeInTheDocument();
    expect(getEmailInput()).toBeInTheDocument();
    expect(getPasswordInput()).toBeInTheDocument();
    expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign up/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /forgot password/i })
    ).toBeInTheDocument();
  });

  it("allows users to type credentials and toggle password visibility", async () => {
    render(<Auth />);

    await typeCredentials();
    expect(getEmailInput()).toHaveValue("test@example.com");
    expect(getPasswordInput()).toHaveValue("password123");
    expect(getPasswordInput()).toHaveAttribute("type", "password");

    const toggleIcon = screen.getByAltText("Show password");
    await user.click(toggleIcon);
    expect(getPasswordInput()).toHaveAttribute("type", "text");
    expect(screen.getByAltText("Hide password")).toBeInTheDocument();

    await user.click(screen.getByAltText("Hide password"));
    expect(getPasswordInput()).toHaveAttribute("type", "password");
  });

  it("toggles the remember me checkbox", async () => {
    render(<Auth />);
    const checkbox = screen.getByLabelText(/remember me/i) as HTMLInputElement;

    expect(checkbox.checked).toBe(false);
    await user.click(checkbox);
    expect(checkbox.checked).toBe(true);
    await user.click(checkbox);
    expect(checkbox.checked).toBe(false);
  });

  it("signs users up with their email and password", async () => {
    mockCreateUser.mockResolvedValue({} as never);
    render(<Auth />);

    await typeCredentials();
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(mockCreateUser).toHaveBeenCalledWith(
        expect.anything(),
        "test@example.com",
        "password123"
      );
    });
  });

  it("surfaces sign up errors", async () => {
    mockCreateUser.mockRejectedValue(new Error("Email already used"));
    render(<Auth />);

    await typeCredentials();
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Email already used"
    );
  });

  it("signs users in and respects the remember me selection", async () => {
    mockSignIn.mockResolvedValue({} as never);
    render(<Auth />);

    const checkbox = screen.getByLabelText(/remember me/i);
    const signInButton = screen.getByRole("button", { name: /sign in/i });

    await typeCredentials();

    await user.click(checkbox);
    await user.click(signInButton);

    await waitFor(() => {
      expect(mockSetPersistence).toHaveBeenCalledWith(
        expect.anything(),
        browserLocalPersistence
      );
    });
    expect(mockSignIn).toHaveBeenLastCalledWith(
      expect.anything(),
      "test@example.com",
      "password123"
    );

    mockSetPersistence.mockClear();
    mockSignIn.mockClear();

    await user.click(checkbox);
    await user.click(signInButton);

    await waitFor(() => {
      expect(mockSetPersistence).toHaveBeenCalledWith(
        expect.anything(),
        browserSessionPersistence
      );
    });
    expect(mockSignIn).toHaveBeenLastCalledWith(
      expect.anything(),
      "test@example.com",
      "password123"
    );
  });

  it("surfaces sign in errors", async () => {
    mockSignIn.mockRejectedValue(new Error("Invalid credentials"));
    render(<Auth />);

    await typeCredentials("test@example.com", "wrong");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Invalid credentials"
    );
  });

  it("requires an email before sending a password reset email", async () => {
    render(<Auth />);

    await user.click(
      screen.getByRole("button", { name: /forgot password/i })
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      'Enter your email above, then click "Forgot password?"'
    );
  });

  it("sends and reports a password reset email", async () => {
    mockPasswordReset.mockResolvedValue(undefined as never);
    render(<Auth />);

    await typeCredentials();
    await user.click(
      screen.getByRole("button", { name: /forgot password/i })
    );

    await waitFor(() => {
      expect(mockPasswordReset).toHaveBeenCalledWith(
        expect.anything(),
        "test@example.com"
      );
    });
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Password reset email sent. Check your inbox."
    );
  });

  it("shows reset errors when Firebase rejects the request", async () => {
    mockPasswordReset.mockRejectedValue(new Error("User not found"));
    render(<Auth />);

    await typeCredentials();
    await user.click(
      screen.getByRole("button", { name: /forgot password/i })
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "User not found"
    );
  });

  it("disables actions while a request is inflight", async () => {
    mockCreateUser.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(resolve, 50);
        })
    );
    render(<Auth />);

    await typeCredentials();
    const signUpButton = screen.getByRole("button", { name: /sign up/i });
    await user.click(signUpButton);

    expect(signUpButton).toBeDisabled();
  });
});
