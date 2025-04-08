'use client';
import { useRouter } from "next/navigation";

export default function Home() {
  
  // Check login
  const route = useRouter();
  const token = localStorage.getItem("token");
  if (!token) {
    route.push("/login");
  }
  
  return (
    <div className="">

    </div>
  );
}
