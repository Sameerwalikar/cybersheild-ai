import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const CITY_DB_URL = "https://github.com/P3TERX/GeoLite.mmdb/raw/download/GeoLite2-City.mmdb";
const ASN_DB_URL = "https://github.com/P3TERX/GeoLite.mmdb/raw/download/GeoLite2-ASN.mmdb";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, "../data");

async function downloadFile(url: string, dest: string): Promise<void> {
  console.log(`Downloading from ${url}...`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.statusText}`);
  }
  if (!response.body) {
    throw new Error(`Response body is null for ${url}`);
  }

  const fileStream = fs.createWriteStream(dest);
  
  // Node's native fetch response.body is a Node Readable Stream or Web ReadableStream.
  // In modern Node versions, response.body is a Web ReadableStream.
  // We can convert the Web stream or write it by reading its reader.
  // A simple way to stream in Node is to use Readable.fromWeb(response.body) or pipe the body.
  // Let's use Readable.fromWeb or simple arrayBuffer write if it is not too large, 
  // but since GeoIP databases are 10MB-60MB, streaming is safer.
  // In Node 18+, we can do: Readable.fromWeb(response.body as any).pipe(fileStream)
  const { Readable } = await import("stream");
  const nodeStream = Readable.fromWeb(response.body as any);
  nodeStream.pipe(fileStream);

  return new Promise<void>((resolve, reject) => {
    fileStream.on("finish", () => {
      fileStream.close();
      resolve();
    });
    fileStream.on("error", (err) => {
      fs.unlink(dest, () => {}); // delete partial file
      reject(err);
    });
  });
}

async function main() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const cityDest = path.join(DATA_DIR, "GeoLite2-City.mmdb");
  const asnDest = path.join(DATA_DIR, "GeoLite2-ASN.mmdb");

  try {
    await downloadFile(CITY_DB_URL, cityDest);
    console.log(`Saved City DB to ${cityDest}`);

    await downloadFile(ASN_DB_URL, asnDest);
    console.log(`Saved ASN DB to ${asnDest}`);

    console.log("MaxMind databases downloaded successfully.");
  } catch (error) {
    console.error("Failed to download MaxMind databases:", error);
    process.exit(1);
  }
}

main();
