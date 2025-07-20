# Paystack Integration Setup Guide

This document outlines the steps needed to configure Paystack payment processing for TweetToCourse.

## Prerequisites

1. **Paystack Account**: Create an account at [paystack.com](https://paystack.com)
2. **API Keys**: Obtain your test and live API keys from the Paystack dashboard
3. **Webhook URL**: Configure webhook endpoint in Paystack dashboard

## Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# Paystack Configuration
PAYSTACK_SECRET_KEY=sk_test_your_secret_key_here
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_your_public_key_here
PAYSTACK_WEBHOOK_SECRET=your_webhook_secret_here
```

## Paystack Dashboard Configuration

### 1. Create Subscription Plans

In your Paystack dashboard, create the following subscription plans:

#### Pro Monthly Plan
- **Plan Code**: `PLN_pro_monthly`
- **Name**: Pro Monthly Access
- **Amount**: $19.00 USD (or equivalent in your local currency)
- **Interval**: Monthly
- **Currency**: USD

### 2. Configure Webhooks

Set up webhook endpoints in your Paystack dashboard:

#### Webhook URL
```
https://yourdomain.com/api/webhooks/paystack
```

#### Events to Subscribe To
- `charge.success`
- `subscription.create`
- `subscription.disable`
- `subscription.enable`
- `invoice.create`
- `invoice.payment_failed`

### 3. Webhook Secret

Generate a webhook secret in the Paystack dashboard and add it to your environment variables as `PAYSTACK_WEBHOOK_SECRET`.

## Database Migration

Run the database migration to add subscription fields:

```bash
# Apply the subscription fields migration
supabase db push
```

This will add the following fields to the `users` table:
- `customer_code` - Paystack customer identifier
- `subscription_code` - Paystack subscription identifier

## Testing

### Test Mode
1. Use test API keys for development
2. Use Paystack test card numbers for testing payments
3. Monitor webhook events in the Paystack dashboard

### Test Card Numbers
- **Successful Payment**: 4084084084084081
- **Insufficient Funds**: 4084084084084081 (with CVV 408)
- **Invalid Card**: 4084084084084082

## Production Deployment

### 1. Switch to Live Keys
Replace test API keys with live keys in production environment.

### 2. Update Webhook URLs
Update webhook URLs in Paystack dashboard to point to production domain.

### 3. SSL Certificate
Ensure your production domain has a valid SSL certificate for webhook security.

## API Endpoints

The following API endpoints handle Paystack integration:

- `POST /api/payments/create-subscription` - Initialize subscription
- `GET /api/payments/callback` - Handle payment callback
- `POST /api/webhooks/paystack` - Process webhook events
- `POST /api/payments/cancel-subscription` - Cancel subscription
- `POST /api/payments/manage-billing` - Billing management

## Security Considerations

1. **Webhook Verification**: All webhooks are verified using HMAC SHA512
2. **Environment Variables**: Keep API keys secure and never commit to version control
3. **HTTPS Only**: All payment-related endpoints require HTTPS
4. **Input Validation**: All payment data is validated before processing

## Troubleshooting

### Common Issues

1. **Webhook Not Receiving Events**
   - Check webhook URL is accessible
   - Verify webhook secret matches
   - Check Paystack dashboard for delivery attempts

2. **Payment Initialization Fails**
   - Verify API keys are correct
   - Check user email is valid
   - Ensure plan code exists in Paystack

3. **Subscription Not Updating**
   - Check webhook events are being processed
   - Verify database connection
   - Check user ID mapping

### Debug Mode

Enable debug logging by setting:
```bash
NODE_ENV=development
```

This will log additional information about payment processing and webhook events.

## Support

For Paystack-specific issues:
- [Paystack Documentation](https://paystack.com/docs)
- [Paystack Support](https://paystack.com/support)

For application-specific issues:
- Check application logs
- Review webhook delivery logs in Paystack dashboard
- Test with Paystack's webhook testing tools