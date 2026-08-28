# Deploying noizy.ai Coming Soon Page

## Overview

The landing page runs as a Cloudflare Worker, serving the HTML directly from the edge. Email signups are stored in a KV namespace.

## Steps

### 1. Prepare the Worker

The `worker.js` file has a placeholder `%%HTML_CONTENT%%` that needs to be replaced with the full HTML from `index.html`. You can do this manually or use the build script below:

```bash
# Build: inline HTML into worker
cd noizy-ai-landing
sed -e '/%%HTML_CONTENT%%/{r index.html' -e 'd}' worker.js > dist/worker.js
```

Or simply copy-paste the HTML content into the backtick string in `worker.js`.

### 2. Create KV Namespace for Email Signups

```bash
wrangler kv namespace create SIGNUPS
```

Copy the ID from the output and update `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "SIGNUPS"
id = "paste-the-id-here"
```

### 3. Deploy the Worker

```bash
wrangler deploy
```

### 4. Configure DNS Records

In Cloudflare Dashboard → noizy.ai → DNS:

Add these records:
- **Type**: AAAA | **Name**: @ | **Content**: 100:: | **Proxy**: ON (orange cloud)
- **Type**: AAAA | **Name**: www | **Content**: 100:: | **Proxy**: ON (orange cloud)

The AAAA record with `100::` is the standard Cloudflare placeholder for Workers routes. The Worker route in `wrangler.toml` handles the actual serving.

### 5. SSL/TLS

In Cloudflare Dashboard → noizy.ai → SSL/TLS:
- Set encryption mode to **Full (strict)**
- Enable **Always Use HTTPS**
- Enable **Automatic HTTPS Rewrites**

### 6. Verify

Visit https://noizy.ai — you should see the living landscape with stars, aurora, and gentle waves.

## Reading Signups

To view collected email signups:

```bash
wrangler kv key list --namespace-id YOUR_KV_NAMESPACE_ID --prefix "signup:"
```

To read a specific signup:

```bash
wrangler kv get --namespace-id YOUR_KV_NAMESPACE_ID "signup:someone@email.com"
```

## Photo Background (Optional)

To add a photo background, upload the image to Cloudflare R2:

```bash
wrangler r2 object put noizy-assets/hero.jpg --file hero.jpg
```

Then add this CSS to `index.html` inside the `#world` style:

```css
#world {
  background: url('https://pub-XXXX.r2.dev/hero.jpg') center/cover no-repeat;
}
```

The canvas animation will layer beautifully over a nature photo — the stars and aurora blend with the image.

## Updating the Page

1. Edit `index.html`
2. Re-inline into `worker.js`
3. Run `wrangler deploy`

Or switch to Cloudflare Pages for automatic git-based deployments from the NOIZYANTHROPIC repo.
