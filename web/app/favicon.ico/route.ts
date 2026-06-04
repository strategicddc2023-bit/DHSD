const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#10243e"/>
  <path d="M32 12c10.5 0 19 8.5 19 19s-8.5 19-19 19-19-8.5-19-19 8.5-19 19-19Z" fill="#00c4b4"/>
  <path d="M30 19h4v10h10v4H34v10h-4V33H20v-4h10V19Z" fill="#ffffff"/>
</svg>`;

export function GET() {
  return new Response(faviconSvg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
