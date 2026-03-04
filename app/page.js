"use client";

import { useEffect, useState } from "react";

export default function Home() {

  const [data, setData] = useState([]);

  useEffect(() => {
    fetch("/api/bids")
      .then(res => res.json())
      .then(setData);
  }, []);

  const total = data.length;

  const national = data.filter(
    i => i.instNm?.includes("국립중앙도서관")
  ).length;

  const assembly = data.filter(
    i => i.instNm?.includes("국회")
  ).length;

  const today = new Date().toISOString().slice(0,10);

  const todayCount = data.filter(
    i => i.bidNtceDt?.startsWith(today)
  ).length;

  return (
    <main style={{padding:"40px", fontFamily:"sans-serif"}}>

      <h1>국립중앙도서관 · 국회도서관 공고 정보</h1>

      <div style={{display:"flex",gap:"20px",marginTop:"20px"}}>

        <div>전체 공고<br/><b>{total}</b></div>

        <div>국립중앙도서관<br/><b>{national}</b></div>

        <div>국회도서관<br/><b>{assembly}</b></div>

        <div>오늘 등록<br/><b>{todayCount}</b></div>

      </div>

      <ul style={{marginTop:"40px"}}>
        {data.map((item,i)=>(
          <li key={i}>
            {item.bidNtceNm}
          </li>
        ))}
      </ul>

    </main>
  );
}
