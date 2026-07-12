'use client';

import { localeLabels, locales } from '@erp-smart/i18n';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@erp-smart/ui';
import { Check, Globe } from 'lucide-react';

import { setLocaleCookie, useLocale } from '@/lib/locale/locale-context';

export function LanguageSwitcher() {
  const { locale, messages } = useLocale();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={messages.language.switch}>
          <Globe className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((option) => (
          <DropdownMenuItem key={option} onClick={() => option !== locale && setLocaleCookie(option)}>
            <span className="flex-1">{localeLabels[option]}</span>
            {option === locale ? <Check className="h-4 w-4 text-primary" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
