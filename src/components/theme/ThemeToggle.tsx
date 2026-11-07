"use client";

import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  THEME_STORAGE_KEY,
  applyTheme,
  parsePreference,
  type ThemePreference,
} from "@/lib/theme";

function readPreference(): ThemePreference {
  try {
    return parsePreference(localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return "system";
  }
}

const OPTIONS: { value: ThemePreference; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Claro", Icon: Sun },
  { value: "dark", label: "Escuro", Icon: Moon },
  { value: "system", label: "Sistema", Icon: Monitor },
];

export function ThemeToggle() {
  // Lido do localStorage só ao abrir o menu (sem efeito), para marcar a escolha ativa.
  const [current, setCurrent] = useState<ThemePreference>("system");

  return (
    <DropdownMenu onOpenChange={(open) => open && setCurrent(readPreference())}>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" aria-label="Tema" />}
      >
        <Sun className="dark:hidden" aria-hidden />
        <Moon className="hidden dark:block" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {OPTIONS.map(({ value, label, Icon }) => (
          <DropdownMenuItem
            key={value}
            aria-current={current === value ? "true" : undefined}
            onClick={() => {
              applyTheme(value);
              setCurrent(value);
            }}
          >
            <Icon aria-hidden />
            {label}
            {current === value && <Check className="ml-auto" aria-hidden />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
