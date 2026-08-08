"use client";

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
import { ThemeSwitcher } from "./theme-switcher";

export default function AppNavbar() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const { data: session, status } = useSession();

  const menuItems = [
    {
      label: "Home",
      href: "/",
    },
  ];

  if (status === "authenticated") {
    menuItems.push({
      label: "Profile",
      href: "/profile",
    });
    menuItems.push({
      label: "by game scores",
      href: "/by-game",
    });

    // Hidden while impersonating - the admin area is closed in that state, so
    // linking to it would only ever bounce back to the home page.
    if (session?.user.role === "admin" && !session.impersonation) {
      menuItems.push({
        label: "Admin",
        href: "/admin",
      });
    }
  }

  return (
    <Navbar onMenuOpenChange={setIsMenuOpen}>
      <NavbarContent>
        <NavbarMenuToggle
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          className="sm:hidden"
        />
        <NavbarBrand>
          <Link href="https://boskind.tech">Boskind.tech</Link>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent className="hidden gap-4 sm:flex" justify="center">
        {menuItems.map((item, index) => (
          <NavbarItem key={`${item}-${index}`}>
            {item.label === "Profile" ? (
              <NotificationBadge>
                <Link className="w-full" href={item.href} size="lg">
                  {item.label}
                </Link>
              </NotificationBadge>
            ) : (
              <Link className="w-full" href={item.href} size="lg">
                {item.label}
              </Link>
            )}
          </NavbarItem>
        ))}
        <NavbarItem>
          <ThemeSwitcher />
        </NavbarItem>
        <NavbarItem>
          <AuthButton minimal={false} />
        </NavbarItem>
      </NavbarContent>
      <NavbarMenu>
        <NavbarMenuItem>
          <ThemeSwitcher showLabel />
        </NavbarMenuItem>
        {menuItems.map((item, index) => (
          <NavbarMenuItem key={`${item}-${index}`}>
            {item.label === "Profile" ? (
              <NotificationBadge>
                <Link className="w-full" href={item.href} size="lg">
                  {item.label}
                </Link>
              </NotificationBadge>
            ) : (
              <Link className="w-full" href={item.href} size="lg">
                {item.label}
              </Link>
            )}
          </NavbarMenuItem>
        ))}
        <NavbarMenuItem>
          <AuthButton />
        </NavbarMenuItem>
      </NavbarMenu>
    </Navbar>
  );
}
