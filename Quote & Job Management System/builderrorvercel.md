
  
Running build in Washington, D.C., USA (East) – iad1
Build machine configuration: 2 cores, 8 GB
Cloning github.com/whizrocksukumar/whizrock-premier (Branch: main, Commit: 6a0603b)
Cloning completed: 1.428s
Restored build cache from previous deployment (Fpzi8K3jggSg3QxDbZgxDJQosFUr)
Running "vercel build"
Vercel CLI 50.1.6
Installing dependencies...
npm warn deprecated node-domexception@1.0.0: Use your platform's native DOMException instead
added 57 packages, removed 33 packages, and changed 1 package in 5s
160 packages are looking for funding
  run `npm fund` for details
Detected Next.js version: 14.2.3
Running "npm run build"
> whizrock-premier@0.1.0 build
> next build

▲ Next.js 14.2.3
   Creating an optimized production build ...
 ✓ Compiled successfully
   Skipping validation of types
   Skipping linting
   Collecting page data ...
   Generating static pages (0/38) ...
   Generating static pages (9/38) 
   Generating static pages (18/38) 
   Generating static pages (28/38) 
 ⨯ useSearchParams() should be wrapped in a suspense boundary at page "/jobs/new". Read more: https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout
    at l (/vercel/path0/.next/server/chunks/3886.js:16:16824)
    at c (/vercel/path0/.next/server/chunks/3886.js:16:27821)
    at N (/vercel/path0/.next/server/app/jobs/new/page.js:1:3963)
    at nj (/vercel/path0/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:46251)
    at nM (/vercel/path0/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:47571)
    at nN (/vercel/path0/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:64546)
    at nI (/vercel/path0/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:47010)
    at nM (/vercel/path0/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:47717)
    at nM (/vercel/path0/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:61546)
    at nN (/vercel/path0/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:64546)
Error occurred prerendering page "/jobs/new". Read more: https://nextjs.org/docs/messages/prerender-error
 ✓ Generating static pages (38/38)
> Export encountered errors on following paths:
	/jobs/new/page: /jobs/new
Error: Command "npm run build" exited with 1