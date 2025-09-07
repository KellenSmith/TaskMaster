# Webhook Security Implementation

## Swedbank Pay Payment Callbacks

### Verification Approach

According to Swedbank Pay's official documentation (March 12th, 2025), webhook verification uses:

1. **IP Whitelisting**: Verify requests come from Swedbank Pay's IP ranges
2. **GET Verification**: Make GET request to verify payment status (per official docs)

### Supported IP Ranges

Our implementation validates against these official Swedbank Pay IPs:

**Legacy IPs:**

- `51.107.183.58` - Original Swedbank Pay webhook IP
- `91.132.170.1` - Secondary legacy IP

**New IP Range (March 12th, 2025):**

- `20.91.170.120/29` (covers 20.91.170.120 - 20.91.170.127)

### Implementation Details

#### IP Validation

```typescript
function isAllowedIp(request: NextRequest): boolean {
    const clientIp = getClientIp(request);

    // Legacy IPs
    if (clientIp === "51.107.183.58" || clientIp === "91.132.170.1") {
        return true;
    }

    // New IP range: 20.91.170.120/29
    if (isIpInRange(clientIp, "20.91.170.120", "20.91.170.127")) {
        return true;
    }

    return false;
}
```

#### Security Flow

1. Extract client IP from request headers (considering proxy forwarding)
2. Validate IP against known Swedbank Pay ranges
3. Parse payment callback payload for basic validation
4. **Reuse existing `checkPaymentStatus` function** - This implements the official GET verification pattern
5. Return 200 OK to acknowledge receipt

### Implementation Highlights

#### GET Verification via `checkPaymentStatus`

The webhook handler leverages the existing `checkPaymentStatus` function which:

- Makes GET request to Swedbank Pay API to verify current payment status
- Handles order status progression logic consistently
- Includes proper error handling and authorization checks
- Implements the exact verification pattern recommended by Swedbank Pay docs

```typescript
// Webhook calls existing payment verification logic
const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    select: { user_id: true },
});

await checkPaymentStatus(order.user_id, orderId);
```

This approach ensures:

- **Code Reuse**: No duplication of payment verification logic
- **Consistency**: Same verification flow used in UI and webhooks
- **Maintainability**: Single source of truth for payment status handling

### Important Notes

- **No Signature Verification**: Swedbank Pay does not use cryptographic signatures for webhooks
- **IP-Based Security**: Security relies on IP whitelisting and internal network security
- **GET Verification**: According to docs, recipients should verify status via GET requests
- **Idempotency**: Handle duplicate callbacks gracefully
- **Error Handling**: Return 200 even for application errors to prevent retries

### Compliance

This implementation follows Swedbank Pay's official webhook verification guidelines and does not include unnecessary signature verification that isn't part of their protocol.
