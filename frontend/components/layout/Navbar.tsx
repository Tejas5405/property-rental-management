'use client';

import { useRouter } from 'next/navigation';
import { LogOut, Menu } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { supabase } from '@/lib/supabaseClient';
import type { Role, User } from '@/lib/types';
import { Sidebar } from './Sidebar';

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function Navbar({ user, role }: { user: User | null; role: Role }) {
  const router = useRouter();

  async function logout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-2">
        {/* Mobile sidebar trigger */}
        <Sheet>
          <SheetTrigger
            render={
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu" />
            }
          >
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <Sidebar role={role} />
          </SheetContent>
        </Sheet>
        <span className="text-sm font-medium capitalize text-muted-foreground">{role} workspace</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium leading-none">{user?.name ?? '—'}</p>
          <p className="text-xs text-muted-foreground">{user?.email ?? ''}</p>
        </div>
        <Avatar className="h-8 w-8">
          <AvatarFallback>{user ? initials(user.name) : '?'}</AvatarFallback>
        </Avatar>
        <Button variant="outline" size="sm" onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" /> Logout
        </Button>
      </div>
    </header>
  );
}
