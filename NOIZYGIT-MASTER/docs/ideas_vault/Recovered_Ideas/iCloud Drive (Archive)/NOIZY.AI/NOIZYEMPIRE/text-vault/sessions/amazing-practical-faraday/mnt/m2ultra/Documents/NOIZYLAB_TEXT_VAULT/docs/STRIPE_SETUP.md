# 💳 FISH MUSIC INC - STRIPE SETUP

**Complete Stripe payment integration**

**Setup Time: 30 minutes**

---

## 🚀 Quick Setup

### 1. Create Stripe Account

1. Go to: **https://stripe.com**
2. Click **Sign Up**
3. Enter:
   - **Email:** rp@fishmusicinc.com
   - **Business name:** Fish Music Inc
   - **Country:** Canada
4. Complete verification

### 2. Get API Keys

1. Go to **Developers** → **API Keys**
2. Copy your keys:
   - **Publishable key:** pk_live_... (or pk_test_... for testing)
   - **Secret key:** sk_live_... (or sk_test_... for testing)

### 3. Set Environment Variables

```bash
export STRIPE_PUBLISHABLE_KEY="pk_live_your_key_here"
export STRIPE_SECRET_KEY="sk_live_your_key_here"
```

**Make permanent:**
```bash
echo 'export STRIPE_PUBLISHABLE_KEY="pk_live_..."' >> ~/.zshrc
echo 'export STRIPE_SECRET_KEY="sk_live_..."' >> ~/.zshrc
source ~/.zshrc
```

---

## 💼 Business Information

**Legal Name:** Fish Music Inc
**Business Type:** Sole Proprietorship (or Corporation)
**Industry:** Music Production & Sound Design
**Website:** fishmusicinc.com
**Email:** rp@fishmusicinc.com

---

## 🎯 Stripe Products to Enable

### 1. Payment Links
- Create instant payment links
- No coding required
- Perfect for invoicing

### 2. Invoicing
- Professional invoices
- Automatic reminders
- Email delivery

### 3. Subscriptions (Future)
- Monthly music services
- Recurring revenue
- Automatic billing

### 4. Payment Methods
- Credit/Debit cards
- Apple Pay
- Google Pay
- ACH transfers (US)
- Canadian payments

---

## 💰 Create Payment Link

1. Go to **Payment Links** in Stripe Dashboard
2. Click **New**
3. Enter:
   - **Name:** Music Production Invoice
   - **Price:** Custom amount
   - **Description:** Professional music production services
4. Click **Create link**
5. Copy link: `https://buy.stripe.com/...`

**Use this link for invoices!**

---

## 🔗 Integration

Your payment link structure:
```
https://buy.stripe.com/fishmusicinc/[PRODUCT]
```

Add to:
- Email signatures
- Website
- Invoices
- Social media

---

## 📧 Email Integration

**In your invoices, add:**

```
Payment Options:
💳 Stripe: https://buy.stripe.com/your_link
💰 PayPal: rsp@noizyfish.com
☕ Ko-fi: ko-fi.com/noizyfish
```

---

## ✅ Verification Checklist

- [ ] Stripe account created
- [ ] Business info verified
- [ ] Bank account connected
- [ ] Payment link created
- [ ] Test payment completed
- [ ] Added to website
- [ ] Added to invoices

---

**GORUNFREE! 🎸🔥**

