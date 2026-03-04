import { NextResponse } from "next/server";
import xml2js from "xml2js";

export const dynamic = "force-dynamic";

export async function GET(){

const SERVICE_KEY = process.env.SERVICE_KEY;

const base =
"https://apis.data.go.kr/1230000/ad/BidPublicInfoService/getBidPblancListInfoServcPPSSrch";

const parser = new xml2js.Parser({ explicitArray:false });


/* 날짜 생성 */

const today = new Date();
const start = new Date();

start.setDate(today.getDate()-60);

function format(d,end=false){

const y=d.getFullYear();
const m=String(d.getMonth()+1).padStart(2,"0");
const day=String(d.getDate()).padStart(2,"0");

return `${y}${m}${day}${end?"2359":"0000"}`;

}

const baseQuery =
`ServiceKey=${SERVICE_KEY}
&numOfRows=200
&pageNo=1
&inqryDiv=1
&inqryBgnDt=${format(start)}
&inqryEndDt=${format(today,true)}`.replace(/\n/g,"");


async function fetchData(url){

const res = await fetch(url);
const xml = await res.text();

const json = await parser.parseStringPromise(xml);

let items = json?.response?.body?.items?.item || [];

if(!Array.isArray(items)) items=[items];

return items;

}


/* 기관 조회 */

const national = await fetchData(
`${base}?${baseQuery}&dminsttCd=1371029`
);

const assembly = await fetchData(
`${base}?${baseQuery}&dminsttCd=9720000`
);


/* 키워드 조회 */

const keywords = [
"도서관",
"기록물",
"DB",
"DB구축",
"디지털",
"디지털화"
];

let keywordData=[];

for(const k of keywords){

const data = await fetchData(
`${base}?${baseQuery}&bidNtceNm=${encodeURIComponent(k)}`
);

keywordData = keywordData.concat(data);

}


/* 전체 합치기 */

const all = [
...national,
...assembly,
...keywordData
];


/* 중복 제거 */

const unique = [];

const map = new Map();

for(const item of all){

if(!map.has(item.bidNtceNo)){
map.set(item.bidNtceNo,true);
unique.push(item);
}

}


return NextResponse.json({

national,
assembly,
keyword:keywordData,
all:unique

});

}
