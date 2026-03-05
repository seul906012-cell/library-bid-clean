import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {

const SERVICE_KEY = process.env.SERVICE_KEY;

const url =
`https://apis.data.go.kr/1230000/ad/BidPublicInfoService/getBidPblancListInfoServcPPSSrch
?ServiceKey=${SERVICE_KEY}
&numOfRows=10
&pageNo=1`;

try {

const res = await fetch(url);

const text = await res.text();

return new NextResponse(text, {
headers: { "Content-Type": "text/xml" }
});

} catch (err) {

return NextResponse.json({
error: String(err)
});

}

}
