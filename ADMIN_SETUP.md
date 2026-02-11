## Super Admin Account

**Admin Login Credentials:**
- Phone Number: 0797585933
- Password: 125050.Lit

**Access URL:** `/admin`

## Admin Features

The Super Admin dashboard provides comprehensive control over all site operations:

### 📊 Activity Feed
- Real-time activity log showing all recent actions across the platform
- Color-coded entries for quick visual identification
- Timestamp and status for each activity

### 📋 Loan Applications
- View, search, and filter all loan applications
- Approve or reject applications with one click
- View detailed applicant information
- Search by name, ID number, or phone

### 💬 Support Chat
- Real-time chat with users
- View conversation history
- Mark conversations as settled
- Reopen resolved conversations if needed
- See user details (phone, email)

### 💳 Withdrawals
- View pending withdrawal requests
- Approve or reject with confirmation
- See withdrawal details and history

### 💰 Deposits
- View all savings deposits
- Verify successful deposits
- Reject failed deposits with reasons
- See M-Pesa transaction details
- Filter by status (pending, verified, rejected)

### 🏦 Disbursements
- Track loan disbursements
- Mark loans as disbursed
- View applicant details

## Security Notes

- Admin role is stored in a separate `user_roles` table (not in profiles) for security
- All admin actions are validated server-side via RLS policies
- Admin access is checked on every page load
