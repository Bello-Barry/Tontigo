import Image from 'next/image'

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-b from-[#0a2a22] to-black">
      <div className="relative w-32 h-32 animate-pulse">
        <Image
          src="/logo.png"
          alt="Likelemba"
          fill
          className="object-contain"
          priority
        />
      </div>
    </div>
  )
}
