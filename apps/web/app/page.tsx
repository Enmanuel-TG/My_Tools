"use client";

import { useState } from "react";

export default function Home() {
  const [value, setValue] = useState("");

  async function DownLoad() {
    const url = encodeURIComponent(value);
    console.log('click')
    const res = await fetch(
      `https://my-tools-ocm5.onrender.com/download?url=${url}`
    );

    const data = await res.json();
    console.log(data);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        DownLoad();
      }}
    >
      <input type="text" onChange={(e) => setValue(e.target.value)} />
      <button type="submit">Download</button>
    </form>
  );
}
