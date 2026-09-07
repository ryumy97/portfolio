import { getGalleryImages } from "@/app/actions/vault";
import PageLayer from "@/components/page-layer";
import SmoothScroll from "@/components/smooth-scroll";
import { Title } from "@/components/ui/typography";
import { createImageUrl } from "@/lib/image";
import { ImageSection } from "../section";

export default async function Page() {
  const images = await getGalleryImages("gallery-2025");

  return (
    <PageLayer>
      <SmoothScroll horizontal>
        <main className="flex flex-col md:flex-row min-h-svh w-full md:w-max items-center gap-[10vw] md:gap-[5vw] px-8 pt-24 pb-16 md:py-0">
          <div className="md:max-w-[30vw] max-w-[100vw] w-screen">
            <Title className="">
              <div className="text-primary">Gallery</div>
            </Title>
          </div>

          {images.map((image) => (
            <ImageSection
              key={image.storageKey}
              image={createImageUrl(image.storageKey)}
              alt={image.filename}
              layout={image.isPortrait ? "portrait" : "landscape"}
            />
          ))}
        </main>
      </SmoothScroll>
    </PageLayer>
  );
}
