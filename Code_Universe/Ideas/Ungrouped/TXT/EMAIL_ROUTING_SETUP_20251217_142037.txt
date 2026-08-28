# 📧 Cloudflare Email Routing Setup for noizylab.ca

## Your Cloudflare Dashboard

**URL**: https://dash.cloudflare.com/1323e14ace0c8d7362612d5b5c0d41bb/noizylab.ca/email/routing/overview

**Zone ID**: `1323e14ace0c8d7362612d5b5c0d41bb`  
**Domain**: `noizylab.ca`

## Quick Setup

### Automated Setup
```bash
cd ~/NOIZYLAB/cloudflare
export CLOUDFLARE_API_TOKEN="your-api-token"
./setup-noizylab-email-routing.sh
```

### Manual Setup in Dashboard

1. **Go to Email Routing**
   - Open: https://dash.cloudflare.com/1323e14ace0c8d7362612d5b5c0d41bb/noizylab.ca/email/routing/overview

2. **Enable Email Routing**
   - Click "Get Started" or "Enable Email Routing"

3. **Add Destination Address**
   - Add: `rspplowman@gmail.com`
   - Verify the address

4. **Create Routing Rules**
   - **rsp@noizylab.ca** → Forward to `rspplowman@gmail.com`
   - **help@noizylab.ca** → Forward to `rspplowman@gmail.com`
   - **hello@noizylab.ca** → Forward to `rspplowman@gmail.com`

5. **Set Catch-All (Optional)**
   - Catch-all → Forward to `rspplowman@gmail.com`

## Configuration

### Routing Rules

| Email Address | Forwards To |
|---------------|-------------|
| rsp@noizylab.ca | rspplowman@gmail.com |
| help@noizylab.ca | rspplowman@gmail.com |
| hello@noizylab.ca | rspplowman@gmail.com |

### Catch-All
- Any email to `*@noizylab.ca` → `rspplowman@gmail.com`

## Benefits

✅ **Free Email Routing** - Cloudflare's free tier
✅ **Custom Domain** - Use @noizylab.ca addresses
✅ **Automatic Forwarding** - All emails go to Gmail
✅ **No Server Required** - Cloudflare handles everything
✅ **SPF/DKIM** - Already configured

## Next Steps

1. ✅ Enable Email Routing in Cloudflare
2. ✅ Add destination address
3. ✅ Create routing rules
4. ✅ Test by sending email to rsp@noizylab.ca
5. ✅ Verify emails arrive at rspplowman@gmail.com

## Testing

Send a test email to:
- `rsp@noizylab.ca`
- `help@noizylab.ca`
- `hello@noizylab.ca`

All should forward to `rspplowman@gmail.com`

---

**Email Routing is ready to configure!** 🚀

