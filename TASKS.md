# MasterMail Fix Tasks

## Tasks

### In Progress

- [ ] **Fix Login Loop:**
  - [x] Investigated the authentication flow and identified inconsistencies in Supabase client initialization.
  - [x] Refactored the Supabase client to use a unified `createClient` for browser, server, and middleware.
  - [x] Updated all Supabase client imports to use the new, consistent clients.
  - [x] Restored essential functionality to the `setup-profile` route that was accidentally removed.
  - [x] Updated middleware to properly handle authentication and redirects.
  - [x] Restored proper authentication state handling in the `useAuth` hook.
  - [x] Enhanced the login callback route to properly handle the OAuth flow.
  - [ ] After thorough testing, this issue appears to be resolved. Final verification is pending.

### Completed

- [x] **Fix `simple-inbox.tsx` Data Inconsistencies:**
  - [x] Updated the `Email` interface to include the `is_archived` property.
  - [x] Made the folder count and email filtering logic consistent by using the `is_archived` property.
  - [x] Ensured the archive button correctly reflects the email's archived state.

### Backlog

- [ ] **Implement Email Actions:**
  - [ ] Add functionality for starring, snoozing, and deleting emails.
  - [ ] Connect the UI buttons to the `handleEmailAction` function.

- [ ] **Improve UI/UX:**
  - [ ] Add loading skeletons for a smoother initial load.
  - [ ] Implement animations for a more polished user experience.
  - [ ] Ensure the layout is fully responsive for mobile and tablet devices.

- [ ] **Add New Features:**
  - [ ] Implement a command palette for quick actions.
  - [ ] Add support for multiple email accounts.
  - [ ] Implement keyboard shortcuts for power users.