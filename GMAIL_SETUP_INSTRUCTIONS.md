# Gmail Email Setup for Order Notifications

## Quick Setup Steps

1. **Enable 2-Factor Authentication** on your Gmail account:
   - Go to: https://myaccount.google.com/security
   - Enable "2-Step Verification"

2. **Generate App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" → "Other (Custom name)"
   - Enter "E-commerce Store"
   - Copy the 16-character password

3. **Update Configuration**:
   - Open `backend/appsettings.json`
   - Replace `your_gmail_app_password_here` with your actual App Password
   - Save the file

4. **Restart Backend**:
   ```bash
   cd backend
   dotnet run
   ```

## Example Configuration

Your `appsettings.json` should look like this:

```json
{
  "Email": {
    "Host": "smtp.gmail.com",
    "Port": "587",
    "Username": "Madikizela21517799@gmail.com",
    "Password": "abcd efgh ijkl mnop",
    "From": "Madikizela21517799@gmail.com"
  }
}
```

Replace `abcd efgh ijkl mnop` with your actual 16-character App Password.

## Testing

After setup, test by:
1. Registering a new user
2. Placing an order
3. Check your email for notifications

## Troubleshooting

If emails still don't work:
1. Check the backend console for error messages
2. Verify the App Password is correct (16 characters, no spaces)
3. Make sure 2-Factor Authentication is enabled
4. Try generating a new App Password

## Alternative: Environment Variables

Instead of editing appsettings.json, you can set environment variables:

```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=Madikizela21517799@gmail.com
EMAIL_PASSWORD=your_16_character_app_password
EMAIL_FROM=Madikizela21517799@gmail.com
```

Environment variables take precedence over appsettings.json values.