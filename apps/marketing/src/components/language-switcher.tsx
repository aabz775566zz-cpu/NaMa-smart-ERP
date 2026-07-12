'use client';

import type { Locale } from '@erp-smart/types';
import { localeLabels, locales } from '@erp-smart/i18n';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@erp-smart/ui';
import { Check, Globe } from 'lucide-react';

const LOCALE_COOKIE_NAME = 'erp-smart-locale';

function setLocale(locale: Locale) {
  const oneYear = 60 * 60 * 24 * 365;
  document.cookie = `${LOCALE_COOKIE_NAME}=${locale};path=/;max-age=${oneYear};SameSite=Lax`;
  window.location.reload();
}

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Language">
          <Globe className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((option) => (
          <DropdownMenuItem key={option} onClick={() => option !== locale && setLocale(option)}>
            <span className="flex-1">{localeLabels[option]}</span>
            {option === locale ? <Check className="h-4 w-4 text-primary" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
