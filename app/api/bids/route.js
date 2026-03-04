export const dynamic = "force-dynamic";

export async function GET() {

  const SERVICE_KEY = process.env.SERVICE_KEY;

  const url =
    "https://apis.data.go.kr/1230000/BidPublicInfoService/getBidPblancListInfoServc"
    + "?ServiceKey=" + SERVICE_KEY
    + "&numOfRows=10&pageNo=1";

  const res = await fetch(url);
  const text = await res.text();

  return new Response(JSON.stringify({
    url,
    raw:text
  }),{
    headers:{
      "Content-Type":"application/json"
    }
  });

}
