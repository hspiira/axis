# Authentication Service Architecture

This document explains the SOLID design principles applied to the authentication system.

## SOLID Principles Implementation

### 1. Single Responsibility Principle (SRP)

Each class/component has a single, well-defined responsibility:

- **`IAuthService` / `AuthService`**: Orchestrates authentication operations only
- **`ITokenStorage` / `LocalStorageTokenStorage`**: Handles token persistence only
- **`AuthApiClient`**: Manages HTTP requests for authentication only
- **`AuthContext`**: Manages authentication state only
- **`SignInModal`**: Handles sign-in UI and form submission only
- **`loginSchema`**: Defines validation rules only

### 2. Open/Closed Principle (OCP)

The system is open for extension but closed for modification:

- **Auth Methods**: Can add Microsoft OAuth, Google OAuth, etc. by implementing `IAuthService` without modifying existing code
- **Token Storage**: Can switch to `SessionStorageTokenStorage` or `CookieTokenStorage` by implementing `ITokenStorage`
- **API Client**: Can extend `AuthApiClient` with additional methods without breaking existing functionality

### 3. Liskov Substitution Principle (LSP)

All implementations can be substituted with their interfaces:

- Any `ITokenStorage` implementation can replace `LocalStorageTokenStorage`
- Any `IAuthService` implementation can replace `AuthService`
- Components depend on interfaces, not concrete implementations

### 4. Interface Segregation Principle (ISP)

Interfaces are segregated by concern:

- **`IAuthService`**: Core authentication operations
- **`ITokenStorage`**: Token persistence operations
- **`IUserSession`**: User session management (for future extension)

Each interface is focused and clients only depend on what they need.

### 5. Dependency Inversion Principle (DIP)

High-level modules depend on abstractions, not concretions:

- **`AuthService`** depends on `IAuthService` interface (via constructor injection)
- **`AuthService`** depends on `ITokenStorage` interface, not `LocalStorageTokenStorage`
- **`AuthContext`** uses `AuthService` but can accept any `IAuthService` implementation
- **Components** use `useAuth()` hook (abstraction), not direct service calls

## Architecture Layers

```
┌─────────────────────────────────────┐
│   Components (UI Layer)             │
│   - SignInModal                     │
│   - LandingHeader                   │
└──────────────┬──────────────────────┘
               │ uses
┌──────────────▼──────────────────────┐
│   Context (State Management)        │
│   - AuthContext                     │
│   - useAuth hook                    │
└──────────────┬──────────────────────┘
               │ uses
┌──────────────▼──────────────────────┐
│   Services (Business Logic)          │
│   - AuthService (implements IAuth)   │
│   - TokenStorage (implements IToken) │
└──────────────┬──────────────────────┘
               │ uses
┌──────────────▼──────────────────────┐
│   API (HTTP Layer)                   │
│   - AuthApiClient                    │
└──────────────────────────────────────┘
```

## Extension Points

### Adding Microsoft OAuth

1. Create `MicrosoftAuthService` implementing `IAuthService`
2. Inject into `AuthProvider`:
   ```tsx
   <AuthProvider authService={new MicrosoftAuthService()}>
   ```

### Changing Token Storage

1. Create `SessionStorageTokenStorage` implementing `ITokenStorage`
2. Inject into `AuthService`:
   ```tsx
   const storage = new SessionStorageTokenStorage()
   const service = new AuthService(authApiClient, storage)
   ```

### Adding New Auth Methods

1. Extend `AuthApiClient` with new methods
2. Extend `AuthService` to use new methods
3. No changes needed to components or context

## Benefits

1. **Testability**: Easy to mock interfaces for testing
2. **Maintainability**: Changes are isolated to specific layers
3. **Flexibility**: Can swap implementations without breaking code
4. **Scalability**: Easy to add new features without modifying existing code
5. **Type Safety**: TypeScript interfaces ensure contract compliance

