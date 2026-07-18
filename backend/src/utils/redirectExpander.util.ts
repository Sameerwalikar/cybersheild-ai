import { request } from "https";

export async function expandUrl(initialUrl: string): Promise<string[]> {
  const redirectChain: string[] = [initialUrl];
  let currentUrl = initialUrl;
  const maxHops = 5;

  for (let hop = 0; hop < maxHops; hop++) {
    try {
      const urlObj = new URL(currentUrl);
      
      const hopPromise = new Promise<string | null>((resolve) => {
        const req = request(
          urlObj,
          {
            method: "HEAD",
            timeout: 3000,
            headers: {
              "User-Agent": "CyberShieldScanner/1.0"
            }
          },
          (res) => {
            if ([301, 302, 303, 307, 308].includes(res.statusCode || 0) && res.headers.location) {
              try {
                const resolvedLocation = new URL(res.headers.location, currentUrl).toString();
                resolve(resolvedLocation);
              } catch {
                resolve(null);
              }
            } else {
              resolve(null);
            }
          }
        );

        req.on("error", () => resolve(null));
        req.on("timeout", () => {
          req.destroy();
          resolve(null);
        });
        req.end();
      });

      const nextUrl = await hopPromise;
      if (nextUrl) {
        redirectChain.push(nextUrl);
        currentUrl = nextUrl;
      } else {
        break;
      }
    } catch {
      break;
    }
  }

  return redirectChain;
}
