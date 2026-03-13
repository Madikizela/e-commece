using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using EcommerceAPI.Models;

namespace EcommerceAPI.Services;

public interface IEmailService
{
    Task SendPasswordEmailAsync(string toEmail, string userName, string password);
    Task SendPasswordResetEmailAsync(string toEmail, string userName, string newPassword);
    Task SendOrderConfirmationEmailAsync(string toEmail, string customerName, Order order);
    Task SendOrderStatusUpdateEmailAsync(string toEmail, string customerName, Order order, string oldStatus);
}

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    private string GetEmailConfig(string key)
    {
        var value = Environment.GetEnvironmentVariable($"EMAIL_{key.ToUpper()}") 
            ?? _configuration[$"Email:{key}"];
            
        if (string.IsNullOrEmpty(value))
        {
            _logger.LogWarning("Email configuration '{Key}' is not set. Email functionality will be disabled.", key);
            return "";
        }
        
        return value;
    }

    private bool IsEmailConfigured()
    {
        var host = GetEmailConfig("Host");
        var username = GetEmailConfig("Username");
        var password = GetEmailConfig("Password");
        var from = GetEmailConfig("From");
        
        // Check if we have all required fields
        if (string.IsNullOrEmpty(host) || 
            string.IsNullOrEmpty(username) || 
            string.IsNullOrEmpty(password) || 
            string.IsNullOrEmpty(from))
        {
            return false;
        }
        
        // Check if we're using placeholder/demo credentials
        if (username.Contains("demo") || 
            password.Contains("placeholder") || 
            password.Contains("demo"))
        {
            _logger.LogWarning("Email configuration contains placeholder/demo credentials. Please update with real SMTP credentials.");
            return false;
        }
        
        return true;
    }

    private async Task SendEmailAsync(MimeMessage message)
    {
        // Check if email is properly configured
        if (!IsEmailConfigured())
        {
            _logger.LogWarning("Email configuration is incomplete. Skipping email send to {Email}. " +
                "Please configure EMAIL_HOST, EMAIL_USERNAME, EMAIL_PASSWORD, and EMAIL_FROM environment variables " +
                "or set them in appsettings.json under the Email section.", 
                message.To.FirstOrDefault()?.ToString());
            return;
        }

        var host = GetEmailConfig("Host");
        var username = GetEmailConfig("Username");
        var password = GetEmailConfig("Password");
        var port = int.Parse(GetEmailConfig("Port") ?? "587");

        using var client = new SmtpClient();
        try
        {
            _logger.LogInformation("Attempting to send email to {Email} via {Host}:{Port}", 
                message.To.FirstOrDefault()?.ToString(), host, port);

            await client.ConnectAsync(host, port, SecureSocketOptions.StartTls);
            await client.AuthenticateAsync(username, password);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);
            
            _logger.LogInformation("Email sent successfully to {Email}", message.To.FirstOrDefault()?.ToString());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending email to {Email}. " +
                "Please verify your email configuration (host: {Host}, username: {Username}). " +
                "For Gmail, ensure you're using an App Password instead of your regular password.", 
                message.To.FirstOrDefault()?.ToString(), host, username);
            // Don't throw - just log the error so the application continues working
        }
    }

    public async Task SendPasswordEmailAsync(string toEmail, string userName, string password)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress("E-Commerce Store", GetEmailConfig("From")));
        message.To.Add(new MailboxAddress(userName, toEmail));
        message.Subject = "Welcome! Your Account Password";

        var bodyBuilder = new BodyBuilder
        {
            HtmlBody = $@"
                <html>
                <head>
                    <style>
                        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                        .password-box {{ background: white; border: 2px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }}
                        .password {{ font-size: 24px; font-weight: bold; color: #667eea; letter-spacing: 2px; }}
                        .button {{ display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }}
                        .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 12px; }}
                    </style>
                </head>
                <body>
                    <div class='container'>
                        <div class='header'>
                            <h1>🛒 Welcome to E-Commerce Store!</h1>
                        </div>
                        <div class='content'>
                            <h2>Hello {userName},</h2>
                            <p>Thank you for registering with us! Your account has been successfully created.</p>
                            
                            <p>Here are your login credentials:</p>
                            
                            <div class='password-box'>
                                <p style='margin: 0; color: #666;'>Your Password:</p>
                                <p class='password'>{password}</p>
                            </div>
                            
                            <p><strong>Email:</strong> {toEmail}</p>
                            
                            <p>Please keep this password safe and secure. You can use it to login to your account.</p>
                            
                            <p style='margin-top: 30px; color: #666; font-size: 14px;'>
                                <strong>Security Tip:</strong> We recommend changing your password after your first login for better security.
                            </p>
                        </div>
                        <div class='footer'>
                            <p>This is an automated email. Please do not reply to this message.</p>
                            <p>&copy; 2025 E-Commerce Store. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            "
        };

        message.Body = bodyBuilder.ToMessageBody();
        await SendEmailAsync(message);
    }

    public async Task SendPasswordResetEmailAsync(string toEmail, string userName, string newPassword)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress("E-Commerce Store", GetEmailConfig("From")));
        message.To.Add(new MailboxAddress(userName, toEmail));
        message.Subject = "Password Reset - Your New Password";

        var bodyBuilder = new BodyBuilder
        {
            HtmlBody = $@"
                <html>
                <head>
                    <style>
                        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                        .header {{ background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                        .password-box {{ background: white; border: 2px solid #f5576c; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }}
                        .password {{ font-size: 24px; font-weight: bold; color: #f5576c; letter-spacing: 2px; }}
                        .warning {{ background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }}
                        .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 12px; }}
                    </style>
                </head>
                <body>
                    <div class='container'>
                        <div class='header'>
                            <h1>🔑 Password Reset</h1>
                        </div>
                        <div class='content'>
                            <h2>Hello {userName},</h2>
                            <p>We received a request to reset your password. Your new password has been generated.</p>
                            
                            <div class='password-box'>
                                <p style='margin: 0; color: #666;'>Your New Password:</p>
                                <p class='password'>{newPassword}</p>
                            </div>
                            
                            <p><strong>Email:</strong> {toEmail}</p>
                            
                            <div class='warning'>
                                <strong>⚠️ Security Notice:</strong> If you did not request this password reset, please contact us immediately.
                            </div>
                            
                            <p style='margin-top: 30px; color: #666; font-size: 14px;'>
                                <strong>Important:</strong> We recommend changing this password after logging in for better security.
                            </p>
                        </div>
                        <div class='footer'>
                            <p>This is an automated email. Please do not reply to this message.</p>
                            <p>&copy; 2025 E-Commerce Store. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            "
        };

        message.Body = bodyBuilder.ToMessageBody();
        await SendEmailAsync(message);
    }

    public async Task SendOrderConfirmationEmailAsync(string toEmail, string customerName, Order order)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress("E-Commerce Store", GetEmailConfig("From")));
        message.To.Add(new MailboxAddress(customerName, toEmail));
        message.Subject = $"Order Confirmation - Order #{order.Id}";

        var itemsHtml = order.OrderItems != null 
            ? string.Join("", order.OrderItems.Select(item => $@"
            <tr>
                <td style='padding: 10px; border-bottom: 1px solid #eee;'>{item.ProductName}</td>
                <td style='padding: 10px; border-bottom: 1px solid #eee; text-align: center;'>{item.Quantity}</td>
                <td style='padding: 10px; border-bottom: 1px solid #eee; text-align: right;'>R{item.Price:F2}</td>
                <td style='padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;'>R{(item.Price * item.Quantity):F2}</td>
            </tr>
        "))
            : "";

        var bodyBuilder = new BodyBuilder
        {
            HtmlBody = $@"
                <html>
                <head>
                    <style>
                        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                        .order-box {{ background: white; border: 2px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 8px; }}
                        .total {{ font-size: 24px; font-weight: bold; color: #667eea; text-align: right; margin-top: 20px; }}
                        table {{ width: 100%; border-collapse: collapse; }}
                        .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 12px; }}
                    </style>
                </head>
                <body>
                    <div class='container'>
                        <div class='header'>
                            <h1>🎉 Order Confirmed!</h1>
                            <p>Thank you for your purchase</p>
                        </div>
                        <div class='content'>
                            <h2>Hello {customerName},</h2>
                            <p>Your order has been successfully placed and is being processed.</p>
                            
                            <div class='order-box'>
                                <h3>Order Details</h3>
                                <p><strong>Order Number:</strong> #{order.Id}</p>
                                <p><strong>Order Date:</strong> {order.CreatedAt:MMMM dd, yyyy}</p>
                                <p><strong>Status:</strong> <span style='color: #f59e0b; font-weight: bold;'>{order.Status}</span></p>
                                
                                <h4 style='margin-top: 20px;'>Items Ordered:</h4>
                                <table>
                                    <thead>
                                        <tr style='background: #f3f4f6;'>
                                            <th style='padding: 10px; text-align: left;'>Product</th>
                                            <th style='padding: 10px; text-align: center;'>Qty</th>
                                            <th style='padding: 10px; text-align: right;'>Price</th>
                                            <th style='padding: 10px; text-align: right;'>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {itemsHtml}
                                    </tbody>
                                </table>
                                
                                <div class='total'>
                                    Total: R{order.TotalAmount:F2}
                                </div>
                            </div>
                            
                            <div style='background: #e0f2fe; border-left: 4px solid #0284c7; padding: 15px; margin: 20px 0; border-radius: 4px;'>
                                <p style='margin: 0;'><strong>Shipping Address:</strong></p>
                                <p style='margin: 5px 0 0 0;'>{order.ShippingAddress}</p>
                            </div>
                            
                            <p style='margin-top: 30px;'>We'll send you another email when your order ships.</p>
                        </div>
                        <div class='footer'>
                            <p>Questions? Contact us at support@ecommerce.com</p>
                            <p>&copy; 2025 E-Commerce Store. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            "
        };

        message.Body = bodyBuilder.ToMessageBody();
        await SendEmailAsync(message);
    }

    public async Task SendOrderStatusUpdateEmailAsync(string toEmail, string customerName, Order order, string oldStatus)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress("E-Commerce Store", GetEmailConfig("From")));
        message.To.Add(new MailboxAddress(customerName, toEmail));
        message.Subject = $"Order Status Update - Order #{order.Id}";

        var statusColor = order.Status switch
        {
            "Processing" => "#3b82f6",
            "Shipped" => "#8b5cf6",
            "Delivered" => "#10b981",
            "Cancelled" => "#ef4444",
            _ => "#f59e0b"
        };

        var statusMessage = order.Status switch
        {
            "Processing" => "Your order is being prepared for shipment.",
            "Shipped" => "Your order is on its way! You should receive it within 3-5 business days.",
            "Delivered" => "Your order has been delivered. We hope you enjoy your purchase!",
            "Cancelled" => "Your order has been cancelled. If you didn't request this, please contact us.",
            _ => "Your order status has been updated."
        };

        var bodyBuilder = new BodyBuilder
        {
            HtmlBody = $@"
                <html>
                <head>
                    <style>
                        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                        .status-box {{ background: white; border: 3px solid {statusColor}; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }}
                        .status {{ font-size: 28px; font-weight: bold; color: {statusColor}; }}
                        .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 12px; }}
                    </style>
                </head>
                <body>
                    <div class='container'>
                        <div class='header'>
                            <h1>📦 Order Status Update</h1>
                        </div>
                        <div class='content'>
                            <h2>Hello {customerName},</h2>
                            <p>Your order status has been updated.</p>
                            
                            <div class='status-box'>
                                <p style='margin: 0; color: #666;'>Order #{order.Id}</p>
                                <p class='status'>{order.Status}</p>
                                <p style='margin: 10px 0 0 0; color: #666;'>Previous status: {oldStatus}</p>
                            </div>
                            
                            <p style='font-size: 16px; text-align: center;'>{statusMessage}</p>
                            
                            <div style='background: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 8px;'>
                                <p style='margin: 0;'><strong>Order Total:</strong> R{order.TotalAmount:F2}</p>
                                <p style='margin: 10px 0 0 0;'><strong>Shipping Address:</strong> {order.ShippingAddress}</p>
                            </div>
                        </div>
                        <div class='footer'>
                            <p>Questions? Contact us at support@ecommerce.com</p>
                            <p>&copy; 2025 E-Commerce Store. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            "
        };

        message.Body = bodyBuilder.ToMessageBody();
        await SendEmailAsync(message);
    }
}