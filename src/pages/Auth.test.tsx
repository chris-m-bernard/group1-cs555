import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../test/setup'
import userEvent from '@testing-library/user-event'
import Auth from '../pages/Auth'
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  setPersistence,
  onAuthStateChanged 
} from 'firebase/auth'

// Mock the Firebase auth functions
const mockCreateUser = vi.mocked(createUserWithEmailAndPassword)
const mockSignIn = vi.mocked(signInWithEmailAndPassword)
const mockSignOut = vi.mocked(signOut)
const mockPasswordReset = vi.mocked(sendPasswordResetEmail)
const mockSetPersistence = vi.mocked(setPersistence)
const mockOnAuthStateChanged = vi.mocked(onAuthStateChanged)

describe('Auth Component', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock successful auth state change
    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      callback(null) // No user initially
      return () => {} // Return unsubscribe function
    })
  })

  describe('Initial Render', () => {
    it('renders sign in form when no user is authenticated', () => {
      render(<Auth />)
      
      expect(screen.getByText('Sign In or Sign Up')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('email')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('password')).toBeInTheDocument()
      expect(screen.getByText('Sign Up')).toBeInTheDocument()
      expect(screen.getByText('Sign In')).toBeInTheDocument()
      expect(screen.getByText('Remember me')).toBeInTheDocument()
    })

    it('renders authenticated view when user is logged in', () => {
      const mockUser = { email: 'test@example.com' }
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser as any)
        return () => {}
      })

      render(<Auth />)
      
      expect(screen.getByText('AUTHENTICATED')).toBeInTheDocument()
      expect(screen.getByText('Welcome test@example.com.')).toBeInTheDocument()
      expect(screen.getByText('Sign Out')).toBeInTheDocument()
    })
  })

  describe('Form Inputs', () => {
    it('allows typing in email field', async () => {
      render(<Auth />)
      
      const emailInput = screen.getByPlaceholderText('email')
      await user.type(emailInput, 'test@example.com')
      
      expect(emailInput).toHaveValue('test@example.com')
    })

    it('allows typing in password field', async () => {
      render(<Auth />)
      
      const passwordInput = screen.getByPlaceholderText('password')
      await user.type(passwordInput, 'password123')
      
      expect(passwordInput).toHaveValue('password123')
    })

    it('toggles password visibility when eye icon is clicked', async () => {
      render(<Auth />)
      
      const passwordInput = screen.getByPlaceholderText('password')
      const toggleButton = screen.getByAltText('Show password')
      
      // Initially password should be hidden
      expect(passwordInput).toHaveAttribute('type', 'password')
      
      // Click to show password
      await user.click(toggleButton)
      expect(passwordInput).toHaveAttribute('type', 'text')
      expect(screen.getByAltText('Hide password')).toBeInTheDocument()
      
      // Click to hide password again
      await user.click(screen.getByAltText('Hide password'))
      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(screen.getByAltText('Show password')).toBeInTheDocument()
    })

    it('toggles remember me checkbox', async () => {
      render(<Auth />)
      
      const rememberMeCheckbox = screen.getByLabelText('Remember me')
      
      expect(rememberMeCheckbox).not.toBeChecked()
      
      await user.click(rememberMeCheckbox)
      expect(rememberMeCheckbox).toBeChecked()
      
      await user.click(rememberMeCheckbox)
      expect(rememberMeCheckbox).not.toBeChecked()
    })
  })

  describe('Sign Up', () => {
    it('calls createUserWithEmailAndPassword with correct credentials', async () => {
      mockCreateUser.mockResolvedValue({} as any)
      
      render(<Auth />)
      
      const emailInput = screen.getByPlaceholderText('email')
      const passwordInput = screen.getByPlaceholderText('password')
      const signUpButton = screen.getByText('Sign Up')
      
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(signUpButton)
      
      await waitFor(() => {
        expect(mockCreateUser).toHaveBeenCalledWith(
          expect.anything(),
          'test@example.com',
          'password123'
        )
      })
    })

    it('shows error message when sign up fails', async () => {
      const errorMessage = 'Email already in use'
      mockCreateUser.mockRejectedValue(new Error(errorMessage))
      
      render(<Auth />)
      
      const emailInput = screen.getByPlaceholderText('email')
      const passwordInput = screen.getByPlaceholderText('password')
      const signUpButton = screen.getByText('Sign Up')
      
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(signUpButton)
      
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument()
      })
    })
  })

  describe('Sign In', () => {
    it('calls signInWithEmailAndPassword with correct credentials', async () => {
      mockSignIn.mockResolvedValue({} as any)
      
      render(<Auth />)
      
      const emailInput = screen.getByPlaceholderText('email')
      const passwordInput = screen.getByPlaceholderText('password')
      const signInButton = screen.getByText('Sign In')
      
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(signInButton)
      
      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith(
          expect.anything(),
          'test@example.com',
          'password123'
        )
      })
    })

    it('sets persistence based on remember me checkbox', async () => {
      mockSignIn.mockResolvedValue({} as any)
      mockSetPersistence.mockResolvedValue()
      
      render(<Auth />)
      
      const emailInput = screen.getByPlaceholderText('email')
      const passwordInput = screen.getByPlaceholderText('password')
      const rememberMeCheckbox = screen.getByLabelText('Remember me')
      const signInButton = screen.getByText('Sign In')
      
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      
      // Test with remember me checked
      await user.click(rememberMeCheckbox)
      await user.click(signInButton)
      
      await waitFor(() => {
        expect(mockSetPersistence).toHaveBeenCalledWith(
          expect.anything(),
          'local'
        )
      })
      
      // Test with remember me unchecked
      await user.click(rememberMeCheckbox)
      await user.click(signInButton)
      
      await waitFor(() => {
        expect(mockSetPersistence).toHaveBeenCalledWith(
          expect.anything(),
          'session'
        )
      })
    })

    it('shows error message when sign in fails', async () => {
      const errorMessage = 'Invalid credentials'
      mockSignIn.mockRejectedValue(new Error(errorMessage))
      
      render(<Auth />)
      
      const emailInput = screen.getByPlaceholderText('email')
      const passwordInput = screen.getByPlaceholderText('password')
      const signInButton = screen.getByText('Sign In')
      
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'wrongpassword')
      await user.click(signInButton)
      
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument()
      })
    })
  })

  describe('Sign Out', () => {
    it('calls signOut when sign out button is clicked', async () => {
      const mockUser = { email: 'test@example.com' }
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser as any)
        return () => {}
      })
      mockSignOut.mockResolvedValue()
      
      render(<Auth />)
      
      const signOutButton = screen.getByText('Sign Out')
      await user.click(signOutButton)
      
      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled()
      })
    })
  })

  describe('Forgot Password', () => {
    it('shows error when email is empty', async () => {
      render(<Auth />)
      
      const forgotPasswordButton = screen.getByText('Forgot Password?')
      await user.click(forgotPasswordButton)
      
      expect(
        screen.getByText(/Enter your email above, then click .*Forgot password.*\?/)
      ).toBeInTheDocument()
    })

    it('calls sendPasswordResetEmail with correct email', async () => {
      mockPasswordReset.mockResolvedValue()
      
      render(<Auth />)
      
      const emailInput = screen.getByPlaceholderText('email')
      const forgotPasswordButton = screen.getByText('Forgot Password?')
      
      await user.type(emailInput, 'test@example.com')
      await user.click(forgotPasswordButton)
      
      await waitFor(() => {
        expect(mockPasswordReset).toHaveBeenCalledWith(
          expect.anything(),
          'test@example.com'
        )
        expect(screen.getByText('Password reset email sent. Check your inbox.')).toBeInTheDocument()
      })
    })

    it('shows error when password reset fails', async () => {
      const errorMessage = 'User not found'
      mockPasswordReset.mockRejectedValue(new Error(errorMessage))
      
      render(<Auth />)
      
      const emailInput = screen.getByPlaceholderText('email')
      const forgotPasswordButton = screen.getByText('Forgot Password?')
      
      await user.type(emailInput, 'test@example.com')
      await user.click(forgotPasswordButton)
      
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument()
      })
    })
  })

  describe('Loading States', () => {
    it('shows loading state during sign up', async () => {
      mockCreateUser.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
      
      render(<Auth />)
      
      const emailInput = screen.getByPlaceholderText('email')
      const passwordInput = screen.getByPlaceholderText('password')
      const signUpButton = screen.getByText('Sign Up')
      
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(signUpButton)
      
      expect(signUpButton).toBeDisabled()
    })

    it('shows loading state during sign in', async () => {
      mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
      
      render(<Auth />)
      
      const emailInput = screen.getByPlaceholderText('email')
      const passwordInput = screen.getByPlaceholderText('password')
      const signInButton = screen.getByText('Sign In')
      
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(signInButton)
      
      expect(signInButton).toBeDisabled()
    })
  })
})
