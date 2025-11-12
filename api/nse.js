// /api/nse.js
import fetch from "node-fetch";
import zlib from "zlib";

export const config = {
  runtime: "nodejs20",
  maxDuration: 60,
};

export default async function handler(req, res) {
  const { from, to, symbol = "NIFTY", optionType = "CE" } = req.query;
  const base = "https://www.nseindia.com";
  const apiUrl = `${base}/api/historicalOR/foCPV?from=${from}&to=${to}&instrumentType=OPTIDX&symbol=${symbol}&optionType=${optionType}`;

  try {
    // Step 1: Get valid cookies from NSE homepage
    const home = await fetch(base, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36",
        "accept-language": "en-US,en;q=0.9",
        accept: "text/html,application/xhtml+xml",
      },
    });
    const cookies = home.headers.get("set-cookie");

    // Step 2: Fetch actual data with cookies + proper headers
    const resp = await fetch(apiUrl, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36",
        "accept-language": "en-US,en;q=0.9",
        "accept-encoding": "gzip, deflate, br",
        accept: "application/json",
        referer: base,
        cookie: cookies,
      },
      redirect: "follow",
      compress: false,
    });

    // Step 3: Handle gzip / brotli response
    const buffer = await resp.arrayBuffer();
    const enc = resp.headers.get("content-encoding");
    let text;

    if (enc === "gzip") {
      text = zlib.gunzipSync(Buffer.from(buffer)).toString("utf-8");
    } else if (enc === "br") {
      text = zlib.brotliDecompressSync(Buffer.from(buffer)).toString("utf-8");
    } else {
      text = Buffer.from(buffer).toString("utf-8");
    }

    // Step 4: If NSE still returned HTML, throw friendly error
    if (text.trim().startsWith("<")) {
      throw new Error("NSE returned HTML instead of JSON — likely blocked or missing cookies");
    }

    const json = JSON.parse(text);

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).json(json);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
