# Hosting Farming Ledger

This website is ready for static hosting on GitHub Pages or Netlify.

## Recommended: GitHub Pages

GitHub Pages is a good fit because this website is plain HTML, CSS, JavaScript, and images.

### Publish from GitHub

1. Create a GitHub repository, for example `farmingledger-website`.
2. Push these files to the `main` branch.
3. In GitHub, open the repository settings.
4. Go to `Pages`.
5. Set the source to `Deploy from a branch`.
6. Select branch `main` and folder `/root`.
7. Save.
8. Under `Custom domain`, use:

```text
farmingledger.co.za
```

The `CNAME` file in this project already contains that domain.

### HostAfrica DNS Records for GitHub Pages

Keep the HostAfrica nameservers as they are, then add these DNS records:

```text
Type: A
Name: @
Value: 185.199.108.153
```

```text
Type: A
Name: @
Value: 185.199.109.153
```

```text
Type: A
Name: @
Value: 185.199.110.153
```

```text
Type: A
Name: @
Value: 185.199.111.153
```

For `www`, add:

```text
Type: CNAME
Name: www
Value: YOUR-GITHUB-USERNAME.github.io
```

Replace `YOUR-GITHUB-USERNAME` with the GitHub account or organization that owns the repository.

DNS can take a few minutes to 24 hours to fully update.

## Deploy on Netlify

### Agent-assisted deploy

If you have a Netlify personal access token, run:

```powershell
.\deploy-netlify.ps1 -Token "YOUR_NETLIFY_TOKEN"
```

The script creates a Netlify site, uploads `farming-ledger-site.zip`, and returns the live Netlify URL.

### Manual deploy

1. Go to `https://app.netlify.com/drop`.
2. Upload `farming-ledger-site.zip`.
3. Copy the Netlify site URL, such as `example-name.netlify.app`.
4. In Netlify, add these custom domains:
   - `farmingledger.co.za`
   - `www.farmingledger.co.za`

## HostAfrica DNS Records

Keep the HostAfrica nameservers as they are, then add these normal DNS records in the DNS zone editor:

```text
Type: A
Name: @
Value: 75.2.60.5
```

```text
Type: CNAME
Name: www
Value: astounding-mooncake-c26d00.netlify.app
```

Current Netlify URL:

```text
https://astounding-mooncake-c26d00.netlify.app/
```

DNS can take a few minutes to 24 hours to fully update.

## Updating App Download Links

The website reads the latest Windows and phone download buttons from `downloads.json`.

When a new app version is available:

1. Replace the downloadable app packages:
   - `downloads/farming-ledger-windows-app.zip`
   - `downloads/farming-ledger-mobile-app.zip`
2. Update `downloads.json` with the new version, date, file size, and URL.
3. Redeploy the site.

The page fetches `downloads.json` without browser caching, so visitors get the newest file links after the deploy.

The site is also installable as a web app through `site.webmanifest` and `service-worker.js`, so users can open `https://farmingledger.co.za/` and install the online app from their browser.
