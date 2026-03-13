# Email Configuration Guide

This guide will help you set up email notifications for your e-commerce application.

## Overview

The application sends emails for:
- User registration (password delivery)
- Password reset
- Order confirmation
- Order status updates

## Configuration Methods

You can configure email settings using either:
1. **Environment Variables** (Recommended for production)
2. **appsettings.json** (For development)

Environment variables take precedence over appsettings.json values.

## Gmail Setup (Recommended)

### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account settings
2. Navigate to Security
3. Enable 2-Step Verification

### Step 2: Generate App Password
1. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
2. Select "Mail" as the app
3. Select "Other" as the device and enter "E-commerce App"
4. Copy the generated 16-character password

### Step 3: Configure Environment Variables
Create a `.env` file in your backend directory or set these environment variables:

```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=your_email@gmail.com
EMAIL_PASSWORD=your_16_character_app_password
EMAIL_FROM=your_email@gmail.com
```

## Alternative SMTP Providers

### Outlook/Hotmail
```bash
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USERNAME=your_email@outlook.com
EMAIL_PASSWORD=your_password
EMAIL_FROM=your_email@outlook.com
```

### Yahoo Mail
```bash
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_USERNAME=your_email@yahoo.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=your_email@yahoo.com
```

### Custom SMTP Server
```bash
EMAIL_HOST=your_smtp_server.com
EMAIL_PORT=587
EMAIL_USERNAME=your_username
EMAIL_PASSWORD=your_password
EMAIL_FROM=noreply@yourdomain.com
```

## Configuration via appsettings.json

If you prefer to use appsettings.json (not recommended for production):

```json
{
  "Email": {
    "Host": "smtp.gmail.com",
    "Port": "587",
    "Username": "your_email@gmail.com",
    "Password": "your_16_character_app_password",
    "From": "your_email@gmail.com"
  }
}
```

## Testing Email Configuration

### Method 1: Check Application Logs
1. Start your application
2. Register a new user or reset a password
3. Check the console output for email-related messages:
   - ✅ Success: "Email sent successfully to user@example.com"
   - ⚠️ Warning: "Email configuration is incomplete"
   - ❌ Error: "Error sending email" with detailed error message

### Method 2: Test Registration
1. Register a new user account
2. Check if you receive the welcome email with password
3. If no email arrives, check the application logs

### Method 3: Test Password Reset
1. Use the "Forgot Password" feature
2. Check if you receive the password reset email
3. If no email arrives, check the application logs

## Troubleshooting

### Common Issues

#### 1. "Authentication failed" Error
- **Gmail**: Make sure you're using an App Password, not your regular password
- **Other providers**: Verify your username and password are correct

#### 2. "Connection refused" Error
- Check if the SMTP host and port are correct
- Verify your internet connection
- Some networks block SMTP ports

#### 3. "Email configuration is incomplete" Warning
- Ensure all required environment variables are set:
  - EMAIL_HOST
  - EMAIL_USERNAME
  - EMAIL_PASSWORD
  - EMAIL_FROM
- Check for typos in variable names

#### 4. Emails go to Spam
- Add your sending email to the recipient's contacts
- Use a proper "From" address (avoid generic names)
- Consider using a dedicated email service for production

### Debug Steps

1. **Check Environment Variables**:
   ```bash
   echo $EMAIL_HOST
   echo $EMAIL_USERNAME
   echo $EMAIL_FROM
   ```

2. **Verify SMTP Connection**:
   Use a tool like telnet to test SMTP connectivity:
   ```bash
   telnet smtp.gmail.com 587
   ```

3. **Check Application Logs**:
   Look for detailed error messages in the console output

## Production Recommendations

### Use Dedicated Email Service
For production applications, consider using dedicated email services:
- **SendGrid**: Reliable with good deliverability
- **Mailgun**: Developer-friendly with good APIs
- **Amazon SES**: Cost-effective for high volume
- **Postmark**: Excellent for transactional emails

### Security Best Practices
1. Never commit email credentials to version control
2. Use environment variables for all sensitive configuration
3. Rotate email passwords regularly
4. Monitor email sending logs for suspicious activity
5. Implement rate limiting for email sending

### Example Production Configuration
```bash
# Use a dedicated email service
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USERNAME=apikey
EMAIL_PASSWORD=your_sendgrid_api_key
EMAIL_FROM=noreply@yourdomain.com
```

## Email Templates

The application includes professionally designed HTML email templates for:

1. **Welcome Email**: Sent when users register
2. **Password Reset**: Sent when users reset their password
3. **Order Confirmation**: Sent when orders are placed
4. **Order Status Update**: Sent when order status changes

All templates are mobile-responsive and include your branding.

## Support

If you continue to have issues with email configuration:

1. Check the application logs for detailed error messages
2. Verify your SMTP provider's documentation
3. Test with a simple email client first
4. Consider using a dedicated email service for production

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| EMAIL_HOST | SMTP server hostname | smtp.gmail.com |
| EMAIL_PORT | SMTP server port | 587 |
| EMAIL_USERNAME | SMTP username | your_email@gmail.com |
| EMAIL_PASSWORD | SMTP password/app password | abcd efgh ijkl mnop |
| EMAIL_FROM | From email address | noreply@yourdomain.com |

Remember: Environment variables take precedence over appsettings.json values.