# Email Setup Guide

## Prerequisites

- Node.js 16 or higher
- Email account (Gmail, Microsoft 365, or custom SMTP server)
- Access to email account settings

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit the .env file with your credentials
nano .env  # or use your preferred editor
```

### 3. Choose Your Email Provider

#### Option A: Gmail / Google Workspace

1. **Enable 2-Factor Authentication**
   - Go to: https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the generated 16-character password

3. **Update .env file:**
   ```env
   EMAIL_PROVIDER=gmail
   GMAIL_USER=your-email@gmail.com
   GMAIL_APP_PASSWORD=your-16-char-app-password
   ```

#### Option B: Microsoft 365 / Outlook

1. **Enable Modern Authentication**
   - Log in to your Microsoft 365 admin center
   - Ensure modern authentication is enabled

2. **Update .env file:**
   ```env
   EMAIL_PROVIDER=office365
   OFFICE365_USER=your-email@yourdomain.com
   OFFICE365_PASSWORD=your-password
   ```

#### Option C: Custom SMTP Server

```env
EMAIL_PROVIDER=custom
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-username
SMTP_PASSWORD=your-password
```

### 4. Validate Configuration

```bash
npm run validate
```

This will check:
- All required environment variables
- Configuration file validity
- Template file existence

### 5. Test Connection

```bash
# Test SMTP (sending)
npm run test:smtp

# Test IMAP (receiving)
npm run test:imap
```

### 6. Send Test Email

```bash
npm run test:send your-email@example.com
```

## DNS Configuration (For Custom Domains)

### SPF Record

Add this TXT record to your DNS:

```
v=spf1 include:_spf.google.com ~all
```

For Microsoft 365:
```
v=spf1 include:spf.protection.outlook.com ~all
```

### DKIM Record

1. Generate DKIM keys (if not already done by your provider)
2. Add the public key as a TXT record:
   ```
   default._domainkey.yourdomain.com
   ```

### DMARC Record

Add this TXT record:
```
_dmarc.yourdomain.com
v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com
```

### MX Record

Point to your mail server:
```
MX 10 mail.yourdomain.com
```

## Usage Examples

### Basic Usage

```javascript
const { sendEmail } = require('./index');

// Send email using template
await sendEmail({
  to: 'customer@example.com',
  template: 'welcome',
  subject: 'Welcome!',
  variables: {
    firstName: 'John',
    dashboardUrl: 'https://example.com/dashboard'
  }
});
```

### Send Custom HTML

```javascript
await sendEmail({
  to: 'customer@example.com',
  subject: 'Custom Email',
  html: '<h1>Hello!</h1><p>This is a custom email.</p>'
});
```

### Load Template Manually

```javascript
const { loadTemplate } = require('./index');

const html = loadTemplate('welcome', {
  firstName: 'John',
  dashboardUrl: 'https://example.com/dashboard'
});
```

## Available Templates

1. **welcome.html** - Welcome new users
2. **order-confirmation.html** - Order confirmations
3. **support-response.html** - Support ticket responses
4. **password-reset.html** - Password reset emails
5. **newsletter.html** - Monthly newsletters

See `templates/template-config.json` for required variables.

## Troubleshooting

### Authentication Failed

**Problem:** "Invalid login" or "Authentication failed"

**Solutions:**
- For Gmail: Use app-specific password, not regular password
- For Microsoft 365: Ensure modern authentication is enabled
- Check username/email is correct
- Verify 2FA is properly set up

### Connection Timeout

**Problem:** Connection times out when sending/receiving

**Solutions:**
- Check firewall settings
- Verify SMTP/IMAP ports (587 for SMTP, 993 for IMAP)
- Try different port (465 for SSL, 587 for TLS)
- Test with telnet: `telnet smtp.gmail.com 587`

### Emails Going to Spam

**Problem:** Sent emails land in spam folder

**Solutions:**
- Set up SPF, DKIM, and DMARC records
- Warm up your IP (send gradually increasing volumes)
- Avoid spam trigger words
- Include unsubscribe link
- Use verified domain

### Rate Limiting

**Problem:** "Too many requests" or rate limit errors

**Solutions:**
- Reduce sending rate in config
- Implement exponential backoff
- Use connection pooling (already configured)
- Contact provider to increase limits

### Template Not Found

**Problem:** "Template not found" error

**Solutions:**
- Check template filename matches exactly
- Ensure template exists in `templates/` directory
- Don't include `.html` extension when calling

## Security Best Practices

1. **Never commit .env file**
   - Already in .gitignore, but double-check
   - Use environment variables in production

2. **Use app-specific passwords**
   - Don't use main account password
   - Rotate passwords regularly

3. **Enable 2FA**
   - On all email accounts
   - Use authenticator app, not SMS

4. **Limit access**
   - Use separate credentials for different environments
   - Implement IP whitelisting if possible

5. **Monitor activity**
   - Check login history regularly
   - Set up alerts for suspicious activity

6. **Encrypt sensitive data**
   - Use TLS/SSL for all connections
   - Store DKIM keys securely

## Production Deployment

### Environment Variables

Set these in your production environment:

```bash
NODE_ENV=production
EMAIL_ENABLED=true
EMAIL_PROVIDER=gmail  # or your provider
LOG_LEVEL=warn
TLS_REJECT_UNAUTHORIZED=true
```

### Rate Limiting

Configure appropriate limits:

```bash
EMAIL_RATE_LIMIT=100
EMAIL_RATE_WINDOW=60000  # 1 minute
```

### Monitoring

Consider adding:
- Error tracking (e.g., Sentry)
- Email delivery monitoring
- Queue system for high volumes (e.g., Bull, RabbitMQ)

### Scaling

For high volume:
1. Use a dedicated email service (SendGrid, AWS SES, Mailgun)
2. Implement queue system
3. Add retry logic with exponential backoff
4. Monitor bounce rates and spam complaints

## Support

For issues or questions:
- Email: support@fishmusicinc.com
- Check logs for detailed error messages
- Review troubleshooting section above

## Additional Resources

- [Nodemailer Documentation](https://nodemailer.com/)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [Microsoft 365 SMTP Settings](https://support.microsoft.com/en-us/office/pop-imap-and-smtp-settings-8361e398-8af4-4e97-b147-6c6c4ac95353)
- [Email Authentication Standards](https://dmarc.org/)
