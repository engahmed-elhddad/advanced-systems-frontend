import React from "react";

async function getProduct(part_number: string) {
  const res = await fetch(
    `https://api.advancedsystems-int.com/product/${part_number}`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    return null;
  }

  return res.json();
}

async function getRelated(part_number: string) {
  const res = await fetch(
    `https://api.advancedsystems-int.com/related/${part_number}`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    return [];
  }

  const data = await res.json();

  return data.results || [];
}

export async function generateMetadata({ params }: any) {
  const product = await getProduct(params.part_number);

  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  return {
    title: product.title,
    description: product.seo_description,
  };
}

export default async function ProductPage({ params }: any) {
  const product = await getProduct(params.part_number);
  const related = await getRelated(params.part_number);

  if (!product) {
    return <div style={{ padding: "40px" }}>Product not found</div>;
  }

  return (
    <div style={{ maxWidth: "1100px", margin: "auto", padding: "40px" }}>
      
      <div style={{ display: "flex", gap: "40px", flexWrap: "wrap" }}>

        {/* Product Image */}

        <div
          style={{
            width: "420px",
            minHeight: "320px",
            background: "#f5f5f5",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden"
          }}
        >

          {product.image ? (

            <img
              src={product.image}
              alt={product.part_number}
              style={{
                width: "100%",
                objectFit: "contain"
              }}
              onError={(e:any)=>{
                e.target.style.display="none"
              }}
            />

          ) : (

            <span style={{ color:"#777" }}>
              No Image Available
            </span>

          )}

        </div>

        {/* Product Info */}

        <div style={{ flex: 1 }}>

          <h1 style={{ fontSize: "28px", marginBottom: "10px" }}>
            {product.part_number} Industrial Automation Spare Part
          </h1>

          <p>
            <strong>Manufacturer:</strong> {product.brand}
          </p>

          <p>
            <strong>Category:</strong> {product.category}
          </p>

          <p style={{ marginTop: "10px" }}>
            {product.description}
          </p>

          {/* Availability */}

          <div style={{ marginTop: "10px" }}>
            {product.availability === "In Stock" ? (
              <span
                style={{
                  background: "#16a34a",
                  color: "white",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontSize: "14px"
                }}
              >
                In Stock
              </span>
            ) : (
              <span
                style={{
                  background: "#dc2626",
                  color: "white",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontSize: "14px"
                }}
              >
                Not in Stock
              </span>
            )}
          </div>

          {/* Price */}

          {product.price && (
            <p style={{ marginTop: "10px", fontSize: "18px" }}>
              <strong>Price:</strong> ${product.price}
            </p>
          )}

          {/* Datasheet */}

          {product.datasheet && (
            <div style={{ marginTop: "15px" }}>
              <a
                href={product.datasheet}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: "10px 16px",
                  background: "#111827",
                  color: "white",
                  borderRadius: "6px",
                  textDecoration: "none"
                }}
              >
                View Datasheet
              </a>
            </div>
          )}

          {/* RFQ */}

          <div
            style={{
              marginTop: "30px",
              padding: "20px",
              border: "1px solid #ddd",
              borderRadius: "10px"
            }}
          >

            <h3>Request Quote</h3>

            <p style={{ color: "#555", marginTop: "10px" }}>
              This item is not currently in our stock. Advanced Systems can source
              this product through our global supplier network.
            </p>

            <button
              style={{
                marginTop: "15px",
                padding: "12px 20px",
                background: "#2563eb",
                color: "white",
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
                fontWeight: "bold"
              }}
            >
              Request Quote
            </button>

          </div>

        </div>
      </div>

      {/* Related Products */}

      {related.length > 0 && (

        <div style={{ marginTop: "60px" }}>

          <h2>Related Products</h2>

          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>

            {related.map((item:any)=>(

              <a
                key={item.part_number}
                href={`/product/${item.part_number}`}
                style={{
                  border: "1px solid #eee",
                  padding: "12px",
                  borderRadius: "6px",
                  textDecoration: "none",
                  color:"#111"
                }}
              >

                {item.part_number}

              </a>

            ))}

          </div>

        </div>

      )}

      {/* SEO Schema */}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.part_number,
            brand: product.brand,
            description: product.description,
            sku: product.part_number,
            image: product.image,
            offers: {
              "@type": "Offer",
              availability: product.availability,
            },
          }),
        }}
      />

    </div>
  );
}