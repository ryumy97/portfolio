import Image from "next/image";

export function BlogMdxImage({
  src,
  alt,
}: {
  src?: string | Blob;
  alt?: string;
}) {
  if (!src || typeof src !== "string") return null;

  if (/\.(mp4|webm|mov|webp)$/i.test(src)) {
    const stem = src.replace(/\.(mp4|webm|mov|webp)$/i, "");
    return (
      <video
        className="w-full"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={alt || undefined}
      >
        <source src={`${stem}.mp4`} type="video/mp4" />
        {/* biome-ignore lint/performance/noImgElement: animated WebP fallback inside <video> */}
        <img src={`${stem}.webp`} alt={alt ?? ""} className="w-full" />
      </video>
    );
  }

  return (
    <Image
      src={src}
      alt={alt ?? ""}
      width={1600}
      height={900}
      className="h-auto w-full"
    />
  );
}
