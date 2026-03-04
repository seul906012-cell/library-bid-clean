"use client";

import { useEffect, useState } from "react";

export default function Home(){

  const [data,setData] = useState([]);

  useEffect(()=>{

    const load = async ()=>{
      const res = await fetch("/api/bids");
      const json = await res.json();
      setData(json);
    };

    load();

    const timer = setInterval(load,300000); // 5분

    return ()=>clearInterval(timer);

  },[]);

  const today = new Date().toISOString().slice(0,10);

  const national = data.filter(
    i => (i.dminsttNm || "").includes("국립중앙도서관")
  );

  const assembly = data.filter(
    i => (i.dminsttNm || "").includes("국회도서관")
  );

  const todayCount = data.filter(i=>{
    if(!i.bidNtceDt) return false;
    const date = i.bidNtceDt.split(" ")[0];
    return date === today;
  }).length;

  return(

    <main style={{padding:"40px",fontFamily:"sans-serif"}}>

      <h1>국립중앙도서관 · 국회도서관 공고 정보</h1>

      <div style={{
        display:"flex",
        gap:"30px",
        marginTop:"20px",
        fontSize:"18px"
      }}>

        <div>
          전체 공고<br/>
          <b>{data.length}</b>
        </div>

        <div>
          국립중앙도서관<br/>
          <b>{national.length}</b>
        </div>

        <div>
          국회도서관<br/>
          <b>{assembly.length}</b>
        </div>

        <div>
          오늘 등록<br/>
          <b>{todayCount}</b>
        </div>

      </div>

      <ul style={{marginTop:"40px"}}>

        {data.map((item,i)=>(
          <li key={i} style={{marginBottom:"10px"}}>

            <a
              href={item.bidNtceDtlUrl || item.bidNtceUrl}
              target="_blank"
              style={{fontWeight:"bold"}}
            >
              {item.bidNtceNm}
            </a>

            {" "}
            ({item.dminsttNm})

          </li>
        ))}

      </ul>

    </main>

  );

}
