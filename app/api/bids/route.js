export const dynamic = "force-dynamic";

export async function GET() {
  const SERVICE_KEY = process.env.SERVICE_KEY;

  if (!SERVICE_KEY) {
    return new Response("SERVICE_KEY not set", { status: 500 });
  }

  const today = new Date();
  const start = new Date();
  start.setDate(today.getDate() - 30);

  const fmt = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}${m}${day}`;
  };

  const baseUrl =
    `https://apis.data.go.kr/1230000/ad/BidPublicInfoService/getBidPblancListInfoServcPPSSrch` +
    `?ServiceKey=${SERVICE_KEY}` +
    `&numOfRows=100&pageNo=1` +
    `&inqryDiv=1` +
    `&inqryBgnDt=${fmt(start)}` +
    `&inqryEndDt=${fmt(today)}`;

  const codes = ["1371029", "9720000"];

  let allXml = "";

  for (const code of codes) {
    const res = await fetch(`${baseUrl}&dminsttCd=${code}`);
    const xml = await res.text();
    allXml += xml + "\n\n";
  }

  return new Response(allXml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
