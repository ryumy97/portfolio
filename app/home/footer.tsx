import { SubGrid } from "@/components/ui/grid";
import KiwiCanvas from "./kiwi-canvas";

const Footer = () => {
  return (
    <SubGrid asChild>
      <footer className="p-2 h-svh">
        <div className="col-span-full h-full relative border-b border-[#f75d5d]">
          <KiwiCanvas />
        </div>
      </footer>
    </SubGrid>
  );
};

export default Footer;
