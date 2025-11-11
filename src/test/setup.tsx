import '@testing-library/jest-dom'
import { ChakraProvider, defaultSystem } from '@chakra-ui/react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import React from 'react'

// Mock Firebase
vi.mock('../lib/firebase', () => ({
  auth: {
    currentUser: null,
  },
}))

// Mock Firebase Auth functions
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn(() => () => {}),
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  setPersistence: vi.fn(),
  browserLocalPersistence: 'local',
  browserSessionPersistence: 'session',
}))

// Custom render function that wraps components with ChakraProvider
const customRender = (ui: React.ReactElement, options = {}) =>
  render(ui, {
    wrapper: ({ children }) => (
      <ChakraProvider value={defaultSystem}>
        {/* Provide a router context for Link/Navigate/hooks */}
        <MemoryRouter initialEntries={['/']}>
          {children}
        </MemoryRouter>
      </ChakraProvider>
    ),
    ...options,
  })

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }
