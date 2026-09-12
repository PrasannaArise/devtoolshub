# DevToolsHub

Ten free developer tools with static, search-indexable pages. Inputs run locally in Web Workers, with a five-second timeout. No accounts, analytics, ads, runtime dependencies, or data uploads.

## Local development

Requires Node.js 22 or newer. Run `npm test`, `npm run build`, then `npm run dev`. Open http://127.0.0.1:4173.

## Vercel

Import this repository, choose Other as the framework, and deploy. `vercel.json` specifies the build and output directory. The build uses `VERCEL_PROJECT_PRODUCTION_URL` for canonical links and sitemap generation. Set `SITE_URL` to an HTTPS origin when using a custom domain. No environment secrets are required.

## Tools and limits

JSON format/minify; JWT decode (never signature verification); Unicode Base64; UUID v4; explicit timestamp conversions; URL component encoding; five-field UTC cron; JavaScript regex; basic SQL formatting; SHA-256/384/512.

Inputs are limited to one million characters. Regex output is capped at 1,000 matches. Cron searches at most five years and supports numbers, wildcards, ranges, lists and steps. SQL formatting is intentionally basic and does not validate or execute queries. Review each tool's on-page limitations.

## Privacy and launch

The host receives ordinary HTTP request metadata. Tool inputs are not sent by the application. Public GitHub issues provide the contact route. Advertising and analytics are not included. Review the published privacy and terms text for your operating needs before adding tracking, advertising, or other services.
