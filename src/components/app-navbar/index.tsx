"use client";

import { usePathname } from "next/navigation";
import React from "react";

import {
  Link,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenu,
  NavbarMenuItem,
  NavbarMenuToggle,
} from "@nextui-org/react";
import { useSession } from "next-auth/react";

import { NotificationBadge } from "../friends/notification-badge";
import AuthButton from "./auth-button";
import { CommentNotifications } from "./comment-notifications";
import { ThemeSwitcher } from "./theme-switcher";

type MenuItem = { label: string; href: string };

export default function AppNavbar() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const { data: session, status } = useSession();
  const pathname = usePathname();

  const menuItems: MenuItem[] = [{ label: "Home", href: "/" }];

  if (status === "authenticated") {
    menuItems.push({ label: "By game", href: "/by-game" });
    menuItems.push({ label: "Profile", href: "/profile" });

    // Hidden while impersonating - the admin area is closed in that state, so
    // linking to it would only ever bounce back to the home page.
    if (session?.user.role === "admin" && !session.impersonation) {
      menuItems.push({ label: "Admin", href: "/admin" });
    }
  }

  const renderLink = (item: MenuItem, { block = false } = {}) => {
    const isActive =
      item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

    const link = (
      <Link
        href={item.href}
        size="md"
        className={`${block ? "w-full py-1" : ""} font-medium transition-colors ${
          isActive
            ? "text-foreground"
            : "text-foreground/60 hover:text-foreground"
        }`}
      >
        {item.label}
      </Link>
    );

    return item.label === "Profile" ? (
      <NotificationBadge>{link}</NotificationBadge>
    ) : (
      link
    );
  };

  return (
    <Navbar
      onMenuOpenChange={setIsMenuOpen}
      maxWidth="xl"
      isBordered
      classNames={{
        base: "bg-background/80 backdrop-blur-lg backdrop-saturate-150",
      }}
    >
      <NavbarContent justify="start">
        <NavbarMenuToggle
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          className="sm:hidden"
        />
        <NavbarBrand className="gap-2">
          {/* Score-grid mark: four tiles, the same shape the app is full of. */}
          <span
            aria-hidden
            className="grid shrink-0 grid-cols-2 gap-[2px] rounded-md bg-primary/10 p-1"
          >
            <span className="h-1.5 w-1.5 rounded-[2px] bg-primary" />
            <span className="h-1.5 w-1.5 rounded-[2px] bg-primary/40" />
            <span className="h-1.5 w-1.5 rounded-[2px] bg-primary/40" />
            <span className="h-1.5 w-1.5 rounded-[2px] bg-primary" />
          </span>
          <span className="text-base font-bold tracking-tight">
            Daily Scores
          </span>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent className="hidden gap-6 sm:flex" justify="center">
        {menuItems.map((item) => (
          <NavbarItem key={item.href}>{renderLink(item)}</NavbarItem>
        ))}
      </NavbarContent>

      <NavbarContent justify="end" className="gap-1">
        {status === "authenticated" && (
          <NavbarItem>
            <CommentNotifications />
          </NavbarItem>
        )}
        <NavbarItem>
          <ThemeSwitcher />
        </NavbarItem>
        <NavbarItem>
          <AuthButton minimal={false} />
        </NavbarItem>
      </NavbarContent>

      <NavbarMenu className="gap-1 pt-4">
        {menuItems.map((item) => (
          <NavbarMenuItem key={item.href}>
            {renderLink(item, { block: true })}
          </NavbarMenuItem>
        ))}
        <NavbarMenuItem className="mt-2">
          <ThemeSwitcher showLabel />
        </NavbarMenuItem>
        <NavbarMenuItem className="mt-2">
          <AuthButton />
        </NavbarMenuItem>
      </NavbarMenu>
    </Navbar>
  );
}
