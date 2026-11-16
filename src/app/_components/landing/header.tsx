import Image from "next/image";

import { Button } from "@/app/_components/ui/button";
import { Badge } from "@/app/_components/ui/badge";
import type { Dictionary } from "@/app/[lang]/dictionaries";

export default function Header({ dict }: { dict: Dictionary }) {
  return (
    <header className="bg-neutral-950/80 backdrop-blur fixed w-full z-50">
      <div className="flex p-4 items-center justify-between">
        <div className="flex items-center gap-2">
          <Image src="/KEMA.svg" width={96} height={20} alt="Kema Logo" />
          <Badge>BETA</Badge>
        </div>
        <Button>{dict.header.signIn}</Button>
      </div>
    </header>
  );
}
