import { VAULT_API_KEY, VAULT_API_URL } from "@/lib/env";
import "server-only";

type GalleryImage = {
  filename: string;
  originalWidth: number;
  originalHeight: number;
  isPortrait: boolean;
  storageKey: string;
};

export const getGalleryImages = async (
  tag: string,
): Promise<GalleryImage[]> => {
  const res = await fetch(`${VAULT_API_URL}/api/search/images?tag=${tag}`, {
    headers: {
      Authorization: `Bearer ${VAULT_API_KEY}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch gallery");
  }

  const data = await res.json();

  return data;
};
