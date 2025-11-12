import fetch from "node-fetch";

export default async function handler(req, res) {
  const { from, to, symbol = "NIFTY", optionType = "CE" } = req.query;

  const base = "https://www.nseindia.com";
  const apiUrl = `${base}/api/historicalOR/foCPV?from=${from}&to=${to}&instrumentType=OPTIDX&symbol=${symbol}&optionType=${optionType}`;

  try {
    // Step 1: Fetch homepage to get cookies
    const home = await fetch(base, {
      headers: {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0 Safari/537.36",
        "accept-language": "en-US,en;q=0.9"
      }
    });
    const cookies = home.headers.get("set-cookie");

    // Step 2: Fetch NSE API with cookies
    const response = await fetch(apiUrl, {
      headers: {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0 Safari/537.36",
        "referer": base,
        "cookie": cookies
      }
    });

    const json = await response.json();
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).json(json);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
