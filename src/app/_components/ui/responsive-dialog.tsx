"use client";

import { createContext, useContext, type ComponentProps } from "react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/_components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/app/_components/ui/drawer";
import { useMediaQuery } from "@/app/_hooks/use-media-query";
import { cn } from "@/app/_lib/utils";

/**
 * shadcn's responsive dialog: a centred Dialog on desktop (768px and up), a
 * bottom-sheet Drawer on phones. Same parts as either, so screens use one API.
 * On desktop the parts take the Drawer's padding, so content lays out the same.
 */
const DesktopContext = createContext(false);
const useDesktop = () => useContext(DesktopContext);

export function ResponsiveDialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  const desktop = useMediaQuery("(min-width: 768px)");
  const Root = desktop ? Dialog : Drawer;
  return (
    <DesktopContext.Provider value={desktop}>
      <Root open={open} onOpenChange={onOpenChange}>
        {children}
      </Root>
    </DesktopContext.Provider>
  );
}

export function ResponsiveDialogContent({ children, ...props }: ComponentProps<"div">) {
  return useDesktop() ? (
    <DialogContent {...props} className={cn("gap-0 p-0 sm:max-w-md", props.className)}>
      {children}
    </DialogContent>
  ) : (
    <DrawerContent
      {...props}
      // a floating sheet: 16px from the screen's edges, rounder, at most max-w-md wide
      className={cn(
        "data-[vaul-drawer-direction=bottom]:inset-x-4 data-[vaul-drawer-direction=bottom]:bottom-4 data-[vaul-drawer-direction=bottom]:mx-auto data-[vaul-drawer-direction=bottom]:max-w-md data-[vaul-drawer-direction=bottom]:rounded-[2rem] data-[vaul-drawer-direction=bottom]:border",
        props.className,
      )}
    >
      {children}
    </DrawerContent>
  );
}

export function ResponsiveDialogHeader(props: ComponentProps<"div">) {
  return useDesktop() ? (
    <DialogHeader {...props} className={cn("p-4 pt-6 pr-12", props.className)} />
  ) : (
    <DrawerHeader {...props} />
  );
}

export function ResponsiveDialogFooter(props: ComponentProps<"div">) {
  return useDesktop() ? (
    <DialogFooter {...props} className={cn("p-4", props.className)} />
  ) : (
    <DrawerFooter {...props} />
  );
}

export function ResponsiveDialogTitle(props: ComponentProps<"h2">) {
  return useDesktop() ? <DialogTitle {...props} /> : <DrawerTitle {...props} />;
}

export function ResponsiveDialogDescription(props: ComponentProps<"p">) {
  return useDesktop() ? <DialogDescription {...props} /> : <DrawerDescription {...props} />;
}

export function ResponsiveDialogClose(props: ComponentProps<typeof DialogClose>) {
  return useDesktop() ? <DialogClose {...props} /> : <DrawerClose {...props} />;
}
