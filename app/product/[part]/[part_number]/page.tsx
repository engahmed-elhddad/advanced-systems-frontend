import React from "react";

async function getCategory(category: string) {

  const res = await fetch(
    `https://api.advancedsystems-int.com/category/${category}`,
    { cache: "no-store" }
  );

  if (!res.ok) return null;

  return res.json();
}

export default async function CategoryPage({ params }: any) {

  const data = await getCategory(params.category);

  if (!data) {
    return <div style={{ padding: "40px" }}>Category not found</div>;
  }

  return (

    <div style={{ maxWidth: "1100px", margin: "auto", padding: "40px" }}>

      <h1 style={{ fontSize: "32px", marginBottom: "30px" }}>
        {params.category} Industrial Spare Parts
      </h1>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>

        {data.results.map((item:any)=> (

          <a
            key={item.part_number}
            href={`/product/${item.part_number}`}
            style={{
              border: "1px solid #eee",
              padding: "16px",
              borderRadius: "8px",
              textDecoration: "none",
              color: "#111"
            }}
          >

            {item.part_number}

          </a>

        ))}

      </div>

    </div>

  );
}