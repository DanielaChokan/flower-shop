"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ProductCard from "@/components/product/ProductCard";
import type { Product } from "@/lib/api";
import styles from "@/app/page.module.css";

export default function ProductsSection() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    getDocs(collection(db, "products")).then((snapshot) => {
      setProducts(
        snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<Product, "id">) }))
      );
    });
  }, []);

  const top12 = [...products].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 15);

  return (
    <div className={styles.productGrid4}>
      {top12.map((product) => (
        <ProductCard
          key={product.id}
          id={product.id}
          name={product.name}
          price={product.price}
          image={product.image}
          rating={product.rating}
          stock={product.stock}
        />
      ))}
    </div>
  );
}
