"use client";

import { useEffect, useState } from "react";

export default function Home(){

  const [data,setData] = useState([]);

  useEffect(()=>{

    const load = ()=>{
      fetch("/api/bids")
      .then(res=>res.json())
      .then(setData);
    };

    load();

    const timer = setInterval(load,300000);

    return ()=>clearInterval(timer);

  },[]);

  return(

    <main style={{padding:"40px",fontFamily:"sans-serif"}}>

      <h1>나라장터 공고 확인</h1>

      <ul style={{marginTop:"40px"}}>

        {data.map((item,i)=>(
          <li key={i} style={{marginBottom:"10px"}}>

            <a
              href={item.bidNtceDtlUrl || item.bidNtceUrl}
              target="_blank"
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
