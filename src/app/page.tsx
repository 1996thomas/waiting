import Link from "next/link";

export default function Home() {
  return (
    <>
      <div className="flex flex-col items-center justify-center h-screen w-full   font-[family-name:var(--font-geist-sans)] ">
        <h1 className="text-[10vw] font-black">COOKIN UP 🍜...</h1>
        <Link href={"https://instagram.com/knit_paris"} className="flex justify-center">👀</Link>
      </div>
    </>
  );
}
